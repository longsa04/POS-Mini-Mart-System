package net.cmspos.cmspos.repository.inventory;

import java.time.LocalDateTime;
import java.util.List;
import net.cmspos.cmspos.model.entity.inventory.StockMovement;
import net.cmspos.cmspos.model.enums.StockMovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProduct_ProductIdOrderByCreatedAtDesc(Long productId);

    List<StockMovement> findByProduct_ProductIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long productId, LocalDateTime start, LocalDateTime end);

    List<StockMovement> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    List<StockMovement> findByProduct_ProductIdAndLocation_LocationIdAndMovementTypeIn(Long productId, Long locationId, List<StockMovementType> movementTypes);

    List<StockMovement> findByProduct_ProductIdAndMovementTypeIn(Long productId, List<StockMovementType> movementTypes);
}
