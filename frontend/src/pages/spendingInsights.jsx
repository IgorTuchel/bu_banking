import { useMemo, useState } from "react";
import "./spendingInsights.css";

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

function formatCurrency(value) {
  return `£${value.toFixed(2)}`;
}

export default function SpendingInsights() {
  const [activeView, setActiveView] = useState("Categories");

  const expenseTransactions = useMemo(() => {
    return sampleTransactions.filter((transaction) => transaction.amount.startsWith("-"));
  }, []);

  const totalSpent = useMemo(() => {
    return expenseTransactions.reduce(
      (sum, transaction) => sum + Math.abs(getAmountValue(transaction.amount)),
      0
    );
  }, [expenseTransactions]);

  const averageSpend = useMemo(() => {
    if (!expenseTransactions.length) return 0;
    return totalSpent / expenseTransactions.length;
  }, [expenseTransactions, totalSpent]);

  const largestExpense = useMemo(() => {
    if (!expenseTransactions.length) return null;

    return expenseTransactions.reduce((largest, current) => {
      return Math.abs(getAmountValue(current.amount)) > Math.abs(getAmountValue(largest.amount))
        ? current
        : largest;
    });
  }, [expenseTransactions]);

  const categoryBreakdown = useMemo(() => {
    const totalsByCategory = expenseTransactions.reduce((acc, transaction) => {
      const amount = Math.abs(getAmountValue(transaction.amount));
      acc[transaction.category] = (acc[transaction.category] || 0) + amount;
      return acc;
    }, {});

    return Object.entries(totalsByCategory)
      .map(([category, total]) => ({
        category,
        total,
        percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenseTransactions, totalSpent]);

  const merchantBreakdown = useMemo(() => {
    const totalsByMerchant = expenseTransactions.reduce((acc, transaction) => {
      const amount = Math.abs(getAmountValue(transaction.amount));
      acc[transaction.name] = (acc[transaction.name] || 0) + amount;
      return acc;
    }, {});

    return Object.entries(totalsByMerchant)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenseTransactions]);

  const insightMessage = useMemo(() => {
    if (!categoryBreakdown.length) {
      return "No spending insights are available yet.";
    }

    const topCategory = categoryBreakdown[0];
    return `Your highest spending category is ${topCategory.category}, making up ${topCategory.percentage.toFixed(
      0
    )}% of your outgoing payments.`;
  }, [categoryBreakdown]);

  return (
    <main className="home-page spending-insights-page">
      <header className="dashboard-header">
        <h1>Spending Insights</h1>
        <p>Track where your money is going and spot your biggest spending patterns.</p>
      </header>

      <section className="summary-grid">
        <article className="summary-card summary-outgoing">
          <h3>Total Spent</h3>
          <p>{formatCurrency(totalSpent)}</p>
        </article>

        <article className="summary-card summary-balance">
          <h3>Average Spend</h3>
          <p>{formatCurrency(averageSpend)}</p>
        </article>

        <article className="summary-card summary-incoming">
          <h3>Largest Expense</h3>
          <p>{largestExpense ? largestExpense.name : "N/A"}</p>
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
                activeView === view ? "transactions-filter-button-active" : ""
              }`}
              onClick={() => setActiveView(view)}
            >
              {view}
            </button>
          ))}
        </div>

        {activeView === "Categories" ? (
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
            <p className="mini-insight-value">Balanced</p>
            <p className="mini-insight-subtext">
              Your spending is spread across multiple categories.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}