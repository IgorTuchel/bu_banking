function formatLastLogin(timestamp) {
  if (!timestamp) {
    return {
      formattedDate: "Not available",
      formattedTime: "",
    };
  }

  const normalized = String(timestamp).replace(
    /(\.\d{3})\d+(Z|[+-]\d{2}:\d{2})$/,
    "$1$2",
  );

  const loginDate = new Date(normalized);

  if (Number.isNaN(loginDate.getTime())) {
    return {
      formattedDate: "Not available",
      formattedTime: "",
    };
  }

  const formattedDate = loginDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = loginDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    formattedDate,
    formattedTime,
  };
}

function LastLoginInfo({ timestamp, location }) {
  const { formattedDate, formattedTime } = formatLastLogin(timestamp);

  const hasTime = Boolean(formattedTime);
  const hasLocation = Boolean(location);

  return (
    <div className="last-login-info">
      <span className="last-login-label">Last login:</span>
      <span className="last-login-value">
        {formattedDate}
        {hasTime ? ` at ${formattedTime}` : ""}
        {hasLocation ? ` from ${location}` : ""}
      </span>
    </div>
  );
}

export default LastLoginInfo;