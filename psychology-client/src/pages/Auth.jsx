import { useState } from "react";
import { CircleAlert, Eye, EyeOff, Leaf, Lock, MessageCircle, NotebookPen, UserRound } from "lucide-react";
import { errorMessage, login, register } from "../api";
import { useAuth } from "../auth/context";
import { useToast } from "../toast/context";
import { navigate } from "../router";

const INITIAL_FORM = {
  email: "",
  password: "",
  nickname: "",
};

export default function AuthPage({ query = {} }) {
  const { signIn } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState(query.mode === "register" ? "register" : "login");
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } =
        mode === "login"
          ? await login({ email: form.email, password: form.password })
          : await register(form);
      // JWT-токен сохраняется и затем подставляется перехватчиком axios
      signIn(data.token, data.user);
      toast(mode === "login" ? `С возвращением, ${data.user.nickname}!` : "Аккаунт создан");
      navigate(query.next || (data.user.role === "admin" ? "admin" : "profile"));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <div className="auth-layout">
        <aside className="auth-aside">
          <div>
            <span className="logo-mark" style={{ background: "rgba(255,255,255,0.18)", color: "inherit" }}>
              <Leaf size={20} />
            </span>
            <h2 className="mt">Место, где можно говорить честно</h2>
            <p style={{ opacity: 0.9 }}>Аккаунт нужен, чтобы сохранять записи, переписку и результаты — и видеть их могли только вы.</p>
          </div>
          <ul>
            <li><UserRound size={20} /> Психолог видит только псевдоним — не используйте настоящее имя</li>
            <li><MessageCircle size={20} /> Анонимные вопросы и ответы специалиста</li>
            <li><NotebookPen size={20} /> Дневник настроения и история тестов</li>
            <li><Lock size={20} /> Пароль хранится в зашифрованном виде (bcrypt)</li>
          </ul>
        </aside>

        <div className="auth-main">
          <div className="segmented" role="tablist">
            <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>
              Вход
            </button>
            <button role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>
              Регистрация
            </button>
          </div>

          <h2>{mode === "login" ? "С возвращением" : "Создать анонимный аккаунт"}</h2>
          <p className="muted">
            {mode === "login"
              ? "Войдите, чтобы продолжить."
              : "Понадобятся только email и псевдоним."}
          </p>

          {error && (
            <div className="alert alert-error" role="alert">
              <CircleAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="auth-nick">Псевдоним</label>
                <input
                  id="auth-nick"
                  name="nickname"
                  type="text"
                  placeholder="Например: Тихий Лис"
                  value={form.nickname}
                  onChange={handleChange}
                  maxLength={40}
                />
                <div className="hint">Если оставить пустым, придумаем за вас.</div>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="auth-password">Пароль</label>
              <div className="password-field">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Минимум 6 символов" : "••••••••"}
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={mode === "register" ? 6 : undefined}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg mt-sm" disabled={loading}>
              {loading ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>

          <p className="center small muted mt">
            {mode === "login" ? "Ещё нет аккаунта? " : "Уже есть аккаунт? "}
            <a
              href="#/auth"
              onClick={(e) => {
                e.preventDefault();
                switchMode(mode === "login" ? "register" : "login");
              }}
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
