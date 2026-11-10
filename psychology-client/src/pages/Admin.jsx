import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  LayoutList,
  Lock,
  MessageCircle,
  Pencil,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import {
  adminCreatePsychologist,
  adminFetchPsychologists,
  adminUpdatePsychologist,
  errorMessage,
  fetchAdminStats,
} from "../api";
import { navigate } from "../router";
import { useToast } from "../toast/context";
import BookingsBoard from "../components/BookingsBoard";
import ConsultationsPage from "../components/ConsultationList";
import ConfirmDialog from "../components/ConfirmDialog";
import { Avatar, Badge, EmptyState, Loader, PageHeader } from "../components/ui";
import { BOOKING_STATUS, QUESTION_STATUS, formatDate } from "../labels";

const TABS = {
  overview: { label: "Обзор", icon: LayoutDashboard },
  psychologists: { label: "Психологи", icon: Stethoscope },
  catalog: { label: "Каталог", icon: LayoutList },
  bookings: { label: "Все записи", icon: CalendarDays },
};

function Bars({ data, labels }) {
  const entries = Object.entries(labels).map(([key, l]) => [l, data[key] || 0]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="bar-list">
      {entries.map(([l, v]) => (
        <div key={l.label} className="bar-row">
          <span>{l.label}</span>
          <strong>{v}</strong>
          <div className="bar"><div style={{ width: `${(v / max) * 100}%`, background: l.color }} /></div>
        </div>
      ))}
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminStats()
      .then(({ data }) => setStats(data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <Loader />;

  const tiles = [
    { icon: Users, value: stats.users.user || 0, label: "Клиентов" },
    { icon: Stethoscope, value: stats.users.psychologist || 0, label: "Психологов" },
    {
      icon: CalendarDays,
      value: Object.values(stats.bookings).reduce((a, b) => a + b, 0),
      label: "Записей всего",
    },
    { icon: MessageCircle, value: stats.questions.queue, label: "Вопросов без психолога", warm: stats.questions.queue > 0 },
  ];

  return (
    <>
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
      <div className="grid-3">
        <div className="card">
          <h3>Записи по статусам</h3>
          <Bars data={stats.bookings} labels={BOOKING_STATUS} />
        </div>
        <div className="card">
          <h3>Обращения</h3>
          <Bars data={stats.questions} labels={QUESTION_STATUS} />
          <p className="hint mt mb-0">
            <Lock size={12} /> Содержание переписки администратору недоступно — оно конфиденциально.
          </p>
        </div>
        <div className="card">
          <h3>Популярные консультации</h3>
          {stats.popular.length === 0 ? (
            <p className="muted mb-0">Записей пока нет.</p>
          ) : (
            <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>
              {stats.popular.map((p) => (
                <li key={p.id} style={{ marginBottom: "0.4rem" }}>
                  <a href={`#/consultations/${p.id}`}>{p.topic}</a>{" "}
                  <span className="muted small">— {p.bookings}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}

const EMPTY_PSY = { email: "", password: "", fullName: "", title: "", experienceYears: "", approach: "" };

function PsychologistForm({ initial, onSaved, onCancel }) {
  const toast = useToast();
  const editing = Boolean(initial);
  const [form, setForm] = useState(
    initial
      ? {
          fullName: initial.fullName || "",
          title: initial.title || "",
          experienceYears: initial.experienceYears ?? "",
          approach: initial.approach || "",
        }
      : EMPTY_PSY,
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      experienceYears: form.experienceYears === "" ? undefined : Number(form.experienceYears),
    };
    try {
      if (editing) {
        await adminUpdatePsychologist(initial.id, payload);
        toast("Анкета обновлена");
      } else {
        await adminCreatePsychologist(payload);
        toast(`Аккаунт ${form.email} создан`);
      }
      onSaved();
    } catch (err) {
      toast(errorMessage(err), "error");
      setSaving(false);
    }
  };

  const input = (name, label, props = {}) => (
    <div className="form-group">
      <label htmlFor={`psy-${name}`}>{label}</label>
      <input
        id={`psy-${name}`}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        {...props}
      />
    </div>
  );

  return (
    <form className="card mb-0" onSubmit={submit} style={{ marginBottom: "1.5rem" }}>
      <h3>{editing ? `Анкета: ${initial.fullName}` : "Новый психолог"}</h3>
      <div className="form-grid mt-sm">
        {!editing && input("email", "Email для входа", { type: "email", required: true, autoComplete: "off" })}
        {!editing && input("password", "Временный пароль", { type: "text", required: true, minLength: 6, autoComplete: "off" })}
        {input("fullName", "Имя и фамилия", { required: true, maxLength: 80 })}
        {input("title", "Специализация", { maxLength: 80, placeholder: "КПТ-терапевт" })}
        {input("experienceYears", "Опыт, лет", { type: "number", min: 0, max: 60 })}
        {input("approach", "Метод работы", { maxLength: 120 })}
      </div>
      {!editing && (
        <p className="hint">Передайте психологу email и временный пароль — он сменит пароль в настройках и дополнит анкету сам.</p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={saving}>{editing ? "Сохранить" : "Создать аккаунт"}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  );
}

function PsychologistsTab() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [mode, setMode] = useState(null); // null | "new" | объект психолога
  const [toToggle, setToToggle] = useState(null);

  const load = useCallback(
    () =>
      adminFetchPsychologists()
        .then(({ data }) => setList(data))
        .catch((err) => toast(errorMessage(err), "error")),
    [toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    const p = toToggle;
    setToToggle(null);
    try {
      await adminUpdatePsychologist(p.id, { active: !p.active });
      toast(p.active ? `${p.fullName}: аккаунт отключён` : `${p.fullName}: аккаунт включён`);
      load();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <>
      <div className="row-between" style={{ marginBottom: "1.25rem" }}>
        <p className="muted mb-0">Аккаунты психологов создаёт только администратор — самостоятельная регистрация специалистов закрыта.</p>
        {!mode && (
          <button className="btn btn-primary" onClick={() => setMode("new")}>
            <UserPlus size={16} /> Добавить психолога
          </button>
        )}
      </div>
      {mode && (
        <PsychologistForm
          key={mode === "new" ? "new" : mode.id}
          initial={mode === "new" ? null : mode}
          onSaved={() => {
            setMode(null);
            load();
          }}
          onCancel={() => setMode(null)}
        />
      )}
      {!list && <Loader />}
      {list && list.length === 0 && <EmptyState icon={Stethoscope} title="Психологов пока нет" />}
      <ul className="list mt">
        {list?.map((p) => (
          <li key={p.id} className={`card list-row staff-row${p.active ? "" : " inactive"}`}>
            <Avatar name={p.fullName} />
            <div className="list-row-main">
              <strong>{p.fullName}</strong>
              <span className="muted small">{p.title} · {p.email}</span>
              <span className="muted xsmall">
                Консультаций: {p.consultations} · предстоящих записей: {p.upcoming} · с {formatDate(p.createdAt, false)}
              </span>
            </div>
            <div className="list-row-side">
              <Badge color={p.active ? "#2e7d4f" : "#8a948f"}>{p.active ? "Активен" : "Отключён"}</Badge>
              <button className="btn btn-ghost btn-sm" onClick={() => setMode(p)}>
                <Pencil size={14} /> Анкета
              </button>
              <button
                className={`btn btn-sm ${p.active ? "btn-ghost btn-danger-ghost" : "btn-soft"}`}
                onClick={() => setToToggle(p)}
              >
                {p.active ? "Отключить" : "Включить"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={Boolean(toToggle)}
        title={toToggle?.active ? "Отключить психолога?" : "Включить психолога?"}
        text={
          toToggle?.active
            ? "Он не сможет войти, исчезнет со страницы специалистов, а запись на его консультации закроется."
            : "Психолог снова сможет входить, а его консультации откроются для записи."
        }
        confirmLabel={toToggle?.active ? "Отключить" : "Включить"}
        danger={toToggle?.active}
        onConfirm={toggle}
        onCancel={() => setToToggle(null)}
      />
    </>
  );
}

function CatalogTab() {
  const [psychologists, setPsychologists] = useState(null);

  useEffect(() => {
    adminFetchPsychologists()
      .then(({ data }) => setPsychologists(data.filter((p) => p.active)))
      .catch(() => setPsychologists([]));
  }, []);

  if (!psychologists) return <Loader />;
  return <ConsultationsPage psychologists={psychologists} />;
}

export default function AdminPage({ query = {} }) {
  const tab = TABS[query.tab] ? query.tab : "overview";

  return (
    <section className="page">
      <PageHeader
        eyebrow="Администрирование"
        title="Управление сервисом"
        subtitle="Специалисты, каталог консультаций, записи и статистика."
      />
      <div className="tabs" role="tablist">
        {Object.entries(TABS).map(([key, t]) => {
          const Icon = t.icon;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              className={`tab${tab === key ? " active" : ""}`}
              onClick={() => navigate(key === "overview" ? "admin" : `admin?tab=${key}`)}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === "overview" && <OverviewTab />}
      {tab === "psychologists" && <PsychologistsTab />}
      {tab === "catalog" && <CatalogTab />}
      {tab === "bookings" && <BookingsBoard showPsychologist />}
    </section>
  );
}
