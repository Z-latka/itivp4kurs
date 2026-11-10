import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Hand, IdCard, Inbox, LayoutList, MessageCircle } from "lucide-react";
import {
  assignQuestion,
  errorMessage,
  fetchAllBookings,
  fetchStaffQuestions,
  updateProfile,
} from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import { useToast } from "../toast/context";
import BookingsBoard from "../components/BookingsBoard";
import ConsultationsPage from "../components/ConsultationList";
import { EmptyState, Loader, PageHeader } from "../components/ui";
import { QuestionRow } from "./Questions";

const TABS = {
  schedule: { label: "Расписание", icon: CalendarDays },
  questions: { label: "Обращения", icon: MessageCircle },
  consultations: { label: "Мои консультации", icon: LayoutList },
  card: { label: "Анкета", icon: IdCard },
};

function QuestionsTab({ onChange }) {
  const toast = useToast();
  const [scope, setScope] = useState("queue");
  const [questions, setQuestions] = useState(null);

  const load = useCallback(
    () =>
      fetchStaffQuestions(scope)
        .then(({ data }) => setQuestions(data))
        .catch((err) => toast(errorMessage(err), "error")),
    [scope, toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  const switchScope = (next) => {
    setQuestions(null);
    setScope(next);
  };

  const take = async (q) => {
    try {
      await assignQuestion(q.id);
      toast("Обращение закреплено за вами");
      onChange();
      navigate(`ask/${q.id}`);
    } catch (err) {
      toast(errorMessage(err), "error");
      load();
    }
  };

  return (
    <>
      <div className="segmented" style={{ marginBottom: "1.25rem" }}>
        <button className={scope === "queue" ? "active" : ""} onClick={() => switchScope("queue")}>
          <Inbox size={15} /> Общая очередь
        </button>
        <button className={scope === "mine" ? "active" : ""} onClick={() => switchScope("mine")}>
          <MessageCircle size={15} /> Мои обращения
        </button>
      </div>
      <p className="muted small">
        {scope === "queue"
          ? "Новые анонимные вопросы, которые ещё никто не взял. Возьмите обращение, чтобы ответить, — после этого его видите только вы."
          : "Обращения, которые вы ведёте. Сначала те, где клиент ждёт ответа."}
      </p>
      {!questions && <Loader />}
      {questions && questions.length === 0 && (
        <EmptyState
          icon={Inbox}
          title={scope === "queue" ? "Очередь пуста" : "У вас пока нет обращений"}
          text={scope === "queue" ? "Все вопросы разобраны — отличная работа." : "Возьмите обращение из общей очереди."}
        />
      )}
      <ul className="list">
        {questions &&
          [...questions]
            .sort((a, b) => (a.status === "open" ? -1 : 0) - (b.status === "open" ? -1 : 0))
            .map((q) =>
              scope === "queue" ? (
                <li key={q.id} className="card list-row">
                  <div className="icon-tile sm"><MessageCircle size={18} /></div>
                  <div className="list-row-main">
                    <strong className="ellipsis">{q.topic}</strong>
                    <span className="muted small ellipsis">{q.messages[0]?.text}</span>
                    <span className="muted xsmall">{q.user?.nickname || "Аноним"}</span>
                  </div>
                  <div className="list-row-side">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`ask/${q.id}`)}>Прочитать</button>
                    <button className="btn btn-primary btn-sm" onClick={() => take(q)}>
                      <Hand size={15} /> Взять
                    </button>
                  </div>
                </li>
              ) : (
                <QuestionRow key={q.id} question={q} showAuthor />
              ),
            )}
      </ul>
    </>
  );
}

function CardTab() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const s = user.specialist || {};
  const [form, setForm] = useState({
    title: s.title || "",
    experienceYears: s.experienceYears ?? "",
    approach: s.approach || "",
    education: s.education || "",
    about: s.about || "",
    topics: (s.topics || []).join(", "),
  });

  const save = async (e) => {
    e.preventDefault();
    try {
      const { data } = await updateProfile({
        specialist: {
          ...form,
          experienceYears: form.experienceYears === "" ? undefined : Number(form.experienceYears),
          topics: form.topics.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        },
      });
      setUser(data);
      toast("Анкета обновлена");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const field = (name, label, props = {}) => (
    <div className="form-group">
      <label htmlFor={`card-${name}`}>{label}</label>
      <input
        id={`card-${name}`}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        {...props}
      />
    </div>
  );

  return (
    <div className="detail-grid">
      <form className="card" onSubmit={save}>
        <h3>Публичная анкета</h3>
        <p className="muted small">Её видят клиенты на странице «Специалисты». Имя меняет администратор.</p>
        <div className="form-group">
          <label>Имя</label>
          <input value={s.fullName || ""} disabled />
        </div>
        <div className="form-grid">
          {field("title", "Специализация", { maxLength: 80 })}
          {field("experienceYears", "Опыт, лет", { type: "number", min: 0, max: 60 })}
        </div>
        {field("approach", "Метод работы", { maxLength: 120, placeholder: "Например: КПТ" })}
        {field("education", "Образование", { maxLength: 300 })}
        {field("topics", "Темы (через запятую)", { placeholder: "тревога, сон" })}
        <div className="form-group">
          <label htmlFor="card-about">О себе</label>
          <textarea
            id="card-about"
            rows={5}
            maxLength={2000}
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
          />
        </div>
        <button className="btn btn-primary">Сохранить анкету</button>
      </form>
      <div className="card side-card">
        <h3>Как вас видят клиенты</h3>
        <p className="muted small mb-0">Откройте свою страницу, чтобы проверить анкету.</p>
        <button className="btn btn-outline btn-full mt" onClick={() => navigate(`specialists/${user.id}`)}>
          Открыть мою страницу
        </button>
      </div>
    </div>
  );
}

export default function WorkPage({ query = {} }) {
  const { user } = useAuth();
  const tab = TABS[query.tab] ? query.tab : "schedule";
  const [counts, setCounts] = useState(null);

  const loadCounts = useCallback(() => {
    Promise.all([fetchAllBookings(), fetchStaffQuestions("queue"), fetchStaffQuestions("mine")])
      .then(([b, queue, mine]) => {
        const today = new Date().toDateString();
        const active = b.data.filter((x) => ["pending", "confirmed"].includes(x.status));
        setCounts({
          today: active.filter((x) => new Date(x.scheduledAt).toDateString() === today).length,
          pending: b.data.filter((x) => x.status === "pending").length,
          queue: queue.data.length,
          waiting: mine.data.filter((q) => q.status === "open").length,
        });
      })
      .catch(() => setCounts(null));
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const tiles = counts && [
    { icon: CalendarDays, value: counts.today, label: "Встреч сегодня" },
    { icon: CalendarDays, value: counts.pending, label: "Ждут подтверждения", warm: counts.pending > 0 },
    { icon: Inbox, value: counts.queue, label: "Вопросов в очереди", warm: counts.queue > 0 },
    { icon: MessageCircle, value: counts.waiting, label: "Клиенты ждут ответа", warm: counts.waiting > 0 },
  ];

  return (
    <section className="page">
      <PageHeader
        eyebrow="Рабочее место"
        title={user.specialist?.fullName || user.nickname}
        subtitle={user.specialist?.title}
      />
      {tiles && (
        <div className="stats-row">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="stat-card">
                <div className={`icon-tile${t.warm ? " warm" : ""}`}><Icon size={20} /></div>
                <div>
                  <div className="stat-value">{t.value}</div>
                  <div className="stat-label">{t.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="tabs" role="tablist">
        {Object.entries(TABS).map(([key, t]) => {
          const Icon = t.icon;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              className={`tab${tab === key ? " active" : ""}`}
              onClick={() => navigate(key === "schedule" ? "work" : `work?tab=${key}`)}
            >
              <Icon size={16} /> {t.label}
              {key === "questions" && counts?.queue > 0 && <span className="count">{counts.queue}</span>}
            </button>
          );
        })}
      </div>
      {tab === "schedule" && <BookingsBoard />}
      {tab === "questions" && <QuestionsTab onChange={loadCounts} />}
      {tab === "consultations" && <ConsultationsPage ownerId={user.id} />}
      {tab === "card" && <CardTab />}
    </section>
  );
}
