package net.cmspos.cmspos.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "product_supplier",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_product_supplier_pair", columnNames = {"product_id", "supplier_id"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProductSupplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_supplier_id")
    private Long productSupplierId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_product_supplier_product"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false, foreignKey = @ForeignKey(name = "fk_product_supplier_supplier"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Supplier supplier;

    @Column(nullable = false)
    private Boolean preferred = false;

    @Column(name = "vendor_sku", length = 100)
    private String vendorSku;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "cost_price", nullable = false)
    private Double costPrice = 0.0;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (preferred == null) {
            preferred = false;
        }
        if (costPrice == null) {
            costPrice = 0.0;
        }
    }
}
