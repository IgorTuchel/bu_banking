import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/Footer";
import Home from "./pages/home";
import Transactions from "./pages/transactions";
import Rewards from "./pages/rewards";
import Support from "./pages/support";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/support" element={<Support />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;