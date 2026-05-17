package net.cmspos.cmspos.model.dto.purchase;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderLineResponseDto {
    private Long id;
    private Integer quantity;
    private Integer receivedQty;
    private Double price;
    private SimpleReferenceDto product;
}
