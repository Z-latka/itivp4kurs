import { createContext, useContext } from "react";

export const ToastContext = createContext(() => {});

// toast("Текст") или toast("Текст", "error")
export const useToast = () => useContext(ToastContext);
