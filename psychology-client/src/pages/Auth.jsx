import { useState } from "react";
import { login, register } from "../api";

const INITIAL_FORM = {
  email: "",
  password: "",
  role: "user",
};

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
        setSuccess("Вход выполнен успешно! Перенаправление...");
        localStorage.setItem("auth_demo", "true");
      } else {
        await register({
          email: form.email,
          password: form.password,
          role: form.role || "user",
        });
        setSuccess("Регистрация прошла успешно! Теперь вы можете войти.");
      }
    } catch (err) {
      setError(
        err.response
          ? err.response.data.message || "Ошибка при запросе к серверу"
          : "Сервер недоступен. Проверьте подключение к интернету.",
      );
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
                : "Зарегистрируйтесь, чтобы начать пользоваться сервисом"}
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span>✓</span>
              <span>{success}</span>
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
            <div className="form-group">
              <label>Пароль</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
            {mode === "register" && (
              <div className="form-group">
                <label>Роль</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            )}
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
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login"
              ? "Ещё нет аккаунта? Зарегистрироваться"
              : "Уже есть аккаунт? Войти"}
          </button>

          <div className="auth-footer">
            <p>
              Демонстрационный сервис психологической поддержки. Данные хранятся
              на сервере и передаются по защищённому соединению.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
