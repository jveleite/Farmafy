import { supabase } from "../lib/supabase";

export async function listarClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function criarCliente(dados) {
  const { error } = await supabase.from("clientes").insert(dados);
  if (error) throw error;
}

export async function atualizarCliente(id, dados) {
  const { error } = await supabase.from("clientes").update(dados).eq("id", id);
  if (error) throw error;
}

export async function removerCliente(id) {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw error;
}
