package net.cmspos.cmspos.model.dto.purchase;

import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PurchaseOrderReceiveLineDto {
    private Long detailId;
    private Integer receivedQty;
    /** Optional expiry date for the received batch (perishable goods). */
    private LocalDate expiryDate;
}
