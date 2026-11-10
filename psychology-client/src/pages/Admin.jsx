import { useEffect, useState } from "react";
import {
  errorMessage,
  fetchAllBookings,
  fetchAllQuestions,
  fetchStats,
  setBookingStatus,
} from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import ConsultationsPage from "../components/ConsultationList";
import Badge from "../components/Badge";
import { QuestionRow } from "./Questions";
import { BOOKING_STATUS, FORMATS, formatDate } from "../labels";

const bid = (b) => b.id || b._id;

function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllBookings()
      .then(({ data }) => setBookings(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (booking, status) => {
    setError(null);
    try {
      await setBookingStatus(bid(booking), status);
      setBookings((prev) =>
        prev.map((b) => (bid(b) === bid(booking) ? { ...b, status } : b)),
      );
    } catch (err) {
      setError(errorMessage(err, "Не удалось изменить статус"));
    }
  };

  const visible = bookings.filter((b) =>
    filter === "all" ? true : ["pending", "confirmed"].includes(b.status),
  );

  return (
    <>
      <div className="filters card">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="active">Ожидающие и подтверждённые</option>
          <option value="all">Все записи</option>
        </select>
      </div>
      {error && <div className="alert alert-error">⚠ {error}</div>}
      {loading && <div className="loading-state"><div className="spinner"></div></div>}
      {!loading && visible.length === 0 && <p className="muted">Записей нет.</p>}
      <ul className="list">
        {visible.map((b) => {
          const status = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
          return (
            <li key={bid(b)} className="card list-row">
              <div className="list-row-main">
                <strong>{b.consultation?.topic || "Консультация удалена"}</strong>
                <span className="muted small">
                  🎭 {b.user?.nickname || "Аноним"} · 📅 {formatDate(b.scheduledAt)} · {FORMATS[b.format] || b.format}
                </span>
                {b.comment && <span className="small">«{b.comment}»</span>}
              </div>
              <div className="list-row-side">
                <Badge color={status.color}>{status.label}</Badge>
                <select value={b.status} onChange={(e) => changeStatus(b, e.target.value)}>
                  {Object.entries(BOOKING_STATUS).map(([value, s]) => (
                    <option key={value} value={value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function QuestionsTab() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllQuestions()
      .then(({ data }) => setQuestions(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Сначала обращения, ожидающие ответа
  const order = { open: 0, answered: 1, closed: 2 };
  const sorted = [...questions].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <>
      {error && <div className="alert alert-error">⚠ {error}</div>}
      {loading && <div className="loading-state"><div className="spinner"></div></div>}
      {!loading && sorted.length === 0 && <p className="muted">Обращений пока нет.</p>}
      <ul className="list">
        {sorted.map((q) => (
          <QuestionRow key={q.id || q._id} question={q} showAuthor />
        ))}
      </ul>
    </>
  );
}

const TABS = {
  bookings: "📅 Записи",
  questions: "💬 Обращения",
  catalog: "📋 Каталог консультаций",
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
      <section className="page empty-state">
        <div className="empty-icon">🔒</div>
        <h3>Раздел доступен только психологам</h3>
        <button className="btn btn-primary" onClick={() => navigate("")}>На главную</button>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Панель психолога</h2>
          <p>Записи клиентов, анонимные обращения и каталог услуг</p>
        </div>
      </div>
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.users}</div>
            <div className="stat-label">Пользователей</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.bookings}</div>
            <div className="stat-label">Записей</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.openQuestions}</div>
            <div className="stat-label">Ждут ответа</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.testsTaken}</div>
            <div className="stat-label">Тестов пройдено</div>
          </div>
        </div>
      )}
      <div className="tabs">
        {Object.entries(TABS).map(([key, label]) => (
          <button
            key={key}
            className={`tab${tab === key ? " active" : ""}`}
            onClick={() => navigate(`admin?tab=${key}`)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "bookings" && <BookingsTab />}
      {tab === "questions" && <QuestionsTab />}
      {tab === "catalog" && <ConsultationsPage />}
    </section>
  );
}
