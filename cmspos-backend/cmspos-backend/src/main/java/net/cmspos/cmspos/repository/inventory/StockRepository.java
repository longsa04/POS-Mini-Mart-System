package net.cmspos.cmspos.repository.inventory;

import java.util.List;
import java.util.Optional;
import net.cmspos.cmspos.model.entity.Location;
import net.cmspos.cmspos.model.entity.Product;
import net.cmspos.cmspos.model.entity.inventory.Stock;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {

    @Override
    @EntityGraph(attributePaths = {"product", "product.category", "location"})
    List<Stock> findAll();

    @EntityGraph(attributePaths = {"product", "product.category", "location"})
    Optional<Stock> findByProductAndLocation(Product product, Location location);

    @EntityGraph(attributePaths = {"product", "product.category", "location"})
    List<Stock> findByProduct_ProductId(Long productId);

    @EntityGraph(attributePaths = {"product", "product.category", "location"})
    List<Stock> findByLocation_LocationId(Long locationId);

    @EntityGraph(attributePaths = {"product", "product.category", "location"})
    Optional<Stock> findByProduct_ProductIdAndLocation_LocationId(Long productId, Long locationId);

    @Query("SELECT s FROM Stock s JOIN FETCH s.product p JOIN FETCH p.category WHERE s.quantity > 0")
    List<Stock> findAllInStock();
}


