package net.cmspos.cmspos.service.implement;

import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.exception.BadRequestException;
import net.cmspos.cmspos.exception.ResourceNotFoundException;
import net.cmspos.cmspos.model.dto.inventory.InventoryAdjustmentRequest;
import net.cmspos.cmspos.model.dto.inventory.StockBatchDto;
import net.cmspos.cmspos.model.dto.inventory.StockLevelDto;
import net.cmspos.cmspos.model.dto.inventory.StockMovementDto;
import net.cmspos.cmspos.model.dto.inventory.SupplierTrafficDto;
import net.cmspos.cmspos.model.entity.Location;
import net.cmspos.cmspos.model.entity.Product;
import net.cmspos.cmspos.model.entity.Supplier;
import net.cmspos.cmspos.model.entity.inventory.Stock;
import net.cmspos.cmspos.model.entity.inventory.StockBatch;
import net.cmspos.cmspos.model.entity.inventory.StockMovement;
import net.cmspos.cmspos.model.enums.StockMovementType;
import net.cmspos.cmspos.repository.LocationRepository;
import net.cmspos.cmspos.repository.ProductRepository;
import net.cmspos.cmspos.repository.ProductSupplierRepository;
import net.cmspos.cmspos.repository.SupplierRepository;
import net.cmspos.cmspos.repository.inventory.StockBatchRepository;
import net.cmspos.cmspos.repository.inventory.StockMovementRepository;
import net.cmspos.cmspos.repository.inventory.StockRepository;
import net.cmspos.cmspos.service.InventoryService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final SupplierRepository supplierRepository;
    private final ProductSupplierRepository productSupplierRepository;
    private final StockRepository stockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockBatchRepository stockBatchRepository;

    @Override
    @Transactional
    public StockMovementDto adjustStock(InventoryAdjustmentRequest request) {
        if (request.getLocationId() == null) {
            throw new BadRequestException("Location id is required for stock adjustments");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product with id " + request.getProductId() + " not found"));

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Location with id " + request.getLocationId() + " not found"));

        int quantity = Optional.ofNullable(request.getQuantity()).orElse(0);
        if (quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }

        StockMovementType movementType = Optional.ofNullable(request.getMovementType())
                .orElse(StockMovementType.ADJUSTMENT);

        Supplier supplier = null;
        if (movementType == StockMovementType.RECEIVE || movementType == StockMovementType.PURCHASE) {
            if (request.getSupplierId() == null) {
                throw new BadRequestException("Supplier id is required for stock receipts");
            }
            Supplier resolvedSupplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier with id " + request.getSupplierId() + " not found"));

            productSupplierRepository
                    .findByProduct_ProductIdAndSupplier_SupplierId(product.getProductId(), resolvedSupplier.getSupplierId())
                    .orElseThrow(() -> new BadRequestException("Supplier " + resolvedSupplier.getName()
                            + " does not supply product " + product.getName()));
            supplier = resolvedSupplier;
        }

        // Fetch or create the aggregate Stock row
        Stock stock = stockRepository.findByProductAndLocation(product, location)
                .orElseGet(() -> Stock.builder()
                        .product(product)
                        .location(location)
                        .quantity(0)
                        .build());

        int currentQuantity = Optional.ofNullable(stock.getQuantity()).orElse(0);
        int updatedQuantity;

        if (isInboundMovement(movementType)) {
            // ── INBOUND: RECEIVE, PURCHASE, RETURN, ADJUSTMENT ──────────────────
            // Create a new StockBatch so FIFO ordering is preserved
            BigDecimal unitCost = request.getUnitCost();
            if (unitCost == null && product.getCostPrice() != null) {
                unitCost = BigDecimal.valueOf(product.getCostPrice());
            }

            StockBatch batch = StockBatch.builder()
                    .product(product)
                    .location(location)
                    .supplier(supplier)
                    .quantityReceived(quantity)
                    .quantityRemaining(quantity)
                    .unitCost(unitCost)
                    .receivedDate(LocalDate.now())
                    .expiryDate(request.getExpiryDate())
                    .build();
            stockBatchRepository.save(batch);

            updatedQuantity = currentQuantity + quantity;

        } else {
            // ── OUTBOUND: SALE, TRANSFER ────────────────────────────────────────
            // Deduct from batches in FIFO order (oldest receivedDate first)
            if (currentQuantity < quantity) {
                throw new BadRequestException("Insufficient stock for product " + product.getName()
                        + " at location " + location.getName()
                        + ". Available: " + currentQuantity + ", requested: " + quantity);
            }
            deductFifoBatches(product.getProductId(), location.getLocationId(), quantity);
            updatedQuantity = currentQuantity - quantity;
        }

        stock.setQuantity(updatedQuantity);
        stockRepository.save(stock);

        String note = request.getNote();
        if ((movementType == StockMovementType.RECEIVE || movementType == StockMovementType.PURCHASE)
                && supplier != null
                && (note == null || note.isBlank())) {
            note = "Received from " + supplier.getName();
        }

        StockMovement movement = StockMovement.builder()
                .product(product)
                .location(location)
                .supplier(supplier)
                .movementType(movementType)
                .quantityChange(resolveQuantityChange(movementType, quantity))
                .reference(request.getReference())
                .note(note)
                .build();

        StockMovement saved = stockMovementRepository.save(movement);
        return toDto(saved, updatedQuantity);
    }

    @Override
    public List<StockMovementDto> getMovements(Long productId, LocalDate startDate, LocalDate endDate) {
        LocalDate effectiveEnd = Optional.ofNullable(endDate).orElse(LocalDate.now());
        LocalDate effectiveStart = Optional.ofNullable(startDate).orElse(effectiveEnd.minusDays(30));
        if (effectiveEnd.isBefore(effectiveStart)) {
            throw new BadRequestException("End date cannot be before start date");
        }

        LocalDateTime start = effectiveStart.atStartOfDay();
        LocalDateTime end = effectiveEnd.plusDays(1).atStartOfDay();

        List<StockMovement> movements;
        if (productId != null) {
            movements = stockMovementRepository
                    .findByProduct_ProductIdAndCreatedAtBetweenOrderByCreatedAtDesc(productId, start, end);
        } else {
            movements = stockMovementRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
        }

        return movements.stream()
                .map(movement -> toDto(movement, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockLevelDto> getStockLevels(Long productId, Long locationId) {
        if (locationId != null) {
            Location location = locationRepository.findById(locationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Location with id " + locationId + " not found"));

            List<Product> productScope;
            if (productId != null) {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new ResourceNotFoundException("Product with id " + productId + " not found"));
                productScope = List.of(product);
            } else {
                productScope = productRepository.findAll();
            }

            List<Stock> stocksAtLocation = stockRepository.findByLocation_LocationId(locationId);
            Map<Long, Stock> stockByProduct = stocksAtLocation.stream()
                    .filter(stock -> stock.getProduct() != null)
                    .collect(Collectors.toMap(stock -> stock.getProduct().getProductId(), Function.identity(), (existing, replacement) -> replacement));

            return productScope.stream()
                    .map(product -> toStockLevelDto(product, location, stockByProduct.get(product.getProductId())))
                    .collect(Collectors.toList());
        }

        List<Stock> stocks;
        if (productId != null) {
            stocks = stockRepository.findByProduct_ProductId(productId);
            if (stocks.isEmpty()) {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new ResourceNotFoundException("Product with id " + productId + " not found"));
                return List.of(toStockLevelDto(product, null, null));
            }
        } else {
            stocks = stockRepository.findAll();
        }

        return stocks.stream()
                .map(this::toStockLevelDto)
                .collect(Collectors.toList());
    }

    // ── FIFO helpers (package-visible so OrderServiceImpl and PurchaseOrderServiceImpl can call them) ──

    /**
     * Deducts {@code quantity} units from the FIFO batch queue for the given product/location.
     * Batches are consumed oldest-first. Caller must verify sufficient stock before calling.
     */
    void deductFifoBatches(Long productId, Long locationId, int quantity) {
        List<StockBatch> batches = stockBatchRepository.findFifoBatches(productId, locationId);
        int remaining = quantity;
        for (StockBatch batch : batches) {
            if (remaining <= 0) break;
            int take = Math.min(batch.getQuantityRemaining(), remaining);
            batch.setQuantityRemaining(batch.getQuantityRemaining() - take);
            remaining -= take;
        }
        stockBatchRepository.saveAll(batches);
    }

    /**
     * Creates a new StockBatch for an inbound receipt (PO receive, manual receive, return).
     */
    StockBatch createBatch(Product product, Location location, Supplier supplier,
                           net.cmspos.cmspos.model.entity.purchase.PurchaseOrder purchaseOrder,
                           int quantity, BigDecimal unitCost, LocalDate expiryDate) {
        return stockBatchRepository.save(StockBatch.builder()
                .product(product)
                .location(location)
                .supplier(supplier)
                .purchaseOrder(purchaseOrder)
                .quantityReceived(quantity)
                .quantityRemaining(quantity)
                .unitCost(unitCost)
                .receivedDate(LocalDate.now())
                .expiryDate(expiryDate)
                .build());
    }

    /**
     * Restores stock to the most recent batch when an order is cancelled.
     * If no batch exists (edge case: stock was received before FIFO was introduced),
     * a new return batch is created.
     */
    void restoreToLatestBatch(Long productId, Long locationId, int quantity) {
        List<StockBatch> latest = stockBatchRepository.findLatestBatches(productId, locationId);
        if (!latest.isEmpty()) {
            StockBatch batch = latest.get(0);
            // Restore up to original received quantity; overflow goes into a new batch
            int canRestore = batch.getQuantityReceived() - batch.getQuantityRemaining();
            int restoreHere = Math.min(canRestore, quantity);
            if (restoreHere > 0) {
                batch.setQuantityRemaining(batch.getQuantityRemaining() + restoreHere);
                stockBatchRepository.save(batch);
                quantity -= restoreHere;
            }
        }
        // Any remaining quantity that couldn't be put back goes into a new batch (return batch)
        if (quantity > 0) {
            StockBatch returnBatch = StockBatch.builder()
                    .product(latest.isEmpty() ? null : latest.get(0).getProduct())
                    .location(latest.isEmpty() ? null : latest.get(0).getLocation())
                    .quantityReceived(quantity)
                    .quantityRemaining(quantity)
                    .receivedDate(LocalDate.now())
                    .build();
            // Only save if we have enough info; caller can pass entities directly for that case
            if (returnBatch.getProduct() != null) {
                stockBatchRepository.save(returnBatch);
            }
        }
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private boolean isInboundMovement(StockMovementType type) {
        return switch (type) {
            case RECEIVE, PURCHASE, RETURN, ADJUSTMENT -> true;
            case SALE, TRANSFER, WRITE_OFF -> false;
        };
    }

    private int resolveQuantityChange(StockMovementType movementType, int quantity) {
        return switch (movementType) {
            case SALE, TRANSFER, WRITE_OFF -> -quantity;
            case RETURN, RECEIVE, ADJUSTMENT, PURCHASE -> quantity;
        };
    }

    private StockLevelDto toStockLevelDto(Product product, Location overrideLocation, Stock stock) {
        Product resolvedProduct = product != null ? product : (stock != null ? stock.getProduct() : null);
        Location resolvedLocation = overrideLocation != null ? overrideLocation : (stock != null ? stock.getLocation() : null);
        Long locId = resolvedLocation != null ? resolvedLocation.getLocationId() : null;
        Long prodId = resolvedProduct != null ? resolvedProduct.getProductId() : null;

        return StockLevelDto.builder()
                .stockId(stock != null ? stock.getStockId() : null)
                .productId(prodId)
                .productName(resolvedProduct != null ? resolvedProduct.getName() : null)
                .sku(resolvedProduct != null ? resolvedProduct.getSku() : null)
                .categoryName(resolvedProduct != null && resolvedProduct.getCategory() != null
                        ? resolvedProduct.getCategory().getName()
                        : null)
                .locationId(locId)
                .locationName(resolvedLocation != null ? resolvedLocation.getName() : null)
                .quantity(stock != null ? Optional.ofNullable(stock.getQuantity()).orElse(0) : 0)
                .lastUpdated(stock != null ? stock.getLastUpdated() : null)
                .supplierTraffic(buildSupplierTraffic(prodId, locId))
                .batches(buildBatchList(prodId, locId))
                .build();
    }

    private StockLevelDto toStockLevelDto(Stock stock) {
        Product product = stock.getProduct();
        Location location = stock.getLocation();
        Long locId = location != null ? location.getLocationId() : null;
        Long prodId = product != null ? product.getProductId() : null;

        return StockLevelDto.builder()
                .stockId(stock.getStockId())
                .productId(prodId)
                .productName(product != null ? product.getName() : null)
                .sku(product != null ? product.getSku() : null)
                .categoryName(product != null && product.getCategory() != null ? product.getCategory().getName() : null)
                .locationId(locId)
                .locationName(location != null ? location.getName() : null)
                .quantity(Optional.ofNullable(stock.getQuantity()).orElse(0))
                .lastUpdated(stock.getLastUpdated())
                .supplierTraffic(buildSupplierTraffic(prodId, locId))
                .batches(buildBatchList(prodId, locId))
                .build();
    }

    private List<StockBatchDto> buildBatchList(Long productId, Long locationId) {
        if (productId == null || locationId == null) {
            return List.of();
        }
        return stockBatchRepository.findAllByProductAndLocation(productId, locationId)
                .stream()
                .map(batch -> StockBatchDto.builder()
                        .batchId(batch.getBatchId())
                        .supplierId(batch.getSupplier() != null ? batch.getSupplier().getSupplierId() : null)
                        .supplierName(batch.getSupplier() != null ? batch.getSupplier().getName() : null)
                        .purchaseOrderId(batch.getPurchaseOrder() != null ? batch.getPurchaseOrder().getPurchaseOrderId() : null)
                        .quantityReceived(batch.getQuantityReceived())
                        .quantityRemaining(batch.getQuantityRemaining())
                        .unitCost(batch.getUnitCost())
                        .receivedDate(batch.getReceivedDate())
                        .expiryDate(batch.getExpiryDate())
                        .createdAt(batch.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private StockMovementDto toDto(StockMovement movement, Integer resultingQuantity) {
        Supplier movementSupplier = movement.getSupplier();
        if (movementSupplier == null && movement.getPurchaseOrder() != null) {
            movementSupplier = movement.getPurchaseOrder().getSupplier();
        }

        return StockMovementDto.builder()
                .movementId(movement.getStockMovementId())
                .productId(movement.getProduct() != null ? movement.getProduct().getProductId() : null)
                .productName(movement.getProduct() != null ? movement.getProduct().getName() : null)
                .locationId(movement.getLocation() != null ? movement.getLocation().getLocationId() : null)
                .locationName(movement.getLocation() != null ? movement.getLocation().getName() : null)
                .poId(movement.getPurchaseOrder() != null ? movement.getPurchaseOrder().getPurchaseOrderId() : null)
                .supplierId(movementSupplier != null ? movementSupplier.getSupplierId() : null)
                .supplierName(movementSupplier != null ? movementSupplier.getName() : null)
                .movementType(movement.getMovementType())
                .quantityChange(movement.getQuantityChange())
                .reference(movement.getReference())
                .note(movement.getNote())
                .createdAt(movement.getCreatedAt())
                .resultingQuantity(resultingQuantity)
                .build();
    }

    private List<SupplierTrafficDto> buildSupplierTraffic(Long productId, Long locationId) {
        if (productId == null) {
            return List.of();
        }

        List<StockMovementType> movementTypes = List.of(StockMovementType.RECEIVE, StockMovementType.PURCHASE);
        List<StockMovement> movements = locationId != null
                ? stockMovementRepository.findByProduct_ProductIdAndLocation_LocationIdAndMovementTypeIn(productId, locationId, movementTypes)
                : stockMovementRepository.findByProduct_ProductIdAndMovementTypeIn(productId, movementTypes);

        if (movements.isEmpty()) {
            return List.of();
        }

        Map<Long, SupplierTrafficDto> traffic = movements.stream()
                .map(movement -> {
                    Supplier movementSupplier = movement.getSupplier();
                    if (movementSupplier == null && movement.getPurchaseOrder() != null) {
                        movementSupplier = movement.getPurchaseOrder().getSupplier();
                    }
                    if (movementSupplier == null) {
                        return null;
                    }
                    return SupplierTrafficDto.builder()
                            .supplierId(movementSupplier.getSupplierId())
                            .supplierName(movementSupplier.getName())
                            .receivedQty(Optional.ofNullable(movement.getQuantityChange()).orElse(0))
                            .build();
                })
                .filter(dto -> dto != null && dto.getSupplierId() != null)
                .collect(Collectors.toMap(
                        SupplierTrafficDto::getSupplierId,
                        dto -> dto,
                        (existing, incoming) -> {
                            existing.setReceivedQty(existing.getReceivedQty() + incoming.getReceivedQty());
                            return existing;
                        }
                ));

        return traffic.values().stream()
                .sorted((left, right) -> Integer.compare(
                        Optional.ofNullable(right.getReceivedQty()).orElse(0),
                        Optional.ofNullable(left.getReceivedQty()).orElse(0)))
                .collect(Collectors.toList());
    }
}
