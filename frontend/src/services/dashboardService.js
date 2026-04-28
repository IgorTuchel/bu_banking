import { authenticatedFetch } from "./authService";
// src/services/dashboardService.js
import { ArrowLeftRight, HandCoins, FileText, PieChart } from "lucide-react";

const API = "http://127.0.0.1:8000/api";

async function fetchJSON(url) {
  const res = await authenticatedFetch(url);

  if (!res.ok) {
    throw new Error(`${res.status} — ${url}`);
  }

  return res.json();
}

export async function getDashboardData() {
  const [user, accounts] = await Promise.all([
    fetchJSON(`${API}/me/`),
    fetchJSON(`${API}/accounts/`),
  ]);

  const accountsWithTransactions = await Promise.all(
    accounts.map(async (account) => {
      const transactions = await fetchJSON(
        `${API}/accounts/${account.id}/transactions/`,
      );

      return {
        ...account,
        transactions,
      };
    }),
  );
  console.log(user.lastLogin);
  console.log(user);
  return {
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
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
        id: "statements",
        label: "Statements",
        description: "View and download statements",
        path: "/statements",
        icon: FileText,
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
