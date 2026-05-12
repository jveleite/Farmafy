import { createContext, useContext, useEffect, useState } from "react";
import { aoMudarAuth, carregarProfile, getSessao } from "../services/auth.service";

const AuthCtx = createContext(null);

/**
 * useAuth() devolve { sessao, profile, loading, recarregarProfile }
 * - sessao: objeto de sessão do Supabase (ou null)
 * - profile: { id, nome, role, farmaciaId, farmaciaNome, email } ou null
 * - loading: true durante o boot inicial
 */
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }) {
  const [sessao, setSessao]   = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Boot: lê a sessão atual e o profile (se houver)
  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const s = await getSessao();
        if (cancelado) return;
        setSessao(s);
        if (s) setProfile(await carregarProfile());
      } catch (e) {
        console.error("Erro no boot de auth:", e);
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    // Subscreve a mudanças (login, logout, token refresh)
    const unsub = aoMudarAuth(async (s) => {
      setSessao(s);
      try {
        setProfile(s ? await carregarProfile() : null);
      } catch (e) {
        console.error("Erro ao recarregar profile:", e);
      }
    });

    return () => {
      cancelado = true;
      unsub();
    };
  }, []);

  async function recarregarProfile() {
    try {
      setProfile(await carregarProfile());
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <AuthCtx.Provider value={{ sessao, profile, loading, recarregarProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}
