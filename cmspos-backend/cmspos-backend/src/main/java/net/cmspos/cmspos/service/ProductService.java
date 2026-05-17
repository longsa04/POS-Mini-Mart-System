package net.cmspos.cmspos.service;

import net.cmspos.cmspos.model.dto.PosProductDto;
import net.cmspos.cmspos.model.dto.ProductDto;
import net.cmspos.cmspos.model.entity.Product;
import java.util.List;

public interface ProductService {
    List<Product> getAllProducts();
    List<PosProductDto> getInStockProducts();
    Product createProduct(ProductDto productDto);
    Product getProductById(Long id);
    Product updateProduct(Long id, ProductDto productDto);
    List<Product> getProductsByCategory(Long id);
    Product deleteProduct(Long id);
}
