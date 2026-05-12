import { fmt } from "../../lib/format";
import { colors, radius, shadow } from "../../styles/tokens";

/**
 * 4 cards de métricas no topo.
 *
 * Props:
 *  qtdVendas, faturamento, lucroEstimado, ticketMedio
 */
export default function CardsResumo({ qtdVendas, faturamento, lucroEstimado, ticketMedio }) {
  return (
    <div style={styles.grid}>
      <Card titulo="Vendas"      valor={qtdVendas}                cor={colors.brand}      icone="🧾" />
      <Card titulo="Faturamento" valor={fmt(faturamento)}         cor={colors.brand}      icone="💰" />
      <Card titulo="Lucro est."  valor={fmt(lucroEstimado)}       cor={colors.info}       icone="📈" />
      <Card titulo="Ticket méd." valor={fmt(ticketMedio)}         cor={colors.warning}    icone="🎫" />
    </div>
  );
}

function Card({ titulo, valor, cor, icone }) {
  return (
    <div style={styles.card}>
      <div style={styles.titulo}>
        <span style={{ marginRight: 6 }}>{icone}</span>
        {titulo}
      </div>
      <div style={{ ...styles.valor, color: cor }}>{valor}</div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  card: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: 16,
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
  valor: {
    fontSize: 24,
    fontWeight: 700,
    fontFamily: "monospace",
  },
};
