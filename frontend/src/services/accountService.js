const API_BASE = "http://127.0.0.1:8000/api";

export async function getAccountsForUser() {
  const response = await fetch(`${API_BASE}/accounts/`);

  if (!response.ok) {
    throw new Error("Failed to fetch accounts.");
  }

  return response.json();
}

export async function getAccountByKeyForUser(userId, accountKey) {
  const response = await fetch(`${API_BASE}/accounts/by-key/${accountKey}/`);

  if (!response.ok) {
    throw new Error("Failed to fetch account.");
  }

  return response.json();
}