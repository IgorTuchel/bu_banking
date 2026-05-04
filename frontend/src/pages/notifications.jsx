import { useEffect, useMemo, useState } from "react";
import "./notifications.css";

import Skeleton from "../components/Skeleton";
import { getDashboardData } from "../services/dashboardService";

function Notifications() {
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        setIsLoading(true);
        const data = await getDashboardData();
        setNotifications(data.notifications ?? []);
      } catch (error) {
        console.error("Unable to load notifications:", error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;

    return notifications.filter(
      (notification) => notification.type?.toLowerCase() === filter
    );
  }, [filter, notifications]);

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
              <Skeleton width="180px" height="0.9rem" style={{ marginTop: "0.75rem" }} />
              <Skeleton width="60%" height="1rem" style={{ marginTop: "0.9rem" }} />
              <Skeleton width="100%" height="0.9rem" style={{ marginTop: "0.6rem" }} />
              <Skeleton width="75%" height="0.9rem" style={{ marginTop: "0.4rem" }} />
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
          <p>Review recent card payments and account updates.</p>
        </div>

        <div className="notifications-toolbar">
          <button
            className={`notifications-filter-button ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={`notifications-filter-button ${filter === "success" ? "active" : ""}`}
            onClick={() => setFilter("success")}
          >
            Completed
          </button>

          <button
            className={`notifications-filter-button ${filter === "warning" ? "active" : ""}`}
            onClick={() => setFilter("warning")}
          >
            Declined
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
              className={`notifications-page-card ${notification.type}`}
            >
              <div className="notifications-page-card-top">
                <span className="notifications-page-badge">
                  {notification.type === "warning" ? "Declined" : "Completed"}
                </span>

                <span className="notifications-page-date">
                  {notification.displayDate}
                </span>
              </div>

              <div className="notifications-page-card-body">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <p>{notification.detail}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Notifications;