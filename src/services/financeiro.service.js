import { supabase } from "../lib/supabase";

// ════════════════════════════════════════════════════════════════════════════
// VISÃO GERAL
// ════════════════════════════════════════════════════════════════════════════

export async function gerarVisaoGeral() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const inicioProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

  const [hojeRes, mesRes, fiadoRes, qtdRes] = await Promise.all([
    supabase.from("vendas").select("total")
      .gte("created_at", hoje.toISOString())
      .lt("created_at", amanha.toISOString()),
    supabase.from("vendas").select("total")
      .gte("created_at", inicioMes.toISOString())
      .lt("created_at", inicioProximoMes.toISOString()),
    supabase.from("vendas").select("total")
      .like("pagamento", "%Fiado%")
      .is("fiado_quitado_em", null),
    supabase.from("vendas").select("total")
      .gte("created_at", inicioMes.toISOString())
      .lt("created_at", inicioProximoMes.toISOString()),
  ]);

  for (const r of [hojeRes, mesRes, fiadoRes, qtdRes]) {
    if (r.error) throw r.error;
  }

  const faturamentoHoje = (hojeRes.data || []).reduce((s, v) => s + Number(v.total), 0);
  const faturamentoMes  = (mesRes.data  || []).reduce((s, v) => s + Number(v.total), 0);
  const fiadoEmAberto   = (fiadoRes.data || []).reduce((s, v) => s + Number(v.total), 0);
  const qtdVendasMes    = (qtdRes.data || []).length;
  const ticketMedio     = qtdVendasMes > 0 ? faturamentoMes / qtdVendasMes : 0;

  return { faturamentoHoje, faturamentoMes, fiadoEmAberto, ticketMedio };
}

// ════════════════════════════════════════════════════════════════════════════
// FIADO A RECEBER
// ════════════════════════════════════════════════════════════════════════════

export async function listarFiadoAberto() {
  const { data, error } = await supabase
    .from("vendas")
    .select("id, cliente_id, cliente_nome, total, pagamento, created_at")
    .like("pagamento", "%Fiado%")
    .is("fiado_quitado_em", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function quitarFiado(vendaId) {
  const { error } = await supabase
    .from("vendas")
    .update({ fiado_quitado_em: new Date().toISOString() })
    .eq("id", vendaId);
  if (error) throw error;
}

// ════════════════════════════════════════════════════════════════════════════
// DESPESAS
// ════════════════════════════════════════════════════════════════════════════

// filtro: "todas" | "a_pagar" | "pagas"
export async function listarDespesas(filtro = "todas") {
  let q = supabase.from("despesas").select("*").order("data_vencimento", { ascending: true });
  if (filtro === "a_pagar") q = q.eq("pago", false);
  if (filtro === "pagas")   q = q.eq("pago", true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function criarDespesa(dados) {
  const { error } = await supabase.from("despesas").insert(dados);
  if (error) throw error;
}

export async function atualizarDespesa(id, dados) {
  const { error } = await supabase.from("despesas").update(dados).eq("id", id);
  if (error) throw error;
}

export async function removerDespesa(id) {
  const { error } = await supabase.from("despesas").delete().eq("id", id);
  if (error) throw error;
}

export async function marcarDespesaPaga(id, pago = true) {
  const { error } = await supabase
    .from("despesas")
    .update({ pago, pago_em: pago ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

// ════════════════════════════════════════════════════════════════════════════
// CAIXA — sessões e movimentações
// ════════════════════════════════════════════════════════════════════════════

export async function sessaoCaixaAtiva() {
  const { data, error } = await supabase
    .from("caixa_sessoes")
    .select("*")
    .eq("status", "aberta")
    .order("abertura_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function abrirCaixa(valorAbertura, observacao) {
  const { data, error } = await supabase
    .from("caixa_sessoes")
    .insert({
      valor_abertura: Number(valorAbertura) || 0,
      observacao: observacao || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fecharCaixa(sessao, valorContado, observacao) {
  const esperado = await calcularSaldoEsperadoCaixa(sessao);
  const diferenca = Number(valorContado) - esperado;
  const { error } = await supabase
    .from("caixa_sessoes")
    .update({
      fechamento_em: new Date().toISOString(),
      valor_contado: Number(valorContado),
      diferenca,
      observacao: observacao || sessao.observacao,
      status: "fechada",
    })
    .eq("id", sessao.id);
  if (error) throw error;
  return diferenca;
}

export async function listarMovimentacoesDaSessao(sessaoId) {
  const { data, error } = await supabase
    .from("caixa_movimentacoes")
    .select("*")
    .eq("sessao_id", sessaoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarMovimentacaoCaixa(sessaoId, tipo, valor, observacao) {
  const { error } = await supabase.from("caixa_movimentacoes").insert({
    sessao_id: sessaoId,
    tipo,
    valor: Number(valor),
    observacao: observacao || null,
  });
  if (error) throw error;
}

/**
 * Saldo esperado = abertura + vendas em dinheiro desde a abertura
 *                  + suprimentos - sangrias
 *
 * Aproximação: se a venda foi mista (PIX + Dinheiro), conta o total INTEIRO
 * como dinheiro. Pra v2: rastrear valor por forma de pagamento numa tabela
 * `pagamentos_venda` própria.
 */
export async function calcularSaldoEsperadoCaixa(sessao) {
  if (!sessao) return 0;

  const [vendasRes, movsRes] = await Promise.all([
    supabase
      .from("vendas")
      .select("total, pagamento")
      .gte("created_at", sessao.abertura_em)
      .like("pagamento", "%Dinheiro%"),
    supabase
      .from("caixa_movimentacoes")
      .select("tipo, valor")
      .eq("sessao_id", sessao.id),
  ]);
  if (vendasRes.error) throw vendasRes.error;
  if (movsRes.error)   throw movsRes.error;

  const vendasDinheiro = (vendasRes.data || []).reduce((s, v) => s + Number(v.total), 0);
  const movs = movsRes.data || [];
  const suprimentos = movs.filter((m) => m.tipo === "suprimento").reduce((s, m) => s + Number(m.valor), 0);
  const sangrias    = movs.filter((m) => m.tipo === "sangria").reduce((s, m) => s + Number(m.valor), 0);

  return Number(sessao.valor_abertura) + vendasDinheiro + suprimentos - sangrias;
}
