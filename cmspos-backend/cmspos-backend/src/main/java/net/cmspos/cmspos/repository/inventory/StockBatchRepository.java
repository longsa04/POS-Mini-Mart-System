package net.cmspos.cmspos.repository.inventory;

import java.util.List;
import net.cmspos.cmspos.model.entity.inventory.StockBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StockBatchRepository extends JpaRepository<StockBatch, Long> {

    /**
     * FIFO query: returns batches with remaining stock for a product/location,
     * ordered by receivedDate ASC (oldest first), then createdAt ASC as tiebreaker.
     * This is the primary query used when deducting stock on a sale.
     */
    @Query("SELECT b FROM StockBatch b " +
           "WHERE b.product.productId = :productId " +
           "AND b.location.locationId = :locationId " +
           "AND b.quantityRemaining > 0 " +
           "ORDER BY b.receivedDate ASC, b.createdAt ASC")
    List<StockBatch> findFifoBatches(@Param("productId") Long productId,
                                     @Param("locationId") Long locationId);

    /**
     * Returns all batches (including exhausted ones) for display on the UI stock detail page.
     * Ordered newest-first for readability.
     */
    @Query("SELECT b FROM StockBatch b " +
           "JOIN FETCH b.product " +
           "LEFT JOIN FETCH b.supplier " +
           "WHERE b.product.productId = :productId " +
           "AND b.location.locationId = :locationId " +
           "ORDER BY b.receivedDate DESC, b.createdAt DESC")
    List<StockBatch> findAllByProductAndLocation(@Param("productId") Long productId,
                                                 @Param("locationId") Long locationId);

    /**
     * Returns the most recent non-exhausted batch — used when restoring stock
     * on order cancellation (we top up the newest batch first).
     */
    @Query("SELECT b FROM StockBatch b " +
           "WHERE b.product.productId = :productId " +
           "AND b.location.locationId = :locationId " +
           "ORDER BY b.receivedDate DESC, b.createdAt DESC")
    List<StockBatch> findLatestBatches(@Param("productId") Long productId,
                                        @Param("locationId") Long locationId);
}
