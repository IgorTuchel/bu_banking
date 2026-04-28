import { useEffect, useMemo, useState } from "react";
import "./statements.css";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import logo from "../assets/logo.png";
import { getStatementsData } from "../services/statementsService";
import Skeleton from "../components/Skeleton";

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
  const str = String(amountString);
  const isNeg = str.includes("-");
  const cleaned = str.replace(/[^0-9.]/g, ""); // strip £, +, -, spaces
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return isNeg ? -parsed : parsed;
}

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, index) => ({
    value: String(index),
    label: new Intl.DateTimeFormat("en-GB", { month: "long" }).format(
      new Date(2026, index, 1),
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
      const account = accounts.find((item) => item.id === statement.accountId);

      const completedTransactions = statement.transactions.filter(
        (t) => t.status === "Completed",
      );

      const totalIn = completedTransactions
        .filter((t) => parseAmount(t.amount) > 0)
        .reduce((sum, t) => sum + parseAmount(t.amount), 0);

      const totalOut = completedTransactions
        .filter((t) => parseAmount(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0);

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
      if (dateA !== dateB) return dateB - dateA;
      return a.account?.name?.localeCompare(b.account?.name ?? "") ?? 0;
    });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function downloadStatement(statement) {
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const spacing = 14;
    const contentWidth = pageWidth - spacing * 2;

    const colours = {
      green: [46, 139, 87],
      greenDark: [32, 110, 68],
      gold: [212, 175, 55],
      white: [255, 255, 255],
      black: [18, 18, 18],
      heading: [24, 31, 42],
      text: [35, 35, 35],
      muted: [107, 114, 128],
      border: [224, 231, 235],
      borderLight: [236, 240, 243],
      surface: [255, 255, 255],
      surfaceAlt: [248, 250, 249],
      success: [34, 197, 94],
      warning: [183, 121, 31],
      error: [220, 38, 38],
    };

    // Header
    doc.setFillColor(...colours.green);
    doc.rect(0, 0, pageWidth, 32, "F");

    const logoImg = await loadImage(logo);
    const logoRatio = logoImg.width / logoImg.height;
    const logoHeight = 20;
    const logoWidth = logoHeight * logoRatio;
    doc.addImage(logo, "PNG", spacing, 6, logoWidth, logoHeight);

    const rightX = pageWidth - spacing;
    doc.setTextColor(...colours.gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Aurix", rightX, 13, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Private Banking", rightX, 18.5, { align: "right" });
    doc.setFontSize(9.5);
    doc.text(statement.statementLabel, rightX, 24, { align: "right" });

    // Account card
    let y = 40;
    doc.setFillColor(...colours.surface);
    doc.setDrawColor(...colours.gold);
    doc.setLineWidth(0.35);
    doc.roundedRect(spacing, y, contentWidth, 40, 4, 4, "FD");
    doc.setFillColor(...colours.green);
    doc.rect(spacing, y, contentWidth, 4, "F");

    doc.setTextColor(...colours.heading);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(statement.account?.name ?? "Unknown account", spacing + 5, y + 12);

    const typeText = statement.account?.type ?? "Account";
    const pillX = pageWidth - spacing - 34;
    doc.setFillColor(232, 247, 238);
    doc.roundedRect(pillX, y + 7, 29, 8, 4, 4, "F");
    doc.setTextColor(...colours.greenDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(typeText, pillX + 14.5, y + 12.3, { align: "center" });

    doc.setDrawColor(...colours.borderLight);
    doc.setLineWidth(0.2);
    doc.line(spacing + 5, y + 16, pageWidth - spacing - 5, y + 16);

    doc.setTextColor(...colours.black);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Account number:", spacing + 5, y + 23);
    doc.text(
      statement.account?.maskedAccountNumber ?? "N/A",
      spacing + 38,
      y + 23,
    );
    doc.text("Sort code:", spacing + 5, y + 30);
    doc.text(statement.account?.sortCode ?? "N/A", spacing + 38, y + 30);
    doc.text("Statement period:", pageWidth / 2 + 4, y + 23);
    doc.text(statement.statementLabel, pageWidth / 2 + 35, y + 23);
    doc.text("Transactions:", pageWidth / 2 + 4, y + 30);
    doc.text(String(statement.transactionCount), pageWidth / 2 + 35, y + 30);

    // Summary cards
    y += 48;
    const gap = 4;
    const cardWidth = (contentWidth - gap * 2) / 3;
    const cardHeight = 22;

    [
      {
        title: "Completed",
        value: String(statement.completedCount),
        accent: colours.green,
      },
      {
        title: "Money in",
        value: formatCurrency(statement.totalIn),
        accent: colours.success,
      },
      {
        title: "Money out",
        value: formatCurrency(statement.totalOut),
        accent: colours.error,
      },
    ].forEach((item, index) => {
      const x = spacing + index * (cardWidth + gap);
      doc.setFillColor(...colours.surface);
      doc.setDrawColor(...colours.border);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "FD");
      doc.setFillColor(...item.accent);
      doc.rect(x, y, 2.4, cardHeight, "F");
      doc.setTextColor(...colours.muted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(item.title, x + 5, y + 7);
      doc.setTextColor(...colours.black);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(item.value, x + 5, y + 15);
    });

    // Table
    y += 31;
    doc.setTextColor(...colours.heading);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Transactions", spacing, y);
    doc.setDrawColor(...colours.gold);
    doc.setLineWidth(0.8);
    doc.line(spacing, y + 2.5, pageWidth - spacing, y + 2.5);

    autoTable(doc, {
      startY: y + 7,
      margin: { left: spacing, right: spacing },
      head: [["Date", "Name", "Category", "Amount", "Status", "Type"]],
      body: statement.transactions.map((t) => [
        new Date(t.timestamp).toLocaleDateString("en-GB"),
        t.name ?? "",
        t.category ?? "",
        t.amount ?? "",
        t.status ?? "",
        t.paymentType ?? "",
      ]),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 3,
        textColor: colours.black,
        lineColor: colours.borderLight,
        lineWidth: 0.2,
        overflow: "linebreak",
        fillColor: colours.white,
      },
      headStyles: {
        fillColor: colours.green,
        textColor: colours.white,
        fontStyle: "bold",
        lineColor: colours.green,
      },
      alternateRowStyles: { fillColor: colours.surfaceAlt },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 42 },
        2: { cellWidth: 28 },
        3: { cellWidth: 24, halign: "right" },
        4: { cellWidth: 24, halign: "center" },
        5: { cellWidth: 22 },
      },
      didParseCell(data) {
        if (data.section === "body") {
          data.cell.styles.textColor = colours.black;
        }
        if (data.section === "body" && data.column.index === 3) {
          const amount = parseAmount(String(data.cell.raw ?? ""));
          if (amount > 0) {
            data.cell.styles.textColor = colours.success;
            data.cell.styles.fontStyle = "bold";
          } else if (amount < 0) {
            data.cell.styles.textColor = colours.error;
            data.cell.styles.fontStyle = "bold";
          }
        }
        if (data.section === "body" && data.column.index === 4) {
          const s = String(data.cell.raw ?? "").toLowerCase();
          if (s === "completed") {
            data.cell.styles.textColor = colours.success;
            data.cell.styles.fontStyle = "bold";
          } else if (s === "pending") {
            data.cell.styles.textColor = colours.warning;
            data.cell.styles.fontStyle = "bold";
          } else if (s === "declined") {
            data.cell.styles.textColor = colours.error;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      didDrawPage() {
        doc.setDrawColor(...colours.borderLight);
        doc.setLineWidth(0.2);
        doc.line(
          spacing,
          pageHeight - 14,
          pageWidth - spacing,
          pageHeight - 14,
        );
        doc.setTextColor(...colours.muted);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Aurix Bank", spacing, pageHeight - 9);
        doc.text(
          `Generated ${new Date().toLocaleDateString("en-GB")}`,
          pageWidth - spacing,
          pageHeight - 9,
          { align: "right" },
        );
      },
    });

    doc.save(
      `${statement.account?.key ?? "account"}-statement-${statement.fileDate}.pdf`,
    );
  } catch (error) {
    console.error("PDF download failed:", error);
    alert("Could not generate the PDF. Check the console for details.");
  }
}

function Statements() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedAccountId, setSelectedAccountId] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const { accounts: accs, transactions: txns } =
          await getStatementsData();
        setAccounts(accs);
        setTransactions(txns);
      } catch (err) {
        console.error(err);
        setError("Failed to load statements data.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const statements = useMemo(
    () => buildStatements(accounts, transactions),
    [accounts, transactions],
  );

  const availableYears = useMemo(() => {
    const uniqueYears = [...new Set(statements.map((s) => s.year))];
    return uniqueYears.sort((a, b) => b - a);
  }, [statements]);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const filteredStatements = useMemo(() => {
    return statements.filter((s) => {
      const matchesYear =
        selectedYear === "all" || s.year === Number(selectedYear);
      const matchesMonth =
        selectedMonth === "all" || s.month === Number(selectedMonth);
      const matchesAccount =
        selectedAccountId === "all" || s.accountId === selectedAccountId;
      return matchesYear && matchesMonth && matchesAccount;
    });
  }, [statements, selectedYear, selectedMonth, selectedAccountId]);

  const summary = useMemo(() => {
    return filteredStatements.reduce(
      (acc, s) => {
        acc.statementCount += 1;
        acc.totalTransactions += s.transactionCount;
        acc.totalIn += s.totalIn;
        acc.totalOut += s.totalOut;
        return acc;
      },
      { statementCount: 0, totalTransactions: 0, totalIn: 0, totalOut: 0 },
    );
  }, [filteredStatements]);

  if (isLoading) {
    return (
      <main className="statements-page">
        <header className="dashboard-header">
          <h1>Statements</h1>
          <p>View and download your monthly account statements.</p>
        </header>
        <Skeleton width="100%" height="5rem" />
        <section className="summary-grid" style={{ marginTop: "1rem" }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} width="100%" height="5rem" />
          ))}
        </section>
        <Skeleton width="100%" height="20rem" style={{ marginTop: "1rem" }} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="statements-page">
        <section className="status-card error-card">
          <h2>Something went wrong</h2>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="statements-page">
      <header className="dashboard-header">
        <h1>Statements</h1>
        <p>View and download your monthly account statements.</p>
      </header>

      <section className="statements-filters-card">
        <div className="statements-filters-grid">
          <div className="account-selector-section">
            <label
              className="account-selector-label"
              htmlFor="statement-account"
            >
              Account
            </label>
            <select
              id="statement-account"
              className="account-selector"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="all">All accounts</option>
              {accounts.map((account) => (
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
              onChange={(e) => setSelectedYear(e.target.value)}
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
              onChange={(e) => setSelectedMonth(e.target.value)}
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
                    <p className="statement-period">
                      {statement.statementLabel}
                    </p>
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
