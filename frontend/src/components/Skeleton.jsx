export default function Skeleton({
  width = "100%",
  height = "1rem",
  style = {},
}) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: "8px",
        ...style,
      }}
    />
  );
}