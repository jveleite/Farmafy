import { supabase } from "../lib/supabase";

// Todas as queries em produtos passam por aqui.
// Componentes NUNCA devem importar supabase direto.

export async function listarProdutos() {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function listarProdutosDisponiveis() {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .gt("estoque", 0)
    .order("nome");
  if (error) throw error;
  return data || [];
}

export async function criarProduto(dados) {
  const { error } = await supabase.from("produtos").insert(dados);
  if (error) throw error;
}

export async function atualizarProduto(id, dados) {
  const { error } = await supabase.from("produtos").update(dados).eq("id", id);
  if (error) throw error;
}

export async function removerProduto(id) {
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) throw error;
}

export async function adicionarEstoque(produto, quantidade) {
  const novoEstoque = produto.estoque + quantidade;
  const { error } = await supabase
    .from("produtos")
    .update({ estoque: novoEstoque })
    .eq("id", produto.id);
  if (error) throw error;
  return novoEstoque;
}
