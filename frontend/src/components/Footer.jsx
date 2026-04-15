import { NavLink } from "react-router-dom";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="siteFooter" aria-label="Sitemap footer">
      <div className="siteFooterInner">
        <h2 className="siteFooterTitle">Sitemap</h2>
        <nav className="siteFooterNav" aria-label="Footer sitemap links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          <NavLink to="/rewards">Rewards</NavLink>
          <NavLink to="/support">Help &amp; Support</NavLink>
        </nav>
      </div>
    </footer>
  );
}
