import React, { useState, useEffect } from "react";

const INITIAL_CONSULTATIONS = [
  {
    id: 1,
    clientName: "Анна Смирнова",
    topic: "Тревожность и стресс",
    status: "Активна",
    date: "2026-10-15",
  },
  {
    id: 2,
    clientName: "Иван Петров",
    topic: "Профессиональное выгорание",
    status: "Завершена",
    date: "2026-10-14",
  },
];

export default function ConsultationList() {
  const [consultations, setConsultations] = useState(() => {
    const saved = localStorage.getItem("psychology_consultations");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Ошибка чтения localStorage", e);
      }
    }
    return INITIAL_CONSULTATIONS;
  });

  const [clientName, setClientName] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("Активна");
  const [filterStatus, setFilterStatus] = useState("Все");

  useEffect(() => {
    localStorage.setItem(
      "psychology_consultations",
      JSON.stringify(consultations),
    );
  }, [consultations]);

  useEffect(() => {
    document.title = `Консультаций: ${consultations.length}`;
  }, [consultations.length]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!clientName.trim() || !topic.trim()) return;

    const newItem = {
      id: Date.now(),
      clientName,
      topic,
      status,
      date: new Date().toISOString().split("T")[0],
    };

    setConsultations([newItem, ...consultations]);
    setClientName("");
    setTopic("");
  };

  const handleDelete = (id) => {
    setConsultations(consultations.filter((item) => item.id !== id));
  };

  const filteredConsultations = consultations.filter((item) => {
    if (filterStatus === "Все") return true;
    return item.status === filterStatus;
  });

  const totalCount = consultations.length;
  const activeCount = consultations.filter(
    (i) => i.status === "Активна",
  ).length;

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>Управление консультациями</h2>

      <div
        style={{
          background: "#f4f4f4",
          padding: "10px",
          marginBottom: "15px",
          borderRadius: "5px",
        }}
      >
        <p>
          Всего записей: <strong>{totalCount}</strong> | Активных:{" "}
          <strong>{activeCount}</strong>
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Имя клиента..."
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Тема консультации..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Активна">Активна</option>
          <option value="Завершена">Завершена</option>
        </select>
        <button
          type="submit"
          style={{
            padding: "8px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Добавить консультацию
        </button>
      </form>

      <div style={{ marginBottom: "15px" }}>
        <label>Фильтр по статусу: </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="Все">Все</option>
          <option value="Активна">Активные</option>
          <option value="Завершена">Завершенные</option>
        </select>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredConsultations.length === 0 ? (
          <p>Список пуст</p>
        ) : (
          filteredConsultations.map((item) => (
            <li
              key={item.id}
              style={{
                border: "1px solid #ddd",
                padding: "10px",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{item.clientName}</strong> — {item.topic}
                <span style={{ fontSize: "0.85em", color: "#666" }}>
                  {" "}
                  [{item.status}] ({item.date})
                </span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                style={{
                  background: "#dc3545",
                  color: "#fff",
                  border: "none",
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                Удалить
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
