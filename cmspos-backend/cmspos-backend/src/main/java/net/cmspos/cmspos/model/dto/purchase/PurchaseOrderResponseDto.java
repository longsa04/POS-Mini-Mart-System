package net.cmspos.cmspos.model.dto.purchase;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import net.cmspos.cmspos.model.enums.PurchaseOrderStatus;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderResponseDto {
    private Long poId;
    private Double total;
    private LocalDateTime orderDate;
    private PurchaseOrderStatus status;
    private LocalDateTime receivedAt;
    private SimpleReferenceDto supplier;
    private SimpleReferenceDto location;
    private List<PurchaseOrderLineResponseDto> details;
}
