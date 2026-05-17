package net.cmspos.cmspos.model.dto.inventory;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class SupplierTrafficDto {
    private Long supplierId;
    private String supplierName;
    private Integer receivedQty;
}
