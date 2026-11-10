import { useEffect, useState } from "react";
import { errorMessage, fetchTest, fetchTests, submitTest } from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import CrisisNote from "../components/CrisisNote";

function TestsList() {
  const [tests, setTests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests()
      .then(({ data }) => setTests(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page tests">
      <div className="page-header">
        <div>
          <h2>Психологические тесты</h2>
          <p>Пройдите бесплатное тестирование для оценки своего эмоционального состояния</p>
        </div>
      </div>
      {loading && <div className="loading-state"><div className="spinner"></div></div>}
      {error && <div className="alert alert-error">⚠ {error}</div>}
      <div className="tests-grid">
        {tests.map((test) => (
          <div
            key={test.id}
            className="test-card"
            onClick={() => navigate(`tests/${test.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div className="test-icon-box" style={{ background: `${test.color}15`, color: test.color }}>
              {test.icon}
            </div>
            <h3>{test.title}</h3>
            <p>{test.description}</p>
            <div className="test-footer">
              <span>Начать тест →</span>
              <span className="muted small">
                {test.questionsCount} вопросов · ~{test.minutes} мин
              </span>
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

function TestResultView({ test, result, onRestart }) {
  const { user } = useAuth();
  const percent = Math.round((result.score / result.maxScore) * 100);

  return (
    <div className="test-detail card">
      <div className="test-header">
        <span className="test-icon">{test.icon}</span>
        <h2>{result.levelTitle}</h2>
        <p className="test-desc">{test.title}</p>
      </div>
      <div className="score">
        <div className="score-bar">
          <div className="score-fill" style={{ width: `${percent}%`, background: test.color }} />
        </div>
        <div className="muted small">
          {result.score} из {result.maxScore} баллов
        </div>
      </div>
      <p>{result.recommendation}</p>
      {result.crisis && <CrisisNote strong />}
      {result.saved ? (
        <div className="alert alert-success">✓ Результат сохранён в личном кабинете</div>
      ) : (
        !user && (
          <div className="alert alert-warning">
            Войдите, чтобы сохранять результаты и отслеживать динамику.
          </div>
        )
      )}
      <div className="test-actions wrap">
        <button className="btn btn-primary" onClick={() => navigate("consultations")}>
          Записаться на консультацию
        </button>
        <button className="btn btn-outline" onClick={() => navigate("ask")}>
          Задать вопрос анонимно
        </button>
        <button className="btn btn-outline" onClick={onRestart}>
          Пройти заново
        </button>
        <button className="btn btn-outline" onClick={() => navigate("tests")}>
          Другие тесты
        </button>
      </div>
    </div>
  );
}

function TestRunner({ id }) {
  const [test, setTest] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTest(id)
      .then(({ data }) => setTest(data))
      .catch((err) => setError(errorMessage(err, "Тест не найден")));
  }, [id]);

  if (error) {
    return (
      <section className="page">
        <div className="alert alert-error">⚠ {error}</div>
        <button className="btn btn-outline" onClick={() => navigate("tests")}>← Назад к тестам</button>
      </section>
    );
  }
  if (!test) return <div className="loading-state"><div className="spinner"></div></div>;

  const restart = () => {
    setAnswers([]);
    setStep(0);
    setResult(null);
  };

  const total = test.questions.length;
  const question = test.questions[step];
  const isLast = step === total - 1;

  const choose = async (value) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    setSending(true);
    try {
      const { data } = await submitTest(test.id, next);
      setResult(data);
    } catch (err) {
      setError(errorMessage(err, "Не удалось отправить ответы"));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="page tests">
      <nav className="tests-nav">
        <button className="btn btn-outline btn-sm" onClick={() => navigate("tests")}>
          ← Назад к тестам
        </button>
      </nav>
      {result ? (
        <TestResultView test={test} result={result} onRestart={restart} />
      ) : (
        <div className="test-detail card">
          <div className="test-header">
            <span className="test-icon">{test.icon}</span>
            <h2>{test.title}</h2>
            <p className="test-desc">Как часто за последнее время вас беспокоило следующее?</p>
          </div>
          <div className="progress">
            <div className="progress-fill" style={{ width: `${(step / total) * 100}%` }} />
          </div>
          <div className="muted small">Вопрос {step + 1} из {total}</div>
          <h3 className="question-text">{question.text}</h3>
          <div className="options">
            {test.options.map((o) => (
              <button
                key={o.value}
                className={`option${answers[step] === o.value ? " selected" : ""}`}
                disabled={sending}
                onClick={() => choose(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="test-actions">
            <button
              className="btn btn-outline btn-sm"
              disabled={step === 0 || sending}
              onClick={() => setStep(step - 1)}
            >
              ← Предыдущий вопрос
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function TestsPage({ param }) {
  return param ? <TestRunner key={param} id={param} /> : <TestsList />;
}
