import { API_BASE_URL, buildAuthHeaders, handleJsonResponse } from "./http";

const expensesEndpoint = new URL("/expenses", API_BASE_URL).toString();

export const fetchExpenses = async ({ startDate, endDate, signal } = {}) => {
  const url = new URL(expensesEndpoint);
  if (startDate) url.searchParams.set("start", startDate);
  if (endDate) url.searchParams.set("end", endDate);

  const response = await fetch(url.toString(), {
    signal,
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  return handleJsonResponse(response, "Failed to load expenses");
};

export const createExpense = async (payload) => {
  const response = await fetch(expensesEndpoint, {
    method: "POST",
    headers: buildAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response, "Failed to create expense");
};

export const deleteExpense = async (expenseId) => {
  const response = await fetch(`${expensesEndpoint}/${expenseId}`, {
    method: "DELETE",
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  await handleJsonResponse(response, "Failed to delete expense");
};
