import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProducts as fetchProductsApi,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../../api/products";
import { fetchCategories } from "../../../api/categories";
import { fetchSuppliers } from "../../../api/suppliers";
import { fetchPreferredSupplier, setPreferredSupplier } from "../../../api/productSuppliers";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const emptyForm = {
  productId: null,
  name: "",
  sku: "",
  price: "",
  costPrice: "",
  categoryId: "",
  preferredSupplierId: "",
  supplierCostPrice: "",
};

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [preferredSuppliers, setPreferredSuppliers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formValues, setFormValues] = useState(emptyForm);
  const [formMode, setFormMode] = useState("create");
  const [formError, setFormError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [loadedProducts, loadedCategories, loadedSuppliers] = await Promise.all([
          fetchProductsApi({ signal: controller.signal }),
          fetchCategories({ signal: controller.signal }),
          fetchSuppliers({ signal: controller.signal }),
        ]);

        setProducts(Array.isArray(loadedProducts) ? loadedProducts : []);
        setCategories(Array.isArray(loadedCategories) ? loadedCategories : []);
        setSuppliers(Array.isArray(loadedSuppliers) ? loadedSuppliers : []);
        setPreferredSuppliers({});
        setError(null);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          return;
        }
        setError(fetchError.message || "Unable to load products");
        setProducts([]);
        setCategories([]);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!products.length) {
      setPreferredSuppliers({});
      return;
    }

    const controller = new AbortController();
    const loadPreferredSuppliers = async () => {
      try {
        const entries = await Promise.all(
          products.map(async (product) => {
            const productId = product?.productId ?? product?.id;
            if (!productId) return null;
            const preferred = await fetchPreferredSupplier({
              productId,
              signal: controller.signal,
            });
            return preferred
              ? [
                  productId,
                  {
                    id: preferred.supplierId ?? preferred.id ?? null,
                    name: preferred.supplierName ?? preferred.name ?? "-",
                  },
                ]
              : [productId, null];
          })
        );
        if (controller.signal.aborted) return;
        const nextMap = entries.reduce((acc, entry) => {
          if (entry) {
            acc[entry[0]] = entry[1];
          }
          return acc;
        }, {});
        setPreferredSuppliers(nextMap);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          return;
        }
        setPreferredSuppliers({});
      }
    };

    loadPreferredSuppliers();
    return () => controller.abort();
  }, [products]);

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      id: category.id ?? category.categoryId,
      name: category.name,
    }));
  }, [categories]);

  const supplierOptions = useMemo(() => {
    return suppliers.map((supplier) => ({
      id: supplier.supplierId ?? supplier.id,
      name: supplier.name ?? `Supplier ${supplier.supplierId ?? supplier.id ?? ""}`,
    }));
  }, [suppliers]);

  const categorySupplierStats = useMemo(() => {
    const stats = new Map();
    products.forEach((product) => {
      const categoryId =
        product?.category?.id ??
        product?.category?.categoryId ??
        product?.categoryId ??
        null;
      const productId = product?.productId ?? product?.id;
      if (categoryId == null || !productId) return;

      const supplierEntry = preferredSuppliers[productId];
      const supplierId = supplierEntry?.id ?? null;
      if (supplierId == null) return;

      const categoryKey = String(categoryId);
      if (!stats.has(categoryKey)) {
        stats.set(categoryKey, new Map());
      }
      const supplierMap = stats.get(categoryKey);
      supplierMap.set(
        supplierId,
        (supplierMap.get(supplierId) ?? 0) + 1
      );
    });
    return stats;
  }, [products, preferredSuppliers]);

  const supplierCategoryStats = useMemo(() => {
    const stats = new Map();
    products.forEach((product) => {
      const categoryId =
        product?.category?.id ??
        product?.category?.categoryId ??
        product?.categoryId ??
        null;
      const productId = product?.productId ?? product?.id;
      if (categoryId == null || !productId) return;

      const supplierEntry = preferredSuppliers[productId];
      const supplierId = supplierEntry?.id ?? null;
      if (supplierId == null) return;

      const supplierKey = String(supplierId);
      if (!stats.has(supplierKey)) {
        stats.set(supplierKey, new Map());
      }
      const categoryMap = stats.get(supplierKey);
      categoryMap.set(
        String(categoryId),
        (categoryMap.get(String(categoryId)) ?? 0) + 1
      );
    });
    return stats;
  }, [products, preferredSuppliers]);

  const getTopSupplierForCategory = (categoryId) => {
    if (!categoryId) return "";
    const categoryMap = categorySupplierStats.get(String(categoryId));
    if (!categoryMap) return "";
    const [topSupplierId] = Array.from(categoryMap.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0] ?? [];
    return topSupplierId != null ? String(topSupplierId) : "";
  };

  const getTopCategoryForSupplier = (supplierId) => {
    if (!supplierId) return "";
    const supplierMap = supplierCategoryStats.get(String(supplierId));
    if (!supplierMap) return "";
    const [topCategoryId] = Array.from(supplierMap.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0] ?? [];
    return topCategoryId != null ? String(topCategoryId) : "";
  };

  const resetForm = () => {
    setFormValues(emptyForm);
    setFormMode("create");
    setFormError(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => {
      if (name === "categoryId") {
        const recommendedSupplierId = getTopSupplierForCategory(value);
        return {
          ...previous,
          categoryId: value,
          preferredSupplierId: recommendedSupplierId || "",
          ...(recommendedSupplierId ? null : { supplierCostPrice: "" }),
        };
      }

      if (name === "preferredSupplierId") {
        const recommendedCategoryId = getTopCategoryForSupplier(value);
        return {
          ...previous,
          preferredSupplierId: value,
          categoryId: recommendedCategoryId || previous.categoryId,
          ...(value === "" ? { supplierCostPrice: "" } : null),
        };
      }

      return {
        ...previous,
        [name]: value,
      };
    });
  };

  const validateForm = () => {
    if (!formValues.name.trim()) {
      return "Product name is required.";
    }

    if (!formValues.sku.trim()) {
      return "SKU is required.";
    }

    const priceNumber = Number(formValues.price);
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      return "Price must be a positive number.";
    }

    const costNumber = Number(formValues.costPrice);
    if (Number.isNaN(costNumber) || costNumber < 0) {
      return "Cost price must be zero or greater.";
    }

    if (costNumber > priceNumber) {
      return "Cost price cannot exceed the selling price.";
    }

    if (!formValues.categoryId) {
      return "Please choose a category.";
    }

    if (formValues.preferredSupplierId) {
      const supplierCost = Number(formValues.supplierCostPrice);
      if (Number.isNaN(supplierCost) || supplierCost < 0) {
        return "Supplier cost must be zero or greater.";
      }
    }

    return null;
  };

  const refreshProducts = async () => {
    const updated = await fetchProductsApi();
    setProducts(Array.isArray(updated) ? updated : []);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFeedback(null);

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      name: formValues.name.trim(),
      sku: formValues.sku.trim(),
      price: Number(formValues.price),
      costPrice:
        formValues.costPrice === ""
          ? 0
          : Number(formValues.costPrice),
      categoryId: Number(formValues.categoryId),
    };

    try {
      setSubmitting(true);
      let savedProduct = null;
      if (formMode === "create") {
        savedProduct = await createProduct(payload);
        setFeedback("Product successfully created.");
      } else {
        savedProduct = await updateProduct(formValues.productId, payload);
        setFeedback("Product updated.");
      }
      const productId = savedProduct?.productId ?? formValues.productId;
      if (productId) {
        const supplierPayload = formValues.preferredSupplierId
          ? {
              supplierId: Number(formValues.preferredSupplierId),
              costPrice:
                formValues.supplierCostPrice === ""
                  ? 0
                  : Number(formValues.supplierCostPrice),
            }
          : null;
        await setPreferredSupplier(productId, supplierPayload);
      }
      await refreshProducts();
      resetForm();
    } catch (submitError) {
      setFormError(submitError.message || "Unable to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (product) => {
    const productId = product.productId ?? product.id;
    setFormMode("edit");
    setFormValues({
      productId,
      name: product.name ?? "",
      sku: product.sku ?? "",
      price: product.price != null ? String(product.price) : "",
      costPrice:
        product.costPrice != null ? String(product.costPrice) : "",
      categoryId: product.category?.id ?? product.category?.categoryId
        ? String(product.category.id ?? product.category.categoryId)
        : "",
      preferredSupplierId: "",
      supplierCostPrice: "",
    });
    setFormError(null);
    setFeedback(null);

    try {
      const preferred = await fetchPreferredSupplier({ productId });
      if (preferred) {
        setFormValues((previous) => ({
          ...previous,
          preferredSupplierId: preferred.supplierId != null ? String(preferred.supplierId) : "",
          supplierCostPrice:
            preferred.costPrice != null ? String(preferred.costPrice) : "",
        }));
      }
    } catch (fetchError) {
      setFormError(fetchError.message || "Unable to load preferred supplier.");
    }
  };

  const handleDelete = async (product) => {
    const productId = product.productId ?? product.id;
    if (!productId) return;

    const confirmation = window.confirm(
      `Delete ${product.name ?? "this product"}?`
    );

    if (!confirmation) {
      return;
    }

    try {
      setSubmitting(true);
      await deleteProduct(productId);
      setFeedback("Product deleted.");
      await refreshProducts();
      if (formMode === "edit" && formValues.productId === productId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete product.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasProducts = products.length > 0;

  const renderBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className="text-center text-secondary py-4">
            Loading products...
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={7} className="text-center text-danger py-4">
            {error}
          </td>
        </tr>
      );
    }

    if (!hasProducts) {
      return (
        <tr>
          <td colSpan={7} className="text-center text-secondary py-4">
            No products found.
          </td>
        </tr>
      );
    }

    return products.map((product) => (
      <tr key={product.productId ?? product.id ?? product.sku}>
        <td>{product.name ?? "Unnamed"}</td>
        <td>{product.sku ?? "-"}</td>
        <td>{product.category?.name ?? "Unassigned"}</td>
        <td>{preferredSuppliers[product.productId ?? product.id]?.name ?? "-"}</td>
        <td>
          {product.costPrice != null
            ? priceFormatter.format(product.costPrice)
            : "-"}
        </td>
        <td>{
          product.price != null
            ? priceFormatter.format(product.price)
            : "-"
        }</td>
        <td>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => handleEdit(product)}
              disabled={submitting}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => handleDelete(product)}
              disabled={submitting}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="page">
      <h2 className="mb-3">Product Catalog</h2>
      <div className="text-secondary font-12 mb-3">
        Manage items available at the Central Market Flagship store. Add new SKUs, update pricing, or remove items from the catalog.
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h3 className="h6 mb-3">
            {formMode === "create" ? "Add Product" : "Edit Product"}
          </h3>
          {formError && (
            <div className="alert alert-danger" role="alert">
              {formError}
            </div>
          )}
          {feedback && !formError && (
            <div className="alert alert-success" role="alert">
              {feedback}
            </div>
          )}

          {!categoryOptions.length && (
            <div
              className="alert alert-warning d-flex justify-content-between align-items-center"
              role="alert"
            >
              <span>
                No categories yet. Create one in Categories before adding products.
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => navigate("/inventory/categories")}
              >
                Open Categories
              </button>
            </div>
          )}

          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-md-4">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                disabled={submitting}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">SKU</label>
              <input
                type="text"
                className="form-control"
                name="sku"
                value={formValues.sku}
                onChange={handleInputChange}
                disabled={submitting}
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Cost Price (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                name="costPrice"
                value={formValues.costPrice}
                onChange={handleInputChange}
                disabled={submitting}
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Price (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                name="price"
                value={formValues.price}
                onChange={handleInputChange}
                disabled={submitting}
                required
              />
            </div>
            <div className="col-md-3">
              <div className="d-flex justify-content-between align-items-center">
                <label className="form-label mb-0">Category</label>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0"
                  onClick={() => navigate("/inventory/categories")}
                >
                  Manage
                </button>
              </div>
              <select
                className="form-select"
                name="categoryId"
                value={formValues.categoryId}
                onChange={handleInputChange}
                disabled={submitting || !categoryOptions.length}
                required
              >
                <option value="">Select a category</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Preferred Supplier</label>
              <select
                className="form-select"
                name="preferredSupplierId"
                value={formValues.preferredSupplierId}
                onChange={handleInputChange}
                disabled={submitting}
              >
                <option value="">None</option>
                {supplierOptions.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Supplier Cost</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                name="supplierCostPrice"
                value={formValues.supplierCostPrice}
                onChange={handleInputChange}
                disabled={submitting || !formValues.preferredSupplierId}
              />
            </div>

            <div className="col-12 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {formMode === "create" ? "Create Product" : "Save Changes"}
              </button>
              {formMode === "edit" && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Cost Price</th>
                <th>Price</th>
                <th style={{ width: "160px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>{renderBody()}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;




