import { useEffect, useState } from "react";

const parse = () => {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [path, search = ""] = hash.split("?");
  const parts = path.split("/").filter(Boolean);
  return {
    page: parts[0] || "home",
    param: parts[1] ? decodeURIComponent(parts[1]) : null,
    query: Object.fromEntries(new URLSearchParams(search)),
  };
};

export const navigate = (to) => {
  window.location.hash = `/${to}`;
};

export function useRoute() {
  const [route, setRoute] = useState(parse);

  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}
