// Общие подписи и форматтеры интерфейса

export const BOOKING_STATUS = {
  pending: { label: "Ожидает подтверждения", color: "#ef6c00" },
  confirmed: { label: "Подтверждена", color: "#1565c0" },
  completed: { label: "Завершена", color: "#2e7d32" },
  cancelled: { label: "Отменена", color: "#8a7f9a" },
};

export const QUESTION_STATUS = {
  open: { label: "Ждёт ответа", color: "#ef6c00" },
  answered: { label: "Есть ответ", color: "#2e7d32" },
  closed: { label: "Закрыто", color: "#8a7f9a" },
};

export const FORMATS = {
  chat: "💬 Чат",
  video: "🎥 Видеосвязь",
  audio: "📞 Аудиозвонок",
};

export const formatDate = (value, withTime = true) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

export const formatPrice = (price) =>
  Number(price) > 0 ? `${Number(price)} руб.` : "Бесплатно";
