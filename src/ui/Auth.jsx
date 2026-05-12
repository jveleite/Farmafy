import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { aoMudarAuth, carregarProfile, getSessao } from "../services/auth.service";

const AuthCtx = createContext(null);

/**
 * useAuth() devolve { sessao, profile, permissoes, loading, recarregarProfile }
 * - sessao: objeto de sessão do Supabase (ou null)
 * - profile: { id, nome, role, farmaciaId, farmaciaNome, email } ou null
 * - permissoes: derivado de role — { role, isOwner, isFarmaceutico, isAtendente,
 *               veFinanceiro, veEquipe, podeAlterarProdutos, podeExcluirClientes }
 * - loading: true durante o boot inicial
 */
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

/**
 * Deriva o objeto de permissões a partir da role.
 * Centraliza a tabela de quem pode o quê.
 */
function permissoesDeRole(role) {
  const isOwner        = role === "owner";
  const isFarmaceutico = role === "farmaceutico";
  const isAtendente    = role === "atendente";

  return {
    role,
    isOwner,
    isFarmaceutico,
    isAtendente,
    // Telas
    veFinanceiro: isOwner,
    veEquipe:     isOwner,
    // Produtos
    podeAlterarProdutos: isOwner || isFarmaceutico,
    // Clientes
    podeExcluirClientes: isOwner || isFarmaceutico,
  };
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

  const permissoes = useMemo(
    () => permissoesDeRole(profile?.role),
    [profile?.role]
  );

  return (
    <AuthCtx.Provider value={{ sessao, profile, permissoes, loading, recarregarProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}
