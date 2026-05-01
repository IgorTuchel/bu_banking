/**
 * Parse a formatted amount string like "+£10.50" or "-£5.99" into a number.
 */
export function getAmountValue(amount) {
  if (typeof amount === "number") return amount;
  const str = String(amount).replace(/[^0-9.\-+]/g, "");
  return parseFloat(str) || 0;
}

/**
 * Format a timestamp into a readable date string.
 */
export function formatTransactionDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Return the label for a date range key.
 */
export function getDateRangeLabel(dateRange) {
  const labels = {
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    last3Months: "Last 3 Months",
    last6Months: "Last 6 Months",
    thisYear: "This Year",
    all: "All Time",
  };
  return labels[dateRange] ?? "This Month";
}

/**
 * Filter transactions by a named date range.
 */
export function filterTransactionsByDateRange(transactions, dateRange) {
  if (!transactions) return [];
  if (dateRange === "all") return transactions;

  const now = new Date();

  const startOf = (unit) => {
    const d = new Date(now);

    if (unit === "day") {
      d.setHours(0, 0, 0, 0);
      return d;
    }

    if (unit === "week") {
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }

    if (unit === "month") {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    if (unit === "year") {
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    return d;
  };

  const cutoff = {
    today: startOf("day"),
    thisWeek: startOf("week"),
    thisMonth: startOf("month"),
    last3Months: new Date(now.getFullYear(), now.getMonth() - 3, 1),
    last6Months: new Date(now.getFullYear(), now.getMonth() - 6, 1),
    thisYear: startOf("year"),
  }[dateRange];

  if (!cutoff) return transactions;

  return transactions.filter((t) => {
    const ts = t.timestamp ? new Date(t.timestamp) : null;
    return ts && ts >= cutoff;
  });
}

/**
 * Group transactions:
 * - Today
 * - Yesterday
 * - This Week
 * - Then Month/Year
 */
export function groupTransactions(transactions) {
  const groups = new Map();

  for (const transaction of transactions) {
    const label = getGroupLabel(transaction.timestamp);

    if (!groups.has(label)) {
      groups.set(label, []);
    }

    groups.get(label).push(transaction);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

function getGroupLabel(timestamp) {
  if (!timestamp) return "Unknown Date";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown Date";

  const now = new Date();

  // ── Today / Yesterday ─────────────────────
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const txDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDay.getTime() === today.getTime()) return "Today";
  if (txDay.getTime() === yesterday.getTime()) return "Yesterday";

  // ── This Week ─────────────────────────────
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  if (txDay >= startOfWeek) return "This Week";

  // ── Monthly fallback ──────────────────────
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Append a running balance to each transaction.
 */
export function addRunningBalance(transactions, availableBalance) {
  let balance = Number(availableBalance) || 0;

  return transactions.map((transaction) => {
    const runningBalance = balance;
    balance -= getAmountValue(transaction.amount ?? "0");
    return { ...transaction, runningBalance };
  });
}

/**
 * Recent transactions (dashboard)
 */
export function getHomeRecentTransactions(transactions, limit = 15) {
  if (!transactions || transactions.length === 0) return [];

  return [...transactions]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}