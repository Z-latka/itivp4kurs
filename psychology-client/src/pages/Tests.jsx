import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardList, Info, RotateCcw, TrendingDown, TrendingUp } from "lucide-react";
import { errorMessage, fetchMyResults, fetchTest, fetchTests, submitTest } from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import CrisisNote from "../components/CrisisNote";
import { Loader, PageHeader } from "../components/ui";
import { TEST_ICONS, formatDate, plural } from "../labels";

function TestsList() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [last, setLast] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests()
      .then(({ data }) => setTests(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMyResults()
      .then(({ data }) => {
        // Последний результат по каждому тесту (результаты отсортированы от новых к старым)
        const map = {};
        data.forEach((r) => {
          if (!map[r.testId]) map[r.testId] = r;
        });
        setLast(map);
      })
      .catch(() => setLast({}));
  }, [user]);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Тесты"
        title="Психологические тесты"
        subtitle="Короткие опросники на основе признанных шкал. Займут 2–4 минуты и помогут понять, стоит ли обратиться к специалисту."
      />
      {loading && <Loader />}
      {error && <div className="alert alert-error">{error}</div>}
      <div className="grid-2">
        {tests.map((test) => {
          const Icon = TEST_ICONS[test.id] || ClipboardList;
          const prev = last[test.id];
          return (
            <div
              key={test.id}
              className="card card-hover test-card"
              onClick={() => navigate(`tests/${test.id}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`tests/${test.id}`)}
              tabIndex={0}
              role="link"
            >
              <div className="icon-tile" style={{ background: `${test.color}1a`, color: test.color }}>
                <Icon size={24} />
              </div>
              <h3>{test.title}</h3>
              <p>{test.description}</p>
              {prev && (
                <p className="small mb-0" style={{ color: "var(--text)" }}>
                  Последний результат: <strong>{prev.levelTitle}</strong>{" "}
                  <span className="muted">({formatDate(prev.takenAt, false)})</span>
                </p>
              )}
              <div className="test-footer">
                <span>{test.questionsCount} вопросов · ~{test.minutes} мин</span>
                <span className="go">
                  {prev ? "Пройти снова" : "Начать"} <ArrowRight size={15} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="alert alert-info mt">
        <Info size={18} />
        <span>
          Результаты тестов не являются диагнозом. Если вам тяжело
          справляться с состоянием — обратитесь к психологу или
          психотерапевту.
        </span>
      </div>
    </section>
  );
}

function TestResultView({ test, result, previous, onRestart }) {
  const { user } = useAuth();
  const percent = Math.round((result.score / result.maxScore) * 100);
  const Icon = TEST_ICONS[test.id] || ClipboardList;
  const diff = previous ? result.score - previous.score : null;

  return (
    <div className="card runner page">
      <div className="center">
        <div className="icon-tile" style={{ background: `${test.color}1a`, color: test.color }}>
          <Icon size={22} />
        </div>
        <p className="muted small mb-0">{test.title}</p>
        <h2>{result.levelTitle}</h2>
      </div>
      <div className="result-ring mt" style={{ "--p": percent, "--ring-color": test.color }}>
        <div>
          <span>
            <strong>{result.score}</strong>
            <small>из {result.maxScore}</small>
          </span>
        </div>
      </div>
      {diff !== null && diff !== 0 && (
        <p className="center small" style={{ color: diff < 0 ? "var(--success)" : "var(--warning)" }}>
          {diff < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}{" "}
          На {Math.abs(diff)} {plural(Math.abs(diff), "балл", "балла", "баллов")} {diff < 0 ? "ниже" : "выше"}, чем{" "}
          {formatDate(previous.takenAt, false)}
        </p>
      )}
      <p style={{ fontSize: "1.05rem" }}>{result.recommendation}</p>
      {result.crisis && <CrisisNote strong />}
      {result.saved ? (
        <div className="alert alert-success">Результат сохранён в личном кабинете — там видна динамика.</div>
      ) : (
        !user && (
          <div className="alert alert-warning">
            <span>
              Результат не сохранён.{" "}
              <a href={`#/auth?next=tests/${test.id}`}>Войдите</a>, чтобы
              отслеживать изменения со временем.
            </span>
          </div>
        )
      )}
      <div className="form-actions mt">
        <button className="btn btn-primary" onClick={() => navigate("consultations")}>
          Записаться на консультацию
        </button>
        <button className="btn btn-outline" onClick={() => navigate("ask")}>
          Спросить психолога
        </button>
        <button className="btn btn-ghost" onClick={onRestart}>
          <RotateCcw size={16} /> Заново
        </button>
      </div>
    </div>
  );
}

function TestRunner({ id }) {
  const { user } = useAuth();
  const [test, setTest] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTest(id)
      .then(({ data }) => setTest(data))
      .catch((err) => setError(errorMessage(err, "Тест не найден")));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    fetchMyResults()
      .then(({ data }) => setPrevious(data.find((r) => r.testId === id) || null))
      .catch(() => setPrevious(null));
  }, [user, id]);

  const total = test?.questions.length || 0;
  const isLast = step === total - 1;

  const choose = useCallback(
    async (value) => {
      if (!test || sending) return;
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
    },
    [answers, isLast, sending, step, test],
  );

  // Ответ цифрами 1–4 с клавиатуры, Backspace — назад
  useEffect(() => {
    if (!test || result) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea")) return;
      const n = Number(e.key);
      if (n >= 1 && n <= test.options.length) choose(test.options[n - 1].value);
      if (e.key === "Backspace" && step > 0) setStep(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [test, result, step, choose]);

  const back = (
    <a
      href="#/tests"
      className="back-link"
      onClick={(e) => {
        e.preventDefault();
        navigate("tests");
      }}
    >
      <ArrowLeft size={16} /> Все тесты
    </a>
  );

  if (error) {
    return (
      <section className="page">
        {back}
        <div className="alert alert-error">{error}</div>
      </section>
    );
  }
  if (!test) return <Loader />;

  const restart = () => {
    setAnswers([]);
    setStep(0);
    setResult(null);
  };

  const question = test.questions[step];

  return (
    <section className="page">
      <div className="runner">{back}</div>
      {result ? (
        <TestResultView test={test} result={result} previous={previous} onRestart={restart} />
      ) : (
        <div className="card runner">
          <div className="row-between">
            <span className="muted small">{test.title}</span>
            <span className="muted small">
              {step + 1} / {total}
            </span>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={step} aria-valuemax={total}>
            <div className="progress-fill" style={{ width: `${(step / total) * 100}%`, background: test.color }} />
          </div>
          <p className="muted small mb-0">{test.prompt}</p>
          <h2 className="question-text" key={step}>{question.text}</h2>
          <div className="options" role="radiogroup" aria-label="Варианты ответа">
            {test.options.map((o, i) => (
              <button
                key={o.value}
                role="radio"
                aria-checked={answers[step] === o.value}
                className={`option${answers[step] === o.value ? " selected" : ""}`}
                disabled={sending}
                onClick={() => choose(o.value)}
              >
                <kbd>{i + 1}</kbd> {o.label}
              </button>
            ))}
          </div>
          <div className="row-between mt">
            <button
              className="btn btn-ghost btn-sm"
              disabled={step === 0 || sending}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} /> Назад
            </button>
            <span className="muted xsmall hide-mobile">Можно отвечать клавишами 1–{test.options.length}</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default function TestsPage({ param }) {
  return param ? <TestRunner key={param} id={param} /> : <TestsList />;
}
