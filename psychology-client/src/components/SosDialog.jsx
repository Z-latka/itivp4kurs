import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Phone, Wind, X } from "lucide-react";
import { navigate } from "../router";
import { useAuth } from "../auth/context";

// Экстренная помощь: открывается поверх любой страницы, без перехода.
// Отличается от раздела «Самопомощь» — здесь только самое срочное
export default function SosDialog({ open, onClose }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const go = (to) => {
    onClose();
    navigate(to);
  };

  // Портал в body: у шапки есть backdrop-filter, внутри неё fixed-окно было бы обрезано
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal sos-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row-between">
          <h2 id="sos-title" className="mb-0">Помощь прямо сейчас</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        <p className="mt-sm">
          Если есть угроза жизни — вашей или чьей-то ещё — позвоните сразу.
          Звонок бесплатный и работает круглосуточно.
        </p>

        <div className="sos-phones">
          <a href="tel:112" className="phone-card">
            <strong>112</strong>
            <span>экстренные службы</span>
          </a>
          <a href="tel:103" className="phone-card">
            <strong>103</strong>
            <span>скорая помощь</span>
          </a>
        </div>
        <p className="hint">
          <Phone size={12} /> Можно также позвонить на телефон доверия вашего города — там выслушают анонимно.
        </p>

        <h3 className="mt">Если угрозы нет, но очень тяжело</h3>
        <div className="stack" style={{ gap: "0.5rem" }}>
          <button className="sos-action" onClick={() => go("help")}>
            <span className="icon-tile sm"><Wind size={18} /></span>
            <span>
              <strong>Успокоить дыхание</strong>
              <small>Упражнение на 1 минуту и техника «5-4-3-2-1»</small>
            </span>
          </button>
          <button className="sos-action" onClick={() => go(user ? "ask" : "auth?mode=register&next=ask")}>
            <span className="icon-tile sm"><MessageCircle size={18} /></span>
            <span>
              <strong>Написать психологу анонимно</strong>
              <small>Ответ в течение суток. Это не экстренная служба</small>
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
