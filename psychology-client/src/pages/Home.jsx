import { useEffect, useState } from "react";
import { fetchStats } from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth/context";

const STEPS = [
  {
    icon: "📝",
    title: "Пройдите тест",
    text: "Короткий скрининг поможет понять, что происходит, и сформулировать запрос.",
  },
  {
    icon: "💬",
    title: "Задайте вопрос анонимно",
    text: "Опишите ситуацию — психолог ответит в личной переписке. Видит он только ваш псевдоним.",
  },
  {
    icon: "📅",
    title: "Запишитесь на консультацию",
    text: "Выберите специалиста, удобное время и формат: чат, аудио или видео.",
  },
];

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  return (
    <section className="page home">
      <header className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            ✨ Анонимно и конфиденциально
          </div>
          <h1>Психологическая поддержка рядом с вами</h1>
          <p className="hero-subtitle">
            Сервис для анонимных консультаций с профессиональными психологами.
            Пройдите тесты, запишитесь на консультацию и заботьтесь о своём
            эмоциональном здоровье.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-full" onClick={() => navigate("consultations")}>
              Записаться на консультацию
            </button>
            <button className="btn btn-outline btn-full" onClick={() => navigate("tests")}>
              Пройти психологический тест
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
          <div className="hero-circle hero-circle-3"></div>
          <div className="hero-icon">🧘‍♀️</div>
        </div>
      </header>

      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.consultations}</div>
            <div className="stat-label">Направлений консультаций</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.testsTaken}</div>
            <div className="stat-label">Пройдено тестов</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.questions}</div>
            <div className="stat-label">Анонимных обращений</div>
          </div>
        </div>
      )}

      <section className="features">
        <h2>Как это работает</h2>
        <div className="features-grid steps-grid">
          {STEPS.map((step, i) => (
            <div key={step.title} className="feature-card">
              <div className="step-number">{i + 1}</div>
              <div className="feature-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="features">
        <h2>Почему выбирают MindCare</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Анонимность</h3>
            <p>Психолог видит только ваш псевдоним. Email и личные данные не передаются специалисту.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👩‍⚕️</div>
            <h3>Профессионалы</h3>
            <p>Опытные психологи с подтверждённой квалификацией и стажем работы от 3 лет.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Удобный формат</h3>
            <p>Онлайн-консультации в удобное для вас время, без необходимости ездить на приём.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Тесты и диагностика</h3>
            <p>Пройдите психологические тесты и отслеживайте динамику в личном кабинете.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-card">
          <h2>Готовы начать?</h2>
          {user ? (
            <>
              <p>Задайте вопрос психологу — это анонимно и ни к чему не обязывает.</p>
              <button className="btn btn-primary" onClick={() => navigate("ask")}>
                Задать вопрос
              </button>
            </>
          ) : (
            <>
              <p>Создайте аккаунт и получите доступ к консультациям и тестам.</p>
              <button className="btn btn-primary" onClick={() => navigate("auth?mode=register")}>
                Начать работу
              </button>
            </>
          )}
        </div>
      </section>
    </section>
  );
}
