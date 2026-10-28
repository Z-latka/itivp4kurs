import { useState } from "react";
import Header from "./components/Header";
import Home from "./pages/Home";
import ConsultationsPage from "./components/ConsultationList";
import TestsPage from "./pages/Tests";
import AuthPage from "./pages/Auth";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div className="app">
      <Header currentPage={page} onNavigate={setPage} />
      <main className="main-content">
        <div className="container">
          {page === "home" && <Home />}
          {page === "consultations" && <ConsultationsPage />}
          {page === "tests" && <TestsPage />}
          {page === "auth" && <AuthPage />}
        </div>
      </main>
      <footer className="app-footer">
        <div className="container">
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
            <a href="#" onClick={(e) => { e.preventDefault(); setPage("home"); }}>
              Главная
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); setPage("consultations"); }}>
              Консультации
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); setPage("tests"); }}>
              Тесты
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); setPage("auth"); }}>
              Вход
            </a>
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
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 0;
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
