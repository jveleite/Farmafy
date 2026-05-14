import { useEffect, useState } from "react";
import { useAuth } from "../../ui/Auth";
import { useToast } from "../../ui/Toast";
import { carregarDashboard } from "../../services/dashboard.service";
import { fmt } from "../../lib/format";
import { colors, radius, shadow } from "../../styles/tokens";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function dataLonga() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function corAlerta(diasRestantes) {
  if (diasRestantes <= 0)  return { bg: colors.dangerBgSoft,  borda: colors.dangerBorder,  texto: colors.danger };
  if (diasRestantes <= 7)  return { bg: colors.dangerBgSoft,  borda: colors.dangerBorder,  texto: colors.danger };
  return                          { bg: colors.warningBgSoft, borda: colors.warningBorder, texto: colors.warning };
}

function labelDias(d) {
  if (d <= 0)   return "Vencido!";
  if (d === 1)  return "Vence amanhã";
  return `${d} dias`;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Dashboard() {
  const { profile, permissoes } = useAuth();
  const toast                   = useToast();
  const [dados, setDados]       = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      setDados(await carregarDashboard());
    } catch (e) {
      toast("Erro ao carregar dashboard: " + e.message, "erro");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={s.loading}>Carregando...</div>;
  }

  if (!dados) return null;

  const primeiroNome = profile?.nome?.split(" ")[0] || "bem-vindo";

  return (
    <div style={s.outer}>

      {/* ── CABEÇALHO ─────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div>
          <div style={s.titulo}>{saudacao()}, {primeiroNome}! 👋</div>
          <div style={s.subtitulo}>{dataLonga()}</div>
        </div>
        <button style={s.btnAtualizar} onClick={carregar} title="Atualizar dados">
          🔄 Atualizar
        </button>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────────────────── */}
      <div style={s.kpiGrid}>
        <KPICard
          titulo="Vendas hoje"
          valor={String(dados.qtdVendasHoje)}
          sufixo={dados.qtdVendasHoje === 1 ? "venda" : "vendas"}
          icone="🧾"
          cor={colors.info}
        />
        <KPICard
          titulo="Faturamento hoje"
          valor={fmt(dados.faturamentoHoje)}
          icone="💰"
          cor={colors.brand}
        />
        {permissoes.veFinanceiro && (
          <KPICard
            titulo="Fiado em aberto"
            valor={fmt(dados.fiadoEmAberto)}
            icone="🤝"
            cor={dados.fiadoEmAberto > 0 ? colors.warning : colors.brand}
          />
        )}
        <KPICard
          titulo="Ticket médio hoje"
          valor={dados.qtdVendasHoje > 0 ? fmt(dados.ticketMedioHoje) : "—"}
          icone="🎫"
          cor={colors.info}
        />
      </div>

      {/* ── SEÇÃO INFERIOR (alertas + top produtos) ───────────────────── */}
      <div style={s.bottomGrid}>

        {/* Alertas de validade */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitulo}>⚠️ Alertas de Validade</span>
            <span style={s.cardSub}>próximos 30 dias</span>
          </div>

          {dados.alertasValidade.length === 0 ? (
            <div style={s.vazio}>✅ Nenhum produto vencendo nos próximos 30 dias</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dados.alertasValidade.map((p) => (
                <AlertaItem key={p.id} produto={p} />
              ))}
            </div>
          )}
        </div>

        {/* Top produtos da semana */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitulo}>🏆 Mais vendidos</span>
            <span style={s.cardSub}>últimos 7 dias</span>
          </div>

          {dados.topProdutos.length === 0 ? (
            <div style={s.vazio}>Nenhuma venda nos últimos 7 dias</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dados.topProdutos.map((p, i) => (
                <TopItem key={p.id} produto={p} rank={i + 1} max={dados.topProdutos[0].quantidade} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function KPICard({ titulo, valor, sufixo, icone, cor }) {
  return (
    <div style={s.kpiCard}>
      <div style={s.kpiTopo}>
        <span style={s.kpiIcone}>{icone}</span>
        <span style={s.kpiTitulo}>{titulo}</span>
      </div>
      <div style={{ ...s.kpiValor, color: cor }}>
        {valor}
        {sufixo && <span style={s.kpiSufixo}> {sufixo}</span>}
      </div>
    </div>
  );
}

function AlertaItem({ produto }) {
  const { diasRestantes, nome, estoque, validade } = produto;
  const { bg, borda, texto } = corAlerta(diasRestantes);

  return (
    <div style={{ ...s.alertaRow, background: bg, borderColor: borda }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...s.alertaNome, color: texto }}>{nome}</div>
        <div style={s.alertaInfo}>
          Vence em: <strong>{new Date(validade + "T00:00:00").toLocaleDateString("pt-BR")}</strong>
          {" · "}Estoque: <strong>{estoque}</strong>
        </div>
      </div>
      <div style={{ ...s.alertaBadge, background: texto, color: "#fff" }}>
        {labelDias(diasRestantes)}
      </div>
    </div>
  );
}

function TopItem({ produto, rank, max }) {
  const pct = max > 0 ? (produto.quantidade / max) * 100 : 0;
  const medalhas = ["🥇", "🥈", "🥉"];

  return (
    <div style={s.topRow}>
      <div style={s.topRank}>
        {medalhas[rank - 1] ?? <span style={s.topNum}>{rank}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.topNome}>{produto.nome}</div>
        <div style={s.topBarra}>
          <div style={{ ...s.topBarraFill, width: `${pct}%` }} />
        </div>
      </div>
      <div style={s.topQtd}>{produto.quantidade} un.</div>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = {
  loading: {
    padding: 40,
    color: colors.textSubtle,
    textAlign: "center",
    fontSize: 14,
  },

  outer: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    maxWidth: 1100,
  },

  // Cabeçalho
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.text,
    letterSpacing: "-0.02em",
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSubtle,
    marginTop: 2,
    textTransform: "capitalize",
  },
  btnAtualizar: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: "7px 14px",
    fontSize: 13,
    color: colors.textMuted,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  // KPI grid
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14,
  },
  kpiCard: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: "18px 20px",
    boxShadow: shadow.card,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  kpiTopo: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  kpiIcone: {
    fontSize: 16,
  },
  kpiTitulo: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: ".4px",
  },
  kpiValor: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    fontFamily: "monospace",
    lineHeight: 1,
  },
  kpiSufixo: {
    fontSize: 13,
    fontWeight: 400,
    fontFamily: "inherit",
    color: colors.textSubtle,
  },

  // Seção inferior
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  card: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: "20px 22px",
    boxShadow: shadow.card,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  cardHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.text,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textFaint,
  },
  vazio: {
    fontSize: 13,
    color: colors.textSubtle,
    textAlign: "center",
    padding: "20px 0",
  },

  // Alerta
  alertaRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: radius.md,
    border: "1px solid",
  },
  alertaNome: {
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  alertaInfo: {
    fontSize: 11,
    color: colors.textSubtle,
    marginTop: 2,
  },
  alertaBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: radius.pill,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  // Top produtos
  topRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  topRank: {
    width: 24,
    textAlign: "center",
    fontSize: 18,
    flexShrink: 0,
  },
  topNum: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.textFaint,
  },
  topNome: {
    fontSize: 13,
    fontWeight: 500,
    color: colors.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: 4,
  },
  topBarra: {
    height: 4,
    background: colors.surfaceMute,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  topBarraFill: {
    height: "100%",
    background: colors.brand,
    borderRadius: radius.pill,
    transition: "width .4s ease",
  },
  topQtd: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.textMuted,
    whiteSpace: "nowrap",
    flexShrink: 0,
    minWidth: 40,
    textAlign: "right",
  },
};
