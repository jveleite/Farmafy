import { useEffect, useState } from "react";
import { gerarVisaoGeral } from "../../services/financeiro.service";
import { useToast } from "../../ui/Toast";
import { fmt } from "../../lib/format";
import { colors, radius, shadow } from "../../styles/tokens";

export default function VisaoGeral() {
  const toast = useToast();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      setDados(await gerarVisaoGeral());
    } catch (e) {
      toast("Erro ao carregar visão geral: " + e.message, "erro");
    } finally {
      setLoading(false);
    }
  }

  if (loading || !dados) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  return (
    <div style={styles.grid}>
      <Card titulo="Faturamento hoje"  valor={fmt(dados.faturamentoHoje)}  cor={colors.brand}   icone="📅" />
      <Card titulo="Faturamento mês"   valor={fmt(dados.faturamentoMes)}   cor={colors.brand}   icone="💰" />
      <Card titulo="Fiado em aberto"   valor={fmt(dados.fiadoEmAberto)}    cor={colors.warning} icone="🤝" />
      <Card titulo="Ticket médio (mês)" valor={fmt(dados.ticketMedio)}     cor={colors.info}    icone="🎫" />
    </div>
  );
}

function Card({ titulo, valor, cor, icone }) {
  return (
    <div style={styles.card}>
      <div style={styles.titulo}>
        <span style={{ marginRight: 6 }}>{icone}</span>{titulo}
      </div>
      <div style={{ ...styles.valor, color: cor }}>{valor}</div>
    </div>
  );
}

const styles = {
  loading: { padding: 30, color: colors.textSubtle, textAlign: "center" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  card: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: 18,
    boxShadow: shadow.card,
  },
  titulo: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: ".3px",
    marginBottom: 8,
  },
  valor: { fontSize: 26, fontWeight: 700, fontFamily: "monospace" },
};
