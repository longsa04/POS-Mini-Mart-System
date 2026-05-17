package net.cmspos.cmspos.controller;

import java.util.List;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.model.dto.PosProductDto;
import net.cmspos.cmspos.model.dto.ProductDto;
import net.cmspos.cmspos.model.dto.ProductSupplierDto;
import net.cmspos.cmspos.model.entity.Product;
import net.cmspos.cmspos.service.ProductService;
import net.cmspos.cmspos.service.ProductSupplierService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductSupplierService productSupplierService;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/in-stock")
    public ResponseEntity<List<PosProductDto>> getInStockProducts() {
        return ResponseEntity.ok(productService.getInStockProducts());
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody ProductDto productDto) {
        Product product = productService.createProduct(productDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody ProductDto productDto) {
        Product updated = productService.updateProduct(id, productDto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable Long categoryId) {
        List<Product> products = productService.getProductsByCategory(categoryId);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/categories/{categoryId}")
    public ResponseEntity<List<Product>> getProductsByCategoryLegacy(@PathVariable Long categoryId) {
        return getProductsByCategory(categoryId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/preferred-supplier")
    public ResponseEntity<ProductSupplierDto> getPreferredSupplier(@PathVariable Long id) {
        ProductSupplierDto dto = productSupplierService.getPreferredSupplier(id);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/preferred-supplier")
    public ResponseEntity<ProductSupplierDto> setPreferredSupplier(@PathVariable Long id, @RequestBody ProductSupplierDto dto) {
        if (dto == null || dto.getSupplierId() == null) {
            productSupplierService.clearPreferredSupplier(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(productSupplierService.setPreferredSupplier(id, dto));
    }
}
