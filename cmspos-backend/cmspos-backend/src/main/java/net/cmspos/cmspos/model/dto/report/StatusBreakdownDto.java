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
public class StatusBreakdownDto {
    private String status;
    private long count;
    private long percent;
    private double relative;
}
