import { fmt } from "../../lib/format";
import { findForma } from "../../lib/pagamentos";
import { colors, radius } from "../../styles/tokens";

/**
 * Box com valor total + botão de finalizar a venda (abre modal de pagamento).
 *
 * Props:
 *  total       : number
 *  vazio       : boolean (carrinho vazio)
 *  pagamento   : string  (forma pré-selecionada, vai no label)
 *  finalizando : boolean
 *  onPagar     : () => void
 */
export default function RodapeTotal({ total, vazio, pagamento, finalizando, onPagar }) {
  const forma = findForma(pagamento);

  return (
    <>
      <div
        style={{
          ...styles.totalBox,
          background: vazio ? colors.surfaceAlt : colors.brandBgSoft,
          borderColor: vazio ? colors.border : colors.brandBorder,
        }}
      >
        <span style={{ fontSize: 13, color: colors.textSubtle }}>Total</span>
        <span
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: vazio ? colors.textFaint : colors.brand,
          }}
        >
          {fmt(total)}
        </span>
      </div>

      <button
        style={{
          ...styles.btnFinalizar,
          background: vazio ? "#94a3b8" : colors.brand,
        }}
        onClick={onPagar}
        disabled={finalizando || vazio}
      >
        {finalizando ? (
          <>
            <Spinner /> Finalizando...
          </>
        ) : (
          <>Pagar {forma?.emoji} {forma?.label}</>
        )}
      </button>
    </>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2px solid rgba(255,255,255,.4)",
        borderTop: "2px solid #fff",
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
        verticalAlign: "middle",
        marginRight: 6,
      }}
    />
  );
}

const styles = {
  totalBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid",
    borderRadius: radius.lg,
    padding: "10px 16px",
    marginBottom: 14,
    transition: "all .3s",
  },
  btnFinalizar: {
    width: "100%",
    color: "#fff",
    border: "none",
    padding: 16,
    borderRadius: radius.lg,
    fontSize: 17,
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: "inherit",
    transition: "filter .15s",
  },
};
