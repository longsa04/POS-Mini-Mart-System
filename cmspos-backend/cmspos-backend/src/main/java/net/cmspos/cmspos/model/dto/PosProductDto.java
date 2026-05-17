package net.cmspos.cmspos.model.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class PosProductDto {
    private Long productId;
    private String name;
    private Double price;
    private String sku;
    private Long categoryId;
    private String categoryName;
    private Integer stockQuantity;
}
