import { API_BASE_URL, buildAuthHeaders, handleJsonResponse } from "./http";

const dashboardEndpoint = new URL("/reports/dashboard", API_BASE_URL).toString();
const salesSummaryEndpoint = new URL("/reports/sales-summary", API_BASE_URL).toString();
const profitLossEndpoint = new URL("/reports/profit-loss", API_BASE_URL).toString();

const buildReportUrl = (endpoint, { startDate, endDate, locationId } = {}) => {
  const url = new URL(endpoint);

  if (startDate) {
    url.searchParams.set("startDate", startDate);
  }
  if (endDate) {
    url.searchParams.set("endDate", endDate);
  }
  if (locationId) {
    url.searchParams.set("locationId", locationId);
  }

  return url;
};

const fetchReport = async (url, signal, fallbackMessage) => {
  const response = await fetch(url.toString(), {
    signal,
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  return handleJsonResponse(response, fallbackMessage);
};

export const fetchDashboardReport = async ({ locationId, signal } = {}) => {
  const url = buildReportUrl(dashboardEndpoint, { locationId });
  return fetchReport(url, signal, "Failed to load dashboard report");
};

export const fetchSalesSummaryReport = async ({ locationId, signal } = {}) => {
  const url = buildReportUrl(salesSummaryEndpoint, { locationId });
  return fetchReport(url, signal, "Failed to load sales summary report");
};

export const fetchProfitLossReport = async ({
  startDate,
  endDate,
  locationId,
  signal,
} = {}) => {
  const url = buildReportUrl(profitLossEndpoint, {
    startDate,
    endDate,
    locationId,
  });
  return fetchReport(url, signal, "Failed to load profit and loss report");
};
