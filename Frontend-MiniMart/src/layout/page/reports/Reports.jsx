import "./reports.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import posConfig from "../../../config/posConfig";
import {
  fetchProfitLossReport,
  fetchSalesSummaryReport,
} from "../../../api/reports";
import { fetchLocations } from "../../../api/locations";
import DateRangeFilter from "../../../components/DateRangeFilter";

const { currencySymbol: CURRENCY_SYMBOL } = posConfig;

const TAB_KEYS = {
  PROFIT_LOSS: "profit-loss",
  SALES: "sales",
};

const formatCurrency = (value) =>
  CURRENCY_SYMBOL +
  Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

const formatPercent = (value) =>
  new Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);

const formatDateInput = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) {
    return value;
  }
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatEnumLabel = (value) =>
  !value
    ? ""
    : String(value)
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");

const normalizeStatus = (value) => (value ? String(value).toUpperCase() : "");

const SalesSummary = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadReport = useCallback(async (signal) => {
    setError(null);
    try {
      const data = await fetchSalesSummaryReport({ signal });
      if (signal?.aborted) {
        return;
      }
      setReport(data ?? null);
      setLastUpdated(new Date());
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      setError(err.message || "Unable to load sales data.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    loadReport(controller.signal).finally(() => {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    });

    return () => controller.abort();
  }, [loadReport]);

  const handleRefresh = () => {
    const controller = new AbortController();
    setLoading(true);
    loadReport(controller.signal).finally(() => {
      setLoading(false);
    });
  };

  const grossSalesToday = Number(report?.grossSalesToday ?? 0);
  const transactionsToday = Number(report?.transactionsToday ?? 0);
  const paidOrdersToday = Number(report?.paidOrdersToday ?? 0);
  const pendingOrdersToday = Number(report?.pendingOrdersToday ?? 0);
  const averageTicketToday = Number(report?.averageTicketToday ?? 0);
  const averageTicketLast7 = Number(report?.averageTicketLast7Days ?? 0);
  const pendingAmountToday = Number(report?.pendingAmountToday ?? 0);
  const dailyTrend = report?.dailyTrend ?? [];
  const statusBreakdown = report?.statusBreakdown ?? [];
  const peakHours = report?.peakHours ?? [];
  const recentOrders = report?.recentOrders ?? [];

  const maxDailyRevenue = Math.max(
    ...dailyTrend.map((day) => Number(day?.totalSales ?? 0)),
    1
  );

  return (
    <div className="sales-summary-page">
      <header className="summary-header">
        <div>
          <h2 className="mb-1">Sales Summary</h2>
          <p className="text-secondary mb-0">
            Live sales metrics powered by backend report aggregates.
          </p>
        </div>
        <div className="summary-header-actions">
          {lastUpdated && (
            <span className="badge bg-secondary-subtle text-secondary">
              Updated {lastUpdated.toLocaleString()}
            </span>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
        </div>
      </header>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <section className="summary-kpis">
        <article className="summary-kpi-card">
          <div className="kpi-heading">Gross sales (today)</div>
          <div className="kpi-value">{formatCurrency(grossSalesToday)}</div>
          <div className="kpi-subtitle text-secondary">
            Includes paid orders processed today
          </div>
        </article>
        <article className="summary-kpi-card">
          <div className="kpi-heading">Transactions (today)</div>
          <div className="kpi-value">{formatNumber(transactionsToday)}</div>
          <div className="kpi-subtitle text-secondary">
            {paidOrdersToday} paid / {pendingOrdersToday} awaiting payment
          </div>
        </article>
        <article className="summary-kpi-card">
          <div className="kpi-heading">Average ticket</div>
          <div className="kpi-value">{formatCurrency(averageTicketToday)}</div>
          <div className="kpi-subtitle text-secondary">
            Last 7 days: {formatCurrency(averageTicketLast7)}
          </div>
        </article>
        <article className="summary-kpi-card">
          <div className="kpi-heading">Pending amount</div>
          <div className="kpi-value">{formatCurrency(pendingAmountToday)}</div>
          <div className="kpi-subtitle text-secondary">
            Orders that still require follow-up today
          </div>
        </article>
      </section>

      <section className="summary-grid">
        <article className="summary-panel">
          <div className="panel-header">
            <div>
              <h6 className="mb-0">Revenue trend</h6>
              <span className="text-secondary small">
                Paid revenue over the last 7 days
              </span>
            </div>
          </div>
          <div className="daily-bars">
            {dailyTrend.map((day) => (
              <div className="daily-bar" key={day.date}>
                <div className="daily-bar-chart">
                  <div
                    className="daily-bar-fill"
                    style={{
                      height: `${(Number(day.totalSales ?? 0) / maxDailyRevenue) * 100}%`,
                    }}
                  />
                </div>
                <div className="daily-bar-meta">
                  <span className="daily-bar-label">
                    {formatDisplayDate(day.date)}
                  </span>
                  <span className="daily-bar-value">
                    {formatCurrency(day.totalSales)}
                  </span>
                  <span className="daily-bar-count">
                    {formatNumber(day.orderCount)} orders
                  </span>
                </div>
              </div>
            ))}
            {dailyTrend.length === 0 && (
              <p className="text-secondary small mb-0">
                No order data is available yet.
              </p>
            )}
          </div>
        </article>

        <article className="summary-panel">
          <div className="panel-header">
            <div>
              <h6 className="mb-0">Status breakdown (today)</h6>
              <span className="text-secondary small">
                Share of orders by payment status
              </span>
            </div>
          </div>
          <div className="status-breakdown">
            {statusBreakdown.length === 0 && (
              <p className="text-secondary small mb-0">
                Orders for today will appear here as soon as they are created.
              </p>
            )}
            {statusBreakdown.map((status) => (
              <div className="status-row" key={status.status}>
                <div className="status-meta">
                  <span className="status-label">{status.status}</span>
                  <span className="status-count">
                    {formatNumber(status.count)} orders
                  </span>
                </div>
                <div className="status-bar">
                  <div
                    className="status-fill"
                    style={{ width: `${status.relative}%` }}
                  />
                </div>
                <span className="status-percent">{status.percent}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="summary-panel">
          <div className="panel-header">
            <div>
              <h6 className="mb-0">Peak hours (today)</h6>
              <span className="text-secondary small">
                Busiest register hours by order count
              </span>
            </div>
          </div>
          <div className="peak-hours">
            {peakHours.length === 0 && (
              <p className="text-secondary small mb-0">
                Hourly insights will show once orders are taken today.
              </p>
            )}
            {peakHours.map((slot) => (
              <div className="peak-hours-row" key={slot.hour}>
                <div>
                  <div className="fw-semibold">{slot.label}</div>
                  <div className="text-secondary small">
                    {formatNumber(slot.count)} orders
                  </div>
                </div>
                <div className="text-end">
                  <span className="badge bg-primary-subtle text-primary">
                    {formatCurrency(slot.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="summary-panel">
        <div className="panel-header">
          <div>
            <h6 className="mb-0">Recent orders</h6>
            <span className="text-secondary small">
              Latest 10 orders across the branch
            </span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 summary-table">
            <thead className="table-light">
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">Customer</th>
                <th scope="col" className="text-end">
                  Total
                </th>
                <th scope="col">Status</th>
                <th scope="col">Order date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center text-secondary py-4">
                    No orders have been recorded yet.
                  </td>
                </tr>
              )}
              {recentOrders.map((order) => (
                <tr key={order.orderId}>
                  <td>{order.orderId ?? "-"}</td>
                  <td>{order.customerName ?? "Walk-in"}</td>
                  <td className="text-end">{formatCurrency(order.total)}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        normalizeStatus(order.paymentStatus) === "PAID"
                          ? "success"
                          : normalizeStatus(order.paymentStatus) === "PENDING"
                          ? "warning"
                          : "secondary"
                      }`}
                    >
                      {normalizeStatus(order.paymentStatus) || "-"}
                    </span>
                  </td>
                  <td>
                    {order.orderDate
                      ? new Date(order.orderDate).toLocaleString(undefined, {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center text-secondary py-4">
                    Loading orders...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const ProfitLossReport = () => {
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setMonth(start.getMonth() - 1);
    return {
      startDate: formatDateInput(start),
      endDate: formatDateInput(today),
      locationId: "",
    };
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchLocations({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }
        setLocations(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setLocations([]);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
    ) {
      setError("Start date must be on or before the end date.");
      setReport(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setLastUpdated(null);

    fetchProfitLossReport({
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      locationId: filters.locationId || undefined,
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }
        setReport(data ?? null);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          return;
        }
        setError(err.message || "Unable to load profit and loss report.");
        setReport(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [filters.startDate, filters.endDate, filters.locationId, refreshKey]);

  const locationOptions = useMemo(
    () =>
      (locations ?? []).map((location) => ({
        id:
          location?.locationId === undefined || location?.locationId === null
            ? ""
            : String(location.locationId),
        name: location?.name ?? `Location ${location?.locationId ?? ""}`,
      })),
    [locations]
  );

  const activeLocationLabel = useMemo(() => {
    if (!filters.locationId) {
      return "All locations";
    }
    const match = locationOptions.find(
      (option) => option.id === filters.locationId
    );
    return match?.name ?? "Selected location";
  }, [filters.locationId, locationOptions]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateRangeChange = (startDate, endDate) => {
    setFilters((prev) => ({ ...prev, startDate, endDate }));
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const totalRevenue = Number(report?.totalRevenue ?? 0);
  const totalDiscounts = Number(report?.totalDiscounts ?? 0);
  const costOfGoodsSold = Number(report?.costOfGoodsSold ?? 0);
  const grossProfit = Number(report?.grossProfit ?? 0);
  const totalExpenses = Number(report?.totalExpenses ?? 0);
  const netProfit = Number(report?.netProfit ?? 0);
  const totalInventoryPurchases = Number(report?.totalInventoryPurchases ?? 0);
  const currentInventoryValue = Number(report?.currentInventoryValue ?? 0);
  const productBreakdown = report?.productBreakdown ?? [];
  const expenseBreakdown = report?.expenseBreakdown ?? [];
  const purchasesBySupplier = report?.purchasesBySupplier ?? [];

  const grossMargin = totalRevenue !== 0 ? grossProfit / totalRevenue : 0;
  const netMargin = totalRevenue !== 0 ? netProfit / totalRevenue : 0;
  const discountRate = totalRevenue !== 0 ? totalDiscounts / totalRevenue : 0;
  const expenseShare = totalRevenue !== 0 ? totalExpenses / totalRevenue : 0;
  const costShare = totalRevenue !== 0 ? costOfGoodsSold / totalRevenue : 0;

  const topProduct = productBreakdown[0];
  const topExpense = expenseBreakdown[0];

  const resolvedStart = report?.startDate ?? filters.startDate;
  const resolvedEnd = report?.endDate ?? filters.endDate;

  const periodLabel = useMemo(() => {
    const formattedStart = formatDisplayDate(resolvedStart);
    const formattedEnd = formatDisplayDate(resolvedEnd);
    if (formattedStart && formattedEnd) {
      return `${formattedStart} - ${formattedEnd}`;
    }
    return formattedStart || formattedEnd || "";
  }, [resolvedStart, resolvedEnd]);

  const isReportEmpty =
    !loading &&
    !error &&
    report &&
    totalRevenue === 0 &&
    totalExpenses === 0 &&
    costOfGoodsSold === 0 &&
    totalInventoryPurchases === 0 &&
    productBreakdown.length === 0 &&
    expenseBreakdown.length === 0;

  return (
    <div className="profit-loss-report">
      <header className="summary-header">
        <div>
          <h2 className="mb-1">Profit &amp; Loss</h2>
          <p className="text-secondary mb-2">
            Combined revenue, cost of goods, and expense insights sourced from
            paid orders, purchase orders, and expense tracking.
          </p>
          <div className="profit-loss-meta">
            {periodLabel && <span>Period: {periodLabel}</span>}
            <span>Location: {activeLocationLabel}</span>
          </div>
        </div>
        <div className="summary-header-actions">
          {lastUpdated && (
            <span className="badge bg-secondary-subtle text-secondary">
              Updated {lastUpdated.toLocaleString()}
            </span>
          )}
          <div className="profit-loss-filters">
            <div className="profit-loss-field">
              <label htmlFor="profit-loss-location">Location</label>
              <select
                id="profit-loss-location"
                name="locationId"
                value={filters.locationId}
                onChange={handleFilterChange}
                className="form-select form-select-sm"
              >
                <option value="">All locations</option>
                {locationOptions.map((option) => (
                  <option key={option.id || "default"} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing" : "Refresh report"}
          </button>
        </div>
      </header>

      <div className="summary-panel">
        <DateRangeFilter
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={handleDateRangeChange}
        />
      </div>

      {error && <div className="alert alert-danger mb-0">{error}</div>}
      {isReportEmpty && (
        <div className="alert alert-secondary mb-0">
          No profit and loss data is available for the selected filters yet.
        </div>
      )}

      <section className="summary-kpis">
        {/* Row 1 — Sales flow */}
        <article className="summary-kpi-card">
          <div className="kpi-heading">Total sales</div>
          <div className="kpi-value">{formatCurrency(totalRevenue)}</div>
          <div className="kpi-subtitle text-secondary">
            Total money collected from customers this period
          </div>
        </article>
        <article className="summary-kpi-card">
          <div className="kpi-heading">Cost of items sold</div>
          <div className="kpi-value">{formatCurrency(costOfGoodsSold)}</div>
          <div className="kpi-subtitle text-secondary">
            What you originally paid for the products you sold ({formatPercent(costShare)} of sales)
          </div>
        </article>
        <article className="summary-kpi-card">
          <div className="kpi-heading">Profit on sales</div>
          <div
            className={`kpi-value ${grossProfit >= 0 ? "text-success" : "text-danger"}`}
          >
            {formatCurrency(grossProfit)}
          </div>
          <div className="kpi-subtitle text-secondary">
            Sales minus cost of items sold — {formatPercent(grossMargin)} kept
          </div>
        </article>
        <article className="summary-kpi-card">
          <div className="kpi-heading">Net profit</div>
          <div
            className={`kpi-value ${netProfit >= 0 ? "text-success" : "text-danger"}`}
          >
            {formatCurrency(netProfit)}
          </div>
          <div className="kpi-subtitle text-secondary">
            What you actually made after all costs — {formatPercent(netMargin)} of sales
          </div>
        </article>
        {/* Row 2 — Stock & costs */}
        <article className="summary-kpi-card">
          <div className="kpi-heading">New stock bought</div>
          <div className="kpi-value">{formatCurrency(totalInventoryPurchases)}</div>
          <div className="kpi-subtitle text-secondary">
            Total spent buying stock from suppliers in this period
          </div>
        </article>
        <article className="summary-kpi-card">
          <div className="kpi-heading">Stock on shelf</div>
          <div className="kpi-value">{formatCurrency(currentInventoryValue)}</div>
          <div className="kpi-subtitle text-secondary">
            Value of products still sitting unsold in your store
          </div>
        </article>
        <article className="summary-kpi-card">
          <div className="kpi-heading">Discounts given</div>
          <div className="kpi-value">{formatCurrency(totalDiscounts)}</div>
          <div className="kpi-subtitle text-secondary">
            Total price reductions given to customers ({formatPercent(discountRate)} of sales)
          </div>
        </article>
        <article className="summary-kpi-card">
          <div className="kpi-heading">Running expenses</div>
          <div className="kpi-value">{formatCurrency(totalExpenses)}</div>
          <div className="kpi-subtitle text-secondary">
            Other business costs such as rent, utilities, and supplies
          </div>
        </article>
      </section>

      <section className="summary-panel">
        <div className="panel-header">
          <div>
            <h6 className="mb-0">Business summary</h6>
            <span className="text-secondary small">
              Key highlights for the selected period at a glance
            </span>
          </div>
        </div>
        <ul className="profit-loss-insights">
          <li>
            <strong>For every $1 you sold,</strong> you kept{" "}
            {formatPercent(grossMargin)} after paying for the items — and{" "}
            {formatPercent(netMargin)} after all other costs.
          </li>
          <li>
            <strong>New stock purchased:</strong>{" "}
            {formatCurrency(totalInventoryPurchases)} spent buying from suppliers
            this period.{" "}
            {currentInventoryValue > 0
              ? `You still have ${formatCurrency(currentInventoryValue)} worth of unsold stock on your shelves.`
              : "All purchased stock has been sold."}
          </li>
          <li>
            <strong>Best-selling product:</strong>{" "}
            {topProduct
              ? `${topProduct.productName} — earned ${formatCurrency(topProduct.grossProfit)} in profit`
              : "No product sales recorded yet."}
          </li>
          <li>
            <strong>Biggest expense:</strong>{" "}
            {topExpense
              ? `${formatEnumLabel(topExpense.category)} at ${formatCurrency(topExpense.totalAmount)}`
              : "No running expenses recorded yet."}
          </li>
        </ul>
      </section>

      <section className="profit-loss-grid">
        <article className="summary-panel profit-loss-table">
          <div className="panel-header">
            <div>
              <h6 className="mb-0">Product profitability</h6>
              <span className="text-secondary small">
                Revenue, costs, and gross profit per product
              </span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="text-end">
                    Qty sold
                  </th>
                  <th scope="col" className="text-end">
                    Revenue
                  </th>
                  <th scope="col" className="text-end">
                    Cost of goods
                  </th>
                  <th scope="col" className="text-end">
                    Gross profit
                  </th>
                  <th scope="col" className="text-end">
                    In stock
                  </th>
                  <th scope="col" className="text-end">
                    Stock value
                  </th>
                </tr>
              </thead>
              <tbody>
                {productBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={7} className="profit-loss-empty">
                      No product sales were recorded for this period.
                    </td>
                  </tr>
                )}
                {productBreakdown.map((product) => (
                  <tr key={product.productId ?? product.productName}>
                    <td>{product.productName}</td>
                    <td className="text-end">
                      {formatNumber(product.quantitySold)}
                    </td>
                    <td className="text-end">{formatCurrency(product.revenue)}</td>
                    <td className="text-end">
                      {formatCurrency(product.costOfGoods)}
                    </td>
                    <td
                      className={`text-end ${
                        product.grossProfit >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {formatCurrency(product.grossProfit)}
                    </td>
                    <td className="text-end">
                      {formatNumber(product.quantityInStock ?? 0)}
                    </td>
                    <td className="text-end text-secondary">
                      {formatCurrency(product.inventoryValue ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="summary-panel profit-loss-table">
          <div className="panel-header">
            <div>
              <h6 className="mb-0">Expense breakdown</h6>
              <span className="text-secondary small">
                Total expense amount by category for the selected period
              </span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col" className="text-end">
                    Total amount
                  </th>
                  <th scope="col" className="text-end">
                    Share of expenses
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenseBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={3} className="profit-loss-empty">
                      No expenses were recorded for this period.
                    </td>
                  </tr>
                )}
                {expenseBreakdown.map((entry) => {
                  const share =
                    totalExpenses === 0
                      ? 0
                      : Number(entry.totalAmount ?? 0) / totalExpenses;
                  return (
                    <tr key={entry.category ?? "uncategorized"}>
                      <td>{formatEnumLabel(entry.category) || "Other"}</td>
                      <td className="text-end">
                        {formatCurrency(entry.totalAmount)}
                      </td>
                      <td className="text-end">{formatPercent(share)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="summary-panel profit-loss-table">
          <div className="panel-header">
            <div>
              <h6 className="mb-0">Purchases by supplier</h6>
              <span className="text-secondary small">
                Stock purchased from each supplier in this period
              </span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Supplier</th>
                  <th scope="col" className="text-end">
                    Orders
                  </th>
                  <th scope="col" className="text-end">
                    Total spent
                  </th>
                  <th scope="col" className="text-end">
                    Share of purchases
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchasesBySupplier.length === 0 && (
                  <tr>
                    <td colSpan={4} className="profit-loss-empty">
                      No purchase orders were placed in this period.
                    </td>
                  </tr>
                )}
                {purchasesBySupplier.map((entry) => {
                  const share =
                    totalInventoryPurchases === 0
                      ? 0
                      : Number(entry.totalAmount ?? 0) / totalInventoryPurchases;
                  return (
                    <tr key={entry.supplierName}>
                      <td>{entry.supplierName}</td>
                      <td className="text-end">
                        {formatNumber(entry.orderCount)}
                      </td>
                      <td className="text-end">
                        {formatCurrency(entry.totalAmount)}
                      </td>
                      <td className="text-end">{formatPercent(share)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState(TAB_KEYS.PROFIT_LOSS);

  const tabs = [
    { key: TAB_KEYS.PROFIT_LOSS, label: "Profit & Loss" },
    { key: TAB_KEYS.SALES, label: "Sales Summary" },
  ];

  return (
    <div className="reports-page">
      <div className="reports-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`reports-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === TAB_KEYS.PROFIT_LOSS ? <ProfitLossReport /> : <SalesSummary />}
    </div>
  );
};

export default Reports;
