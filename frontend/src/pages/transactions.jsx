import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink} from "react-router-dom";
import "./home.css";
import "./transactions.css";

import AccountDropdown from "../components/AccountDropdown";
import SearchInput from "../components/SearchInput";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";
import SkeletonTransactionsList from "../components/SkeletonTransactionsList";
import TransactionLocationMap from "../components/TransactionLocationMap";

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
import { getAccountSummaryCards } from "../utils/accountSummaryUtils";
import { getTransactionDetails } from "../utils/transactionDetailsUtils";
import { shouldRenderTransactionMap } from "../utils/transactionLocationUtils";

import { DATE_RANGE_OPTIONS, TRANSACTIONS_CONFIG } from "../constants/transactions";

const { INITIAL_VISIBLE_COUNT, LOAD_MORE_COUNT } = TRANSACTIONS_CONFIG;

export default function TransactionsPage() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountKey, setSelectedAccountKey] = useState("");

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
  const [expandedTransactions, setExpandedTransactions] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const transactionsListRef = useRef(null);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const currentUser = await getCurrentUser();
        const userAccounts = await getAccountsForUser(currentUser.id);

        setUser(currentUser);
        setAccounts(userAccounts);

        if (userAccounts.length > 0) {
          setSelectedAccountKey(userAccounts[0].key);
        }
      } catch {
        setErrorMessage("Failed to load account data.");
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    async function loadTransactions() {
      if (!user || !selectedAccountKey) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const account = await getAccountByKeyForUser(user.id, selectedAccountKey);

        if (!account) {
          return;
        }

        const data = await getTransactionsForAccount(account.id);

        setTransactions(Array.isArray(data) ? data : []);
        setAvailableBalance(
          Number(account.currentBalance ?? account.availableCredit ?? 0)
        );
      } catch {
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
    setExpandedTransactions({});
  }, [searchState, activeFilter, selectedDateRange, selectedAccountKey]);

  const accountOptions = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.key,
      label: `${acc.name} • ${acc.type}`,
    }));
  }, [accounts]);

  const selectedAccount = useMemo(() => {
    return accounts.find((account) => account.key === selectedAccountKey) ?? null;
  }, [accounts, selectedAccountKey]);

  const dateFilteredTransactions = useMemo(() => {
    return filterTransactionsByDateRange(transactions, selectedDateRange);
  }, [transactions, selectedDateRange]);

  const filteredTransactions = useMemo(() => {
    return dateFilteredTransactions.filter((transaction) => {
      const name = transaction.name ?? "";
      const category = transaction.category ?? "";
      const amount = transaction.amount ?? "";
      const status = transaction.status ?? "";
      const merchant = transaction.merchant ?? {};
      const merchantName = merchant.name ?? transaction.merchantName ?? "";
      const merchantCategory = merchant.category ?? "";
      const merchantType = merchant.type ?? "";
      const merchantLocation = merchant.location ?? "";

      const amountValue = getAmountValue(amount);
      const absoluteAmount = Math.abs(amountValue);

      const searchableText = [
        name,
        category,
        amount,
        merchantName,
        merchantCategory,
        merchantType,
        merchantLocation,
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

      if (amount > 0) {
        incoming += amount;
      } else {
        outgoing += Math.abs(amount);
      }
    });

    return {
      currentBalance: availableBalance.toFixed(2),
      incoming: incoming.toFixed(2),
      outgoing: outgoing.toFixed(2),
    };
  }, [dateFilteredTransactions, availableBalance]);

  const summaryCards = useMemo(() => {
    return getAccountSummaryCards({
      account: selectedAccount,
      incoming: Number(totals.incoming),
      outgoing: Number(totals.outgoing),
      dateRangeLabel,
    });
  }, [selectedAccount, totals.incoming, totals.outgoing, dateRangeLabel]);

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

  function toggleTransaction(transactionId) {
    setExpandedTransactions((current) =>
      current[transactionId] ? {} : { [transactionId]: true }
    );
  }

  if (isLoading) {
    return (
      <main className="home-page transactions-page">
        <header className="dashboard-header">
          <h1>Transactions</h1>
          <p>Review, search, and filter all account activity in one place.</p>
        </header>

        <Skeleton width="260px" height="3rem" />

        <section className="summary-grid">
          {[...Array(3)].map((_, index) => (
            <SkeletonSummaryCard key={index} />
          ))}
        </section>

        <section className="transactions-section transactions-page-section">
          <div className="transactions-toolbar">
            <Skeleton
              width="100%"
              height="3rem"
              style={{ flex: 1, minWidth: "240px" }}
            />
            <Skeleton width="190px" height="3rem" />
            <Skeleton width="340px" height="3rem" />
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
        {summaryCards.map((card) => (
          <article
            key={card.id}
            className={`summary-card ${
              selectedAccount?.type === "credit" && card.id === "available-credit"
                ? "summary-balance"
                : selectedAccount?.type === "savings" &&
                  card.id === "savings-balance"
                ? "summary-balance"
                : card.id.includes("incoming") || card.id.includes("interest-earned")
                ? "summary-incoming"
                : card.id.includes("outgoing") ||
                  card.id.includes("interest-rate") ||
                  card.id.includes("minimum-payment")
                ? "summary-outgoing"
                : ""
            }`}
          >
            <h3>{card.title}</h3>
            <p>{card.value}</p>
            <small className="summary-card-note">{card.note}</small>
          </article>
        ))}
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
              options={DATE_RANGE_OPTIONS}
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
                              currency: selectedAccount?.currency ?? "GBP",
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
                          const merchantName =
                            transaction.merchant?.name ??
                            transaction.merchantName ??
                            transaction.name;
                          const merchantCategory =
                            transaction.merchant?.category ??
                            transaction.category;
                          const detailRows = getTransactionDetails(
                            transaction,
                            selectedAccount?.type,
                            selectedAccount?.currency
                          );
                          const isExpanded = Boolean(
                            expandedTransactions[transaction.id]
                          );
                          const showTransactionMap =
                            isExpanded && shouldRenderTransactionMap(transaction);

                          return (
                            <div
                              key={transaction.id}
                              className={`transaction-row transaction-row-detailed transaction-row-expandable ${
                                isExpanded ? "transaction-row-open" : ""
                              }`}
                            >
                              <button
                                type="button"
                                className="transaction-row-toggle"
                                onClick={() => toggleTransaction(transaction.id)}
                                aria-expanded={isExpanded}
                              >
                                <div className="transaction-main">
                                  <p className="transaction-name">
                                    {merchantName}
                                  </p>
                                  <p className="transaction-date">
                                    {formatTransactionDate(timestamp)} •{" "}
                                    {merchantCategory}
                                  </p>
                                </div>

                                <div className="transaction-right">
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

                                  <span
                                    className={`transaction-expand-icon ${
                                      isExpanded ? "expanded" : ""
                                    }`}
                                    aria-hidden="true"
                                  >
                                    ▾
                                  </span>
                                </div>
                              </button>

                              <div
                                className={`transaction-extra-details ${
                                  isExpanded
                                    ? "transaction-extra-details-expanded"
                                    : "transaction-extra-details-collapsed"
                                }`}
                              >
                                <div className="transaction-extra-details-content">
                                  <div className="transaction-extra-details-inner">
                                    {detailRows.map((detail) => (
                                      <p key={`${transaction.id}-${detail.label}`}>
                                        <span>{detail.label}:</span> {detail.value}
                                      </p>
                                    ))}
                                  </div>

                                  {showTransactionMap ? (
                                    <TransactionLocationMap transaction={transaction} />
                                  ) : null}

                                  <NavLink
                                    to="/support"
                                    className="transaction-support-link"
                                  >
                                    Don&apos;t recognise this transaction?
                                  </NavLink>
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