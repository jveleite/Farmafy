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

  // 2. Setup inicial: detecta convite ou cria farmácia nova.
  //    nomeFarmacia pode ser null/vazio se o user foi convidado.
  const { data: setupRows, error: e2 } = await supabase.rpc(
    "setup_inicial",
    { p_nome_user: nomeUser, p_nome_farmacia: nomeFarmacia || null }
  );
  if (e2) throw e2;

  // setup_inicial devolve uma linha com { farmacia_id, farmacia_nome, role, veio_de_convite }
  const setup = Array.isArray(setupRows) ? setupRows[0] : setupRows;
  return {
    farmaciaId: setup?.farmacia_id,
    farmaciaNome: setup?.farmacia_nome,
    role: setup?.role,
    veioDeConvite: setup?.veio_de_convite,
  };
}

// ── Profile do usuário logado ───────────────────────────────────────────────

export async function carregarProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, role, farmacia_id, farmacias(nome, chave_pix)")
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
    farmaciaChavePix: data.farmacias?.chave_pix || "",
    email: user.email,
  };
}
