import { API_BASE_URL, buildAuthHeaders, handleJsonResponse } from "./http";

const purchaseOrdersEndpoint = new URL("/purchase-orders", API_BASE_URL).toString();

export const fetchPurchaseOrders = async ({ start, end, signal } = {}) => {
  const url = new URL(purchaseOrdersEndpoint);
  if (start) {
    url.searchParams.set("start", start);
  }
  if (end) {
    url.searchParams.set("end", end);
  }

  const response = await fetch(url, {
    signal,
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  return handleJsonResponse(response, "Failed to load purchase orders");
};

export const createPurchaseOrder = async (payload) => {
  const response = await fetch(purchaseOrdersEndpoint, {
    method: "POST",
    headers: buildAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response, "Failed to create purchase order");
};

export const receivePurchaseOrder = async (purchaseOrderId, payload) => {
  const response = await fetch(
    `${purchaseOrdersEndpoint}/${purchaseOrderId}/receive`,
    {
      method: "PUT",
      headers: buildAuthHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    }
  );

  return handleJsonResponse(response, "Failed to receive purchase order");
};

export const cancelPurchaseOrder = async (purchaseOrderId) => {
  const response = await fetch(
    `${purchaseOrdersEndpoint}/${purchaseOrderId}/cancel`,
    {
      method: "PUT",
      headers: buildAuthHeaders({ Accept: "application/json" }),
    }
  );

  return handleJsonResponse(response, "Failed to cancel purchase order");
};

