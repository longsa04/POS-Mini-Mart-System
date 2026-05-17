import { API_BASE_URL, buildAuthHeaders, handleJsonResponse } from "./http";

const productsEndpoint = new URL("/products", API_BASE_URL).toString();

export const fetchPreferredSupplier = async ({ productId, signal } = {}) => {
  if (!productId) {
    return null;
  }
  const response = await fetch(`${productsEndpoint}/${productId}/preferred-supplier`, {
    signal,
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  return handleJsonResponse(response, "Failed to load preferred supplier");
};

export const setPreferredSupplier = async (productId, payload) => {
  const response = await fetch(`${productsEndpoint}/${productId}/preferred-supplier`, {
    method: "PUT",
    headers: buildAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload ?? {}),
  });

  return handleJsonResponse(response, "Failed to update preferred supplier");
};
