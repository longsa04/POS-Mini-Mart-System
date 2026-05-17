package net.cmspos.cmspos.model.dto.report;

import java.time.LocalDate;
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
public class ProfitLossReportDto {
    private LocalDate startDate;
    private LocalDate endDate;
    private double totalRevenue;
    private double totalDiscounts;
    private double costOfGoodsSold;
    private double grossProfit;
    private double totalExpenses;
    private double netProfit;
    private double totalInventoryPurchases;
    private double currentInventoryValue;
    private List<ProfitLossProductDto> productBreakdown;
    private List<ExpenseSummaryDto> expenseBreakdown;
    private List<SupplierPurchaseSummaryDto> purchasesBySupplier;
}
