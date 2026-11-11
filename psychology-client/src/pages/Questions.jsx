import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Inbox,
  Lock,
  MessageCircle,
  Send,
  Stethoscope,
  UserRound,
} from "lucide-react";
import {
  assignQuestion,
  closeQuestion,
  createQuestion,
  errorMessage,
  fetchMyQuestions,
  fetchQuestion,
  sendMessage,
} from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import { useToast } from "../toast/context";
import ConfirmDialog from "../components/ConfirmDialog";
import { Badge, EmptyState, Loader, PageHeader } from "../components/ui";
import { QUESTION_STATUS, formatDate } from "../labels";

const qid = (q) => q.id || q._id;
const POLL_MS = 15000;

function Intro() {
  return (
    <section className="page">
      <PageHeader
        eyebrow="Анонимный вопрос"
        title="Спросите психолога — без имени"
        subtitle="Опишите, что вас беспокоит. Психолог ответит в личной переписке, а вы сможете продолжить диалог."
      />
      <div className="grid-3">
        <div className="card card-soft feature">
          <div className="icon-tile"><UserRound size={22} /></div>
          <h3>Под псевдонимом</h3>
          <p>Психолог не видит ваш email — только выбранный псевдоним.</p>
        </div>
        <div className="card card-soft feature">
          <div className="icon-tile"><Clock size={22} /></div>
          <h3>Ответ в течение суток</h3>
          <p>Ответ появится в этом разделе, можно задавать уточняющие вопросы.</p>
        </div>
        <div className="card card-soft feature">
          <div className="icon-tile"><Lock size={22} /></div>
          <h3>Только для вас</h3>
          <p>Переписку видите только вы и психолог сервиса.</p>
        </div>
      </div>
      <div className="cta-card mt">
        <h2>Войдите, чтобы задать вопрос</h2>
        <p>Аккаунт нужен, чтобы ответ специалиста видели только вы. Регистрация занимает минуту.</p>
        <button className="btn btn-lg" onClick={() => navigate("auth?mode=register&next=ask")}>
          Создать анонимный аккаунт
        </button>
      </div>
    </section>
  );
}

export function QuestionRow({ question, showAuthor = false }) {
  const status = QUESTION_STATUS[question.status] || QUESTION_STATUS.open;
  const last = question.messages?.at(-1);
  const author = question.user?.nickname || question.nickname;
  const open = () => navigate(`ask/${qid(question)}`);
  return (
    <li
      className="card card-hover list-row clickable"
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      tabIndex={0}
      role="link"
    >
      <div className="icon-tile sm"><MessageCircle size={18} /></div>
      <div className="list-row-main">
        <strong className="ellipsis">{question.topic}</strong>
        {last && (
          <span className="muted small ellipsis">
            {last.authorRole === "psychologist" ? "Психолог: " : ""}
            {last.text}
          </span>
        )}
        <span className="muted xsmall">
          {showAuthor && author ? `${author} · ` : ""}
          {!showAuthor && question.psychologist ? `${question.psychologist.fullName} · ` : ""}
          {formatDate(question.updatedAt)} · сообщений: {question.messages?.length || 0}
        </span>
      </div>
      <div className="list-row-side">
        <Badge color={status.color}>{status.label}</Badge>
      </div>
    </li>
  );
}

function QuestionsList() {
  const toast = useToast();
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
    try {
      const { data } = await createQuestion(form);
      toast("Вопрос отправлен психологу");
      navigate(`ask/${qid(data)}`);
    } catch (err) {
      toast(errorMessage(err, "Не удалось отправить вопрос"), "error");
      setSending(false);
    }
  };

  return (
    <section className="page">
      <PageHeader
        eyebrow="Анонимный вопрос"
        title="Вопрос психологу"
        subtitle="Специалист видит только ваш псевдоним. Обычно отвечаем в течение суток."
      />
      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-grid">
        <form className="card" onSubmit={handleSubmit}>
          <h3>Новое обращение</h3>
          <div className="form-group mt-sm">
            <label htmlFor="q-topic">Тема</label>
            <input
              id="q-topic"
              value={form.topic}
              maxLength={120}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="Например: постоянная тревога перед работой"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="q-text">Опишите ситуацию</label>
            <textarea
              id="q-text"
              rows={7}
              maxLength={5000}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Что происходит, как давно, что уже пробовали. Чем подробнее — тем точнее ответ."
              required
            />
            <div className="hint">{form.text.length} / 5000</div>
          </div>
          <button className="btn btn-primary" disabled={sending}>
            <Send size={16} /> {sending ? "Отправляем…" : "Отправить анонимно"}
          </button>
        </form>

        <div>
          <h3>Мои обращения</h3>
          {loading && <Loader />}
          {!loading && questions.length === 0 && (
            <div className="card card-soft">
              <EmptyState icon={Inbox} title="Пока пусто" text="Здесь появятся ваши вопросы и ответы психолога." />
            </div>
          )}
          <ul className="list">
            {questions.map((q) => (
              <QuestionRow key={qid(q)} question={q} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Thread({ id }) {
  const { user, isPsychologist } = useAuth();
  const toast = useToast();
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const endRef = useRef(null);
  const count = question?.messages.length;

  const load = useCallback(
    () =>
      fetchQuestion(id)
        .then(({ data }) => setQuestion(data))
        .catch((err) => setError(errorMessage(err, "Обращение не найдено"))),
    [id],
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [count]);

  if (error && !question) {
    return (
      <section className="page">
        <a href="#/ask" className="back-link"><ArrowLeft size={16} /> К обращениям</a>
        <div className="alert alert-error">{error}</div>
      </section>
    );
  }
  if (!question) return <Loader />;

  const isOwner = String(question.userId) === String(user.id);
  const asPsychologist = isPsychologist && !isOwner;
  const unassigned = !question.psychologist;

  const handleTake = async () => {
    try {
      await assignQuestion(id);
      toast("Обращение закреплено за вами");
      await load();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };
  const status = QUESTION_STATUS[question.status] || QUESTION_STATUS.open;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage(id, text);
      setText("");
      await load();
    } catch (err) {
      toast(errorMessage(err, "Не удалось отправить сообщение"), "error");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    setConfirmClose(false);
    try {
      await closeQuestion(id);
      setQuestion({ ...question, status: "closed" });
      toast("Обращение закрыто");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const backTo = asPsychologist ? "work?tab=questions" : "ask";

  return (
    <section className="page">
      <a
        href={`#/${backTo}`}
        className="back-link"
        onClick={(e) => {
          e.preventDefault();
          navigate(backTo);
        }}
      >
        <ArrowLeft size={16} /> {asPsychologist ? "Все обращения" : "Мои обращения"}
      </a>
      <div className="card thread">
        <div className="thread-head">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: "1.45rem" }}>{question.topic}</h2>
            <span className="muted small">
              {asPsychologist && `Клиент: ${question.user?.nickname || "Аноним"} · `}
              Создано {formatDate(question.createdAt)}
              {!asPsychologist &&
                (question.psychologist
                  ? ` · Отвечает: ${question.psychologist.fullName}`
                  : " · Ждёт свободного специалиста")}
            </span>
          </div>
          <Badge color={status.color}>{status.label}</Badge>
        </div>

        <div className="messages" aria-live="polite">
          {question.messages.map((m, i) => {
            const fromPsychologist = m.authorRole === "psychologist";
            const mine = asPsychologist ? fromPsychologist : !fromPsychologist;
            return (
              <div key={m.id || m._id || i} className={`message${mine ? " mine" : ""}`}>
                <div className="message-author">
                  {fromPsychologist ? <Stethoscope size={13} /> : <UserRound size={13} />}
                  {fromPsychologist
                    ? asPsychologist
                      ? "Вы"
                      : question.psychologist?.fullName || "Психолог"
                    : asPsychologist
                      ? question.user?.nickname || "Клиент"
                      : "Вы"}
                </div>
                <div className="message-text">{m.text}</div>
                <div className="message-time">{formatDate(m.createdAt)}</div>
              </div>
            );
          })}
          {!asPsychologist && question.status === "open" && (
            <p className="muted small center">Психолог ответит в течение суток. Страница обновляется сама.</p>
          )}
          <div ref={endRef} />
        </div>

        {asPsychologist && unassigned && question.status !== "closed" && (
          <div className="alert alert-info" style={{ alignItems: "center" }}>
            <span>Обращение в общей очереди. Возьмите его, чтобы вести переписку — после этого его увидите только вы.</span>
            <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={handleTake}>
              Взять в работу
            </button>
          </div>
        )}

        {question.status === "closed" ? (
          <div className="composer">
            <p className="muted mb-0">
              Обращение закрыто. Если появятся новые вопросы —{" "}
              <a href="#/ask">создайте новое</a>.
            </p>
          </div>
        ) : (
          <form className="composer" onSubmit={handleSend}>
            <textarea
              rows={3}
              value={text}
              maxLength={5000}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
              }}
              placeholder={asPsychologist ? "Ответ клиенту…" : "Ваше сообщение…"}
              aria-label="Сообщение"
            />
            <div className="row-between">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmClose(true)}>
                Закрыть обращение
              </button>
              <div className="row">
                <span className="muted xsmall hide-mobile">Ctrl + Enter</span>
                <button className="btn btn-primary" disabled={sending || !text.trim()}>
                  <Send size={16} /> Отправить
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
      <ConfirmDialog
        open={confirmClose}
        title="Закрыть обращение?"
        text="Переписка сохранится, но новые сообщения отправить будет нельзя."
        confirmLabel="Закрыть"
        onConfirm={handleClose}
        onCancel={() => setConfirmClose(false)}
      />
    </section>
  );
}

export default function QuestionsPage({ param }) {
  const { user } = useAuth();
  if (!user) return <Intro />;
  if (user.role !== "user" && !param) {
    return (
      <section className="page">
        <EmptyState
          icon={Lock}
          title={user.role === "psychologist" ? "Обращения клиентов — в рабочем месте" : "Переписка конфиденциальна"}
          text={
            user.role === "psychologist"
              ? "Общая очередь и ваши обращения находятся на вкладке «Обращения»."
              : "Анонимные обращения видят только клиент и психолог, который его ведёт."
          }
        >
          {user.role === "psychologist" && (
            <button className="btn btn-primary" onClick={() => navigate("work?tab=questions")}>Открыть обращения</button>
          )}
        </EmptyState>
      </section>
    );
  }
  return param ? <Thread key={param} id={param} /> : <QuestionsList />;
}
