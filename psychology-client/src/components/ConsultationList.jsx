import { useState, useEffect, useCallback } from "react";
import {
  fetchConsultations,
  addConsultation,
  updateConsultation,
  deleteConsultation,
} from "../api";

const INITIAL_FORM = {
  topic: "",
  description: "",
  duration: "",
  status: "Активна",
  price: "",
};

const DELAY = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Дополнительное улучшение: повтор запроса при ошибке (до 3 попыток с задержкой)
const requestWithRetry = async (fn, retries = 3, delayMs = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await DELAY(delayMs);
      }
    }
  }
  throw lastError;
};

export default function ConsultationList() {
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
      const response = await requestWithRetry(() => fetchConsultations());
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
  }, []);

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
    if (!form.topic.trim() || !form.duration.trim()) return;

    setNotify(null);
    const optimisticItem = {
      id: -Date.now(),
      topic: form.topic,
      description: form.description,
      duration: Number(form.duration),
      status: form.status,
      price: Number(form.price) || 0,
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
        }),
      );
      setConsultations((prev) =>
        prev.map((item) =>
          item.isOptimistic ? { ...response.data, isOptimistic: false } : item,
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
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!form.topic.trim() || !form.duration.trim()) return;

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

  if (loading) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "40px auto",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
          color: "#666",
        }}
      >
        Загрузка данных…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "40px auto",
          fontFamily: "Arial, sans-serif",
          padding: "20px",
          background: "#ffe6e6",
          border: "1px solid #dc3545",
          borderRadius: "5px",
        }}
      >
        <h2>Ошибка загрузки</h2>
        <p>{error}</p>
        <button onClick={handleRetry} style={{ padding: "8px 16px", cursor: "pointer", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px" }}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "20px auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Управление консультациями</h2>

      <div style={{ marginBottom: "15px", fontSize: "0.9em", color: "#555" }}>
        Всего записей: <strong>{consultations.length}</strong>
      </div>

      {notify && (
        <div
          style={{
            padding: "10px",
            background: notify.type === "error" ? "#ffe6e6" : "#e6f7e6",
            border: `1px solid ${notify.type === "error" ? "#dc3545" : "#28a745"}`,
            borderRadius: "5px",
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {notify.message}
          <button onClick={clearNotify} style={{ cursor: "pointer", background: "none", border: "none", fontSize: "1.2em" }}>
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Тема консультации..."
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Описание..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Длительность (мин)"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          required
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="Активна">Активна</option>
          <option value="Завершена">Завершена</option>
        </select>
        <input
          type="number"
          placeholder="Цена"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <button
          type="submit"
          style={{ padding: "8px", background: "#007bff", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Добавить консультацию
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {consultations.length === 0 ? (
          <p>Список пуст</p>
        ) : (
          consultations.map((item) => {
            const isEditing = editingId === item.id;
            if (isEditing) {
              return (
                <li key={item.id} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <form onSubmit={handleEditSave} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <input
                      type="text"
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                    <input
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      required
                    />
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="Активна">Активна</option>
                      <option value="Завершена">Завершена</option>
                    </select>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" style={{ padding: "6px 12px", background: "#28a745", color: "#fff", border: "none", cursor: "pointer" }}>Сохранить</button>
                      <button type="button" onClick={handleEditCancel} style={{ padding: "6px 12px", background: "#6c757d", color: "#fff", border: "none", cursor: "pointer" }}>Отмена</button>
                    </div>
                  </form>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ alignSelf: "flex-end", background: "#dc3545", color: "#fff", border: "none", padding: "5px 10px", cursor: "pointer" }}
                  >
                    Удалить
                  </button>
                </li>
              );
            }
            return (
              <li key={item.id} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{item.topic}</strong> — {item.description || ""}
                  <span style={{ fontSize: "0.85em", color: "#666" }}>
                    {" "}
                    [{item.status}] ({item.duration} мин, {item.price || 0} руб.)
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleEditStart(item)}
                    style={{ padding: "5px 10px", background: "#007bff", color: "#fff", border: "none", cursor: "pointer" }}
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ padding: "5px 10px", background: "#dc3545", color: "#fff", border: "none", cursor: "pointer" }}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
