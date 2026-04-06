import { useEffect, useMemo, useState } from "react";
import "./home.css";

import DashboardHeader from "../components/DashboardHeader";
import SummaryCard from "../components/SummaryCard";
import QuickActions from "../components/QuickActions";
import TransactionsList from "../components/TransactionsList";
import NotificationsPanel from "../components/NotificationsPanel";
import AccountSelector from "../components/AccountSelector";

import { getDashboardData } from "../services/dashboardService";

function Home() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedAccountKey, setSelectedAccountKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getDashboardData();
        setDashboardData(data);

        if (data.accounts.length > 0) {
          setSelectedAccountKey(data.accounts[0].key);
        }
      } catch (error) {
        setErrorMessage("Unable to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const selectedAccount = useMemo(() => {
    if (!dashboardData) {
      return null;
    }

    return (
      dashboardData.accounts.find(
        (account) => account.key === selectedAccountKey
      ) || dashboardData.accounts[0]
    );
  }, [dashboardData, selectedAccountKey]);

  if (isLoading) {
    return <main className="home-page">Loading dashboard...</main>;
  }

  if (errorMessage) {
    return <main className="home-page">{errorMessage}</main>;
  }

  if (!dashboardData || !selectedAccount) {
    return <main className="home-page">No dashboard data available.</main>;
  }

  return (
    <main className="home-page">
      <DashboardHeader
        firstName={dashboardData.user.firstName}
        lastLogin={dashboardData.user.lastLogin}
      />

      <AccountSelector
        accounts={dashboardData.accounts}
        selectedAccountKey={selectedAccountKey}
        onChange={setSelectedAccountKey}
      />

      <section className="summary-grid">
        {selectedAccount.summary.map((item) => (
          <SummaryCard key={item.id} title={item.title} value={item.value} />
        ))}
      </section>

      <QuickActions actions={dashboardData.quickActions} />

      <section className="home-content-grid">
        <TransactionsList transactions={selectedAccount.transactions} />
        <NotificationsPanel notifications={dashboardData.notifications} />
      </section>
    </main>
  );
}

export default Home;