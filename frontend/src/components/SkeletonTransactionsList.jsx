import Skeleton from "./Skeleton";
import SkeletonTransactionRow from "./SkeletonTransactionRow";

export default function SkeletonTransactionsList() {
  return (
    <>
      {["Today", "Yesterday", "Last Week"].map((label) => (
        <div key={label} className="transaction-group">
          <div className="transaction-group-heading">
            <Skeleton width="120px" height="1.2rem" />
            <div />
            <Skeleton width="100px" height="1rem" />
          </div>

          {[...Array(4)].map((_, i) => (
            <SkeletonTransactionRow key={i} />
          ))}
        </div>
      ))}
    </>
  );
}