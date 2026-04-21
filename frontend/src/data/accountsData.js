export const accountsData = [
  {
    id: "acc-001",
    key: "main-current",
    name: "Main Current Account",
    type: "current",
    currency: "GBP",
    currentBalance: 3166.68,

    accountNumber: "56781234",
    maskedAccountNumber: "•••• 1234",
    sortCode: "12-34-56",

    status: "active",
  },
  {
    id: "acc-002",
    key: "super-saver",
    name: "Super Saver",
    type: "savings",
    currency: "GBP",
    currentBalance: 8420.15,

    accountNumber: "12345678",
    maskedAccountNumber: "•••• 5678",
    sortCode: "12-34-56",

    status: "active",

    interestRate: 4.1,
    interestEarnedYtd: 186.42,
  },
  {
    id: "acc-003",
    key: "platinum-credit",
    name: "Platinum Credit",
    type: "credit",
    currency: "GBP",

    accountNumber: "34569012",
    maskedAccountNumber: "•••• 9012",
    sortCode: "22-11-44",

    status: "active",

    creditLimit: 8000.0,
    availableCredit: 5290.42,
    minimumPaymentDue: 95.0,
    paymentDueDate: "2026-05-03",
    statementBalance: 1248.77,
  },
];