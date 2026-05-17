package net.cmspos.cmspos.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductSupplierDto {
    private Long productId;
    private Long supplierId;
    private String supplierName;
    private Boolean preferred;
    private String vendorSku;
    private Integer leadTimeDays;
    private Double costPrice;
}
