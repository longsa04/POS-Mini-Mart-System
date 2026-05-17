package net.cmspos.cmspos.model.dto.report;

import java.time.LocalDateTime;
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
public class RecentOrderSummaryDto {
    private Long orderId;
    private String customerName;
    private double total;
    private String paymentStatus;
    private LocalDateTime orderDate;
}
