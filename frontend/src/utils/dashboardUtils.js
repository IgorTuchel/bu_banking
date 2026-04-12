export function getSelectedAccount(accounts, selectedAccountKey, defaultIndex = 0) {
  if (!accounts || accounts.length === 0) {
    return null;
  }

  return (
    accounts.find((account) => account.key === selectedAccountKey) ||
    accounts[defaultIndex] ||
    null
  );
}