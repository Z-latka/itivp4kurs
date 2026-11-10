import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Inbox,
  LayoutList,
  Lock,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import {
  errorMessage,
  fetchAllBookings,
  fetchAllQuestions,
  fetchStats,
  setBookingStatus,
} from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import { useToast } from "../toast/context";
import ConsultationsPage from "../components/ConsultationList";
import { Badge, EmptyState, Loader, PageHeader } from "../components/ui";
import { QuestionRow } from "./Questions";
import { BOOKING_STATUS, FORMATS, formatTime } from "../labels";

const bid = (b) => b.id || b._id;

const dayKey = (d) => new Date(d).toDateString();
const dayTitle = (d) => {
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (dayKey(date) === dayKey(today)) return "Сегодня";
  if (dayKey(date) === dayKey(tomorrow)) return "Завтра";
  return date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
};

function BookingsTab() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllBookings()
      .then(({ data }) => setBookings(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (booking, status) => {
    try {
      await setBookingStatus(bid(booking), status);
      setBookings((prev) => prev.map((b) => (bid(b) === bid(booking) ? { ...b, status } : b)));
      toast(`Статус: ${BOOKING_STATUS[status].label.toLowerCase()}`);
    } catch (err) {
      toast(errorMessage(err, "Не удалось изменить статус"), "error");
    }
  };

  // Группировка по дням для удобного расписания
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = bookings.filter((b) => {
      if (filter === "active" && !["pending", "confirmed"].includes(b.status)) return false;
      if (filter !== "active" && filter !== "all" && b.status !== filter) return false;
      return !q || [b.user?.nickname, b.consultation?.topic, b.comment].join(" ").toLowerCase().includes(q);
    });
    const map = new Map();
    list.forEach((b) => {
      const key = dayKey(b.scheduledAt);
      if (!map.has(key)) map.set(key, { date: b.scheduledAt, items: [] });
      map.get(key).items.push(b);
    });
    return [...map.values()];
  }, [bookings, filter, search]);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <>
      <div className="filters">
        <div className="filters-top">
          <label className="input-icon">
            <span className="sr-only">Поиск</span>
            <Search size={18} />
            <input
              className="input"
              type="search"
              placeholder="Псевдоним, тема или комментарий"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Статус">
            <option value="active">Активные</option>
            <option value="pending">Ожидают подтверждения ({pendingCount})</option>
            <option value="confirmed">Подтверждённые</option>
            <option value="completed">Завершённые</option>
            <option value="cancelled">Отменённые</option>
            <option value="all">Все записи</option>
          </select>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <Loader />}
      {!loading && groups.length === 0 && (
        <EmptyState icon={CalendarDays} title="Записей нет" text="Под выбранные условия ничего не подходит." />
      )}
      {groups.map((g) => (
        <div key={g.date} style={{ marginBottom: "1.75rem" }}>
          <h3 style={{ textTransform: "capitalize" }}>{dayTitle(g.date)}</h3>
          <ul className="list">
            {g.items.map((b) => {
              const status = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
              const Format = FORMATS[b.format]?.icon;
              return (
                <li key={bid(b)} className="card list-row">
                  <div className="date-tile">
                    <strong style={{ fontSize: "1rem" }}>{formatTime(b.scheduledAt)}</strong>
                  </div>
                  <div className="list-row-main">
                    <strong className="ellipsis">{b.consultation?.topic || "Консультация удалена"}</strong>
                    <span className="meta-row">
                      <span><Users size={14} /> {b.user?.nickname || "Аноним"}</span>
                      {Format && <span><Format size={14} /> {FORMATS[b.format].label}</span>}
                    </span>
                    {b.comment && <span className="small">«{b.comment}»</span>}
                  </div>
                  <div className="list-row-side">
                    <Badge color={status.color}>{status.label}</Badge>
                    {b.status === "pending" && (
                      <button className="btn btn-primary btn-sm" onClick={() => changeStatus(b, "confirmed")}>
                        Подтвердить
                      </button>
                    )}
                    <select
                      value={b.status}
                      onChange={(e) => changeStatus(b, e.target.value)}
                      aria-label="Изменить статус"
                    >
                      {Object.entries(BOOKING_STATUS).map(([value, s]) => (
                        <option key={value} value={value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function QuestionsTab() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllQuestions()
      .then(({ data }) => setQuestions(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { all: questions.length, open: 0, answered: 0, closed: 0 };
    questions.forEach((q) => (c[q.status] += 1));
    return c;
  }, [questions]);

  const visible = questions.filter((q) => filter === "all" || q.status === filter);

  return (
    <>
      <div className="segmented" style={{ marginBottom: "1.25rem" }}>
        {[
          ["open", "Ждут ответа"],
          ["answered", "Отвечено"],
          ["closed", "Закрыты"],
          ["all", "Все"],
        ].map(([key, label]) => (
          <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
            {label} · {counts[key]}
          </button>
        ))}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <Loader />}
      {!loading && visible.length === 0 && (
        <EmptyState
          icon={Inbox}
          title={filter === "open" ? "Все вопросы отвечены" : "Обращений нет"}
          text={filter === "open" ? "Новые обращения появятся здесь." : undefined}
        />
      )}
      <ul className="list">
        {visible.map((q) => (
          <QuestionRow key={q.id || q._id} question={q} showAuthor />
        ))}
      </ul>
    </>
  );
}

const TABS = {
  bookings: { label: "Расписание", icon: CalendarDays },
  questions: { label: "Обращения", icon: MessageCircle },
  catalog: { label: "Каталог консультаций", icon: LayoutList },
};

export default function AdminPage({ query = {} }) {
  const { isAdmin } = useAuth();
  const tab = TABS[query.tab] ? query.tab : "bookings";
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isAdmin) fetchStats().then(({ data }) => setStats(data)).catch(() => {});
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <section className="page">
        <EmptyState icon={Lock} title="Раздел доступен только психологам">
          <button className="btn btn-primary" onClick={() => navigate("")}>На главную</button>
        </EmptyState>
      </section>
    );
  }

  const tiles = stats && [
    { icon: Users, value: stats.users, label: "Пользователей" },
    { icon: CalendarDays, value: stats.bookings, label: "Записей всего" },
    { icon: MessageCircle, value: stats.openQuestions, label: "Ждут ответа", warm: true },
    { icon: ClipboardList, value: stats.testsTaken, label: "Тестов пройдено" },
  ];

  return (
    <section className="page">
      <PageHeader eyebrow="Панель психолога" title="Рабочее место" subtitle="Расписание встреч, анонимные обращения и каталог услуг." />
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
              onClick={() => navigate(`admin?tab=${key}`)}
            >
              <Icon size={16} /> {t.label}
              {key === "questions" && stats?.openQuestions > 0 && <span className="count">{stats.openQuestions}</span>}
            </button>
          );
        })}
      </div>
      {tab === "bookings" && <BookingsTab />}
      {tab === "questions" && <QuestionsTab />}
      {tab === "catalog" && <ConsultationsPage />}
    </section>
  );
}
