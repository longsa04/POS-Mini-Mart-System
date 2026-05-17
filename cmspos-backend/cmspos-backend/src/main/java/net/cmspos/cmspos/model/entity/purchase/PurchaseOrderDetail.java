package net.cmspos.cmspos.model.entity.purchase;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import net.cmspos.cmspos.model.entity.Product;

@Entity
@Table(name = "purchase_order_detail")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PurchaseOrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_order_detail_id")
    private Long purchaseOrderDetailId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "po_id", nullable = false, foreignKey = @ForeignKey(name = "fk_purchase_order_detail_order"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_purchase_order_detail_product"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "received_qty", nullable = false)
    private Integer receivedQty;

    @Column(nullable = false)
    private Double price;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (quantity == null) {
            quantity = 0;
        }
        if (receivedQty == null) {
            receivedQty = 0;
        }
        if (price == null) {
            price = 0.0;
        }
    }
}
