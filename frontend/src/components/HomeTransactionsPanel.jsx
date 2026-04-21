import { useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import TransactionLocationMap from "./TransactionLocationMap";

import {
  addRunningBalance,
  formatTransactionDate,
  getHomeRecentTransactions,
} from "../utils/transactionUtils";
import { getTransactionDetails } from "../utils/transactionDetailsUtils";
import { shouldRenderTransactionMap } from "../utils/transactionLocationUtils";

const HOME_MAX_TRANSACTIONS = 15;

function HomeTransactionsPanel({ transactions, account }) {
  const [expandedTransactionId, setExpandedTransactionId] = useState(null);

  const listRef = useRef(null);
  const rowRefs = useRef({});

  /* 🔹 Use NEW home-specific sorting */
  const limitedTransactions = useMemo(() => {
    return getHomeRecentTransactions(
      Array.isArray(transactions) ? transactions : [],
      HOME_MAX_TRANSACTIONS
    );
  }, [transactions]);

  const transactionsWithBalance = useMemo(() => {
    const startingBalance = Number(
      account?.currentBalance ?? account?.availableCredit ?? 0
    );

    return addRunningBalance(limitedTransactions, startingBalance);
  }, [limitedTransactions, account]);

  function toggleTransaction(transactionId) {
    const willExpand = expandedTransactionId !== transactionId;

    setExpandedTransactionId((current) =>
      current === transactionId ? null : transactionId
    );

    if (!willExpand) return;

    /* 🔥 Smooth scroll inside container */
    window.setTimeout(() => {
      const listEl = listRef.current;
      const rowEl = rowRefs.current[transactionId];

      if (!listEl || !rowEl) return;

      const listRect = listEl.getBoundingClientRect();
      const rowRect = rowEl.getBoundingClientRect();

      const currentScrollTop = listEl.scrollTop;
      const rowTopWithinList =
        rowRect.top - listRect.top + currentScrollTop;

      const targetScrollTop = Math.max(rowTopWithinList - 8, 0);

      listEl.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }, 260);
  }

  return (
    <section className="transactions-section home-transactions-section">
      <div className="section-header">
        <h2>Recent Transactions</h2>

        <NavLink className="section-link-button" to="/transactions">
          View all
        </NavLink>
      </div>

      <div
        ref={listRef}
        className="transactions-list home-transactions-list"
      >
        {transactionsWithBalance.length > 0 ? (
          transactionsWithBalance.map((transaction) => {
            const amount = transaction.amount ?? "£0.00";
            const status = transaction.status ?? "Completed";
            const timestamp = transaction.timestamp ?? new Date();
            const isPositive = amount.startsWith("+");

            const merchantName =
              transaction.merchant?.name ??
              transaction.merchantName ??
              transaction.name;

            const merchantCategory =
              transaction.merchant?.category ?? transaction.category;

            const detailRows = getTransactionDetails(
              transaction,
              account?.type,
              account?.currency
            );

            const isExpanded =
              expandedTransactionId === transaction.id;

            const showTransactionMap =
              isExpanded && shouldRenderTransactionMap(transaction);

            return (
              <article
                key={transaction.id}
                ref={(el) => {
                  rowRefs.current[transaction.id] = el;
                }}
                className={`home-transaction-card ${
                  isExpanded ? "home-transaction-card-open" : ""
                }`}
              >
                <button
                  type="button"
                  className="home-transaction-toggle"
                  onClick={() => toggleTransaction(transaction.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="home-transaction-main">
                    <p className="transaction-name">{merchantName}</p>
                    <p className="transaction-date">
                      {formatTransactionDate(timestamp)} •{" "}
                      {merchantCategory}
                    </p>
                  </div>

                  <div className="home-transaction-right">
                    <div className="home-transaction-meta">
                      <span
                        className={`home-transaction-status ${
                          status === "Pending"
                            ? "home-transaction-status-pending"
                            : status === "Declined"
                            ? "home-transaction-status-declined"
                            : "home-transaction-status-completed"
                        }`}
                      >
                        {status}
                      </span>

                      <div className="home-transaction-amount-wrapper">
                        <p
                          className={`transaction-amount ${
                            isPositive
                              ? "transaction-positive"
                              : "transaction-negative"
                          }`}
                        >
                          {amount}
                        </p>

                        <p className="home-transaction-balance">
                          £{transaction.runningBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`home-transaction-expand-icon ${
                        isExpanded ? "expanded" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </div>
                </button>

                <div
                  className={`home-transaction-details ${
                    isExpanded
                      ? "home-transaction-details-expanded"
                      : "home-transaction-details-collapsed"
                  }`}
                >
                  <div className="home-transaction-details-content">
                    <div className="home-transaction-details-inner">
                      {detailRows.map((detail) => (
                        <p key={`${transaction.id}-${detail.label}`}>
                          <span>{detail.label}:</span> {detail.value}
                        </p>
                      ))}
                    </div>

                    {showTransactionMap ? (
                      <div className="home-transaction-map">
                        <TransactionLocationMap
                          transaction={transaction}
                        />
                      </div>
                    ) : null}

                    <NavLink
                      to="/support"
                      className="home-transaction-support-link"
                    >
                      Don&apos;t recognise this transaction?
                    </NavLink>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="status-card empty-card">
            <h2>No recent transactions</h2>
            <p>
              There is currently no transaction activity to display.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeTransactionsPanel;