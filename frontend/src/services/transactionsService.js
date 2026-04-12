import { sampleTransactions } from "../data/transactionsData";

export async function getTransactionsData() {
  return Promise.resolve({
    transactions: sampleTransactions,
  });
}