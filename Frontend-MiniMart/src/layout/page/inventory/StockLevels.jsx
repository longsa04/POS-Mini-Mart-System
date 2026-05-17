import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStockLevels, adjustStock, fetchStockMovements } from "../../../api/inventory";
import { fetchProducts as fetchProductsApi, fetchPreferredSupplier } from "../../../api/products";
import { fetchSuppliers, fetchSupplierProducts } from "../../../api/suppliers";
import { fetchPurchaseOrders } from "../../../api/purchaseOrders";

const PRIMARY_LOCATION = {
  id: 1,
  name: "Central Market Flagship",
};

const LOW_STOCK_THRESHOLD = 20;
const SALES_LOOKBACK_DAYS = 30;
const DEFAULT_LEAD_TIME_DAYS = 7;
const SAFETY_DAYS = 3;
const REORDER_STORAGE_KEY = "mm.reorderDraft";
const REORDER_SUPPLIER_KEY = "mm.reorderSupplier";

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const StockLevels = () => {
  const navigate = useNavigate();
  const [stockLevels, setStockLevels] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [preferredSuppliers, setPreferredSuppliers] = useState({});
  const [salesVelocity, setSalesVelocity] = useState({});
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState(null);
  const [adjustFeedback, setAdjustFeedback] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [usedFallback, setUsedFallback] = useState(false);
  const [reorderDraft, setReorderDraft] = useState({ items: [] });
  const [draftFeedback, setDraftFeedback] = useState(null);
  const [orderSelections, setOrderSelections] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    supplier: "",
    category: "",
    stockStatus: "all",
    sort: "urgent",
  });
  const [formValues, setFormValues] = useState({
    productId: "",
    supplierId: "",
    quantity: "",
    action: "add",
    note: "",
    unitCost: "",
    expiryDate: "",
  });

  const resolveStockLevels = async (signal) => {
    let fallbackUsed = false;
    const scoped = await fetchStockLevels({
      signal,
      locationId: PRIMARY_LOCATION.id,
    });

    if (Array.isArray(scoped) && scoped.length > 0) {
      fallbackUsed = false;
      return { rows: scoped, usedFallback: fallbackUsed };
    }

    if (signal?.aborted) {
      return { rows: [], usedFallback: fallbackUsed };
    }

    const fallback = await fetchStockLevels({ signal });
    if (Array.isArray(fallback) && fallback.length > 0) {
      fallbackUsed = true;
      return { rows: fallback, usedFallback: fallbackUsed };
    }

    fallbackUsed = false;
    return { rows: Array.isArray(scoped) ? scoped : [], usedFallback: fallbackUsed };
  };

  const loadPreferredSuppliers = async (rows, signal) => {
    const productIds = Array.from(
      new Set(
        (rows ?? [])
          .map((row) => row?.productId)
          .filter((productId) => productId != null)
      )
    );

    if (!productIds.length) {
      setPreferredSuppliers({});
      return;
    }

    const requests = productIds.map((productId) =>
      fetchPreferredSupplier(productId, { signal })
        .then((data) => ({ productId, data }))
        .catch(() => ({ productId, data: null }))
    );

    const results = await Promise.all(requests);
    if (signal?.aborted) {
      return;
    }

    const map = results.reduce((acc, { productId, data }) => {
      acc[productId] = data;
      return acc;
    }, {});

    setPreferredSuppliers(map);
  };

  const loadSalesVelocity = async (signal, locationId) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - SALES_LOOKBACK_DAYS);

    const movementData = await fetchStockMovements({
      signal,
      locationId,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    });

    if (signal?.aborted) {
      return {};
    }

    const map = (Array.isArray(movementData) ? movementData : []).reduce(
      (acc, movement) => {
        const productId =
          movement?.productId ??
          movement?.product?.productId ??
          movement?.product?.id ??
          null;
        if (productId == null) {
          return acc;
        }
        if (movement?.movementType !== "SALE") {
          return acc;
        }
        const qty = Math.abs(Number(movement?.quantityChange) || 0);
        if (!qty) {
          return acc;
        }
        const key = String(productId);
        acc[key] = (acc[key] || 0) + qty;
        return acc;
      },
      {}
    );

    setSalesVelocity(map);
    return map;
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        const [stockResult, productData, supplierData, orderData] = await Promise.all([
          resolveStockLevels(controller.signal),
          fetchProductsApi({ signal: controller.signal }),
          fetchSuppliers({ signal: controller.signal }),
          fetchPurchaseOrders({ signal: controller.signal }),
        ]);

        const normalizedStock = Array.isArray(stockResult?.rows)
          ? stockResult.rows
          : [];
        setStockLevels(normalizedStock);
        setProducts(Array.isArray(productData) ? productData : []);
        setSuppliers(Array.isArray(supplierData) ? supplierData : []);
        setPurchaseOrders(Array.isArray(orderData) ? orderData : []);
        setUsedFallback(Boolean(stockResult?.usedFallback));
        await loadPreferredSuppliers(normalizedStock, controller.signal);
        const scopedLocationId = stockResult?.usedFallback
          ? undefined
          : PRIMARY_LOCATION.id;
        await loadSalesVelocity(controller.signal, scopedLocationId);
        setError(null);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          return;
        }
        setError(fetchError.message || "Unable to load stock levels");
        setStockLevels([]);
        setProducts([]);
        setSuppliers([]);
        setPreferredSuppliers({});
        setSalesVelocity({});
        setPurchaseOrders([]);
        setUsedFallback(false);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(REORDER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.items)) {
          setReorderDraft(parsed);
        }
      } catch (parseError) {
        setReorderDraft({ items: [] });
      }
    }
  }, []);

  useEffect(() => {
    if (!draftFeedback) return;
    const timer = setTimeout(() => setDraftFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [draftFeedback]);

  useEffect(() => {
    if (formValues.action !== "add") {
      setSupplierProducts([]);
      return;
    }
    if (!formValues.supplierId) {
      setSupplierProducts([]);
      return;
    }

    const controller = new AbortController();
    fetchSupplierProducts(formValues.supplierId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setSupplierProducts(Array.isArray(data) ? data : []);
        }
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") {
          return;
        }
        setSupplierProducts([]);
      });

    return () => controller.abort();
  }, [formValues.action, formValues.supplierId]);

  useEffect(() => {
    setFormValues((previous) => ({
      ...previous,
      productId: "",
    }));
  }, [formValues.action, formValues.supplierId]);

  const saveReorderDraft = (draft) => {
    setReorderDraft(draft);
    localStorage.setItem(REORDER_STORAGE_KEY, JSON.stringify(draft));
  };

  const clearReorderDraft = () => {
    saveReorderDraft({ items: [] });
    setDraftFeedback("Reorder draft cleared.");
  };

  const addToReorderDraft = (item) => {
    if (!item?.productId || !item?.suggestedQty) {
      return;
    }
    setReorderDraft((prev) => {
      const items = Array.isArray(prev.items) ? [...prev.items] : [];
      const existingIndex = items.findIndex(
        (entry) =>
          entry.productId === item.productId &&
          String(entry.supplierId ?? "") === String(item.supplierId ?? "")
      );
      if (existingIndex >= 0) {
        const existing = items[existingIndex];
        items[existingIndex] = {
          ...existing,
          suggestedQty: Math.max(existing.suggestedQty, item.suggestedQty),
        };
      } else {
        items.push({
          ...item,
          createdAt: new Date().toISOString(),
        });
      }
      const nextDraft = { items };
      localStorage.setItem(REORDER_STORAGE_KEY, JSON.stringify(nextDraft));
      return nextDraft;
    });
    setDraftFeedback(`${item.productName} added to reorder draft.`);
  };

  const handleOrderNowClick = (item) => {
    addToReorderDraft(item);
    if (item?.supplierId) {
      localStorage.setItem(REORDER_SUPPLIER_KEY, String(item.supplierId));
    } else {
      localStorage.removeItem(REORDER_SUPPLIER_KEY);
    }
  };

  const summary = useMemo(() => {
    if (!stockLevels.length) {
      return { skuCount: 0, lowStockCount: 0, totalUnits: 0, reorderCount: 0, expiringSoonCount: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const uniqueProducts = new Set();
    let totalUnits = 0;
    let lowStockCount = 0;
    let reorderCount = 0;
    let expiringSoonCount = 0;

    stockLevels.forEach((row) => {
      const quantity = row.quantity ?? 0;
      totalUnits += quantity;
      if (quantity <= LOW_STOCK_THRESHOLD) {
        lowStockCount += 1;
      }

      const productId = row.productId ?? row.product?.productId ?? row.id ?? null;
      const key = productId != null ? String(productId) : null;
      const totalSales = key != null ? salesVelocity[key] ?? 0 : 0;
      const dailySales = totalSales / SALES_LOOKBACK_DAYS;
      const preferred = productId != null ? preferredSuppliers?.[productId] : null;
      const leadTimeDays = Number(
        preferred?.leadTimeDays ?? preferred?.lead_time_days ?? preferred?.leadTime
      );
      const resolvedLeadTime =
        Number.isFinite(leadTimeDays) && leadTimeDays > 0
          ? leadTimeDays
          : DEFAULT_LEAD_TIME_DAYS;
      if (dailySales > 0) {
        const reorderPoint = dailySales * (resolvedLeadTime + SAFETY_DAYS);
        if (quantity <= reorderPoint) {
          reorderCount += 1;
        }
      }

      // Count products with at least one non-empty batch expiring within 30 days
      const batches = Array.isArray(row.batches) ? row.batches : [];
      const hasExpiringSoon = batches.some((batch) => {
        if (!batch.expiryDate || (batch.quantityRemaining ?? 0) === 0) return false;
        const expiry = new Date(batch.expiryDate);
        return expiry >= today && expiry <= thirtyDaysFromNow;
      });
      if (hasExpiringSoon) {
        expiringSoonCount += 1;
      }

      if (row.productId != null) {
        uniqueProducts.add(row.productId);
      } else if (row.sku) {
        uniqueProducts.add(row.sku);
      } else if (row.productName) {
        uniqueProducts.add(row.productName);
      }
    });

    return {
      skuCount: uniqueProducts.size,
      totalUnits,
      lowStockCount,
      reorderCount,
      expiringSoonCount,
    };
  }, [preferredSuppliers, salesVelocity, stockLevels]);

  const purchaseOrderRemainingBySupplierProduct = useMemo(() => {
    const totals = {};
    (purchaseOrders ?? []).forEach((order) => {
      const status = String(order?.status ?? "OPEN").toUpperCase();
      if (status === "RECEIVED" || status === "CANCELLED") {
        return;
      }
      const locationId =
        order?.location?.id ?? order?.location?.locationId ?? null;
      if (locationId != null && Number(locationId) !== PRIMARY_LOCATION.id) {
        return;
      }
      const supplierId =
        order?.supplier?.id ?? order?.supplier?.supplierId ?? null;
      if (supplierId == null) {
        return;
      }
      const lines = order?.details ?? order?.purchaseOrderDetails ?? [];
      (lines ?? []).forEach((line) => {
        const productId =
          line?.product?.id ?? line?.product?.productId ?? line?.productId ?? null;
        if (productId == null) {
          return;
        }
        const orderedQty = Number(line?.quantity) || 0;
        const receivedQty = Number(line?.receivedQty) || 0;
        const remainingQty = Math.max(orderedQty - receivedQty, 0);
        const key = `${String(productId)}:${String(supplierId)}`;
        totals[key] = (totals[key] || 0) + remainingQty;
      });
    });
    return totals;
  }, [purchaseOrders]);

  const stockRows = useMemo(() => {
    return stockLevels.map((row, index) => {
      const quantity = row.quantity ?? 0;
      const isLow = quantity <= LOW_STOCK_THRESHOLD;
      const keyParts = [
        row.stockId,
        row.productId,
        row.sku,
        row.productName,
      ].filter(Boolean);
      const rowKey = keyParts.join("-") || `stock-${index}`;
      const productId = row.productId ?? row.product?.productId ?? row.id ?? null;
      const productKey = productId != null ? String(productId) : null;
      const totalSales = productKey != null ? salesVelocity[productKey] ?? 0 : 0;
      const dailySales = totalSales / SALES_LOOKBACK_DAYS;
      const preferred = productId != null ? preferredSuppliers?.[productId] : null;
      const supplierName =
        row.productId != null ? preferred?.supplierName ?? "-" : "-";
      const supplierTraffic = Array.isArray(row.supplierTraffic)
        ? row.supplierTraffic
        : [];
      const bestTrafficSupplier = supplierTraffic
        .slice()
        .sort(
          (a, b) =>
            (Number(b?.receivedQty) || 0) - (Number(a?.receivedQty) || 0)
        )[0];
      const supplierId =
        preferred?.supplierId ??
        preferred?.supplier_id ??
        preferred?.id ??
        bestTrafficSupplier?.supplierId ??
        bestTrafficSupplier?.supplier_id ??
        null;
      const supplierOptions = supplierTraffic.reduce((options, item) => {
        const id = item?.supplierId ?? item?.supplier_id ?? item?.id ?? null;
        if (id == null) {
          return options;
        }
        if (!options.some((entry) => String(entry.id) === String(id))) {
          options.push({
            id,
            name: item?.supplierName ?? `Supplier ${id}`,
          });
        }
        return options;
      }, []);
      if (
        supplierId != null &&
        !supplierOptions.some((entry) => String(entry.id) === String(supplierId))
      ) {
        supplierOptions.push({
          id: supplierId,
          name: supplierName ?? `Supplier ${supplierId}`,
        });
      }
      const leadTimeDays = Number(
        preferred?.leadTimeDays ?? preferred?.lead_time_days ?? preferred?.leadTime
      );
      const resolvedLeadTime =
        Number.isFinite(leadTimeDays) && leadTimeDays > 0
          ? leadTimeDays
          : DEFAULT_LEAD_TIME_DAYS;
      const hasSalesData = dailySales > 0;
      const daysCover = hasSalesData ? quantity / dailySales : null;
      const reorderPoint =
        hasSalesData ? dailySales * (resolvedLeadTime + SAFETY_DAYS) : null;
      const reorderQty =
        reorderPoint != null ? Math.max(Math.ceil(reorderPoint - quantity), 0) : 0;

      return {
        row,
        rowKey,
        quantity,
        isLow,
        productId,
        productName: row.productName ?? "Unnamed product",
        skuLine: row.sku ? `SKU: ${row.sku}` : null,
        categoryName: row.categoryName ?? "-",
        supplierName,
        supplierId,
        preferred,
        resolvedLeadTime,
        hasSalesData,
        daysCover,
        reorderQty,
        lastUpdated: row.lastUpdated,
        supplierTraffic,
        supplierOptions,
        batches: Array.isArray(row.batches) ? row.batches : [],
      };
    });
  }, [preferredSuppliers, salesVelocity, stockLevels]);

  const filteredStockRows = useMemo(() => {
    let rows = [...stockRows];
    if (filters.search) {
      const needle = filters.search.trim().toLowerCase();
      rows = rows.filter((item) => {
        const haystack = [
          item.productName,
          item.skuLine,
          item.categoryName,
          item.supplierName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      });
    }
    if (filters.supplier) {
      rows = rows.filter((item) => item.supplierName === filters.supplier);
    }
    if (filters.category) {
      rows = rows.filter((item) => item.categoryName === filters.category);
    }
    if (filters.stockStatus === "low") {
      rows = rows.filter((item) => item.isLow);
    }
    if (filters.stockStatus === "reorder") {
      rows = rows.filter((item) => item.reorderQty > 0);
    }
    switch (filters.sort) {
      case "low-stock":
        rows.sort((a, b) => a.quantity - b.quantity);
        break;
      case "reorder":
        rows.sort((a, b) => b.reorderQty - a.reorderQty);
        break;
      case "alpha":
        rows.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case "urgent":
      default:
        rows.sort((a, b) => {
          const aDays = a.daysCover ?? Number.POSITIVE_INFINITY;
          const bDays = b.daysCover ?? Number.POSITIVE_INFINITY;
          if (aDays !== bDays) {
            return aDays - bDays;
          }
          return b.reorderQty - a.reorderQty;
        });
        break;
    }
    return rows;
  }, [filters, stockRows]);

  const supplierFilterOptions = useMemo(() => {
    const set = new Set();
    stockRows.forEach((row) => {
      if (row.supplierName && row.supplierName !== "-") {
        set.add(row.supplierName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [stockRows]);

  const categoryFilterOptions = useMemo(() => {
    const set = new Set();
    stockRows.forEach((row) => {
      if (row.categoryName && row.categoryName !== "-") {
        set.add(row.categoryName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [stockRows]);

  const productOptions = useMemo(() => {
    if (formValues.action === "add") {
      if (!formValues.supplierId) {
        return [];
      }
      return (supplierProducts ?? [])
        .map((product) => ({
          id: product.productId,
          name: product.productName ?? "Unnamed product",
        }))
        .filter((option) => option.id != null);
    }

    if (products.length) {
      return products
        .map((product) => ({
          id: product.productId ?? product.id,
          name: product.name ?? "Unnamed product",
        }))
        .filter((option) => option.id != null);
    }

    return stockLevels
      .map((row) => ({
        id: row.productId,
        name: row.productName ?? row.sku ?? "Unnamed product",
      }))
      .filter((option) => option.id != null);
  }, [formValues.action, formValues.supplierId, products, stockLevels, supplierProducts]);

  const refreshStockLevels = async () => {
    try {
      setLoading(true);
      const [updated, orderData] = await Promise.all([
        resolveStockLevels(),
        fetchPurchaseOrders(),
      ]);
      const normalizedStock = Array.isArray(updated?.rows) ? updated.rows : [];
      setStockLevels(normalizedStock);
      setPurchaseOrders(Array.isArray(orderData) ? orderData : []);
      setUsedFallback(Boolean(updated?.usedFallback));
      await loadPreferredSuppliers(normalizedStock);
      const scopedLocationId = updated?.usedFallback ? undefined : PRIMARY_LOCATION.id;
      await loadSalesVelocity(undefined, scopedLocationId);
      setError(null);
    } catch (refreshError) {
      setError(refreshError.message || "Unable to load stock levels");
      setStockLevels([]);
      setPreferredSuppliers({});
      setSalesVelocity({});
      setPurchaseOrders([]);
      setUsedFallback(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (rowKey) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  const getRemainingForSupplierProduct = (supplierId, productId) => {
    if (!supplierId || !productId) {
      return 0;
    }
    const key = `${String(productId)}:${String(supplierId)}`;
    return purchaseOrderRemainingBySupplierProduct[key] ?? 0;
  };

  const handleAdjustChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => {
      const next = {
        ...previous,
        [name]: value,
        ...(name === "action" && value === "remove" ? { supplierId: "" } : null),
      };
      if (
        next.action === "add" &&
        (name === "productId" || name === "supplierId" || name === "action")
      ) {
        const remaining = getRemainingForSupplierProduct(next.supplierId, next.productId);
        next.quantity = remaining ? String(remaining) : "";
      }
      return next;
    });
  };

  const handleAdjustSubmit = async (event) => {
    event.preventDefault();

    const quantityNumber = Number(formValues.quantity);
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      setAdjustError("Quantity must be greater than zero.");
      return;
    }

    if (!formValues.productId) {
      setAdjustError("Select a product.");
      return;
    }

    if (formValues.action === "add" && !formValues.supplierId) {
      setAdjustError("Select a supplier for stock receipts.");
      return;
    }

    // Build the payload for adjustStock. Receiving stock uses RECEIVE (creates a FIFO
    // batch and validates the supplier relationship). Removing stock uses WRITE_OFF
    // (deducts FIFO batches without counting the removal as a sale, keeping sales
    // velocity accurate).
    const isAdd = formValues.action === "add";
    const payload = {
      productId: Number(formValues.productId),
      locationId: PRIMARY_LOCATION.id,
      quantity: quantityNumber,
      movementType: isAdd ? "RECEIVE" : "WRITE_OFF",
      reference: isAdd ? "Manual receive" : "Manual write-off",
    };

    if (isAdd) {
      payload.supplierId = Number(formValues.supplierId);
      const parsedCost = Number(formValues.unitCost);
      if (Number.isFinite(parsedCost) && parsedCost > 0) {
        payload.unitCost = parsedCost;
      }
      if (formValues.expiryDate) {
        payload.expiryDate = formValues.expiryDate;
      }
    }

    const trimmedNote = formValues.note.trim();
    if (trimmedNote) {
      payload.note = trimmedNote;
    }

    try {
      setAdjustError(null);
      setAdjustFeedback(null);
      setAdjusting(true);
      await adjustStock(payload);
      setAdjustFeedback(
        isAdd ? "Stock received successfully." : "Stock removed successfully."
      );
      setFormValues((previous) => ({
        ...previous,
        quantity: "",
        note: "",
        unitCost: "",
        expiryDate: "",
      }));
      await refreshStockLevels();
    } catch (submitError) {
      setAdjustError(submitError.message || "Unable to adjust stock.");
    } finally {
      setAdjusting(false);
    }
  };

  const renderRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className="text-center text-secondary py-4">
            Loading stock levels...
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

    if (!stockLevels.length) {
      return (
        <tr>
          <td colSpan={7} className="text-center text-secondary py-4">
            No stock information for {PRIMARY_LOCATION.name}.
          </td>
        </tr>
      );
    }

    if (!filteredStockRows.length) {
      return (
        <tr>
          <td colSpan={7} className="text-center text-secondary py-4">
            No stock items match the current filters.
          </td>
        </tr>
      );
    }

    return filteredStockRows.flatMap((row) => {
      const {
        rowKey,
        quantity,
        isLow,
        productId,
        productName,
        skuLine,
        categoryName,
        supplierName,
        supplierId,
        resolvedLeadTime,
        hasSalesData,
        daysCover,
        reorderQty,
        lastUpdated,
        supplierOptions,
        batches,
      } = row;
      const selection = orderSelections[rowKey] ?? {};
      const selectedSupplierId =
        selection.supplierId ?? (supplierId != null ? String(supplierId) : "");
      const selectedQty = selection.qty ?? (reorderQty > 0 ? String(reorderQty) : "");
      const canOrderNow =
        productId != null &&
        Number(selectedQty) > 0 &&
        Boolean(selectedSupplierId);
      const isExpanded = expandedRows.has(rowKey);
      const batchCount = batches.length;

      const mainRow = (
        <tr key={rowKey}>
          <td>
            <div className="fw-semibold">{productName}</div>
            {skuLine && <div className="text-secondary small">{skuLine}</div>}
            {batchCount > 0 && (
              <button
                className="btn btn-link btn-sm p-0 text-secondary"
                style={{ fontSize: "0.75rem" }}
                onClick={() => toggleRow(rowKey)}
                type="button"
              >
                {isExpanded ? "▲" : "▼"} {batchCount} batch{batchCount !== 1 ? "es" : ""}
              </button>
            )}
          </td>
          <td>{categoryName}</td>
          <td>{supplierName}</td>
          <td className={isLow ? "text-danger fw-semibold" : ""}>
            {quantity}
            {isLow ? (
              <span className="badge bg-danger-subtle text-danger ms-2">
                Low
              </span>
            ) : null}
          </td>
          <td>
            {reorderQty > 0 ? (
              <div>
                <span className="badge bg-warning-subtle text-warning">
                  Reorder {reorderQty}
                </span>
                <div className="text-secondary small">
                  Lead time {resolvedLeadTime}d
                </div>
              </div>
            ) : !hasSalesData && isLow ? (
              <span className="badge bg-info-subtle text-info">Review</span>
            ) : (
              <span className="text-secondary">-</span>
            )}
          </td>
          <td>{formatDateTime(lastUpdated)}</td>
          <td className="text-end">
            <div className="d-flex flex-column gap-2 align-items-end">
              <select
                className="form-select form-select-sm"
                value={selectedSupplierId}
                onChange={(event) =>
                  setOrderSelections((prev) => ({
                    ...prev,
                    [rowKey]: {
                      ...selection,
                      supplierId: event.target.value,
                    },
                  }))
                }
                disabled={!supplierOptions.length}
                aria-label="Select supplier"
              >
                <option value="">Select supplier</option>
                {supplierOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                step="1"
                className="form-control form-control-sm"
                value={selectedQty}
                onChange={(event) =>
                  setOrderSelections((prev) => ({
                    ...prev,
                    [rowKey]: {
                      ...selection,
                      qty: event.target.value,
                    },
                  }))
                }
                placeholder="Qty"
                aria-label="Order quantity"
              />
              <a
                className={`btn btn-outline-primary btn-sm ${!canOrderNow ? "disabled" : ""}`}
                href="/purchasing/purchase-orders"
                onClick={(event) => {
                  if (!canOrderNow) {
                    event.preventDefault();
                    return;
                  }
                  handleOrderNowClick({
                    productId,
                    productName,
                    supplierId: selectedSupplierId,
                    supplierName:
                      supplierOptions.find(
                        (option) => String(option.id) === String(selectedSupplierId)
                      )?.name ?? supplierName,
                    suggestedQty: Number(selectedQty),
                  });
                }}
                aria-disabled={!canOrderNow}
              >
                Order now
              </a>
            </div>
          </td>
        </tr>
      );

      const batchRow = isExpanded && batchCount > 0 ? (
        <tr key={`${rowKey}-batches`}>
          <td colSpan={7} className="p-0">
            <div className="px-3 py-2" style={{ background: "#f8f9fa" }}>
              <div className="fw-semibold text-secondary mb-2" style={{ fontSize: "0.8rem" }}>
                FIFO Batch Breakdown — oldest batches are deducted first on sale
              </div>
              <table className="table table-sm table-bordered mb-0" style={{ fontSize: "0.8rem" }}>
                <thead className="table-secondary">
                  <tr>
                    <th>Batch #</th>
                    <th>Received</th>
                    <th>Supplier</th>
                    <th>PO #</th>
                    <th>Qty Received</th>
                    <th>Qty Remaining</th>
                    <th>Unit Cost</th>
                    <th>Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch, i) => {
                    const exhausted = batch.quantityRemaining === 0;
                    return (
                      <tr
                        key={batch.batchId ?? i}
                        className={exhausted ? "text-secondary" : ""}
                      >
                        <td>{batch.batchId}</td>
                        <td>{batch.receivedDate ?? "-"}</td>
                        <td>{batch.supplierName ?? "-"}</td>
                        <td>{batch.purchaseOrderId ?? "-"}</td>
                        <td>{batch.quantityReceived}</td>
                        <td>
                          <span
                            className={`badge ${exhausted ? "bg-secondary" : "bg-success"}`}
                          >
                            {batch.quantityRemaining}
                          </span>
                        </td>
                        <td>
                          {batch.unitCost != null
                            ? `$${Number(batch.unitCost).toFixed(2)}`
                            : "-"}
                        </td>
                        <td>
                          {batch.expiryDate ? (
                            <span
                              className={`badge ${new Date(batch.expiryDate) < new Date() ? "bg-danger" : "bg-warning text-dark"}`}
                            >
                              {batch.expiryDate}
                            </span>
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ) : null;

      return [mainRow, batchRow].filter(Boolean);
    });
  };

  return (
    <div className="page">
      <h2 className="mb-3">Store Stock Levels</h2>
      <div className="text-secondary font-12 mb-4">
        Tracking on-hand quantities for {PRIMARY_LOCATION.name}. Movements from
        sales or receipts update this table automatically.
      </div>

      {draftFeedback && (
        <div className="alert alert-success" role="alert">
          {draftFeedback}
        </div>
      )}

      {usedFallback && !loading && !error && (
        <div className="alert alert-info">
          Showing stock across all locations because no entries exist for
          {" "}
          {PRIMARY_LOCATION.name}. Post a manual receive or complete a paid
          order to seed this location.
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary text-uppercase font-12 mb-1">
                Active SKUs
              </div>
              <div className="fs-3 fw-bold">{summary.skuCount}</div>
              <div className="text-secondary font-12">
                Available at {PRIMARY_LOCATION.name}
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary text-uppercase font-12 mb-1">
                Units On Hand
              </div>
              <div className="fs-3 fw-bold">{summary.totalUnits}</div>
              <div className="text-secondary font-12">Ready for sale today</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary text-uppercase font-12 mb-1">
                Low Stock Alerts
              </div>
              <div className="fs-3 fw-bold text-danger">
                {summary.lowStockCount}
              </div>
              <div className="text-secondary font-12">
                Items {"<="} {LOW_STOCK_THRESHOLD} units
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary text-uppercase font-12 mb-1">
                Reorder Now
              </div>
              <div className="fs-3 fw-bold text-warning">
                {summary.reorderCount}
              </div>
              <div className="text-secondary font-12">
                Based on last {SALES_LOOKBACK_DAYS} days
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary text-uppercase font-12 mb-1">
                Expiring Soon
              </div>
              <div className={`fs-3 fw-bold ${summary.expiringSoonCount > 0 ? "text-warning" : ""}`}>
                {summary.expiringSoonCount}
              </div>
              <div className="text-secondary font-12">
                Products with batch expiring in 30 days
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-header bg-white">
          <span className="fw-semibold">Manual stock adjustment</span>
        </div>
        <div className="card-body">
          {adjustFeedback && (
            <div className="alert alert-success py-2">{adjustFeedback}</div>
          )}
          {adjustError && (
            <div className="alert alert-danger py-2">{adjustError}</div>
          )}
          <form className="row g-3 align-items-end" onSubmit={handleAdjustSubmit}>
            <div className="col-md-2">
              <label className="form-label">Action</label>
              <select
                name="action"
                className="form-select"
                value={formValues.action}
                onChange={handleAdjustChange}
              >
                <option value="add">Receive stock</option>
                <option value="remove">Remove stock</option>
              </select>
            </div>
            {formValues.action === "add" && (
              <div className="col-md-2">
                <label className="form-label">Supplier</label>
                <select
                  name="supplierId"
                  className="form-select"
                  value={formValues.supplierId}
                  onChange={handleAdjustChange}
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.supplierId} value={s.supplierId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-md-2">
              <label className="form-label">Product</label>
              <select
                name="productId"
                className="form-select"
                value={formValues.productId}
                onChange={handleAdjustChange}
              >
                <option value="">Select product</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-1">
              <label className="form-label">Qty</label>
              <input
                type="number"
                name="quantity"
                min="1"
                className="form-control"
                value={formValues.quantity}
                onChange={handleAdjustChange}
                placeholder="0"
              />
            </div>
            {formValues.action === "add" && (
              <>
                <div className="col-md-2">
                  <label className="form-label">
                    Unit cost
                    <span className="text-secondary ms-1" style={{ fontSize: "0.7rem" }}>(optional)</span>
                  </label>
                  <input
                    type="number"
                    name="unitCost"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={formValues.unitCost}
                    onChange={handleAdjustChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">
                    Expiry date
                    <span className="text-secondary ms-1" style={{ fontSize: "0.7rem" }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    className="form-control"
                    value={formValues.expiryDate}
                    onChange={handleAdjustChange}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </>
            )}
            <div className="col-md-2">
              <label className="form-label">Note</label>
              <input
                type="text"
                name="note"
                className="form-control"
                value={formValues.note}
                onChange={handleAdjustChange}
                placeholder="Optional note"
              />
            </div>
            <div className="col-md-1">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={adjusting}
              >
                {adjusting ? "..." : "Apply"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by product, SKU, supplier..."
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: event.target.value,
                  }))
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Supplier</label>
              <select
                className="form-select"
                value={filters.supplier}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    supplier: event.target.value,
                  }))
                }
              >
                <option value="">All suppliers</option>
                {supplierFilterOptions.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={filters.category}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    category: event.target.value,
                  }))
                }
              >
                <option value="">All categories</option>
                {categoryFilterOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.stockStatus}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    stockStatus: event.target.value,
                  }))
                }
              >
                <option value="all">All stock</option>
                <option value="low">Low stock</option>
                <option value="reorder">Reorder needed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Quantity</th>
                <th>Reorder</th>
                <th>Last Updated</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockLevels;
