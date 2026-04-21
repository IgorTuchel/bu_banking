import { useNavigate } from "react-router-dom";

function QuickActions({ actions }) {
  const navigate = useNavigate();

  return (
    <section className="quick-actions-section">
      <h2>Quick Actions</h2>

      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className="quick-action-button"
            onClick={() => navigate(action.path)}
          >
            <span className="quick-action-icon">{action.icon}</span>

            {/* 🔥 NEW TEXT BLOCK */}
            <div className="quick-action-text">
              <span className="quick-action-label">
                {action.label}
              </span>

              {/* only render if exists (safe fallback) */}
              {action.description && (
                <span className="quick-action-description">
                  {action.description}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActions;