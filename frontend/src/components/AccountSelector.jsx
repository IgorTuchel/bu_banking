function AccountSelector({ accounts, selectedAccountKey, onChange }) {
  return (
    <section className="account-selector-section">
      <label htmlFor="account-select" className="account-selector-label">
        View account
      </label>

      <select
        id="account-select"
        className="account-selector"
        value={selectedAccountKey}
        onChange={(event) => onChange(event.target.value)}
      >
        {accounts.map((account) => (
          <option key={account.id} value={account.key}>
            {account.name} ({account.type})
          </option>
        ))}
      </select>
    </section>
  );
}

export default AccountSelector;