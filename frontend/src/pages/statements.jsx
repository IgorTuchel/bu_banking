import { useMemo, useState } from "react";
import "./statements.css";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { accountsData } from "../data/accountsData";
import { transactionsData } from "../data/transactionsData";
import logo from "../assets/logo.png";

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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getStatusColours(status) {
  const normalised = String(status ?? "").toLowerCase();

  if (normalised === "completed") {
    return {
      fill: [34, 197, 94, 0.12],
      text: [34, 197, 94],
    };
  }

  if (normalised === "pending") {
    return {
      fill: [245, 158, 11, 0.14],
      text: [183, 121, 31],
    };
  }

  if (normalised === "declined") {
    return {
      fill: [220, 38, 38, 0.12],
      text: [220, 38, 38],
    };
  }

  return {
    fill: [240, 240, 240],
    text: [60, 60, 60],
  };
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

        // ===== HEADER =====
    doc.setFillColor(...colours.green);
    doc.rect(0, 0, pageWidth, 32, "F");

    // ===== LOGO (fit inside header properly) =====
const headerHeight = 32;

const logoImg = await loadImage(logo);
const logoRatio = logoImg.width / logoImg.height;

// make logo fit INSIDE header height with padding
const logoHeight = headerHeight - 12; // padding top/bottom
const logoWidth = logoHeight * logoRatio;

doc.addImage(logo, "PNG", spacing, 6, logoWidth, logoHeight);

    // ===== BRAND TEXT (right side) =====
    const rightX = pageWidth - spacing;

    doc.setTextColor(...colours.gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Aurix", rightX, 13, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Private Banking", rightX, 18.5, { align: "right" });

    // ===== Statement label under it =====
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(statement.statementLabel, rightX, 24, { align: "right" });


    // ===== Main statement card =====
    let y = 40;

    doc.setFillColor(...colours.surface);
    doc.setDrawColor(...colours.gold);
    doc.setLineWidth(0.35);
    doc.roundedRect(spacing, y, contentWidth, 40, 4, 4, "FD");

    // subtle green top strip like the transactions cards feel
    doc.setFillColor(...colours.surface);
    doc.roundedRect(spacing, y, contentWidth, 40, 4, 4, "F");
    doc.setDrawColor(...colours.gold);
    doc.roundedRect(spacing, y, contentWidth, 40, 4, 4, "S");
    doc.setFillColor(...colours.green);
    doc.rect(spacing, y, contentWidth, 4, "F");

    // Account heading
    doc.setTextColor(...colours.heading);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(statement.account?.name ?? "Unknown account", spacing + 5, y + 12);

    // Type pill
    const typeText = statement.account?.type ?? "Account";
    const pillX = pageWidth - spacing - 34;
    const pillY = y + 7;
    const pillW = 29;
    const pillH = 8;

    doc.setFillColor(232, 247, 238);
    doc.roundedRect(pillX, pillY, pillW, pillH, 4, 4, "F");
    doc.setTextColor(...colours.greenDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(typeText, pillX + pillW / 2, pillY + 5.3, { align: "center" });

    // Divider
    doc.setDrawColor(...colours.borderLight);
    doc.setLineWidth(0.2);
    doc.line(spacing + 5, y + 16, pageWidth - spacing - 5, y + 16);

    // IMPORTANT: dark text on white background
    doc.setTextColor(...colours.black);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text("Account number:", spacing + 5, y + 23);
    doc.text(
      statement.account?.maskedAccountNumber ?? "N/A",
      spacing + 38,
      y + 23
    );

    doc.text("Sort code:", spacing + 5, y + 30);
    doc.text(statement.account?.sortCode ?? "N/A", spacing + 38, y + 30);

    doc.text("Statement period:", pageWidth / 2 + 4, y + 23);
    doc.text(statement.statementLabel, pageWidth / 2 + 35, y + 23);

    doc.text("Transactions:", pageWidth / 2 + 4, y + 30);
    doc.text(String(statement.transactionCount), pageWidth / 2 + 35, y + 30);

    // ===== Summary cards =====
    y += 48;

    const gap = 4;
    const cardWidth = (contentWidth - gap * 2) / 3;
    const cardHeight = 22;

    const summaryItems = [
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
    ];

    summaryItems.forEach((item, index) => {
      const x = spacing + index * (cardWidth + gap);

      doc.setFillColor(...colours.surface);
      doc.setDrawColor(...colours.border);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "FD");

      doc.setFillColor(...item.accent);
      doc.rect(x, y, 2.4, cardHeight, "F");

      // black/dark text on white
      doc.setTextColor(...colours.muted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(item.title, x + 5, y + 7);

      doc.setTextColor(...colours.black);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(item.value, x + 5, y + 15);
    });

    // ===== Transactions section title =====
    y += 31;

    doc.setTextColor(...colours.heading);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Transactions", spacing, y);

    // underline inspired by transactions page
    doc.setDrawColor(...colours.gold);
    doc.setLineWidth(0.8);
    doc.line(spacing, y + 2.5, pageWidth - spacing, y + 2.5);

    // ===== Table =====
    autoTable(doc, {
      startY: y + 7,
      margin: { left: spacing, right: spacing },
      head: [["Date", "Name", "Category", "Amount", "Status", "Type"]],
      body: statement.transactions.map((transaction) => [
        new Date(transaction.timestamp).toLocaleDateString("en-GB"),
        transaction.name ?? "",
        transaction.category ?? "",
        transaction.amount ?? "",
        transaction.status ?? "",
        transaction.paymentType ?? "",
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
      alternateRowStyles: {
        fillColor: colours.surfaceAlt,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 42 },
        2: { cellWidth: 28 },
        3: { cellWidth: 24, halign: "right" },
        4: { cellWidth: 24, halign: "center" },
        5: { cellWidth: 22 },
      },
      didParseCell: function (data) {
        // Keep body text dark on white/light rows
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
          const status = String(data.cell.raw ?? "").toLowerCase();

          if (status === "completed") {
            data.cell.styles.textColor = colours.success;
            data.cell.styles.fontStyle = "bold";
          } else if (status === "pending") {
            data.cell.styles.textColor = colours.warning;
            data.cell.styles.fontStyle = "bold";
          } else if (status === "declined") {
            data.cell.styles.textColor = colours.error;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      didDrawPage: function () {
        // footer
        doc.setDrawColor(...colours.borderLight);
        doc.setLineWidth(0.2);
        doc.line(spacing, pageHeight - 14, pageWidth - spacing, pageHeight - 14);

        doc.setTextColor(...colours.muted);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Aurix Bank", spacing, pageHeight - 9);
        doc.text(
          `Generated ${new Date().toLocaleDateString("en-GB")}`,
          pageWidth - spacing,
          pageHeight - 9,
          { align: "right" }
        );
      },
    });

    doc.save(
      `${statement.account?.key ?? "account"}-statement-${statement.fileDate}.pdf`
    );
  } catch (error) {
    console.error("PDF download failed:", error);
    alert("Could not generate the PDF. Check the console for details.");
  }
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