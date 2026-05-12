import { useState } from "react";
import { fmt } from "../../lib/format";
import { colors, radius } from "../../styles/tokens";
import Button from "../../ui/Button";

/**
 * Lista de itens no carrinho com controles de quantidade.
 *
 * Props:
 *  carrinho       : ItemCarrinho[]
 *  onAlterarQtd   : (id, "mais" | "menos") => void
 *  onEditarQtd    : (id, valor) => void
 *  onRemover      : (id) => void
 *  onLimpar       : () => void
 */
export default function Carrinho({
  carrinho,
  onAlterarQtd,
  onEditarQtd,
  onRemover,
  onLimpar,
}) {
  const [confirmLimpar, setConfirmLimpar] = useState(false);
  const totalItens = carrinho.reduce((a, i) => a + i.quantidade, 0);

  return (
    <>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>
          💳 Carrinho
          {carrinho.length > 0 && <span style={styles.badge}>{totalItens}</span>}
        </h2>
        {carrinho.length > 0 &&
          (confirmLimpar ? (
            <div style={{ display: "flex", gap: 6, fontSize: 13 }}>
              <span style={{ alignSelf: "center", color: colors.textSubtle }}>
                Limpar?
              </span>
              <Button
                size="sm"
                onClick={() => {
                  onLimpar();
                  setConfirmLimpar(false);
                }}
                style={{ background: colors.danger, color: "#fff" }}
              >
                Sim
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmLimpar(false)}
              >
                Não
              </Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmLimpar(true)}>
              🗑️ Limpar
            </Button>
          ))}
      </div>

      <div style={styles.lista}>
        {carrinho.length === 0 ? (
          <div style={styles.vazio}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
            <div>Nenhum item no carrinho.</div>
            <div style={{ fontSize: 13, marginTop: 4, color: colors.textFaint }}>
              Clique em "+ Adicionar" para começar.
            </div>
          </div>
        ) : (
          carrinho.map((item) => (
            <ItemCarrinho
              key={item.id}
              item={item}
              onAlterarQtd={onAlterarQtd}
              onEditarQtd={onEditarQtd}
              onRemover={onRemover}
            />
          ))
        )}
      </div>
    </>
  );
}

function ItemCarrinho({ item, onAlterarQtd, onEditarQtd, onRemover }) {
  return (
    <div style={styles.item}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong
          style={{
            fontSize: 14,
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.nome}
        </strong>
        <div style={{ fontSize: 13, color: colors.textSubtle }}>
          {fmt(item.preco)} /un
        </div>
        <div style={styles.subtotal}>{fmt(item.preco * item.quantidade)}</div>
      </div>
      <div style={styles.controles}>
        <button style={styles.btnQtd} onClick={() => onAlterarQtd(item.id, "menos")}>
          −
        </button>
        <input
          type="number"
          min={1}
          max={item.estoque}
          value={item.quantidade}
          onChange={(e) => onEditarQtd(item.id, e.target.value)}
          style={styles.inputQtd}
        />
        <button style={styles.btnQtd} onClick={() => onAlterarQtd(item.id, "mais")}>
          +
        </button>
        <button
          style={styles.btnExcluir}
          onClick={() => onRemover(item.id)}
          title="Remover"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.brand,
    color: "#fff",
    borderRadius: radius.pill,
    fontSize: 12,
    fontWeight: "bold",
    width: 22,
    height: 22,
    marginLeft: 8,
  },
  lista: { flex: 1, overflowY: "auto", marginTop: 16, paddingRight: 2, minHeight: 80 },
  vazio: { color: colors.textFaint, textAlign: "center", marginTop: 40, lineHeight: 1.6 },
  item: {
    borderBottom: `1px solid ${colors.surfaceMute}`,
    padding: "10px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    animation: "fadeIn .2s ease",
  },
  subtotal: { marginTop: 2, fontWeight: "bold", color: colors.text, fontSize: 14 },
  controles: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  btnQtd: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    cursor: "pointer",
    fontWeight: "bold",
    background: colors.surfaceAlt,
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputQtd: {
    width: 42,
    height: 28,
    textAlign: "center",
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    fontSize: 14,
  },
  btnExcluir: {
    background: colors.dangerBgSoft,
    color: colors.danger,
    border: "none",
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    cursor: "pointer",
    fontWeight: "bold",
  },
};
