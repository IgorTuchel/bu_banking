import "./button.css";

export default function Button({
  children,
  onClick,
  variant = "pill",
  active = false,
  icon = null,
  iconPosition = "left",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`btn btn-${variant} ${
        active ? "btn-active" : ""
      } ${loading ? "btn-loading" : ""} ${className}`.trim()}
      {...props}
    >
      {loading && <span className="btn-spinner" />}

      {!loading && icon && iconPosition === "left" && (
        <span className="btn-icon">{icon}</span>
      )}

      {!loading && <span className="btn-label">{children}</span>}

      {!loading && icon && iconPosition === "right" && (
        <span className="btn-icon">{icon}</span>
      )}
    </button>
  );
}