import { authenticatedFetch } from "./authService";

const API = "http://127.0.0.1:8000/api";

async function fetchJSON(url) {
  const res = await authenticatedFetch(url);
  if (!res.ok) throw new Error(`${res.status} — ${url}`);
  return res.json();
}

// Map a raw API account to the shape Statements expects
function mapAccount(raw) {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.account_type ?? raw.type ?? "current",
    key: raw.display_key ?? raw.key,
    sortCode: raw.sort_code ?? raw.sortCode ?? "N/A",
    maskedAccountNumber:
      raw.masked_account_number ?? raw.maskedAccountNumber ?? "N/A",
  };
}
function mapTransaction(raw, accountId) {
  const status = raw.status
    ? raw.status.charAt(0).toUpperCase() + raw.status.slice(1).toLowerCase()
    : "Completed";

  return {
    id: raw.id,
    accountId: raw.accountId ?? accountId, // API already sends accountId!
    timestamp: raw.timestamp,
    name:
      raw.name ||
      raw.description ||
      raw.payeeName ||
      raw.payerName ||
      "Transaction",
    category: raw.category ?? "",
    amount: raw.amount, // ✅ already "+£5.00" or "-£5.00"
    status,
    paymentType: raw.paymentType ?? "",
  };
}

export async function getStatementsData() {
  // 1. Fetch all accounts
  const rawAccounts = await fetchJSON(`${API}/accounts/`);
  const accounts = rawAccounts.map(mapAccount);

  // 2. For each account fetch its transactions
  const allTransactions = [];

  await Promise.all(
    accounts.map(async (account) => {
      try {
        const rawTxns = await fetchJSON(
          `${API}/accounts/${account.id}/transactions/`,
        );

        const mapped = rawTxns.map((t) => mapTransaction(t, account.id));
        allTransactions.push(...mapped);
      } catch {
        // Account may have no transactions yet — skip silently
      }
    }),
  );

  return { accounts, transactions: allTransactions };
}
