import { useState } from "react";

const TESTS = [
  {
    id: "anxiety",
    title: "Тест на уровень тревожности",
    description:
      "Оцените свой уровень тревожности за последние две недели. 7 вопросов, результат сразу.",
    icon: "😰",
    color: "#1565c0",
  },
  {
    id: "depression",
    title: "Тест на депрессию",
    description:
      "Простой скрининг для оценки эмоционального состояния и признаков депрессии.",
    icon: "🌧",
    color: "#7d3c98",
  },
  {
    id: "burnout",
    title: "Тест на эмоциональное выгорание",
    description:
      "Проверьте, не испытываете ли вы профессиональное выгорание и хроническую усталость.",
    icon: "🔥",
    color: "#c62828",
  },
  {
    id: "sleep",
    title: "Тест качества сна",
    description:
      "Оцените качество вашего сна и получите рекомендации по его улучшению.",
    icon: "😴",
    color: "#2e7d32",
  },
];

export default function TestsPage() {
  const [selectedTest, setSelectedTest] = useState(null);

  if (selectedTest) {
    return (
      <section className="page tests">
        <nav className="tests-nav">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setSelectedTest(null)}
          >
            ← Назад к тестам
          </button>
        </nav>
        <div className="test-detail card">
          <div className="test-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
            <span className="test-icon">{selectedTest.icon}</span>
            <h2>{selectedTest.title}</h2>
            <p className="test-desc">{selectedTest.description}</p>
          </div>
          <div className="test-questions">
            <p className="placeholder">
              Здесь будет интерактивный тест с вопросами и подсчётом результата.
              (Демо-версия — функционал тестов в разработке.)
            </p>
          </div>
          <div className="test-actions" style={{ marginTop: "2rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                alert("Тест пройден! Результат: низкий уровень тревожности. Рекомендуем записаться на консультацию для профилактики.");
                setSelectedTest(null);
              }}
            >
              Завершить тест
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page tests">
      <div className="page-header">
        <div>
          <h2>Психологические тесты</h2>
          <p>Пройдите бесплатное тестирование для оценки своего эмоционального состояния</p>
        </div>
      </div>
      <div className="tests-grid">
        {TESTS.map((test) => (
          <div
            key={test.id}
            className="test-card"
            onClick={() => setSelectedTest(test)}
            style={{ cursor: "pointer" }}
          >
            <div className="test-icon-box" style={{ background: `${test.color}15`, color: test.color }}>
              {test.icon}
            </div>
            <h3>{test.title}</h3>
            <p>{test.description}</p>
            <div className="test-footer">
              <span>Начать тест →</span>
            </div>
          </div>
        ))}
      </div>
      <div className="tests-note card" style={{ marginTop: "2rem" }}>
        <p>
          <strong>Важно:</strong> Результаты тестов не являются медицинским
          диагнозом. При серьезных нарушениях эмоционального состояния
          обратитесь к профессиональному психологу или психотерапевту.
        </p>
      </div>
    </section>
  );
}
