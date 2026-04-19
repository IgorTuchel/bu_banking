import "./navbar.css";
import logo from "../assets/logo.png";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbarFrame">
      <nav className="navbarLayout">
        <div className="navbarBrandBlock">
          <div className="navBrand">
            <div className="navLogoWrapper">
              <img src={logo} alt="Aurix logo" className="navLogo" />
            </div>

            <div className="navBrandTextGroup">
              <div className="navBrandText">Aurix</div>
              <div className="navBrandTagline">Private Banking</div>
            </div>
          </div>
        </div>

        <div className="navbarCenterZone">
          <div className="navCapsuleGroup">
            <div className="navStrip">
              <button className="navStripMenuButton" aria-label="Open menu">
                ☰
              </button>

              <div className="navLinksRow">
                <NavLink to="/">Home</NavLink>
                <NavLink to="/transactions">Transactions</NavLink>
                <NavLink to="/rewards">Rewards</NavLink>
                <NavLink to="/support">Help &amp; Support</NavLink>
              </div>

              <div className="navStripIcons">
                <button className="navStripIconButton" aria-label="Notifications">
                  🔔
                </button>
                <button className="navStripIconButton" aria-label="Profile">
                  👤
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}