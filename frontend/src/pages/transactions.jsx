import { useEffect, useMemo, useRef, useState } from "react";
import "./home.css";
import "./transactions.css";

import { getTransactionsData } from "../services/transactionsService";
import {
  getAmountValue,
  formatTransactionDate,
  groupTransactions,
} from "../utils/transactionUtils";
import { TRANSACTIONS_CONFIG } from "../constants/transactions";

const { INITIAL_VISIBLE_COUNT, LOAD_MORE_COUNT } = TRANSACTIONS_CONFIG;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const transactionsListRef = useRef(null);

  useEffect(() => {
    async function loadTransactions() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getTransactionsData();
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
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
      const name = transaction.name ?? "";
      const category = transaction.category ?? "";
      const amount = transaction.amount ?? "";
      const status = transaction.status ?? "";

      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase());

      if (activeFilter === "Income") {
        return matchesSearch && amount.startsWith("+");
      }

      if (activeFilter === "Outgoing") {
        return matchesSearch && amount.startsWith("-");
      }

      if (activeFilter === "Pending") {
        return matchesSearch && status === "Pending";
      }

      return matchesSearch;
    });
  }, [transactions, searchTerm, activeFilter]);

  const visibleTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  const groupedTransactions = useMemo(() => {
    try {
      return groupTransactions(visibleTransactions);
    } catch (error) {
      console.error("Grouping error:", error);
      return [];
    }
  }, [visibleTransactions]);

  const hasMoreTransactions = visibleCount < filteredTransactions.length;
  const canCollapse = visibleCount > INITIAL_VISIBLE_COUNT;

  const totals = useMemo(() => {
    const income = transactions
      .filter((transaction) => (transaction.amount ?? "").startsWith("+"))
      .reduce(
        (sum, transaction) => sum + getAmountValue(transaction.amount ?? "0"),
        0
      );

    const expenses = transactions
      .filter((transaction) => (transaction.amount ?? "").startsWith("-"))
      .reduce(
        (sum, transaction) =>
          sum + Math.abs(getAmountValue(transaction.amount ?? "0")),
        0
      );

    return {
      totalTransactions: transactions.length,
      income: income.toFixed(2),
      expenses: expenses.toFixed(2),
    };
  }, [transactions]);

  function scrollTransactionsToTop() {
    if (transactionsListRef.current) {
      transactionsListRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

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
              {filteredTransactions.length} transactions
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

        <div className="transactions-list" ref={transactionsListRef}>
          {groupedTransactions.length > 0 ? (
            <>
              {groupedTransactions.map((group) => (
                <section key={group.label} className="transaction-group">
                  <h3 className="transaction-group-heading">{group.label}</h3>

                  {group.items.map((transaction) => {
                    const amount = transaction.amount ?? "£0.00";
                    const status = transaction.status ?? "Completed";
                    const timestamp = transaction.timestamp ?? new Date();
                    const isPositive = amount.startsWith("+");

                    return (
                      <div
                        key={transaction.id}
                        className="transaction-row transaction-row-detailed"
                      >
                        <div className="transaction-main">
                          <p className="transaction-name">
                            {transaction.name ?? "Unknown"}
                          </p>
                          <p className="transaction-date">
                            {formatTransactionDate(timestamp)}
                          </p>
                        </div>

                        <div className="transaction-meta">
                          <span
                            className={`transaction-status ${
                              status === "Pending"
                                ? "transaction-status-pending"
                                : status === "Declined"
                                ? "transaction-status-declined"
                                : "transaction-status-completed"
                            }`}
                          >
                            {status}
                          </span>

                          <p
                            className={`transaction-amount ${
                              isPositive
                                ? "transaction-positive"
                                : "transaction-negative"
                            }`}
                          >
                            {amount}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </section>
              ))}

              {(hasMoreTransactions || canCollapse) && (
                <div className="transactions-load-more">
                  <div className="transactions-load-more-actions">
                    {canCollapse && (
                      <button
                        className="transactions-collapse-button"
                        onClick={() => {
                          setVisibleCount(INITIAL_VISIBLE_COUNT);
                          scrollTransactionsToTop();
                        }}
                      >
                        Show less
                      </button>
                    )}

                    {canCollapse && (
                      <button
                        className="transactions-top-button"
                        onClick={scrollTransactionsToTop}
                      >
                        Back to top
                      </button>
                    )}
                  </div>

                  {hasMoreTransactions && (
                    <button
                      className="transactions-load-more-button"
                      onClick={() =>
                        setVisibleCount((prev) => prev + LOAD_MORE_COUNT)
                      }
                    >
                      Show more transactions
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="status-card empty-card">
              <h2>No transactions found</h2>
              <p>Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}