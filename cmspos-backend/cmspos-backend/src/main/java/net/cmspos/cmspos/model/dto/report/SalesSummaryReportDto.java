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
public class SalesSummaryReportDto {
    private double grossSalesToday;
    private long transactionsToday;
    private long paidOrdersToday;
    private long pendingOrdersToday;
    private double averageTicketToday;
    private double averageTicketLast7Days;
    private double pendingAmountToday;
    private List<DailySalesSummaryDto> dailyTrend;
    private List<StatusBreakdownDto> statusBreakdown;
    private List<PeakHourSummaryDto> peakHours;
    private List<RecentOrderSummaryDto> recentOrders;
}
