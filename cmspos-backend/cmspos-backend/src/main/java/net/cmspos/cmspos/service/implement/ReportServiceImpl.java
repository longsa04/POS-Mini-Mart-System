package net.cmspos.cmspos.service.implement;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.exception.BadRequestException;
import net.cmspos.cmspos.model.dto.report.CategoryMixDto;
import net.cmspos.cmspos.model.dto.report.DashboardDailySalesDto;
import net.cmspos.cmspos.model.dto.report.DashboardReportDto;
import net.cmspos.cmspos.model.dto.report.DailySalesSummaryDto;
import net.cmspos.cmspos.model.dto.report.InventoryItemDto;
import net.cmspos.cmspos.model.dto.report.InventoryReportDto;
import net.cmspos.cmspos.model.dto.report.ExpenseSummaryDto;
import net.cmspos.cmspos.model.dto.report.LowStockAlertDto;
import net.cmspos.cmspos.model.dto.report.PeakHourSummaryDto;
import net.cmspos.cmspos.model.dto.report.ProfitLossProductDto;
import net.cmspos.cmspos.model.dto.report.ProfitLossReportDto;
import net.cmspos.cmspos.model.dto.report.SupplierPurchaseSummaryDto;
import net.cmspos.cmspos.model.dto.report.RecentOrderSummaryDto;
import net.cmspos.cmspos.model.dto.report.SalesSummaryReportDto;
import net.cmspos.cmspos.model.dto.report.StatusBreakdownDto;
import net.cmspos.cmspos.model.dto.report.TopProductSalesDto;
import net.cmspos.cmspos.model.entity.Customer;
import net.cmspos.cmspos.model.entity.Expense;
import net.cmspos.cmspos.model.entity.Product;
import net.cmspos.cmspos.model.entity.ProductSupplier;
import net.cmspos.cmspos.model.entity.inventory.Stock;
import net.cmspos.cmspos.model.entity.order.Order;
import net.cmspos.cmspos.model.entity.order.OrderDetail;
import net.cmspos.cmspos.model.entity.purchase.PurchaseOrder;
import net.cmspos.cmspos.model.entity.purchase.PurchaseOrderDetail;
import net.cmspos.cmspos.model.enums.ExpenseCategory;
import net.cmspos.cmspos.model.enums.PaymentStatus;
import net.cmspos.cmspos.repository.CustomerRepository;
import net.cmspos.cmspos.repository.ExpenseRepository;
import net.cmspos.cmspos.repository.ProductRepository;
import net.cmspos.cmspos.repository.ProductSupplierRepository;
import net.cmspos.cmspos.repository.inventory.StockRepository;
import net.cmspos.cmspos.repository.order.OrderDetailRepository;
import net.cmspos.cmspos.repository.order.OrderRepository;
import net.cmspos.cmspos.repository.purchase.PurchaseOrderRepository;
import net.cmspos.cmspos.service.ReportService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final int DEFAULT_TOP_PRODUCT_LIMIT = 5;

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;
    private final CustomerRepository customerRepository;
    private final ExpenseRepository expenseRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductSupplierRepository productSupplierRepository;

    @Override
    public DashboardReportDto getDashboardReport(Long locationId) {
        LocalDate today = LocalDate.now();
        LocalDate sevenDayStart = today.minusDays(6);
        LocalDateTime rangeStart = sevenDayStart.atStartOfDay();
        LocalDateTime rangeEnd = today.plusDays(1).atStartOfDay();

        List<Order> orders = getOrdersInRange(rangeStart, rangeEnd, locationId);
        List<Order> paidOrders = orders.stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID)
                .toList();

        Map<LocalDate, Double> paidRevenueByDay = new LinkedHashMap<>();
        for (LocalDate cursor = sevenDayStart; !cursor.isAfter(today); cursor = cursor.plusDays(1)) {
            paidRevenueByDay.put(cursor, 0.0);
        }

        double revenueLast7Days = 0.0;
        for (Order order : paidOrders) {
            LocalDateTime orderDate = order.getOrderDate();
            if (orderDate == null) {
                continue;
            }
            LocalDate orderDay = orderDate.toLocalDate();
            if (!paidRevenueByDay.containsKey(orderDay)) {
                continue;
            }
            double total = Optional.ofNullable(order.getTotal()).orElse(0.0);
            paidRevenueByDay.computeIfPresent(orderDay, (day, value) -> value + total);
            revenueLast7Days += total;
        }

        List<DashboardDailySalesDto> dailySales = paidRevenueByDay.entrySet().stream()
                .map(entry -> DashboardDailySalesDto.builder()
                        .key(entry.getKey().toString())
                        .label(entry.getKey().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                        .value(round(entry.getValue()))
                        .build())
                .toList();

        long orderCountLast7Days = paidOrders.size();
        long pendingOrdersCount = orders.stream()
                .filter(order -> order.getPaymentStatus() != PaymentStatus.PAID)
                .count();

        double averageOrderValue = orderCountLast7Days == 0 ? 0.0 : revenueLast7Days / orderCountLast7Days;

        List<Order> allPaidOrders = getOrdersByPaymentStatus(PaymentStatus.PAID, locationId);
        double revenueTotal = allPaidOrders.stream()
                .mapToDouble(order -> Optional.ofNullable(order.getTotal()).orElse(0.0))
                .sum();
        double overallAverageOrderValue = allPaidOrders.isEmpty() ? 0.0 : revenueTotal / allPaidOrders.size();

        long uniqueCustomersServed = paidOrders.stream()
                .map(order -> order.getCustomer() == null ? null : order.getCustomer().getCustomerId())
                .filter(id -> id != null)
                .distinct()
                .count();

        long customerCount = locationId == null
                ? customerRepository.count()
                : getCustomersServedAtLocation(locationId).size();

        List<OrderDetail> paidOrderDetails = getOrderDetailsInRange(rangeStart, rangeEnd, locationId);

        List<CategoryMixDto> categoryMix = buildCategoryMix(paidOrderDetails);
        List<TopProductSalesDto> topProducts = buildTopProducts(paidOrderDetails, DEFAULT_TOP_PRODUCT_LIMIT);
        List<RecentOrderSummaryDto> recentOrders = orders.stream()
                .sorted(Comparator.comparing(Order::getOrderDate, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(6)
                .map(this::toRecentOrderSummary)
                .toList();

        List<LowStockAlertDto> lowStockItems = getStocks(locationId).stream()
                .filter(item -> Optional.ofNullable(item.getQuantity()).orElse(0) <= 15)
                .sorted(Comparator.comparingInt(item -> Optional.ofNullable(item.getQuantity()).orElse(0)))
                .limit(6)
                .map(stock -> LowStockAlertDto.builder()
                        .stockId(stock.getStockId())
                        .productName(stock.getProduct() == null ? "" : stock.getProduct().getName())
                        .locationName(stock.getLocation() == null ? null : stock.getLocation().getName())
                        .quantity(Optional.ofNullable(stock.getQuantity()).orElse(0))
                        .build())
                .toList();

        return DashboardReportDto.builder()
                .revenueLast7Days(round(revenueLast7Days))
                .orderCountLast7Days(orderCountLast7Days)
                .pendingOrdersCount(pendingOrdersCount)
                .totalOrdersCount(orders.size())
                .averageOrderValue(round(averageOrderValue))
                .overallAverageOrderValue(round(overallAverageOrderValue))
                .customerCount(customerCount)
                .uniqueCustomersServed(uniqueCustomersServed)
                .dailySales(dailySales)
                .recentOrders(recentOrders)
                .categoryMix(categoryMix)
                .topProducts(topProducts)
                .lowStockItems(lowStockItems)
                .build();
    }

    @Override
    public SalesSummaryReportDto getSalesSummary(Long locationId) {
        LocalDate today = LocalDate.now();
        LocalDate sevenDayStart = today.minusDays(6);
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();
        LocalDateTime sevenDayStartTime = sevenDayStart.atStartOfDay();

        List<Order> todayOrders = getOrdersInRange(todayStart, tomorrowStart, locationId);
        List<Order> paidOrdersToday = todayOrders.stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID)
                .toList();
        List<Order> pendingOrdersToday = todayOrders.stream()
                .filter(order -> order.getPaymentStatus() != PaymentStatus.PAID)
                .toList();

        double grossSalesToday = paidOrdersToday.stream()
                .mapToDouble(order -> Optional.ofNullable(order.getTotal()).orElse(0.0))
                .sum();
        double pendingAmountToday = pendingOrdersToday.stream()
                .mapToDouble(order -> Optional.ofNullable(order.getTotal()).orElse(0.0))
                .sum();
        double averageTicketToday = todayOrders.isEmpty() ? 0.0 : grossSalesToday / todayOrders.size();

        List<Order> sevenDayOrders = getOrdersInRange(sevenDayStartTime, tomorrowStart, locationId);
        List<Order> paidOrdersLast7Days = sevenDayOrders.stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID)
                .toList();
        double totalRevenueLast7Days = paidOrdersLast7Days.stream()
                .mapToDouble(order -> Optional.ofNullable(order.getTotal()).orElse(0.0))
                .sum();
        double averageTicketLast7Days = paidOrdersLast7Days.isEmpty()
                ? 0.0
                : totalRevenueLast7Days / paidOrdersLast7Days.size();

        Map<LocalDate, DailySalesAccumulator> dailyTrendAccumulator = new LinkedHashMap<>();
        for (LocalDate cursor = sevenDayStart; !cursor.isAfter(today); cursor = cursor.plusDays(1)) {
            dailyTrendAccumulator.put(cursor, new DailySalesAccumulator());
        }
        for (Order order : sevenDayOrders) {
            if (order.getOrderDate() == null) {
                continue;
            }
            LocalDate orderDay = order.getOrderDate().toLocalDate();
            DailySalesAccumulator accumulator = dailyTrendAccumulator.get(orderDay);
            if (accumulator == null) {
                continue;
            }
            accumulator.orderCount += 1;
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                accumulator.revenue += Optional.ofNullable(order.getTotal()).orElse(0.0);
            }
        }

        List<DailySalesSummaryDto> dailyTrend = dailyTrendAccumulator.entrySet().stream()
                .map(entry -> {
                    DailySalesAccumulator value = entry.getValue();
                    double average = value.orderCount == 0 ? 0.0 : value.revenue / value.orderCount;
                    return DailySalesSummaryDto.builder()
                            .date(entry.getKey())
                            .totalSales(round(value.revenue))
                            .totalTax(0.0)
                            .orderCount(value.orderCount)
                            .averageOrderValue(round(average))
                            .build();
                })
                .toList();

        Map<PaymentStatus, Long> statusCounts = todayOrders.stream()
                .collect(Collectors.groupingBy(
                        order -> Optional.ofNullable(order.getPaymentStatus()).orElse(PaymentStatus.PENDING),
                        Collectors.counting()));
        long maxCount = statusCounts.values().stream().mapToLong(Long::longValue).max().orElse(1L);
        List<StatusBreakdownDto> statusBreakdown = statusCounts.entrySet().stream()
                .map(entry -> StatusBreakdownDto.builder()
                        .status(entry.getKey().name())
                        .count(entry.getValue())
                        .percent(todayOrders.isEmpty() ? 0L : Math.round((double) entry.getValue() * 100 / todayOrders.size()))
                        .relative(maxCount == 0 ? 0.0 : ((double) entry.getValue() / maxCount) * 100)
                        .build())
                .sorted(Comparator.comparingLong(StatusBreakdownDto::getCount).reversed())
                .toList();

        Map<Integer, HourAccumulator> peakHourAccumulators = new HashMap<>();
        for (Order order : todayOrders) {
            if (order.getOrderDate() == null) {
                continue;
            }
            int hour = order.getOrderDate().getHour();
            HourAccumulator accumulator = peakHourAccumulators.computeIfAbsent(hour, key -> new HourAccumulator());
            accumulator.count += 1;
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                accumulator.revenue += Optional.ofNullable(order.getTotal()).orElse(0.0);
            }
        }
        List<PeakHourSummaryDto> peakHours = peakHourAccumulators.entrySet().stream()
                .map(entry -> PeakHourSummaryDto.builder()
                        .hour(entry.getKey())
                        .label(String.format(Locale.ENGLISH, "%02d:00", entry.getKey()))
                        .count(entry.getValue().count)
                        .revenue(round(entry.getValue().revenue))
                        .build())
                .sorted(Comparator.comparingLong(PeakHourSummaryDto::getCount).reversed()
                        .thenComparing(Comparator.comparingDouble(PeakHourSummaryDto::getRevenue).reversed()))
                .limit(6)
                .toList();

        List<RecentOrderSummaryDto> recentOrders = sevenDayOrders.stream()
                .sorted(Comparator.comparing(Order::getOrderDate, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(10)
                .map(this::toRecentOrderSummary)
                .toList();

        return SalesSummaryReportDto.builder()
                .grossSalesToday(round(grossSalesToday))
                .transactionsToday(todayOrders.size())
                .paidOrdersToday(paidOrdersToday.size())
                .pendingOrdersToday(pendingOrdersToday.size())
                .averageTicketToday(round(averageTicketToday))
                .averageTicketLast7Days(round(averageTicketLast7Days))
                .pendingAmountToday(round(pendingAmountToday))
                .dailyTrend(dailyTrend)
                .statusBreakdown(statusBreakdown)
                .peakHours(peakHours)
                .recentOrders(recentOrders)
                .build();
    }

    @Override
    public List<DailySalesSummaryDto> getDailySalesSummary(LocalDate startDate, LocalDate endDate, Long locationId) {
        LocalDate effectiveEnd = Optional.ofNullable(endDate).orElse(LocalDate.now());
        LocalDate effectiveStart = Optional.ofNullable(startDate).orElse(effectiveEnd.minusDays(6));

        if (effectiveEnd.isBefore(effectiveStart)) {
            throw new BadRequestException("End date cannot be before start date");
        }

        LocalDateTime rangeStart = effectiveStart.atStartOfDay();
        LocalDateTime rangeEnd = effectiveEnd.plusDays(1).atStartOfDay();

        List<Order> orders = locationId == null
                ? orderRepository.findByPaymentStatusAndOrderDateBetween(PaymentStatus.PAID, rangeStart, rangeEnd)
                : orderRepository.findByPaymentStatusAndLocation_LocationIdAndOrderDateBetween(
                        PaymentStatus.PAID, locationId, rangeStart, rangeEnd);

        Map<LocalDate, DailyAccumulator> accumulatorMap = new LinkedHashMap<>();
        LocalDate cursor = effectiveStart;
        while (!cursor.isAfter(effectiveEnd)) {
            accumulatorMap.put(cursor, new DailyAccumulator());
            cursor = cursor.plusDays(1);
        }

        for (Order order : orders) {
            if (order.getOrderDate() == null) {
                continue;
            }
            LocalDate orderDay = order.getOrderDate().toLocalDate();
            DailyAccumulator accumulator = accumulatorMap.get(orderDay);
            if (accumulator == null) {
                continue;
            }
            accumulator.totalSales += Optional.ofNullable(order.getTotal()).orElse(0.0);
            accumulator.orderCount += 1;
        }

        return accumulatorMap.entrySet().stream()
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    DailyAccumulator value = entry.getValue();
                    double average = value.orderCount == 0 ? 0.0 : value.totalSales / value.orderCount;
                    return DailySalesSummaryDto.builder()
                            .date(date)
                            .totalSales(round(value.totalSales))
                            .totalTax(0.0)
                            .orderCount(value.orderCount)
                            .averageOrderValue(round(average))
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<TopProductSalesDto> getTopProducts(LocalDate startDate, LocalDate endDate, int limit, Long locationId) {
        LocalDate effectiveEnd = Optional.ofNullable(endDate).orElse(LocalDate.now());
        LocalDate effectiveStart = Optional.ofNullable(startDate).orElse(effectiveEnd.minusMonths(1));

        if (effectiveEnd.isBefore(effectiveStart)) {
            throw new BadRequestException("End date cannot be before start date");
        }

        int maxResults = limit > 0 ? limit : DEFAULT_TOP_PRODUCT_LIMIT;

        LocalDateTime rangeStart = effectiveStart.atStartOfDay();
        LocalDateTime rangeEnd = effectiveEnd.plusDays(1).atStartOfDay();

        List<OrderDetail> details = locationId == null
                ? orderDetailRepository.findByOrder_PaymentStatusAndOrder_OrderDateBetween(PaymentStatus.PAID, rangeStart, rangeEnd)
                : orderDetailRepository.findByOrder_PaymentStatusAndOrder_Location_LocationIdAndOrder_OrderDateBetween(
                        PaymentStatus.PAID, locationId, rangeStart, rangeEnd);

        Map<Long, ProductAccumulator> productSales = new HashMap<>();
        for (OrderDetail detail : details) {
            if (detail.getProduct() == null) {
                continue;
            }
            Long productId = detail.getProduct().getProductId();
            if (productId == null) {
                continue;
            }
            ProductAccumulator accumulator = productSales.computeIfAbsent(
                    productId, id -> new ProductAccumulator(detail.getProduct().getName()));
            int quantity = Optional.ofNullable(detail.getQuantity()).orElse(0);
            double unitPrice = Optional.ofNullable(detail.getPrice()).orElse(0.0);
            accumulator.quantity += quantity;
            accumulator.totalSales += unitPrice * quantity;
        }

        return productSales.entrySet().stream()
                .map(entry -> TopProductSalesDto.builder()
                        .productId(entry.getKey())
                        .productName(entry.getValue().productName)
                        .quantitySold(entry.getValue().quantity)
                        .totalSales(round(entry.getValue().totalSales))
                        .build())
                .sorted(Comparator
                        .comparingLong(TopProductSalesDto::getQuantitySold).reversed()
                        .thenComparing(Comparator.comparingDouble(TopProductSalesDto::getTotalSales).reversed())
                        .thenComparing(TopProductSalesDto::getProductName))
                .limit(maxResults)
                .collect(Collectors.toList());
    }

    @Override
    public InventoryReportDto getInventoryReport() {
        List<Stock> stocks = stockRepository.findAll();

        Map<Long, Double> preferredCostByProduct = productSupplierRepository.findAll().stream()
                .filter(ProductSupplier::getPreferred)
                .filter(mapping -> mapping.getProduct() != null && mapping.getProduct().getProductId() != null)
                .collect(Collectors.toMap(
                        mapping -> mapping.getProduct().getProductId(),
                        mapping -> Optional.ofNullable(mapping.getCostPrice()).orElse(0.0),
                        (existing, replacement) -> replacement));

        Map<Long, CostAccumulator> receivedCostByProduct = new HashMap<>();
        List<PurchaseOrder> purchaseOrders = purchaseOrderRepository.findByOrderDateLessThanEqual(LocalDateTime.now());
        for (PurchaseOrder purchaseOrder : purchaseOrders) {
            List<PurchaseOrderDetail> details = Optional.ofNullable(purchaseOrder.getDetails()).orElse(List.of());
            for (PurchaseOrderDetail detail : details) {
                if (detail.getProduct() == null || detail.getProduct().getProductId() == null) {
                    continue;
                }
                int receivedQty = Optional.ofNullable(detail.getReceivedQty()).orElse(0);
                if (receivedQty <= 0) {
                    continue;
                }
                double cost = Optional.ofNullable(detail.getPrice()).orElse(0.0);
                CostAccumulator accumulator = receivedCostByProduct.computeIfAbsent(
                        detail.getProduct().getProductId(), id -> new CostAccumulator());
                accumulator.quantity += receivedQty;
                accumulator.totalCost += cost * receivedQty;
            }
        }

        Map<Long, InventoryAccumulator> inventoryByProduct = new HashMap<>();
        for (Stock stock : stocks) {
            Product product = stock.getProduct();
            if (product == null) {
                continue;
            }
            int quantity = Optional.ofNullable(stock.getQuantity()).orElse(0);
            if (quantity < 0) {
                throw new BadRequestException("Negative stock detected for product " + product.getName());
            }
            InventoryAccumulator accumulator = inventoryByProduct.computeIfAbsent(
                    product.getProductId(), id -> new InventoryAccumulator(product));
            accumulator.quantity += quantity;
        }

        List<InventoryItemDto> items = inventoryByProduct.values().stream()
                .map(accumulator -> {
                    double preferredCost = Optional.ofNullable(preferredCostByProduct.get(accumulator.product.getProductId()))
                            .orElse(0.0);
                    CostAccumulator receivedCost = receivedCostByProduct.get(accumulator.product.getProductId());
                    double receivedAverageCost = (receivedCost == null || receivedCost.quantity == 0)
                            ? 0.0
                            : receivedCost.totalCost / receivedCost.quantity;
                    double fallbackCost = Optional.ofNullable(accumulator.product.getCostPrice()).orElse(0.0);
                    double unitCost = preferredCost > 0.0
                            ? preferredCost
                            : (receivedAverageCost > 0.0 ? receivedAverageCost : fallbackCost);
                    double value = unitCost * accumulator.quantity;
                    return InventoryItemDto.builder()
                            .productId(accumulator.product.getProductId())
                            .productName(accumulator.product.getName())
                            .stockQuantity(Math.toIntExact(accumulator.quantity))
                            .unitPrice(round(unitCost))
                            .stockValue(round(value))
                            .build();
                })
                .sorted(Comparator
                        .comparingDouble(InventoryItemDto::getStockValue).reversed()
                        .thenComparing(InventoryItemDto::getProductName))
                .collect(Collectors.toList());

        double totalValue = items.stream()
                .mapToDouble(InventoryItemDto::getStockValue)
                .sum();

        return InventoryReportDto.builder()
                .totalInventoryValue(round(totalValue))
                .items(items)
                .build();
    }

    @Override
    public ProfitLossReportDto getProfitAndLoss(LocalDate startDate, LocalDate endDate, Long locationId) {
        LocalDate effectiveEnd = Optional.ofNullable(endDate).orElse(LocalDate.now());
        LocalDate effectiveStart = Optional.ofNullable(startDate).orElse(effectiveEnd.minusMonths(1));

        if (effectiveEnd.isBefore(effectiveStart)) {
            throw new BadRequestException("End date cannot be before start date");
        }

        LocalDateTime rangeStart = effectiveStart.atStartOfDay();
        LocalDateTime rangeEnd = effectiveEnd.plusDays(1).atStartOfDay();

        List<Order> paidOrders = locationId == null
                ? orderRepository.findByPaymentStatusAndOrderDateBetween(PaymentStatus.PAID, rangeStart, rangeEnd)
                : orderRepository.findByPaymentStatusAndLocation_LocationIdAndOrderDateBetween(
                        PaymentStatus.PAID, locationId, rangeStart, rangeEnd);

        double totalRevenue = paidOrders.stream()
                .mapToDouble(order -> Optional.ofNullable(order.getTotal()).orElse(0.0))
                .sum();

        double totalDiscounts = paidOrders.stream()
                .mapToDouble(order -> Optional.ofNullable(order.getDiscount()).orElse(0.0))
                .sum();

        List<OrderDetail> orderDetails = locationId == null
                ? orderDetailRepository.findByOrder_PaymentStatusAndOrder_OrderDateBetween(
                        PaymentStatus.PAID, rangeStart, rangeEnd)
                : orderDetailRepository.findByOrder_PaymentStatusAndOrder_Location_LocationIdAndOrder_OrderDateBetween(
                        PaymentStatus.PAID, locationId, rangeStart, rangeEnd);

        Map<Long, SalesAccumulator> salesByProduct = new HashMap<>();
        for (OrderDetail detail : orderDetails) {
            if (detail.getProduct() == null) {
                continue;
            }
            Long productId = detail.getProduct().getProductId();
            if (productId == null) {
                continue;
            }
            SalesAccumulator accumulator = salesByProduct.computeIfAbsent(
                    productId, id -> new SalesAccumulator(detail.getProduct().getName()));
            int quantity = Optional.ofNullable(detail.getQuantity()).orElse(0);
            double unitPrice = Optional.ofNullable(detail.getPrice()).orElse(0.0);
            accumulator.quantity += quantity;
            accumulator.revenue += unitPrice * quantity;
            double unitCostPrice = Optional.ofNullable(detail.getProduct().getCostPrice()).orElse(0.0);
            if (unitCostPrice > 0.0 || accumulator.costPrice == 0.0) {
                accumulator.costPrice = unitCostPrice;
            }
        }

        Map<Long, CostAccumulator> costByProduct = new HashMap<>();
        List<PurchaseOrder> purchaseOrders = purchaseOrderRepository.findByOrderDateLessThanEqual(rangeEnd);
        for (PurchaseOrder purchaseOrder : purchaseOrders) {
            if (locationId != null) {
                if (purchaseOrder.getLocation() == null
                        || !locationId.equals(purchaseOrder.getLocation().getLocationId())) {
                    continue;
                }
            }
            List<PurchaseOrderDetail> details = Optional.ofNullable(purchaseOrder.getDetails()).orElse(List.of());
            for (PurchaseOrderDetail detail : details) {
                if (detail.getProduct() == null || detail.getProduct().getProductId() == null) {
                    continue;
                }
                CostAccumulator accumulator = costByProduct.computeIfAbsent(
                        detail.getProduct().getProductId(), id -> new CostAccumulator());
                int quantity = Optional.ofNullable(detail.getQuantity()).orElse(0);
                double cost = Optional.ofNullable(detail.getPrice()).orElse(0.0);
                accumulator.quantity += quantity;
                accumulator.totalCost += cost * quantity;
            }
        }

        // Inventory purchases within the selected period
        List<PurchaseOrder> periodPurchaseOrders = purchaseOrderRepository.findByOrderDateBetween(rangeStart, rangeEnd);
        if (locationId != null) {
            periodPurchaseOrders = periodPurchaseOrders.stream()
                    .filter(po -> po.getLocation() != null && locationId.equals(po.getLocation().getLocationId()))
                    .toList();
        }
        double totalInventoryPurchases = periodPurchaseOrders.stream()
                .mapToDouble(po -> Optional.ofNullable(po.getTotal()).orElse(0.0))
                .sum();

        Map<String, double[]> supplierTotals = new HashMap<>();
        for (PurchaseOrder po : periodPurchaseOrders) {
            String supplierName = po.getSupplier() != null ? po.getSupplier().getName() : "Unknown";
            double total = Optional.ofNullable(po.getTotal()).orElse(0.0);
            supplierTotals.compute(supplierName, (k, v) -> {
                double[] acc = v == null ? new double[]{0.0, 0.0} : v;
                acc[0] += total;
                acc[1] += 1;
                return acc;
            });
        }
        List<SupplierPurchaseSummaryDto> purchasesBySupplier = supplierTotals.entrySet().stream()
                .map(e -> SupplierPurchaseSummaryDto.builder()
                        .supplierName(e.getKey())
                        .totalAmount(round(e.getValue()[0]))
                        .orderCount((int) e.getValue()[1])
                        .build())
                .sorted(Comparator.comparingDouble(SupplierPurchaseSummaryDto::getTotalAmount).reversed())
                .toList();

        // Current stock quantities and inventory value
        List<Stock> currentStocks = locationId == null
                ? stockRepository.findAll()
                : stockRepository.findByLocation_LocationId(locationId);
        Map<Long, Integer> stockByProduct = new HashMap<>();
        double currentInventoryValue = 0.0;
        for (Stock stock : currentStocks) {
            if (stock.getProduct() == null || stock.getProduct().getProductId() == null) {
                continue;
            }
            int qty = Optional.ofNullable(stock.getQuantity()).orElse(0);
            double cost = Optional.ofNullable(stock.getProduct().getCostPrice()).orElse(0.0);
            stockByProduct.merge(stock.getProduct().getProductId(), qty, Integer::sum);
            currentInventoryValue += qty * cost;
        }

        double costOfGoodsSoldValue = 0.0;
        List<ProfitLossProductDto> productBreakdown = new ArrayList<>();
        for (Map.Entry<Long, SalesAccumulator> entry : salesByProduct.entrySet()) {
            Long productId = entry.getKey();
            SalesAccumulator sales = entry.getValue();
            CostAccumulator cost = costByProduct.get(productId);
            double averageCost = (cost == null || cost.quantity == 0)
                    ? sales.costPrice
                    : cost.totalCost / cost.quantity;
            double productCost = averageCost * sales.quantity;
            double grossProfit = sales.revenue - productCost;
            costOfGoodsSoldValue += productCost;
            int inStock = stockByProduct.getOrDefault(productId, 0);
            productBreakdown.add(ProfitLossProductDto.builder()
                    .productId(productId)
                    .productName(sales.productName)
                    .quantitySold(sales.quantity)
                    .revenue(round(sales.revenue))
                    .costOfGoods(round(productCost))
                    .grossProfit(round(grossProfit))
                    .quantityInStock(inStock)
                    .inventoryValue(round(inStock * averageCost))
                    .build());
        }

        productBreakdown.sort(Comparator
                .comparingDouble(ProfitLossProductDto::getRevenue).reversed()
                .thenComparing(ProfitLossProductDto::getProductName));

        List<Expense> expenses = expenseRepository.findByExpenseDateBetween(rangeStart, rangeEnd);
        Map<ExpenseCategory, Double> expenseTotals = new HashMap<>();
        for (Expense expense : expenses) {
            if (locationId != null) {
                if (expense.getLocation() == null
                        || !locationId.equals(expense.getLocation().getLocationId())) {
                    continue;
                }
            }
            ExpenseCategory category = Optional.ofNullable(expense.getCategory()).orElse(ExpenseCategory.OTHER);
            double amount = Optional.ofNullable(expense.getAmount()).orElse(0.0);
            expenseTotals.merge(category, amount, Double::sum);
        }

        double totalExpensesValue = expenseTotals.values().stream()
                .mapToDouble(Double::doubleValue)
                .sum();

        List<ExpenseSummaryDto> expenseBreakdown = expenseTotals.entrySet().stream()
                .map(entry -> ExpenseSummaryDto.builder()
                        .category(entry.getKey())
                        .totalAmount(round(entry.getValue()))
                        .build())
                .sorted(Comparator
                        .comparingDouble(ExpenseSummaryDto::getTotalAmount).reversed()
                        .thenComparing(expenseSummaryDto -> expenseSummaryDto.getCategory().name()))
                .toList();

        double grossProfit = totalRevenue - costOfGoodsSoldValue;
        double netProfit = grossProfit - totalExpensesValue;

        return ProfitLossReportDto.builder()
                .startDate(effectiveStart)
                .endDate(effectiveEnd)
                .totalRevenue(round(totalRevenue))
                .totalDiscounts(round(totalDiscounts))
                .costOfGoodsSold(round(costOfGoodsSoldValue))
                .grossProfit(round(grossProfit))
                .totalExpenses(round(totalExpensesValue))
                .netProfit(round(netProfit))
                .totalInventoryPurchases(round(totalInventoryPurchases))
                .currentInventoryValue(round(currentInventoryValue))
                .purchasesBySupplier(purchasesBySupplier)
                .productBreakdown(productBreakdown)
                .expenseBreakdown(expenseBreakdown)
                .build();
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private List<Order> getOrdersByPaymentStatus(PaymentStatus status, Long locationId) {
        return locationId == null
                ? orderRepository.findByPaymentStatus(status)
                : orderRepository.findAll().stream()
                        .filter(order -> order.getPaymentStatus() == status)
                        .filter(order -> matchesLocation(order, locationId))
                        .toList();
    }

    private List<Order> getOrdersInRange(LocalDateTime start, LocalDateTime end, Long locationId) {
        return locationId == null
                ? orderRepository.findByOrderDateBetween(start, end)
                : orderRepository.findAll().stream()
                        .filter(order -> order.getOrderDate() != null)
                        .filter(order -> !order.getOrderDate().isBefore(start) && order.getOrderDate().isBefore(end))
                        .filter(order -> matchesLocation(order, locationId))
                        .toList();
    }

    private List<OrderDetail> getOrderDetailsInRange(LocalDateTime start, LocalDateTime end, Long locationId) {
        return locationId == null
                ? orderDetailRepository.findByOrder_PaymentStatusAndOrder_OrderDateBetween(PaymentStatus.PAID, start, end)
                : orderDetailRepository.findByOrder_PaymentStatusAndOrder_Location_LocationIdAndOrder_OrderDateBetween(
                        PaymentStatus.PAID, locationId, start, end);
    }

    private List<Stock> getStocks(Long locationId) {
        return locationId == null
                ? stockRepository.findAll()
                : stockRepository.findByLocation_LocationId(locationId);
    }

    private boolean matchesLocation(Order order, Long locationId) {
        return order.getLocation() != null && locationId.equals(order.getLocation().getLocationId());
    }

    private List<Customer> getCustomersServedAtLocation(Long locationId) {
        return orderRepository.findAll().stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID)
                .filter(order -> matchesLocation(order, locationId))
                .map(Order::getCustomer)
                .filter(customer -> customer != null && customer.getCustomerId() != null)
                .collect(Collectors.toMap(Customer::getCustomerId, customer -> customer, (existing, replacement) -> existing))
                .values()
                .stream()
                .toList();
    }

    private List<CategoryMixDto> buildCategoryMix(List<OrderDetail> orderDetails) {
        Map<String, CategoryAccumulator> totals = new HashMap<>();
        for (OrderDetail detail : orderDetails) {
            int quantity = Optional.ofNullable(detail.getQuantity()).orElse(0);
            if (quantity <= 0) {
                continue;
            }
            double unitPrice = Optional.ofNullable(detail.getPrice()).orElse(0.0);
            String categoryName = detail.getProduct() == null
                    || detail.getProduct().getCategory() == null
                    || detail.getProduct().getCategory().getName() == null
                    ? "Uncategorised"
                    : detail.getProduct().getCategory().getName();
            CategoryAccumulator accumulator = totals.computeIfAbsent(categoryName, key -> new CategoryAccumulator());
            accumulator.quantity += quantity;
            accumulator.revenue += unitPrice * quantity;
        }

        long totalQuantity = totals.values().stream()
                .mapToLong(value -> value.quantity)
                .sum();

        return totals.entrySet().stream()
                .map(entry -> CategoryMixDto.builder()
                        .name(entry.getKey())
                        .quantity(entry.getValue().quantity)
                        .revenue(round(entry.getValue().revenue))
                        .percent(totalQuantity == 0 ? 0L : Math.round((double) entry.getValue().quantity * 100 / totalQuantity))
                        .build())
                .sorted(Comparator.comparingLong(CategoryMixDto::getQuantity).reversed())
                .limit(5)
                .toList();
    }

    private List<TopProductSalesDto> buildTopProducts(List<OrderDetail> orderDetails, int limit) {
        Map<Long, ProductAccumulator> productSales = new HashMap<>();
        for (OrderDetail detail : orderDetails) {
            if (detail.getProduct() == null || detail.getProduct().getProductId() == null) {
                continue;
            }
            int quantity = Optional.ofNullable(detail.getQuantity()).orElse(0);
            if (quantity <= 0) {
                continue;
            }
            double unitPrice = Optional.ofNullable(detail.getPrice()).orElse(0.0);
            Long productId = detail.getProduct().getProductId();
            ProductAccumulator accumulator = productSales.computeIfAbsent(
                    productId, id -> new ProductAccumulator(detail.getProduct().getName()));
            accumulator.quantity += quantity;
            accumulator.totalSales += unitPrice * quantity;
        }

        return productSales.entrySet().stream()
                .map(entry -> TopProductSalesDto.builder()
                        .productId(entry.getKey())
                        .productName(entry.getValue().productName)
                        .quantitySold(entry.getValue().quantity)
                        .totalSales(round(entry.getValue().totalSales))
                        .build())
                .sorted(Comparator
                        .comparingLong(TopProductSalesDto::getQuantitySold).reversed()
                        .thenComparing(Comparator.comparingDouble(TopProductSalesDto::getTotalSales).reversed())
                        .thenComparing(TopProductSalesDto::getProductName))
                .limit(limit)
                .toList();
    }

    private RecentOrderSummaryDto toRecentOrderSummary(Order order) {
        return RecentOrderSummaryDto.builder()
                .orderId(order.getOrderId())
                .customerName(order.getCustomer() == null ? "Walk-in" : order.getCustomer().getName())
                .total(round(Optional.ofNullable(order.getTotal()).orElse(0.0)))
                .paymentStatus(order.getPaymentStatus() == null ? null : order.getPaymentStatus().name())
                .orderDate(order.getOrderDate())
                .build();
    }

    private static class DailyAccumulator {
        private double totalSales;
        private long orderCount;
    }

    private static class DailySalesAccumulator {
        private double revenue;
        private long orderCount;
    }

    private static class ProductAccumulator {
        private final String productName;
        private long quantity;
        private double totalSales;

        private ProductAccumulator(String productName) {
            this.productName = productName;
        }
    }

    private static class InventoryAccumulator {
        private final Product product;
        private long quantity;

        private InventoryAccumulator(Product product) {
            this.product = product;
        }
    }

    private static class SalesAccumulator {
        private final String productName;
        private long quantity;
        private double revenue;
        private double costPrice;

        private SalesAccumulator(String productName) {
            this.productName = productName;
        }
    }

    private static class CostAccumulator {
        private long quantity;
        private double totalCost;
    }

    private static class HourAccumulator {
        private long count;
        private double revenue;
    }

    private static class CategoryAccumulator {
        private long quantity;
        private double revenue;
    }
}
