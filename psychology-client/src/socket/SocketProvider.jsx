import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./context";
import { useAuth } from "../auth/context";
import { useToast } from "../toast/context";
import { navigate } from "../router";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, "");

export default function SocketProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!userId || !token) return undefined;

    const client = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
    let wasConnected = false;

    client.on("connect", () => {
      setSocket(client);
      setConnected(true);
      if (wasConnected) toast("Соединение с сервером восстановлено", "success");
      wasConnected = true;
    });
    client.on("disconnect", (reason) => {
      setConnected(false);
      if (reason !== "io client disconnect") toast("Соединение потеряно, переподключаемся…", "error");
    });
    client.on("connect_error", () => setConnected(false));
    client.on("notification", (n) => {
      toast(n.text, "notice", {
        title: n.title,
        duration: 7000,
        onClick: n.link ? () => navigate(n.link) : undefined,
      });
    });

    return () => {
      client.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [userId, toast]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
