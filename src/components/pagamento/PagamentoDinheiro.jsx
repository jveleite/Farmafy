import { fmt, parseBRL } from "../../lib/format";
import { calcAtalhosNotas } from "../../lib/pagamentos";
import { colors, radius } from "../../styles/tokens";
import Field from "../../ui/Field";

/**
 * Bloco visual da forma Dinheiro: input recebido + atalhos + troco.
 *
 * Props:
 *  recebido    : string
 *  setRecebido : (string) => void
 *  vlDinheiro  : number  (quanto está sendo pago em dinheiro)
 *  troco       : number
 */
export default function PagamentoDinheiro({ recebido, setRecebido, vlDinheiro, troco }) {
  const recebidoNum = parseBRL(recebido);

  return (
    <div>
      <Field label="Valor recebido">
        <div style={{ position: "relative" }}>
          <span style={styles.prefixo}>R$</span>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="0,00"
            value={recebido}
            onChange={(e) => setRecebido(e.target.value)}
            style={styles.input}
            autoFocus
          />
        </div>
      </Field>

      {/* Atalhos de notas */}
      <div style={styles.atalhos}>
        {calcAtalhosNotas(vlDinheiro).map((v) => (
          <button
            key={v}
            style={styles.btnAtalho}
            onClick={() => setRecebido(v.toFixed(2))}
          >
            {fmt(v)}
          </button>
        ))}
      </div>

      {troco > 0 && (
        <div style={styles.trocoBox}>
          <span style={{ color: colors.brandText, fontSize: 14 }}>Troco</span>
          <strong style={{ fontSize: 22, color: colors.brand }}>{fmt(troco)}</strong>
        </div>
      )}

      {recebidoNum > 0 && recebidoNum < vlDinheiro && (
        <div style={styles.alerta}>⚠️ Valor insuficiente.</div>
      )}
    </div>
  );
}

const styles = {
  prefixo: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: colors.textSubtle,
    fontWeight: 600,
    fontSize: 15,
  },
  input: {
    width: "100%",
    padding: "12px 12px 12px 38px",
    border: `1.5px solid ${colors.borderStrong}`,
    borderRadius: radius.md,
    fontSize: 18,
    fontWeight: 700,
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
  },
  atalhos: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 },
  btnAtalho: {
    fontSize: 13,
    padding: "5px 12px",
    borderRadius: radius.pill,
    border: `1px solid ${colors.border}`,
    background: colors.surfaceAlt,
    cursor: "pointer",
    color: colors.brand,
    fontWeight: 600,
    marginTop: 8,
    fontFamily: "inherit",
  },
  trocoBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: colors.brandBgSoft,
    border: `1px solid ${colors.brandBorder}`,
    borderRadius: radius.md,
    padding: "10px 16px",
    marginTop: 14,
  },
  alerta: {
    background: colors.dangerBgSoft,
    color: colors.danger,
    borderRadius: radius.md,
    padding: "8px 12px",
    fontSize: 13,
    marginTop: 10,
    fontWeight: 600,
  },
};
