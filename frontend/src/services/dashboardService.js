import { getCurrentUser } from "./userService";
import { getAccountsForUser } from "./accountService";
import { getTransactionsForAccount } from "./transactionService";

export async function getDashboardData() {
  const user = await getCurrentUser();

  const accounts = await getAccountsForUser(user.id);

  const enrichedAccounts = await Promise.all(
    accounts.map(async (account) => {
      const transactions = await getTransactionsForAccount(account.id);

      return {
        ...account,
        transactions,
        summary: [
          {
            id: "balance",
            title: "Balance",
            value: `£${account.currentBalance.toFixed(2)}`,
          },
        ],
      };
    })
  );

  return {
    user,
    accounts: enrichedAccounts,
    quickActions: [
      { id: "pay", label: "Pay" },
      { id: "transfer", label: "Transfer" },
      { id: "request", label: "Request" },
    ],
    notifications: [],
  };
}