import { useEffect, useMemo, useState } from "react";
import "./home.css";
import "./transactions.css";

import { getTransactionsData } from "../services/transactionsService";

function getAmountValue(amount) {
  return Number(amount.replace(/[^\d.-]/g, ""));
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getTransactionsData();
        setTransactions(data.transactions);
      } catch (error) {
        setErrorMessage("Unable to load transactions.");
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
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
  }, [transactions, searchTerm, activeFilter]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.amount.startsWith("+"))
      .reduce((sum, transaction) => sum + getAmountValue(transaction.amount), 0);

    const expenses = transactions
      .filter((transaction) => transaction.amount.startsWith("-"))
      .reduce(
        (sum, transaction) =>
          sum + Math.abs(getAmountValue(transaction.amount)),
        0
      );

    return {
      totalTransactions: transactions.length,
      income: income.toFixed(2),
      expenses: expenses.toFixed(2),
    };
  }, [transactions]);

  if (isLoading) {
    return (
      <main className="home-page transactions-page">
        <section className="status-card loading-card">
          <h2>Loading transactions</h2>
          <p>Please wait while we load your latest account activity.</p>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="home-page transactions-page">
        <section className="status-card error-card">
          <h2>Something went wrong</h2>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  return (
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
                  activeFilter === filter
                    ? "transactions-filter-button-active"
                    : ""
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
                <div
                  key={transaction.id}
                  className="transaction-row transaction-row-detailed"
                >
                  <div className="transaction-main">
                    <p className="transaction-name">{transaction.name}</p>
                    <p className="transaction-date">{transaction.date}</p>
                  </div>

                  <div className="transaction-meta">
                    <span className="transaction-category">
                      {transaction.category}
                    </span>
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
                        isPositive
                          ? "transaction-positive"
                          : "transaction-negative"
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
  );
}