import { supabase } from "../lib/supabase";

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD — KPIs, alertas e top produtos
// ════════════════════════════════════════════════════════════════════════════
//
// Todas as queries rodam em paralelo via Promise.all.
// A única exceção é topProdutos, que depende dos IDs das vendas da semana.

export async function carregarDashboard() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const semanaAtras = new Date(hoje);
  semanaAtras.setDate(semanaAtras.getDate() - 7);

  const em30dias = new Date(hoje);
  em30dias.setDate(em30dias.getDate() + 30);

  // Roda as 4 queries independentes em paralelo
  const [vendasHojeRes, fiadoRes, validadeRes, vendsSemanaRes] = await Promise.all([
    // Vendas de hoje (para faturamento e contagem)
    supabase
      .from("vendas")
      .select("id, total")
      .gte("created_at", hoje.toISOString())
      .lt("created_at", amanha.toISOString()),

    // Fiado em aberto (todas as vendas fiadas não quitadas)
    supabase
      .from("vendas")
      .select("total")
      .like("pagamento", "%Fiado%")
      .is("fiado_quitado_em", null),

    // Produtos com validade nos próximos 30 dias (ou já vencidos) com estoque
    supabase
      .from("produtos")
      .select("id, nome, estoque, validade")
      .not("validade", "is", null)
      .lte("validade", em30dias.toISOString().split("T")[0])
      .gt("estoque", 0)
      .order("validade", { ascending: true }),

    // IDs das vendas da última semana (para calcular top produtos)
    supabase
      .from("vendas")
      .select("id")
      .gte("created_at", semanaAtras.toISOString()),
  ]);

  for (const r of [vendasHojeRes, fiadoRes, validadeRes, vendsSemanaRes]) {
    if (r.error) throw r.error;
  }

  // ── Top produtos da semana ──────────────────────────────────────────────
  // Busca itens das vendas da semana e agrega por produto
  let topProdutos = [];
  const vendsSemana = vendsSemanaRes.data || [];

  if (vendsSemana.length > 0) {
    const ids = vendsSemana.map((v) => v.id);
    const { data: itens, error: eItens } = await supabase
      .from("itens_venda")
      .select("produto_id, quantidade, produtos(nome)")
      .in("venda_id", ids);

    if (eItens) throw eItens;

    const mapa = new Map();
    for (const it of itens || []) {
      const id   = it.produto_id;
      const nome = it.produtos?.nome || "Produto removido";
      const prev = mapa.get(id) || { id, nome, quantidade: 0 };
      mapa.set(id, { id, nome, quantidade: prev.quantidade + Number(it.quantidade) });
    }

    topProdutos = [...mapa.values()]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }

  // ── KPIs ────────────────────────────────────────────────────────────────
  const vendasHoje      = vendasHojeRes.data || [];
  const faturamentoHoje = vendasHoje.reduce((s, v) => s + Number(v.total), 0);
  const qtdVendasHoje   = vendasHoje.length;
  const ticketMedioHoje = qtdVendasHoje > 0 ? faturamentoHoje / qtdVendasHoje : 0;
  const fiadoEmAberto   = (fiadoRes.data || []).reduce((s, v) => s + Number(v.total), 0);

  // ── Alertas de validade com diasRestantes calculado ─────────────────────
  const alertasValidade = (validadeRes.data || []).map((p) => {
    // "T00:00:00" garante parse na timezone local, não UTC
    const validade      = new Date(p.validade + "T00:00:00");
    const diasRestantes = Math.ceil((validade - hoje) / 86_400_000);
    return { ...p, diasRestantes };
  });

  return {
    faturamentoHoje,
    qtdVendasHoje,
    ticketMedioHoje,
    fiadoEmAberto,
    alertasValidade,
    topProdutos,
  };
}
