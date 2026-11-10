import { useEffect, useMemo, useState } from "react";
import {
  addReview,
  createBooking,
  errorMessage,
  fetchConsultation,
  fetchConsultations,
} from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import { FORMATS, formatDate, formatPrice } from "../labels";

const Stars = ({ value }) => (
  <span className="stars" title={`${value} из 5`}>
    {"★".repeat(Math.round(value))}
    <span className="stars-empty">{"★".repeat(5 - Math.round(value))}</span>
  </span>
);

const isBookable = (c) => !["busy", "completed"].includes(c.status);

// Минимальное значение для datetime-local: через час от текущего момента
const minDateTime = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function CatalogList() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [sort, setSort] = useState("default");

  useEffect(() => {
    fetchConsultations()
      .then(({ data }) => setItems(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter(
      (c) =>
        (!q ||
          [c.topic, c.description, c.specialist]
            .join(" ")
            .toLowerCase()
            .includes(q)) &&
        (!onlyFree || Number(c.price) === 0),
    );
    if (sort === "price") list.sort((a, b) => a.price - b.price);
    if (sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [items, search, onlyFree, sort]);

  return (
    <section className="page consultations">
      <div className="page-header">
        <div>
          <h2>Консультации</h2>
          <p>Выберите направление и запишитесь на удобное время</p>
        </div>
        {isAdmin && (
          <button className="btn btn-outline" onClick={() => navigate("admin")}>
            ⚙ Управление каталогом
          </button>
        )}
      </div>

      <div className="filters card">
        <input
          type="search"
          placeholder="Поиск по теме, описанию или специалисту"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">По умолчанию</option>
          <option value="price">Сначала дешевле</option>
          <option value="rating">По рейтингу</option>
        </select>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={onlyFree}
            onChange={(e) => setOnlyFree(e.target.checked)}
          />
          Только бесплатные
        </label>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Загрузка консультаций…</p>
        </div>
      )}
      {error && <div className="alert alert-error">⚠ {error}</div>}

      {!loading && !error && visible.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить условия поиска.</p>
        </div>
      )}

      <ul className="cards-list">
        {visible.map((c) => (
          <li key={c.id} className="card consultation-card clickable" onClick={() => navigate(`consultations/${c.id}`)}>
            <div className="card-header">
              <h3 className="card-title">{c.topic}</h3>
              <div className="card-meta">
                <span>⏱ {c.duration} мин</span>
              </div>
            </div>
            {c.specialist && <p className="specialist">👩‍⚕️ {c.specialist}</p>}
            <div className="card-body">
              <p className="card-description">{c.description || "Описание не указано"}</p>
            </div>
            <div className="card-footer space-between">
              <span className="price">{formatPrice(c.price)}</span>
              {c.rating ? (
                <span className="muted">
                  <Stars value={c.rating} /> {c.rating} ({c.reviewsCount})
                </span>
              ) : (
                <span className="muted small">Пока нет отзывов</span>
              )}
            </div>
            {!isBookable(c) && <div className="muted small">Запись временно закрыта</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BookingForm({ consultation }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ scheduledAt: "", format: "chat", comment: "" });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  if (!user) {
    return (
      <div className="card side-card">
        <h3>Запись на консультацию</h3>
        <p>Чтобы записаться, войдите или создайте аккаунт — это займёт минуту.</p>
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate(`auth?next=consultations/${consultation.id}`)}
        >
          Войти и записаться
        </button>
      </div>
    );
  }

  if (!isBookable(consultation)) {
    return (
      <div className="card side-card">
        <h3>Запись временно закрыта</h3>
        <p>Задайте вопрос психологу анонимно — он подскажет ближайшие варианты.</p>
        <button className="btn btn-outline btn-full" onClick={() => navigate("ask")}>
          Задать вопрос
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    try {
      await createBooking({
        consultationId: consultation.id,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        format: form.format,
        comment: form.comment,
      });
      setMessage({ type: "success", text: "Вы записаны! Статус записи можно отслеживать в личном кабинете." });
      setForm({ scheduledAt: "", format: "chat", comment: "" });
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err, "Не удалось записаться") });
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="card side-card" onSubmit={handleSubmit}>
      <h3>Запись на консультацию</h3>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      <div className="form-group">
        <label>Дата и время</label>
        <input
          type="datetime-local"
          min={minDateTime()}
          value={form.scheduledAt}
          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>Формат</label>
        <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
          {Object.entries(FORMATS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>С чем хотите поработать? (необязательно)</label>
        <textarea
          rows={3}
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          placeholder="Пара слов о запросе поможет специалисту подготовиться"
        />
      </div>
      <button className="btn btn-primary btn-full" disabled={sending}>
        {sending ? "Отправка…" : `Записаться · ${formatPrice(consultation.price)}`}
      </button>
      {message?.type === "success" && (
        <button type="button" className="btn btn-outline btn-full mt" onClick={() => navigate("profile")}>
          Перейти в кабинет
        </button>
      )}
    </form>
  );
}

function ReviewForm({ consultationId, onAdded }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const { data } = await addReview(consultationId, { rating, comment });
      onAdded(data);
      setComment("");
    } catch (err) {
      setError(errorMessage(err, "Не удалось отправить отзыв"));
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="rating-input">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={n <= rating ? "on" : ""}
            onClick={() => setRating(n)}
            aria-label={`Оценка ${n}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Поделитесь впечатлением (отзыв публикуется под псевдонимом)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button className="btn btn-outline btn-sm" disabled={sending}>
        Оставить отзыв
      </button>
    </form>
  );
}

function ConsultationDetail({ id }) {
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsultation(id)
      .then(({ data }) => setItem(data))
      .catch((err) => setError(errorMessage(err, "Консультация не найдена")));
  }, [id]);

  if (error) {
    return (
      <section className="page">
        <div className="alert alert-error">⚠ {error}</div>
        <button className="btn btn-outline" onClick={() => navigate("consultations")}>
          ← К списку консультаций
        </button>
      </section>
    );
  }
  if (!item) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
      </div>
    );
  }

  const reviews = item.reviews || [];
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  return (
    <section className="page">
      <button className="btn btn-outline btn-sm" onClick={() => navigate("consultations")}>
        ← Все консультации
      </button>
      <div className="detail-grid">
        <div>
          <div className="card">
            <h2>{item.topic}</h2>
            {item.specialist && <p className="specialist">👩‍⚕️ {item.specialist}</p>}
            <div className="chips">
              <span className="chip">⏱ {item.duration} мин</span>
              <span className="chip">💰 {formatPrice(item.price)}</span>
              {avg && <span className="chip">★ {avg.toFixed(1)}</span>}
            </div>
            <p>{item.description}</p>
            <p className="muted small">
              Все консультации проходят анонимно: специалист видит только ваш
              псевдоним и комментарий к записи.
            </p>
          </div>

          <div className="card mt">
            <h3>Отзывы ({reviews.length})</h3>
            {user ? (
              <ReviewForm
                consultationId={item.id}
                onAdded={(review) =>
                  setItem({ ...item, reviews: [review, ...reviews] })
                }
              />
            ) : (
              <p className="muted small">Войдите, чтобы оставить отзыв.</p>
            )}
            {reviews.length === 0 && <p className="muted">Отзывов пока нет — будьте первым.</p>}
            <ul className="reviews">
              {reviews.map((r) => (
                <li key={r.id || r._id}>
                  <div className="review-head">
                    <strong>{r.user?.nickname || r.nickname || "Аноним"}</strong>
                    <Stars value={r.rating} />
                    <span className="muted small">{formatDate(r.createdAt, false)}</span>
                  </div>
                  {r.comment && <p>{r.comment}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <BookingForm consultation={item} />
      </div>
    </section>
  );
}

export default function CatalogPage({ param }) {
  return param ? <ConsultationDetail key={param} id={param} /> : <CatalogList />;
}
