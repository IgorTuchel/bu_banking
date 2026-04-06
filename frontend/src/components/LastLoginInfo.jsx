function LastLoginInfo({ date, time, location }) {
  return (
    <div className="last-login-info">
      <span className="last-login-label">Last login:</span>
      <span className="last-login-value">
        {date} at {time} · {location}
      </span>
    </div>
  );
}

export default LastLoginInfo;