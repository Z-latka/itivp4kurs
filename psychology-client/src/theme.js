import { useCallback, useState } from "react";

const current = () =>
  document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";

// Светлая/тёмная тема: атрибут data-theme на <html> + выбор в localStorage
export function useTheme() {
  const [theme, setTheme] = useState(current);

  const toggle = useCallback(() => {
    const next = current() === "dark" ? "light" : "dark";
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("theme", next);
    } catch {
      // хранилище недоступно — тема просто не запомнится
    }
    setTheme(next);
  }, []);

  return { theme, toggle };
}
