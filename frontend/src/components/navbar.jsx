import "./navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navLeft">
        <button className="menuButton" aria-label="Open menu">
          ☰
        </button>
        <div className="navLinks">
          <a href="#">Home</a>
          <a href="#">Transactions</a>
          <a href="#">Spending Insights</a>
          <a href="#">Credit Score</a>
        </div>
      </div>

      <div className="navIcons">
        <span role="img" aria-label="notifications">🔔</span>
        <span role="img" aria-label="profile">👤</span>
      </div>
    </nav>
  );
}