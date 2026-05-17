import "./pos.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PrintInvoice from "./PrintInvoice";
import { fetchInStockProducts } from "../../../api/products";
import { createOrder } from "../../../api/orders";
import posConfig from "../../../config/posConfig";
import { useAuth } from "../../../context/AuthContext";

const {
  defaultLocationId: DEFAULT_LOCATION_ID,
  defaultUserId: DEFAULT_USER_ID,
  branchName: DEFAULT_BRANCH,
  cashierName: DEFAULT_CASHIER,
  currencySymbol: CURRENCY_SYMBOL,
  searchSuggestionLimit: SEARCH_SUGGESTION_LIMIT,
} = posConfig;

const buildProductLookup = (list) => {
  const lookup = {};
  list.forEach((product) => {
    if (!product) return;
    const sku = product.sku ?? product.barcode;
    if (sku) lookup[sku.toLowerCase()] = product;
    if (product.name) lookup[product.name.toLowerCase()] = product;
  });
  return lookup;
};

const getCategoryName = (product) => {
  if (!product) return "General";
  if (product.categoryName) return product.categoryName;
  if (product.category && product.category.name) return product.category.name;
  return "General";
};

const formatCurrency = (value) => {
  const amount = Number.isFinite(value) ? value : Number(value) || 0;
  return CURRENCY_SYMBOL + amount.toFixed(2);
};

const Pos = () => {
  const { user } = useAuth();
  const activeUserId = user?.userId ?? DEFAULT_USER_ID;
  const activeLocationId = user?.locationId ?? DEFAULT_LOCATION_ID;
  const activeLocationName = user?.locationName ?? DEFAULT_BRANCH;
  const activeCashierName = user?.username ?? DEFAULT_CASHIER;

  const [products, setProducts] = useState([]);
  const [productLookup, setProductLookup] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState(null);

  const [cart, setCart] = useState([]);
  const [scanInput, setScanInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [feedback, setFeedback] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [cashReceived, setCashReceived] = useState("");

  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const hasSearchTerm = scanInput.trim().length > 0;
  const barcodeInputRef = useRef(null);

  const focusScanner = () => barcodeInputRef.current?.focus();

  useEffect(() => {
    const controller = new AbortController();
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await fetchInStockProducts({ signal: controller.signal });
        const list = Array.isArray(data) ? data : [];
        setProducts(list);
        setProductLookup(buildProductLookup(list));
        setProductError(null);
      } catch (error) {
        if (error.name === "AbortError") return;
        setProducts([]);
        setProductLookup({});
        setProductError(error.message || "Unable to load product catalog.");
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const categoryNames = useMemo(() => {
    const names = new Set();
    products.forEach((p) => names.add(getCategoryName(p)));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const [activeCategory, setActiveCategory] = useState("Featured");

  useEffect(() => {
    if (activeCategory === "Featured") return;
    if (!categoryNames.includes(activeCategory)) setActiveCategory("Featured");
  }, [categoryNames, activeCategory]);

  const categoryTabs = useMemo(() => {
    if (categoryNames.length === 0) return ["Featured"];
    return ["Featured", ...categoryNames];
  }, [categoryNames]);

  const quickProducts = useMemo(() => {
    if (products.length === 0) return [];
    if (activeCategory === "Featured") return products;
    return products.filter((product) => getCategoryName(product) === activeCategory);
  }, [products, activeCategory]);

  const addProductToCart = (product, quantity = 1) => {
    const qty = Math.max(Math.floor(quantity), 1);
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.productId
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          name: product.name ?? "Unnamed product",
          price: Number(product.price) || 0,
          sku: product.sku ?? product.barcode ?? "N/A",
          qty,
        },
      ];
    });
  };

  const normalizeQuery = (value) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

  const resolveProduct = useCallback(
    (query) => {
      const normalized = normalizeQuery(query);
      if (!normalized) return null;
      const exactSku = products.find((item) => {
        const sku = item?.sku ?? item?.barcode;
        return typeof sku === "string" && sku.toLowerCase() === normalized;
      });
      if (exactSku) return exactSku;
      return productLookup[normalized] ?? null;
    },
    [productLookup, products]
  );

  const updateSearchMatches = useCallback(
    (value) => {
      const normalized = normalizeQuery(value);
      if (!normalized) { setSearchResults([]); return; }
      const matches = products.filter((product) => {
        const fields = [product?.sku, product?.barcode, product?.name];
        return fields.some(
          (field) => typeof field === "string" && field.toLowerCase().includes(normalized)
        );
      });
      setSearchResults(matches.slice(0, SEARCH_SUGGESTION_LIMIT));
    },
    [products]
  );

  useEffect(() => {
    updateSearchMatches(scanInput);
  }, [scanInput, updateSearchMatches]);

  const handleSelectProduct = (product) => {
    if (!product) return;
    setCheckoutError(null);
    addProductToCart(product, 1);
    setFeedback({ type: "success", message: `${product.name ?? "Item"} added` });
    setScanInput("");
    setSearchResults([]);
    focusScanner();
  };

  const handleScanSubmit = (event) => {
    event.preventDefault();
    setCheckoutError(null);
    const query = scanInput.trim();
    if (!query) {
      setFeedback({ type: "warning", message: "Enter a SKU to add an item." });
      return;
    }
    const product =
      resolveProduct(query) ?? (searchResults.length === 1 ? searchResults[0] : null);
    if (!product) {
      setFeedback({ type: "danger", message: `No product found for "${query}"` });
      return;
    }
    handleSelectProduct(product);
  };

  const handleQuantityChange = (sku, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.sku === sku ? { ...item, qty: Math.max(item.qty + delta, 0) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handleRemove = (sku) => setCart((prev) => prev.filter((item) => item.sku !== sku));

  const handleClear = () => {
    setCart([]);
    setCashReceived("");
    setScanInput("");
    setSearchResults([]);
    setCheckoutError(null);
    setFeedback({ type: "info", message: "Sale cleared" });
    focusScanner();
  };

  const subTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const qtyTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  const changeDue = useMemo(() => {
    const received = Number.parseFloat(cashReceived);
    if (!Number.isFinite(received)) return 0;
    return Math.max(received - subTotal, 0);
  }, [cashReceived, subTotal]);

  const cashShort = useMemo(() => {
    const received = Number.parseFloat(cashReceived);
    if (!Number.isFinite(received)) return subTotal > 0;
    return received + 1e-6 < subTotal;
  }, [cashReceived, subTotal]);

  const showEmptySearch = hasSearchTerm && searchResults.length === 0 && !loadingProducts;

  const handleCashShortcut = (value) => {
    if (value === "EXACT") { setCashReceived(subTotal.toFixed(2)); return; }
    setCashReceived(Number(value).toFixed(2));
  };

  const canCheckout = cart.length > 0 && !cashShort && !saving;

  const handleCheckout = async () => {
    setCheckoutError(null);
    if (cart.length === 0) {
      setFeedback({ type: "warning", message: "Scan at least one item." });
      return;
    }
    const cashAmount = Number.parseFloat(cashReceived);
    if (!Number.isFinite(cashAmount) || cashAmount < subTotal) {
      setCheckoutError("Cash received is less than the total due.");
      return;
    }
    const orderPayload = {
      userId: activeUserId,
      customerId: null,
      locationId: activeLocationId,
      discount: 0,
      paymentStatus: "PAID",
      orderDetails: cart.map((item) => ({
        productId: item.productId,
        quantity: item.qty,
        price: item.price,
      })),
    };
    try {
      setSaving(true);
      const savedOrder = await createOrder(orderPayload);
      const orderId = savedOrder?.orderId;
      const orderNumber =
        orderId != null ? `INV-${String(orderId).padStart(5, "0")}` : `TEMP-${Date.now()}`;
      const orderDate = savedOrder?.orderDate ?? new Date().toISOString();
      setReceiptData({
        orderNumber,
        orderDate,
        cashier: activeCashierName,
        location: activeLocationName,
        items: cart.map((item) => ({
          sku: item.sku,
          name: item.name,
          qty: item.qty,
          price: item.price,
        })),
        totals: {
          subtotal: subTotal,
          discount: 0,
          total: subTotal,
          cashReceived: cashAmount,
          changeDue: cashAmount - subTotal,
        },
      });
      setCart([]);
      setCashReceived("");
      setScanInput("");
      setSearchResults([]);
      setShowReceipt(true);
      setFeedback({ type: "success", message: "Sale completed. Receipt ready." });
      focusScanner();
    } catch (error) {
      setCheckoutError(error.message || "Unable to complete sale.");
    } finally {
      setSaving(false);
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setReceiptData(null);
    focusScanner();
  };

  return (
    <div className="pos-touch-layout">

      {/* ── HEADER: Search bar + Category tabs ── */}
      <div className="pos-touch-header">
        <div className="pos-touch-header-top">
          <form onSubmit={handleScanSubmit} className="pos-touch-search-form">
            <div className="pos-touch-search-wrap">
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-white border-end-0">
                  <i className="fa-solid fa-barcode text-secondary"></i>
                </span>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Scan barcode or type product name / SKU…"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  disabled={loadingProducts}
                  autoFocus
                />
                <button
                  className="btn btn-primary px-4"
                  type="submit"
                  disabled={loadingProducts}
                >
                  <i className="fa-solid fa-plus me-2"></i>Add
                </button>
              </div>

              {/* Live search dropdown */}
              {(searchResults.length > 0 || showEmptySearch) && (
                <div className="pos-search-results pos-touch-search-dropdown">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="pos-search-results__header text-secondary text-uppercase small">
                        Matching products
                      </div>
                      {searchResults.map((product, index) => (
                        <button
                          type="button"
                          key={product.productId ?? product.sku ?? index}
                          className="pos-search-results__item"
                          onClick={() => handleSelectProduct(product)}
                        >
                          <div className="pos-search-results__item-info">
                            <div className="fw-semibold">{product.name ?? "Unnamed product"}</div>
                            <div className="text-secondary small">
                              SKU: {product.sku ?? product.barcode ?? "N/A"}
                            </div>
                          </div>
                          <div className="pos-search-results__item-price">
                            {formatCurrency(Number(product.price) || 0)}
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="pos-search-results__empty text-secondary small">
                      No matching products found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Status indicators */}
          <div className="pos-touch-header-status">
            {loadingProducts && (
              <span className="text-secondary small">
                <i className="fa-solid fa-spinner fa-spin me-1"></i>Loading catalog…
              </span>
            )}
            {productError && !loadingProducts && (
              <div className="alert alert-danger py-1 px-3 mb-0 small" role="alert">
                {productError}
              </div>
            )}
            {feedback && (
              <div className={`alert alert-${feedback.type} py-1 px-3 mb-0 small pos-touch-feedback`} role="alert">
                {feedback.message}
              </div>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="pos-touch-tabs-row">
          {categoryTabs.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`pos-tab btn btn-sm text-uppercase${cat === activeCategory ? " active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY: Left products | Right cart ── */}
      <div className="pos-touch-body">

        {/* LEFT: Product grid — scrollable internally */}
        <div className="pos-touch-products">
          {quickProducts.length === 0 ? (
            <div className="pos-touch-empty">
              <i className="fa-solid fa-box-open mb-3"></i>
              <div>No products in this category.</div>
            </div>
          ) : (
            <div className="pos-touch-grid">
              {quickProducts.map((product) => (
                <button
                  key={product.productId ?? product.sku}
                  className="pos-touch-product-btn"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="pos-touch-product-name">
                    {product.name ?? "Unnamed product"}
                  </div>
                  <div className="pos-touch-product-sku">
                    {product.sku ?? product.barcode ?? "N/A"}
                  </div>
                  <div className="pos-touch-product-price">
                    {formatCurrency(Number(product.price) || 0)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Cart + Payment panel */}
        <div className="pos-touch-cart-panel">

          {/* Cart header */}
          <div className="pos-touch-cart-header">
            <div className="d-flex align-items-center gap-2">
              <i className="fa-solid fa-receipt text-secondary"></i>
              <span className="fw-bold text-uppercase" style={{ letterSpacing: "0.06em" }}>
                Current Order
              </span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <span className="text-secondary small">
                {qtyTotal} {qtyTotal === 1 ? "item" : "items"}
              </span>
              {cart.length > 0 && (
                <button
                  className="btn btn-link text-danger btn-sm p-0 text-decoration-none"
                  onClick={handleClear}
                >
                  <i className="fa-solid fa-trash-can me-1"></i>Clear
                </button>
              )}
            </div>
          </div>

          {/* Cart items list — scrollable */}
          <div className="pos-touch-cart-items">
            {cart.length === 0 ? (
              <div className="pos-touch-cart-empty">
                <i className="fa-solid fa-cart-shopping"></i>
                <div>Tap a product or scan to start</div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.sku} className="pos-touch-cart-row">
                  <div className="pos-touch-cart-info">
                    <div className="pos-touch-cart-item-name">{item.name}</div>
                    <div className="pos-touch-cart-item-unit">
                      {formatCurrency(item.price)} each
                    </div>
                  </div>
                  <div className="pos-touch-cart-controls">
                    <button
                      className="pos-touch-qty-btn"
                      onClick={() => handleQuantityChange(item.sku, -1)}
                    >
                      <i className="fa-solid fa-minus"></i>
                    </button>
                    <span className="pos-touch-qty-val">{item.qty}</span>
                    <button
                      className="pos-touch-qty-btn"
                      onClick={() => handleQuantityChange(item.sku, 1)}
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>
                  <div className="pos-touch-cart-line-total">
                    {formatCurrency(item.price * item.qty)}
                  </div>
                  <button
                    className="pos-touch-remove-btn"
                    onClick={() => handleRemove(item.sku)}
                    title="Remove item"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Payment section — always pinned at bottom */}
          <div className="pos-touch-payment">
            <div className="pos-touch-subtotal-row">
              <span>Subtotal</span>
              <span className="fw-bold fs-5">{formatCurrency(subTotal)}</span>
            </div>

            <div className="pos-touch-cash-section">
              <label className="pos-touch-cash-label">
                <i className="fa-solid fa-money-bill-wave me-2 text-secondary"></i>
                Cash Received
              </label>
              <div className="input-group">
                <span className="input-group-text fw-semibold">{CURRENCY_SYMBOL}</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  className="form-control form-control-lg text-end fw-semibold"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                />
              </div>
              <div className="pos-touch-presets">
                {["EXACT", 5, 10, 20, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="pos-touch-preset-btn"
                    onClick={() => handleCashShortcut(preset)}
                  >
                    {preset === "EXACT" ? "Exact" : `$${preset}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="pos-touch-change-row">
              <span className="text-secondary">Change Due</span>
              <span className={`fw-bold fs-5 ${changeDue > 0 ? "text-success" : "text-secondary"}`}>
                {formatCurrency(changeDue)}
              </span>
            </div>

            {checkoutError && (
              <div className="alert alert-danger py-2 px-3 mb-2 small" role="alert">
                <i className="fa-solid fa-circle-exclamation me-2"></i>{checkoutError}
              </div>
            )}
            {cashShort && cart.length > 0 && !checkoutError && (
              <div className="alert alert-warning py-2 px-3 mb-2 small" role="alert">
                <i className="fa-solid fa-triangle-exclamation me-2"></i>
                Cash received is less than the total.
              </div>
            )}

            <div className="d-grid gap-2">
              <button
                className="pos-touch-checkout-btn btn btn-success"
                onClick={handleCheckout}
                disabled={!canCheckout}
              >
                {saving ? (
                  <><i className="fa-solid fa-spinner fa-spin me-2"></i>Processing…</>
                ) : (
                  <><i className="fa-solid fa-check me-2"></i>Checkout — {formatCurrency(subTotal)}</>
                )}
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={cart.length === 0}
              >
                <i className="fa-solid fa-pause me-2"></i>Put On Hold
              </button>
            </div>

            <div className="pos-touch-cashier-bar">
              <i className="fa-solid fa-user-tie me-1 text-secondary"></i>
              <span>{activeCashierName}</span>
              <span className="pos-touch-cashier-sep">·</span>
              <i className="fa-solid fa-store me-1 text-secondary"></i>
              <span>{activeLocationName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt modal */}
      {showReceipt && receiptData && (
        <div className="pos-receipt-modal">
          <div className="pos-receipt-backdrop" onClick={closeReceipt}></div>
          <div className="pos-receipt-dialog">
            <PrintInvoice preview receipt={receiptData} onClose={closeReceipt} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;
