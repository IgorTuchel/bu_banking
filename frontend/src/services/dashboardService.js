import { authenticatedFetch } from "./authService";
import { ArrowLeftRight, HandCoins, CreditCard, PieChart } from "lucide-react";
import { getCardsForAccount } from "./cardsService";

const API = "http://127.0.0.1:8000/api";

async function fetchJSON(url) {
  const res = await authenticatedFetch(url);

  if (!res.ok) {
    throw new Error(`${res.status} — ${url}`);
  }

  return res.json();
}

function applyLiveCardBalance(account, cards = []) {
  const linkedCards = cards.filter(
    (card) =>
      card.isNetworkLinked &&
      card.liveBalance !== null &&
      card.liveBalance !== undefined
  );

  if (linkedCards.length === 0 || account.type === "credit") {
    return {
      ...account,
      cards,
    };
  }

  const liveBalance = linkedCards.reduce(
    (sum, card) => sum + Number(card.liveBalance ?? 0),
    0
  );

  return {
    ...account,
    cards,
    currentBalance: liveBalance,
    availableBalance: liveBalance,
    liveCardBalance: liveBalance,
    isNetworkLinked: true,
    linkedCards,
  };
}

export async function getDashboardData() {
  const [user, accounts] = await Promise.all([
    fetchJSON(`${API}/me/`),
    fetchJSON(`${API}/accounts/`),
  ]);

  const accountsWithTransactions = await Promise.all(
    accounts.map(async (account) => {
      const [transactions, cards] = await Promise.all([
        fetchJSON(`${API}/accounts/${account.id}/transactions/`),
        getCardsForAccount(account.id).catch((error) => {
          console.error("Unable to load cards for dashboard:", error);
          return [];
        }),
      ]);

      return applyLiveCardBalance(
        {
          ...account,
          transactions,
        },
        cards
      );
    })
  );

  return {
    user: {
      firstName: user.firstName || user.first_name || user.username || "there",
      lastName: user.lastName || user.last_name || "",
      email: user.email,
      lastLogin: user.lastLogin,
    },
    accounts: accountsWithTransactions,
    notifications: [],
    quickActions: [
      {
        id: "transfer",
        label: "Transfer",
        description: "Move money between accounts",
        path: "/transfer",
        icon: ArrowLeftRight,
      },
      {
        id: "request",
        label: "Request Payment",
        description: "Ask someone to pay you",
        path: "/request-payment",
        icon: HandCoins,
      },
      {
        id: "cards",
        label: "Cards",
        description: "Freeze, manage and view cards",
        path: "/cards",
        icon: CreditCard,
      },
      {
        id: "spending-insights",
        label: "Spending Insights",
        description: "Analyse your spending habits",
        path: "/spending-insights",
        icon: PieChart,
      },
    ],
  };
}

export async function getAccountTransactions(accountId) {
  return fetchJSON(`${API}/accounts/${accountId}/transactions/`);
}

export async function getAccountCards(accountId) {
  return fetchJSON(`${API}/accounts/${accountId}/cards/`);
}

export async function getAccountByKey(displayKey) {
  return fetchJSON(`${API}/accounts/by-key/${displayKey}/`);
}

export async function updateCard(cardId, fields) {
  const res = await authenticatedFetch(`${API}/cards/${cardId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });

  if (!res.ok) {
    throw new Error(`Failed to update card ${cardId}`);
  }

  return res.json();
}