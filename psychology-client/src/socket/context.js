import { createContext, useContext, useEffect, useRef } from "react";

export const SocketContext = createContext({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export function useSocketEvent(event, handler) {
  const { socket } = useSocket();
  const ref = useRef(handler);

  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    if (!socket) return undefined;
    const listener = (payload) => ref.current(payload);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [socket, event]);
}
