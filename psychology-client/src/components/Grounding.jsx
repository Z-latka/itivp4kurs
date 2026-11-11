import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

const STEPS = [
  { count: 5, sense: "вещей, которые вы видите", hint: "Назовите их про себя: лампа, окно, кружка…" },
  { count: 4, sense: "вещи, которые можно потрогать", hint: "Ткань одежды, поверхность стола, собственные ладони." },
  { count: 3, sense: "звука, которые вы слышите", hint: "Шум за окном, гул техники, собственное дыхание." },
  { count: 2, sense: "запаха, которые вы чувствуете", hint: "Если запахов нет — вспомните два любимых." },
  { count: 1, sense: "вкус", hint: "Глоток воды, чай или просто вкус во рту." },
];

export default function Grounding() {
  const [step, setStep] = useState(0);
  const done = step === STEPS.length;
  const current = STEPS[step];

  return (
    <div>
      {done ? (
        <div>
          <h3>Хорошо получилось</h3>
          <p className="muted">
            Сделайте медленный вдох и выдох. Отметьте, изменилось ли что-то в
            теле. Упражнение можно повторять сколько угодно раз.
          </p>
          <button className="btn btn-outline btn-sm" onClick={() => setStep(0)}>
            <RotateCcw size={16} /> Ещё раз
          </button>
        </div>
      ) : (
        <>
          <div className="grounding-step">
            <div className="grounding-count">{current.count}</div>
            <div>
              <h3 className="mb-0">
                Найдите {current.count} {current.sense}
              </h3>
              <p className="muted small mb-0">{current.hint}</p>
            </div>
          </div>
          <div className="row-between mt">
            <div className="dots" aria-hidden="true" style={{ marginTop: 0 }}>
              {STEPS.map((s, i) => (
                <span key={s.count} className={i <= step ? "on" : ""} />
              ))}
            </div>
            <div className="row">
              <button
                className="btn btn-ghost btn-sm"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
                aria-label="Назад"
              >
                <ArrowLeft size={16} />
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setStep(step + 1)}>
                Готово <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
