import { useEffect, useMemo, useRef, useState } from "react";

// ─── Configuração ─────────────────────────────────────────────────────────────
const CHAVE_PIX = "sua-chave-pix@banco.com"; // ← substitua pela chave real

const FORMAS = [
  { value: "PIX",      label: "PIX",      emoji: "⚡" },
  { value: "Dinheiro", label: "Dinheiro", emoji: "💵" },
  { value: "Credito",  label: "Crédito",  emoji: "💳" },
  { value: "Debito",   label: "Débito",   emoji: "🏧" },
  { value: "Fiado",    label: "Fiado",    emoji: "🤝" },
];

const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const parseBRL = (str) =>
  parseFloat(String(str).replace(/\./g, "").replace(",", ".")) || 0;

function calcAtalhos(valor) {
  const notas = [5, 10, 20, 50, 100, 200];
  const result = [];
  for (const n of notas) {
    const multiplo = Math.ceil(valor / n) * n;
    if (!result.includes(multiplo) && result.length < 4) result.push(multiplo);
    if (result.length >= 4) break;
  }
  return result;
}

// ─── QR Code via API pública (sem biblioteca) ─────────────────────────────────
function QRCodePix({ chave, size = 150 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(chave)}&bgcolor=ffffff&color=000000&margin=10`;
  return (
    <img
      src={url}
      alt="QR Code PIX"
      width={size}
      height={size}
      style={{ borderRadius: 8, display: "block" }}
    />
  );
}

// ─── Linha de resumo ──────────────────────────────────────────────────────────
function Row({ label, valor, cor, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: cor || "#0f172a" }}>{valor}</span>
    </div>
  );
}

// ─── Sub-componente: bloco de uma forma de pagamento ─────────────────────────
function FormaItem({
  idx, item, total, umaForma,
  recebido, setRecebido, troco,
  falta, formas,
  setFormaValor, removeForma,
  copiarPix, copiado, cliente,
}) {
  const isDinheiro = item.forma === "Dinheiro";
  const isPix      = item.forma === "PIX";
  const isCredito  = item.forma === "Credito";
  const isDebito   = item.forma === "Debito";
  const isFiado    = item.forma === "Fiado";

  const vlDinheiro = umaForma ? total : parseBRL(item.valor || "0");

  return (
    <div style={S.formaBox}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "#475569" }}>
          {umaForma ? "Forma de pagamento" : `Forma ${idx + 1}`}
        </span>
        {!umaForma && formas.length > 1 && (
          <button style={S.btnRemoverForma} onClick={() => removeForma(idx)}>✕</button>
        )}
      </div>

      {/* Tabs */}
      <div style={S.tabsForma}>
        {FORMAS.map(f => (
          <div
            key={f.value}
            style={{
              ...S.tabForma,
              borderColor: item.forma === f.value ? "#0d7a45" : "#e2e8f0",
              background:  item.forma === f.value ? "#ecfdf5" : "#fff",
              color:       item.forma === f.value ? "#0d7a45" : "#475569",
              fontWeight:  item.forma === f.value ? 700 : 500,
            }}
            onClick={() => setFormaValor(idx, "forma", f.value)}
          >
            <span>{f.emoji}</span>
            <span style={{ fontSize: 11 }}>{f.label}</span>
          </div>
        ))}
      </div>

      {/* Valor parcial (somente multi-forma) */}
      {!umaForma && (
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Valor nesta forma</label>
          <div style={{ position: "relative" }}>
            <span style={S.prefixoReal}>R$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              value={item.valor}
              onChange={e => setFormaValor(idx, "valor", e.target.value)}
              style={{ ...S.inputValor, paddingLeft: 38 }}
            />
          </div>
          {falta > 0.005 && (
            <button
              style={S.btnAtalho}
              onClick={() => setFormaValor(idx, "valor", falta.toFixed(2))}
            >
              Usar restante ({fmt(falta)})
            </button>
          )}
        </div>
      )}

      {/* ── PIX ── */}
      {isPix && (
        <div style={S.pixBox}>
          <QRCodePix chave={CHAVE_PIX} size={150} />

          <div style={S.pixChave}>
            <span style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              Chave PIX
            </span>
            <span style={{ fontWeight: 600, wordBreak: "break-all" }}>{CHAVE_PIX}</span>
          </div>

          <button
            style={{
              ...S.btnCopiar,
              background: copiado ? "#059669" : "#0d7a45",
            }}
            onClick={copiarPix}
          >
            {copiado ? "✅ Copiado!" : "📋 Copiar chave PIX"}
          </button>

          <div style={S.pixDica}>
            Escaneie o QR Code ou copie a chave no app do banco.
          </div>
        </div>
      )}

      {/* ── Dinheiro ── */}
      {isDinheiro && (
        <div>
          <label style={S.label}>Valor recebido</label>
          <div style={{ position: "relative" }}>
            <span style={S.prefixoReal}>R$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              value={recebido}
              onChange={e => setRecebido(e.target.value)}
              style={{ ...S.inputValor, paddingLeft: 38 }}
              autoFocus
            />
          </div>

          {/* Atalhos de notas */}
          <div style={S.atalhos}>
            {calcAtalhos(vlDinheiro).map(v => (
              <button
                key={v}
                style={S.btnAtalho}
                onClick={() => setRecebido(v.toFixed(2))}
              >
                {fmt(v)}
              </button>
            ))}
          </div>

          {troco > 0 && (
            <div style={S.trocoBox}>
              <span style={{ color: "#065f46", fontSize: 14 }}>Troco</span>
              <strong style={{ fontSize: 22, color: "#0d7a45" }}>{fmt(troco)}</strong>
            </div>
          )}

          {parseBRL(recebido) > 0 && parseBRL(recebido) < vlDinheiro && (
            <div style={S.alertaInsuficiente}>⚠️ Valor insuficiente.</div>
          )}
        </div>
      )}

      {/* ── Cartão ── */}
      {(isCredito || isDebito) && (
        <div style={S.cartaoInfo}>
          <span style={{ fontSize: 28 }}>💳</span>
          <div>
            <div style={{ fontWeight: 600 }}>
              {isCredito ? "Cartão de Crédito" : "Cartão de Débito"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              Insira ou aproxime o cartão na maquininha.
            </div>
          </div>
        </div>
      )}

      {/* ── Fiado ── */}
      {isFiado && (
        <div style={{ ...S.cartaoInfo, background: "#fffbeb", borderColor: "#fde68a" }}>
          <span style={{ fontSize: 28 }}>🤝</span>
          <div>
            <div style={{ fontWeight: 600 }}>Fiado</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              {cliente
                ? `Será registrado na conta de ${cliente.nome}.`
                : "Selecione um cliente no carrinho para registrar fiado."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
/**
 * props:
 *  aberto      : boolean
 *  total       : number
 *  cliente     : { id, nome } | null
 *  onConfirmar : (dadosPagamento) => void
 *  onCancelar  : () => void
 *
 * dadosPagamento = {
 *   formas: [{forma, valor}],
 *   recebido,
 *   troco,
 *   cliente_id
 * }
 */

export default function ModalPagamento({
  aberto,
  total,
  formaInicial = "PIX",
  cliente,
  onConfirmar,
  onCancelar
}) {
  const [etapa, setEtapa]       = useState("pagamento");
  const [formas, setFormas]     = useState([{ forma: "PIX", valor: "" }]);
  const [recebido, setRecebido] = useState("");
  const [copiado, setCopiado]   = useState(false);
  const copiadoTimer            = useRef(null);

  const umaForma  = formas.length === 1;
  const temFiado  = formas.some(f => f.forma === "Fiado");
  const temDinheiro = formas.some(f => f.forma === "Dinheiro");

  // Reset ao abrir
  useEffect(() => {
    if (aberto) {
      setEtapa("pagamento");
      setFormas([{ forma: "PIX", valor: "" }]);
      setRecebido("");
      setCopiado(false);
    }
  }, [aberto]);

  // Totais
  const totalFormas = useMemo(
    () => formas.reduce((acc, f) => acc + parseBRL(f.valor), 0),
    [formas]
  );

  const falta   = umaForma ? 0 : Math.max(0, total - totalFormas);
  const excesso = umaForma ? 0 : Math.max(0, totalFormas - total);

  const recebidoNum = parseBRL(recebido);
  const vlDinheiro  = umaForma
    ? total
    : parseBRL(formas.find(f => f.forma === "Dinheiro")?.valor || "0");
  const troco = temDinheiro ? Math.max(0, recebidoNum - vlDinheiro) : 0;

  // Validação
  const podeContinuar = useMemo(() => {
    if (umaForma) {
      if (temDinheiro) return recebidoNum >= total;
      return true;
    }
    if (Math.abs(totalFormas - total) >= 0.01) return false;
    if (temDinheiro) return recebidoNum >= vlDinheiro;
    return true;
  }, [formas, umaForma, total, totalFormas, temDinheiro, recebidoNum, vlDinheiro]);

  // Handlers
  function addForma() {
    setFormas(f => [...f, { forma: "PIX", valor: "" }]);
  }
  function removeForma(idx) {
    setFormas(f => f.filter((_, i) => i !== idx));
  }
  function setFormaValor(idx, key, val) {
    setFormas(f => f.map((item, i) => i === idx ? { ...item, [key]: val } : item));
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
        : formas.map(f => ({ ...f, valor: parseBRL(f.valor) })),
      recebido: temDinheiro ? recebidoNum : total,
      troco,
      cliente_id: cliente?.id ?? null,
    });
  }

  if (!aberto) return null;

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:scale(.96) translateY(10px); }
          to   { opacity:1; transform:scale(1)   translateY(0); }
        }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        .tab-forma { cursor:pointer; transition: all .12s; }
        .tab-forma:hover { filter: brightness(.96); }
      `}</style>

      {/* Overlay */}
      <div style={S.overlay} onClick={onCancelar} />

      {/* Modal */}
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
          <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>Total a pagar</span>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#0d7a45" }}>{fmt(total)}</span>
        </div>

        {/* ══ ETAPA: PAGAMENTO ══ */}
        {etapa === "pagamento" && (
          <div style={S.body}>

            {/* Toggle multi */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button
                style={{
                  ...S.btnToggleMulti,
                  background: umaForma ? "#f1f5f9" : "#ecfdf5",
                  color:      umaForma ? "#64748b" : "#0d7a45",
                  borderColor: umaForma ? "#e2e8f0" : "#6ee7b7",
                }}
                onClick={toggleMulti}
              >
                {umaForma ? "＋ Dividir pagamento" : "✕ Forma única"}
              </button>
            </div>

            {/* Formas */}
            {formas.map((item, idx) => (
              <FormaItem
                key={idx}
                idx={idx}
                item={item}
                total={total}
                umaForma={umaForma}
                recebido={recebido}
                setRecebido={setRecebido}
                troco={troco}
                falta={falta}
                excesso={excesso}
                formas={formas}
                setFormaValor={setFormaValor}
                removeForma={removeForma}
                copiarPix={copiarPix}
                copiado={copiado}
                cliente={cliente}
              />
            ))}

            {/* Adicionar forma */}
            {!umaForma && formas.length < 4 && (
              <button style={S.btnAddForma} onClick={addForma}>
                ＋ Adicionar forma
              </button>
            )}

            {/* Resumo multi */}
            {!umaForma && (
              <div style={S.resumoMulti}>
                <Row label="Total"  valor={fmt(total)} />
                <Row label="Pago"   valor={fmt(totalFormas)} cor={totalFormas > total ? "#dc2626" : "#0d7a45"} />
                {falta   > 0.005 && <Row label="Falta"   valor={fmt(falta)}   cor="#dc2626" />}
                {excesso > 0.005 && <Row label="Excesso" valor={fmt(excesso)} cor="#b45309" />}
                {troco   > 0     && <Row label="Troco"   valor={fmt(troco)}   cor="#0d7a45" bold />}
              </div>
            )}

            {/* Aviso fiado sem cliente */}
            {temFiado && !cliente && (
              <div style={S.aviso}>
                ⚠️ Selecione um cliente no carrinho para registrar fiado.
              </div>
            )}

            <button
              style={{
                ...S.btnConfirmar,
                background: podeContinuar && !(temFiado && !cliente) ? "#0d7a45" : "#94a3b8",
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
          <div style={{ ...S.body, animation: "fadeIn .2s ease" }}>
            <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Confirmar venda?</div>
              {cliente && <div style={{ color: "#64748b", fontSize: 14 }}>👤 {cliente.nome}</div>}
            </div>

            <div style={S.resumoMulti}>
              {formas.map((f, i) => {
                const def = FORMAS.find(x => x.value === f.forma);
                const vl  = umaForma ? total : parseBRL(f.valor);
                return <Row key={i} label={`${def?.emoji} ${def?.label}`} valor={fmt(vl)} />;
              })}
              <div style={{ borderTop: "1px solid #e2e8f0", margin: "8px 0" }} />
              <Row label="Total" valor={fmt(total)} bold />
              {temDinheiro && recebidoNum > 0 && <Row label="Recebido" valor={fmt(recebidoNum)} />}
              {troco > 0 && <Row label="Troco 💵" valor={fmt(troco)} cor="#0d7a45" bold />}
              {temFiado && (
                <div style={{ ...S.aviso, marginTop: 10 }}>
                  🤝 Parte em fiado será registrada para {cliente?.nome}.
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.btnVoltar} onClick={() => setEtapa("pagamento")}>← Voltar</button>
              <button style={{ ...S.btnConfirmar, flex: 2, marginTop: 0 }} onClick={handleConfirmar}>
                ✅ Finalizar Venda
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,.45)", zIndex: 100,
    animation: "fadeIn .2s ease",
  },
  modal: {
    position: "fixed", top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    width: "min(520px, 96vw)", maxHeight: "92vh", overflowY: "auto",
    background: "#fff", borderRadius: 16, zIndex: 101,
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
    animation: "modalIn .22s ease",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "20px 24px 0",
  },
  headerTitle: { fontSize: 20, fontWeight: 700 },
  headerSub:   { fontSize: 14, color: "#64748b", marginTop: 2 },
  btnFechar: {
    background: "#f1f5f9", border: "none", borderRadius: 8,
    width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b",
  },
  totalBanner: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    margin: "16px 24px 0", background: "#ecfdf5",
    border: "1px solid #6ee7b7", borderRadius: 10, padding: "12px 18px",
  },
  body: { padding: "20px 24px 24px" },
  btnToggleMulti: {
    fontSize: 13, fontWeight: 600, border: "1px solid",
    borderRadius: 20, padding: "5px 14px", cursor: "pointer",
  },
  formaBox: {
    border: "1px solid #e2e8f0", borderRadius: 12,
    padding: "16px 16px 14px", marginBottom: 14,
  },
  tabsForma: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  tabForma: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 3, padding: "8px 10px", borderRadius: 8, border: "2px solid",
    minWidth: 58, userSelect: "none",
  },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 },
  prefixoReal: {
    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
    color: "#64748b", fontWeight: 600, fontSize: 15,
  },
  inputValor: {
    width: "100%", padding: "12px 12px 12px 38px",
    border: "1.5px solid #cbd5e1", borderRadius: 8,
    fontSize: 18, fontWeight: 700, boxSizing: "border-box",
  },
  atalhos: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 },
  btnAtalho: {
    fontSize: 13, padding: "5px 12px", borderRadius: 20,
    border: "1px solid #e2e8f0", background: "#f8fafc",
    cursor: "pointer", color: "#0d7a45", fontWeight: 600, marginTop: 8,
  },
  trocoBox: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "#ecfdf5", border: "1px solid #6ee7b7",
    borderRadius: 8, padding: "10px 16px", marginTop: 14,
  },
  alertaInsuficiente: {
    background: "#fef2f2", color: "#dc2626",
    borderRadius: 8, padding: "8px 12px", fontSize: 13, marginTop: 10, fontWeight: 600,
  },
  aviso: {
    background: "#fffbeb", border: "1px solid #fde68a",
    borderRadius: 8, padding: "10px 14px", fontSize: 13,
    color: "#92400e", marginBottom: 14,
  },
  pixBox: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 8,
  },
  pixChave: {
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 8, padding: "10px 14px", fontSize: 13,
    color: "#1e293b", wordBreak: "break-all", textAlign: "center",
    width: "100%", boxSizing: "border-box",
  },
  btnCopiar: {
    color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 20px", fontWeight: 700, cursor: "pointer",
    fontSize: 14, transition: "background .2s",
  },
  pixDica: { fontSize: 12, color: "#94a3b8", textAlign: "center" },
  cartaoInfo: {
    display: "flex", alignItems: "center", gap: 14,
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 8, padding: 14, marginTop: 4,
  },
  btnAddForma: {
    width: "100%", background: "#f8fafc", border: "1.5px dashed #cbd5e1",
    borderRadius: 10, padding: 12, cursor: "pointer",
    fontSize: 14, fontWeight: 600, color: "#0d7a45", marginBottom: 14,
  },
  resumoMulti: {
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 10, padding: "12px 16px", marginBottom: 16,
  },
  btnConfirmar: {
    width: "100%", color: "#fff", border: "none",
    padding: 16, borderRadius: 10, fontSize: 17,
    fontWeight: 700, cursor: "pointer", marginTop: 4,
  },
  btnVoltar: {
    flex: 1, background: "#f1f5f9", color: "#475569", border: "none",
    padding: 16, borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
  btnRemoverForma: {
    background: "#fee2e2", color: "#dc2626", border: "none",
    borderRadius: 6, width: 26, height: 26, cursor: "pointer", fontWeight: 700,
  },
};