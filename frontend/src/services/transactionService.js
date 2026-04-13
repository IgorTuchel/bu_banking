import { transactionsData } from "../data/transactionsData";

export async function getTransactionsForAccount(accountId) {
  await new Promise((resolve) => setTimeout(resolve, 150));

  return transactionsData.filter(
    (txn) => txn.accountId === accountId
  );
}