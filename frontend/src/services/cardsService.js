const API_BASE = "http://127.0.0.1:8000/api";

export async function getCardsForAccount(accountId) {
  const response = await fetch(`${API_BASE}/accounts/${accountId}/cards/`);

  if (!response.ok) {
    throw new Error("Failed to fetch cards.");
  }

  return response.json();
}

export async function updateCard(cardId, updates) {
  const response = await fetch(`${API_BASE}/cards/${cardId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update card.");
  }

  return response.json();
}