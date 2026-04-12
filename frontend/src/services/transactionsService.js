import {
  transactionsAccountSummary,
  sampleTransactions,
} from "../data/transactionsData";

export async function getTransactionsData() {
  return Promise.resolve({
    accountSummary: transactionsAccountSummary,
    transactions: sampleTransactions,
  });
}