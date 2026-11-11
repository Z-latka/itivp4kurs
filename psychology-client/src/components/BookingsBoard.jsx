import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, Stethoscope, Users } from "lucide-react";
import { errorMessage, fetchAllBookings, setBookingStatus } from "../api";
import { useToast } from "../toast/context";
import { Badge, EmptyState, Loader } from "./ui";
import { BOOKING_STATUS, FORMATS, formatTime } from "../labels";

const bid = (b) => b.id || b._id;

const dayKey = (d) => new Date(d).toDateString();
const dayTitle = (d) => {
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (dayKey(date) === dayKey(today)) return "Сегодня";
  if (dayKey(date) === dayKey(tomorrow)) return "Завтра";
  return date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
};

export default function BookingsBoard({ showPsychologist = false }) {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllBookings()
      .then(({ data }) => setBookings(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (booking, status) => {
    try {
      await setBookingStatus(bid(booking), status);
      setBookings((prev) => prev.map((b) => (bid(b) === bid(booking) ? { ...b, status } : b)));
      toast(`Статус: ${BOOKING_STATUS[status].label.toLowerCase()}`);
    } catch (err) {
      toast(errorMessage(err, "Не удалось изменить статус"), "error");
    }
  };

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = bookings.filter((b) => {
      if (filter === "active" && !["pending", "confirmed"].includes(b.status)) return false;
      if (filter !== "active" && filter !== "all" && b.status !== filter) return false;
      return (
        !q ||
        [b.user?.nickname, b.consultation?.topic, b.consultation?.specialist, b.comment]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    });
    const map = new Map();
    list.forEach((b) => {
      const key = dayKey(b.scheduledAt);
      if (!map.has(key)) map.set(key, { date: b.scheduledAt, items: [] });
      map.get(key).items.push(b);
    });
    return [...map.values()];
  }, [bookings, filter, search]);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <>
      <div className="filters">
        <div className="filters-top">
          <label className="input-icon">
            <span className="sr-only">Поиск</span>
            <Search size={18} />
            <input
              className="input"
              type="search"
              placeholder={showPsychologist ? "Клиент, тема или психолог" : "Псевдоним, тема или комментарий"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Статус">
            <option value="active">Активные</option>
            <option value="pending">Ожидают подтверждения ({pendingCount})</option>
            <option value="confirmed">Подтверждённые</option>
            <option value="completed">Завершённые</option>
            <option value="cancelled">Отменённые</option>
            <option value="all">Все записи</option>
          </select>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <Loader />}
      {!loading && groups.length === 0 && (
        <EmptyState icon={CalendarDays} title="Записей нет" text="Под выбранные условия ничего не подходит." />
      )}
      {groups.map((g) => (
        <div key={g.date} style={{ marginBottom: "1.75rem" }}>
          <h3 style={{ textTransform: "capitalize" }}>{dayTitle(g.date)}</h3>
          <ul className="list">
            {g.items.map((b) => {
              const status = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
              const Format = FORMATS[b.format]?.icon;
              return (
                <li key={bid(b)} className="card list-row">
                  <div className="date-tile">
                    <strong style={{ fontSize: "1rem" }}>{formatTime(b.scheduledAt)}</strong>
                  </div>
                  <div className="list-row-main">
                    <strong className="ellipsis">{b.consultation?.topic || "Консультация удалена"}</strong>
                    <span className="meta-row">
                      <span><Users size={14} /> {b.user?.nickname || "Аноним"}</span>
                      {Format && <span><Format size={14} /> {FORMATS[b.format].label}</span>}
                      {showPsychologist && b.consultation?.psychologist?.fullName && (
                        <span><Stethoscope size={14} /> {b.consultation.psychologist.fullName}</span>
                      )}
                    </span>
                    {b.comment && <span className="small">«{b.comment}»</span>}
                  </div>
                  <div className="list-row-side">
                    <Badge color={status.color}>{status.label}</Badge>
                    {b.status === "pending" && (
                      <button className="btn btn-primary btn-sm" onClick={() => changeStatus(b, "confirmed")}>
                        Подтвердить
                      </button>
                    )}
                    <select value={b.status} onChange={(e) => changeStatus(b, e.target.value)} aria-label="Изменить статус">
                      {Object.entries(BOOKING_STATUS).map(([value, s]) => (
                        <option key={value} value={value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
