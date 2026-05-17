package net.cmspos.cmspos.service.implement;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import net.cmspos.cmspos.exception.BadRequestException;
import net.cmspos.cmspos.exception.ResourceNotFoundException;
import net.cmspos.cmspos.model.dto.PosProductDto;
import net.cmspos.cmspos.model.dto.ProductDto;
import net.cmspos.cmspos.model.entity.Category;
import net.cmspos.cmspos.model.entity.Product;
import net.cmspos.cmspos.model.entity.inventory.Stock;
import net.cmspos.cmspos.repository.CategoryRepository;
import net.cmspos.cmspos.repository.ProductRepository;
import net.cmspos.cmspos.repository.inventory.StockRepository;
import net.cmspos.cmspos.service.ProductService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockRepository stockRepository;

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public List<PosProductDto> getInStockProducts() {
        List<Stock> inStockEntries = stockRepository.findAllInStock();

        // Sum quantities per product across all locations, keyed by productId
        Map<Long, Integer> quantityByProductId = inStockEntries.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getProduct().getProductId(),
                        Collectors.summingInt(s -> s.getQuantity() != null ? s.getQuantity() : 0)
                ));

        // Keep one Stock entry per product to retrieve product details
        Map<Long, Stock> stockByProductId = inStockEntries.stream()
                .collect(Collectors.toMap(
                        s -> s.getProduct().getProductId(),
                        s -> s,
                        (existing, replacement) -> existing
                ));

        return quantityByProductId.entrySet().stream()
                .map(entry -> {
                    Product p = stockByProductId.get(entry.getKey()).getProduct();
                    Category cat = p.getCategory();
                    return PosProductDto.builder()
                            .productId(p.getProductId())
                            .name(p.getName() != null ? p.getName() : "Unnamed")
                            .price(p.getPrice())
                            .sku(p.getSku())
                            .categoryId(cat != null ? cat.getId() : null)
                            .categoryName(cat != null ? cat.getName() : "General")
                            .stockQuantity(entry.getValue())
                            .build();
                })
                .sorted(Comparator.comparing(PosProductDto::getName))
                .collect(Collectors.toList());
    }

    @Override
    public Product createProduct(ProductDto productDto) {
        Product product = new Product();
        applyDto(product, productDto);
        return productRepository.save(product);
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with id " + id + " not found"));
    }

    @Override
    public Product updateProduct(Long id, ProductDto productDto) {
        Product existingProduct = getProductById(id);
        applyDto(existingProduct, productDto);
        return productRepository.save(existingProduct);
    }

    @Override
    public List<Product> getProductsByCategory(Long id) {
        Category category = resolveCategory(id).orElseThrow(() ->
                new ResourceNotFoundException("Category with id " + id + " not found"));
        return productRepository.findProductByCategory(category);
    }

    @Override
    public Product deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
        return product;
    }

    private void applyDto(Product product, ProductDto dto) {
        if (dto.getCategoryId() == null) {
            throw new BadRequestException("Category id is required for products");
        }
        if (dto.getPrice() == null) {
            throw new BadRequestException("Price is required for products");
        }
        if (dto.getPrice() < 0) {
            throw new BadRequestException("Price must be zero or greater");
        }

        product.setName(dto.getName());
        product.setPrice(dto.getPrice());
        Double dtoCostPrice = dto.getCostPrice();
        double costPrice = dtoCostPrice == null ? 0.0 : Math.max(dtoCostPrice, 0.0);
        if (costPrice > dto.getPrice()) {
            throw new BadRequestException("Cost price cannot exceed selling price");
        }
        product.setCostPrice(costPrice);
        product.setSku(dto.getSku());
        product.setCategory(resolveCategory(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category with id " + dto.getCategoryId() + " not found")));
    }

    private Optional<Category> resolveCategory(Long categoryId) {
        if (categoryId == null) {
            return Optional.empty();
        }
        return categoryRepository.findById(categoryId);
    }
}
