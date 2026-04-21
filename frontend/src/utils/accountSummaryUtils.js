import { getAmountValue } from "./transactionUtils";
import { scheduledPaymentsData } from "../data/scheduledPaymentsData";

function formatMoney(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(Number(value ?? 0));
}

function getRecentSpending(transactions = [], days = 7) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);

  return transactions
    .filter((transaction) => {
      const timestamp = transaction?.timestamp;
      if (!timestamp) {
        return false;
      }

      const transactionDate = new Date(timestamp);
      const amount = getAmountValue(transaction?.amount ?? "0");

      return transactionDate >= start && amount < 0;
    })
    .reduce((sum, transaction) => {
      return sum + Math.abs(getAmountValue(transaction.amount ?? "0"));
    }, 0);
}

function getUpcomingPayments(accountId, days = 7) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);

  const payments = scheduledPaymentsData.filter((payment) => {
    if (payment.accountId !== accountId || payment.status !== "active") {
      return false;
    }

    const paymentDate = new Date(payment.nextPaymentDate);
    return paymentDate >= now && paymentDate <= end;
  });

  const total = payments.reduce((sum, payment) => {
    return sum + Math.abs(getAmountValue(payment.amount ?? "0"));
  }, 0);

  return {
    total,
    count: payments.length,
  };
}

export function getAccountSummaryCards({
  account,
  incoming = 0,
  outgoing = 0,
  dateRangeLabel = "",
}) {
  if (!account) {
    return [];
  }

  const currency = account.currency ?? "GBP";

  if (account.type === "savings") {
    return [
      {
        id: "savings-balance",
        title: "Savings Balance",
        value: formatMoney(account.currentBalance, currency),
        note: "Available balance",
      },
      {
        id: "interest-earned",
        title: "Interest Earned",
        value: formatMoney(account.interestEarnedYtd, currency),
        note: "Year to date",
      },
      {
        id: "interest-rate",
        title: "Interest Rate",
        value: `${Number(account.interestRate ?? 0).toFixed(2)}%`,
        note: "AER variable",
      },
    ];
  }

  if (account.type === "credit") {
    return [
      {
        id: "available-credit",
        title: "Available Credit",
        value: formatMoney(account.availableCredit, currency),
        note: "Available to spend",
      },
      {
        id: "credit-limit",
        title: "Credit Limit",
        value: formatMoney(account.creditLimit, currency),
        note: "Total credit limit",
      },
      {
        id: "minimum-payment",
        title: "Minimum Payment",
        value: formatMoney(account.minimumPaymentDue, currency),
        note: "Due next statement",
      },
    ];
  }

  return [
    {
      id: "current-balance",
      title: "Current Balance",
      value: formatMoney(account.currentBalance, currency),
      note: "Includes pending transactions",
    },
    {
      id: "incoming",
      title: "Incoming",
      value: formatMoney(incoming, currency),
      note: dateRangeLabel,
    },
    {
      id: "outgoing",
      title: "Outgoing",
      value: formatMoney(outgoing, currency),
      note: dateRangeLabel,
    },
  ];
}

export function getHomeAccountSummaryCards({ account }) {
  if (!account) {
    return [];
  }

  const currency = account.currency ?? "GBP";
  const transactions = Array.isArray(account.transactions)
    ? account.transactions
    : [];

  if (account.type === "current") {
    const spending = getRecentSpending(transactions, 7);
    const upcoming = getUpcomingPayments(account.id, 7);

    return [
      {
        id: "available-balance",
        title: "Available Balance",
        value: formatMoney(account.currentBalance, currency),
        note: "Updated just now",
      },
      {
        id: "upcoming-payments",
        title: "Upcoming Payments",
        value: formatMoney(upcoming.total, currency),
        note:
          upcoming.count > 0
            ? `${upcoming.count} due in next 7 days`
            : "No upcoming payments",
      },
      {
        id: "recent-spending",
        title: "Recent Spending",
        value: formatMoney(spending, currency),
        note: "Last 7 days",
      },
    ];
  }

  return getAccountSummaryCards({ account });
}