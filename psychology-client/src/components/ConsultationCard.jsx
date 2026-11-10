import { ArrowRight, Clock } from "lucide-react";
import { navigate } from "../router";
import { formatPrice, isBookable, splitSpecialist } from "../labels";
import { Avatar, Stars } from "./ui";

export default function ConsultationCard({ item }) {
  const { name, role } = splitSpecialist(item.specialist);
  const open = () => navigate(`consultations/${item.id}`);

  return (
    <li
      className="card card-hover consultation-card clickable"
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      tabIndex={0}
      role="link"
      aria-label={item.topic}
    >
      {item.tags?.length > 0 && (
        <div className="chips" style={{ marginBottom: "0.85rem" }}>
          {item.tags.slice(0, 3).map((t) => (
            <span key={t} className="chip chip-accent">#{t}</span>
          ))}
        </div>
      )}
      <h3 className="card-title">{item.topic}</h3>
      <span className="meta-row mt-sm">
        <span><Clock size={14} /> {item.duration} мин</span>
        {item.rating ? (
          <span className="rating-line">
            <Stars value={item.rating} size={13} /> {item.rating}
            <span className="muted">({item.reviewsCount})</span>
          </span>
        ) : (
          <span>Пока без отзывов</span>
        )}
      </span>
      <div className="card-body">
        <p className="card-description mt-sm">{item.description}</p>
        {item.specialist && (
          <div className="specialist">
            <Avatar name={name} />
            <div>
              <strong>{name}</strong>
              {role && <span>{role}</span>}
            </div>
          </div>
        )}
      </div>
      <div className="card-footer">
        <span className={`price${Number(item.price) > 0 ? "" : " free"}`}>
          {formatPrice(item.price)}
        </span>
        {isBookable(item) ? (
          <span className="btn btn-soft btn-sm">
            Подробнее <ArrowRight size={15} />
          </span>
        ) : (
          <span className="muted small">Запись закрыта</span>
        )}
      </div>
    </li>
  );
}
