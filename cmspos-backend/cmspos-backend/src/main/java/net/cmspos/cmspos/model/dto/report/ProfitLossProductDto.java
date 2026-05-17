package net.cmspos.cmspos.model.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfitLossProductDto {
    private Long productId;
    private String productName;
    private long quantitySold;
    private double revenue;
    private double costOfGoods;
    private double grossProfit;
    private int quantityInStock;
    private double inventoryValue;
}
