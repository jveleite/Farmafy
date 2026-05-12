import { useEffect, useMemo, useRef, useState } from "react";
import { fmt, parseBRL } from "../../lib/format";
import { colors, radius, shadow } from "../../styles/tokens";
import FormaItem from "./FormaItem";
import ResumoConfirmacao from "./ResumoConfirmacao";

const CHAVE_PIX = import.meta.env.VITE_PIX_KEY || "sua-chave-pix@banco.com";

/**
 * Orquestrador do modal de pagamento.
 *
 * Estados:
 *  - etapa "pagamento" → escolha de formas, valores, multi-pagamento
 *  - etapa "confirmacao" → resumo + botão final
 *
 * Props:
 *  aberto       : boolean
 *  total        : number
 *  formaInicial : "PIX" | "Dinheiro" | etc.
 *  cliente      : { id, nome } | null
 *  onCancelar   : () => void
 *  onConfirmar  : (dadosPagamento) => void
 *
 * dadosPagamento = { formas, recebido, troco, cliente_id }
 */
export default function ModalPagamento({
  aberto,
  total,
  formaInicial = "PIX",
  cliente,
  onCancelar,
  onConfirmar,
}) {
  const [etapa, setEtapa]       = useState("pagamento");
  const [formas, setFormas]     = useState([{ forma: formaInicial, valor: "" }]);
  const [recebido, setRecebido] = useState("");
  const [copiado, setCopiado]   = useState(false);
  const copiadoTimer            = useRef(null);

  const umaForma    = formas.length === 1;
  const temFiado    = formas.some((f) => f.forma === "Fiado");
  const temDinheiro = formas.some((f) => f.forma === "Dinheiro");

  // Reset ao abrir
  useEffect(() => {
    if (aberto) {
      setEtapa("pagamento");
      setFormas([{ forma: formaInicial, valor: "" }]);
      setRecebido("");
      setCopiado(false);
    }
  }, [aberto, formaInicial]);

  // Totais
  const totalFormas = useMemo(
    () => formas.reduce((acc, f) => acc + parseBRL(f.valor), 0),
    [formas]
  );

  const falta   = umaForma ? 0 : Math.max(0, total - totalFormas);
  const excesso = umaForma ? 0 : Math.max(0, totalFormas - total);

  const recebidoNum = parseBRL(recebido);
  const vlDinheiro = umaForma
    ? total
    : parseBRL(formas.find((f) => f.forma === "Dinheiro")?.valor || "0");
  const troco = temDinheiro ? Math.max(0, recebidoNum - vlDinheiro) : 0;

  // Validação pra liberar o "Continuar"
  const podeContinuar = useMemo(() => {
    if (umaForma) {
      if (temDinheiro) return recebidoNum >= total;
      return true;
    }
    if (Math.abs(totalFormas - total) >= 0.01) return false;
    if (temDinheiro) return recebidoNum >= vlDinheiro;
    return true;
  }, [umaForma, temDinheiro, recebidoNum, total, totalFormas, vlDinheiro]);

  // Handlers
  function addForma() {
    setFormas((f) => [...f, { forma: "PIX", valor: "" }]);
  }
  function removeForma(idx) {
    setFormas((f) => f.filter((_, i) => i !== idx));
  }
  function setFormaValor(idx, key, val) {
    setFormas((f) => f.map((item, i) => (i === idx ? { ...item, [key]: val } : item)));
  }
  function toggleMulti() {
    if (umaForma) {
      setFormas([
        { forma: formas[0].forma, valor: (total / 2).toFixed(2) },
        { forma: "Dinheiro",      valor: (total / 2).toFixed(2) },
      ]);
    } else {
      setFormas([{ forma: formas[0].forma, valor: "" }]);
    }
  }
  function copiarPix() {
    navigator.clipboard.writeText(CHAVE_PIX);
    clearTimeout(copiadoTimer.current);
    setCopiado(true);
    copiadoTimer.current = setTimeout(() => setCopiado(false), 2500);
  }
  function handleConfirmar() {
    onConfirmar({
      formas: umaForma
        ? [{ forma: formas[0].forma, valor: total }]
        : formas.map((f) => ({ ...f, valor: parseBRL(f.valor) })),
      recebido: temDinheiro ? recebidoNum : total,
      troco,
      cliente_id: cliente?.id ?? null,
    });
  }

  if (!aberto) return null;

  return (
    <>
      <div style={S.overlay} onClick={onCancelar} />
      <div style={S.modal}>
        {/* Cabeçalho */}
        <div style={S.header}>
          <div>
            <div style={S.headerTitle}>💳 Pagamento</div>
            {cliente && <div style={S.headerSub}>👤 {cliente.nome}</div>}
          </div>
          <button style={S.btnFechar} onClick={onCancelar}>✕</button>
        </div>

        {/* Banner total */}
        <div style={S.totalBanner}>
          <span style={{ fontSize: 13, color: colors.brandText, fontWeight: 600 }}>
            Total a pagar
          </span>
          <span style={{ fontSize: 26, fontWeight: 800, color: colors.brand }}>
            {fmt(total)}
          </span>
        </div>

        {/* ══ ETAPA: PAGAMENTO ══ */}
        {etapa === "pagamento" && (
          <div style={S.body}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button
                style={{
                  ...S.btnToggleMulti,
                  background:  umaForma ? colors.surfaceMute : colors.brandBgSoft,
                  color:       umaForma ? colors.textSubtle  : colors.brand,
                  borderColor: umaForma ? colors.border      : colors.brandBorder,
                }}
                onClick={toggleMulti}
              >
                {umaForma ? "＋ Dividir pagamento" : "✕ Forma única"}
              </button>
            </div>

            {formas.map((item, idx) => (
              <FormaItem
                key={idx}
                idx={idx}
                item={item}
                total={total}
                umaForma={umaForma}
                formas={formas}
                recebido={recebido}
                setRecebido={setRecebido}
                troco={troco}
                falta={falta}
                setFormaValor={setFormaValor}
                removeForma={removeForma}
                copiarPix={copiarPix}
                copiado={copiado}
                cliente={cliente}
                chavePix={CHAVE_PIX}
              />
            ))}

            {!umaForma && formas.length < 4 && (
              <button style={S.btnAddForma} onClick={addForma}>
                ＋ Adicionar forma
              </button>
            )}

            {!umaForma && (
              <div style={S.resumoMulti}>
                <Row label="Total" valor={fmt(total)} />
                <Row
                  label="Pago"
                  valor={fmt(totalFormas)}
                  cor={totalFormas > total ? colors.danger : colors.brand}
                />
                {falta   > 0.005 && <Row label="Falta"   valor={fmt(falta)}   cor={colors.danger} />}
                {excesso > 0.005 && <Row label="Excesso" valor={fmt(excesso)} cor={colors.warning} />}
                {troco   > 0     && <Row label="Troco"   valor={fmt(troco)}   cor={colors.brand} bold />}
              </div>
            )}

            {temFiado && !cliente && (
              <div style={S.aviso}>
                ⚠️ Selecione um cliente no carrinho para registrar fiado.
              </div>
            )}

            <button
              style={{
                ...S.btnConfirmar,
                background: podeContinuar && !(temFiado && !cliente) ? colors.brand : "#94a3b8",
              }}
              disabled={!podeContinuar || (temFiado && !cliente)}
              onClick={() => setEtapa("confirmacao")}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* ══ ETAPA: CONFIRMAÇÃO ══ */}
        {etapa === "confirmacao" && (
          <div style={S.body}>
            <ResumoConfirmacao
              formas={formas}
              total={total}
              umaForma={umaForma}
              temFiado={temFiado}
              temDinheiro={temDinheiro}
              recebidoNum={recebidoNum}
              troco={troco}
              cliente={cliente}
              onVoltar={() => setEtapa("pagamento")}
              onConfirmar={handleConfirmar}
            />
          </div>
        )}
      </div>
    </>
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

const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    zIndex: 100,
    animation: "fadeIn .2s ease",
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    width: "min(520px, 96vw)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: colors.surface,
    borderRadius: 16,
    zIndex: 101,
    boxShadow: shadow.modal,
    animation: "modalIn .22s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px 0",
  },
  headerTitle: { fontSize: 20, fontWeight: 700 },
  headerSub:   { fontSize: 14, color: colors.textSubtle, marginTop: 2 },
  btnFechar: {
    background: colors.surfaceMute,
    border: "none",
    borderRadius: radius.md,
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 16,
    color: colors.textSubtle,
  },
  totalBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "16px 24px 0",
    background: colors.brandBgSoft,
    border: `1px solid ${colors.brandBorder}`,
    borderRadius: radius.lg,
    padding: "12px 18px",
  },
  body: { padding: "20px 24px 24px" },
  btnToggleMulti: {
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid",
    borderRadius: 20,
    padding: "5px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnAddForma: {
    width: "100%",
    background: colors.surfaceAlt,
    border: `1.5px dashed ${colors.borderStrong}`,
    borderRadius: radius.lg,
    padding: 12,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: colors.brand,
    marginBottom: 14,
    fontFamily: "inherit",
  },
  resumoMulti: {
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
    marginBottom: 14,
  },
  btnConfirmar: {
    width: "100%",
    color: "#fff",
    border: "none",
    padding: 16,
    borderRadius: radius.lg,
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
    fontFamily: "inherit",
  },
};
