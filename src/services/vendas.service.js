import { supabase } from "../lib/supabase";

export async function listarVendas() {
  const { data, error } = await supabase
    .from("vendas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarVendasComItens() {
  const { data, error } = await supabase
    .from("vendas")
    .select("*, itens_venda(*)");
  if (error) throw error;
  return data || [];
}

export async function listarItensDaVenda(vendaId) {
  const { data, error } = await supabase
    .from("itens_venda")
    .select(`*, produtos(nome)`)
    .eq("venda_id", vendaId);
  if (error) throw error;
  return data || [];
}

/**
 * Finaliza uma venda completa: insere venda, insere itens, debita estoque.
 *
 * IMPORTANTE: hoje os 3 passos são separados — se o segundo falhar, a venda
 * fica órfã. Próximo passo (Rodada 6) é virar isso uma RPC `finalizar_venda`
 * no Supabase, atômica via transação.
 */
export async function finalizarVenda({ venda, itens }) {
  // 1. cria a venda
  const { data: vendaCriada, error: erroVenda } = await supabase
    .from("vendas")
    .insert(venda)
    .select()
    .single();
  if (erroVenda) throw erroVenda;

  // 2. cria os itens
  const itensComId = itens.map((it) => ({ ...it, venda_id: vendaCriada.id }));
  const { error: erroItens } = await supabase
    .from("itens_venda")
    .insert(itensComId);
  if (erroItens) throw erroItens;

  // 3. debita estoque (paralelo — TODO: virar RPC com transação)
  await Promise.all(
    itens.map((it) =>
      supabase
        .from("produtos")
        .update({ estoque: it.estoque_anterior - it.quantidade })
        .eq("id", it.produto_id)
    )
  );

  return vendaCriada;
}
