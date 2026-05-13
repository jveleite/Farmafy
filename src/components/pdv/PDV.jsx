import { useEffect, useMemo, useState } from "react";
import { listarProdutosDisponiveis } from "../../services/produtos.service";
import { listarClientes } from "../../services/clientes.service";
import { finalizarVenda as finalizarVendaSvc } from "../../services/vendas.service";
import { useToast } from "../../ui/Toast";
import { colors, radius } from "../../styles/tokens";
import ModalPagamento from "../pagamento/ModalPagamento";
import ListaProdutos from "./ListaProdutos";
import Carrinho from "./Carrinho";
import SeletorCliente from "./SeletorCliente";
import SeletorPagamento from "./SeletorPagamento";
import RodapeTotal from "./RodapeTotal";

/**
 * Orquestrador do PDV. Detém o estado compartilhado (carrinho, cliente,
 * forma pré-selecionada) e delega UI pros sub-componentes.
 */
import { useAuth } from "../../ui/Auth";

export default function PDV() {
  const toast = useToast();
  const { profile } = useAuth();

  const [produtos, setProdutos]                     = useState([]);
  const [clientes, setClientes]                     = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [carrinho, setCarrinho]                     = useState([]);
  const [pagamento, setPagamento]                   = useState("PIX");
  const [finalizando, setFinalizando]               = useState(false);
  const [modalAberto, setModalAberto]               = useState(false);

  // ── Carregamento inicial ───────────────────────────────────────────
  useEffect(() => {
    recarregarProdutos();
    recarregarClientes();
  }, []);

  async function recarregarProdutos() {
    try { setProdutos(await listarProdutosDisponiveis()); }
    catch (e) { toast("Erro ao carregar produtos.", "erro"); console.error(e); }
  }
  async function recarregarClientes() {
    try { setClientes(await listarClientes()); }
    catch (e) { toast("Erro ao carregar clientes.", "erro"); console.error(e); }
  }

  // ── Operações de carrinho ───────────────────────────────────────────
  function adicionarProduto(produto) {
    const existe = carrinho.find((i) => i.id === produto.id);
    const qtdAtual = existe ? existe.quantidade : 0;
    if (qtdAtual >= produto.estoque) {
      toast("Estoque insuficiente.", "erro");
      return;
    }
    if (existe) {
      setCarrinho((c) =>
        c.map((i) => (i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i))
      );
    } else {
      setCarrinho((c) => [...c, { ...produto, quantidade: 1 }]);
    }
  }

  function alterarQuantidade(id, tipo) {
    // Guarda fora do updater pra não chamar setState do toast durante render.
    if (tipo === "mais") {
      const item = carrinho.find((i) => i.id === id);
      if (item && item.quantidade >= item.estoque) {
        toast("Estoque insuficiente.", "erro");
        return;
      }
    }
    setCarrinho((c) =>
      c.map((item) =>
        item.id !== id
          ? item
          : {
              ...item,
              quantidade: Math.max(
                1,
                tipo === "mais" ? item.quantidade + 1 : item.quantidade - 1
              ),
            }
      )
    );
  }

  function editarQuantidade(id, valor) {
    const max =
      (produtos.find((p) => p.id === id) ?? carrinho.find((i) => i.id === id))?.estoque ?? 1;
    const qtd = Math.min(Math.max(1, Number(valor) || 1), max);
    setCarrinho((c) => c.map((i) => (i.id === id ? { ...i, quantidade: qtd } : i)));
  }

  function removerItem(id) {
    setCarrinho((c) => c.filter((i) => i.id !== id));
  }

  function limparCarrinho() {
    setCarrinho([]);
  }

  // ── Total ───────────────────────────────────────────────────────────
  const total = useMemo(
    () => carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0),
    [carrinho]
  );

  // ── Modal e finalização ────────────────────────────────────────────
  function abrirModal() {
    if (carrinho.length === 0) {
      toast("Carrinho vazio.", "erro");
      return;
    }
    setModalAberto(true);
  }

  async function finalizar(dadosPagamento) {
    setModalAberto(false);
    setFinalizando(true);
    try {
      await finalizarVendaSvc({
        venda: {
          cliente_id: dadosPagamento.cliente_id,
          cliente_nome: clienteSelecionado?.nome || "Não identificado",
          total,
          pagamento: dadosPagamento.formas.map((f) => f.forma).join(" + "),
          recebido: dadosPagamento.recebido,
          troco: dadosPagamento.troco,
        },
        itens: carrinho.map((item) => ({
          produto_id: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
        })),
      });
      toast("✅ Venda finalizada com sucesso!");
      setCarrinho([]);
      setClienteSelecionado(null);
      recarregarProdutos();
    } catch (err) {
      console.error(err);
      toast("Erro ao finalizar venda.", "erro");
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <>
      <ModalPagamento
        aberto={modalAberto}
        total={total}
        formaInicial={pagamento}
        cliente={clienteSelecionado}
        chavePix={profile?.farmaciaChavePix}
        onCancelar={() => setModalAberto(false)}
        onConfirmar={finalizar}
      />

      <div style={layout.container}>
        <div style={layout.left}>
          <ListaProdutos
            produtos={produtos}
            carrinho={carrinho}
            onAdicionar={adicionarProduto}
          />
        </div>

        <div style={layout.right}>
          <Carrinho
            carrinho={carrinho}
            onAlterarQtd={alterarQuantidade}
            onEditarQtd={editarQuantidade}
            onRemover={removerItem}
            onLimpar={limparCarrinho}
          />

          <div style={layout.footer}>
            <SeletorCliente
              clientes={clientes}
              clienteSelecionado={clienteSelecionado}
              onSelecionar={setClienteSelecionado}
            />
            <SeletorPagamento pagamento={pagamento} setPagamento={setPagamento} />
            <RodapeTotal
              total={total}
              vazio={carrinho.length === 0}
              pagamento={pagamento}
              finalizando={finalizando}
              onPagar={abrirModal}
            />
          </div>
        </div>
      </div>
    </>
  );
}

const layout = {
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 400px",
    gap: 20,
    padding: 20,
    minHeight: "100vh",
    background: colors.surfaceMute,
  },
  left: {},
  right: {
    background: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    height: "calc(100vh - 40px)",
    position: "sticky",
    top: 20,
    display: "flex",
    flexDirection: "column",
  },
  footer: {
    borderTop: `1px solid ${colors.surfaceMute}`,
    paddingTop: 16,
  },
};
