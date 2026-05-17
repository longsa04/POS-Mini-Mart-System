import "./dashboard.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import posConfig from "../../../config/posConfig";
import { fetchDashboardReport } from "../../../api/reports";

const { currencySymbol: CURRENCY_SYMBOL } = posConfig;

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

const normalizePaymentStatus = (value) =>
  (typeof value === "string" ? value : "").toUpperCase();

const buildLineChart = (data, width = 120, height = 48, padding = 6) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { path: "", points: [] };
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const scaleY = (value) =>
    height - padding - (value / maxValue) * (height - padding * 2);

  const points = data.map((item, index) => ({
    x: padding + index * step,
    y: scaleY(item.value),
    label: item.label,
    value: item.value,
  }));

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return { path, points };
};

const Dashboard = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async (signal) => {
    setError(null);
    try {
      const data = await fetchDashboardReport({ signal });

      if (signal?.aborted) {
        return;
      }

      setReport(data ?? null);
      setLastUpdated(new Date());
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      setError(err.message || "Unable to load dashboard data.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    loadDashboard(controller.signal).finally(() => {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    });

    return () => controller.abort();
  }, [loadDashboard]);

  const handleRefresh = () => {
    const controller = new AbortController();
    setLoading(true);
    loadDashboard(controller.signal).finally(() => {
      setLoading(false);
    });
  };

  const dailySales = report?.dailySales ?? [];
  const revenueLast7Days = Number(report?.revenueLast7Days ?? 0);
  const orderCountLast7Days = Number(report?.orderCountLast7Days ?? 0);
  const pendingOrdersCount = Number(report?.pendingOrdersCount ?? 0);
  const totalOrdersCount = Number(report?.totalOrdersCount ?? 0);
  const averageOrderValue = Number(report?.averageOrderValue ?? 0);
  const overallAverageOrderValue = Number(report?.overallAverageOrderValue ?? 0);
  const customerCount = Number(report?.customerCount ?? 0);
  const uniqueCustomersServed = Number(report?.uniqueCustomersServed ?? 0);
  const topProducts = report?.topProducts ?? [];
  const categoryMix = report?.categoryMix ?? [];
  const lowStockItems = report?.lowStockItems ?? [];
  const recentOrders = report?.recentOrders ?? [];

  const { path: salesPath, points: salesPoints } = useMemo(
    () => buildLineChart(dailySales),
    [dailySales]
  );

  const formatStatusVariant = (status) => {
    const value = normalizePaymentStatus(status);
    switch (value) {
      case "PAID":
        return "success";
      case "PENDING":
      case "HOLD":
        return "warning";
      case "CANCELLED":
      case "VOID":
        return "danger";
      default:
        return "secondary";
    }
  };

  const formatDateTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2 className="mb-1">Chbar Ampov Overview</h2>
          <p className="text-secondary mb-0">
            Real-time trading snapshot for the mini mart branch.
          </p>
        </div>
        <div className="dashboard-header-actions">
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
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <section className="dashboard-kpis">
        <article className="kpi-card">
          <div className="kpi-body">
            <span className="kpi-label">Revenue (last 7 days)</span>
            <span className="kpi-value">{formatCurrency(revenueLast7Days)}</span>
          </div>
          <span className="kpi-meta text-secondary">
            {orderCountLast7Days
              ? `${formatNumber(orderCountLast7Days)} paid orders`
              : "No paid orders yet"}
          </span>
        </article>
        <article className="kpi-card">
          <div className="kpi-body">
            <span className="kpi-label">Pending payments</span>
            <span className="kpi-value">{formatNumber(pendingOrdersCount)}</span>
          </div>
          <span className="kpi-meta text-secondary">
            {formatNumber(totalOrdersCount)} total orders recorded
          </span>
        </article>
        <article className="kpi-card">
          <div className="kpi-body">
            <span className="kpi-label">Average order value</span>
            <span className="kpi-value">{formatCurrency(averageOrderValue)}</span>
          </div>
          <span className="kpi-meta text-secondary">
            All-time average: {formatCurrency(overallAverageOrderValue)}
          </span>
        </article>
        <article className="kpi-card">
          <div className="kpi-body">
            <span className="kpi-label">Customer base</span>
            <span className="kpi-value">{formatNumber(customerCount)}</span>
          </div>
          <span className="kpi-meta text-secondary">
            Served this week: {formatNumber(uniqueCustomersServed)}
          </span>
        </article>
      </section>

      <div className="dashboard-main">
        <div className="dashboard-column">
          <section className="dashboard-panel">
            <div className="panel-heading">
              <h6>Daily sales (last 7 days)</h6>
              <span className="text-secondary small">Paid orders only</span>
            </div>
            <div className="sales-chart">
              <svg viewBox="0 0 120 48" preserveAspectRatio="none">
                <line
                  x1="6"
                  y1="40"
                  x2="114"
                  y2="40"
                  className="chart-baseline"
                />
                {salesPath && <path className="line-stroke" d={salesPath} />}
                {salesPoints.map((point, index) => (
                  <circle
                    key={`${point.label}-${index}`}
                    className="line-dot"
                    cx={point.x}
                    cy={point.y}
                    r={2.4}
                  />
                ))}
              </svg>
              <div className="sales-chart-axis">
                {dailySales.map((day) => (
                  <span key={day.key}>{day.label}</span>
                ))}
              </div>
              <div className="sales-chart-summary">
                <div>
                  <span className="text-secondary small">Revenue</span>
                  <strong>{formatCurrency(revenueLast7Days)}</strong>
                </div>
                <div>
                  <span className="text-secondary small">Orders</span>
                  <strong>{formatNumber(orderCountLast7Days)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <h6>Recent orders</h6>
              <span className="text-secondary small">
                Latest six transactions
              </span>
            </div>
            <div className="table-responsive dashboard-table">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Invoice</th>
                    <th scope="col">Customer</th>
                    <th scope="col" className="text-end">
                      Total
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-secondary py-4">
                        No orders recorded yet.
                      </td>
                    </tr>
                  )}
                  {recentOrders.map((order) => (
                    <tr key={order?.orderId}>
                      <td>{order?.orderId ?? "-"}</td>
                      <td>{order?.customerName ?? "Walk-in"}</td>
                      <td className="text-end">
                        {formatCurrency(order?.total)}
                      </td>
                      <td>
                        <span
                          className={`badge bg-${formatStatusVariant(
                            order?.paymentStatus
                          )}`}
                        >
                          {normalizePaymentStatus(order?.paymentStatus) || "-"}
                        </span>
                      </td>
                      <td>{formatDateTime(order?.orderDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="dashboard-column">
          <section className="dashboard-panel">
            <div className="panel-heading">
              <h6>Category mix</h6>
              <span className="text-secondary small">Share of units sold</span>
            </div>
            <div className="category-mix">
              {categoryMix.length === 0 && (
                <p className="text-secondary small mb-0">
                  No category sales recorded yet.
                </p>
              )}
              {categoryMix.map((item) => (
                <div className="category-row" key={item.name}>
                  <div className="category-meta">
                    <span className="category-name">{item.name}</span>
                    <span className="category-quantity">
                      {formatNumber(item.quantity)} pcs
                    </span>
                  </div>
                  <div className="category-bar">
                    <div
                      className="category-fill"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className="category-percent">{item.percent}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <h6>Top products</h6>
              <span className="text-secondary small">
                Based on quantity sold
              </span>
            </div>
            <div className="top-products-list">
              {topProducts.length === 0 && (
                <p className="text-secondary small mb-0">
                  Sales data will appear once orders are processed.
                </p>
              )}
              {topProducts.map((product) => (
                <div
                  className="top-product"
                  key={product.productId ?? product.productName}
                >
                  <div>
                    <div className="fw-semibold">{product.productName}</div>
                    <div className="text-secondary small">
                      {formatNumber(product.quantitySold)} units sold
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-semibold">
                      {formatCurrency(product.totalSales)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <h6>Low stock alerts</h6>
              <span className="text-secondary small">Threshold: 15 units</span>
            </div>
            <div className="low-stock-list">
              {lowStockItems.length === 0 && (
                <p className="text-secondary small mb-0">
                  Inventory levels look healthy.
                </p>
              )}
              {lowStockItems.map((item) => (
                <div className="low-stock-item" key={item.stockId}>
                  <div>
                    <div className="fw-semibold">{item.productName}</div>
                    <div className="text-secondary small">
                      {item.locationName ?? "Unknown location"}
                    </div>
                  </div>
                  <span className="badge bg-warning-subtle text-warning">
                    {formatNumber(item.quantity ?? 0)} in stock
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
