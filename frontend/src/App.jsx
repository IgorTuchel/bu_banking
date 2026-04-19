import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/navbar";
import Footer from "./components/Footer";
import Home from "./pages/home";
import Transactions from "./pages/transactions";
import Rewards from "./pages/rewards";
import Support from "./pages/support";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

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

    /* update on resize (important for responsive) */
    window.addEventListener("resize", setScrollbarWidth);

    return () => {
      window.removeEventListener("resize", setScrollbarWidth);
    };
  }, []);

  return (
    <div className="app-layout">
      {!isLoginPage && <Navbar />}

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/support" element={<Support />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>

      {!isLoginPage && <Footer />}
    </div>
  );
}

export default App;