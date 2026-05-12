import { supabase } from "../lib/supabase";

/**
 * Gera o relatório consolidado pra um período.
 * Faz 2 queries (vendas + itens_venda com join produtos) e calcula métricas em JS.
 *
 * Pra volumes grandes, futuramente vale virar uma RPC.
 *
 * @param {Date} dataIni
 * @param {Date} dataFim
 * @returns {Promise<RelatorioPeriodo>}
 */
export async function gerarRelatorio(dataIni, dataFim) {
  // 1. carrega vendas no período
  const { data: vendas, error: e1 } = await supabase
    .from("vendas")
    .select("id, total, pagamento, created_at")
    .gte("created_at", dataIni.toISOString())
    .lt("created_at", dataFim.toISOString());
  if (e1) throw e1;

  const vendasArr = vendas || [];

  // 2. carrega itens dessas vendas (com join em produtos pra pegar preco_compra)
  let itens = [];
  if (vendasArr.length > 0) {
    const ids = vendasArr.map((v) => v.id);
    const { data, error: e2 } = await supabase
      .from("itens_venda")
      .select(
        "produto_id, quantidade, preco_unitario, produtos(id, nome, preco_compra)"
      )
      .in("venda_id", ids);
    if (e2) throw e2;
    itens = data || [];
  }

  return calcularMetricas(vendasArr, itens);
}

function calcularMetricas(vendas, itens) {
  const qtdVendas    = vendas.length;
  const faturamento  = vendas.reduce((s, v) => s + Number(v.total), 0);
  const ticketMedio  = qtdVendas > 0 ? faturamento / qtdVendas : 0;

  // Lucro estimado: para cada item, (preco_venda - preco_compra) × quantidade.
  const lucroEstimado = itens.reduce((s, it) => {
    const compra = Number(it.produtos?.preco_compra ?? 0);
    const venda  = Number(it.preco_unitario);
    return s + (venda - compra) * Number(it.quantidade);
  }, 0);

  // Vendas por forma de pagamento — agrupa pela string completa
  // (pra split de pagamento aparece como "PIX + Dinheiro" mesmo)
  const mapPag = new Map();
  for (const v of vendas) {
    const k = v.pagamento || "—";
    const prev = mapPag.get(k) || { qtd: 0, valor: 0 };
    mapPag.set(k, {
      qtd: prev.qtd + 1,
      valor: prev.valor + Number(v.total),
    });
  }
  const porPagamento = [...mapPag.entries()]
    .map(([forma, m]) => ({ forma, ...m }))
    .sort((a, b) => b.valor - a.valor);

  // Top produtos por quantidade vendida
  const mapProd = new Map();
  for (const it of itens) {
    const id   = it.produto_id;
    const nome = it.produtos?.nome || "Produto removido";
    const prev = mapProd.get(id) || { id, nome, quantidade: 0, valor: 0 };
    mapProd.set(id, {
      id,
      nome,
      quantidade: prev.quantidade + Number(it.quantidade),
      valor: prev.valor + Number(it.quantidade) * Number(it.preco_unitario),
    });
  }
  const topProdutos = [...mapProd.values()]
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10);

  return {
    qtdVendas,
    faturamento,
    lucroEstimado,
    ticketMedio,
    porPagamento,
    topProdutos,
  };
}
