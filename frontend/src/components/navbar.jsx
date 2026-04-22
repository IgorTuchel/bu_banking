import "./navbar.css";
import logo from "../assets/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import MenuSlideshow from "./MenuSlideshow";
import { Mail, UserRoundCog } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  function toggleMenu() {
    setIsMenuOpen((prev) => !prev);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  useEffect(() => {
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.setProperty(
      "--scrollbar-width",
      `${scrollBarWidth}px`
    );

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className={`navbarFrame ${isMenuOpen ? "menu-open" : ""}`}>
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
                <div className="navStripInner">
                  <button
                    className="navStripMenuButton navGridMenuButton"
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                    onClick={toggleMenu}
                    type="button"
                  >
                    <span className="navGridIcon" aria-hidden="true">
                      {[...Array(9)].map((_, index) => (
                        <span key={index} className="navGridDot" />
                      ))}
                    </span>
                  </button>

                  <div className="navLinksRow">
                    <NavLink to="/dashboard" onClick={closeMenu}>
                      Dashboard
                    </NavLink>
                    <NavLink to="/transactions" onClick={closeMenu}>
                      Transactions
                    </NavLink>
                    <NavLink to="/rewards" onClick={closeMenu}>
                      Rewards
                    </NavLink>
                    <NavLink to="/support" onClick={closeMenu}>
                      Help &amp; Support
                    </NavLink>
                  </div>

                  <div className="navStripIcons">
                    <button
                      className="navStripIconButton"
                      aria-label="Notifications"
                      type="button"
                      onClick={() => navigate("/notifications")}
                    >
                      <Mail strokeWidth={2.7} />
                    </button>

                    <button
                      className="navStripIconButton"
                      aria-label="Profile"
                      type="button"
                      onClick={() => navigate("/profile")}
                    >
                      <UserRoundCog strokeWidth={2.7} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div
        className={`navFullscreenMenu ${isMenuOpen ? "open" : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="navFullscreenLayout">
          <div className="navMenuColumn">
            <div className="navMenuSection">
              <p className="navMenuHeading">Accounts</p>
              <NavLink to="/" onClick={closeMenu}>
                Overview
              </NavLink>
              <NavLink to="/transactions" onClick={closeMenu}>
                Transactions
              </NavLink>
              <NavLink to="/statements" onClick={closeMenu}>
                Statements
              </NavLink>
              <NavLink to="/spending-insights" onClick={closeMenu}>
                Spending Insights
              </NavLink>
              <NavLink to="/credit-score" onClick={closeMenu}>
                Credit Score
              </NavLink>
            </div>
          </div>

          <div className="navMenuColumn">
            <div className="navMenuSection">
              <p className="navMenuHeading">Cards &amp; Rewards</p>
              <NavLink to="/rewards" onClick={closeMenu}>
                Rewards
              </NavLink>
              <NavLink to="/card-controls" onClick={closeMenu}>
                Card Controls
              </NavLink>
              <NavLink to="/offers" onClick={closeMenu}>
                Offers
              </NavLink>
            </div>
          </div>

          <div className="navMenuColumn">
            <div className="navMenuSection">
              <p className="navMenuHeading">Profile</p>
              <NavLink to="/profile" onClick={closeMenu}>
                Profile
              </NavLink>
              <NavLink to="/settings" onClick={closeMenu}>
                Settings
              </NavLink>
              <NavLink to="/security" onClick={closeMenu}>
                Security
              </NavLink>
            </div>

            <div className="navMenuSection">
              <p className="navMenuHeading">Support</p>
              <NavLink to="/support" onClick={closeMenu}>
                Help &amp; Support
              </NavLink>
              <NavLink to="/login" onClick={closeMenu}>
                Sign Out
              </NavLink>
            </div>
          </div>

          <div className="navMenuStaticCard">
            <div className="navMenuStaticCardPanel">
              <div className="navMenuStaticLogo">
                <img src={logo} alt="Aurix logo large" />
              </div>

              <div className="navMenuStaticContent">
                <p className="navMenuBrand">
                  <span className="navMenuBrandPrimary">Aurix</span>
                  <span className="navMenuBrandSecondary">
                    Private Banking
                  </span>
                </p>

                <h2 className="navMenuTitle">
                  Designed for clarity, control, and confidence.
                </h2>

                <p className="navMenuDescription">
                  A refined digital banking experience with elegant tools for
                  spending, rewards, insights, and account management.
                </p>
              </div>
            </div>
          </div>

          <MenuSlideshow />
        </div>
      </div>
    </>
  );
}