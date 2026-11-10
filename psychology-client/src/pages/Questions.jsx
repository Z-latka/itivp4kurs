import { useEffect, useRef, useState } from "react";
import {
  closeQuestion,
  createQuestion,
  errorMessage,
  fetchMyQuestions,
  fetchQuestion,
  sendMessage,
} from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import Badge from "../components/Badge";
import { QUESTION_STATUS, formatDate } from "../labels";

const qid = (q) => q.id || q._id;

function Intro() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Анонимный вопрос психологу</h2>
          <p>Опишите, что вас беспокоит, — специалист ответит в личной переписке</p>
        </div>
      </div>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🎭</div>
          <h3>Под псевдонимом</h3>
          <p>Психолог не видит ваш email — только выбранный псевдоним.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⏳</div>
          <h3>Ответ в течение суток</h3>
          <p>Вы получите ответ в этом разделе и сможете продолжить диалог.</p>
        </div>
      </div>
      <div className="cta-card mt">
        <h2>Войдите, чтобы задать вопрос</h2>
        <p>Аккаунт нужен, чтобы только вы видели ответ специалиста.</p>
        <button className="btn btn-primary" onClick={() => navigate("auth?next=ask")}>
          Войти или зарегистрироваться
        </button>
      </div>
    </section>
  );
}

function QuestionsList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ topic: "", text: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMyQuestions()
      .then(({ data }) => setQuestions(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const { data } = await createQuestion(form);
      navigate(`ask/${qid(data)}`);
    } catch (err) {
      setError(errorMessage(err, "Не удалось отправить вопрос"));
      setSending(false);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Анонимный вопрос психологу</h2>
          <p>Специалист видит только ваш псевдоним. Ответ появится здесь же.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <h3>Новое обращение</h3>
        <div className="form-group">
          <label>Тема</label>
          <input
            value={form.topic}
            maxLength={120}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="Например: постоянная тревога перед работой"
            required
          />
        </div>
        <div className="form-group">
          <label>Опишите ситуацию</label>
          <textarea
            rows={5}
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            placeholder="Расскажите, что происходит, как давно и что уже пробовали"
            required
          />
        </div>
        <button className="btn btn-primary" disabled={sending}>
          {sending ? "Отправка…" : "Отправить анонимно"}
        </button>
      </form>

      <h3 className="mt">Мои обращения</h3>
      {loading && <div className="loading-state"><div className="spinner"></div></div>}
      {!loading && questions.length === 0 && (
        <p className="muted">Вы ещё не задавали вопросов.</p>
      )}
      <ul className="list">
        {questions.map((q) => (
          <QuestionRow key={qid(q)} question={q} />
        ))}
      </ul>
    </section>
  );
}

export function QuestionRow({ question, showAuthor = false }) {
  const status = QUESTION_STATUS[question.status] || QUESTION_STATUS.open;
  const last = question.messages?.at(-1);
  const author = question.user?.nickname || question.nickname;
  return (
    <li className="card list-row clickable" onClick={() => navigate(`ask/${qid(question)}`)}>
      <div className="list-row-main">
        <strong>{question.topic}</strong>
        <span className="muted small">
          {showAuthor && author ? `${author} · ` : ""}
          {formatDate(question.updatedAt)} · сообщений: {question.messages?.length || 0}
        </span>
        {last && <span className="muted small ellipsis">{last.text}</span>}
      </div>
      <Badge color={status.color}>{status.label}</Badge>
    </li>
  );
}

function Thread({ id }) {
  const { user, isAdmin } = useAuth();
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    fetchQuestion(id)
      .then(({ data }) => setQuestion(data))
      .catch((err) => setError(errorMessage(err, "Обращение не найдено")));
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [question]);

  if (error && !question) {
    return (
      <section className="page">
        <div className="alert alert-error">⚠ {error}</div>
        <button className="btn btn-outline" onClick={() => navigate("ask")}>← К обращениям</button>
      </section>
    );
  }
  if (!question) return <div className="loading-state"><div className="spinner"></div></div>;

  const isOwner = question.userId === user.id || question.user === user.id;
  const asPsychologist = isAdmin && !isOwner;
  const status = QUESTION_STATUS[question.status] || QUESTION_STATUS.open;

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await sendMessage(id, text);
      const { data } = await fetchQuestion(id);
      setQuestion(data);
      setText("");
    } catch (err) {
      setError(errorMessage(err, "Не удалось отправить сообщение"));
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    try {
      await closeQuestion(id);
      setQuestion({ ...question, status: "closed" });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section className="page">
      <button
        className="btn btn-outline btn-sm"
        onClick={() => navigate(asPsychologist ? "admin?tab=questions" : "ask")}
      >
        ← {asPsychologist ? "Все обращения" : "Мои обращения"}
      </button>
      <div className="card mt">
        <div className="thread-head">
          <div>
            <h2>{question.topic}</h2>
            <span className="muted small">
              {asPsychologist && `Клиент: ${question.user?.nickname || question.nickname || "Аноним"} · `}
              Создано {formatDate(question.createdAt)}
            </span>
          </div>
          <Badge color={status.color}>{status.label}</Badge>
        </div>

        <div className="messages">
          {question.messages.map((m, i) => {
            const mine = asPsychologist ? m.authorRole === "psychologist" : m.authorRole === "user";
            return (
              <div key={m.id || m._id || i} className={`message${mine ? " mine" : ""}`}>
                <div className="message-author">
                  {m.authorRole === "psychologist" ? "👩‍⚕️ Психолог" : asPsychologist ? "🎭 Клиент" : "Вы"}
                </div>
                <div className="message-text">{m.text}</div>
                <div className="message-time">{formatDate(m.createdAt)}</div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        {question.status === "closed" ? (
          <p className="muted">Обращение закрыто. Если появятся новые вопросы — создайте новое.</p>
        ) : (
          <form className="reply-form" onSubmit={handleSend}>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={asPsychologist ? "Ответ клиенту…" : "Ваше сообщение…"}
              required
            />
            <div className="form-actions">
              <button className="btn btn-primary" disabled={sending}>
                {sending ? "Отправка…" : "Отправить"}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleClose}>
                Закрыть обращение
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default function QuestionsPage({ param }) {
  const { user } = useAuth();
  if (!user) return <Intro />;
  return param ? <Thread key={param} id={param} /> : <QuestionsList />;
}
