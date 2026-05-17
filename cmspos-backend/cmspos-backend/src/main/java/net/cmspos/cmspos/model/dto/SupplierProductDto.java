package net.cmspos.cmspos.model.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class SupplierProductDto {
    private Long productId;
    private String productName;
    private String sku;
    private String categoryName;
    private Double costPrice;
}
