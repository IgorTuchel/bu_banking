import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Transactions from "./pages/transactions";
import SpendingInsights from "./pages/spendingInsights";
import CreditScore from "./pages/creditScore";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/spendingInsights" element={<SpendingInsights />} />
        <Route path="/creditScore" element={<CreditScore />} />
      </Routes>
    </>
  );
}

export default App;