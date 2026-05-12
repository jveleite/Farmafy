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
 * Finaliza uma venda completa — chama a RPC atômica `finalizar_venda` no
 * Supabase. A RPC insere a venda, insere os itens e debita o estoque numa
 * única transação Postgres. Se qualquer passo falhar (estoque insuficiente
 * inclusive), a transação inteira é desfeita.
 *
 * O SQL da RPC mora em /supabase/finalizar_venda.sql. Pra criar/atualizar
 * no banco: cole no SQL Editor do dashboard do Supabase e clique Run.
 */
export async function finalizarVenda({ venda, itens }) {
  const { data, error } = await supabase.rpc("finalizar_venda", {
    p_cliente_id:   venda.cliente_id,
    p_cliente_nome: venda.cliente_nome,
    p_total:        venda.total,
    p_pagamento:    venda.pagamento,
    p_recebido:     venda.recebido,
    p_troco:        venda.troco,
    p_itens: itens.map((it) => ({
      produto_id:     it.produto_id,
      quantidade:     it.quantidade,
      preco_unitario: it.preco_unitario,
    })),
  });
  if (error) throw error;
  return data; // venda_id criado
}
