function TransactionsList({ transactions }) {
  return (
    <section className="transactions-section">
      <h2>Recent Transactions</h2>
      <div className="transactions-list">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="transaction-row">
            <div>
              <p className="transaction-name">{transaction.name}</p>
              <p className="transaction-date">{transaction.date}</p>
            </div>
            <p className="transaction-amount">{transaction.amount}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TransactionsList;