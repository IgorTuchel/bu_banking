import { authenticatedFetch } from "./authService";

const API_BASE = "http://127.0.0.1:8000/api";

export async function getCardsForAccount(accountId) {
  const response = await authenticatedFetch(
    `${API_BASE}/accounts/${accountId}/cards/`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch cards.");
  }

  return response.json();
}

export async function updateCard(cardId, updates) {
  const response = await authenticatedFetch(`${API_BASE}/cards/${cardId}/`, {
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

/* 🔥 Reveal CVV (generated on demand) */
export async function revealCvv(cardId) {
  const response = await authenticatedFetch(
    `${API_BASE}/cards/${cardId}/reveal-cvv/`
  );

  if (!response.ok) {
    throw new Error("Failed to reveal CVV.");
  }

  return response.json();
}

/* 🔥 NEW: Cancel + Replace Card */
export async function cancelAndReplaceCard(cardId) {
  const response = await authenticatedFetch(
    `${API_BASE}/cards/${cardId}/cancel/`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to cancel and replace card.");
  }

  return response.json();
}