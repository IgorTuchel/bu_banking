import { useEffect, useMemo, useState } from "react";
import "./home.css";
import "./transactions.css";

import { getTransactionsData } from "../services/transactionsService";
import {
  getAmountValue,
  formatTransactionDate,
  groupTransactions,
} from "../utils/transactionUtils";

const INITIAL_VISIBLE_COUNT = 30;
const LOAD_MORE_COUNT = 20;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
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

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [searchTerm, activeFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (activeFilter === "Income") {
        return matchesSearch && transaction.amount.startsWith("+");
      }

      if (activeFilter === "Outgoing") {
        return matchesSearch && transaction.amount.startsWith("-");
      }

      if (activeFilter === "Pending") {
        return matchesSearch && transaction.status === "Pending";
      }

      return matchesSearch;
    });
  }, [transactions, searchTerm, activeFilter]);

  const visibleTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  const groupedTransactions = useMemo(() => {
    return groupTransactions(visibleTransactions);
  }, [visibleTransactions]);

  const hasMoreTransactions = visibleCount < filteredTransactions.length;

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
              Showing {Math.min(visibleCount, filteredTransactions.length)} of{" "}
              {filteredTransactions.length} transaction
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
            {["All", "Income", "Outgoing", "Pending"].map((filter) => (
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
          {groupedTransactions.length > 0 ? (
            <>
              {groupedTransactions.map((group) => (
                <section key={group.label} className="transaction-group">
                  <h3 className="transaction-group-heading">{group.label}</h3>

                  {group.items.map((transaction) => {
                    const isPositive = transaction.amount.startsWith("+");

                    return (
                      <div
                        key={transaction.id}
                        className="transaction-row transaction-row-detailed"
                      >
                        <div className="transaction-main">
                          <p className="transaction-name">{transaction.name}</p>
                          <p className="transaction-date">
                            {formatTransactionDate(transaction.timestamp)}
                          </p>
                        </div>

                        <div className="transaction-meta">
                          <span
                            className={`transaction-status ${
                              transaction.status === "Pending"
                                ? "transaction-status-pending"
                                : transaction.status === "Declined"
                                ? "transaction-status-declined"
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
                  })}
                </section>
              ))}

              {hasMoreTransactions && (
                <div className="transactions-load-more">
                  <button
                    type="button"
                    className="transactions-load-more-button"
                    onClick={() =>
                      setVisibleCount(
                        (currentCount) => currentCount + LOAD_MORE_COUNT
                      )
                    }
                  >
                    Show more transactions
                  </button>
                </div>
              )}
            </>
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