import { useState } from "react";
import { navigate } from "../router";
import { useAuth } from "../auth/context";

export default function Header({ currentPage }) {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: "home", label: "Главная" },
    { to: "consultations", label: "Консультации" },
    { to: "tests", label: "Тесты" },
    { to: "ask", label: "Анонимный вопрос" },
    ...(isAdmin ? [{ to: "admin", label: "Панель психолога" }] : []),
  ];

  const go = (to) => {
    setOpen(false);
    navigate(to === "home" ? "" : to);
  };

  return (
    <nav className="header scrolled">
      <div className="header-container">
        <div className="logo" onClick={() => go("home")} style={{ cursor: "pointer" }}>
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Mind<span className="logo-accent">Care</span></span>
        </div>
        <button
          className="burger"
          aria-label="Меню"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "✕" : "☰"}
        </button>
        <div className={`nav-links${open ? " open" : ""}`}>
          {navLinks.map((link) => (
            <a
              key={link.to}
              href={`#/${link.to}`}
              onClick={(e) => {
                e.preventDefault();
                go(link.to);
              }}
              className={`nav-link${currentPage === link.to ? " active" : ""}`}
            >
              {link.label}
            </a>
          ))}
          <div className="nav-actions">
            {user ? (
              <>
                <button
                  className={`btn btn-outline btn-sm${currentPage === "profile" ? " active" : ""}`}
                  onClick={() => go("profile")}
                  title={user.email}
                >
                  👤 {user.nickname || "Кабинет"}
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    signOut();
                    go("home");
                  }}
                >
                  Выйти
                </button>
              </>
            ) : (
              currentPage !== "auth" && (
                <button className="btn btn-primary btn-sm" onClick={() => go("auth")}>
                  Войти
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
