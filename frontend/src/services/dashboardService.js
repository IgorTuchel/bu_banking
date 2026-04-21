import { getCurrentUser } from "./userService";
import { getAccountsForUser } from "./accountService";
import { getTransactionsForAccount } from "./transactionService";

function buildQuickActions() {
  return [
    { id: "transfer", label: "Transfer", icon: "↗" },
    { id: "request", label: "Request", icon: "↩" },
    { id: "cards", label: "Cards", icon: "💳" },
    { id: "scheduled-payments", label: "Scheduled Payments", icon: "📅" },
  ];
}

function buildNotifications(user) {
  return [
    {
      id: "notif-001",
      title: `Welcome back, ${user.firstName}`,
      message: "Your latest account activity is ready to review.",
      time: "Just now",
    },
    {
      id: "notif-002",
      title: "Security reminder",
      message: "Never share your one-time passcode with anyone.",
      time: "Today",
    },
  ];
}

export async function getDashboardData() {
  const user = await getCurrentUser();
  const accounts = await getAccountsForUser(user.id);

  const accountsWithTransactions = await Promise.all(
    accounts.map(async (account) => {
      const transactions = await getTransactionsForAccount(account.id);

      const normalisedBalance =
        account.currentBalance ?? account.availableCredit ?? 0;

      return {
        ...account,
        currentBalance: normalisedBalance,
        transactions,
      };
    })
  );

  return {
    user,
    accounts: accountsWithTransactions,
    quickActions: buildQuickActions(),
    notifications: buildNotifications(user),
  };
}