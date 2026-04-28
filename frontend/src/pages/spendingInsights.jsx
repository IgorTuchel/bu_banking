import { useEffect, useMemo, useState } from "react";
import "./spendingInsights.css";

import AccountDropdown from "../components/AccountDropdown";
import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";

import { useAuth } from "../context/AuthContext";
import { getAccountsForUser } from "../services/accountService";
import { getTransactionsForAccount } from "../services/transactionService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAmountValue(amount) {
  if (!amount) return 0;
  const str = String(amount);
  const isNeg = str.includes("-");
  const cleaned = str.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return isNeg ? -parsed : parsed;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function filterByDateRange(transactions, range) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  let from;

  if (range === "thisMonth") {
    from = new Date(year, month, 1);
  } else if (range === "lastMonth") {
    from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 1);
    return transactions.filter((t) => {
      const d = new Date(t.timestamp);
      return d >= from && d < to;
    });
  } else if (range === "3months") {
    from = new Date(year, month - 2, 1);
  } else {
    return transactions; // "all"
  }

  return transactions.filter((t) => new Date(t.timestamp) >= from);
}

function getSpendingHabit(categoryBreakdown, totalSpent) {
  if (!categoryBreakdown.length)
    return {
      label: "No data",
      note: "Make some transactions to see your patterns.",
    };

  const top = categoryBreakdown[0];
  const topPct = top.percentage;

  if (topPct > 60) {
    return {
      label: "Focused",
      note: `Over 60% of spending is in ${top.category}. Consider diversifying.`,
    };
  }
  if (topPct > 40) {
    return {
      label: "Category-heavy",
      note: `${top.category} dominates your spending at ${topPct.toFixed(0)}%.`,
    };
  }
  if (categoryBreakdown.length >= 4) {
    return {
      label: "Balanced",
      note: "Your spending is spread across multiple categories.",
    };
  }
  return {
    label: "Moderate",
    note: "Spending is fairly distributed across a few categories.",
  };
}

const DATE_RANGE_OPTIONS = [
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "3months", label: "Last 3 months" },
  { value: "all", label: "All time" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpendingInsights() {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccountKey, setSelectedAccountKey] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("thisMonth");
  const [activeView, setActiveView] = useState("Categories");
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [error, setError] = useState("");

  // Load accounts
  useEffect(() => {
    if (!user) return;

    async function loadAccounts() {
      try {
        setIsLoadingAccounts(true);
        const accs = await getAccountsForUser();
        setAccounts(accs);
        if (accs.length > 0) setSelectedAccountKey(accs[0].key);
      } catch {
        setError("Failed to load accounts.");
      } finally {
        setIsLoadingAccounts(false);
      }
    }

    loadAccounts();
  }, [user]);

  // Load transactions when account changes
  useEffect(() => {
    if (!selectedAccountKey) return;

    const account = accounts.find((a) => a.key === selectedAccountKey);
    if (!account) return;

    async function loadTransactions() {
      try {
        setIsLoadingTransactions(true);
        setError("");
        const txns = await getTransactionsForAccount(account.id);
        setTransactions(Array.isArray(txns) ? txns : []);
      } catch {
        setError("Failed to load transactions.");
      } finally {
        setIsLoadingTransactions(false);
      }
    }

    loadTransactions();
  }, [selectedAccountKey, accounts]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => ({ value: a.key, label: `${a.name} • ${a.type}` })),
    [accounts],
  );

  const rangeFiltered = useMemo(
    () => filterByDateRange(transactions, selectedDateRange),
    [transactions, selectedDateRange],
  );

  const expenseTransactions = useMemo(
    () =>
      rangeFiltered.filter((t) => {
        const val = getAmountValue(t.amount ?? "0");
        return val < 0;
      }),
    [rangeFiltered],
  );

  const incomeTransactions = useMemo(
    () => rangeFiltered.filter((t) => getAmountValue(t.amount ?? "0") > 0),
    [rangeFiltered],
  );

  const totalSpent = useMemo(
    () =>
      expenseTransactions.reduce(
        (sum, t) => sum + Math.abs(getAmountValue(t.amount)),
        0,
      ),
    [expenseTransactions],
  );

  const totalIncome = useMemo(
    () =>
      incomeTransactions.reduce(
        (sum, t) => sum + Math.abs(getAmountValue(t.amount)),
        0,
      ),
    [incomeTransactions],
  );

  const averageSpend = useMemo(
    () =>
      expenseTransactions.length ? totalSpent / expenseTransactions.length : 0,
    [expenseTransactions, totalSpent],
  );

  const largestExpense = useMemo(() => {
    if (!expenseTransactions.length) return null;
    return expenseTransactions.reduce((largest, current) =>
      Math.abs(getAmountValue(current.amount)) >
      Math.abs(getAmountValue(largest.amount))
        ? current
        : largest,
    );
  }, [expenseTransactions]);

  const categoryBreakdown = useMemo(() => {
    const totals = expenseTransactions.reduce((acc, t) => {
      const cat = t.category || "Other";
      const amount = Math.abs(getAmountValue(t.amount));
      acc[cat] = (acc[cat] || 0) + amount;
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([category, total]) => ({
        category,
        total,
        percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenseTransactions, totalSpent]);

  const merchantBreakdown = useMemo(() => {
    const totals = expenseTransactions.reduce((acc, t) => {
      const name = t.name || "Unknown";
      const amount = Math.abs(getAmountValue(t.amount));
      acc[name] = (acc[name] || 0) + amount;
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenseTransactions]);

  const insightMessage = useMemo(() => {
    if (!categoryBreakdown.length)
      return "No spending data yet for this period.";
    const top = categoryBreakdown[0];
    return `Your highest spending category is ${top.category}, making up ${top.percentage.toFixed(0)}% of your outgoing payments.`;
  }, [categoryBreakdown]);

  const spendingHabit = useMemo(
    () => getSpendingHabit(categoryBreakdown, totalSpent),
    [categoryBreakdown, totalSpent],
  );

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoadingAccounts) {
    return (
      <main className="home-page spending-insights-page">
        <header className="dashboard-header">
          <h1>Spending Insights</h1>
          <p>
            Track where your money is going and spot your biggest spending
            patterns.
          </p>
        </header>
        <Skeleton width="260px" height="3rem" />
        <section className="summary-grid" style={{ marginTop: "1rem" }}>
          {[...Array(3)].map((_, i) => (
            <SkeletonSummaryCard key={i} />
          ))}
        </section>
        <Skeleton width="100%" height="12rem" style={{ marginTop: "1.5rem" }} />
      </main>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <main className="home-page spending-insights-page">
      <header className="dashboard-header">
        <h1>Spending Insights</h1>
        <p>
          Track where your money is going and spot your biggest spending
          patterns.
        </p>
      </header>

      {/* Account + date range selectors */}
      <div className="insights-selectors">
        <AccountDropdown
          label="Account"
          value={selectedAccountKey}
          onChange={setSelectedAccountKey}
          options={accountOptions}
        />
        <AccountDropdown
          label="Period"
          value={selectedDateRange}
          onChange={setSelectedDateRange}
          options={DATE_RANGE_OPTIONS}
        />
      </div>

      {error ? (
        <section className="status-card error-card">
          <h2>Something went wrong</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {isLoadingTransactions ? (
        <>
          <section className="summary-grid">
            {[...Array(3)].map((_, i) => (
              <SkeletonSummaryCard key={i} />
            ))}
          </section>
          <Skeleton
            width="100%"
            height="12rem"
            style={{ marginTop: "1.5rem" }}
          />
        </>
      ) : (
        <>
          <section className="summary-grid">
            <article className="summary-card summary-outgoing">
              <h3>Total Spent</h3>
              <p>{formatCurrency(totalSpent)}</p>
              <small className="summary-card-note">
                {expenseTransactions.length} transactions
              </small>
            </article>

            <article className="summary-card summary-balance">
              <h3>Average Spend</h3>
              <p>{formatCurrency(averageSpend)}</p>
              <small className="summary-card-note">Per transaction</small>
            </article>

            <article className="summary-card summary-incoming">
              <h3>Largest Expense</h3>
              <p>
                {largestExpense
                  ? formatCurrency(
                      Math.abs(getAmountValue(largestExpense.amount)),
                    )
                  : "N/A"}
              </p>
              <small className="summary-card-note">
                {largestExpense?.name ?? "No transactions yet"}
              </small>
            </article>
          </section>

          <section className="transactions-section insights-highlight-section">
            <div className="section-header">
              <h2>Key Insight</h2>
            </div>
            <div className="insight-highlight-card">
              <p>{insightMessage}</p>
            </div>
          </section>

          <section className="transactions-section insights-page-section">
            <div className="section-header">
              <div>
                <h2>Spending Breakdown</h2>
                <p className="transactions-subtext">
                  Review your spending by category and merchant.
                </p>
              </div>
            </div>

            <div className="transactions-filters">
              {["Categories", "Top Merchants"].map((view) => (
                <button
                  key={view}
                  type="button"
                  className={`transactions-filter-button ${
                    activeView === view
                      ? "transactions-filter-button-active"
                      : ""
                  }`}
                  onClick={() => setActiveView(view)}
                >
                  {view}
                </button>
              ))}
            </div>

            {activeView === "Categories" ? (
              categoryBreakdown.length === 0 ? (
                <div className="status-card empty-card">
                  <h2>No spending data</h2>
                  <p>No outgoing transactions found for this period.</p>
                </div>
              ) : (
                <div className="insights-list">
                  {categoryBreakdown.map((item) => (
                    <div key={item.category} className="insight-row">
                      <div className="insight-row-top">
                        <div>
                          <p className="transaction-name">{item.category}</p>
                          <p className="transaction-date">
                            {item.percentage.toFixed(1)}% of total spending
                          </p>
                        </div>
                        <p className="transaction-amount transaction-negative">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                      <div className="insight-bar-track">
                        <div
                          className="insight-bar-fill"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : merchantBreakdown.length === 0 ? (
              <div className="status-card empty-card">
                <h2>No merchant data</h2>
                <p>No outgoing transactions found for this period.</p>
              </div>
            ) : (
              <div className="insights-list">
                {merchantBreakdown.map((merchant) => (
                  <div key={merchant.name} className="transaction-row">
                    <div>
                      <p className="transaction-name">{merchant.name}</p>
                      <p className="transaction-date">Top spending merchant</p>
                    </div>
                    <p className="transaction-amount transaction-negative">
                      {formatCurrency(merchant.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="insights-grid">
            <article className="transactions-section">
              <div className="section-header">
                <h2>Highest Category</h2>
              </div>
              <div className="mini-insight-card">
                <p className="mini-insight-label">Category</p>
                <p className="mini-insight-value">
                  {categoryBreakdown[0]?.category || "N/A"}
                </p>
                <p className="mini-insight-subtext">
                  {categoryBreakdown[0]
                    ? `${formatCurrency(categoryBreakdown[0].total)} spent`
                    : "No data available"}
                </p>
              </div>
            </article>

            <article className="transactions-section">
              <div className="section-header">
                <h2>Spending Habit</h2>
              </div>
              <div className="mini-insight-card">
                <p className="mini-insight-label">Pattern</p>
                <p className="mini-insight-value">{spendingHabit.label}</p>
                <p className="mini-insight-subtext">{spendingHabit.note}</p>
              </div>
            </article>

            <article className="transactions-section">
              <div className="section-header">
                <h2>Income vs Spending</h2>
              </div>
              <div className="mini-insight-card">
                <p className="mini-insight-label">Net</p>
                <p
                  className={`mini-insight-value ${
                    totalIncome - totalSpent >= 0
                      ? "transaction-positive"
                      : "transaction-negative"
                  }`}
                >
                  {formatCurrency(totalIncome - totalSpent)}
                </p>
                <p className="mini-insight-subtext">
                  {formatCurrency(totalIncome)} in ·{" "}
                  {formatCurrency(totalSpent)} out
                </p>
              </div>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
