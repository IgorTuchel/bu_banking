import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

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
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scheduled-payments"
            element={
              <ProtectedRoute>
                <ScheduledPayments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rewards"
            element={
              <ProtectedRoute>
                <Rewards />
              </ProtectedRoute>
            }
          />

          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transfer"
            element={
              <ProtectedRoute>
                <TransferPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/credit-score"
            element={
              <ProtectedRoute>
                <CreditScore />
              </ProtectedRoute>
            }
          />

          <Route
            path="/request-payment"
            element={
              <ProtectedRoute>
                <RequestPaymentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cards"
            element={
              <ProtectedRoute>
                <Cards />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/statements"
            element={
              <ProtectedRoute>
                <Statements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/spending-insights"
            element={
              <ProtectedRoute>
                <SpendingInsights />
              </ProtectedRoute>
            }
          />

          <Route
            path="/register"
            element={<div style={{ padding: "2rem" }}>Register page coming soon.</div>}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {!hideMainLayout && <Footer />}
    </div>
  );
}

export default App;