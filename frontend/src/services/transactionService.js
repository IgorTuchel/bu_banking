import { authenticatedFetch } from "./authService";

const API = "http://127.0.0.1:8000/api";

async function fetchJSON(url) {
  const res = await authenticatedFetch(url);
  if (!res.ok) throw new Error(`${res.status} — ${url}`);
  return res.json();
}

export async function getTransactionsForAccount(accountId) {
  return fetchJSON(`${API}/accounts/${accountId}/transactions/`);
}
