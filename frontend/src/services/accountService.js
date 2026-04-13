import { accountsData } from "../data/accountsData";
import { accountUsersData } from "../data/accountUsersData";

export async function getAccountsForUser(userId) {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const accountIds = accountUsersData
    .filter((link) => link.userId === userId)
    .map((link) => link.accountId);

  return accountsData.filter((account) =>
    accountIds.includes(account.id)
  );
}

export async function getAccountById(accountId) {
  await new Promise((resolve) => setTimeout(resolve, 50));

  return accountsData.find((acc) => acc.id === accountId);
}

export async function getAccountByKeyForUser(userId, key) {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const accountIds = accountUsersData
    .filter((link) => link.userId === userId)
    .map((link) => link.accountId);

  return accountsData.find(
    (account) =>
      accountIds.includes(account.id) && account.key === key
  );
}