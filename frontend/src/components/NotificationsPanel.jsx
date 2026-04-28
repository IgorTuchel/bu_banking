import { useNavigate } from "react-router-dom";

function NotificationsPanel({ notifications }) {
  const navigate = useNavigate();

  return (
    <section className="notifications-section">
      <div className="section-header">
        <h2>Notifications</h2>

        <button
          className="section-link-button"
          onClick={() => navigate("/notifications")}
        >
          View all
        </button>
      </div>

      <div className="notifications-list">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="notification-card"
            onClick={() => navigate("/notifications")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate("/notifications");
              }
            }}
          >
            <p className="notification-message">
              {notification.message}
            </p>

            {notification.displayDate && (
              <span className="notification-date">
                {notification.displayDate}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default NotificationsPanel;