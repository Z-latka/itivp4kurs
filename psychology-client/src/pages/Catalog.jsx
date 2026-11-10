import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CircleCheck,
  Clock,
  Lock,
  Pencil,
  Search,
  Settings,
  Star,
  Wallet,
} from "lucide-react";
import {
  addReview,
  createBooking,
  errorMessage,
  fetchConsultation,
  fetchConsultations,
  fetchSlots,
  updateReview,
} from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import { useToast } from "../toast/context";
import { Avatar, EmptyState, Loader, PageHeader, Stars } from "../components/ui";
import ConsultationCard from "../components/ConsultationCard";
import {
  FORMATS,
  formatDate,
  formatPrice,
  isBookable,
  plural,
  splitSpecialist,
} from "../labels";

// Расписание: часовые слоты с 10:00 до 19:00, воскресенье — выходной
const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const DAYS_AHEAD = 14;

const buildDays = () => {
  const days = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; days.length < DAYS_AHEAD; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() !== 0) days.push(d);
  }
  return days;
};

const slotDate = (day, hour) => {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// Слот доступен, если до него больше часа
const isTooSoon = (date) => date.getTime() < Date.now() + 60 * 60 * 1000;

function CatalogList({ query }) {
  const { isAdmin, isPsychologist } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState(query.tag || "");
  const [onlyFree, setOnlyFree] = useState(false);
  const [sort, setSort] = useState("default");

  useEffect(() => {
    fetchConsultations()
      .then(({ data }) => setItems(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const allTags = useMemo(() => {
    const counts = {};
    items.forEach((c) => (c.tags || []).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  }, [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter(
      (c) =>
        (!q || [c.topic, c.description, c.specialist, ...(c.tags || [])].join(" ").toLowerCase().includes(q)) &&
        (!tag || (c.tags || []).includes(tag)) &&
        (!onlyFree || Number(c.price) === 0),
    );
    if (sort === "price") list.sort((a, b) => a.price - b.price);
    if (sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === "duration") list.sort((a, b) => a.duration - b.duration);
    return list;
  }, [items, search, tag, onlyFree, sort]);

  const reset = () => {
    setSearch("");
    setTag("");
    setOnlyFree(false);
  };

  return (
    <section className="page">
      <PageHeader
        eyebrow="Консультации"
        title="Выберите направление"
        subtitle="Все встречи проходят онлайн и анонимно. Не уверены, с чего начать? Выберите бесплатную первичную консультацию."
      >
        {(isAdmin || isPsychologist) && (
          <button
            className="btn btn-outline"
            onClick={() => navigate(isAdmin ? "admin?tab=catalog" : "work?tab=consultations")}
          >
            <Settings size={16} /> Управление каталогом
          </button>
        )}
      </PageHeader>

      <div className="filters">
        <div className="filters-top">
          <label className="input-icon">
            <span className="sr-only">Поиск</span>
            <Search size={18} />
            <input
              className="input"
              type="search"
              placeholder="Тема, специалист или ключевое слово"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Сортировка">
            <option value="default">Рекомендуемые</option>
            <option value="price">Сначала дешевле</option>
            <option value="rating">С высоким рейтингом</option>
            <option value="duration">Короче по времени</option>
          </select>
          <label className="checkbox">
            <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />
            Только бесплатные
          </label>
        </div>
        {allTags.length > 0 && (
          <div className="chips" aria-label="Темы">
            <button className={`chip${!tag ? " active" : ""}`} onClick={() => setTag("")}>Все темы</button>
            {allTags.map((t) => (
              <button key={t} className={`chip${tag === t ? " active" : ""}`} onClick={() => setTag(tag === t ? "" : t)}>
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <Loader text="Загружаем консультации…" />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && visible.length === 0 && (
        <EmptyState icon={Search} title="Ничего не нашлось" text="Попробуйте другие слова или сбросьте фильтры.">
          <button className="btn btn-outline" onClick={reset}>Сбросить фильтры</button>
        </EmptyState>
      )}

      {!loading && visible.length > 0 && (
        <>
          <p className="muted small">
            Найдено {visible.length} {plural(visible.length, "направление", "направления", "направлений")}
          </p>
          <ul className="cards-list">
            {visible.map((c) => (
              <ConsultationCard key={c.id} item={c} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function BookingPanel({ consultation }) {
  const { user } = useAuth();
  const toast = useToast();
  const [days] = useState(buildDays);
  const [day, setDay] = useState(days[0]);
  const [hour, setHour] = useState(null);
  const [busy, setBusy] = useState([]);
  const [format, setFormat] = useState("video");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [booked, setBooked] = useState(null);

  const loadBusy = useCallback(() => {
    const to = new Date(days.at(-1));
    to.setHours(23, 59, 59);
    fetchSlots(consultation.id, days[0].toISOString(), to.toISOString())
      .then(({ data }) => setBusy(data.map((d) => new Date(d).getTime())))
      .catch(() => setBusy([]));
  }, [consultation.id, days]);

  useEffect(() => {
    loadBusy();
  }, [loadBusy]);

  if (user && user.role !== "user") {
    return (
      <div className="card side-card">
        <h3>Запись доступна клиентам</h3>
        <p className="muted mb-0">Вы вошли как сотрудник сервиса. Записи клиентов — в разделе «{user.role === "admin" ? "Администрирование" : "Рабочее место"}».</p>
      </div>
    );
  }

  if (!isBookable(consultation)) {
    return (
      <div className="card side-card">
        <h3>Запись временно закрыта</h3>
        <p className="muted">Задайте вопрос психологу анонимно — он подскажет ближайшие варианты.</p>
        <button className="btn btn-outline btn-full" onClick={() => navigate("ask")}>Задать вопрос</button>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="card side-card booking-success">
        <div className="icon-tile"><CircleCheck size={32} /></div>
        <h3>Вы записаны!</h3>
        <p className="muted">
          {formatDate(booked)} · {FORMATS[format].label}. Психолог подтвердит запись — статус
          можно отслеживать в личном кабинете.
        </p>
        <div className="stack">
          <button className="btn btn-primary btn-full" onClick={() => navigate("profile?tab=bookings")}>
            Мои записи
          </button>
          <button className="btn btn-ghost btn-full" onClick={() => { setBooked(null); setHour(null); }}>
            Записаться ещё раз
          </button>
        </div>
      </div>
    );
  }

  const selected = hour !== null ? slotDate(day, hour) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate(`auth?next=consultations/${consultation.id}`);
      return;
    }
    setSending(true);
    try {
      await createBooking({
        consultationId: consultation.id,
        scheduledAt: selected.toISOString(),
        format,
        comment,
      });
      setBooked(selected);
      setComment("");
      loadBusy();
      toast("Запись создана");
    } catch (err) {
      toast(errorMessage(err, "Не удалось записаться"), "error");
      loadBusy();
      setHour(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="card side-card" onSubmit={handleSubmit}>
      <h3>Запись на консультацию</h3>
      <p className="muted small">Выберите день и удобное время.</p>

      <div className="day-picker" role="radiogroup" aria-label="День">
        {days.map((d) => {
          const free = HOURS.some((h) => !isTooSoon(slotDate(d, h)) && !busy.includes(slotDate(d, h).getTime()));
          return (
            <button
              type="button"
              key={d.toISOString()}
              className={`day${d.getTime() === day.getTime() ? " selected" : ""}`}
              disabled={!free}
              onClick={() => {
                setDay(d);
                setHour(null);
              }}
            >
              <small>{d.toLocaleDateString("ru-RU", { weekday: "short" })}</small>
              <strong>{d.getDate()}</strong>
              <small>{d.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "")}</small>
            </button>
          );
        })}
      </div>

      <div className="slots mt-sm" role="radiogroup" aria-label="Время">
        {HOURS.map((h) => {
          const date = slotDate(day, h);
          const taken = busy.includes(date.getTime());
          return (
            <button
              type="button"
              key={h}
              className={`slot${hour === h ? " selected" : ""}`}
              disabled={taken || isTooSoon(date)}
              title={taken ? "Время занято" : undefined}
              onClick={() => setHour(h)}
            >
              {String(h).padStart(2, "0")}:00
            </button>
          );
        })}
      </div>

      <div className="form-group mt">
        <span className="label">Формат</span>
        <div className="segmented">
          {Object.entries(FORMATS).map(([value, f]) => {
            const Icon = f.icon;
            return (
              <button
                type="button"
                key={value}
                className={format === value ? "active" : ""}
                onClick={() => setFormat(value)}
              >
                <Icon size={15} /> {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="booking-comment">С чем хотите поработать? <span className="muted">(необязательно)</span></label>
        <textarea
          id="booking-comment"
          rows={3}
          value={comment}
          maxLength={1000}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Пара слов поможет специалисту подготовиться"
        />
      </div>

      <button className="btn btn-primary btn-full btn-lg" disabled={sending || (user && !selected)}>
        {!user
          ? "Войти и записаться"
          : sending
            ? "Записываем…"
            : selected
              ? `Записаться на ${selected.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}, ${String(hour).padStart(2, "0")}:00`
              : "Выберите время"}
      </button>
      <p className="hint center">
        <Lock size={12} /> Психолог увидит только ваш псевдоним
      </p>
    </form>
  );
}

function ReviewForm({ initial, onSubmit, onCancel }) {
  const [rating, setRating] = useState(initial?.rating || 5);
  const [comment, setComment] = useState(initial?.comment || "");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const ok = await onSubmit({ rating, comment });
    if (!ok) setSending(false);
  };

  return (
    <form className="card card-soft" onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
      <span className="label">Ваша оценка</span>
      <div className="rating-input" role="radiogroup" aria-label="Оценка">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={n <= rating ? "on" : ""}
            onClick={() => setRating(n)}
            aria-label={`${n} из 5`}
            aria-checked={rating === n}
            role="radio"
          >
            <Star size={24} fill={n <= rating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <div className="form-group mt-sm">
        <textarea
          rows={3}
          maxLength={1000}
          placeholder="Что было полезно? Отзыв публикуется под псевдонимом"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          aria-label="Текст отзыва"
        />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary btn-sm" disabled={sending}>
          {initial ? "Сохранить" : "Опубликовать отзыв"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Отмена</button>
        )}
      </div>
    </form>
  );
}

function Reviews({ item, setItem }) {
  const { user, isClient } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [writing, setWriting] = useState(false);
  const reviews = item.reviews || [];
  const mine = user && reviews.find((r) => String(r.user) === String(user.id));

  const create = async (data) => {
    try {
      const { data: review } = await addReview(item.id, data);
      setItem({ ...item, reviews: [review, ...reviews] });
      setWriting(false);
      toast("Спасибо за отзыв!");
      return true;
    } catch (err) {
      toast(errorMessage(err, "Не удалось отправить отзыв"), "error");
      return false;
    }
  };

  const update = async (data) => {
    try {
      const { data: review } = await updateReview(item.id, mine.id, data);
      setItem({ ...item, reviews: reviews.map((r) => (r.id === mine.id ? { ...r, ...review } : r)) });
      setEditing(false);
      toast("Отзыв обновлён");
      return true;
    } catch (err) {
      toast(errorMessage(err, "Не удалось обновить отзыв"), "error");
      return false;
    }
  };

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <div className="card mt">
      <div className="row-between" style={{ marginBottom: "1rem" }}>
        <div>
          <h3 className="mb-0">Отзывы</h3>
          {avg && (
            <span className="rating-line">
              <Stars value={avg} /> {avg.toFixed(1)} · {reviews.length}{" "}
              {plural(reviews.length, "отзыв", "отзыва", "отзывов")}
            </span>
          )}
        </div>
        {isClient && !mine && !writing && (
          <button className="btn btn-soft btn-sm" onClick={() => setWriting(true)}>
            <Pencil size={15} /> Написать отзыв
          </button>
        )}
      </div>

      {writing && <ReviewForm onSubmit={create} onCancel={() => setWriting(false)} />}
      {editing && mine && <ReviewForm initial={mine} onSubmit={update} onCancel={() => setEditing(false)} />}
      {!user && <p className="muted small">Войдите, чтобы оставить отзыв.</p>}

      {reviews.length === 0 ? (
        <p className="muted mb-0">Отзывов пока нет — станьте первым.</p>
      ) : (
        <ul className="reviews">
          {reviews.map((r) => (
            <li key={r.id || r._id}>
              <div className="review-head">
                <strong>{r.nickname || r.user?.nickname || "Аноним"}</strong>
                <Stars value={r.rating} size={13} />
                <span className="muted xsmall">{formatDate(r.createdAt, false)}</span>
                {mine && r.id === mine.id && !editing && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                    <Pencil size={14} /> Изменить
                  </button>
                )}
              </div>
              {r.comment && <p>{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConsultationDetail({ id }) {
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsultation(id)
      .then(({ data }) => setItem(data))
      .catch((err) => setError(errorMessage(err, "Консультация не найдена")));
  }, [id]);

  const back = (
    <a
      href="#/consultations"
      className="back-link"
      onClick={(e) => {
        e.preventDefault();
        navigate("consultations");
      }}
    >
      <ArrowLeft size={16} /> Все консультации
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
  if (!item) return <Loader />;

  const { name, role } = splitSpecialist(item.specialist);

  return (
    <section className="page">
      {back}
      <div className="detail-grid">
        <div>
          <div className="card">
            {item.tags?.length > 0 && (
              <div className="chips" style={{ marginBottom: "1rem" }}>
                {item.tags.map((t) => (
                  <button key={t} className="chip chip-accent" onClick={() => navigate(`consultations?tag=${t}`)}>
                    #{t}
                  </button>
                ))}
              </div>
            )}
            <h1 style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.2rem)" }}>{item.topic}</h1>
            <div className="meta-row" style={{ margin: "0.75rem 0 1.25rem" }}>
              <span><Clock size={16} /> {item.duration} минут</span>
              <span><Wallet size={16} /> {formatPrice(item.price)}</span>
              <span><CalendarCheck size={16} /> Онлайн</span>
            </div>
            <p style={{ fontSize: "1.05rem" }}>{item.description}</p>

            {item.specialist && (
              <div className="card card-soft mt row-between">
                <div className="specialist mb-0">
                  <Avatar name={name} large />
                  <div>
                    <strong>{name}</strong>
                    {role && <span>{role}</span>}
                  </div>
                </div>
                {item.psychologist?.id && (
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`specialists/${item.psychologist.id}`)}>
                    Анкета специалиста
                  </button>
                )}
              </div>
            )}

            <div className="alert alert-info mt mb-0">
              <Lock size={16} />
              <span>
                Встреча анонимна: специалист видит только ваш псевдоним и
                комментарий к записи. Email и другие данные не передаются.
              </span>
            </div>
          </div>
          <Reviews item={item} setItem={setItem} />
        </div>
        <BookingPanel consultation={item} />
      </div>
    </section>
  );
}

export default function CatalogPage({ param, query = {} }) {
  return param ? (
    <ConsultationDetail key={param} id={param} />
  ) : (
    <CatalogList key={query.tag || "all"} query={query} />
  );
}
