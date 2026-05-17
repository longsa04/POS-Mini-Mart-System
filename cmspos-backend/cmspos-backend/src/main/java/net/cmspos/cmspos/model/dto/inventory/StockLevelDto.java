package net.cmspos.cmspos.model.dto.inventory;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class StockLevelDto {
    private Long stockId;
    private Long productId;
    private String productName;
    private String sku;
    private String categoryName;
    private Long locationId;
    private String locationName;
    private Integer quantity;
    private LocalDateTime lastUpdated;
    private List<SupplierTrafficDto> supplierTraffic;
    /** FIFO batch breakdown — newest-first, for display on the stock detail panel. */
    private List<StockBatchDto> batches;
}
