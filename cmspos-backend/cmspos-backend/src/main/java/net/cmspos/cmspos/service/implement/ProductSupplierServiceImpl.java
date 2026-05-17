package net.cmspos.cmspos.service.implement;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.exception.BadRequestException;
import net.cmspos.cmspos.exception.ResourceNotFoundException;
import net.cmspos.cmspos.model.dto.ProductSupplierDto;
import net.cmspos.cmspos.model.dto.SupplierProductDto;
import net.cmspos.cmspos.model.entity.Product;
import net.cmspos.cmspos.model.entity.ProductSupplier;
import net.cmspos.cmspos.model.entity.Supplier;
import net.cmspos.cmspos.repository.ProductRepository;
import net.cmspos.cmspos.repository.ProductSupplierRepository;
import net.cmspos.cmspos.repository.SupplierRepository;
import net.cmspos.cmspos.service.ProductSupplierService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductSupplierServiceImpl implements ProductSupplierService {

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final ProductSupplierRepository productSupplierRepository;

    @Override
    @Transactional(readOnly = true)
    public ProductSupplierDto getPreferredSupplier(Long productId) {
        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        return productSupplierRepository.findByProduct_ProductIdAndPreferredTrue(productId)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    @Transactional
    public ProductSupplierDto setPreferredSupplier(Long productId, ProductSupplierDto dto) {
        if (dto.getSupplierId() == null) {
            throw new BadRequestException("Supplier id is required to set a preferred supplier");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + dto.getSupplierId()));

        Optional<ProductSupplier> existingPreferred = productSupplierRepository
                .findByProduct_ProductIdAndPreferredTrue(productId);

        ProductSupplier mapping = productSupplierRepository
                .findByProduct_ProductIdAndSupplier_SupplierId(productId, supplier.getSupplierId())
                .orElseGet(() -> {
                    ProductSupplier created = new ProductSupplier();
                    created.setProduct(product);
                    created.setSupplier(supplier);
                    return created;
                });

        if (existingPreferred.isPresent()
                && !existingPreferred.get().getSupplier().getSupplierId().equals(supplier.getSupplierId())) {
            ProductSupplier previous = existingPreferred.get();
            previous.setPreferred(false);
            productSupplierRepository.save(previous);
        }

        mapping.setPreferred(true);
        mapping.setVendorSku(dto.getVendorSku());
        mapping.setLeadTimeDays(dto.getLeadTimeDays());
        double cost = dto.getCostPrice() == null ? 0.0 : Math.max(dto.getCostPrice(), 0.0);
        mapping.setCostPrice(cost);

        ProductSupplier saved = productSupplierRepository.save(mapping);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void clearPreferredSupplier(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
        productSupplierRepository.findByProduct_ProductIdAndPreferredTrue(productId)
                .ifPresent(productSupplierRepository::delete);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierProductDto> getSupplierProducts(Long supplierId) {
        supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + supplierId));

        return productSupplierRepository.findBySupplier_SupplierId(supplierId).stream()
                .map(this::toSupplierProductDto)
                .toList();
    }

    private ProductSupplierDto toDto(ProductSupplier entity) {
        ProductSupplierDto dto = new ProductSupplierDto();
        dto.setProductId(entity.getProduct() != null ? entity.getProduct().getProductId() : null);
        dto.setSupplierId(entity.getSupplier() != null ? entity.getSupplier().getSupplierId() : null);
        dto.setSupplierName(entity.getSupplier() != null ? entity.getSupplier().getName() : null);
        dto.setPreferred(entity.getPreferred());
        dto.setVendorSku(entity.getVendorSku());
        dto.setLeadTimeDays(entity.getLeadTimeDays());
        dto.setCostPrice(entity.getCostPrice());
        return dto;
    }

    private SupplierProductDto toSupplierProductDto(ProductSupplier entity) {
        Product product = entity.getProduct();
        return SupplierProductDto.builder()
                .productId(product != null ? product.getProductId() : null)
                .productName(product != null ? product.getName() : null)
                .sku(product != null ? product.getSku() : null)
                .categoryName(product != null && product.getCategory() != null
                        ? product.getCategory().getName()
                        : null)
                .costPrice(entity.getCostPrice())
                .build();
    }
}
