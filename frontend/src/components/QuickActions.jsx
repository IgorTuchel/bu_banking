function QuickActions({ actions }) {
  return (
    <section className="quick-actions-section">
      <h2>Quick Actions</h2>

      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button key={action.id} className="quick-action-button">
            <span className="quick-action-icon" aria-hidden="true">
              {action.icon}
            </span>
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActions;