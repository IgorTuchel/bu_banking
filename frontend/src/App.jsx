import { Routes, Route, useLocation } from "react-router-dom";
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