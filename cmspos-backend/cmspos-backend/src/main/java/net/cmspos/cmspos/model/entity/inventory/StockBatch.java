package net.cmspos.cmspos.model.entity.inventory;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.cmspos.cmspos.model.entity.Location;
import net.cmspos.cmspos.model.entity.Product;
import net.cmspos.cmspos.model.entity.Supplier;
import net.cmspos.cmspos.model.entity.purchase.PurchaseOrder;

/**
 * Represents a single received batch of stock for a product at a location.
 * Batches are ordered by receivedDate (oldest first) to implement FIFO deduction.
 */
@Entity
@Table(name = "stock_batch", indexes = {
        @Index(name = "idx_stock_batch_product_location", columnList = "product_id, location_id"),
        @Index(name = "idx_stock_batch_received_date", columnList = "received_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StockBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "batch_id")
    private Long batchId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_stock_batch_product"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false, foreignKey = @ForeignKey(name = "fk_stock_batch_location"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", foreignKey = @ForeignKey(name = "fk_stock_batch_po"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", foreignKey = @ForeignKey(name = "fk_stock_batch_supplier"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Supplier supplier;

    /** Original quantity received in this batch. Never changes after creation. */
    @Column(name = "quantity_received", nullable = false)
    private Integer quantityReceived;

    /** Remaining quantity available for FIFO deduction. Decremented on each sale. */
    @Column(name = "quantity_remaining", nullable = false)
    private Integer quantityRemaining;

    /** Cost per unit at time of receipt. Used for COGS calculation in P&L reports. */
    @Column(name = "unit_cost", precision = 10, scale = 2)
    private BigDecimal unitCost;

    /**
     * The date this batch was received. This is the primary sort key for FIFO ordering.
     * Oldest receivedDate is deducted first on sale.
     */
    @Column(name = "received_date", nullable = false)
    private LocalDate receivedDate;

    /** Optional expiry date — useful for perishable mini mart goods. */
    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (receivedDate == null) {
            receivedDate = LocalDate.now();
        }
    }
}
