import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./context";
import { fetchProfile } from "../api";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() =>
    Boolean(localStorage.getItem("token")),
  );

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    fetchProfile()
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const signIn = useCallback((token, profile) => {
    localStorage.setItem("token", token);
    setUser(profile);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      checking,
      isAdmin: user?.role === "admin",
      isPsychologist: user?.role === "psychologist",
      isClient: user?.role === "user",
      homePage: user?.role === "admin" ? "admin" : user?.role === "psychologist" ? "work" : "profile",
      signIn,
      signOut,
      setUser,
    }),
    [user, checking, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
