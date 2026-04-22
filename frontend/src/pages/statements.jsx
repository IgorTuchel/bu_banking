import { useMemo, useState } from "react";
import "./statements.css";

import { accountsData } from "../data/accountsData";
import { transactionsData } from "../data/transactionsData";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function formatMonthLabel(year, monthIndex) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex, 1));
}

function formatStatementFileDate(year, monthIndex) {
  const month = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseAmount(amountString) {
  if (!amountString) return 0;

  const cleaned = amountString.replace(/[£,\s]/g, "");
  const parsed = Number(cleaned);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, index) => ({
    value: String(index),
    label: new Intl.DateTimeFormat("en-GB", { month: "long" }).format(
      new Date(2026, index, 1)
    ),
  }));
}

function buildStatements(accounts, transactions) {
  const grouped = new Map();

  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.timestamp);

    if (Number.isNaN(transactionDate.getTime())) return;

    const year = transactionDate.getFullYear();
    const month = transactionDate.getMonth();
    const key = `${transaction.accountId}-${year}-${month}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        accountId: transaction.accountId,
        year,
        month,
        transactions: [],
      });
    }

    grouped.get(key).transactions.push(transaction);
  });

  return Array.from(grouped.values())
    .map((statement) => {
      const account = accounts.find(
        (item) => item.id === statement.accountId
      );

      const completedTransactions = statement.transactions.filter(
        (transaction) => transaction.status === "Completed"
      );

      const totalIn = completedTransactions
        .filter((transaction) => parseAmount(transaction.amount) > 0)
        .reduce((sum, transaction) => {
          return sum + parseAmount(transaction.amount);
        }, 0);

      const totalOut = completedTransactions
        .filter((transaction) => parseAmount(transaction.amount) < 0)
        .reduce((sum, transaction) => {
          return sum + Math.abs(parseAmount(transaction.amount));
        }, 0);

      return {
        ...statement,
        account,
        statementLabel: formatMonthLabel(statement.year, statement.month),
        fileDate: formatStatementFileDate(statement.year, statement.month),
        transactionCount: statement.transactions.length,
        completedCount: completedTransactions.length,
        totalIn,
        totalOut,
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.year, a.month, 1).getTime();
      const dateB = new Date(b.year, b.month, 1).getTime();

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      return a.account?.name?.localeCompare(b.account?.name ?? "") ?? 0;
    });
}

function downloadStatement(statement) {
  const lines = [
    "Aurix Bank Statement",
    "====================",
    `Account: ${statement.account?.name ?? "Unknown account"}`,
    `Account type: ${statement.account?.type ?? "N/A"}`,
    `Statement period: ${statement.statementLabel}`,
    `Account number: ${statement.account?.maskedAccountNumber ?? "N/A"}`,
    `Sort code: ${statement.account?.sortCode ?? "N/A"}`,
    "",
    `Transactions: ${statement.transactionCount}`,
    `Completed transactions: ${statement.completedCount}`,
    `Money in: ${formatCurrency(statement.totalIn)}`,
    `Money out: ${formatCurrency(statement.totalOut)}`,
    "",
    "Transaction list",
    "----------------",
    ...statement.transactions.map((transaction) => {
      return [
        `Date: ${new Date(transaction.timestamp).toLocaleString("en-GB")}`,
        `Name: ${transaction.name}`,
        `Category: ${transaction.category}`,
        `Amount: ${transaction.amount}`,
        `Status: ${transaction.status}`,
        `Payment type: ${transaction.paymentType}`,
      ].join(" | ");
    }),
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${statement.account?.key ?? "account"}-statement-${
    statement.fileDate
  }.txt`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function Statements() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedAccountId, setSelectedAccountId] = useState("all");

  const statements = useMemo(() => {
    return buildStatements(accountsData, transactionsData);
  }, []);

  const availableYears = useMemo(() => {
    const uniqueYears = [
      ...new Set(statements.map((statement) => statement.year)),
    ];

    return uniqueYears.sort((a, b) => b - a);
  }, [statements]);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const filteredStatements = useMemo(() => {
    return statements.filter((statement) => {
      const matchesYear =
        selectedYear === "all" || statement.year === Number(selectedYear);

      const matchesMonth =
        selectedMonth === "all" || statement.month === Number(selectedMonth);

      const matchesAccount =
        selectedAccountId === "all" ||
        statement.accountId === selectedAccountId;

      return matchesYear && matchesMonth && matchesAccount;
    });
  }, [statements, selectedYear, selectedMonth, selectedAccountId]);

  const summary = useMemo(() => {
    return filteredStatements.reduce(
      (accumulator, statement) => {
        accumulator.statementCount += 1;
        accumulator.totalTransactions += statement.transactionCount;
        accumulator.totalIn += statement.totalIn;
        accumulator.totalOut += statement.totalOut;
        return accumulator;
      },
      {
        statementCount: 0,
        totalTransactions: 0,
        totalIn: 0,
        totalOut: 0,
      }
    );
  }, [filteredStatements]);

  return (
    <main className="statements-page">
      <header className="dashboard-header">
        <h1>Statements</h1>
        <p>View and download your monthly account statements.</p>
      </header>

      <section className="statements-filters-card">
        <div className="statements-filters-grid">
          <div className="account-selector-section">
            <label className="account-selector-label" htmlFor="statement-account">
              Account
            </label>
            <select
              id="statement-account"
              className="account-selector"
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.target.value)}
            >
              <option value="all">All accounts</option>
              {accountsData.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} • {account.type}
                </option>
              ))}
            </select>
          </div>

          <div className="account-selector-section">
            <label className="account-selector-label" htmlFor="statement-year">
              Year
            </label>
            <select
              id="statement-year"
              className="account-selector"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              <option value="all">All years</option>
              {availableYears.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="account-selector-section">
            <label className="account-selector-label" htmlFor="statement-month">
              Month
            </label>
            <select
              id="statement-month"
              className="account-selector"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              <option value="all">All months</option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card summary-balance">
          <h3>Statements found</h3>
          <p>{summary.statementCount}</p>
        </article>

        <article className="summary-card summary-incoming">
          <h3>Total money in</h3>
          <p>{formatCurrency(summary.totalIn)}</p>
        </article>

        <article className="summary-card summary-outgoing">
          <h3>Total money out</h3>
          <p>{formatCurrency(summary.totalOut)}</p>
        </article>
      </section>

      <section className="statements-list-section">
        <div className="section-header">
          <h2>Available statements</h2>
          <span className="statements-result-count">
            {filteredStatements.length} statement
            {filteredStatements.length === 1 ? "" : "s"}
          </span>
        </div>

        {filteredStatements.length === 0 ? (
          <div className="status-card empty-card">
            <h2>No statements found</h2>
            <p>Try changing your account, year, or month filters.</p>
          </div>
        ) : (
          <div className="statements-list">
            {filteredStatements.map((statement) => (
              <article key={statement.id} className="statement-card">
                <div className="statement-card-main">
                  <div className="statement-card-left">
                    <p className="statement-period">{statement.statementLabel}</p>
                    <p className="statement-account-name">
                      {statement.account?.name ?? "Unknown account"}
                    </p>
                    <p className="statement-meta">
                      {statement.transactionCount} transaction
                      {statement.transactionCount === 1 ? "" : "s"} •{" "}
                      {statement.account?.maskedAccountNumber ?? "N/A"}
                    </p>
                  </div>

                  <div className="statement-card-centre">
                    <div className="statement-stat">
                      <span className="statement-stat-label">Money in</span>
                      <span className="statement-stat-value statement-positive">
                        {formatCurrency(statement.totalIn)}
                      </span>
                    </div>

                    <div className="statement-stat">
                      <span className="statement-stat-label">Money out</span>
                      <span className="statement-stat-value statement-negative">
                        {formatCurrency(statement.totalOut)}
                      </span>
                    </div>
                  </div>

                  <div className="statement-card-right">
                    <button
                      type="button"
                      className="statement-download-button"
                      onClick={() => downloadStatement(statement)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Statements;