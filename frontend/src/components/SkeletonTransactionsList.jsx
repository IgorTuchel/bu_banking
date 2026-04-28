import Skeleton from "./Skeleton";

export default function SkeletonTransactionRow() {
  return (
    <div className="transaction-row transaction-row-detailed">
      <div className="transaction-main">
        <Skeleton width="140px" height="1rem" />
        <Skeleton width="180px" height="0.8rem" style={{ marginTop: "0.3rem" }} />
      </div>

      <div className="transaction-meta">
        <Skeleton width="90px" height="1.2rem" />
        <div className="transaction-amount-wrapper">
          <Skeleton width="80px" height="1rem" />
          <Skeleton width="60px" height="0.7rem" style={{ marginTop: "0.3rem" }} />
        </div>
      </div>
    </div>
  );
}