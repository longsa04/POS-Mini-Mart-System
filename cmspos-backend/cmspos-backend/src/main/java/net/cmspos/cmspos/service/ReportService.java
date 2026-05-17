package net.cmspos.cmspos.service;

import java.time.LocalDate;
import java.util.List;
import net.cmspos.cmspos.model.dto.report.DashboardReportDto;
import net.cmspos.cmspos.model.dto.report.DailySalesSummaryDto;
import net.cmspos.cmspos.model.dto.report.InventoryReportDto;
import net.cmspos.cmspos.model.dto.report.ProfitLossReportDto;
import net.cmspos.cmspos.model.dto.report.SalesSummaryReportDto;
import net.cmspos.cmspos.model.dto.report.TopProductSalesDto;

public interface ReportService {
    DashboardReportDto getDashboardReport(Long locationId);

    SalesSummaryReportDto getSalesSummary(Long locationId);

    List<DailySalesSummaryDto> getDailySalesSummary(LocalDate startDate, LocalDate endDate, Long locationId);

    List<TopProductSalesDto> getTopProducts(LocalDate startDate, LocalDate endDate, int limit, Long locationId);

    InventoryReportDto getInventoryReport();

    ProfitLossReportDto getProfitAndLoss(LocalDate startDate, LocalDate endDate, Long locationId);
}
