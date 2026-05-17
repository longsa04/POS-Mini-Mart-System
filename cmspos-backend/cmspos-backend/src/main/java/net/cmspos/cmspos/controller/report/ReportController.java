package net.cmspos.cmspos.controller.report;

import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.model.dto.report.DashboardReportDto;
import net.cmspos.cmspos.model.dto.report.DailySalesSummaryDto;
import net.cmspos.cmspos.model.dto.report.InventoryReportDto;
import net.cmspos.cmspos.model.dto.report.ProfitLossReportDto;
import net.cmspos.cmspos.model.dto.report.SalesSummaryReportDto;
import net.cmspos.cmspos.model.dto.report.TopProductSalesDto;
import net.cmspos.cmspos.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardReportDto> getDashboardReport(
            @RequestParam(required = false) Long locationId) {
        DashboardReportDto report = reportService.getDashboardReport(locationId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/sales-summary")
    public ResponseEntity<SalesSummaryReportDto> getSalesSummary(
            @RequestParam(required = false) Long locationId) {
        SalesSummaryReportDto report = reportService.getSalesSummary(locationId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/sales/daily")
    public ResponseEntity<List<DailySalesSummaryDto>> getDailySalesSummary(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long locationId) {
        List<DailySalesSummaryDto> summaries = reportService.getDailySalesSummary(startDate, endDate, locationId);
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/sales/top-products")
    public ResponseEntity<List<TopProductSalesDto>> getTopProducts(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) Long locationId) {
        List<TopProductSalesDto> topProducts = reportService.getTopProducts(startDate, endDate, limit, locationId);
        return ResponseEntity.ok(topProducts);
    }

    @GetMapping("/inventory")
    public ResponseEntity<InventoryReportDto> getInventoryReport() {
        InventoryReportDto report = reportService.getInventoryReport();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/profit-loss")
    public ResponseEntity<ProfitLossReportDto> getProfitAndLoss(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long locationId) {
        ProfitLossReportDto report = reportService.getProfitAndLoss(startDate, endDate, locationId);
        return ResponseEntity.ok(report);
    }
}
