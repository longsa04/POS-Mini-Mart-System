package net.cmspos.cmspos.model.dto.inventory;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import net.cmspos.cmspos.model.enums.StockMovementType;

@Getter
@Setter
@Builder
public class StockMovementDto {
    private Long movementId;
    private Long productId;
    private String productName;
    private Long locationId;
    private String locationName;
    private Long poId;
    private Long supplierId;
    private String supplierName;
    private StockMovementType movementType;
    private Integer quantityChange;
    private Integer resultingQuantity;
    private String reference;
    private String note;
    private LocalDateTime createdAt;
}
