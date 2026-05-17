package net.cmspos.cmspos.model.dto.inventory;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import net.cmspos.cmspos.model.enums.StockMovementType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryAdjustmentRequest {

    private Long productId;

    private Long locationId;

    private Long supplierId;

    private StockMovementType movementType;

    private Integer quantity;

    private String reference;

    private String note;

    /** Cost per unit for this receipt. Used to create a StockBatch for FIFO costing. */
    private BigDecimal unitCost;

    /** Optional expiry date for the batch (perishable goods). */
    private LocalDate expiryDate;
}
