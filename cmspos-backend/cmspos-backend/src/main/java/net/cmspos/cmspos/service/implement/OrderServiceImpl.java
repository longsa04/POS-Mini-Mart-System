package net.cmspos.cmspos.service.implement;

import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.exception.BadRequestException;
import net.cmspos.cmspos.exception.ResourceNotFoundException;
import net.cmspos.cmspos.model.dto.order.OrderDetailDto;
import net.cmspos.cmspos.model.dto.order.OrderDto;
import net.cmspos.cmspos.model.dto.order.ReceiptResponseDto;
import net.cmspos.cmspos.model.dto.order.ShiftReportDto;
import net.cmspos.cmspos.model.dto.order.ShiftReportUserSummaryDto;
import net.cmspos.cmspos.model.entity.Customer;
import net.cmspos.cmspos.model.entity.Location;
import net.cmspos.cmspos.model.entity.Product;
import net.cmspos.cmspos.model.entity.User;
import net.cmspos.cmspos.model.entity.inventory.Stock;
import net.cmspos.cmspos.model.entity.inventory.StockMovement;
import net.cmspos.cmspos.model.entity.order.Order;
import net.cmspos.cmspos.model.entity.order.OrderDetail;
import net.cmspos.cmspos.model.enums.PaymentStatus;
import net.cmspos.cmspos.model.enums.Shift;
import net.cmspos.cmspos.model.enums.StockMovementType;
import net.cmspos.cmspos.repository.CustomerRepository;
import net.cmspos.cmspos.repository.LocationRepository;
import net.cmspos.cmspos.repository.ProductRepository;
import net.cmspos.cmspos.repository.UserRepository;
import net.cmspos.cmspos.repository.inventory.StockBatchRepository;
import net.cmspos.cmspos.repository.inventory.StockMovementRepository;
import net.cmspos.cmspos.repository.inventory.StockRepository;
import net.cmspos.cmspos.repository.order.OrderRepository;
import net.cmspos.cmspos.service.InventoryService;
import net.cmspos.cmspos.service.OrderService;
import net.cmspos.cmspos.service.ReceiptService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final String ORDER_REFERENCE_PREFIX = "ORDER-";

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final LocationRepository locationRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockBatchRepository stockBatchRepository;
    private final InventoryService inventoryService;
    private final ReceiptService receiptService;

    @Value("${pos.tax.rate:0.12}")
    private double taxRate;

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    @Transactional
    public Order createOrder(OrderDto orderDto) {
        if (orderDto.getOrderDetails() == null || orderDto.getOrderDetails().isEmpty()) {
            throw new BadRequestException("Order must contain at least one order detail");
        }

        User user = userRepository.findById(orderDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + orderDto.getUserId()));

        Location location = locationRepository.findById(orderDto.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + orderDto.getLocationId()));

        Customer customer = null;
        if (orderDto.getCustomerId() != null) {
            customer = customerRepository.findById(orderDto.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + orderDto.getCustomerId()));
        }

        Order order = new Order();
        order.setUser(user);
        order.setCustomer(customer);
        order.setLocation(location);
        order.setOrderDate(Optional.ofNullable(orderDto.getOrderDate()).orElse(LocalDateTime.now()));
        order.setDiscount(Optional.ofNullable(orderDto.getDiscount()).orElse(0.0));
        order.setPaymentStatus(Optional.ofNullable(orderDto.getPaymentStatus()).orElse(PaymentStatus.PENDING));

        List<OrderDetail> details = orderDto.getOrderDetails().stream()
                .map(detailDto -> toEntity(order, detailDto))
                .collect(Collectors.toList());
        order.setOrderDetails(details);

        double subtotal = calculateSubtotal(details);
        double total = round(Math.max(0.0, subtotal - order.getDiscount()));
        order.setTotal(total);

        Order saved = orderRepository.save(order);

        if (saved.getPaymentStatus() == PaymentStatus.PAID) {
            applyInventoryForPayment(saved);
        }

        return saved;
    }

    @Override
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    @Override
    @Transactional
    public Order updatePaymentStatus(Long id, PaymentStatus status) {
        if (status == null) {
            throw new BadRequestException("Payment status cannot be null");
        }

        Order order = getOrderById(id);
        PaymentStatus previousStatus = order.getPaymentStatus();

        if (previousStatus == status) {
            return order;
        }

        if (previousStatus == PaymentStatus.CANCELLED) {
            throw new BadRequestException("Cannot update a cancelled order");
        }

        order.setPaymentStatus(status);
        Order saved = orderRepository.save(order);

        handleInventoryTransition(saved, previousStatus, status);
        return saved;
    }

    @Override
    @Transactional
    public Order deleteOrder(Long id) {
        Order order = getOrderById(id);
        if (order.getPaymentStatus() == PaymentStatus.CANCELLED) {
            return order;
        }
        return updatePaymentStatus(id, PaymentStatus.CANCELLED);
    }

    @Override
    public ReceiptResponseDto generateReceipt(Long orderId) {
        Order order = getOrderById(orderId);
        order.getOrderDetails().size();
        return receiptService.buildReceipt(order);
    }

    @Override
    public ShiftReportDto getShiftReport(Shift shift, LocalDate date) {
        LocalDate targetDate = Optional.ofNullable(date).orElse(LocalDate.now());
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        List<Order> orders = orderRepository.findByUser_ShiftAndOrderDateBetween(shift, start, end);

        double totalSales = orders.stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID)
                .mapToDouble(Order::getTotal)
                .sum();

        long paidOrders = orders.stream().filter(order -> order.getPaymentStatus() == PaymentStatus.PAID).count();
        long pendingOrders = orders.stream().filter(order -> order.getPaymentStatus() == PaymentStatus.PENDING).count();
        long cancelledOrders = orders.stream().filter(order -> order.getPaymentStatus() == PaymentStatus.CANCELLED).count();

        List<ShiftReportUserSummaryDto> cashierSummaries = orders.stream()
                .collect(Collectors.groupingBy(Order::getUser))
                .entrySet()
                .stream()
                .sorted(Comparator.comparing(entry -> entry.getKey().getUsername(), String.CASE_INSENSITIVE_ORDER))
                .map(entry -> {
                    User cashier = entry.getKey();
                    List<Order> cashierOrders = entry.getValue();
                    double cashierTotal = cashierOrders.stream()
                            .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID)
                            .mapToDouble(Order::getTotal)
                            .sum();
                    return ShiftReportUserSummaryDto.builder()
                            .cashierId(cashier.getUserId())
                            .cashierName(cashier.getUsername())
                            .orderCount(cashierOrders.size())
                            .totalSales(round(cashierTotal))
                            .build();
                })
                .collect(Collectors.toList());

        return ShiftReportDto.builder()
                .shift(shift)
                .date(targetDate)
                .totalSales(round(totalSales))
                .totalTax(0.0)
                .completedOrders(paidOrders)
                .pendingOrders(pendingOrders)
                .voidOrders(cancelledOrders)
                .cashierSummaries(cashierSummaries)
                .build();
    }

    private OrderDetail toEntity(Order order, OrderDetailDto dto) {
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + dto.getProductId()));

        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setProduct(product);
        detail.setQuantity(Optional.ofNullable(dto.getQuantity()).orElse(0));
        double unitPrice = Optional.ofNullable(dto.getPrice()).orElse(Optional.ofNullable(product.getPrice()).orElse(0.0));
        detail.setPrice(unitPrice);
        return detail;
    }

    private double calculateSubtotal(List<OrderDetail> details) {
        return details.stream()
                .mapToDouble(detail -> Optional.ofNullable(detail.getPrice()).orElse(0.0)
                        * Optional.ofNullable(detail.getQuantity()).orElse(0))
                .sum();
    }

    private void handleInventoryTransition(Order order, PaymentStatus previousStatus, PaymentStatus currentStatus) {
        if (previousStatus != PaymentStatus.PAID && currentStatus == PaymentStatus.PAID) {
            applyInventoryForPayment(order);
        } else if (previousStatus == PaymentStatus.PAID && currentStatus == PaymentStatus.CANCELLED) {
            restoreInventoryForOrder(order);
        }
    }

    private void applyInventoryForPayment(Order order) {
        ensureOrderDetails(order);

        Map<Long, Stock> stocksToUpdate = new LinkedHashMap<>();
        List<StockMovement> movements = new ArrayList<>();

        for (OrderDetail detail : order.getOrderDetails()) {
            Product product = productRepository.findById(detail.getProduct().getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + detail.getProduct().getProductId()));

            Stock stock = stockRepository.findByProductAndLocation(product, order.getLocation())
                    .orElseThrow(() -> new BadRequestException("No stock record for product " + product.getName()
                            + " at location " + order.getLocation().getName()));

            int quantity = Optional.ofNullable(detail.getQuantity()).orElse(0);
            if (quantity <= 0) {
                continue;
            }

            int currentQuantity = Optional.ofNullable(stock.getQuantity()).orElse(0);
            if (currentQuantity < quantity) {
                throw new BadRequestException("Insufficient stock for product " + product.getName()
                        + " at location " + order.getLocation().getName()
                        + ". Available: " + currentQuantity + ", requested: " + quantity);
            }

            // FIFO: deduct from oldest batches first
            ((InventoryServiceImpl) inventoryService).deductFifoBatches(
                    product.getProductId(), order.getLocation().getLocationId(), quantity);

            stock.setQuantity(currentQuantity - quantity);
            stocksToUpdate.put(stock.getStockId(), stock);

            movements.add(StockMovement.builder()
                    .product(product)
                    .order(order)
                    .location(order.getLocation())
                    .movementType(StockMovementType.SALE)
                    .quantityChange(-quantity)
                    .reference(buildOrderReference(order))
                    .note("Order paid")
                    .build());
        }

        if (!stocksToUpdate.isEmpty()) {
            stockRepository.saveAll(stocksToUpdate.values());
        }
        if (!movements.isEmpty()) {
            stockMovementRepository.saveAll(movements);
        }
    }

    private void restoreInventoryForOrder(Order order) {
        ensureOrderDetails(order);

        Map<Long, Stock> stocksToUpdate = new LinkedHashMap<>();
        List<StockMovement> reversals = new ArrayList<>();

        for (OrderDetail detail : order.getOrderDetails()) {
            Product product = productRepository.findById(detail.getProduct().getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + detail.getProduct().getProductId()));

            Stock stock = stockRepository.findByProductAndLocation(product, order.getLocation())
                    .orElseGet(() -> Stock.builder()
                            .product(product)
                            .location(order.getLocation())
                            .quantity(0)
                            .build());

            int quantity = Optional.ofNullable(detail.getQuantity()).orElse(0);
            if (quantity <= 0) {
                continue;
            }

            // FIFO restore: put stock back into the most recent batch
            ((InventoryServiceImpl) inventoryService).restoreToLatestBatch(
                    product.getProductId(), order.getLocation().getLocationId(), quantity);

            int currentQuantity = Optional.ofNullable(stock.getQuantity()).orElse(0);
            stock.setQuantity(currentQuantity + quantity);

            if (stock.getStockId() != null) {
                stocksToUpdate.put(stock.getStockId(), stock);
            } else {
                Stock savedStock = stockRepository.save(stock);
                stocksToUpdate.put(savedStock.getStockId(), savedStock);
            }

            reversals.add(StockMovement.builder()
                    .product(product)
                    .order(order)
                    .location(order.getLocation())
                    .movementType(StockMovementType.RETURN)
                    .quantityChange(quantity)
                    .reference(buildOrderReference(order))
                    .note("Order cancelled")
                    .build());
        }

        if (!stocksToUpdate.isEmpty()) {
            stockRepository.saveAll(stocksToUpdate.values());
        }
        if (!reversals.isEmpty()) {
            stockMovementRepository.saveAll(reversals);
        }
    }

    private void ensureOrderDetails(Order order) {
        order.getOrderDetails().forEach(detail -> {
            if (detail.getProduct() == null) {
                throw new BadRequestException("Order detail is missing product information");
            }
        });
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private String buildOrderReference(Order order) {
        return ORDER_REFERENCE_PREFIX + order.getOrderId();
    }
}

