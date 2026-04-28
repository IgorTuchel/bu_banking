import { useEffect, useMemo, useState } from "react";
import "./home.css";
import "./transactions.css";

import DashboardHeader from "../components/DashboardHeader";
import SummaryCard from "../components/SummaryCard";
import QuickActions from "../components/QuickActions";
import HomeTransactionsPanel from "../components/HomeTransactionsPanel";
import NotificationsPanel from "../components/NotificationsPanel";
import AccountDropdown from "../components/AccountDropdown";
import SelectedAccountCard from "../components/SelectedAccountCard";
import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";
import SkeletonTransactionsList from "../components/SkeletonTransactionsList";

import { getDashboardData } from "../services/dashboardService";
function getHomeAccountSummaryCards({ account }) {
  if (!account) return [];

  const balanceCard = {
    id: "balance",
    title: "Current Balance",
    value: formatCurrency(account.currentBalance, account.currency),
    note: account.status === "frozen" ? "Account frozen" : null,
  };

  if (account.type === "savings") {
    return [
      balanceCard,
      {
        id: "interest-rate",
        title: "Interest Rate",
        value:
          account.interestRate != null ? `${account.interestRate}% AER` : "—",
        note: null,
      },
      {
        id: "interest-earned",
        title: "Interest Earned (YTD)",
        value:
          account.interestEarnedYtd != null
            ? formatCurrency(account.interestEarnedYtd, account.currency)
            : "—",
        note: null,
      },
    ];
  }

  if (account.type === "credit") {
    return [
      balanceCard,
      {
        id: "credit-limit",
        title: "Credit Limit",
        value:
          account.creditLimit != null
            ? formatCurrency(account.creditLimit, account.currency)
            : "—",
        note: null,
      },
      {
        id: "available-credit",
        title: "Available Credit",
        value:
          account.availableCredit != null
            ? formatCurrency(account.availableCredit, account.currency)
            : "—",
        note:
          account.minimumPaymentDue > 0
            ? `Min. payment: ${formatCurrency(
                account.minimumPaymentDue,
                account.currency,
              )}`
            : null,
      },
    ];
  }

  const transactions = account.transactions ?? [];

  const totalIn = transactions
    .filter((transaction) => transaction.amount?.startsWith("+"))
    .reduce(
      (sum, transaction) =>
        sum + parseFloat(transaction.amount.replace(/[^0-9.]/g, "")),
      0,
    );

  const totalOut = transactions
    .filter((transaction) => transaction.amount?.startsWith("-"))
    .reduce(
      (sum, transaction) =>
        sum + parseFloat(transaction.amount.replace(/[^0-9.]/g, "")),
      0,
    );

  return [
    balanceCard,
    {
      id: "money-in",
      title: "Money In",
      value: formatCurrency(totalIn, account.currency),
      note: `${
        transactions.filter((transaction) =>
          transaction.amount?.startsWith("+"),
        ).length
      } transactions`,
    },
    {
      id: "money-out",
      title: "Money Out",
      value: formatCurrency(totalOut, account.currency),
      note: `${
        transactions.filter((transaction) =>
          transaction.amount?.startsWith("-"),
        ).length
      } transactions`,
    },
  ];
}

function formatCurrency(amount, currency = "GBP") {
  const numericAmount = parseFloat(amount) || 0;

  if (currency === "GBP") {
    return `£${numericAmount.toFixed(2)}`;
  }

  return `${numericAmount.toFixed(2)} ${currency}`;
}
function getSelectedAccount(accounts, selectedKey, defaultIndex = 0) {
  if (!accounts || accounts.length === 0) return null;

  const found = accounts.find((account) => account.key === selectedKey);
  return found ?? accounts[defaultIndex] ?? accounts[0];
}

function Home() {
  const [dashboardData, setDashboardData] = useState(null);
  const [lastLogin, setLastLogin] = useState(null);
  const [selectedAccountKey, setSelectedAccountKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const data = await getDashboardData();
        setLastLogin(data.user.lastLogin);
        console.log("XD", data);
        setDashboardData(data);

        if (data.accounts && data.accounts.length > 0) {
          setSelectedAccountKey(data.accounts[0]?.key ?? data.accounts[0].key);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Unable to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);
  const selectedAccount = useMemo(() => {
    if (!dashboardData || !dashboardData.accounts) return null;

    return getSelectedAccount(dashboardData.accounts, selectedAccountKey, 0);
  }, [dashboardData, selectedAccountKey]);

  const accountOptions = useMemo(() => {
    if (!dashboardData || !dashboardData.accounts) return [];

    return dashboardData.accounts.map((account) => ({
      value: account.key,
      label: `${account.name} • ${account.type}`,
    }));
  }, [dashboardData]);

  const summaryCards = useMemo(() => {
    if (!selectedAccount) return [];

    return getHomeAccountSummaryCards({
      account: selectedAccount,
    });
  }, [selectedAccount]);

  const recentNotifications = useMemo(() => {
    return (dashboardData?.notifications ?? []).slice(0, 3);
  }, [dashboardData]);

  if (isLoading) {
    return (
      <main className="home-page">
        <header className="dashboard-header">
          <h1>Home</h1>
          <p>Overview of your accounts and latest activity.</p>
        </header>

        <Skeleton width="260px" height="3rem" />

        <div
          className="selected-account-card"
          style={{ pointerEvents: "none" }}
          aria-hidden="true"
        >
          <Skeleton width="140px" height="0.9rem" />
          <Skeleton
            width="200px"
            height="1.6rem"
            style={{ marginTop: "0.8rem" }}
          />
          <Skeleton
            width="110px"
            height="0.9rem"
            style={{ marginTop: "0.75rem" }}
          />
        </div>

        <section className="summary-grid">
          {[...Array(3)].map((_, index) => (
            <SkeletonSummaryCard key={index} />
          ))}
        </section>

        <section className="home-content-grid">
          <div className="transactions-section">
            <SkeletonTransactionsList />
          </div>

          <div className="notifications-section">
            <Skeleton width="110px" height="1.2rem" />
            <Skeleton
              width="100%"
              height="5rem"
              style={{ marginTop: "1rem" }}
            />
            <Skeleton
              width="100%"
              height="5rem"
              style={{ marginTop: "1rem" }}
            />
          </div>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="home-page">
        <section className="status-card error-card">
          <h2>Something went wrong</h2>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  if (!dashboardData || !selectedAccount) {
    return (
      <main className="home-page">
        <section className="status-card empty-card">
          <h2>No dashboard data available</h2>
          <p>There is currently no account information to display.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="home-page">
      <DashboardHeader
        firstName={dashboardData?.user?.firstName}
        lastLogin={lastLogin}
      />

      <AccountDropdown
        label="Select account"
        value={selectedAccountKey}
        onChange={setSelectedAccountKey}
        options={accountOptions}
      />

      <SelectedAccountCard account={selectedAccount} />

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.id}
            title={card.title}
            value={card.value}
            note={card.note}
          />
        ))}
      </section>

      <QuickActions actions={dashboardData.quickActions} />

      <section className="home-content-grid">
        <HomeTransactionsPanel
          transactions={selectedAccount.transactions ?? []}
          account={selectedAccount}
        />
        <NotificationsPanel notifications={recentNotifications} />
      </section>
    </main>
  );
}

export default Home;
