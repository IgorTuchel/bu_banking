import { useNavigate } from "react-router-dom";
import "./profile.css";

import Skeleton from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const navigate = useNavigate();
  const { user, authReady, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const profileExtras = {
    accountStatus: "Active",
    securityLevel: "High",
    memberSince: "2026",
    location: "Bournemouth, UK",
    phone: "01202 555 321",
    address: "Bournemouth, UK",
  };

  const profile = user ? { ...user, ...profileExtras } : null;

  if (!authReady || !profile) {
    return (
      <main className="home-page profile-page">
        <header className="dashboard-header">
          <h1>Profile</h1>
          <p>Manage your personal details, account settings, and security.</p>
        </header>

        <section
          className="selected-account-card profile-hero-card"
          style={{ pointerEvents: "none" }}
          aria-hidden="true"
        >
          <div className="selected-account-card-top">
            <Skeleton width="120px" height="0.9rem" />
            <Skeleton width="100px" height="1.8rem" />
          </div>
          <Skeleton width="220px" height="1.8rem" />
          <Skeleton
            width="180px"
            height="0.95rem"
            style={{ marginTop: "0.75rem" }}
          />
        </section>

        <section className="summary-grid">
          {[...Array(3)].map((_, index) => (
            <article key={index} className="summary-card">
              <Skeleton width="110px" height="0.9rem" />
              <Skeleton
                width="90px"
                height="1.6rem"
                style={{ marginTop: "0.8rem" }}
              />
            </article>
          ))}
        </section>

        <section className="home-content-grid">
          <div className="transactions-section">
            <div className="section-header">
              <h2>Personal Information</h2>
            </div>
            <div className="profile-details-list">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="profile-detail-row">
                  <Skeleton width="110px" height="0.95rem" />
                  <Skeleton width="180px" height="0.95rem" />
                </div>
              ))}
            </div>
          </div>

          <aside className="notifications-section">
            <div className="section-header">
              <h2>Account Actions</h2>
            </div>
            <div className="profile-actions-list">
              {[...Array(4)].map((_, index) => (
                <Skeleton
                  key={index}
                  width="100%"
                  height="3rem"
                  style={{ borderRadius: "12px" }}
                />
              ))}
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="home-page profile-page">
      <header className="dashboard-header">
        <h1>Profile</h1>
        <p>Manage your personal details, account settings, and security.</p>
      </header>

      <section className="selected-account-card profile-hero-card">
        <div className="selected-account-card-top">
          <span className="selected-account-label">Primary Profile</span>
          <span className="selected-account-type">Verified</span>
        </div>

        <h2 className="selected-account-name">
          {profile.firstName && profile.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : profile.firstName || "Account Holder"}
        </h2>

        <p className="profile-hero-subtext">{profile.email}</p>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <h3>Account Status</h3>
          <p>{profile.accountStatus}</p>
        </article>
        <article className="summary-card">
          <h3>Security Level</h3>
          <p>{profile.securityLevel}</p>
        </article>
        <article className="summary-card">
          <h3>Member Since</h3>
          <p>{profile.memberSince}</p>
        </article>
      </section>

      <section className="home-content-grid">
        <div className="transactions-section">
          <div className="section-header">
            <h2>Personal Information</h2>
          </div>

          <div className="profile-details-list">
            {[
              ["First Name", profile.firstName],
              ["Last Name", profile.lastName],
              ["Email", profile.email],
              ["Location", profile.location],
              ["Phone", profile.phone],
              ["Address", profile.address],
            ].map(([label, value]) => (
              <div key={label} className="profile-detail-row">
                <span className="profile-detail-label">{label}</span>
                <span className="profile-detail-value">{value ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="notifications-section">
          <div className="section-header">
            <h2>Account Actions</h2>
          </div>

          <div className="profile-actions-list">
            <button
              type="button"
              className="quick-action-button profile-action-button"
            >
              Edit Profile
            </button>
            <button
              type="button"
              className="quick-action-button profile-action-button"
            >
              Change Password
            </button>
            <button
              type="button"
              className="quick-action-button profile-action-button"
            >
              Manage Security
            </button>
            <button
              type="button"
              className="quick-action-button profile-action-button"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default Profile;
