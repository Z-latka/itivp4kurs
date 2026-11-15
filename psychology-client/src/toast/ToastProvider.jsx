import { useCallback, useState } from "react";
import { Bell, CircleCheck, CircleAlert, Info, X } from "lucide-react";
import { ToastContext } from "./context";

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info, notice: Bell };

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "success", options = {}) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { id, message, type, ...options }]);
      setTimeout(() => dismiss(id), options.duration || 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          const open = t.onClick
            ? () => {
                dismiss(t.id);
                t.onClick();
              }
            : undefined;
          return (
            <div key={t.id} className={`toast ${t.type}${open ? " clickable" : ""}`}>
              <Icon size={18} />
              <div
                className="toast-body"
                onClick={open}
                onKeyDown={(e) => open && e.key === "Enter" && open()}
                role={open ? "link" : undefined}
                tabIndex={open ? 0 : undefined}
              >
                {t.title && <strong>{t.title}</strong>}
                <span>{t.message}</span>
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Закрыть">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
