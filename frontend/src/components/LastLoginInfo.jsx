function formatLastLogin(timestamp) {
  if (!timestamp) {
    return {
      formattedDate: "Unknown date",
      formattedTime: "Unknown time",
    };
  }

  const normalized = timestamp.replace(
    /(\.\d{3})\d+(Z|[+-]\d{2}:\d{2})$/,
    "$1$2",
  );
  const loginDate = new Date(normalized);

  if (Number.isNaN(loginDate.getTime())) {
    return {
      formattedDate: "Invalid date",
      formattedTime: "Invalid time",
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
    second: "2-digit",
  });

  return {
    formattedDate,
    formattedTime,
  };
}

function LastLoginInfo({ timestamp, location }) {
  const { formattedDate, formattedTime } = formatLastLogin(timestamp);
  console.log(timestamp);
  console.log(timestamp, location, formattedDate, formattedTime);
  return (
    <div className="last-login-info">
      <span className="last-login-label">Last login:</span>
      <span className="last-login-value">
        {formattedDate} at {formattedTime}
        {location ? ` from ${location}` : ""}
      </span>
    </div>
  );
}

export default LastLoginInfo;
