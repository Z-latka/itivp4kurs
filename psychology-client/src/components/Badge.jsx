export default function Badge({ color, children }) {
  return (
    <span
      className="status-badge"
      style={{
        background: `${color}15`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {children}
    </span>
  );
}
