import { fmt } from "../../lib/format";
import { colors, radius, shadow } from "../../styles/tokens";
import BarraSimples from "./BarraSimples";

/**
 * Top 10 produtos mais vendidos no período (por quantidade).
 *
 * Props:
 *  produtos : [{ id, nome, quantidade, valor }]
 */
export default function TopProdutos({ produtos }) {
  const max = Math.max(...produtos.map((p) => p.quantidade), 1);

  return (
    <div style={styles.box}>
      <h3 style={styles.titulo}>🏆 Top produtos</h3>

      {produtos.length === 0 ? (
        <div style={styles.vazio}>Nenhuma venda registrada no período.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {produtos.map((p) => (
            <div key={p.id} style={styles.linha}>
              <div style={styles.cabecalho}>
                <strong style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.nome}
                </strong>
                <span style={styles.qtd}>{p.quantidade}x</span>
                <span style={styles.valor}>{fmt(p.valor)}</span>
              </div>
              <BarraSimples valor={p.quantidade} max={max} />
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
