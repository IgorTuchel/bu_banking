import Skeleton from "./Skeleton";

export default function SkeletonSummaryCard() {
  return (
    <div className="summary-card">
      <Skeleton width="60%" height="1rem" />
      <Skeleton width="80%" height="1.8rem" style={{ marginTop: "0.6rem" }} />
      <Skeleton width="40%" height="0.8rem" style={{ marginTop: "0.5rem" }} />
    </div>
  );
}