import { fmt, parseBRL } from "../../lib/format";
import { FORMAS_PAGAMENTO } from "../../lib/pagamentos";
import { colors, radius } from "../../styles/tokens";
import Field from "../../ui/Field";
import PagamentoPix from "./PagamentoPix";
import PagamentoDinheiro from "./PagamentoDinheiro";
import PagamentoCartao from "./PagamentoCartao";
import PagamentoFiado from "./PagamentoFiado";

/**
 * Bloco de UMA forma de pagamento (PIX, Dinheiro, Cartão, etc).
 * Inclui as tabs de seleção, o input de valor (se for multi-forma)
 * e o conteúdo específico da forma escolhida (delegado pros sub-componentes).
 *
 * Props (chamado pelo ModalPagamento):
 *  idx, item, total, umaForma, formas
 *  recebido, setRecebido, troco, falta
 *  setFormaValor, removeForma
 *  copiarPix, copiado
 *  cliente, chavePix
 */
export default function FormaItem({
  idx,
  item,
  total,
  umaForma,
  formas,
  recebido,
  setRecebido,
  troco,
  falta,
  setFormaValor,
  removeForma,
  copiarPix,
  copiado,
  cliente,
  chavePix,
}) {
  const isDinheiro = item.forma === "Dinheiro";
  const isPix      = item.forma === "PIX";
  const isCredito  = item.forma === "Credito";
  const isDebito   = item.forma === "Debito";
  const isFiado    = item.forma === "Fiado";

  const vlDinheiro = umaForma ? total : parseBRL(item.valor || "0");

  return (
    <div style={styles.box}>
      <div style={styles.head}>
        <span style={{ fontWeight: 600, fontSize: 13, color: colors.textMuted }}>
          {umaForma ? "Forma de pagamento" : `Forma ${idx + 1}`}
        </span>
        {!umaForma && formas.length > 1 && (
          <button style={styles.btnRemover} onClick={() => removeForma(idx)}>
            ✕
          </button>
        )}
      </div>

      {/* Tabs de forma de pagamento */}
      <div style={styles.tabs}>
        {FORMAS_PAGAMENTO.map((f) => {
          const ativa = item.forma === f.value;
          return (
            <div
              key={f.value}
              className="tab-forma"
              style={{
                ...styles.tab,
                borderColor: ativa ? colors.brand : colors.border,
                background:  ativa ? colors.brandBgSoft : colors.surface,
                color:       ativa ? colors.brand : colors.textMuted,
                fontWeight:  ativa ? 700 : 500,
              }}
              onClick={() => setFormaValor(idx, "forma", f.value)}
            >
              <span>{f.emoji}</span>
              <span style={{ fontSize: 11 }}>{f.label}</span>
            </div>
          );
        })}
      </div>

      {/* Input de valor parcial — só em multi-forma */}
      {!umaForma && (
        <Field label="Valor nesta forma">
          <div style={{ position: "relative" }}>
            <span style={styles.prefixo}>R$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              value={item.valor}
              onChange={(e) => setFormaValor(idx, "valor", e.target.value)}
              style={styles.inputValor}
            />
          </div>
          {falta > 0.005 && (
            <button
              style={styles.btnUsarRestante}
              onClick={() => setFormaValor(idx, "valor", falta.toFixed(2))}
            >
              Usar restante ({fmt(falta)})
            </button>
          )}
        </Field>
      )}

      {/* Conteúdo específico da forma */}
      {isPix && <PagamentoPix chave={chavePix} copiado={copiado} onCopiar={copiarPix} />}
      {isDinheiro && (
        <PagamentoDinheiro
          recebido={recebido}
          setRecebido={setRecebido}
          vlDinheiro={vlDinheiro}
          troco={troco}
        />
      )}
      {isCredito && <PagamentoCartao tipo="credito" />}
      {isDebito  && <PagamentoCartao tipo="debito"  />}
      {isFiado   && <PagamentoFiado cliente={cliente} />}
    </div>
  );
}

const styles = {
  box: {
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: "16px 16px 14px",
    marginBottom: 14,
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  btnRemover: {
    background: colors.dangerBgSoft,
    color: colors.danger,
    border: "none",
    borderRadius: radius.sm,
    width: 26,
    height: 26,
    cursor: "pointer",
    fontWeight: 700,
  },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  tab: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    padding: "8px 10px",
    borderRadius: radius.md,
    border: "2px solid",
    minWidth: 58,
    userSelect: "none",
    cursor: "pointer",
    transition: "all .12s",
  },
  prefixo: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: colors.textSubtle,
    fontWeight: 600,
    fontSize: 15,
  },
  inputValor: {
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
  btnUsarRestante: {
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
};
