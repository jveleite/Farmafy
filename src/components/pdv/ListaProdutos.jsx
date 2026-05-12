import { useMemo, useState } from "react";
import { fmt, matchStr } from "../../lib/format";
import { colors, radius } from "../../styles/tokens";
import Input from "../../ui/Input";
import Button from "../../ui/Button";

/**
 * Painel esquerdo do PDV — busca + grade de cards de produto.
 * A busca, o filtro e o flash visual são locais aqui (ninguém de fora precisa).
 *
 * Props:
 *  produtos    : Produto[]
 *  carrinho    : ItemCarrinho[]   (só leitura, pra calcular estoque restante)
 *  onAdicionar : (produto) => void
 */
export default function ListaProdutos({ produtos, carrinho, onAdicionar }) {
  const [busca, setBusca] = useState("");
  const [flashIds, setFlashIds] = useState(new Set());

  const produtosFiltrados = useMemo(
    () => produtos.filter((p) => matchStr(p.nome, busca)),
    [produtos, busca]
  );

  function handleAdicionar(produto) {
    setFlashIds((prev) => new Set(prev).add(produto.id));
    setTimeout(() => {
      setFlashIds((prev) => {
        const n = new Set(prev);
        n.delete(produto.id);
        return n;
      });
    }, 500);
    onAdicionar(produto);
  }

  return (
    <div style={styles.panel}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>🛒 PDV Farmafy</h2>
        <div style={{ position: "relative" }}>
          <span style={styles.lupa}>🔍</span>
          <Input
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ paddingLeft: 36, paddingRight: busca ? 36 : 12 }}
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              style={styles.btnLimparInput}
              title="Limpar"
            >
              ×
            </button>
          )}
        </div>
        <div style={styles.contagem}>
          {produtosFiltrados.length}{" "}
          {produtosFiltrados.length === 1 ? "produto disponível" : "produtos disponíveis"}
        </div>
      </div>

      <div style={styles.grid}>
        {produtosFiltrados.map((produto) => (
          <ProdutoCard
            key={produto.id}
            produto={produto}
            carrinho={carrinho}
            flash={flashIds.has(produto.id)}
            onAdicionar={() => handleAdicionar(produto)}
          />
        ))}
        {produtosFiltrados.length === 0 && (
          <div style={styles.vazio}>Nenhum produto encontrado.</div>
        )}
      </div>
    </div>
  );
}

function ProdutoCard({ produto, carrinho, flash, onAdicionar }) {
  const noCarrinho = carrinho.find((i) => i.id === produto.id);
  const qtdCarrinho = noCarrinho?.quantidade ?? 0;
  const estoqueRestante = produto.estoque - qtdCarrinho;
  const estoqueBaixo = produto.estoque <= 5;
  const semEstoque = estoqueRestante <= 0;

  return (
    <div
      className={flash ? "flash-card" : ""}
      style={{
        ...styles.card,
        borderColor: estoqueBaixo ? "#fde68a" : colors.border,
        background: estoqueBaixo ? "#fffbeb" : colors.surface,
        animation: flash ? "flash .45s ease" : undefined,
      }}
    >
      <div>
        <strong style={{ fontSize: 15 }}>{produto.nome}</strong>
        <div style={styles.preco}>{fmt(produto.preco)}</div>
        <div
          style={{
            fontSize: 13,
            marginTop: 2,
            color: estoqueBaixo ? "#b45309" : colors.textSubtle,
            fontWeight: estoqueBaixo ? "bold" : "normal",
          }}
        >
          {estoqueBaixo ? "⚠️ " : ""}Estoque: {produto.estoque}
          {qtdCarrinho > 0 && (
            <span style={{ color: colors.brand, marginLeft: 6 }}>
              ({qtdCarrinho} no carrinho)
            </span>
          )}
        </div>
      </div>
      <Button
        onClick={onAdicionar}
        disabled={semEstoque}
        style={{
          background: semEstoque ? "#94a3b8" : colors.brand,
          padding: "10px 0",
          width: "100%",
          justifyContent: "center",
        }}
      >
        {semEstoque ? "Esgotado" : "+ Adicionar"}
      </Button>
    </div>
  );
}

const styles = {
  panel: {
    background: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    minHeight: "calc(100vh - 40px)",
  },
  lupa: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 16,
    pointerEvents: "none",
  },
  btnLimparInput: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    color: colors.textFaint,
    lineHeight: 1,
  },
  contagem: { fontSize: 13, color: colors.textSubtle, marginTop: 6 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 14,
    overflowY: "auto",
    flex: 1,
    paddingRight: 4,
  },
  card: {
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 12,
  },
  preco: {
    fontSize: 19,
    fontWeight: "bold",
    marginTop: 8,
    color: colors.text,
  },
  vazio: {
    color: colors.textFaint,
    padding: 24,
    gridColumn: "1/-1",
  },
};
