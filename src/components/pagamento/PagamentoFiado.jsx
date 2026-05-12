import { colors, radius } from "../../styles/tokens";

/**
 * Aviso de fiado — exige cliente identificado.
 *
 * Props:
 *  cliente : { id, nome } | null
 */
export default function PagamentoFiado({ cliente }) {
  return (
    <div style={styles.box}>
      <span style={{ fontSize: 28 }}>🤝</span>
      <div>
        <div style={{ fontWeight: 600 }}>Fiado</div>
        <div style={{ fontSize: 13, color: colors.textSubtle, marginTop: 2 }}>
          {cliente
            ? `Será registrado na conta de ${cliente.nome}.`
            : "Selecione um cliente no carrinho para registrar fiado."}
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
    background: "#fffbeb",
    border: `1px solid ${colors.warningBorder2}`,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 4,
  },
};
