import { useState } from "react";
import { Leaf, LifeBuoy, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { navigate } from "../router";
import { useAuth } from "../auth/context";
import { useTheme } from "../theme";
import { Avatar } from "./ui";

export default function Header({ currentPage }) {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: "consultations", label: "Консультации" },
    { to: "tests", label: "Тесты" },
    { to: "ask", label: "Анонимный вопрос" },
    { to: "help", label: "Самопомощь" },
    ...(isAdmin ? [{ to: "admin", label: "Панель психолога" }] : []),
  ];

  const go = (to) => {
    setOpen(false);
    navigate(to === "home" ? "" : to);
  };

  return (
    <header className="header">
      <div className="header-container">
        <a
          className="logo"
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <span className="logo-mark">
            <Leaf size={20} />
          </span>
          <span>
            Mind<span className="logo-accent">Care</span>
          </span>
        </a>

        <nav className={`nav-links${open ? " open" : ""}`} aria-label="Основное меню">
          {navLinks.map((link) => (
            <a
              key={link.to}
              href={`#/${link.to}`}
              onClick={(e) => {
                e.preventDefault();
                go(link.to);
              }}
              className={`nav-link${currentPage === link.to ? " active" : ""}`}
              aria-current={currentPage === link.to ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
          {user && (
            <button className="btn btn-ghost mobile-only" onClick={() => { signOut(); go("home"); }}>
              <LogOut size={16} /> Выйти
            </button>
          )}
        </nav>

        <div className="nav-actions">
          <a
            href="#/help"
            className="sos-link hide-mobile"
            title="Помощь сейчас"
            onClick={(e) => {
              e.preventDefault();
              go("help");
            }}
          >
            <LifeBuoy size={16} /> <span className="sos-text">Помощь сейчас</span>
          </a>
          <button
            className="icon-btn"
            onClick={toggle}
            aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          {user ? (
            <>
              <button
                className={`user-chip${currentPage === "profile" ? " active" : ""}`}
                onClick={() => go("profile")}
                title="Личный кабинет"
              >
                <Avatar name={user.nickname} />
                <span className="ellipsis hide-mobile chip-name">{user.nickname || "Кабинет"}</span>
              </button>
              <button
                className="icon-btn hide-mobile"
                onClick={() => {
                  signOut();
                  go("home");
                }}
                aria-label="Выйти"
                title="Выйти"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            currentPage !== "auth" && (
              <button className="btn btn-primary btn-sm" onClick={() => go("auth")}>
                Войти
              </button>
            )
          )}
          <button
            className="icon-btn burger"
            aria-label="Меню"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
