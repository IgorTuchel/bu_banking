function SelectedAccountCard({ account }) {
  return (
    <section className="selected-account-card">
      <div className="selected-account-card-top">
        <p className="selected-account-label">Currently viewing</p>
        <span className="selected-account-type">{account.type}</span>
      </div>

      <h2 className="selected-account-name">{account.name}</h2>
    </section>
  );
}

export default SelectedAccountCard;