package net.cmspos.cmspos.model.dto.inventory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class StockBatchDto {
    private Long batchId;
    private Long supplierId;
    private String supplierName;
    private Long purchaseOrderId;
    private Integer quantityReceived;
    private Integer quantityRemaining;
    private BigDecimal unitCost;
    private LocalDate receivedDate;
    private LocalDate expiryDate;
    private LocalDateTime createdAt;
}
