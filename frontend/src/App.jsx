import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Transactions from "./pages/transactions";

// Temporary placeholder pages
function SpendingInsights() {
  return <div style={{ padding: "2rem" }}>Spending Insights Page</div>;
}

function CreditScore() {
  return <div style={{ padding: "2rem" }}>Credit Score Page</div>;
}

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/spending-insights" element={<SpendingInsights />} />
        <Route path="/credit-score" element={<CreditScore />} />
      </Routes>
    </>
  );
}

export default App;