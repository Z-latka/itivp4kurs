import { Leaf, Phone } from "lucide-react";
import { navigate } from "../router";
import { useAuth } from "../auth/context";

const Link = ({ to, children }) => (
  <a
    href={`#/${to}`}
    onClick={(e) => {
      e.preventDefault();
      navigate(to);
    }}
  >
    {children}
  </a>
);

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="app-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <span className="logo">
              <span className="logo-mark">
                <Leaf size={20} />
              </span>
              <span>
                Mind<span className="logo-accent">Care</span>
              </span>
            </span>
            <p className="footer-about">
              Анонимная психологическая поддержка онлайн. Консультации,
              тесты и упражнения, которые помогают позаботиться о себе.
            </p>
          </div>
          <div>
            <h4>Сервис</h4>
            <ul>
              <li><Link to="consultations">Консультации</Link></li>
              <li><Link to="tests">Психологические тесты</Link></li>
              <li><Link to="ask">Анонимный вопрос</Link></li>
              <li><Link to="help">Самопомощь</Link></li>
            </ul>
          </div>
          <div>
            <h4>Аккаунт</h4>
            <ul>
              {user ? (
                <>
                  <li><Link to="profile">Личный кабинет</Link></li>
                  <li><Link to="profile?tab=mood">Дневник настроения</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="auth">Вход</Link></li>
                  <li><Link to="auth?mode=register">Регистрация</Link></li>
                </>
              )}
              <li><Link to="faq">Частые вопросы</Link></li>
            </ul>
          </div>
          <div>
            <h4>Экстренная помощь</h4>
            <ul>
              <li>
                <a href="tel:112" className="phone-link"><Phone size={15} /> 112</a>
                <span className="muted small"> — единый номер экстренных служб</span>
              </li>
              <li>
                <a href="tel:103" className="phone-link"><Phone size={15} /> 103</a>
                <span className="muted small"> — скорая помощь</span>
              </li>
              <li><Link to="help">Что делать, если плохо прямо сейчас</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 MindCare. Анонимно и конфиденциально.</span>
          <span>Сервис не заменяет экстренную медицинскую помощь.</span>
        </div>
      </div>
    </footer>
  );
}
