import { authenticatedFetch } from "./authService";

const API_BASE = "http://127.0.0.1:8000/api";

export async function getTransactionsForAccount(accountId) {
  const response = await authenticatedFetch(
    `${API_BASE}/accounts/${accountId}/transactions/`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transactions.");
  }

  return response.json();
}