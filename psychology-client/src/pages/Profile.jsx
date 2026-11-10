import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  NotebookPen,
  Settings,
  Trash2,
} from "lucide-react";
import {
  cancelBooking,
  deleteMood,
  errorMessage,
  fetchFeelings,
  fetchMoods,
  fetchMyBookings,
  fetchMyResults,
  saveMood,
  updateProfile,
} from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import { useToast } from "../toast/context";
import ConfirmDialog from "../components/ConfirmDialog";
import { Avatar, Badge, EmptyState, Loader, MoodPicker, Sparkline } from "../components/ui";
import {
  BOOKING_STATUS,
  FORMATS,
  TEST_ICONS,
  formatDate,
  formatPrice,
  formatShortDate,
  formatTime,
  localDateKey,
  moodOf,
} from "../labels";

const bid = (b) => b.id || b._id;

const TABS = {
  overview: { label: "Обзор", icon: LayoutDashboard },
  bookings: { label: "Записи", icon: CalendarDays },
  mood: { label: "Дневник настроения", icon: NotebookPen },
  tests: { label: "Тесты", icon: ClipboardList },
  settings: { label: "Настройки", icon: Settings },
};

const isUpcoming = (b) =>
  ["pending", "confirmed"].includes(b.status) && new Date(b.scheduledAt) > new Date();

// ===== Записи =====

function BookingRow({ booking, onCancel }) {
  const status = BOOKING_STATUS[booking.status] || BOOKING_STATUS.pending;
  const c = booking.consultation || {};
  const date = new Date(booking.scheduledAt);
  const Format = FORMATS[booking.format]?.icon;
  return (
    <li className="card list-row">
      <div className={`date-tile${isUpcoming(booking) ? "" : " past"}`}>
        <strong>{date.getDate()}</strong>
        <small>{date.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "")}</small>
      </div>
      <div className="list-row-main">
        <strong className="ellipsis">{c.topic || "Консультация удалена"}</strong>
        <span className="meta-row">
          <span>{formatTime(date)}</span>
          {Format && <span><Format size={14} /> {FORMATS[booking.format].label}</span>}
          {c.price !== undefined && <span>{formatPrice(c.price)}</span>}
        </span>
        {c.specialist && <span className="muted xsmall">{c.specialist}</span>}
      </div>
      <div className="list-row-side">
        <Badge color={status.color}>{status.label}</Badge>
        {onCancel && isUpcoming(booking) && (
          <button className="btn btn-sm btn-ghost btn-danger-ghost" onClick={() => onCancel(booking)}>
            Отменить
          </button>
        )}
      </div>
    </li>
  );
}

function BookingsTab({ bookings, onCancel }) {
  const upcoming = bookings.filter(isUpcoming).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const past = bookings.filter((b) => !isUpcoming(b));

  if (bookings.length === 0) {
    return (
      <EmptyState icon={CalendarDays} title="Записей пока нет" text="Выберите консультацию и удобное время — первая встреча бесплатна.">
        <button className="btn btn-primary" onClick={() => navigate("consultations")}>Выбрать консультацию</button>
      </EmptyState>
    );
  }

  return (
    <div className="stack">
      <h3 className="mb-0">Предстоящие</h3>
      {upcoming.length === 0 ? (
        <p className="muted">Нет предстоящих встреч. <a href="#/consultations">Записаться</a></p>
      ) : (
        <ul className="list">
          {upcoming.map((b) => <BookingRow key={bid(b)} booking={b} onCancel={onCancel} />)}
        </ul>
      )}
      {past.length > 0 && (
        <>
          <h3 className="mb-0 mt">История</h3>
          <ul className="list">
            {past.map((b) => <BookingRow key={bid(b)} booking={b} />)}
          </ul>
        </>
      )}
    </div>
  );
}

// ===== Дневник настроения =====

function MoodChart({ entries }) {
  const days = useMemo(() => {
    const byDate = Object.fromEntries(entries.map((e) => [e.date, e]));
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return { date: d, entry: byDate[localDateKey(d)] };
    });
  }, [entries]);

  return (
    <div className="mood-chart" aria-label="Настроение за 14 дней">
      {days.map(({ date, entry }) => {
        const mood = entry && moodOf(entry.mood);
        return (
          <div className="mood-bar" key={date.toISOString()} title={entry ? `${formatShortDate(date)}: ${mood.label}` : formatShortDate(date)}>
            <div style={{ height: entry ? `${entry.mood * 20}%` : "6%", background: mood ? mood.color : undefined }} />
            <small>{date.getDate()}</small>
          </div>
        );
      })}
    </div>
  );
}

function MoodTab() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [feelings, setFeelings] = useState([]);
  const [form, setForm] = useState({ mood: null, feelings: [], note: "" });
  const [saving, setSaving] = useState(false);
  const today = localDateKey();

  const load = useCallback(
    () =>
      fetchMoods(30)
        .then(({ data: d }) => {
          setData(d);
          const todays = d.entries.find((e) => e.date === today);
          if (todays) setForm({ mood: todays.mood, feelings: todays.feelings, note: todays.note || "" });
        })
        .catch((err) => toast(errorMessage(err), "error")),
    [today, toast],
  );

  useEffect(() => {
    load();
    fetchFeelings().then(({ data: f }) => setFeelings(f)).catch(() => {});
  }, [load]);

  const toggleFeeling = (f) =>
    setForm((prev) => ({
      ...prev,
      feelings: prev.feelings.includes(f) ? prev.feelings.filter((x) => x !== f) : [...prev.feelings, f],
    }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveMood({ ...form, date: today });
      toast("Запись за сегодня сохранена");
      await load();
    } catch (err) {
      toast(errorMessage(err, "Не удалось сохранить"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry) => {
    try {
      await deleteMood(entry.id);
      if (entry.date === today) setForm({ mood: null, feelings: [], note: "" });
      await load();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  if (!data) return <Loader />;
  const hasToday = data.entries.some((e) => e.date === today);
  const avgMood = data.average && moodOf(data.average);

  return (
    <div className="detail-grid">
      <div className="stack">
        <form className="card" onSubmit={handleSave}>
          <h3>Как прошёл сегодняшний день?</h3>
          <p className="muted small mb-0">Одна запись в день. Повторное сохранение обновит её.</p>
          <MoodPicker value={form.mood} onChange={(mood) => setForm({ ...form, mood })} />
          {feelings.length > 0 && (
            <div className="form-group mt">
              <span className="label">Что вы чувствовали?</span>
              <div className="chips">
                {feelings.map((f) => (
                  <button
                    type="button"
                    key={f}
                    className={`chip${form.feelings.includes(f) ? " active" : ""}`}
                    onClick={() => toggleFeeling(f)}
                    aria-pressed={form.feelings.includes(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="mood-note">Заметка <span className="muted">(видите только вы)</span></label>
            <textarea
              id="mood-note"
              rows={3}
              maxLength={1000}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Что повлияло на настроение? Что помогло?"
            />
          </div>
          <button className="btn btn-primary" disabled={!form.mood || saving}>
            {hasToday ? "Обновить запись" : "Сохранить"}
          </button>
        </form>

        <div className="card">
          <h3>История</h3>
          {data.entries.length === 0 ? (
            <p className="muted mb-0">Записей пока нет. Начните с сегодняшнего дня.</p>
          ) : (
            <ul className="reviews">
              {data.entries.map((e) => {
                const mood = moodOf(e.mood);
                const Icon = mood.icon;
                return (
                  <li key={e.id}>
                    <div className="row-between">
                      <span className="row">
                        <Icon size={20} color={mood.color} />
                        <strong>{formatDate(`${e.date}T00:00`, false)}</strong>
                        <span className="muted small">{mood.label}</span>
                      </span>
                      <button className="icon-btn" onClick={() => handleDelete(e)} aria-label="Удалить запись" title="Удалить">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {e.feelings?.length > 0 && (
                      <div className="chips mt-sm">
                        {e.feelings.map((f) => <span key={f} className="chip feeling-tag">{f}</span>)}
                      </div>
                    )}
                    {e.note && <p className="small">{e.note}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="stack side-card">
        <div className="card">
          <h3>Последние 14 дней</h3>
          <MoodChart entries={data.entries} />
        </div>
        <div className="card">
          <h3>За месяц</h3>
          {data.count === 0 ? (
            <p className="muted mb-0">Здесь появится сводка, когда наберётся несколько записей.</p>
          ) : (
            <>
              <p className="mb-0">
                Среднее настроение: <strong style={{ color: avgMood.color }}>{avgMood.label}</strong>{" "}
                <span className="muted">({data.average} из 5, записей: {data.count})</span>
              </p>
              {data.topFeelings.length > 0 && (
                <>
                  <p className="muted small mt-sm mb-0">Чаще всего:</p>
                  <div className="chips mt-sm">
                    {data.topFeelings.map((f) => (
                      <span key={f.feeling} className="chip">{f.feeling} · {f.count}</span>
                    ))}
                  </div>
                </>
              )}
              {data.average < 2.5 && (
                <div className="alert alert-warning mt mb-0">
                  <span>
                    В последнее время настроение чаще низкое. Возможно, стоит
                    обсудить это с психологом — <a href="#/ask">задайте вопрос анонимно</a>.
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Тесты =====

function TestsTab({ results }) {
  const groups = useMemo(() => {
    const map = {};
    results.forEach((r) => {
      (map[r.testId] ||= { testId: r.testId, title: r.testTitle, items: [] }).items.push(r);
    });
    return Object.values(map);
  }, [results]);

  if (results.length === 0) {
    return (
      <EmptyState icon={ClipboardList} title="Тесты ещё не пройдены" text="Пройдите тест — результаты сохранятся здесь, и можно будет следить за динамикой.">
        <button className="btn btn-primary" onClick={() => navigate("tests")}>Выбрать тест</button>
      </EmptyState>
    );
  }

  return (
    <div className="grid-2">
      {groups.map((g) => {
        const Icon = TEST_ICONS[g.testId] || ClipboardList;
        const [latest] = g.items;
        const chronological = [...g.items].reverse();
        return (
          <div key={g.testId} className="card">
            <div className="row-between">
              <div className="icon-tile sm"><Icon size={18} /></div>
              <Sparkline values={chronological.map((r) => r.score)} max={latest.maxScore} />
            </div>
            <h3 className="mt-sm">{g.title}</h3>
            <p className="mb-0">
              <strong>{latest.levelTitle}</strong>{" "}
              <span className="muted">· {latest.score} из {latest.maxScore}</span>
            </p>
            <p className="muted small">
              {g.items.length > 1 ? `Пройден ${g.items.length} раз, последний — ` : "Пройден "}
              {formatDate(latest.takenAt, false)}
            </p>
            <ul className="reviews">
              {g.items.slice(0, 4).map((r) => (
                <li key={r.id} className="row-between small" style={{ padding: "0.5rem 0" }}>
                  <span className="muted">{formatDate(r.takenAt)}</span>
                  <span>{r.score} · {r.levelTitle}</span>
                </li>
              ))}
            </ul>
            <button className="btn btn-soft btn-sm mt-sm" onClick={() => navigate(`tests/${g.testId}`)}>
              Пройти снова <ArrowRight size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ===== Настройки =====

function SettingsTab() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    nickname: user.nickname || "",
    city: user.profile?.city || "",
    about: user.profile?.about || "",
  });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await updateProfile(form);
      setUser(data);
      toast("Профиль сохранён");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(pwd);
      setPwd({ currentPassword: "", newPassword: "" });
      toast("Пароль изменён");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <div className="grid-2">
      <form className="card" onSubmit={saveProfile}>
        <h3>Профиль</h3>
        <p className="muted small">{user.email} · {user.role === "admin" ? "психолог" : "клиент"}</p>
        <div className="form-group">
          <label htmlFor="s-nick">Псевдоним</label>
          <input id="s-nick" value={form.nickname} maxLength={40} onChange={(e) => setForm({ ...form, nickname: e.target.value })} required />
          <div className="hint">Его видит психолог в записях и переписке.</div>
        </div>
        <div className="form-group">
          <label htmlFor="s-city">Город <span className="muted">(необязательно)</span></label>
          <input id="s-city" value={form.city} maxLength={60} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="s-about">О себе <span className="muted">(необязательно)</span></label>
          <textarea id="s-about" rows={3} maxLength={500} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
        </div>
        <button className="btn btn-primary">Сохранить</button>
      </form>

      <form className="card" onSubmit={savePassword}>
        <h3>Смена пароля</h3>
        <div className="form-group mt-sm">
          <label htmlFor="s-cur">Текущий пароль</label>
          <input id="s-cur" type="password" autoComplete="current-password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} required />
        </div>
        <div className="form-group">
          <label htmlFor="s-new">Новый пароль</label>
          <input id="s-new" type="password" autoComplete="new-password" minLength={6} value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required />
          <div className="hint">Не меньше 6 символов.</div>
        </div>
        <button className="btn btn-outline">Изменить пароль</button>
      </form>
    </div>
  );
}

// ===== Обзор =====

function OverviewTab({ bookings, results }) {
  const next = bookings.filter(isUpcoming).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];
  const lastTest = results[0];

  return (
    <div className="grid-2">
      <div className="card">
        <div className="icon-tile"><CalendarDays size={22} /></div>
        <h3>Ближайшая встреча</h3>
        {next ? (
          <>
            <p className="mb-0"><strong>{next.consultation?.topic}</strong></p>
            <p className="muted">{formatDate(next.scheduledAt)} · {FORMATS[next.format]?.label}</p>
            <Badge color={(BOOKING_STATUS[next.status] || BOOKING_STATUS.pending).color}>
              {(BOOKING_STATUS[next.status] || BOOKING_STATUS.pending).label}
            </Badge>
          </>
        ) : (
          <>
            <p className="muted">Запланированных встреч нет.</p>
            <button className="btn btn-soft btn-sm" onClick={() => navigate("consultations")}>Записаться</button>
          </>
        )}
      </div>
      <div className="card">
        <div className="icon-tile warm"><NotebookPen size={22} /></div>
        <h3>Дневник настроения</h3>
        <p className="muted">Отмечайте настроение каждый день — так легче заметить, что на него влияет.</p>
        <button className="btn btn-soft btn-sm" onClick={() => navigate("profile?tab=mood")}>
          Отметить сегодня <ArrowRight size={15} />
        </button>
      </div>
      <div className="card">
        <div className="icon-tile lavender"><ClipboardList size={22} /></div>
        <h3>Последний тест</h3>
        {lastTest ? (
          <>
            <p className="mb-0"><strong>{lastTest.testTitle}</strong></p>
            <p className="muted">{lastTest.levelTitle} · {formatDate(lastTest.takenAt, false)}</p>
            <button className="btn btn-soft btn-sm" onClick={() => navigate("profile?tab=tests")}>Вся история</button>
          </>
        ) : (
          <>
            <p className="muted">Вы ещё не проходили тесты.</p>
            <button className="btn btn-soft btn-sm" onClick={() => navigate("tests")}>Пройти тест</button>
          </>
        )}
      </div>
      <div className="card">
        <div className="icon-tile"><MessageCircle size={22} /></div>
        <h3>Вопрос психологу</h3>
        <p className="muted">Можно написать анонимно — ответ придёт в раздел обращений.</p>
        <button className="btn btn-soft btn-sm" onClick={() => navigate("ask")}>Мои обращения</button>
      </div>
    </div>
  );
}

export default function ProfilePage({ query = {} }) {
  const { user } = useAuth();
  const toast = useToast();
  // Сотрудникам в кабинете нужны только настройки аккаунта
  const tabs = user.role === "user" ? TABS : { settings: TABS.settings };
  const tab = tabs[query.tab] ? query.tab : Object.keys(tabs)[0];
  const [bookings, setBookings] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toCancel, setToCancel] = useState(null);

  useEffect(() => {
    Promise.all([fetchMyBookings(), fetchMyResults()])
      .then(([b, r]) => {
        setBookings(b.data);
        setResults(r.data);
      })
      .catch((err) => toast(errorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleCancel = async () => {
    const booking = toCancel;
    setToCancel(null);
    try {
      const { data } = await cancelBooking(bid(booking));
      setBookings((prev) => prev.map((b) => (bid(b) === bid(booking) ? { ...b, status: data.status } : b)));
      toast("Запись отменена");
    } catch (err) {
      toast(errorMessage(err, "Не удалось отменить запись"), "error");
    }
  };

  const upcomingCount = bookings.filter(isUpcoming).length;

  return (
    <section className="page">
      <div className="page-header">
        <div className="row" style={{ gap: "1rem" }}>
          <Avatar name={user.nickname} large />
          <div>
            <h1 className="mb-0">{user.nickname}</h1>
            <p className="mb-0">Личный кабинет · психолог видит только ваш псевдоним</p>
          </div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {Object.entries(tabs).map(([key, t]) => {
          const Icon = t.icon;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              className={`tab${tab === key ? " active" : ""}`}
              onClick={() => navigate(key === "overview" ? "profile" : `profile?tab=${key}`)}
            >
              <Icon size={16} /> {t.label}
              {key === "bookings" && upcomingCount > 0 && <span className="count">{upcomingCount}</span>}
            </button>
          );
        })}
      </div>

      {loading && tab !== "mood" && tab !== "settings" ? (
        <Loader />
      ) : (
        <>
          {tab === "overview" && <OverviewTab bookings={bookings} results={results} />}
          {tab === "bookings" && <BookingsTab bookings={bookings} onCancel={setToCancel} />}
          {tab === "mood" && <MoodTab />}
          {tab === "tests" && <TestsTab results={results} />}
          {tab === "settings" && <SettingsTab />}
        </>
      )}

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Отменить запись?"
        text={toCancel ? `${toCancel.consultation?.topic || "Консультация"}, ${formatDate(toCancel.scheduledAt)}` : ""}
        confirmLabel="Отменить запись"
        danger
        onConfirm={handleCancel}
        onCancel={() => setToCancel(null)}
      />
    </section>
  );
}
