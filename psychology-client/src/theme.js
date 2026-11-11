import { useCallback, useState } from "react";

const current = () =>
  document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";

const remember = (theme) => {
  try {
    localStorage.setItem("theme", theme);
    return true;
  } catch {
    return false;
  }
};

export function useTheme() {
  const [theme, setTheme] = useState(current);

  const toggle = useCallback(() => {
    const next = current() === "dark" ? "light" : "dark";
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    remember(next);
    setTheme(next);
  }, []);

  return { theme, toggle };
}
