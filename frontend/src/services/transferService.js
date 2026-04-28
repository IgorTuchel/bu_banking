import { authenticatedFetch } from "./authService";

const API = "http://127.0.0.1:8000/api";

export async function submitTransfer(payload) {
  const res = await authenticatedFetch(`${API}/transfers/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error ?? "Transfer failed.");

  return data;
}
