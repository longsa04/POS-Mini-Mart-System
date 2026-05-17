package net.cmspos.cmspos.service.implement;

import java.util.List;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.exception.BadRequestException;
import net.cmspos.cmspos.exception.ResourceNotFoundException;
import net.cmspos.cmspos.model.dto.SupplierDto;
import net.cmspos.cmspos.model.entity.Supplier;
import net.cmspos.cmspos.repository.ProductSupplierRepository;
import net.cmspos.cmspos.repository.SupplierRepository;
import net.cmspos.cmspos.repository.purchase.PurchaseOrderRepository;
import net.cmspos.cmspos.service.SupplierService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductSupplierRepository productSupplierRepository;

    @Override
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Override
    public Supplier createSupplier(SupplierDto supplierDto) {
        Supplier supplier = new Supplier();
        applyDto(supplier, supplierDto);
        return supplierRepository.save(supplier);
    }

    @Override
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
    }

    @Override
    public Supplier updateSupplier(Long id, SupplierDto supplierDto) {
        Supplier supplier = getSupplierById(id);
        applyDto(supplier, supplierDto);
        return supplierRepository.save(supplier);
    }

    @Override
    public void deleteSupplier(Long id) {
        Supplier supplier = getSupplierById(id);
        if (purchaseOrderRepository.existsBySupplier_SupplierId(id)) {
            throw new BadRequestException("Supplier cannot be deleted while linked to purchase orders");
        }
        if (productSupplierRepository.existsBySupplier_SupplierId(id)) {
            throw new BadRequestException("Supplier cannot be deleted while linked to product mappings");
        }
        supplierRepository.delete(supplier);
    }

    private void applyDto(Supplier supplier, SupplierDto dto) {
        supplier.setName(dto.getName());
        supplier.setPhone(dto.getPhone());
        supplier.setEmail(dto.getEmail());
        supplier.setAddress(dto.getAddress());
    }
}
