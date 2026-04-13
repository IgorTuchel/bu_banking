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
  const formatMoney = (value) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(Number(value ?? 0));

  if (account.type === "savings") {
    return [
      {
        id: "savings-balance",
        title: "Savings Balance",
        value: formatMoney(account.currentBalance),
        note: "Available balance",
      },
      {
        id: "interest-earned",
        title: "Interest Earned",
        value: formatMoney(account.interestEarnedYtd),
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
        value: formatMoney(account.availableCredit),
        note: "Available to spend",
      },
      {
        id: "credit-limit",
        title: "Credit Limit",
        value: formatMoney(account.creditLimit),
        note: "Total credit limit",
      },
      {
        id: "minimum-payment",
        title: "Minimum Payment",
        value: formatMoney(account.minimumPaymentDue),
        note: "Due next statement",
      },
    ];
  }

  return [
    {
      id: "current-balance",
      title: "Current Balance",
      value: formatMoney(account.currentBalance),
      note: "Includes pending transactions",
    },
    {
      id: "incoming",
      title: "Incoming",
      value: formatMoney(incoming),
      note: dateRangeLabel,
    },
    {
      id: "outgoing",
      title: "Outgoing",
      value: formatMoney(outgoing),
      note: dateRangeLabel,
    },
  ];
}