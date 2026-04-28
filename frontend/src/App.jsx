import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";

import Navbar from "./components/navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Landing from "./pages/landing";
import Home from "./pages/home";
import Transactions from "./pages/transactions";
import ScheduledPayments from "./pages/scheduledPayments";
import Rewards from "./pages/rewards";
import Support from "./pages/support";
import Login from "./pages/login";
import Profile from "./pages/profile";
import TransferPage from "./pages/transfer";
import RequestPaymentPage from "./pages/requestPayment";
import Cards from "./pages/cards";
import Notifications from "./pages/notifications";
import Statements from "./pages/statements";
import NotFound from "./pages/notFound";
import SpendingInsights from "./pages/spendingInsights";
import CreditScore from "./pages/creditScore";

const publicRoutes = [
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
];

const protectedRoutes = [
  { path: "/dashboard", element: <Home /> },
  { path: "/transactions", element: <Transactions /> },
  { path: "/scheduled-payments", element: <ScheduledPayments /> },
  { path: "/rewards", element: <Rewards /> },
  { path: "/support", element: <Support /> },
  { path: "/profile", element: <Profile /> },
  { path: "/transfer", element: <TransferPage /> },
  { path: "/credit-score", element: <CreditScore /> },
  { path: "/request-payment", element: <RequestPaymentPage /> },
  { path: "/cards", element: <Cards /> },
  { path: "/notifications", element: <Notifications /> },
  { path: "/statements", element: <Statements /> },
  { path: "/spending-insights", element: <SpendingInsights /> },
];

const HIDE_LAYOUT_PATHS = new Set(["/", "/login", "/register"]);

function App() {
  const { pathname } = useLocation();

  const hideMainLayout = useMemo(
    () => HIDE_LAYOUT_PATHS.has(pathname),
    [pathname],
  );

  useEffect(() => {
    const setScrollbarWidth = () => {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.documentElement.style.setProperty(
        "--scrollbar-width",
        `${scrollbarWidth}px`,
      );
    };

    setScrollbarWidth();
    window.addEventListener("resize", setScrollbarWidth);

    return () => window.removeEventListener("resize", setScrollbarWidth);
  }, []);

  return (
    <div className="app-layout">
      {!hideMainLayout && <Navbar />}

      <main className="app-content">
        <Routes>
          {publicRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {protectedRoutes.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={<ProtectedRoute>{element}</ProtectedRoute>}
            />
          ))}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!hideMainLayout && <Footer />}
    </div>
  );
}

export default App;
