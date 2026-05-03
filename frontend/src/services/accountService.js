import { authenticatedFetch } from "./authService";
import { getCardsForAccount } from "./cardsService";

const API = "http://127.0.0.1:8000/api";

async function fetchJSON(url) {
  const res = await authenticatedFetch(url);
  if (!res.ok) throw new Error(`${res.status} — ${url}`);
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
    return account;
  }

  const liveBalance = linkedCards.reduce(
    (sum, card) => sum + Number(card.liveBalance ?? 0),
    0
  );

  return {
    ...account,
    currentBalance: liveBalance,
    availableBalance: liveBalance,
    liveCardBalance: liveBalance,
    isNetworkLinked: true,
    linkedCards,
  };
}

export async function getAccountsForUser(_userId) {
  const accounts = await fetchJSON(`${API}/accounts/`);

  const enrichedAccounts = await Promise.all(
    accounts.map(async (account) => {
      try {
        const cards = await getCardsForAccount(account.id);
        return applyLiveCardBalance(account, cards);
      } catch (error) {
        console.error("Unable to enrich account with live card balance:", error);
        return account;
      }
    })
  );

  return enrichedAccounts;
}

export async function getAccountByKeyForUser(displayKey) {
  const account = await fetchJSON(`${API}/accounts/by-key/${displayKey}/`);

  try {
    const cards = await getCardsForAccount(account.id);
    return applyLiveCardBalance(account, cards);
  } catch (error) {
    console.error("Unable to enrich selected account:", error);
    return account;
  }
}