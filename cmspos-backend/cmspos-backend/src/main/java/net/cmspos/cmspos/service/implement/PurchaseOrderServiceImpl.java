package net.cmspos.cmspos.service.implement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.exception.BadRequestException;
import net.cmspos.cmspos.exception.ResourceNotFoundException;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderDetailDto;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderDto;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderLineResponseDto;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderReceiveLineDto;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderReceiveRequest;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderResponseDto;
import net.cmspos.cmspos.model.dto.purchase.SimpleReferenceDto;
import net.cmspos.cmspos.model.entity.Location;
import net.cmspos.cmspos.model.entity.Product;
import net.cmspos.cmspos.model.entity.ProductSupplier;
import net.cmspos.cmspos.model.entity.Supplier;
import net.cmspos.cmspos.model.entity.inventory.Stock;
import net.cmspos.cmspos.model.entity.inventory.StockMovement;
import net.cmspos.cmspos.model.entity.purchase.PurchaseOrder;
import net.cmspos.cmspos.model.entity.purchase.PurchaseOrderDetail;
import net.cmspos.cmspos.model.enums.PurchaseOrderStatus;
import net.cmspos.cmspos.model.enums.StockMovementType;
import net.cmspos.cmspos.repository.LocationRepository;
import net.cmspos.cmspos.repository.ProductRepository;
import net.cmspos.cmspos.repository.ProductSupplierRepository;
import net.cmspos.cmspos.repository.SupplierRepository;
import net.cmspos.cmspos.repository.inventory.StockBatchRepository;
import net.cmspos.cmspos.repository.inventory.StockMovementRepository;
import net.cmspos.cmspos.repository.inventory.StockRepository;
import net.cmspos.cmspos.repository.purchase.PurchaseOrderRepository;
import net.cmspos.cmspos.service.InventoryService;
import net.cmspos.cmspos.service.PurchaseOrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private static final String PURCHASE_REFERENCE_PREFIX = "PO-";

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final ProductRepository productRepository;
    private final ProductSupplierRepository productSupplierRepository;
    private final StockRepository stockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockBatchRepository stockBatchRepository;
    private final InventoryService inventoryService;

    @Override
    @Transactional
    public PurchaseOrderResponseDto createPurchaseOrder(PurchaseOrderDto purchaseOrderDto) {
        if (purchaseOrderDto.getDetails() == null || purchaseOrderDto.getDetails().isEmpty()) {
            throw new BadRequestException("Purchase order must include at least one item");
        }

        Location location = locationRepository.findById(purchaseOrderDto.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + purchaseOrderDto.getLocationId()));

        if (purchaseOrderDto.getSupplierId() == null) {
            throw new BadRequestException("Supplier id is required for purchase orders");
        }

        Supplier supplier = supplierRepository.findById(purchaseOrderDto.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + purchaseOrderDto.getSupplierId()));

        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setSupplier(supplier);
        purchaseOrder.setLocation(location);
        purchaseOrder.setOrderDate(Optional.ofNullable(purchaseOrderDto.getOrderDate()).orElse(LocalDateTime.now()));
        purchaseOrder.setStatus(PurchaseOrderStatus.OPEN);

        List<PurchaseOrderDetail> details = new ArrayList<>();
        for (PurchaseOrderDetailDto detailDto : purchaseOrderDto.getDetails()) {
            PurchaseOrderDetail detail = toEntity(purchaseOrder, detailDto);
            details.add(detail);
        }
        purchaseOrder.setDetails(details);

        double calculatedTotal = details.stream()
                .mapToDouble(detail -> Optional.ofNullable(detail.getPrice()).orElse(0.0)
                        * Optional.ofNullable(detail.getQuantity()).orElse(0))
                .sum();
        purchaseOrder.setTotal(Optional.ofNullable(purchaseOrderDto.getTotal()).orElse(calculatedTotal));

        PurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderResponseDto getPurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findByPurchaseOrderId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        return toResponse(purchaseOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderResponseDto> getPurchaseOrders(LocalDate startDate, LocalDate endDate) {
        LocalDate effectiveEnd = Optional.ofNullable(endDate).orElse(LocalDate.now());
        LocalDate effectiveStart = Optional.ofNullable(startDate).orElse(effectiveEnd.minusMonths(1));

        LocalDateTime start = effectiveStart.atStartOfDay();
        LocalDateTime end = effectiveEnd.plusDays(1).atStartOfDay();
        return purchaseOrderRepository.findByOrderDateBetween(start, end).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PurchaseOrderResponseDto receivePurchaseOrder(Long id, PurchaseOrderReceiveRequest request) {
        if (request == null || request.getLines() == null || request.getLines().isEmpty()) {
            throw new BadRequestException("Receive request must include at least one line");
        }

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findByPurchaseOrderId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));

        PurchaseOrderStatus status = Optional.ofNullable(purchaseOrder.getStatus()).orElse(PurchaseOrderStatus.OPEN);
        if (status == PurchaseOrderStatus.CANCELLED) {
            throw new BadRequestException("Cancelled purchase orders cannot be received");
        }
        if (status == PurchaseOrderStatus.RECEIVED) {
            throw new BadRequestException("Purchase order is already fully received");
        }

        Location location = purchaseOrder.getLocation();
        if (location == null) {
            throw new BadRequestException("Purchase order must have a location before receiving items");
        }

        List<PurchaseOrderDetail> details = Optional.ofNullable(purchaseOrder.getDetails())
                .orElse(Collections.emptyList());
        Set<Long> detailIds = details.stream()
                .map(PurchaseOrderDetail::getPurchaseOrderDetailId)
                .filter(idValue -> idValue != null)
                .collect(Collectors.toSet());

        for (PurchaseOrderReceiveLineDto line : request.getLines()) {
            if (line.getDetailId() == null || !detailIds.contains(line.getDetailId())) {
                throw new BadRequestException("Invalid purchase order detail id: " + line.getDetailId());
            }
        }

        boolean anyReceived = false;
        for (PurchaseOrderReceiveLineDto line : request.getLines()) {
            int receiveQty = Optional.ofNullable(line.getReceivedQty()).orElse(0);
            if (receiveQty <= 0) {
                continue;
            }

            PurchaseOrderDetail detail = details.stream()
                    .filter(item -> line.getDetailId().equals(item.getPurchaseOrderDetailId()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Purchase order line not found: " + line.getDetailId()));

            int orderedQty = Optional.ofNullable(detail.getQuantity()).orElse(0);
            int receivedQty = Optional.ofNullable(detail.getReceivedQty()).orElse(0);
            if (receivedQty > orderedQty) {
                throw new BadRequestException("Purchase order line already exceeds ordered quantity for line " + line.getDetailId());
            }
            int remaining = orderedQty - receivedQty;
            if (remaining <= 0) {
                continue;
            }
            if (receiveQty > remaining) {
                throw new BadRequestException("Receive quantity exceeds remaining quantity for line " + line.getDetailId());
            }

            detail.setReceivedQty(receivedQty + receiveQty);
            anyReceived = true;

            Product product = detail.getProduct();
            if (product == null) {
                throw new BadRequestException("Purchase order detail missing product information");
            }

            Stock stock = stockRepository.findByProductAndLocation(product, location)
                    .orElseGet(() -> Stock.builder()
                            .product(product)
                            .location(location)
                            .quantity(0)
                            .build());

            int newQuantity = Optional.ofNullable(stock.getQuantity()).orElse(0) + receiveQty;
            stock.setQuantity(newQuantity);
            stockRepository.save(stock);

            // FIFO: create a new batch for this receipt so stock can be deducted oldest-first on sale
            BigDecimal unitCost = detail.getPrice() != null
                    ? BigDecimal.valueOf(detail.getPrice())
                    : (product.getCostPrice() != null ? BigDecimal.valueOf(product.getCostPrice()) : null);
            java.time.LocalDate expiryDate = line.getExpiryDate();
            ((InventoryServiceImpl) inventoryService).createBatch(
                    product, location, purchaseOrder.getSupplier(), purchaseOrder,
                    receiveQty, unitCost, expiryDate);

            String supplierLabel = purchaseOrder.getSupplier() != null ? purchaseOrder.getSupplier().getName() : "supplier";
            stockMovementRepository.save(StockMovement.builder()
                    .product(product)
                    .location(location)
                    .purchaseOrder(purchaseOrder)
                    .supplier(purchaseOrder.getSupplier())
                    .movementType(StockMovementType.RECEIVE)
                    .quantityChange(receiveQty)
                    .reference(buildPurchaseReference(purchaseOrder))
                    .note(String.format(Locale.ENGLISH, "Received PO %d from %s", purchaseOrder.getPurchaseOrderId(), supplierLabel))
                    .build());
        }

        if (!anyReceived) {
            throw new BadRequestException("No receivable quantities provided");
        }

        boolean fullyReceived = details.stream()
                .allMatch(detail -> Optional.ofNullable(detail.getReceivedQty()).orElse(0)
                        >= Optional.ofNullable(detail.getQuantity()).orElse(0));

        purchaseOrder.setStatus(fullyReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIAL);
        purchaseOrder.setReceivedAt(LocalDateTime.now());

        return toResponse(purchaseOrder);
    }

    @Override
    @Transactional
    public PurchaseOrderResponseDto cancelPurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findByPurchaseOrderId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));

        PurchaseOrderStatus status = Optional.ofNullable(purchaseOrder.getStatus()).orElse(PurchaseOrderStatus.OPEN);
        if (status == PurchaseOrderStatus.RECEIVED) {
            throw new BadRequestException("Cannot cancel a fully received purchase order");
        }
        if (status == PurchaseOrderStatus.CANCELLED) {
            throw new BadRequestException("Purchase order is already cancelled");
        }
        if (status == PurchaseOrderStatus.PARTIAL) {
            throw new BadRequestException("Cannot cancel a partially received purchase order — stock has already been received");
        }

        purchaseOrder.setStatus(PurchaseOrderStatus.CANCELLED);
        return toResponse(purchaseOrder);
    }

    private PurchaseOrderDetail toEntity(PurchaseOrder purchaseOrder, PurchaseOrderDetailDto dto) {
        Supplier supplier = purchaseOrder.getSupplier();
        if (supplier == null || supplier.getSupplierId() == null) {
            throw new BadRequestException("Purchase order must include a supplier before adding items");
        }

        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + dto.getProductId()));

        ProductSupplier mapping = productSupplierRepository
                .findByProduct_ProductIdAndSupplier_SupplierId(product.getProductId(), supplier.getSupplierId())
                .orElseThrow(() -> new BadRequestException("Supplier " + supplier.getName()
                        + " does not supply product " + product.getName()));

        PurchaseOrderDetail detail = new PurchaseOrderDetail();
        detail.setPurchaseOrder(purchaseOrder);
        detail.setProduct(product);
        detail.setQuantity(Optional.ofNullable(dto.getQuantity()).orElse(0));
        detail.setReceivedQty(0);
        detail.setPrice(Optional.ofNullable(dto.getPrice())
                .orElse(Optional.ofNullable(mapping.getCostPrice())
                        .orElse(Optional.ofNullable(product.getCostPrice()).orElse(0.0))));
        return detail;
    }

    private String buildPurchaseReference(PurchaseOrder purchaseOrder) {
        return PURCHASE_REFERENCE_PREFIX + purchaseOrder.getPurchaseOrderId();
    }

    private PurchaseOrderResponseDto toResponse(PurchaseOrder purchaseOrder) {
        List<PurchaseOrderDetail> detailEntities = Optional.ofNullable(purchaseOrder.getDetails())
                .orElse(Collections.emptyList());

        return PurchaseOrderResponseDto.builder()
                .poId(purchaseOrder.getPurchaseOrderId())
                .total(Optional.ofNullable(purchaseOrder.getTotal()).orElse(0.0))
                .orderDate(purchaseOrder.getOrderDate())
                .status(purchaseOrder.getStatus())
                .receivedAt(purchaseOrder.getReceivedAt())
                .supplier(toReference(purchaseOrder.getSupplier(), Supplier::getSupplierId, Supplier::getName))
                .location(toReference(purchaseOrder.getLocation(), Location::getLocationId, Location::getName))
                .details(detailEntities.stream()
                        .map(this::toDetailResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    private PurchaseOrderLineResponseDto toDetailResponse(PurchaseOrderDetail detail) {
        return PurchaseOrderLineResponseDto.builder()
                .id(detail.getPurchaseOrderDetailId())
                .quantity(Optional.ofNullable(detail.getQuantity()).orElse(0))
                .receivedQty(Optional.ofNullable(detail.getReceivedQty()).orElse(0))
                .price(Optional.ofNullable(detail.getPrice()).orElse(0.0))
                .product(toReference(detail.getProduct(), Product::getProductId, Product::getName))
                .build();
    }

    private <T> SimpleReferenceDto toReference(T source, Function<T, Long> idExtractor, Function<T, String> nameExtractor) {
        if (source == null) {
            return null;
        }
        return SimpleReferenceDto.builder()
                .id(idExtractor.apply(source))
                .name(nameExtractor.apply(source))
                .build();
    }
}
