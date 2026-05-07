import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

export default function PDV() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [pagamento, setPagamento] = useState("PIX");
  const [toast, setToast] = useState(null);
  const [finalizando, setFinalizando] = useState(false);
  // ─────────────────────────────────────────
  // Buscar produtos
  // ─────────────────────────────────────────
  async function buscarProdutos() {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .gt("estoque", 0)
      .order("nome");

    if (!error) {
      setProdutos(data || []);
    }
  }

  useEffect(() => {
    buscarProdutos();
  }, []);

  // ─────────────────────────────────────────
  // Adicionar produto
  // ─────────────────────────────────────────
  function adicionarProduto(produto) {

  const existe = carrinho.find(i => i.id === produto.id);

  // quantidade atual no carrinho
  const qtdAtual = existe ? existe.quantidade : 0;

  // impedir ultrapassar estoque
  if (qtdAtual >= produto.estoque) {
    mostrarToast("Estoque insuficiente.", "erro");
    return;
  }

  if (existe) {
    setCarrinho(carrinho.map(i =>
      i.id === produto.id
        ? { ...i, quantidade: i.quantidade + 1 }
        : i
    ));
  } else {
    setCarrinho([
      ...carrinho,
      {
        ...produto,
        quantidade: 1
      }
    ]);
  }
}

  // ─────────────────────────────────────────
  // Alterar quantidade
  // ─────────────────────────────────────────
  function alterarQuantidade(id, tipo) {
  setCarrinho(carrinho.map(item => {

    if (item.id !== id) return item;

    // impedir passar do estoque
    if (
      tipo === "mais" &&
      item.quantidade >= item.estoque
    ) {
      mostrarToast("Estoque insuficiente.", "erro");
      return item;
    }

    const novaQtd =
      tipo === "mais"
        ? item.quantidade + 1
        : item.quantidade - 1;

    return {
      ...item,
      quantidade: novaQtd < 1 ? 1 : novaQtd
    };
  }));
}

  // ─────────────────────────────────────────
  // Remover item
  // ─────────────────────────────────────────
  function removerItem(id) {
    setCarrinho(carrinho.filter(i => i.id !== id));
  }

  // ─────────────────────────────────────────
  // Total
  // ─────────────────────────────────────────
  function mostrarToast(msg, tipo = "ok") {

  setToast({
    msg,
    tipo
  });

  setTimeout(() => {
    setToast(null);
  }, 3000);
}
  const total = useMemo(() => {
    return carrinho.reduce((acc, item) => {
      return acc + (item.preco * item.quantidade);
    }, 0);
  }, [carrinho]);

  // ─────────────────────────────────────────
  // Finalizar venda
  // ─────────────────────────────────────────
  async function finalizarVenda() {

  if (carrinho.length === 0) {
    mostrarToast("Carrinho vazio.", "erro");
    return;
  }

  setFinalizando(true);

  try {

    // 1. criar venda
    const { data: venda, error: erroVenda } = await supabase
      .from("vendas")
      .insert({
        total,
        pagamento,
        recebido: total,
        troco: 0
      })
      .select()
      .single();

    if (erroVenda) throw erroVenda;

    // 2. salvar itens
    const itens = carrinho.map(item => ({
      venda_id: venda.id,
      produto_id: item.id,
      quantidade: item.quantidade,
      preco_unitario: item.preco
    }));

    const { error: erroItens } = await supabase
      .from("itens_venda")
      .insert(itens);

    if (erroItens) throw erroItens;

    // 3. baixar estoque
    for (const item of carrinho) {

      const novoEstoque =
        item.estoque - item.quantidade;

      const { error } = await supabase
        .from("produtos")
        .update({
          estoque: novoEstoque
        })
        .eq("id", item.id);

      if (error) throw error;
    }

    mostrarToast("Venda finalizada!");

    setCarrinho([]);

    buscarProdutos();

  } catch (err) {

    console.error(err);

    mostrarToast(
      "Erro ao finalizar venda.",
      "erro"
    );

  } finally {

    setFinalizando(false);

  }
}


  // ─────────────────────────────────────────
  // Filtro
  // ─────────────────────────────────────────
  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

 return (
  <>
    <div style={styles.container}>

      {/* PRODUTOS */}
      <div style={styles.left}>

        <div style={styles.header}>
          <h2>🛒 PDV Farmafy</h2>

          <input
            id="busca"
            name="busca"
            style={styles.input}
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div style={styles.listaProdutos}>
          {produtosFiltrados.map(produto => (
            <div
              key={produto.id}
              style={styles.card}
            >
              <div>
                <strong>{produto.nome}</strong>

                <div style={styles.preco}>
                  R$ {Number(produto.preco).toFixed(2)}
                </div>

                <div style={styles.estoque}>
                  Estoque: {produto.estoque}
                </div>
              </div>

              <button
                style={styles.botao}
                onClick={() => adicionarProduto(produto)}
              >
                Adicionar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CARRINHO */}
      <div style={styles.right}>

        <h2>💳 Carrinho</h2>

        <div style={styles.carrinho}>
          {carrinho.length === 0 && (
            <div style={styles.vazio}>
              Nenhum item no carrinho.
            </div>
          )}

          {carrinho.map(item => (
            <div
              key={item.id}
              style={styles.item}
            >
              <div>
                <strong>{item.nome}</strong>

                <div style={styles.subtotal}>
                  R$ {(item.preco * item.quantidade).toFixed(2)}
                </div>
              </div>

              <div style={styles.controles}>
                <button
                  style={styles.btnQtd}
                  onClick={() => alterarQuantidade(item.id, "menos")}
                >
                  -
                </button>

                <span>{item.quantidade}</span>

                <button
                  style={styles.btnQtd}
                  onClick={() => alterarQuantidade(item.id, "mais")}
                >
                  +
                </button>

                <button
                  style={styles.btnExcluir}
                  onClick={() => removerItem(item.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <select
            value={pagamento}
            onChange={(e) => setPagamento(e.target.value)}
            style={styles.select}
          >
            <option>PIX</option>
            <option>Dinheiro</option>
            <option>Cartão</option>
          </select>

          <h1 style={{ marginBottom: 20 }}>
            {total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL"
            })}
          </h1>

          <button
            style={styles.finalizar}
            onClick={finalizarVenda}
            disabled={finalizando}
          >
            {finalizando
              ? "Finalizando..."
              : "Finalizar Venda"}
          </button>
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: toast.tipo === "erro"
            ? "#dc2626"
            : "#0d7a45",
          color: "#fff",
          padding: "14px 18px",
          borderRadius: 10,
          fontWeight: "bold",
          zIndex: 999
        }}>
          {toast.msg}
        </div>
      )}

    </div>
  </>
);
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: 20,
    padding: 20
  },

  left: {
    background: "#fff",
    borderRadius: 12,
    padding: 20
  },

  right: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    height: "calc(100vh - 40px)",
    display: "flex",
    flexDirection: "column"
  },

  header: {
    marginBottom: 20
  },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    marginTop: 10
  },

  listaProdutos: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 14
  },

  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 12
  },

  preco: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10
  },

  estoque: {
    fontSize: 13,
    color: "#64748b"
  },

  botao: {
    background: "#0d7a45",
    color: "#fff",
    border: "none",
    padding: 10,
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold"
  },

  carrinho: {
    flex: 1,
    overflowY: "auto",
    marginTop: 20
  },

  item: {
    borderBottom: "1px solid #eee",
    padding: "12px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  subtotal: {
    marginTop: 5,
    fontWeight: "bold"
  },

  controles: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },

  btnQtd: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "none",
    cursor: "pointer"
  },

  btnExcluir: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    width: 28,
    height: 28,
    borderRadius: 6,
    cursor: "pointer"
  },

  footer: {
    borderTop: "1px solid #eee",
    paddingTop: 20
  },

  select: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20
  },

  finalizar: {
    width: "100%",
    background: "#0d7a45",
    color: "#fff",
    border: "none",
    padding: 16,
    borderRadius: 10,
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer"
  },

  vazio: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 40
  }
};