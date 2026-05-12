import { supabase } from "../lib/supabase";

// ── Membros (profiles da minha farmácia) ────────────────────────────────────

export async function listarMembros() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;

  // Junta email via auth.users — não dá pra select direto via RLS na API.
  // Usamos a auth.getUser() pra cada profile? Nope, vamos só puxar emails
  // dos próprios membros via uma view OU deixar email aparecer só pro user
  // dele mesmo (próprio nome).
  // Por enquanto: retornamos sem email. Owner pode reconhecer pelo nome.
  return (data || []).map((p) => ({
    id: p.id,
    nome: p.nome,
    role: p.role,
    criadoEm: p.created_at,
  }));
}

// ── Convites pendentes ──────────────────────────────────────────────────────

export async function listarConvitesPendentes() {
  const { data, error } = await supabase
    .from("convites")
    .select("id, email, role, created_at")
    .is("used_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function convidarUsuario(email, role) {
  const limpo = String(email).trim().toLowerCase();
  if (!limpo) throw new Error("Email inválido");

  const { error } = await supabase.from("convites").insert({
    email: limpo,
    role,
    // farmacia_id e created_by entram via defaults / sessão
    created_by: (await supabase.auth.getUser()).data.user?.id,
  });
  if (error) throw error;
}

export async function cancelarConvite(id) {
  const { error } = await supabase.from("convites").delete().eq("id", id);
  if (error) throw error;
}
