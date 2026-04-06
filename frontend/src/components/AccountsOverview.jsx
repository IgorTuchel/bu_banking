import AccountCard from "./AccountCard";

function AccountsOverview({ accounts }) {
  return (
    <section className="accounts-overview">
      <h2>Your Accounts</h2>

      <div className="accounts-grid">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            name={account.name}
            type={account.type}
            balance={account.balance}
          />
        ))}
      </div>
    </section>
  );
}

export default AccountsOverview;