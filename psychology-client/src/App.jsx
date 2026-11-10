import Header from "./components/Header";
import CrisisNote from "./components/CrisisNote";
import Home from "./pages/Home";
import CatalogPage from "./pages/Catalog";
import TestsPage from "./pages/Tests";
import QuestionsPage from "./pages/Questions";
import ProfilePage from "./pages/Profile";
import AdminPage from "./pages/Admin";
import AuthPage from "./pages/Auth";
import { navigate, useRoute } from "./router";
import { useAuth } from "./auth/context";

const PAGES = {
  home: Home,
  consultations: CatalogPage,
  tests: TestsPage,
  ask: QuestionsPage,
  profile: ProfilePage,
  admin: AdminPage,
  auth: AuthPage,
};

// Страницы, доступные только после входа
const PRIVATE = ["profile", "admin"];

function NotFound() {
  return (
    <section className="page empty-state">
      <div className="empty-icon">🧭</div>
      <h3>Страница не найдена</h3>
      <p>Возможно, ссылка устарела.</p>
      <button className="btn btn-primary" onClick={() => navigate("")}>
        На главную
      </button>
    </section>
  );
}

export default function App() {
  const route = useRoute();
  const { user, checking } = useAuth();
  const Page = PAGES[route.page] || NotFound;

  let content = <Page param={route.param} query={route.query} />;
  if (checking) {
    content = (
      <div className="loading-state">
        <div className="spinner"></div>
      </div>
    );
  } else if (PRIVATE.includes(route.page) && !user) {
    content = <AuthPage query={{ next: route.page }} />;
  }

  const link = (to, label) => (
    <a
      href={`#/${to}`}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {label}
    </a>
  );

  return (
    <div className="app">
      <Header currentPage={route.page} />
      <main className="main-content">
        <div className="container">{content}</div>
      </main>
      <footer className="app-footer">
        <div className="container">
          <CrisisNote />
          <div className="footer-content">
            <div className="footer-brand">
              <span className="logo-icon">🌿</span>
              <span className="logo-text">Mind<span className="logo-accent">Care</span></span>
            </div>
            <p className="footer-text">
              Сервис анонимной психологической поддержки. Консультации, тесты и
              забота о вашем эмоциональном здоровье.
            </p>
          </div>
          <div className="footer-links">
            {link("", "Главная")}
            {link("consultations", "Консультации")}
            {link("tests", "Тесты")}
            {link("ask", "Анонимный вопрос")}
            {user ? link("profile", "Кабинет") : link("auth", "Вход")}
          </div>
        </div>
        <div className="container">
          <div className="footer-divider"></div>
          <p className="footer-copy">© 2026 MindCare. Анонимно и конфиденциально.</p>
        </div>
      </footer>
      <style>{`
        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .main-content {
          flex: 1;
          padding: 2rem 0;
        }
        .page {
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .app-footer {
          margin-top: auto;
          border-top: 1px solid var(--border);
          background: var(--bg-card);
          padding-top: 1.5rem;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 0 1rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .logo-icon {
          font-size: 1.5rem;
        }
        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-h);
          text-decoration: none;
        }
        .logo-accent {
          color: var(--accent);
        }
        .footer-text {
          color: var(--text-muted);
          font-size: 0.9rem;
          max-width: 400px;
          line-height: 1.5;
        }
        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .footer-links a {
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: var(--accent);
        }
        .footer-divider {
          height: 1px;
          background: var(--border);
          margin: 1.5rem 0;
        }
        .footer-copy {
          color: var(--text-muted);
          font-size: 0.8rem;
          text-align: center;
        }
        @media (max-width: 640px) {
          .footer-content {
            flex-direction: column;
            text-align: center;
            align-items: center;
          }
          .footer-links {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
