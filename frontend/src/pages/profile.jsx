import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "./profile.css";

import Skeleton from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { authenticatedFetch } from "../services/authService";

const API = "http://127.0.0.1:8000/api";

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return { label: "Not entered", className: "strength-empty", score: 0 };
  }

  if (score <= 2) {
    return { label: "Weak", className: "strength-weak", score };
  }

  if (score <= 4) {
    return { label: "Medium", className: "strength-medium", score };
  }

  return { label: "Strong", className: "strength-strong", score };
}

function getPasswordChangedText(timestamp) {
  if (!timestamp) return "Password change date not available";

  const changedDate = new Date(timestamp);
  if (Number.isNaN(changedDate.getTime())) return "Password change date not available";

  const now = new Date();
  const diffMs = now - changedDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Password changed today";
  if (diffDays === 1) return "Password changed 1 day ago";

  return `Password changed ${diffDays} days ago`;
}

function Profile() {
  const navigate = useNavigate();
  const { user, authReady, logout, reloadUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [editForm, setEditForm] = useState({
    email: "",
    phoneHome: "",
    phoneMobile: "",
    houseNumber: "",
    flatNumber: "",
    streetAddress: "",
    townCity: "",
    county: "",
    postcode: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const profile = user;

  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordForm.newPassword),
    [passwordForm.newPassword],
  );

  const passwordChangedText = useMemo(
    () => getPasswordChangedText(profile?.passwordChangedAt),
    [profile?.passwordChangedAt],
  );

  useEffect(() => {
    if (!profile) return;

    setEditForm({
      email: profile.email ?? "",
      phoneHome: profile.phoneHome ?? "",
      phoneMobile: profile.phoneMobile ?? "",
      houseNumber: profile.houseNumber ?? "",
      flatNumber: profile.flatNumber ?? "",
      streetAddress: profile.streetAddress ?? "",
      townCity: profile.townCity ?? "",
      county: profile.county ?? "",
      postcode: profile.postcode ?? "",
    });
  }, [profile]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));

    setPasswordError("");
    setPasswordSuccess("");
  }

  function togglePasswordVisibility(field) {
    setShowPasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  function startEditing() {
    setIsEditing(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function cancelEditing() {
    setIsEditing(false);
    setErrorMessage("");
    setSuccessMessage("");

    setEditForm({
      email: profile.email ?? "",
      phoneHome: profile.phoneHome ?? "",
      phoneMobile: profile.phoneMobile ?? "",
      houseNumber: profile.houseNumber ?? "",
      flatNumber: profile.flatNumber ?? "",
      streetAddress: profile.streetAddress ?? "",
      townCity: profile.townCity ?? "",
      county: profile.county ?? "",
      postcode: profile.postcode ?? "",
    });
  }

  function openPasswordModal() {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
    setPasswordError("");
    setPasswordSuccess("");
    setIsPasswordModalOpen(true);
  }

  function closePasswordModal() {
    if (isChangingPassword) return;

    setIsPasswordModalOpen(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
    setPasswordError("");
    setPasswordSuccess("");
  }

  async function saveProfile() {
    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await authenticatedFetch(`${API}/me/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.email?.[0] ||
            data.phoneHome?.[0] ||
            data.phoneMobile?.[0] ||
            data.houseNumber?.[0] ||
            data.flatNumber?.[0] ||
            data.streetAddress?.[0] ||
            data.townCity?.[0] ||
            data.county?.[0] ||
            data.postcode?.[0] ||
            "Unable to update profile.",
        );
      }

      await reloadUser();

      setIsEditing(false);
      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      setErrorMessage(error.message ?? "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitPasswordChange(event) {
    event.preventDefault();

    try {
      setIsChangingPassword(true);
      setPasswordError("");
      setPasswordSuccess("");

      const response = await authenticatedFetch(`${API}/me/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.currentPassword?.[0] ||
            data.newPassword?.[0] ||
            data.confirmPassword?.[0] ||
            data.non_field_errors?.[0] ||
            "Unable to change password.",
        );
      }

      await reloadUser();

      setPasswordSuccess("Password changed successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError(error.message ?? "Unable to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  }

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
              {[...Array(8)].map((_, index) => (
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
          <p>{profile.accountStatus || "—"}</p>
        </article>
        <article className="summary-card">
          <h3>Security Level</h3>
          <p>{profile.securityLevel || "—"}</p>
        </article>
        <article className="summary-card">
          <h3>Member Since</h3>
          <p>{profile.memberSince || "—"}</p>
        </article>
      </section>

      {errorMessage ? (
        <section className="status-card error-card">
          <h2>Profile update failed</h2>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      {successMessage ? (
        <section className="status-card success-card">
          <h2>Saved</h2>
          <p>{successMessage}</p>
        </section>
      ) : null}

      <section className="home-content-grid">
        <div className="transactions-section">
          <div className="section-header">
            <h2>Personal Information</h2>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-row">
              <span className="profile-detail-label">First Name</span>
              <span className="profile-detail-value profile-readonly-value">
                {profile.firstName || "—"}
              </span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">Last Name</span>
              <span className="profile-detail-value profile-readonly-value">
                {profile.lastName || "—"}
              </span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">Date of Birth</span>
              <span className="profile-detail-value profile-readonly-value">
                {profile.dateOfBirth || "—"}
              </span>
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">Email</span>
              {isEditing ? (
                <input
                  className="profile-edit-input"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                />
              ) : (
                <span className="profile-detail-value">
                  {profile.email || "—"}
                </span>
              )}
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">Home Phone</span>
              {isEditing ? (
                <input
                  className="profile-edit-input"
                  name="phoneHome"
                  type="tel"
                  value={editForm.phoneHome}
                  onChange={handleEditChange}
                />
              ) : (
                <span className="profile-detail-value">
                  {profile.phoneHome || "—"}
                </span>
              )}
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">Mobile Phone</span>
              {isEditing ? (
                <input
                  className="profile-edit-input"
                  name="phoneMobile"
                  type="tel"
                  value={editForm.phoneMobile}
                  onChange={handleEditChange}
                />
              ) : (
                <span className="profile-detail-value">
                  {profile.phoneMobile || "—"}
                </span>
              )}
            </div>

            <div className="profile-detail-row">
              <span className="profile-detail-label">Address</span>

              {isEditing ? (
                <div className="profile-address-edit-grid">
                  <input
                    className="profile-edit-input"
                    name="flatNumber"
                    type="text"
                    value={editForm.flatNumber}
                    onChange={handleEditChange}
                    placeholder="Flat number"
                  />

                  <input
                    className="profile-edit-input"
                    name="houseNumber"
                    type="text"
                    value={editForm.houseNumber}
                    onChange={handleEditChange}
                    placeholder="House number"
                  />

                  <input
                    className="profile-edit-input profile-edit-input-wide"
                    name="streetAddress"
                    type="text"
                    value={editForm.streetAddress}
                    onChange={handleEditChange}
                    placeholder="Street address"
                  />

                  <input
                    className="profile-edit-input"
                    name="townCity"
                    type="text"
                    value={editForm.townCity}
                    onChange={handleEditChange}
                    placeholder="Town / City"
                  />

                  <input
                    className="profile-edit-input"
                    name="county"
                    type="text"
                    value={editForm.county}
                    onChange={handleEditChange}
                    placeholder="County"
                  />

                  <input
                    className="profile-edit-input"
                    name="postcode"
                    type="text"
                    value={editForm.postcode}
                    onChange={handleEditChange}
                    placeholder="Postcode"
                  />
                </div>
              ) : (
                <span className="profile-detail-value">
                  {profile.address || "—"}
                </span>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="profile-edit-actions">
              <button
                type="button"
                className="quick-action-button profile-action-button"
                onClick={saveProfile}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="quick-action-button profile-action-button profile-danger-button"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>

        <aside className="notifications-section">
          <div className="section-header">
            <h2>Account Actions</h2>
          </div>

          <div className="profile-actions-list">
            <button
              type="button"
              className="quick-action-button profile-action-button"
              onClick={startEditing}
              disabled={isEditing}
            >
              Edit Profile
            </button>
            <button
              type="button"
              className="quick-action-button profile-action-button"
              onClick={openPasswordModal}
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

      {isPasswordModalOpen ? (
        <div className="profile-modal-backdrop" onClick={closePasswordModal}>
          <section
            className="profile-password-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="section-header">
              <div className="section-header-left">
                <h2>Change Password</h2>
                <p className="transactions-subtext">
                  Enter your current password before choosing a new one.
                </p>
                <p className="profile-password-last-changed">
                  {passwordChangedText}
                </p>
              </div>

              <button
                type="button"
                className="profile-modal-close"
                onClick={closePasswordModal}
                aria-label="Close password form"
              >
                ×
              </button>
            </div>

            {passwordError ? (
              <section className="status-card error-card">
                <h2>Password change failed</h2>
                <p>{passwordError}</p>
              </section>
            ) : null}

            {passwordSuccess ? (
              <section className="status-card success-card">
                <h2>Saved</h2>
                <p>{passwordSuccess}</p>
              </section>
            ) : null}

            <form className="profile-password-form" onSubmit={submitPasswordChange}>
              {[
                ["currentPassword", "Current password", "current-password"],
                ["newPassword", "New password", "new-password"],
                ["confirmPassword", "Confirm new password", "new-password"],
              ].map(([name, label, autoComplete]) => (
                <label key={name} className="profile-password-field">
                  <span>{label}</span>

                  <div className="profile-password-input-wrap">
                    <input
                      name={name}
                      type={showPasswords[name] ? "text" : "password"}
                      value={passwordForm[name]}
                      onChange={handlePasswordChange}
                      autoComplete={autoComplete}
                      required
                    />

                    <button
                      type="button"
                      className="profile-password-eye"
                      onClick={() => togglePasswordVisibility(name)}
                      aria-label={
                        showPasswords[name] ? `Hide ${label}` : `Show ${label}`
                      }
                    >
                      {showPasswords[name] ? (
                        <EyeOff size={18} strokeWidth={2.4} />
                      ) : (
                        <Eye size={18} strokeWidth={2.4} />
                      )}
                    </button>
                  </div>
                </label>
              ))}

              <div className="profile-password-strength">
                <div className="profile-password-strength-top">
                  <span>Password strength</span>
                  <strong>{passwordStrength.label}</strong>
                </div>

                <div className="profile-password-strength-track">
                  <div
                    className={`profile-password-strength-bar ${passwordStrength.className}`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(8, passwordStrength.score * 20),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="profile-edit-actions">
                <button
                  type="submit"
                  className="quick-action-button profile-action-button"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </button>

                <button
                  type="button"
                  className="quick-action-button profile-action-button profile-danger-button"
                  onClick={closePasswordModal}
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default Profile;