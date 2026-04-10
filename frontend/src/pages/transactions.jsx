import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import "./home.css";
import "./transactions.css";

const sampleTransactions = [
  { id: 1, name: "Starbucks", date: "10 Apr 2026", amount: "-£6.40", category: "Food & Drink", status: "Completed" },
  { id: 2, name: "Salary Payment", date: "09 Apr 2026", amount: "+£2,850.00", category: "Income", status: "Completed" },
  { id: 3, name: "Amazon", date: "08 Apr 2026", amount: "-£49.99", category: "Shopping", status: "Completed" },
  { id: 4, name: "Tesco", date: "08 Apr 2026", amount: "-£32.18", category: "Groceries", status: "Completed" },
  { id: 5, name: "Netflix", date: "07 Apr 2026", amount: "-£10.99", category: "Subscriptions", status: "Completed" },
  { id: 6, name: "Uber", date: "07 Apr 2026", amount: "-£14.20", category: "Transport", status: "Pending" },
  { id: 7, name: "Freelance Client", date: "06 Apr 2026", amount: "+£450.00", category: "Income", status: "Completed" },
  { id: 8, name: "Apple", date: "05 Apr 2026", amount: "-£2.99", category: "Subscriptions", status: "Completed" },
  { id: 9, name: "Shell", date: "05 Apr 2026", amount: "-£58.00", category: "Transport", status: "Completed" },
  { id: 10, name: "Boots", date: "04 Apr 2026", amount: "-£12.75", category: "Health", status: "Completed" },
];

function getAmountValue(amount) {
  return Number(amount.replace(/[^\d.-]/g, ""));
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredTransactions = useMemo(() => {
    return sampleTransactions.filter((transaction) => {
      const matchesSearch =
        transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (activeFilter === "Income") {
        return matchesSearch && transaction.amount.startsWith("+");
      }

      if (activeFilter === "Expenses") {
        return matchesSearch && transaction.amount.startsWith("-");
      }

      if (activeFilter === "Pending") {
        return matchesSearch && transaction.status === "Pending";
      }

      return matchesSearch;
    });
  }, [searchTerm, activeFilter]);

  const totals = useMemo(() => {
    const income = sampleTransactions
      .filter((transaction) => transaction.amount.startsWith("+"))
      .reduce((sum, transaction) => sum + getAmountValue(transaction.amount), 0);

    const expenses = sampleTransactions
      .filter((transaction) => transaction.amount.startsWith("-"))
      .reduce((sum, transaction) => sum + Math.abs(getAmountValue(transaction.amount)), 0);

    return {
      totalTransactions: sampleTransactions.length,
      income: income.toFixed(2),
      expenses: expenses.toFixed(2),
    };
  }, []);

  return (
    <>
      <Navbar />

      <main className="home-page transactions-page">
        <header className="dashboard-header">
          <h1>Transactions</h1>
          <p>Review, search, and filter all account activity in one place.</p>
        </header>

        <section className="summary-grid">
          <article className="summary-card summary-balance">
            <h3>Total Transactions</h3>
            <p>{totals.totalTransactions}</p>
          </article>

          <article className="summary-card summary-incoming">
            <h3>Money In</h3>
            <p>£{totals.income}</p>
          </article>

          <article className="summary-card summary-outgoing">
            <h3>Money Out</h3>
            <p>£{totals.expenses}</p>
          </article>
        </section>

        <section className="transactions-section transactions-page-section">
          <div className="section-header">
            <div>
              <h2>All Transactions</h2>
              <p className="transactions-subtext">
                Showing {filteredTransactions.length} transaction
                {filteredTransactions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="transactions-toolbar">
            <input
              type="text"
              className="transactions-search"
              placeholder="Search by merchant or category"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <div className="transactions-filters">
              {["All", "Income", "Expenses", "Pending"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`transactions-filter-button ${
                    activeFilter === filter ? "transactions-filter-button-active" : ""
                  }`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="transactions-list">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => {
                const isPositive = transaction.amount.startsWith("+");

                return (
                  <div key={transaction.id} className="transaction-row transaction-row-detailed">
                    <div className="transaction-main">
                      <p className="transaction-name">{transaction.name}</p>
                      <p className="transaction-date">{transaction.date}</p>
                    </div>

                    <div className="transaction-meta">
                      <span className="transaction-category">{transaction.category}</span>
                      <span
                        className={`transaction-status ${
                          transaction.status === "Pending"
                            ? "transaction-status-pending"
                            : "transaction-status-completed"
                        }`}
                      >
                        {transaction.status}
                      </span>
                      <p
                        className={`transaction-amount ${
                          isPositive ? "transaction-positive" : "transaction-negative"
                        }`}
                      >
                        {transaction.amount}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="status-card empty-card">
                <h2>No transactions found</h2>
                <p>Try changing the search term or selected filter.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}