import { supabase } from "../lib/supabase";

// ── Sessão ──────────────────────────────────────────────────────────────────

export async function getSessao() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Subscribe a callback to auth state changes (login, logout, refresh).
 * Devolve uma função `unsubscribe`.
 */
export function aoMudarAuth(callback) {
  const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}

// ── Login / Logout ──────────────────────────────────────────────────────────

export async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Signup (cria user + farmácia + profile atomicamente) ────────────────────

export async function signup({ email, senha, nomeUser, nomeFarmacia }) {
  // 1. Cria user no auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
  });
  if (error) throw error;

  // Em projetos com confirmação de email habilitada, data.session vem null
  // e o user precisa confirmar antes de poder logar. Tratamos esse caso fora.
  if (!data.session) {
    return { precisaConfirmarEmail: true };
  }

  // 2. Cria farmácia + profile via RPC SECURITY DEFINER
  const { data: farmaciaId, error: e2 } = await supabase.rpc(
    "setup_nova_farmacia",
    { p_nome_user: nomeUser, p_nome_farmacia: nomeFarmacia }
  );
  if (e2) throw e2;

  return { farmaciaId };
}

// ── Profile do usuário logado ───────────────────────────────────────────────

export async function carregarProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, role, farmacia_id, farmacias(nome)")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;

  if (!data) return null;

  return {
    id: data.id,
    nome: data.nome,
    role: data.role,
    farmaciaId: data.farmacia_id,
    farmaciaNome: data.farmacias?.nome || "—",
    email: user.email,
  };
}
