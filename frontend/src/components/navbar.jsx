import "./navbar.css";
import logo from "../assets/logo.png";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navLeft">
        <button className="menuButton" aria-label="Open menu">
          ☰
        </button>

        <div className="navBrand">
          <div className="navLogoWrapper">
            <img src={logo} alt="Aurix logo" className="navLogo" />
          </div>

          <div className="navBrandTextGroup">
            <div className="navBrandText">Aurix</div>
            <div className="navBrandTagline">Private Banking</div>
          </div>
        </div>

        <div className="navLinks">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          <NavLink to="/rewards">Rewards</NavLink>
          <NavLink to="/support">Help &amp; Support</NavLink>
        </div>
      </div>

      <div className="navIcons">
        <span role="img" aria-label="notifications">🔔</span>
        <span role="img" aria-label="profile">👤</span>
      </div>
    </nav>
  );
}