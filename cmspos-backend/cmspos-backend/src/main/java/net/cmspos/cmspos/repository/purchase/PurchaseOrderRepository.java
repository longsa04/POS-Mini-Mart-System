package net.cmspos.cmspos.repository.purchase;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import net.cmspos.cmspos.model.entity.purchase.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    @EntityGraph(attributePaths = {"supplier", "location", "details", "details.product"})
    List<PurchaseOrder> findByOrderDateBetween(LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"supplier", "location", "details", "details.product"})
    List<PurchaseOrder> findByOrderDateLessThanEqual(LocalDateTime end);

    @EntityGraph(attributePaths = {"supplier", "location", "details", "details.product"})
    Optional<PurchaseOrder> findByPurchaseOrderId(Long purchaseOrderId);

    boolean existsBySupplier_SupplierId(Long supplierId);
}
