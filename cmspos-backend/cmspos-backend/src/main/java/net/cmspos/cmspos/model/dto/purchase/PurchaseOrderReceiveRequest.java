package net.cmspos.cmspos.model.dto.purchase;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PurchaseOrderReceiveRequest {
    private List<PurchaseOrderReceiveLineDto> lines;
}
