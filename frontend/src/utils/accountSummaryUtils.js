export function getHomeAccountSummaryCards({ account }) {
  if (!account) return [];

  const balanceCard = {
    id: "balance",
    title: "Current Balance",
    value: formatCurrency(account.currentBalance, account.currency),
    note: account.status === "frozen" ? "Account frozen" : null,
  };

  if (account.type === "savings") {
    return [
      balanceCard,
      {
        id: "interest-rate",
        title: "Interest Rate",
        value:
          account.interestRate != null ? `${account.interestRate}% AER` : "—",
        note: null,
      },
      {
        id: "interest-earned",
        title: "Interest Earned (YTD)",
        value:
          account.interestEarnedYtd != null
            ? formatCurrency(account.interestEarnedYtd, account.currency)
            : "—",
        note: null,
      },
    ];
  }

  if (account.type === "credit") {
    return [
      balanceCard,
      {
        id: "credit-limit",
        title: "Credit Limit",
        value:
          account.creditLimit != null
            ? formatCurrency(account.creditLimit, account.currency)
            : "—",
        note: null,
      },
      {
        id: "available-credit",
        title: "Available Credit",
        value:
          account.availableCredit != null
            ? formatCurrency(account.availableCredit, account.currency)
            : "—",
        note:
          account.minimumPaymentDue > 0
            ? `Min. payment: ${formatCurrency(account.minimumPaymentDue, account.currency)}`
            : null,
      },
    ];
  }

  const transactions = account.transactions ?? [];
  const totalIn = sumTransactions(transactions, "+");
  const totalOut = sumTransactions(transactions, "-");

  return [
    balanceCard,
    {
      id: "money-in",
      title: "Money In",
      value: formatCurrency(totalIn, account.currency),
      note: `${transactions.filter((t) => t.amount?.startsWith("+")).length} transactions`,
    },
    {
      id: "money-out",
      title: "Money Out",
      value: formatCurrency(totalOut, account.currency),
      note: `${transactions.filter((t) => t.amount?.startsWith("-")).length} transactions`,
    },
  ];
}

// ── Transactions page cards ──────────────────────────────────────────────────

export function getAccountSummaryCards({
  account,
  incoming,
  outgoing,
  dateRangeLabel,
}) {
  if (!account) return [];

  const currency = account.currency ?? "GBP";
  const periodNote = dateRangeLabel ?? "This period";

  if (account.type === "savings") {
    return [
      {
        id: "savings-balance",
        title: "Savings Balance",
        value: formatCurrency(account.currentBalance, currency),
        note: account.status === "frozen" ? "Account frozen" : null,
      },
      {
        id: "interest-rate",
        title: "Interest Rate",
        value:
          account.interestRate != null ? `${account.interestRate}% AER` : "—",
        note: null,
      },
      {
        id: "interest-earned",
        title: "Interest Earned (YTD)",
        value:
          account.interestEarnedYtd != null
            ? formatCurrency(account.interestEarnedYtd, currency)
            : "—",
        note: null,
      },
    ];
  }

  if (account.type === "credit") {
    return [
      {
        id: "available-credit",
        title: "Available Credit",
        value:
          account.availableCredit != null
            ? formatCurrency(account.availableCredit, currency)
            : "—",
        note:
          account.creditLimit != null
            ? `Limit: ${formatCurrency(account.creditLimit, currency)}`
            : null,
      },
      {
        id: "statement-balance",
        title: "Statement Balance",
        value:
          account.statementBalance != null
            ? formatCurrency(account.statementBalance, currency)
            : "—",
        note: null,
      },
      {
        id: "minimum-payment",
        title: "Minimum Payment",
        value:
          account.minimumPaymentDue != null
            ? formatCurrency(account.minimumPaymentDue, currency)
            : "—",
        note: account.paymentDueDate
          ? `Due: ${new Date(account.paymentDueDate).toLocaleDateString("en-GB")}`
          : null,
      },
    ];
  }

  // Current account
  return [
    {
      id: "current-balance",
      title: "Current Balance",
      value: formatCurrency(account.currentBalance, currency),
      note: account.status === "frozen" ? "Account frozen" : null,
    },
    {
      id: "incoming",
      title: "Money In",
      value: formatCurrency(incoming ?? 0, currency),
      note: periodNote,
    },
    {
      id: "outgoing",
      title: "Money Out",
      value: formatCurrency(outgoing ?? 0, currency),
      note: periodNote,
    },
  ];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount, currency = "GBP") {
  const num = parseFloat(amount) || 0;
  if (currency === "GBP") return `£${num.toFixed(2)}`;
  return `${num.toFixed(2)} ${currency}`;
}

function sumTransactions(transactions, sign) {
  return transactions
    .filter((t) => t.amount?.startsWith(sign))
    .reduce((sum, t) => sum + parseFloat(t.amount.replace(/[^0-9.]/g, "")), 0);
}
