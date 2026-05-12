import { fmt, parseBRL } from "../../lib/format";
import { findForma } from "../../lib/pagamentos";
import { colors, radius } from "../../styles/tokens";

/**
 * Etapa 2 do modal: tela de confirmação com resumo + botões.
 *
 * Props:
 *  formas, total, umaForma, temFiado, temDinheiro
 *  recebidoNum, troco
 *  cliente
 *  onVoltar, onConfirmar
 */
export default function ResumoConfirmacao({
  formas,
  total,
  umaForma,
  temFiado,
  temDinheiro,
  recebidoNum,
  troco,
  cliente,
  onVoltar,
  onConfirmar,
}) {
  return (
    <div style={{ animation: "fadeIn .2s ease" }}>
      <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          Confirmar venda?
        </div>
        {cliente && (
          <div style={{ color: colors.textSubtle, fontSize: 14 }}>👤 {cliente.nome}</div>
        )}
      </div>

      <div style={styles.resumo}>
        {formas.map((f, i) => {
          const def = findForma(f.forma);
          const vl = umaForma ? total : parseBRL(f.valor);
          return <Row key={i} label={`${def?.emoji} ${def?.label}`} valor={fmt(vl)} />;
        })}
        <div style={{ borderTop: `1px solid ${colors.border}`, margin: "8px 0" }} />
        <Row label="Total" valor={fmt(total)} bold />
        {temDinheiro && recebidoNum > 0 && (
          <Row label="Recebido" valor={fmt(recebidoNum)} />
        )}
        {troco > 0 && (
          <Row label="Troco 💵" valor={fmt(troco)} cor={colors.brand} bold />
        )}
        {temFiado && cliente && (
          <div style={styles.aviso}>
            🤝 Parte em fiado será registrada para {cliente.nome}.
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button style={styles.btnVoltar} onClick={onVoltar}>
          ← Voltar
        </button>
        <button style={styles.btnConfirmar} onClick={onConfirmar}>
          ✅ Finalizar Venda
        </button>
      </div>
    </div>
  );
}

function Row({ label, valor, cor, bold }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontSize: 14,
      }}
    >
      <span style={{ color: colors.textSubtle }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: cor || colors.text }}>
        {valor}
      </span>
    </div>
  );
}

const styles = {
  resumo: {
    background: colors.surfaceAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: "12px 16px",
    marginBottom: 16,
  },
  aviso: {
    background: "#fffbeb",
    border: `1px solid ${colors.warningBorder2}`,
    borderRadius: radius.md,
    padding: "10px 14px",
    fontSize: 13,
    color: colors.warningDark,
    marginTop: 10,
  },
  btnVoltar: {
    flex: 1,
    background: colors.surfaceMute,
    color: colors.textMuted,
    border: "none",
    padding: 16,
    borderRadius: radius.lg,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnConfirmar: {
    flex: 2,
    background: colors.brand,
    color: "#fff",
    border: "none",
    padding: 16,
    borderRadius: radius.lg,
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
