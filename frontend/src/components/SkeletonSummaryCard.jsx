import Skeleton from "./Skeleton";

export default function SkeletonSummaryCard() {
  return (
    <article className="summary-card">
      <Skeleton width="58%" height="0.95rem" />
      <Skeleton width="74%" height="1.9rem" style={{ marginTop: "0.65rem" }} />
      <Skeleton width="42%" height="0.8rem" style={{ marginTop: "0.55rem" }} />
    </article>
  );
}