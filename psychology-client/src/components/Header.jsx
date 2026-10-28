export default function Header({ currentPage, onNavigate }) {
  const navLinks = [
    { to: "home", label: "Главная" },
    { to: "consultations", label: "Консультации" },
    { to: "tests", label: "Тесты" },
    { to: "auth", label: "Вход" },
  ];

  return (
    <nav className="header">
      <div className="header-container">
        <div
          className="logo"
          onClick={() => onNavigate("home")}
          style={{ cursor: "pointer" }}
        >
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Mind<span className="logo-accent">Care</span></span>
        </div>
        <div className="nav-links">
          {navLinks.map((link) => (
            <a
              key={link.to}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(link.to);
              }}
              className={`nav-link${currentPage === link.to ? " active" : ""}`}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="nav-actions">
          {currentPage === "auth" ? null : (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate("auth")}
            >
              Войти
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
