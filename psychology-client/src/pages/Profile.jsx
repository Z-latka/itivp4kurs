import { useEffect, useState } from "react";
import {
  cancelBooking,
  errorMessage,
  fetchMyBookings,
  fetchMyResults,
  updateProfile,
} from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import Badge from "../components/Badge";
import { BOOKING_STATUS, FORMATS, formatDate, formatPrice } from "../labels";

const bid = (b) => b.id || b._id;

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    nickname: user.nickname || "",
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const payload = { nickname: form.nickname };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const { data } = await updateProfile(payload);
      setUser(data);
      setForm({ ...form, currentPassword: "", newPassword: "" });
      setMessage({ type: "success", text: "Профиль сохранён" });
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Профиль</h3>
      <p className="muted small">
        {user.email} · {user.role === "admin" ? "психолог (администратор)" : "клиент"}
      </p>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      <div className="form-group">
        <label>Псевдоним (его видит психолог)</label>
        <input
          value={form.nickname}
          maxLength={40}
          onChange={(e) => setForm({ ...form, nickname: e.target.value })}
          required
        />
      </div>
      <details>
        <summary className="muted">Сменить пароль</summary>
        <div className="form-group mt">
          <label>Текущий пароль</label>
          <input
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Новый пароль</label>
          <input
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
        </div>
      </details>
      <button className="btn btn-primary mt">Сохранить</button>
    </form>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchMyBookings(), fetchMyResults()])
      .then(([b, r]) => {
        setBookings(b.data);
        setResults(r.data);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (booking) => {
    if (!window.confirm("Отменить запись на консультацию?")) return;
    try {
      const { data } = await cancelBooking(bid(booking));
      setBookings((prev) =>
        prev.map((b) => (bid(b) === bid(booking) ? { ...b, status: data.status } : b)),
      );
    } catch (err) {
      setError(errorMessage(err, "Не удалось отменить запись"));
    }
  };

  const upcoming = bookings.filter(
    (b) => ["pending", "confirmed"].includes(b.status) && new Date(b.scheduledAt) > new Date(),
  );

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Личный кабинет</h2>
          <p>Здравствуйте, {user.nickname}! Здесь ваши записи и результаты тестов.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{upcoming.length}</div>
          <div className="stat-label">Предстоящих консультаций</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.length}</div>
          <div className="stat-label">Всего записей</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{results.length}</div>
          <div className="stat-label">Пройдено тестов</div>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <h3>Мои записи</h3>
          {loading && <div className="loading-state"><div className="spinner"></div></div>}
          {!loading && bookings.length === 0 && (
            <div className="card empty-inline">
              <p>У вас пока нет записей.</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("consultations")}>
                Выбрать консультацию
              </button>
            </div>
          )}
          <ul className="list">
            {bookings.map((b) => {
              const status = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
              const c = b.consultation || {};
              return (
                <li key={bid(b)} className="card list-row">
                  <div className="list-row-main">
                    <strong>{c.topic || "Консультация удалена"}</strong>
                    <span className="muted small">
                      📅 {formatDate(b.scheduledAt)} · {FORMATS[b.format] || b.format}
                    </span>
                    {c.specialist && <span className="muted small">👩‍⚕️ {c.specialist}</span>}
                    {c.price !== undefined && <span className="muted small">{formatPrice(c.price)}</span>}
                  </div>
                  <div className="list-row-side">
                    <Badge color={status.color}>{status.label}</Badge>
                    {["pending", "confirmed"].includes(b.status) && (
                      <button className="btn btn-sm btn-ghost danger" onClick={() => handleCancel(b)}>
                        Отменить
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <h3 className="mt">История тестов</h3>
          {!loading && results.length === 0 && (
            <div className="card empty-inline">
              <p>Вы ещё не проходили тесты.</p>
              <button className="btn btn-outline btn-sm" onClick={() => navigate("tests")}>
                Пройти тест
              </button>
            </div>
          )}
          <ul className="list">
            {results.map((r) => (
              <li key={r.id || r._id} className="card list-row clickable" onClick={() => navigate(`tests/${r.testId}`)}>
                <div className="list-row-main">
                  <strong>{r.testTitle}</strong>
                  <span className="muted small">{formatDate(r.createdAt || r.takenAt)}</span>
                </div>
                <div className="list-row-side align-end">
                  <span>{r.levelTitle}</span>
                  <span className="muted small">{r.score} / {r.maxScore}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <ProfileForm />
          <div className="card mt">
            <h3>Нужна поддержка?</h3>
            <p className="small">Задайте вопрос психологу анонимно — ответ придёт в раздел обращений.</p>
            <button className="btn btn-outline btn-full" onClick={() => navigate("ask")}>
              Мои обращения
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
