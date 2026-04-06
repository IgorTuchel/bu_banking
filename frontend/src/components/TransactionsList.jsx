function TransactionsList({ transactions }) {
  return (
    <section className="transactions-section">
      <h2>Recent Transactions</h2>

      <div className="transactions-list">
        {transactions.map((transaction) => {
          const isPositive = transaction.amount.startsWith("+");

          return (
            <div key={transaction.id} className="transaction-row">
              <div>
                <p className="transaction-name">{transaction.name}</p>
                <p className="transaction-date">{transaction.date}</p>
              </div>

              <p
                className={`transaction-amount ${
                  isPositive ? "transaction-positive" : "transaction-negative"
                }`}
              >
                {transaction.amount}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TransactionsList;