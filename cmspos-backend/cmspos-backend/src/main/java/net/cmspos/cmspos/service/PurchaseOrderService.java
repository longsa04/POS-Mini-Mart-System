package net.cmspos.cmspos.service;

import java.time.LocalDate;
import java.util.List;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderDto;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderReceiveRequest;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderResponseDto;

public interface PurchaseOrderService {
    PurchaseOrderResponseDto createPurchaseOrder(PurchaseOrderDto purchaseOrderDto);

    PurchaseOrderResponseDto getPurchaseOrder(Long id);

    List<PurchaseOrderResponseDto> getPurchaseOrders(LocalDate startDate, LocalDate endDate);

    PurchaseOrderResponseDto receivePurchaseOrder(Long id, PurchaseOrderReceiveRequest request);

    PurchaseOrderResponseDto cancelPurchaseOrder(Long id);
}
