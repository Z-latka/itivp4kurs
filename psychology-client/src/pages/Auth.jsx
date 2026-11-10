import { useState } from "react";
import { errorMessage, login, register } from "../api";
import { useAuth } from "../auth/context";
import { navigate } from "../router";

const INITIAL_FORM = {
  email: "",
  password: "",
  nickname: "",
};

export default function AuthPage({ query = {} }) {
  const { signIn } = useAuth();
  const [mode, setMode] = useState(query.mode === "register" ? "register" : "login");
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      navigate(query.next || (data.user.role === "admin" ? "admin" : "profile"));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth">
      <div className="auth-wrapper">
        <div className="auth-card card">
          <div className="auth-header">
            <div className="auth-icon">🌿</div>
            <h2>{mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}</h2>
            <p className="auth-subtitle">
              {mode === "login"
                ? "Войдите в свой аккаунт для доступа к консультациям"
                : "Психолог будет видеть только ваш псевдоним — не используйте настоящее имя"}
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
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
                <label>Псевдоним</label>
                <input
                  name="nickname"
                  type="text"
                  placeholder="Например: Тихий Лис"
                  value={form.nickname}
                  onChange={handleChange}
                  maxLength={40}
                />
              </div>
            )}
            <div className="form-group">
              <label>Пароль</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={mode === "register" ? 6 : undefined}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
            <button
              type="submit"
              className={`btn btn-primary btn-full ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Загрузка…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>

          <div className="auth-divider">
            <span>или</span>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-full"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
          >
            {mode === "login"
              ? "Ещё нет аккаунта? Зарегистрироваться"
              : "Уже есть аккаунт? Войти"}
          </button>

          <div className="auth-footer">
            <p>
              Email нужен только для входа и не показывается психологу. Пароль
              хранится на сервере в виде хэша bcrypt.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
