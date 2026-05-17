import { API_BASE_URL, buildAuthHeaders, handleJsonResponse } from "./http";

const suppliersEndpoint = new URL("/suppliers", API_BASE_URL).toString();

export const fetchSuppliers = async ({ signal } = {}) => {
  const response = await fetch(suppliersEndpoint, {
    signal,
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  return handleJsonResponse(response, "Failed to load suppliers");
};

export const createSupplier = async (payload) => {
  const response = await fetch(suppliersEndpoint, {
    method: "POST",
    headers: buildAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response, "Failed to create supplier");
};

export const updateSupplier = async (supplierId, payload) => {
  const response = await fetch(`${suppliersEndpoint}/${supplierId}`, {
    method: "PUT",
    headers: buildAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response, "Failed to update supplier");
};

export const deleteSupplier = async (supplierId) => {
  const response = await fetch(`${suppliersEndpoint}/${supplierId}`, {
    method: "DELETE",
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  await handleJsonResponse(response, "Failed to delete supplier");
};

export const fetchSupplierProducts = async (supplierId, { signal } = {}) => {
  const response = await fetch(`${suppliersEndpoint}/${supplierId}/products`, {
    signal,
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  return handleJsonResponse(response, "Failed to load supplier products");
};
