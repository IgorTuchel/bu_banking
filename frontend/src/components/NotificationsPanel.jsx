import { useNavigate } from "react-router-dom";

function NotificationsPanel({ notifications = [] }) {
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
        {notifications.length === 0 ? (
          <div className={`notification-card ${notification.type}`}>
            <p className="notification-title">No notifications yet</p>
            <p className="notification-detail">
              Recent account activity will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card notification-${notification.type}`}
              onClick={() => navigate("/notifications")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate("/notifications");
              }}
            >
              <div className="notification-top-row">
                <p className="notification-title">{notification.title}</p>
                {notification.displayDate && (
                  <span className="notification-date">
                    {notification.displayDate}
                  </span>
                )}
              </div>

              <p className="notification-message">{notification.message}</p>
              <p className="notification-detail">{notification.detail}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default NotificationsPanel;