import "./categories.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../api/categories";
import { fetchProducts } from "../../../api/products";
import { fetchPreferredSupplier } from "../../../api/productSuppliers";

const emptyForm = {
  categoryId: null,
  name: "",
};

const getCategoryId = (category) =>
  category?.categoryId ?? category?.id ?? category?.name ?? "";

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formValues, setFormValues] = useState(emptyForm);
  const [formMode, setFormMode] = useState("create");
  const [formError, setFormError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierByCategory, setSupplierByCategory] = useState({});
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategories({ signal: controller.signal });
        setCategories(Array.isArray(data) ? data : []);
        setError(null);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          return;
        }
        setError(fetchError.message || "Unable to load categories");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadSupplierSummary = async () => {
      try {
        setSupplierLoading(true);
        setSupplierError(null);

        const products = await fetchProducts({ signal: controller.signal });
        if (controller.signal.aborted) return;

        const productList = Array.isArray(products) ? products : [];
        const supplierEntries = await Promise.all(
          productList.map(async (product) => {
            const productId = product?.productId ?? product?.id;
            if (!productId) return null;
            try {
              const preferred = await fetchPreferredSupplier({
                productId,
                signal: controller.signal,
              });
              const supplierName =
                preferred?.supplierName ?? preferred?.name ?? null;
              return { productId, supplierName };
            } catch (supplierError) {
              if (supplierError.name === "AbortError") {
                return null;
              }
              return { productId, supplierName: null };
            }
          })
        );

        if (controller.signal.aborted) return;

        const supplierMap = new Map();

        productList.forEach((product, index) => {
          const categoryId =
            product?.category?.id ??
            product?.category?.categoryId ??
            product?.categoryId ??
            null;
          if (categoryId == null) return;

          const supplierName = supplierEntries[index]?.supplierName ?? null;
          if (!supplierName) return;

          const key = String(categoryId);
          if (!supplierMap.has(key)) {
            supplierMap.set(key, new Map());
          }
          const categorySuppliers = supplierMap.get(key);
          categorySuppliers.set(
            supplierName,
            (categorySuppliers.get(supplierName) ?? 0) + 1
          );
        });

        const normalized = {};
        supplierMap.forEach((entries, key) => {
          normalized[key] = Array.from(entries.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
        });

        setSupplierByCategory(normalized);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setSupplierError("Unable to load supplier summary.");
          setSupplierByCategory({});
        }
      } finally {
        if (!controller.signal.aborted) {
          setSupplierLoading(false);
        }
      }
    };

    loadSupplierSummary();
    return () => controller.abort();
  }, []);

  const resetForm = () => {
    setFormValues(emptyForm);
    setFormMode("create");
    setFormError(null);
    setFeedback(null);
  };

  const handleInputChange = (event) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value,
    });
  };

  const refreshCategories = async () => {
    const updated = await fetchCategories();
    setCategories(Array.isArray(updated) ? updated : []);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFeedback(null);

    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      setFormError("Category name is required.");
      return;
    }

    try {
      setSubmitting(true);
      if (formMode === "create") {
        await createCategory({ name: trimmedName });
        setFeedback("Category created.");
      } else {
        await updateCategory(formValues.categoryId, { name: trimmedName });
        setFeedback("Category updated.");
      }
      await refreshCategories();
      resetForm();
    } catch (submitError) {
      setFormError(submitError.message || "Unable to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setFormMode("edit");
    setFormValues({
      categoryId: category.categoryId ?? category.id,
      name: category.name ?? "",
    });
    setFormError(null);
    setFeedback(null);
  };

  const handleDelete = async (category) => {
    const categoryId = category.categoryId ?? category.id;
    if (!categoryId) return;

    const confirmation = window.confirm(
      `Delete ${category.name ?? "this category"}?`
    );
    if (!confirmation) return;

    try {
      setSubmitting(true);
      await deleteCategory(categoryId);
      setFeedback("Category deleted.");
      await refreshCategories();
      if (formMode === "edit" && formValues.categoryId === categoryId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete category.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return categories;
    }
    return categories.filter((category) =>
      String(category?.name ?? "").toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const activeCategoryId = formMode === "edit" ? formValues.categoryId : null;
  const supplierNote = supplierError
    ? supplierError
    : supplierLoading
    ? "Loading suppliers..."
    : "No suppliers linked yet";

  const getSupplierSummary = (categoryId) => {
    const suppliers = supplierByCategory[String(categoryId)] ?? [];
    if (!suppliers.length) {
      return supplierNote;
    }
    const visible = suppliers.slice(0, 2);
    const remainder = suppliers.length - visible.length;
    const label = visible.map((supplier) => supplier.name).join(", ");
    return remainder > 0 ? `${label} +${remainder} more` : label;
  };

  const renderRows = () => {
    if (loading) {
      return <div className="category-list-state">Loading categories...</div>;
    }

    if (error) {
      return <div className="category-list-state error">{error}</div>;
    }

    if (categories.length === 0) {
      return (
        <div className="category-list-state">
          No categories defined yet.
        </div>
      );
    }

    if (filteredCategories.length === 0) {
      return (
        <div className="category-list-state">
          No categories match your search.
        </div>
      );
    }

    return (
      <table className="table table-hover mb-0 category-table">
        <thead className="table-light">
          <tr>
            <th>Category</th>
            <th>Suppliers</th>
            <th style={{ width: "170px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map((category) => {
            const categoryId = getCategoryId(category);
            const isActive =
              activeCategoryId != null &&
              String(activeCategoryId) === String(categoryId);

            return (
              <tr key={categoryId} className={isActive ? "is-active" : ""}>
                <td>
                  <div className="category-title">{category.name ?? "Unnamed"}</div>
                </td>
                <td className="category-suppliers-value">
                  {getSupplierSummary(categoryId)}
                </td>
                <td>
                  <div className="category-list-actions">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleEdit(category)}
                      disabled={submitting}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(category)}
                      disabled={submitting}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="page category-manager">
      <div className="category-header">
        <div>
          <h2 className="mb-1">Categories</h2>
          <p className="text-secondary mb-0">
            Organize products, build cleaner reports, and keep inventory easy to find.
          </p>
        </div>
        <div className="category-header-actions">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate("/inventory/products")}
          >
            Go to Product Catalog
          </button>
        </div>
      </div>

      <div className="category-layout">
        <section className="category-panel category-list-panel">
          <div className="category-list-toolbar">
            <div>
            <div className="category-stat">
              {categories.length} categor{categories.length === 1 ? "y" : "ies"}
            </div>
          </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={resetForm}
              disabled={submitting}
            >
              New Category
            </button>
          </div>

          <div className="category-search">
            <input
              type="search"
              className="form-control"
              placeholder="Search categories"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              disabled={loading}
            />
          </div>

          <div className="category-list">{renderRows()}</div>
        </section>

        <section className="category-panel category-form-panel">
          <div className="category-panel-heading">
            <div>
              <h3 className="h6 mb-1">
                {formMode === "create" ? "Add Category" : "Edit Category"}
              </h3>
              <p className="text-secondary small mb-0">
                Categories show up in the product catalog and inventory filters.
              </p>
            </div>
            {formMode === "edit" && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={resetForm}
                disabled={submitting}
              >
                Start New
              </button>
            )}
          </div>

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

          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-12">
              <label className="form-label">Category Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formValues.name}
                onChange={handleInputChange}
                disabled={submitting}
                placeholder="e.g. Fresh Produce"
                required
              />
            </div>
            <div className="col-12 d-flex gap-2 align-items-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {formMode === "create" ? "Create Category" : "Save Changes"}
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
        </section>
      </div>
    </div>
  );
};

export default Categories;
