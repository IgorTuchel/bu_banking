import { authenticatedFetch } from "./authService";

const API = "http://127.0.0.1:8000/api";

async function fetchJSON(url, options = {}) {
  const res = await authenticatedFetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function getNetworkBanks() {
  return fetchJSON(`${API}/network/banks/`);
}

export async function getNetworkStatus() {
  return fetchJSON(`${API}/network/status/`);
}

export async function submitNetworkTransfer({
  fromAccountKey,
  cardNumber,
  acquiringBankId,
  merchantId,
  amount,
  reference,
}) {
  return fetchJSON(`${API}/network/transfer/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromAccountKey,
      cardNumber,
      acquiringBankId,
      merchantId,
      amount,
      reference,
    }),
  });
}
