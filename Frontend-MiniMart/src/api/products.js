import { API_BASE_URL, buildAuthHeaders, handleJsonResponse } from "./http";

const productsEndpoint = new URL("/products", API_BASE_URL).toString();

export const fetchProducts = async ({ signal } = {}) => {
  const response = await fetch(productsEndpoint, {
    signal,
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  return handleJsonResponse(response, "Failed to load products");
};

export const fetchInStockProducts = async ({ signal } = {}) => {
  const response = await fetch(`${productsEndpoint}/in-stock`, {
    signal,
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  return handleJsonResponse(response, "Failed to load in-stock products");
};

export const createProduct = async (payload) => {
  const response = await fetch(productsEndpoint, {
    method: "POST",
    headers: buildAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response, "Failed to create product");
};

export const updateProduct = async (productId, payload) => {
  const response = await fetch(`${productsEndpoint}/${productId}`, {
    method: "PUT",
    headers: buildAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response, "Failed to update product");
};

export const deleteProduct = async (productId) => {
  const response = await fetch(`${productsEndpoint}/${productId}`, {
    method: "DELETE",
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  await handleJsonResponse(response, "Failed to delete product");
};

export const fetchPreferredSupplier = async (productId, { signal } = {}) => {
  const response = await fetch(`${productsEndpoint}/${productId}/preferred-supplier`, {
    signal,
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  return handleJsonResponse(response, "Failed to load preferred supplier");
};
