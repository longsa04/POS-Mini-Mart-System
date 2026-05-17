package net.cmspos.cmspos.controller.purchase;

import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderDto;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderReceiveRequest;
import net.cmspos.cmspos.model.dto.purchase.PurchaseOrderResponseDto;
import net.cmspos.cmspos.service.PurchaseOrderService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/purchase-orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    public ResponseEntity<PurchaseOrderResponseDto> create(@RequestBody PurchaseOrderDto purchaseOrderDto) {
        PurchaseOrderResponseDto created = purchaseOrderService.createPurchaseOrder(purchaseOrderDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<PurchaseOrderResponseDto>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrders(start, end));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrderResponseDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrder(id));
    }

    @PutMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrderResponseDto> receive(@PathVariable Long id, @RequestBody PurchaseOrderReceiveRequest request) {
        return ResponseEntity.ok(purchaseOrderService.receivePurchaseOrder(id, request));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<PurchaseOrderResponseDto> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.cancelPurchaseOrder(id));
    }
}
