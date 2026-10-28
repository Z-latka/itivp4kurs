export default function Home() {
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
            <button className="btn btn-primary btn-full">
              Записаться на консультацию
            </button>
            <button className="btn btn-outline btn-full" style={{ marginTop: "0.75rem" }}>
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

      <section className="features">
        <h2>Почему выбирают MindCare</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Анонимность</h3>
            <p>Все консультации проводятся анонимно. Ваши данные защищены и не передаются третьим лицам.</p>
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
            <p>Пройдите психологические тесты для самооценки своего эмоционального состояния.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-card">
          <h2>Готовы начать?</h2>
          <p>Создайте аккаунт и получите доступ к консультациям и тестам.</p>
          <button className="btn btn-primary">Начать работу</button>
        </div>
      </section>
    </section>
  );
}
