import { createContext, useCallback, useContext, useRef, useState } from "react";
import { colors, radius, shadow } from "../styles/tokens";

const ToastCtx = createContext(null);

// useToast() => mostrar(msg, tipo = "ok" | "erro")
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx.mostrar;
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const mostrar = useCallback((msg, tipo = "ok") => {
    clearTimeout(timer.current);
    setToast({ msg, tipo });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  return (
    <ToastCtx.Provider value={{ mostrar }}>
      {children}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 999,
            background: toast.tipo === "erro" ? colors.dangerDark : colors.brandDark,
            color: "#fff",
            padding: "11px 18px",
            borderRadius: radius.lg,
            fontWeight: 700,
            fontSize: 13.5,
            boxShadow: shadow.toast,
            animation: "fadeIn .2s ease",
          }}
          role="status"
        >
          {toast.tipo === "erro" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
