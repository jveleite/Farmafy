import { colors, radius } from "../../styles/tokens";

/**
 * Aviso simples pra cartão (operação acontece na maquininha física).
 *
 * Props:
 *  tipo : "credito" | "debito"
 */
export default function PagamentoCartao({ tipo }) {
  return (
    <div style={styles.box}>
      <span style={{ fontSize: 28 }}>💳</span>
      <div>
        <div style={{ fontWeight: 600 }}>
          {tipo === "credito" ? "Cartão de Crédito" : "Cartão de Débito"}
        </div>
        <div style={{ fontSize: 13, color: colors.textSubtle, marginTop: 2 }}>
          Insira ou aproxime o cartão na maquininha.
        </div>
      </div>
    </div>
  );
}

const styles = {
  box: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: colors.surfaceAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 4,
  },
};
