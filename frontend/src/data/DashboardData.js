export const userData = {
  firstName: "Daniel",
  lastLogin: {
    timestamp: "2026-04-06T14:42:00",
    location: "Bournemouth, UK",
  },
};

export const accounts = [
  {
    id: 1,
    key: "current",
    name: "Everyday Current",
    type: "Current Account",
    summary: [
      { id: 1, title: "Current Balance", value: "£2,450.35" },
      { id: 2, title: "Incoming", value: "£2,400.00" },
      { id: 3, title: "Outgoing", value: "£620.40" },
    ],
    transactions: [
      { id: 1, name: "Tesco", amount: "-£42.50", date: "Today" },
      { id: 2, name: "Salary Deposit", amount: "+£2,400.00", date: "Yesterday" },
      { id: 3, name: "Netflix", amount: "-£10.99", date: "2 Apr" },
    ],
  },
  {
    id: 2,
    key: "savings",
    name: "Smart Saver",
    type: "Savings Account",
    summary: [
      { id: 1, title: "Savings Balance", value: "£8,120.00" },
      { id: 2, title: "Interest Earned", value: "£42.10" },
      { id: 3, title: "This Month Saved", value: "£300.00" },
    ],
    transactions: [
      { id: 1, name: "Transfer In", amount: "+£300.00", date: "4 Apr" },
      { id: 2, name: "Interest Payment", amount: "+£12.10", date: "1 Apr" },
    ],
  },
  {
    id: 3,
    key: "credit",
    name: "Platinum Credit",
    type: "Credit Account",
    summary: [
      { id: 1, title: "Outstanding Balance", value: "£1,240.50" },
      { id: 2, title: "Available Credit", value: "£2,759.50" },
      { id: 3, title: "Payment Due", value: "£85.00" },
    ],
    transactions: [
      { id: 1, name: "Amazon", amount: "-£79.99", date: "5 Apr" },
      { id: 2, name: "Petrol Station", amount: "-£45.00", date: "3 Apr" },
    ],
  },
];

export const quickActions = [
  { id: 1, label: "Transfer Money", icon: "💸" },
  { id: 2, label: "Pay Bills", icon: "🧾" },
  { id: 3, label: "View Cards", icon: "💳" },
  { id: 4, label: "Transaction History", icon: "📊" },
];

export const notifications = [
  { id: 1, message: "Your credit card payment is due in 3 days." },
  { id: 2, message: "No suspicious activity detected on your account." },
];