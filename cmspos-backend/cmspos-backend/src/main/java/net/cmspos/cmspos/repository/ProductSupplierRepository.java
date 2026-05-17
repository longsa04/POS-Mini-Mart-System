package net.cmspos.cmspos.repository;

import java.util.Optional;
import java.util.List;
import net.cmspos.cmspos.model.entity.ProductSupplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductSupplierRepository extends JpaRepository<ProductSupplier, Long> {
    Optional<ProductSupplier> findByProduct_ProductIdAndPreferredTrue(Long productId);

    Optional<ProductSupplier> findByProduct_ProductIdAndSupplier_SupplierId(Long productId, Long supplierId);

    List<ProductSupplier> findBySupplier_SupplierId(Long supplierId);

    boolean existsBySupplier_SupplierId(Long supplierId);
}
