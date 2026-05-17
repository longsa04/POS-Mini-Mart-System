package net.cmspos.cmspos.service;

import net.cmspos.cmspos.model.dto.ProductSupplierDto;
import net.cmspos.cmspos.model.dto.SupplierProductDto;
import java.util.List;

public interface ProductSupplierService {
    ProductSupplierDto getPreferredSupplier(Long productId);

    ProductSupplierDto setPreferredSupplier(Long productId, ProductSupplierDto dto);

    void clearPreferredSupplier(Long productId);

    List<SupplierProductDto> getSupplierProducts(Long supplierId);
}
