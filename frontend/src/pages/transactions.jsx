import { useEffect, useMemo, useRef, useState } from "react";
import "./home.css";
import "./transactions.css";

import AccountDropdown from "../components/AccountDropdown";
import SearchInput from "../components/SearchInput";
import Button from "../components/Button";

import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";
import SkeletonTransactionsList from "../components/SkeletonTransactionsList";

import { getCurrentUser } from "../services/userService";
import {
  getAccountsForUser,
  getAccountByKeyForUser,
} from "../services/accountService";
import { getTransactionsForAccount } from "../services/transactionService";

import {
  filterTransactionsByDateRange,
  formatTransactionDate,
  getAmountValue,
  getDateRangeLabel,
  groupTransactions,
  addRunningBalance,
} from "../utils/transactionUtils";

import { TRANSACTIONS_CONFIG } from "../constants/transactions";

import { useAccount } from "../context/AccountContext";

const { INITIAL_VISIBLE_COUNT, LOAD_MORE_COUNT } = TRANSACTIONS_CONFIG;

const dateRangeOptions = [
  { value: "thisMonth", label: "This month" },
  { value: "last30Days", label: "Last 30 days" },
  { value: "last90Days", label: "Last 90 days" },
  { value: "allTime", label: "All time" },
];

export default function TransactionsPage() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const { selectedAccountKey, setSelectedAccountKey } = useAccount();

  const [transactions, setTransactions] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);

  const [searchState, setSearchState] = useState({
    inputValue: "",
    tags: [],
  });

  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedDateRange, setSelectedDateRange] = useState("thisMonth");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const transactionsListRef = useRef(null);

  // 🔥 Load user + accounts
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const currentUser = await getCurrentUser();
        const userAccounts = await getAccountsForUser(currentUser.id);

        setUser(currentUser);
        setAccounts(userAccounts);

        if (!selectedAccountKey && userAccounts.length > 0) {
          setSelectedAccountKey(userAccounts[0].key);
        }
      } catch (error) {
        setErrorMessage("Failed to load account data.");
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  // 🔥 Load transactions when account changes
  useEffect(() => {
    async function loadTransactions() {
      if (!user || !selectedAccountKey) return;

      try {
        setIsLoading(true);
        setErrorMessage("");

        const account = await getAccountByKeyForUser(
          user.id,
          selectedAccountKey
        );

        if (!account) return;

        const data = await getTransactionsForAccount(account.id);

        setTransactions(Array.isArray(data) ? data : []);
        setAvailableBalance(Number(account.currentBalance ?? 0));
      } catch (error) {
        setErrorMessage("Unable to load transactions.");
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, [user, selectedAccountKey]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    setCollapsedGroups({});
  }, [searchState, activeFilter, selectedDateRange, selectedAccountKey]);

  // 🔥 Dynamic account dropdown (REAL data now)
  const accountOptions = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.key,
      label: `${acc.name} • ${acc.type}`,
    }));
  }, [accounts]);

  const dateFilteredTransactions = useMemo(() => {
    return filterTransactionsByDateRange(transactions, selectedDateRange);
  }, [transactions, selectedDateRange]);

  const filteredTransactions = useMemo(() => {
    return dateFilteredTransactions.filter((transaction) => {
      const name = transaction.name ?? "";
      const category = transaction.category ?? "";
      const amount = transaction.amount ?? "";
      const status = transaction.status ?? "";

      const amountValue = getAmountValue(amount);
      const absoluteAmount = Math.abs(amountValue);

      const searchableText = [
        name,
        category,
        amount,
        absoluteAmount.toFixed(2),
        absoluteAmount.toString(),
      ]
        .join(" ")
        .toLowerCase();

      const inputTerm = searchState.inputValue.trim().toLowerCase();
      const tagTerms = searchState.tags.map((tag) => tag.toLowerCase());

      const matchesInput = !inputTerm || searchableText.includes(inputTerm);
      const matchesTags =
        tagTerms.length === 0 ||
        tagTerms.every((tag) => searchableText.includes(tag));

      const matchesSearch = matchesInput && matchesTags;

      if (activeFilter === "In") {
        return matchesSearch && amount.startsWith("+");
      }

      if (activeFilter === "Out") {
        return matchesSearch && amount.startsWith("-");
      }

      if (activeFilter === "Pending") {
        return matchesSearch && status === "Pending";
      }

      return matchesSearch;
    });
  }, [dateFilteredTransactions, searchState, activeFilter]);

  const visibleTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  const transactionsWithBalance = useMemo(() => {
    return addRunningBalance(visibleTransactions, availableBalance);
  }, [visibleTransactions, availableBalance]);

  const groupedTransactions = useMemo(() => {
    try {
      return groupTransactions(transactionsWithBalance);
    } catch (error) {
      console.error("Grouping error:", error);
      return [];
    }
  }, [transactionsWithBalance]);

  const hasMoreTransactions = visibleCount < filteredTransactions.length;
  const canCollapseVisible = visibleCount > INITIAL_VISIBLE_COUNT;
  const dateRangeLabel = getDateRangeLabel(selectedDateRange);

  const totals = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;

    dateFilteredTransactions.forEach((transaction) => {
      const amount = getAmountValue(transaction.amount ?? "0");

      if (amount > 0) incoming += amount;
      else outgoing += Math.abs(amount);
    });

    return {
      currentBalance: availableBalance.toFixed(2),
      incoming: incoming.toFixed(2),
      outgoing: outgoing.toFixed(2),
    };
  }, [dateFilteredTransactions, availableBalance]);

  function scrollTransactionsToTop() {
    if (transactionsListRef.current) {
      transactionsListRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function toggleGroup(label) {
    setCollapsedGroups((current) => ({
      ...current,
      [label]: !current[label],
    }));
  }

  if (isLoading) {
    return (
      <main className="home-page transactions-page">
        <header className="dashboard-header">
          <h1>Transactions</h1>
          <p>Loading account activity...</p>
        </header>

        <section className="summary-grid">
          {[...Array(3)].map((_, i) => (
            <SkeletonSummaryCard key={i} />
          ))}
        </section>

        <section className="transactions-section transactions-page-section">
          <div className="transactions-toolbar">
            <Skeleton width="300px" height="2.8rem" />
            <Skeleton width="200px" height="2.8rem" />
          </div>

          <div className="transactions-list">
            <SkeletonTransactionsList />
          </div>
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

      <AccountDropdown
        label="Select account"
        value={selectedAccountKey}
        onChange={setSelectedAccountKey}
        options={accountOptions}
      />

      <section className="summary-grid">
        <article className="summary-card summary-balance">
          <h3>Current Balance</h3>
          <p>£{totals.currentBalance}</p>
          <small className="summary-card-note">
            Includes pending transactions
          </small>
        </article>

        <article className="summary-card summary-incoming">
          <h3>Incoming</h3>
          <p>£{totals.incoming}</p>
          <small className="summary-card-note">{dateRangeLabel}</small>
        </article>

        <article className="summary-card summary-outgoing">
          <h3>Outgoing</h3>
          <p>£{totals.outgoing}</p>
          <small className="summary-card-note">{dateRangeLabel}</small>
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
          <SearchInput
            value={searchState}
            onChange={setSearchState}
            placeholder="Search by name, merchant, category or amount"
            ariaLabel="Search transactions"
          />

          <div className="transactions-date-range-popover">
            <AccountDropdown
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              options={dateRangeOptions}
            />
          </div>

          <div className="transactions-filters segmented">
            <div
              className="segmented-indicator"
              style={{
                transform: `translateX(${
                  ["All", "In", "Out", "Pending"].indexOf(activeFilter) * 100
                }%)`,
              }}
            />

            {["All", "In", "Out", "Pending"].map((filter) => (
              <Button
                key={filter}
                variant="pill"
                active={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
                icon={
                  filter === "In"
                    ? "↓"
                    : filter === "Out"
                    ? "↑"
                    : filter === "Pending"
                    ? "⏳"
                    : null
                }
                className="segmented-btn"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        <div className="transactions-list" ref={transactionsListRef}>
          {groupedTransactions.length > 0 ? (
            <>
              {groupedTransactions.map((group) => {
                const groupTotal = group.items.reduce(
                  (sum, transaction) =>
                    sum + getAmountValue(transaction.amount ?? "0"),
                  0
                );

                const isCollapsed = Boolean(collapsedGroups[group.label]);

                return (
                  <section key={group.label} className="transaction-group">
                    <button
                      type="button"
                      className="transaction-group-toggle"
                      onClick={() => toggleGroup(group.label)}
                      aria-expanded={!isCollapsed}
                    >
                      <span className="transaction-group-heading">
                        <span>{group.label}</span>
                        <span />
                        <span className="transaction-group-total">
                          <span className="transaction-group-total-label">
                            Total:
                          </span>
                          <span className="transaction-group-total-value">
                            {groupTotal.toLocaleString("en-GB", {
                              style: "currency",
                              currency: "GBP",
                            })}
                          </span>
                        </span>
                      </span>

                      <span
                        className={`transaction-group-symbol ${
                          isCollapsed ? "collapsed" : "expanded"
                        }`}
                      >
                        {isCollapsed ? "+" : "−"}
                      </span>
                    </button>

                    <div
                      className={`transaction-group-content ${
                        isCollapsed
                          ? "transaction-group-content-collapsed"
                          : "transaction-group-content-expanded"
                      }`}
                    >
                      <div className="transaction-group-content-inner">
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
                                  {formatTransactionDate(timestamp)} •{" "}
                                  {transaction.category ?? "Uncategorised"}
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

                                <div className="transaction-amount-wrapper">
                                  <p
                                    className={`transaction-amount ${
                                      isPositive
                                        ? "transaction-positive"
                                        : "transaction-negative"
                                    }`}
                                  >
                                    {amount}
                                  </p>

                                  <p className="transaction-balance">
                                    £{transaction.runningBalance.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                );
              })}

              {(hasMoreTransactions || canCollapseVisible) && (
                <div className="transactions-load-more">
                  <div className="transactions-load-more-actions">
                    {canCollapseVisible && (
                      <Button
                        variant="pill"
                        onClick={() => {
                          setVisibleCount(INITIAL_VISIBLE_COUNT);
                          scrollTransactionsToTop();
                        }}
                        icon="↑"
                      >
                        Show less
                      </Button>
                    )}

                    {canCollapseVisible && (
                      <Button
                        variant="pill"
                        onClick={scrollTransactionsToTop}
                        icon="⇧"
                      >
                        Back to top
                      </Button>
                    )}
                  </div>

                  {hasMoreTransactions && (
                    <Button
                      variant="pill"
                      onClick={() =>
                        setVisibleCount((prev) => prev + LOAD_MORE_COUNT)
                      }
                      icon="↓"
                    >
                      Show more transactions
                    </Button>
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