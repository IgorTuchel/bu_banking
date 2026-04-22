import { useEffect, useMemo, useState } from "react";
import "./notifications.css";

import DashboardHeader from "../components/DashboardHeader";
import Skeleton from "../components/Skeleton";
import notificationsData from "../data/notificationsData";
import { formatDateTime } from "../utils/dateUtils";

function Notifications() {
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // simulate loading (replace later with API)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notificationsData;

    return notificationsData.filter(
      (notification) =>
        notification.type?.toLowerCase() === filter
    );
  }, [filter]);

  // 🔥 SKELETON LOADING
  if (isLoading) {
    return (
      <main className="notifications-page">
        <header className="dashboard-header">
          <h1>Notifications</h1>
          <p>Stay updated with account activity, alerts, and reminders.</p>
        </header>

        <section className="notifications-main-section">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="notifications-page-card">
              <Skeleton width="80px" height="1.6rem" />
              <Skeleton
                width="180px"
                height="0.9rem"
                style={{ marginTop: "0.75rem" }}
              />
              <Skeleton
                width="60%"
                height="1rem"
                style={{ marginTop: "0.9rem" }}
              />
              <Skeleton
                width="100%"
                height="0.9rem"
                style={{ marginTop: "0.6rem" }}
              />
              <Skeleton
                width="75%"
                height="0.9rem"
                style={{ marginTop: "0.4rem" }}
              />
            </div>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="notifications-page">

      <section className="notifications-page-header">
        <div className="notifications-page-heading">
          <h2>All notifications</h2>
          <p>Review recent alerts, reminders, and account updates.</p>
        </div>

        <div className="notifications-toolbar">
          <button
            className={`notifications-filter-button ${
              filter === "all" ? "active" : ""
            }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={`notifications-filter-button ${
              filter === "alert" ? "active" : ""
            }`}
            onClick={() => setFilter("alert")}
          >
            Alerts
          </button>

          <button
            className={`notifications-filter-button ${
              filter === "update" ? "active" : ""
            }`}
            onClick={() => setFilter("update")}
          >
            Updates
          </button>
        </div>
      </section>

      {filteredNotifications.length === 0 ? (
        <section className="status-card empty-card">
          <h2>No notifications</h2>
          <p>There are no notifications to display.</p>
        </section>
      ) : (
        <section className="notifications-main-section">
          {filteredNotifications.map((notification) => (
            <article
              key={notification.id}
              className={`notifications-page-card ${notification.type} ${
                notification.isRead ? "is-read" : "is-unread"
              }`}
            >
              <div className="notifications-page-card-top">
                <span className="notifications-page-badge">
                  {notification.type}
                </span>

                <span className="notifications-page-date">
                  {formatDateTime(notification.date)}
                </span>
              </div>

              <div className="notifications-page-card-body">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
              </div>

              <div className="notifications-page-card-footer">
                <span>{notification.accountName}</span>
                <span>{notification.reference}</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Notifications;