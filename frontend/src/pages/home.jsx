import { useMemo, useState } from "react";
import "./home.css";

import DashboardHeader from "../components/DashboardHeader";
import SummaryCard from "../components/SummaryCard";
import QuickActions from "../components/QuickActions";
import TransactionsList from "../components/TransactionsList";
import NotificationsPanel from "../components/NotificationsPanel";
import AccountSelector from "../components/AccountSelector";

import {
  userData,
  accounts,
  quickActions,
  notifications,
} from "../data/dashboardData";

function Home() {
  const [selectedAccountKey, setSelectedAccountKey] = useState(accounts[0].key);

  const selectedAccount = useMemo(() => {
    return accounts.find((account) => account.key === selectedAccountKey);
  }, [selectedAccountKey]);

  return (
    <main className="home-page">
      <DashboardHeader firstName={userData.firstName} />

      <AccountSelector
        accounts={accounts}
        selectedAccountKey={selectedAccountKey}
        onChange={setSelectedAccountKey}
      />

      <section className="summary-grid">
        {selectedAccount.summary.map((item) => (
          <SummaryCard key={item.id} title={item.title} value={item.value} />
        ))}
      </section>

      <QuickActions actions={quickActions} />

      <section className="home-content-grid">
        <TransactionsList transactions={selectedAccount.transactions} />
        <NotificationsPanel notifications={notifications} />
      </section>
    </main>
  );
}

export default Home;