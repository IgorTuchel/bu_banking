import "./home.css";

import DashboardHeader from "../components/DashboardHeader";
import SummaryCard from "../components/SummaryCard";
import QuickActions from "../components/QuickActions";
import TransactionsList from "../components/TransactionsList";
import NotificationsPanel from "../components/NotificationsPanel";

import {
  userData,
  accountSummary,
  quickActions,
  recentTransactions,
  notifications,
} from "../data/dashboardData";

function Home() {
  return (
    <main className="home-page">
      <DashboardHeader firstName={userData.firstName} />

      <section className="summary-grid">
        {accountSummary.map((item) => (
          <SummaryCard key={item.id} title={item.title} value={item.value} />
        ))}
      </section>

      <QuickActions actions={quickActions} />

      <section className="home-content-grid">
        <TransactionsList transactions={recentTransactions} />
        <NotificationsPanel notifications={notifications} />
      </section>
    </main>
  );
}

export default Home;