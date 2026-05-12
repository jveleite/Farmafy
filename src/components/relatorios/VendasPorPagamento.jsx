import { fmt } from "../../lib/format";
import { colors, radius, shadow } from "../../styles/tokens";
import BarraSimples from "./BarraSimples";

/**
 * Lista de formas de pagamento com % do faturamento.
 *
 * Props:
 *  itens : [{ forma, qtd, valor }]
 */
export default function VendasPorPagamento({ itens }) {
  const max = Math.max(...itens.map((i) => i.valor), 1);

  return (
    <div style={styles.box}>
      <h3 style={styles.titulo}>💳 Vendas por forma de pagamento</h3>

      {itens.length === 0 ? (
        <div style={styles.vazio}>Sem dados no período.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {itens.map((it) => (
            <div key={it.forma} style={styles.linha}>
              <div style={styles.cabecalho}>
                <strong style={{ flex: 1 }}>{it.forma}</strong>
                <span style={styles.qtd}>{it.qtd}x</span>
                <span style={styles.valor}>{fmt(it.valor)}</span>
              </div>
              <BarraSimples valor={it.valor} max={max} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  box: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: 18,
    boxShadow: shadow.card,
  },
  titulo: { fontSize: 15, marginBottom: 14 },
  vazio: { color: colors.textSubtle, padding: 20, textAlign: "center", fontSize: 13 },
  linha: { display: "flex", flexDirection: "column", gap: 4 },
  cabecalho: { display: "flex", alignItems: "center", gap: 12, fontSize: 13 },
  qtd: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: colors.brand,
    minWidth: 36,
    textAlign: "right",
  },
  valor: {
    fontFamily: "monospace",
    color: colors.textSubtle,
    minWidth: 80,
    textAlign: "right",
  },
};
