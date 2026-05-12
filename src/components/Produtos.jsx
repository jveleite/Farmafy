import BuscaProduto from "./BuscaProduto";
import { useState, useEffect } from "react";
import {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  removerProduto,
  adicionarEstoque,
} from "../services/produtos.service";
import { fmt, matchStr, diasParaVencer } from "../lib/format";
import { colors, radius, shadow } from "../styles/tokens";
import { useToast } from "../ui/Toast";
import { useAuth } from "../ui/Auth";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Field from "../ui/Field";
import Tag from "../ui/Tag";
import Modal from "../ui/Modal";

const CATEGORIAS = [
  "Analgésico", "Antibiótico", "Anti-inflamatório", "Antidiabético",
  "Cardiovascular", "Corticoide", "Dermatológico", "Gastrointestinal",
  "Vitaminas", "Outros"
];

const FORM_VAZIO = {
  nome: "", principio_ativo: "", categoria: "Analgésico",
  estoque: "", estoque_minimo: 10, preco_compra: "",
  preco: "", validade: "", codigo_barras: ""
};

export default function Produtos() {
  const toast = useToast();
  const { permissoes } = useAuth();
  const podeAlterar = permissoes.podeAlterarProdutos;
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [modalEntrada, setModalEntrada] = useState(null);
  const [qtdEntrada, setQtdEntrada] = useState("");

  // ── buscar produtos ──────────────────────────────────────────────
  async function recarregar() {
    setLoading(true);
    try {
      setProdutos(await listarProdutos());
    } catch (e) {
      toast("Erro ao buscar produtos: " + e.message, "erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { recarregar(); }, []);

  // ── abrir modal ──────────────────────────────────────────────────
  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setModal(true);
  }

  function abrirEditar(p) {
    setEditando(p.id);
    setForm({
      nome: p.nome || "",
      principio_ativo: p.principio_ativo || "",
      categoria: p.categoria || "Analgésico",
      estoque: p.estoque ?? "",
      estoque_minimo: p.estoque_minimo ?? 10,
      preco_compra: p.preco_compra ?? "",
      preco: p.preco ?? "",
      validade: p.validade || "",
      codigo_barras: p.codigo_barras || ""
    });
    setModal(true);
  }

  // ── salvar (insert ou update) ────────────────────────────────────
  async function salvar() {
    if (!form.nome.trim()) return toast("Informe o nome do produto.", "erro");
    if (!form.preco) return toast("Informe o preço de venda.", "erro");

    setSalvando(true);

    const dados = {
      nome: form.nome.trim(),
      principio_ativo: form.principio_ativo.trim(),
      categoria: form.categoria,
      estoque: Number(form.estoque) || 0,
      estoque_minimo: Number(form.estoque_minimo) || 10,
      preco_compra: parseFloat(form.preco_compra) || 0,
      preco: parseFloat(form.preco),
      validade: form.validade || null,
      codigo_barras: form.codigo_barras.trim()
    };

    try {
      if (editando) await atualizarProduto(editando, dados);
      else          await criarProduto(dados);
      toast(editando ? "Produto atualizado!" : "Produto cadastrado!");
      setModal(false);
      recarregar();
    } catch (e) {
      toast((editando ? "Erro ao atualizar: " : "Erro ao cadastrar: ") + e.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  // ── excluir ──────────────────────────────────────────────────────
  async function excluir(id, nome) {
    if (!confirm(`Excluir "${nome}"?`)) return;
    try {
      await removerProduto(id);
      toast("Produto removido.");
      recarregar();
    } catch (e) {
      toast("Erro ao excluir: " + e.message, "erro");
    }
  }

  // ── entrada de estoque ───────────────────────────────────────────
  async function confirmarEntrada() {
    const q = parseInt(qtdEntrada);
    if (!q || q <= 0) return toast("Informe uma quantidade válida.", "erro");

    try {
      await adicionarEstoque(modalEntrada, q);
      toast(`+${q} unidades adicionadas!`);
      setModalEntrada(null);
      setQtdEntrada("");
      recarregar();
    } catch (e) {
      toast("Erro: " + e.message, "erro");
    }
  }

  // ── filtro de busca ──────────────────────────────────────────────
  const lista = produtos.filter(p =>
    matchStr(p.nome, busca) ||
    matchStr(p.principio_ativo, busca) ||
    matchStr(p.categoria, busca)
  );

  // ── tags visuais ─────────────────────────────────────────────────
  function tagEstoque(p) {
    if (p.estoque <= 0) return <Tag variant="danger">Sem estoque</Tag>;
    if (p.estoque <= p.estoque_minimo) return <Tag variant="warning">Baixo</Tag>;
    return <Tag variant="success">OK</Tag>;
  }

  function tagValidade(val) {
    if (!val) return <Tag variant="neutral">—</Tag>;
    const d = diasParaVencer(val);
    if (d < 0) return <Tag variant="danger">Vencido</Tag>;
    if (d <= 30) return <Tag variant="warning">⏰ {d}d</Tag>;
    return <Tag variant="neutral">{new Date(val).toLocaleDateString("pt-BR")}</Tag>;
  }

  const margem = (p) => p.preco_compra > 0
    ? ((p.preco - p.preco_compra) / p.preco * 100).toFixed(1) + "%"
    : "—";

  return (
    <div>
      {/* Cabeçalho */}
      <div style={styles.secHeader}>
        <span style={styles.secTitulo}>📦 Produtos ({lista.length})</span>
        <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {podeAlterar && (
            <BuscaProduto
              busca={busca}
              setBusca={setBusca}
              onProdutoEncontrado={(dados) => {
                setEditando(null);
                setForm({
                  nome: dados.nome,
                  principio_ativo: dados.principio_ativo,
                  categoria: dados.categoria || "Outros",
                  codigo_barras: dados.codigo_barras,
                  estoque: "",
                  estoque_minimo: 10,
                  preco_compra: "",
                  preco: "",
                  validade: ""
                });
                setModal(true);
              }}
            />
          )}
          {podeAlterar && <Button onClick={abrirNovo}>+ Novo produto</Button>}
        </div>
      </div>

      {/* Tabela */}
      <div style={styles.sec}>
        {loading ? (
          <div style={styles.vazio}>Carregando produtos...</div>
        ) : lista.length === 0 ? (
          <div style={styles.vazio}>
            {busca ? `Nenhum produto encontrado para "${busca}"` : "Nenhum produto cadastrado ainda."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Nome", "Princípio ativo", "Categoria", "Estoque", "Mín.", "Compra", "Venda", "Margem", "Validade", "Status", ""].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(p => (
                  <tr key={p.id}>
                    <td style={styles.td}><b>{p.nome}</b></td>
                    <td style={{ ...styles.td, color: colors.textSubtle, fontSize: 12.5 }}>{p.principio_ativo || "—"}</td>
                    <td style={styles.td}><Tag>{p.categoria}</Tag></td>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontWeight: 600 }}>{p.estoque}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", color: colors.textSubtle }}>{p.estoque_minimo}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12.5 }}>{fmt(p.preco_compra || 0)}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontWeight: 700 }}>{fmt(p.preco)}</td>
                    <td style={styles.td}><Tag variant="info">{margem(p)}</Tag></td>
                    <td style={styles.td}>{tagValidade(p.validade)}</td>
                    <td style={styles.td}>{tagEstoque(p)}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Button variant="warning" size="sm" title="Entrada de estoque"
                          onClick={() => { setModalEntrada(p); setQtdEntrada(""); }}>📥</Button>
                        {podeAlterar && (
                          <Button variant="ghost" size="sm" onClick={() => abrirEditar(p)}>✏️</Button>
                        )}
                        {podeAlterar && (
                          <Button variant="danger" size="sm" onClick={() => excluir(p.id, p.nome)}>🗑️</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal cadastro/edição */}
      <Modal
        aberto={modal}
        onClose={() => setModal(false)}
        titulo={editando ? "✏️ Editar produto" : "➕ Novo produto"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "💾 Salvar"}
            </Button>
          </>
        }
      >
        <Field label="Nome do produto *">
          <Input autoFocus value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Ex: Dipirona 500mg" />
        </Field>

        <Field label="Princípio ativo">
          <Input value={form.principio_ativo}
            onChange={e => setForm(f => ({ ...f, principio_ativo: e.target.value }))}
            placeholder="Ex: Metamizol sódico" />
        </Field>

        <div style={styles.row2}>
          <Field label="Categoria">
            <select style={styles.select} value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Código de barras">
            <Input value={form.codigo_barras}
              onChange={e => setForm(f => ({ ...f, codigo_barras: e.target.value }))}
              placeholder="EAN-13" />
          </Field>
        </div>

        <div style={styles.row3}>
          <Field label="Estoque atual">
            <Input type="number" value={form.estoque}
              onChange={e => setForm(f => ({ ...f, estoque: e.target.value }))} placeholder="0" />
          </Field>
          <Field label="Estoque mínimo">
            <Input type="number" value={form.estoque_minimo}
              onChange={e => setForm(f => ({ ...f, estoque_minimo: e.target.value }))} placeholder="10" />
          </Field>
          <Field label="Validade">
            <Input type="date" value={form.validade}
              onChange={e => setForm(f => ({ ...f, validade: e.target.value }))} />
          </Field>
        </div>

        <div style={styles.row2}>
          <Field label="Preço de compra (R$)">
            <Input type="number" step="0.01" value={form.preco_compra}
              onChange={e => setForm(f => ({ ...f, preco_compra: e.target.value }))} placeholder="0,00" />
          </Field>
          <Field label="Preço de venda (R$) *">
            <Input type="number" step="0.01" value={form.preco}
              onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="0,00" />
          </Field>
        </div>
      </Modal>

      {/* Modal entrada de estoque */}
      <Modal
        aberto={!!modalEntrada}
        onClose={() => setModalEntrada(null)}
        titulo="📥 Entrada de estoque"
        maxWidth={380}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalEntrada(null)}>Cancelar</Button>
            <Button onClick={confirmarEntrada}>Confirmar entrada</Button>
          </>
        }
      >
        {modalEntrada && (
          <>
            <div style={styles.infoBox}>
              {modalEntrada.nome} — estoque atual: <b>{modalEntrada.estoque} unidades</b>
            </div>
            <Field label="Quantidade a adicionar">
              <Input autoFocus type="number" style={{ fontSize: 22, fontWeight: 700, textAlign: "center" }}
                value={qtdEntrada} onChange={e => setQtdEntrada(e.target.value)}
                onKeyDown={e => e.key === "Enter" && confirmarEntrada()}
                placeholder="Ex: 50" />
            </Field>
          </>
        )}
      </Modal>
    </div>
  );
}

// ─── ESTILOS LOCAIS (tabela e seções específicas de Produtos) ────────────────
const styles = {
  sec: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    boxShadow: shadow.card,
    overflow: "hidden",
  },
  secHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    padding: "11px 16px",
    borderBottom: `1px solid ${colors.border}`,
    background: colors.surface,
    borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
  },
  secTitulo: { fontSize: 14, fontWeight: 700 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    background: colors.surfaceMute,
    padding: "8px 13px",
    textAlign: "left",
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".4px",
    color: colors.textSubtle,
    whiteSpace: "nowrap",
  },
  td: { padding: "9px 13px", borderTop: `1px solid ${colors.border}`, verticalAlign: "middle" },
  vazio: { textAlign: "center", padding: 32, color: colors.textSubtle, fontSize: 13 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  select: {
    fontFamily: "inherit",
    fontSize: 14,
    padding: "8px 10px",
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.md,
    width: "100%",
    background: colors.surface,
    color: colors.text,
    outline: "none",
  },
  infoBox: {
    background: colors.brandBgSoft2,
    border: `1px solid ${colors.brandBorder}`,
    borderRadius: radius.md,
    padding: "10px 14px",
    marginBottom: 14,
    fontSize: 13,
    color: colors.brandDark,
    fontWeight: 600,
  },
};
