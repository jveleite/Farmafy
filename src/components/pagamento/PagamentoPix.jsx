import { colors, radius } from "../../styles/tokens";
import QRCodePix from "./QRCodePix";

/**
 * Bloco visual da forma PIX: QR + chave + botão de copiar.
 *
 * Props:
 *  chave    : string (chave PIX configurada)
 *  copiado  : boolean
 *  onCopiar : () => void
 */
export default function PagamentoPix({ chave, copiado, onCopiar }) {
  return (
    <div style={styles.box}>
      <QRCodePix chave={chave} size={150} />

      <div style={styles.chave}>
        <span style={{ fontSize: 11, color: colors.textFaint, display: "block", marginBottom: 4 }}>
          Chave PIX
        </span>
        <span style={{ fontWeight: 600, wordBreak: "break-all" }}>{chave}</span>
      </div>

      <button
        style={{
          ...styles.btnCopiar,
          background: copiado ? "#059669" : colors.brand,
        }}
        onClick={onCopiar}
      >
        {copiado ? "✅ Copiado!" : "📋 Copiar chave PIX"}
      </button>

      <div style={styles.dica}>
        Escaneie o QR Code ou copie a chave no app do banco.
      </div>
    </div>
  );
}

const styles = {
  box: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },
  chave: {
    background: colors.surfaceAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: "10px 14px",
    fontSize: 13,
    color: "#1e293b",
    wordBreak: "break-all",
    textAlign: "center",
    width: "100%",
    boxSizing: "border-box",
  },
  btnCopiar: {
    color: "#fff",
    border: "none",
    borderRadius: radius.md,
    padding: "10px 20px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    transition: "background .2s",
    fontFamily: "inherit",
  },
  dica: {
    fontSize: 12,
    color: colors.textFaint,
    textAlign: "center",
  },
};
