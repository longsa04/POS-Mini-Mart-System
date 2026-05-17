import { useEffect, useMemo, useRef, useState } from "react";
import { fetchSuppliers, fetchSupplierProducts } from "../../../api/suppliers";
import { fetchLocations } from "../../../api/locations";
import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  fetchPurchaseOrders,
  receivePurchaseOrder,
} from "../../../api/purchaseOrders";

const todayISO = () => new Date().toISOString().slice(0, 10);
const REORDER_STORAGE_KEY = "mm.reorderDraft";
const REORDER_SUPPLIER_KEY = "mm.reorderSupplier";

const blankLine = {
  productId: "",
  quantity: "",
  price: "",
};

const resolveLeadTimeDays = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [receivingOrderId, setReceivingOrderId] = useState(null);
  const [receiveLines, setReceiveLines] = useState([]);
  const [receiveError, setReceiveError] = useState(null);
  const [receiving, setReceiving] = useState(false);
  const [reorderDraft, setReorderDraft] = useState({ items: [] });
  const autoImportedRef = useRef(false);
  const [cancelling, setCancelling] = useState(null);
  const [pendingSupplierId, setPendingSupplierId] = useState(null);

  const [form, setForm] = useState({
    supplierId: "",
    locationId: "",
    orderDate: todayISO(),
  });
  const [lines, setLines] = useState([{ ...blankLine }]);

  const defaultLocationId = useMemo(() => {
    const first = (Array.isArray(locations) ? locations : []).find(
      (location) => location?.locationId != null || location?.id != null
    );
    if (!first) {
      return "";
    }
    const id = first.locationId ?? first.id;
    return id != null ? String(id) : "";
  }, [locations]);


  const loadLookups = async (signal) => {
    const [supplierData, locationData] = await Promise.all([
      fetchSuppliers({ signal }).catch(() => []),
      fetchLocations({ signal }).catch(() => []),
    ]);

    if (signal?.aborted) return;
    setSuppliers(supplierData ?? []);
    setLocations(locationData ?? []);
  };

  const loadOrders = async ({ signal, start, end } = {}) => {
    setError(null);
    try {
      const data = await fetchPurchaseOrders({ start, end, signal });
      if (signal?.aborted) return;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Unable to load purchase orders.");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    Promise.all([loadLookups(controller.signal), loadOrders({ signal: controller.signal })])
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

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
    if (form.supplierId) {
      return;
    }
    const preferredSupplier = localStorage.getItem(REORDER_SUPPLIER_KEY);
    if (!preferredSupplier) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      supplierId: preferredSupplier,
    }));
    localStorage.removeItem(REORDER_SUPPLIER_KEY);
  }, [form.supplierId]);

  useEffect(() => {
    if (form.supplierId) {
      return;
    }
    if (!(reorderDraft.items ?? []).length) {
      return;
    }
    const candidates = new Set();
    (reorderDraft.items ?? []).forEach((item) => {
      if (item?.supplierId != null) {
        candidates.add(String(item.supplierId));
        return;
      }
      if (item?.supplierName) {
        const match = (suppliers ?? []).find(
          (supplier) => supplier?.name === item.supplierName
        );
        if (match?.supplierId != null || match?.id != null) {
          candidates.add(String(match?.supplierId ?? match?.id));
        }
      }
    });
    if (candidates.size === 1) {
      const [supplierId] = Array.from(candidates);
      setForm((prev) => ({
        ...prev,
        supplierId,
      }));
    }
  }, [form.supplierId, reorderDraft.items, suppliers]);

  useEffect(() => {
    if (!form.locationId && defaultLocationId) {
      setForm((prev) => ({
        ...prev,
        locationId: defaultLocationId,
      }));
    }
  }, [defaultLocationId, form.locationId]);

  useEffect(() => {
    if (!form.supplierId) {
      setSupplierProducts([]);
      return;
    }

    const controller = new AbortController();
    fetchSupplierProducts(form.supplierId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setSupplierProducts(Array.isArray(data) ? data : []);
          setLines([{ ...blankLine }]);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Unable to load supplier products.");
        setSupplierProducts([]);
      });

    return () => controller.abort();
  }, [form.supplierId]);


  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 2500);
    return () => clearTimeout(timer);
  }, [success]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    if (name === "supplierId") {
      const hasFilledLines = lines.some((line) => line.productId);
      if (hasFilledLines && value && value !== form.supplierId) {
        // Prompt confirmation before discarding existing order lines
        setPendingSupplierId(value);
        return;
      }
      // No filled lines — safe to switch immediately; reset auto-import so draft
      // items are picked up again for the new supplier.
      autoImportedRef.current = false;
    }
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const confirmSupplierChange = () => {
    autoImportedRef.current = false;
    setForm((prev) => ({ ...prev, supplierId: pendingSupplierId }));
    setLines([{ ...blankLine }]);
    setPendingSupplierId(null);
  };

  const cancelSupplierChange = () => {
    setPendingSupplierId(null);
  };

  const handleLineChange = (index, field, value) => {
    setLines((prev) => {
      const updated = [...prev];
      const nextLine = {
        ...updated[index],
        [field]: value,
      };
      if (field === "productId") {
        const selected = productOptionMap[value] ?? null;
        const costPrice = selected?.costPrice;
        nextLine.price =
          costPrice != null && costPrice !== ""
            ? String(costPrice)
            : "";
      }
      updated[index] = nextLine;
      return updated;
    });
  };

  const addLine = () => {
    setLines((prev) => [...prev, { ...blankLine }]);
  };

  const removeLine = (index) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setForm({
      supplierId: "",
      locationId: defaultLocationId,
      orderDate: todayISO(),
    });
    setLines([{ ...blankLine }]);
  };

  const startReceive = (order) => {
    const orderId = order?.poId ?? order?.purchaseOrderId ?? order?.id;
    if (!orderId) return;
    const detailLines = (order?.details ?? []).map((detail) => {
      const orderedQty = Number(detail?.quantity) || 0;
      const receivedQty = Number(detail?.receivedQty) || 0;
      const remainingQty = Math.max(orderedQty - receivedQty, 0);
      return {
        detailId: detail?.id,
        productName: detail?.product?.name ?? "Product",
        orderedQty,
        receivedQty,
        remainingQty,
        unitCost: detail?.price ?? null,
        receiveQty: "",
        expiryDate: "",
      };
    });
    setReceivingOrderId(orderId);
    setReceiveLines(detailLines);
    setReceiveError(null);
  };

  const handleCancel = async (order) => {
    const orderId = order?.poId ?? order?.purchaseOrderId ?? order?.id;
    if (!orderId) return;
    if (!window.confirm(`Cancel purchase order #${orderId}? This action cannot be undone.`)) return;

    setError(null);
    setCancelling(orderId);
    try {
      await cancelPurchaseOrder(orderId);
      setSuccess(`Purchase order #${orderId} cancelled.`);
      await loadOrders({
        start: filterStart || undefined,
        end: filterEnd || undefined,
      });
    } catch (err) {
      setError(err.message || "Unable to cancel purchase order.");
    } finally {
      setCancelling(null);
    }
  };

  const cancelReceive = () => {
    setReceivingOrderId(null);
    setReceiveLines([]);
    setReceiveError(null);
  };

  const handleReceiveLineChange = (index, value) => {
    setReceiveLines((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        receiveQty: value,
      };
      return updated;
    });
  };

  const handleReceiveExpiryChange = (index, value) => {
    setReceiveLines((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        expiryDate: value,
      };
      return updated;
    });
  };

  const receiveAllRemaining = () => {
    setReceiveLines((prev) =>
      prev.map((line) => ({
        ...line,
        receiveQty: line.remainingQty > 0 ? String(line.remainingQty) : "",
      }))
    );
  };

  const submitReceive = async () => {
    if (!receivingOrderId) return;
    setReceiveError(null);

    const payloadLines = receiveLines
      .map((line) => ({
        detailId: line.detailId,
        receivedQty: Number(line.receiveQty),
        remainingQty: line.remainingQty,
        expiryDate: line.expiryDate || null,
      }))
      .filter(
        (line) =>
          line.detailId &&
          Number.isFinite(line.receivedQty) &&
          line.receivedQty > 0
      );

    if (payloadLines.length === 0) {
      setReceiveError("Enter a received quantity for at least one line.");
      return;
    }

    const invalidLine = payloadLines.find((line) => line.receivedQty > line.remainingQty);
    if (invalidLine) {
      setReceiveError("Received quantity cannot exceed remaining quantity.");
      return;
    }

    setReceiving(true);
    try {
      await receivePurchaseOrder(receivingOrderId, {
        lines: payloadLines.map(({ detailId, receivedQty, expiryDate }) => ({
          detailId,
          receivedQty,
          ...(expiryDate ? { expiryDate } : {}),
        })),
      });
      setSuccess("Purchase order received.");
      await loadOrders({
        start: filterStart || undefined,
        end: filterEnd || undefined,
      });
      cancelReceive();
    } catch (err) {
      setReceiveError(err.message || "Unable to receive purchase order.");
    } finally {
      setReceiving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.supplierId) {
      setError("Select a supplier to create a purchase order.");
      return;
    }

    if (!form.locationId) {
      setError("Select a destination branch for this purchase order.");
      return;
    }

    const orderLines = lines
      .map((line) => ({
        productId: line.productId ? Number(line.productId) : null,
        quantity: Number(line.quantity),
        price: Number(line.price),
      }))
      .filter((line) =>
        line.productId &&
        Number.isFinite(line.quantity) &&
        line.quantity > 0 &&
        Number.isFinite(line.price) &&
        line.price >= 0
      );

    if (orderLines.length === 0) {
      setError("Add at least one product line with quantity and price.");
      return;
    }

    const seen = new Set();
    const duplicates = new Set();
    lines.forEach((line) => {
      if (!line.productId) return;
      if (seen.has(line.productId)) {
        duplicates.add(line.productId);
      } else {
        seen.add(line.productId);
      }
    });
    if (duplicates.size > 0) {
      const names = Array.from(duplicates)
        .map((id) => productOptionMap[id]?.name ?? `Product ${id}`)
        .join(", ");
      setError(`Duplicate products selected: ${names}.`);
      return;
    }

    const total = orderLines.reduce(
      (sum, line) => sum + line.quantity * line.price,
      0
    );

    const payload = {
      supplierId: Number(form.supplierId),
      locationId: form.locationId ? Number(form.locationId) : null,
      total,
      orderDate: form.orderDate ? new Date(form.orderDate).toISOString() : new Date().toISOString(),
      details: orderLines,
    };

    setSubmitting(true);
    try {
      await createPurchaseOrder(payload);
      setSuccess("Purchase order created.");
      await loadOrders({
        start: filterStart || undefined,
        end: filterEnd || undefined,
      });
      resetForm();
    } catch (err) {
      setError(err.message || "Unable to create purchase order.");
    } finally {
      setSubmitting(false);
    }
  };

  const applyFilter = async () => {
    const controller = new AbortController();
    setLoading(true);
    loadOrders({
      signal: controller.signal,
      start: filterStart || undefined,
      end: filterEnd || undefined,
    }).finally(() => {
      setLoading(false);
    });
  };

  const supplierOptions = useMemo(
    () =>
      (suppliers ?? []).map((supplier) => ({
        id: supplier?.supplierId,
        name: supplier?.name ?? `Supplier ${supplier?.supplierId ?? ""}`,
      })),
    [suppliers]
  );

  const locationOptions = useMemo(
    () =>
      (locations ?? []).map((location) => ({
        id: location?.locationId,
        name: location?.name ?? `Location ${location?.locationId ?? ""}`,
      })),
    [locations]
  );

  const productOptions = useMemo(() => {
    if (!form.supplierId) {
      return [];
    }
    return (supplierProducts ?? []).map((product) => ({
      id: product?.productId,
      name: product?.productName ?? `Product ${product?.productId ?? ""}`,
      costPrice: product?.costPrice ?? product?.cost_price,
      leadTimeDays: resolveLeadTimeDays(product?.leadTimeDays ?? product?.lead_time_days),
      vendorSku: product?.vendorSku ?? product?.vendor_sku,
    }));
  }, [form.supplierId, supplierProducts]);

  const productOptionMap = useMemo(() => {
    return productOptions.reduce((acc, option) => {
      acc[option.id] = option;
      return acc;
    }, {});
  }, [productOptions]);

  const draftItemsForSupplier = useMemo(() => {
    if (!form.supplierId) {
      return [];
    }
    const supplierId = String(form.supplierId);
    const productIds = new Set(productOptions.map((product) => String(product.id)));
    return (reorderDraft.items ?? [])
      .filter((item) => {
        if (!item.productId) return false;
        const matchesSupplier =
          item.supplierId != null ? String(item.supplierId) === supplierId : true;
        return matchesSupplier && productIds.has(String(item.productId));
      })
      .map((item) => ({
        ...item,
        productId: String(item.productId),
      }));
  }, [form.supplierId, productOptions, reorderDraft.items]);

  const orderStatusSummary = useMemo(() => {
    const summary = {
      OPEN: 0,
      PARTIAL: 0,
      RECEIVED: 0,
      CANCELLED: 0,
    };
    orders.forEach((order) => {
      const status = String(order?.status ?? "OPEN").toUpperCase();
      if (summary[status] != null) {
        summary[status] += 1;
      }
    });
    return summary;
  }, [orders]);

  const orderSummary = useMemo(() => {
    const totals = {
      totalUnits: 0,
      subtotal: 0,
      maxLeadTimeDays: null,
      eta: null,
    };

    lines.forEach((line) => {
      const quantity = Number(line.quantity);
      const price = Number(line.price);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return;
      }
      totals.totalUnits += quantity;
      if (Number.isFinite(price) && price >= 0) {
        totals.subtotal += quantity * price;
      }
      const leadTimeDays = productOptionMap[line.productId]?.leadTimeDays;
      if (leadTimeDays != null) {
        totals.maxLeadTimeDays =
          totals.maxLeadTimeDays != null
            ? Math.max(totals.maxLeadTimeDays, leadTimeDays)
            : leadTimeDays;
      }
    });

    if (form.orderDate && totals.maxLeadTimeDays != null) {
      const baseDate = new Date(form.orderDate);
      if (!Number.isNaN(baseDate.getTime())) {
        const eta = new Date(baseDate);
        eta.setDate(eta.getDate() + totals.maxLeadTimeDays);
        totals.eta = eta.toLocaleDateString();
      }
    }

    return totals;
  }, [form.orderDate, lines, productOptionMap]);

  const getStatusBadge = (status) => {
    const normalized = String(status ?? "OPEN").toUpperCase();
    switch (normalized) {
      case "RECEIVED":
        return "bg-success-subtle text-success";
      case "CANCELLED":
        return "bg-secondary-subtle text-secondary";
      case "PARTIAL":
        return "bg-info-subtle text-info";
      case "OPEN":
        return "bg-warning-subtle text-warning";
      default:
        return "bg-light text-dark";
    }
  };

  const saveReorderDraft = (draft) => {
    setReorderDraft(draft);
    localStorage.setItem(REORDER_STORAGE_KEY, JSON.stringify(draft));
  };

  const importDraftLines = () => {
    if (!draftItemsForSupplier.length) {
      return;
    }

    setLines((prev) => {
      const existing = [...prev];
      const lineMap = existing.reduce((acc, line, index) => {
        if (line.productId) {
          acc[String(line.productId)] = index;
        }
        return acc;
      }, {});

      const importedIds = new Set();
      draftItemsForSupplier.forEach((item) => {
        const productId = String(item.productId);
        const option = productOptionMap[productId];
        const qty = Number(item.suggestedQty) || 0;
        if (!option || qty <= 0) {
          return;
        }
        importedIds.add(productId);
        const price =
          option.costPrice != null && option.costPrice !== ""
            ? String(option.costPrice)
            : "";
        if (lineMap[productId] != null) {
          const idx = lineMap[productId];
          const currentQty = Number(existing[idx].quantity) || 0;
          existing[idx] = {
            ...existing[idx],
            quantity: String(Math.max(currentQty, qty)),
            price: existing[idx].price || price,
          };
        } else {
          existing.push({
            productId,
            quantity: String(qty),
            price,
          });
        }
      });

      const filtered = existing.filter(
        (line) =>
          line.productId || line.quantity || line.price
      );
      return filtered.length ? filtered : [{ ...blankLine }];
    });

    const importedKeys = new Set(
      draftItemsForSupplier.map(
        (draft) => `${String(draft.productId)}:${String(draft.supplierId ?? "")}`
      )
    );
    const remaining = (reorderDraft.items ?? []).filter(
      (item) =>
        !importedKeys.has(
          `${String(item.productId)}:${String(item.supplierId ?? "")}`
        )
    );
    saveReorderDraft({ items: remaining });
    setSuccess("Reorder draft imported into this purchase order.");
  };

  useEffect(() => {
    if (!draftItemsForSupplier.length) {
      return;
    }
    if (autoImportedRef.current) {
      return;
    }
    if (!productOptions.length) {
      return;
    }
    autoImportedRef.current = true;
    importDraftLines();
  }, [draftItemsForSupplier, productOptions]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") {
      return orders;
    }
    return orders.filter(
      (order) => String(order?.status ?? "OPEN").toUpperCase() === statusFilter
    );
  }, [orders, statusFilter]);

  return (
    <div className="page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-1">Purchase Orders</h2>
          <p className="text-secondary font-12 mb-0">
            Record incoming stock orders and track supplier deliveries.
          </p>
        </div>
        <div className="d-flex gap-2">
          <input
            type="date"
            className="form-control form-control-sm"
            value={filterStart}
            onChange={(event) => setFilterStart(event.target.value)}
          />
          <input
            type="date"
            className="form-control form-control-sm"
            value={filterEnd}
            onChange={(event) => setFilterEnd(event.target.value)}
          />
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={applyFilter}>
            Filter
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && (
        <div className="alert alert-success d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span>{success}</span>
          {success === "Purchase order received." && (
            <a href="/inventory/stock-levels" className="alert-link text-nowrap">
              View stock levels →
            </a>
          )}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary text-uppercase font-12 mb-1">Open</div>
              <div className="fs-4 fw-bold">{orderStatusSummary.OPEN}</div>
              <div className="text-secondary font-12">Awaiting delivery</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary text-uppercase font-12 mb-1">Partial</div>
              <div className="fs-4 fw-bold text-info">{orderStatusSummary.PARTIAL}</div>
              <div className="text-secondary font-12">Receiving in progress</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary text-uppercase font-12 mb-1">Received</div>
              <div className="fs-4 fw-bold text-success">{orderStatusSummary.RECEIVED}</div>
              <div className="text-secondary font-12">Completed orders</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary text-uppercase font-12 mb-1">Cancelled</div>
              <div className="fs-4 fw-bold text-secondary">{orderStatusSummary.CANCELLED}</div>
              <div className="text-secondary font-12">Closed without delivery</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <span className="fw-semibold">Create purchase order</span>
        </div>
        <div className="card-body">
          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-md-4">
              <label className="form-label">Supplier</label>
              <select
                name="supplierId"
                className="form-select"
                value={form.supplierId}
                onChange={handleFormChange}
                required
              >
                <option value="">Select supplier</option>
                {supplierOptions.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Location</label>
              <select
                name="locationId"
                className="form-select"
                value={form.locationId}
                onChange={handleFormChange}
                required
              >
                <option value="">Select branch</option>
                {locationOptions.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Order date</label>
              <input
                type="date"
                name="orderDate"
                className="form-control"
                value={form.orderDate}
                onChange={handleFormChange}
              />
            </div>

            <div className="col-12">
              {pendingSupplierId && (
                <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <span>
                    Switching supplier will clear all current order lines. Continue?
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      onClick={confirmSupplierChange}
                    >
                      Yes, switch supplier
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={cancelSupplierChange}
                    >
                      Keep current supplier
                    </button>
                  </div>
                </div>
              )}
              {draftItemsForSupplier.length > 0 && (
                <div className="alert alert-info d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div>
                    {draftItemsForSupplier.length} reorder item(s) match this supplier.
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={importDraftLines}
                  >
                    Import reorder draft
                  </button>
                </div>
              )}
              <div className="table-responsive border rounded">
                <table className="table table-sm table-borderless align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "35%" }}>Product</th>
                      <th style={{ width: "20%" }}>Quantity</th>
                      <th style={{ width: "20%" }}>Cost/unit</th>
                      <th style={{ width: "15%" }}>Lead time</th>
                      <th style={{ width: "20%" }}>Line total</th>
                      <th style={{ width: "5%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => {
                      const quantity = Number(line.quantity) || 0;
                      const price = Number(line.price) || 0;
                      const lineTotal = quantity * price;
                      const selected = productOptionMap[line.productId] ?? null;
                      return (
                        <tr key={index}>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={line.productId}
                              onChange={(event) =>
                                handleLineChange(index, "productId", event.target.value)
                              }
                              disabled={!form.supplierId}
                            >
                              <option value="">Select product</option>
                              {productOptions.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                            {selected?.vendorSku ? (
                              <div className="text-secondary small">
                                Vendor SKU: {selected.vendorSku}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <input
                              type="number"
                              min={1}
                              className="form-control form-control-sm"
                              value={line.quantity}
                              onChange={(event) =>
                                handleLineChange(index, "quantity", event.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="form-control form-control-sm"
                              value={line.price}
                              onChange={(event) =>
                                handleLineChange(index, "price", event.target.value)
                              }
                              placeholder={
                                selected?.costPrice != null
                                  ? `Cost ${Number(selected.costPrice).toFixed(2)}`
                                  : ""
                              }
                            />
                          </td>
                          <td>
                            {selected?.leadTimeDays != null ? (
                              <span>{selected.leadTimeDays} days</span>
                            ) : (
                              <span className="text-secondary">-</span>
                            )}
                          </td>
                          <td>{lineTotal ? `$${lineTotal.toFixed(2)}` : "-"}</td>
                          <td className="text-end">
                            {lines.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-link text-danger p-0"
                                onClick={() => removeLine(index)}
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mt-2"
                onClick={addLine}
              >
                Add line
              </button>
              <div className="d-flex flex-wrap gap-4 mt-3 p-3 bg-light border rounded">
                <div>
                  <div className="text-secondary small">Total units</div>
                  <div className="fw-semibold">{orderSummary.totalUnits}</div>
                </div>
                <div>
                  <div className="text-secondary small">Subtotal</div>
                  <div className="fw-semibold">${orderSummary.subtotal.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-secondary small">ETA (max lead time)</div>
                  <div className="fw-semibold">{orderSummary.eta ?? "-"}</div>
                </div>
              </div>
            </div>

            <div className="col-12 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Create purchase order"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={resetForm}
                disabled={submitting}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      {(filterStart || filterEnd) && (
        <div className="alert alert-info d-flex align-items-center justify-content-between py-2 mb-3">
          <span className="small">
            Showing orders
            {filterStart ? ` from ${filterStart}` : ""}
            {filterStart && filterEnd ? " " : ""}
            {filterEnd ? `to ${filterEnd}` : ""}.
            Orders outside this range are hidden.
          </span>
          <button
            type="button"
            className="btn-close"
            aria-label="Clear date filter"
            onClick={() => {
              setFilterStart("");
              setFilterEnd("");
              loadOrders({});
            }}
          />
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mb-3">
        {["ALL", "OPEN", "PARTIAL", "RECEIVED", "CANCELLED"].map((s) => (
          <button
            key={s}
            type="button"
            className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            {s !== "ALL" && (
              <span className="ms-1 badge rounded-pill bg-secondary bg-opacity-25 text-body">
                {orderStatusSummary[s] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>PO ID</th>
                  <th>Supplier</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Order date</th>
                  <th>Lines</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="text-center text-secondary py-4">
                      Loading purchase orders...
                    </td>
                  </tr>
                )}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-secondary py-4">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                )}
                {!loading && orders.length > 0 && filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-secondary py-4">
                      No purchase orders match the selected status.
                    </td>
                  </tr>
                )}
                {filteredOrders.map((order) => {
                  const status = String(order?.status ?? "OPEN").toUpperCase();
                  const details = order?.details ?? order?.purchaseOrderDetails ?? [];
                  // For PARTIAL orders, compute total units still outstanding so the
                  // admin can see at a glance how much is left to receive.
                  const remainingUnits = status === "PARTIAL"
                    ? details.reduce((sum, line) => {
                        const ordered = Number(line?.quantity) || 0;
                        const received = Number(line?.receivedQty) || 0;
                        return sum + Math.max(ordered - received, 0);
                      }, 0)
                    : null;
                  return (
                    <tr key={order.poId ?? order.purchaseOrderId ?? order.id}>
                      <td>{order.poId ?? order.purchaseOrderId ?? order.id ?? "-"}</td>
                      <td>{order?.supplier?.name ?? "-"}</td>
                      <td>{order?.location?.name ?? "All"}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(order?.status)}`}>
                          {(order?.status ?? "OPEN").toString().toLowerCase()}
                        </span>
                        {remainingUnits != null && remainingUnits > 0 && (
                          <div className="text-secondary" style={{ fontSize: "0.7rem", marginTop: "2px" }}>
                            {remainingUnits} unit{remainingUnits !== 1 ? "s" : ""} remaining
                          </div>
                        )}
                      </td>
                      <td>
                        {order?.total != null
                          ? `$${Number(order.total).toFixed(2)}`
                          : "-"}
                      </td>
                      <td>
                        {order?.orderDate
                          ? new Date(order.orderDate).toLocaleString()
                          : "-"}
                      </td>
                      <td>{details.length}</td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => startReceive(order)}
                            disabled={status === "RECEIVED" || status === "CANCELLED"}
                          >
                            Receive
                          </button>
                          {status === "OPEN" && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleCancel(order)}
                              disabled={cancelling === (order?.poId ?? order?.purchaseOrderId ?? order?.id)}
                            >
                              {cancelling === (order?.poId ?? order?.purchaseOrderId ?? order?.id)
                                ? "Cancelling…"
                                : "Cancel"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {receivingOrderId && (
        <div className="card shadow-sm mt-3">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <span className="fw-semibold">Receive purchase order #{receivingOrderId}</span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={cancelReceive}
              disabled={receiving}
            >
              Close
            </button>
          </div>
          <div className="card-body">
            {receiveError && <div className="alert alert-danger">{receiveError}</div>}
            {receiveLines.length === 0 ? (
              <div className="text-secondary">No line items found for this order.</div>
            ) : (
              <>
                <div className="table-responsive border rounded">
                  <table className="table table-sm table-borderless align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "26%" }}>Product</th>
                        <th style={{ width: "10%" }}>Ordered</th>
                        <th style={{ width: "10%" }}>Remaining</th>
                        <th style={{ width: "12%" }}>Unit cost</th>
                        <th style={{ width: "16%" }}>Receive now</th>
                        <th style={{ width: "26%" }}>
                          Expiry date
                          <span className="text-secondary ms-1" style={{ fontSize: "0.7rem" }}>(optional)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveLines.map((line, index) => (
                        <tr key={line.detailId ?? index}>
                          <td>{line.productName}</td>
                          <td>{line.orderedQty}</td>
                          <td>{line.remainingQty}</td>
                          <td>
                            {line.unitCost != null
                              ? `$${Number(line.unitCost).toFixed(2)}`
                              : <span className="text-secondary">—</span>}
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              max={line.remainingQty}
                              className="form-control form-control-sm"
                              value={line.receiveQty}
                              onChange={(event) =>
                                handleReceiveLineChange(index, event.target.value)
                              }
                              disabled={line.remainingQty === 0 || receiving}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={line.expiryDate}
                              onChange={(event) =>
                                handleReceiveExpiryChange(index, event.target.value)
                              }
                              disabled={line.remainingQty === 0 || receiving}
                              min={new Date().toISOString().slice(0, 10)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={receiveAllRemaining}
                    disabled={receiving}
                  >
                    Receive all remaining
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={submitReceive}
                    disabled={receiving}
                  >
                    {receiving ? "Receiving..." : "Confirm receipt"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;





