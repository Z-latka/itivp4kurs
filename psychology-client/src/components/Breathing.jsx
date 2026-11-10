import { useEffect, useReducer } from "react";
import { Pause, Play } from "lucide-react";

// Дыхание 4–4–6: вдох, пауза, медленный выдох. Длинный выдох успокаивает
const PHASES = [
  { label: "Вдох", seconds: 4, scale: 1 },
  { label: "Задержка", seconds: 4, scale: 1 },
  { label: "Выдох", seconds: 6, scale: 0.55 },
];

const INITIAL = { running: false, phase: 0, left: PHASES[0].seconds, cycles: 0 };

const reducer = (state, action) => {
  switch (action) {
    case "start":
      return { ...INITIAL, running: true };
    case "stop":
      return { ...state, running: false };
    case "tick": {
      if (state.left > 1) return { ...state, left: state.left - 1 };
      const phase = (state.phase + 1) % PHASES.length;
      return {
        ...state,
        phase,
        left: PHASES[phase].seconds,
        cycles: phase === 0 ? state.cycles + 1 : state.cycles,
      };
    }
    default:
      return state;
  }
};

export default function Breathing({ small = false }) {
  const [{ running, phase, left, cycles }, dispatch] = useReducer(reducer, INITIAL);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => dispatch("tick"), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const current = PHASES[phase];

  return (
    <div className={`breathing${small ? " breath-small" : ""}`}>
      <div className="breath-stage">
        <div
          className="breath-circle"
          style={{
            transform: `scale(${running ? current.scale : 0.55})`,
            transitionDuration: `${running ? current.seconds : 0.6}s`,
          }}
        />
        <div className="breath-label" aria-live="polite">
          {running ? (
            <span>
              {current.label}
              <small>{left}</small>
            </span>
          ) : (
            <span>
              Готовы?
              <small>4 · 4 · 6</small>
            </span>
          )}
        </div>
      </div>
      <div className="row" style={{ justifyContent: "center" }}>
        {running ? (
          <button className="btn btn-outline btn-sm" onClick={() => dispatch("stop")}>
            <Pause size={16} /> Остановить
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => dispatch("start")}>
            <Play size={16} /> Начать дыхание
          </button>
        )}
        {cycles > 0 && <span className="muted small">Циклов: {cycles}</span>}
      </div>
    </div>
  );
}
