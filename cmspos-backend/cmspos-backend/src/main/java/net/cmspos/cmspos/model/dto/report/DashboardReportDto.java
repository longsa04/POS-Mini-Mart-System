package net.cmspos.cmspos.model.dto.report;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardReportDto {
    private double revenueLast7Days;
    private long orderCountLast7Days;
    private long pendingOrdersCount;
    private long totalOrdersCount;
    private double averageOrderValue;
    private double overallAverageOrderValue;
    private long customerCount;
    private long uniqueCustomersServed;
    private List<DashboardDailySalesDto> dailySales;
    private List<RecentOrderSummaryDto> recentOrders;
    private List<CategoryMixDto> categoryMix;
    private List<TopProductSalesDto> topProducts;
    private List<LowStockAlertDto> lowStockItems;
}
