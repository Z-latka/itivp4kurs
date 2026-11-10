import { useState, useEffect, useCallback } from "react";
import {
  fetchConsultations,
  addConsultation,
  updateConsultation,
  deleteConsultation,
} from "../api";
import { CircleAlert, CircleCheck, Clock, Inbox, Plus, Wallet, X } from "lucide-react";
import { formatPrice } from "../labels";

// Теги вводятся через запятую: "тревога, стресс" → ["тревога", "стресс"]
const parseTags = (value) =>
  [...new Set(value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];

const INITIAL_FORM = {
  topic: "",
  description: "",
  duration: "",
  status: "available",
  price: "",
  psychologist: "",
  tags: "",
};

const DELAY = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (fn, retries = 3, delayMs = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err.response && err.response.status < 500) break;
      if (attempt < retries) {
        await DELAY(delayMs);
      }
    }
  }
  throw lastError;
};

const STATUS_LABELS = {
  available: "Доступна",
  active: "Активна",
  completed: "Завершена",
  busy: "Занята",
};

const STATUS_COLORS = {
  available: "#2e7d32",
  active: "#1565c0",
  completed: "#7d3c98",
  busy: "#c62828",
};

// psychologists — список психологов для выбора (режим администратора);
// ownerId — показывать и создавать только консультации этого психолога
export default function ConsultationsPage({ psychologists = null, ownerId = null }) {
  const specialistName = (id) => {
    const p = psychologists?.find((x) => x.id === id);
    return p ? [p.fullName, p.title].filter(Boolean).join(", ") : "";
  };
  const psychologistField = (value) => (psychologists ? { psychologist: value } : {});

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notify, setNotify] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const loadConsultations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestWithRetry(() =>
        fetchConsultations(ownerId ? { psychologist: ownerId } : undefined),
      );
      setConsultations(response.data);
    } catch (err) {
      setError(
        err.response
          ? err.response.data.message || "Ошибка загрузки списка консультаций"
          : "Сервер недоступен. Проверьте подключение к интернету.",
      );
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    (async () => {
      await loadConsultations();
    })();
  }, [loadConsultations]);

  const handleRetry = () => {
    loadConsultations();
  };

  const clearNotify = () => setNotify(null);

  const showNotify = (message, type = "error") => {
    setNotify({ message, type });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.topic.trim() || !String(form.duration).trim()) return;

    setNotify(null);
    const optimisticItem = {
      id: -Date.now(),
      topic: form.topic,
      description: form.description,
      duration: Number(form.duration),
      status: form.status,
      price: Number(form.price) || 0,
      specialist: specialistName(form.psychologist),
      tags: parseTags(form.tags),
      isOptimistic: true,
    };

    setConsultations((prev) => [optimisticItem, ...prev]);
    setForm(INITIAL_FORM);

    try {
      const response = await requestWithRetry(() =>
        addConsultation({
          topic: form.topic,
          description: form.description,
          duration: Number(form.duration),
          status: form.status,
          price: Number(form.price) || 0,
          ...psychologistField(form.psychologist),
          tags: parseTags(form.tags),
        }),
      );
      setConsultations((prev) =>
        prev.map((item) =>
          item.id === optimisticItem.id
            ? { ...response.data, isOptimistic: false }
            : item,
        ),
      );
    } catch (err) {
      setConsultations((prev) =>
        prev.filter(
          (item) => !(item.isOptimistic && item.id === optimisticItem.id),
        ),
      );
      showNotify(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Не удалось добавить консультацию",
      );
    }
  };

  const handleDelete = async (id) => {
    const item = consultations.find((c) => c.id === id);
    if (!item) return;

    setNotify(null);
    const removedItem = item;
    setConsultations((prev) => prev.filter((c) => c.id !== id));

    try {
      await requestWithRetry(() => deleteConsultation(id));
    } catch (err) {
      setConsultations((prev) => [removedItem, ...prev]);
      showNotify(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Не удалось удалить консультацию",
      );
    }
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setForm({
      topic: item.topic,
      description: item.description || "",
      duration: String(item.duration || ""),
      status: item.status,
      price: String(item.price || ""),
      psychologist: item.psychologist?.id || "",
      tags: (item.tags || []).join(", "),
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!form.topic.trim() || !String(form.duration).trim()) return;

    setNotify(null);
    const previous = consultations.find((c) => c.id === editingId);
    if (!previous) return;

    const optimisticUpdated = {
      ...previous,
      topic: form.topic,
      description: form.description,
      duration: Number(form.duration),
      status: form.status,
      price: Number(form.price) || 0,
      specialist: psychologists ? specialistName(form.psychologist) : previous.specialist,
      tags: parseTags(form.tags),
    };
    setConsultations((prev) =>
      prev.map((c) => (c.id === editingId ? optimisticUpdated : c)),
    );
    setEditingId(null);

    try {
      const response = await requestWithRetry(() =>
        updateConsultation(editingId, {
          topic: form.topic,
          description: form.description,
          duration: Number(form.duration),
          status: form.status,
          price: Number(form.price) || 0,
          ...psychologistField(form.psychologist),
          tags: parseTags(form.tags),
        }),
      );
      setConsultations((prev) =>
        prev.map((c) => (c.id === editingId ? response.data : c)),
      );
    } catch (err) {
      setConsultations((prev) =>
        prev.map((c) => (c.id === editingId ? previous : c)),
      );
      showNotify(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Не удалось обновить консультацию",
      );
    }
  };

  const statusKey = (item) => {
    const s = (item.status || "").toLowerCase();
    return STATUS_LABELS[s] ? s : "available";
  };

  return (
    <section className="page consultations">
      <div className="page-header">
        <div>
          <h2>{ownerId ? "Мои консультации" : "Каталог консультаций"}</h2>
          <p>Управление консультациями с сервером через REST API</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            const el = document.getElementById("add-form");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <Plus size={16} /> Новая консультация
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Загрузка консультаций с сервера…</p>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-error">
          <CircleAlert size={18} />
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline"
            onClick={handleRetry}
            style={{ marginLeft: "auto" }}
          >
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {notify && (
            <div className={`alert alert-${notify.type}`}>
              {notify.type === "error" ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
              <span>{notify.message}</span>
              <button
                className="icon-btn"
                onClick={clearNotify}
                aria-label="Закрыть"
                style={{ marginLeft: "auto", width: 28, height: 28, color: "inherit" }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{consultations.length}</div>
              <div className="stat-label">Всего консультаций</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {
                  consultations.filter(
                    (c) => (c.status || "").toLowerCase() === "active",
                  ).length
                }
              </div>
              <div className="stat-label">Активных</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {
                  consultations.filter(
                    (c) => (c.status || "").toLowerCase() === "completed",
                  ).length
                }
              </div>
              <div className="stat-label">Завершённых</div>
            </div>
          </div>

          <form
            id="add-form"
            onSubmit={handleAdd}
            className="add-form card"
            style={{ marginBottom: "2rem" }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
              Добавить консультацию
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Тема консультации</label>
                <input
                  type="text"
                  placeholder="Например: Работа с тревожностью"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <input
                  type="text"
                  placeholder="Краткое описание проблемы"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Длительность (мин)</label>
                <input
                  type="number"
                  placeholder="60"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Статус</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Активна</option>
                  <option value="completed">Завершена</option>
                  <option value="available">Доступна</option>
                  <option value="busy">Занята</option>
                </select>
              </div>
              {psychologists && (
                <div className="form-group">
                  <label>Психолог</label>
                  <select
                    value={form.psychologist}
                    onChange={(e) => setForm({ ...form, psychologist: e.target.value })}
                  >
                    <option value="">— не назначен —</option>
                    {psychologists.map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Теги (через запятую)</label>
                <input
                  type="text"
                  placeholder="тревога, стресс"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Цена (руб.)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="form-group form-group-full">
                <button type="submit" className="btn btn-primary">
                  Создать консультацию
                </button>
              </div>
            </div>
          </form>

          <div className="consultations-list">
            {consultations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Inbox size={28} /></div>
                <h3>Консультаций пока нет</h3>
                <p>Добавьте первую консультацию, используя форму выше.</p>
              </div>
            ) : (
              <ul className="cards-list">
                {consultations.map((item) => {
                  const isEditing = editingId === item.id;
                  const key = statusKey(item);
                  const color = STATUS_COLORS[key] || STATUS_COLORS.available;

                  if (isEditing) {
                    return (
                      <li key={item.id} className="card editing-card">
                        <form onSubmit={handleEditSave} className="edit-form">
                          <div className="form-grid">
                            <div className="form-group">
                              <label>Тема</label>
                              <input
                                type="text"
                                value={form.topic}
                                onChange={(e) =>
                                  setForm({ ...form, topic: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Описание</label>
                              <input
                                type="text"
                                value={form.description}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>Длительность (мин)</label>
                              <input
                                type="number"
                                value={form.duration}
                                onChange={(e) =>
                                  setForm({ ...form, duration: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Статус</label>
                              <select
                                value={form.status}
                                onChange={(e) =>
                                  setForm({ ...form, status: e.target.value })
                                }
                              >
                                <option value="active">Активна</option>
                                <option value="completed">Завершена</option>
                                <option value="available">Доступна</option>
                                <option value="busy">Занята</option>
                              </select>
                            </div>
                            {psychologists && (
                              <div className="form-group">
                                <label>Психолог</label>
                                <select
                                  value={form.psychologist}
                                  onChange={(e) =>
                                    setForm({ ...form, psychologist: e.target.value })
                                  }
                                >
                                  <option value="">— не назначен —</option>
                                  {psychologists.map((p) => (
                                    <option key={p.id} value={p.id}>{p.fullName}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="form-group">
                              <label>Теги (через запятую)</label>
                              <input
                                type="text"
                                value={form.tags}
                                onChange={(e) =>
                                  setForm({ ...form, tags: e.target.value })
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>Цена (руб.)</label>
                              <input
                                type="number"
                                value={form.price}
                                onChange={(e) =>
                                  setForm({ ...form, price: e.target.value })
                                }
                              />
                            </div>
                            <div className="form-group form-group-full">
                              <div className="form-actions">
                                <button
                                  type="submit"
                                  className="btn btn-success"
                                >
                                  Сохранить
                                </button>
                                <button
                                  type="button"
                                  onClick={handleEditCancel}
                                  className="btn btn-outline"
                                >
                                  Отмена
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  className="btn btn-danger btn-sm"
                                  style={{ marginLeft: "0.5rem" }}
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </div>
                        </form>
                      </li>
                    );
                  }

                  return (
                    <li key={item.id} className="card consultation-card">
                      <div className="card-header">
                        <div className="card-title-wrapper">
                          <span
                            className="status-badge"
                            style={{
                              background: `${color}15`,
                              color: color,
                              border: `1px solid ${color}40`,
                            }}
                          >
                            {STATUS_LABELS[key] || key}
                          </span>
                          <h3 className="card-title">{item.topic}</h3>
                        </div>
                        <div className="card-meta">
                          <span className="row" style={{ gap: "0.25rem" }}><Wallet size={13} /> {formatPrice(item.price)}</span>
                          <span className="row" style={{ gap: "0.25rem" }}><Clock size={13} /> {item.duration} мин</span>
                        </div>
                      </div>
                      <div className="card-body">
                        {item.specialist && (
                          <p className="specialist">{item.specialist}</p>
                        )}
                        <p className="card-description">
                          {item.description || "Описание не указано"}
                        </p>
                        {item.tags?.length > 0 && (
                          <div className="chips">
                            {item.tags.map((t) => (
                              <span key={t} className="chip chip-accent">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="card-footer">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleEditStart(item)}
                        >
                          Редактировать
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
