import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/navbar";
import Footer from "./components/Footer";
import Landing from "./pages/landing";
import Home from "./pages/home";
import Transactions from "./pages/transactions";
import ScheduledPayments from "./pages/scheduledPayments";
import Rewards from "./pages/rewards";
import Support from "./pages/support";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import TransferPage from "./pages/transfer";
import RequestPaymentPage from "./pages/requestPayment";
import Cards from "./pages/cards";
import Notifications from "./pages/Notifications";
import Statements from "./pages/statements";
import NotFound from "./pages/NotFound";
import SpendingInsights from "./pages/spendingInsights";
import CreditScore from "./pages/creditScore";

function App() {
  const location = useLocation();

  const hideMainLayout =
    location.pathname === "/" || location.pathname === "/login";

  /* ✅ SET SCROLLBAR WIDTH AS CSS VARIABLE */
  useEffect(() => {
    function setScrollbarWidth() {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.documentElement.style.setProperty(
        "--scrollbar-width",
        `${scrollBarWidth}px`
      );
    }

    setScrollbarWidth();
    window.addEventListener("resize", setScrollbarWidth);

    return () => {
      window.removeEventListener("resize", setScrollbarWidth);
    };
  }, []);

  return (
    <div className="app-layout">
      {!hideMainLayout && <Navbar />}

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/scheduled-payments" element={<ScheduledPayments />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/support" element={<Support />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/credit-score" element={<CreditScore />} />
          <Route path="/request-payment" element={<RequestPaymentPage />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/statements" element={<Statements />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/spending-insights" element={<SpendingInsights />} />
          <Route path="/credit-score" element={<CreditScore />} />
          <Route
            path="/register"
            element={<div style={{ padding: "2rem" }}>Register page coming soon.</div>}
          />
        </Routes>
      </div>

      {!hideMainLayout && <Footer />}
    </div>
  );
}

export default App;