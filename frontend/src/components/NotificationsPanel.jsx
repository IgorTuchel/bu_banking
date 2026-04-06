function NotificationsPanel({ notifications }) {
  return (
    <section className="notifications-section">
      <h2>Notifications</h2>
      <div className="notifications-list">
        {notifications.map((notification) => (
          <div key={notification.id} className="notification-card">
            <p>{notification.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default NotificationsPanel;