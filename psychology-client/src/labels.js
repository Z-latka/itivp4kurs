import {
  Activity,
  CloudRain,
  Flame,
  MoonStar,
  MessageCircle,
  Video,
  Phone,
  Frown,
  Annoyed,
  Meh,
  Smile,
  Laugh,
} from "lucide-react";

export const BOOKING_STATUS = {
  pending: { label: "Ожидает подтверждения", color: "#c47a12" },
  confirmed: { label: "Подтверждена", color: "#2f6b5e" },
  completed: { label: "Завершена", color: "#5b6ea8" },
  cancelled: { label: "Отменена", color: "#8a948f" },
};

export const QUESTION_STATUS = {
  open: { label: "Ждёт ответа", color: "#c47a12" },
  answered: { label: "Есть ответ", color: "#2e7d4f" },
  closed: { label: "Закрыто", color: "#8a948f" },
};

export const FORMATS = {
  chat: { label: "Чат", icon: MessageCircle },
  video: { label: "Видео", icon: Video },
  audio: { label: "Звонок", icon: Phone },
};

export const isBookable = (c) => !["busy", "completed"].includes(c.status);

export const formatLabel = (format) => FORMATS[format]?.label || format;

export const MOODS = [
  { value: 1, label: "Очень тяжело", icon: Frown, color: "#7b86b8" },
  { value: 2, label: "Плохо", icon: Annoyed, color: "#8e9ac4" },
  { value: 3, label: "Нормально", icon: Meh, color: "#b49b5a" },
  { value: 4, label: "Хорошо", icon: Smile, color: "#4f9a7c" },
  { value: 5, label: "Отлично", icon: Laugh, color: "#2f8a5e" },
];

export const moodOf = (value) => MOODS.find((m) => m.value === Math.round(value));

export const TEST_ICONS = {
  anxiety: Activity,
  depression: CloudRain,
  burnout: Flame,
  sleep: MoonStar,
};

export const formatDate = (value, withTime = true) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

export const formatShortDate = (value) =>
  new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export const formatTime = (value) =>
  new Date(value).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export const formatPrice = (price) =>
  Number(price) > 0 ? `${Number(price)} BYN` : "Бесплатно";

export const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

export const initials = (name = "") =>
  name
    .replace(/[^\p{L}\s-]/gu, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

export const splitSpecialist = (specialist = "") => {
  const [name, ...rest] = specialist.split(",");
  return { name: name.trim(), role: rest.join(",").trim() };
};

export const plural = (n, one, few, many) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
};
