import { Star } from "lucide-react";
import { MOODS, initials } from "../labels";

export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="row">{children}</div>}
    </div>
  );
}

export function Loader({ text }) {
  return (
    <div className="loading-state" role="status">
      <div className="spinner"></div>
      {text && <p>{text}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-icon">
          <Icon size={28} />
        </div>
      )}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function Stars({ value, size = 14 }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" aria-label={`Оценка ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= rounded ? "currentColor" : "none"}
          className={n <= rounded ? "" : "off"}
        />
      ))}
    </span>
  );
}

export function Avatar({ name, large = false }) {
  return <span className={`avatar${large ? " lg" : ""}`}>{initials(name)}</span>;
}

export function Badge({ color, children }) {
  return (
    <span
      className="status-badge"
      style={{ background: `${color}1f`, color }}
    >
      {children}
    </span>
  );
}

export function MoodPicker({ value, onChange, size = 28 }) {
  return (
    <div className="mood-picker" role="radiogroup" aria-label="Настроение">
      {MOODS.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={value === m.value}
            className={`mood-option${value === m.value ? " selected" : ""}`}
            style={{ "--mood-color": m.color }}
            onClick={() => onChange(m.value)}
          >
            <Icon size={size} strokeWidth={1.75} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

export function Sparkline({ values, max, width = 120, height = 36, color = "var(--accent)" }) {
  if (values.length < 2) return null;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - 4 - (v / max) * (height - 8)).toFixed(1)}`)
    .join(" ");
  const last = points.split(" ").at(-1).split(",");
  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}
