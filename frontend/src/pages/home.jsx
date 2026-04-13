import { useEffect, useMemo, useState } from "react";
import "./home.css";

import DashboardHeader from "../components/DashboardHeader";
import SummaryCard from "../components/SummaryCard";
import QuickActions from "../components/QuickActions";
import TransactionsList from "../components/TransactionsList";
import NotificationsPanel from "../components/NotificationsPanel";
import AccountDropdown from "../components/AccountDropdown";
import SelectedAccountCard from "../components/SelectedAccountCard";

import Skeleton from "../components/Skeleton";
import SkeletonSummaryCard from "../components/SkeletonSummaryCard";
import SkeletonTransactionsList from "../components/SkeletonTransactionsList";

import { getDashboardData } from "../services/dashboardService";
import { DEFAULT_ACCOUNT_INDEX } from "../constants/dashboard";
import { getSelectedAccount } from "../utils/dashboardUtils";

import { useAccount } from "../context/AccountContext";

function Home() {
  const [dashboardData, setDashboardData] = useState(null);
  const { selectedAccountKey, setSelectedAccountKey } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // 🔥 Load dashboard data (async + backend-ready)
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getDashboardData();
        setDashboardData(data);

        if (!selectedAccountKey && data.accounts.length > 0) {
          setSelectedAccountKey(
          data.accounts[DEFAULT_ACCOUNT_INDEX]?.key ??
          data.accounts[0].key
          );
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

  // 🔥 Selected account (safe + reactive)
  const selectedAccount = useMemo(() => {
    if (!dashboardData || !dashboardData.accounts) return null;

    return getSelectedAccount(
      dashboardData.accounts,
      selectedAccountKey,
      DEFAULT_ACCOUNT_INDEX
    );
  }, [dashboardData, selectedAccountKey]);

  // 🔥 Dynamic dropdown options (shared with Transactions page)
  const accountOptions = useMemo(() => {
    if (!dashboardData || !dashboardData.accounts) return [];

    return dashboardData.accounts.map((account) => ({
      value: account.key,
      label: `${account.name} • ${account.type}`,
    }));
  }, [dashboardData]);

  if (isLoading) {
    return (
      <main className="home-page">
        <Skeleton width="200px" height="2rem" />

        <section className="summary-grid">
          {[...Array(3)].map((_, i) => (
            <SkeletonSummaryCard key={i} />
          ))}
        </section>

        <section className="home-content-grid">
          <SkeletonTransactionsList />
        </section>
      </main>
    );
  }

  // 🔥 Error state
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

  // 🔥 Empty state
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
        firstName={dashboardData.user.firstName}
        lastLogin={dashboardData.user.lastLogin}
      />

      {/* 🔥 Shared account dropdown (same system as Transactions page) */}
      <AccountDropdown
        label="Select account"
        value={selectedAccountKey}
        onChange={setSelectedAccountKey}
        options={accountOptions}
      />

      <SelectedAccountCard account={selectedAccount} />

      <section className="summary-grid">
        {selectedAccount.summary?.map((item) => (
          <SummaryCard
            key={item.id}
            title={item.title}
            value={item.value}
          />
        ))}
      </section>

      <QuickActions actions={dashboardData.quickActions} />

      <section className="home-content-grid">
        <TransactionsList transactions={selectedAccount.transactions ?? []} />
        <NotificationsPanel
          notifications={dashboardData.notifications ?? []}
        />
      </section>
    </main>
  );
}

export default Home;