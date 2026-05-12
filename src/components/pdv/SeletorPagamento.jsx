import { FORMAS_PAGAMENTO } from "../../lib/pagamentos";
import { colors, radius } from "../../styles/tokens";
import Field from "../../ui/Field";

/**
 * Linha de botões pra escolher forma de pagamento (PIX/Dinheiro/Crédito/Débito/Fiado).
 *
 * Props:
 *  pagamento    : string (value de FORMAS_PAGAMENTO)
 *  setPagamento : (value) => void
 */
export default function SeletorPagamento({ pagamento, setPagamento }) {
  return (
    <Field label="Forma de pagamento">
      <div style={styles.linha}>
        {FORMAS_PAGAMENTO.map((p) => {
          const ativo = pagamento === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setPagamento(p.value)}
              style={{
                ...styles.btn,
                border: `2px solid ${ativo ? colors.brand : colors.border}`,
                background: ativo ? colors.brandBgSoft : colors.surface,
                color: ativo ? colors.brand : colors.textMuted,
                fontWeight: ativo ? 700 : 500,
              }}
            >
              <span style={{ fontSize: 18 }}>{p.emoji}</span>
              {p.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

const styles = {
  linha: { display: "flex", gap: 6, flexWrap: "wrap" },
  btn: {
    flex: 1,
    minWidth: 52,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    padding: "8px 4px",
    borderRadius: radius.md,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .15s",
  },
};
