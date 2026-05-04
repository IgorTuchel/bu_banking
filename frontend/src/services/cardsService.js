import { authenticatedFetch } from "./authService";

const API_BASE = "http://127.0.0.1:8000/api";

/* 🔥 Fetch live cards via Django proxy (secure) */
async function getLiveNetworkCards() {
  const response = await authenticatedFetch(
    `${API_BASE}/payment-network/cards/me/`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch live card balances.");
  }

  const data = await response.json();

  return Array.isArray(data.cards) ? data.cards : [];
}

/* 🔥 Merge Django cards with live network balances */
function mergeCardsWithLiveBalances(localCards, networkCards) {
  return localCards.map((localCard) => {
    const liveCard = networkCards.find(
      (networkCard) =>
        String(networkCard.card_number) ===
        String(localCard.networkCardNumber)
    );

    return {
      ...localCard,
      liveBalance: liveCard?.balance ?? null,
      startingBalance: liveCard?.starting_balance ?? null,
      networkCreatedAt: liveCard?.created_at ?? null,
      isNetworkLinked: Boolean(liveCard),
    };
  });
}

/* 🔥 MAIN: Get cards for account (now includes live balances) */
export async function getCardsForAccount(accountId) {
  const response = await authenticatedFetch(
    `${API_BASE}/accounts/${accountId}/cards/`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch cards.");
  }

  const localCards = await response.json();

  try {
    const networkCards = await getLiveNetworkCards();
    return mergeCardsWithLiveBalances(localCards, networkCards);
  } catch (error) {
    console.error("Live balance fetch failed:", error);

    // fallback: still return local cards
    return localCards.map((card) => ({
      ...card,
      liveBalance: null,
      startingBalance: null,
      networkCreatedAt: null,
      isNetworkLinked: false,
    }));
  }
}

/* 🔧 Update card settings */
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

/* 🔥 Reveal CVV */
export async function revealCvv(cardId) {
  const response = await authenticatedFetch(
    `${API_BASE}/cards/${cardId}/reveal-cvv/`
  );

  if (!response.ok) {
    throw new Error("Failed to reveal CVV.");
  }

  return response.json();
}

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

export async function updateRoundUpSettings(accountId, updates) {
  const response = await authenticatedFetch(
    `${API_BASE}/accounts/${accountId}/round-up/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update round-up settings.");
  }

  return response.json();
}