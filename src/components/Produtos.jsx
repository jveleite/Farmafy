import BuscaProduto from "./BuscaProduto";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const CATEGORIAS = [
  "Analgésico", "Antibiótico", "Anti-inflamatório", "Antidiabético",
  "Cardiovascular", "Corticoide", "Dermatológico", "Gastrointestinal",
  "Vitaminas", "Outros"
];

const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FORM_VAZIO = {
  nome: "", principio_ativo: "", categoria: "Analgésico",
  estoque: "", estoque_minimo: 10, preco_compra: "",
  preco: "", validade: "", codigo_barras: ""
};

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [modalEntrada, setModalEntrada] = useState(null);
  const [qtdEntrada, setQtdEntrada] = useState("");
  const [toast, setToast] = useState(null);

  // ── buscar produtos ──────────────────────────────────────────────
  async function buscarProdutos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      mostrarToast("Erro ao buscar produtos: " + error.message, "erro");
    } else {
      setProdutos(data || []);
    }
    setLoading(false);
  }

  useEffect(() => { buscarProdutos(); }, []);

  // ── toast ────────────────────────────────────────────────────────
  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2800);
  }

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
    if (!form.nome.trim()) return alert("Informe o nome do produto.");
    if (!form.preco) return alert("Informe o preço de venda.");

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

    if (editando) {
      const { error } = await supabase
        .from("produtos")
        .update(dados)
        .eq("id", editando);

      if (error) mostrarToast("Erro ao atualizar: " + error.message, "erro");
      else { mostrarToast("Produto atualizado!"); setModal(false); buscarProdutos(); }
    } else {
      const { error } = await supabase
        .from("produtos")
        .insert(dados);

      if (error) mostrarToast("Erro ao cadastrar: " + error.message, "erro");
      else { mostrarToast("Produto cadastrado!"); setModal(false); buscarProdutos(); }
    }

    setSalvando(false);
  }

  // ── excluir ──────────────────────────────────────────────────────
  async function excluir(id, nome) {
    if (!confirm(`Excluir "${nome}"?`)) return;

    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("id", id);

    if (error) mostrarToast("Erro ao excluir: " + error.message, "erro");
    else { mostrarToast("Produto removido."); buscarProdutos(); }
  }

  // ── entrada de estoque ───────────────────────────────────────────
  async function confirmarEntrada() {
    const q = parseInt(qtdEntrada);
    if (!q || q <= 0) return alert("Informe uma quantidade válida.");

    const novoEstoque = modalEntrada.estoque + q;

    const { error } = await supabase
      .from("produtos")
      .update({ estoque: novoEstoque })
      .eq("id", modalEntrada.id);

    if (error) mostrarToast("Erro: " + error.message, "erro");
    else {
      mostrarToast(`+${q} unidades adicionadas!`);
      setModalEntrada(null);
      setQtdEntrada("");
      buscarProdutos();
    }
  }

  // ── filtro de busca ──────────────────────────────────────────────
  const lista = produtos.filter(p => {
    const q = busca.toLowerCase();
    return (
      p.nome?.toLowerCase().includes(q) ||
      p.principio_ativo?.toLowerCase().includes(q) ||
      p.categoria?.toLowerCase().includes(q)
    );
  });

  // ── helpers visuais ──────────────────────────────────────────────
  const diasParaVencer = (v) => !v ? Infinity : Math.ceil((new Date(v) - new Date()) / 86400000);

  function tagEstoque(p) {
    if (p.estoque <= 0) return <span style={tag("vm")}>Sem estoque</span>;
    if (p.estoque <= p.estoque_minimo) return <span style={tag("am")}>Baixo</span>;
    return <span style={tag("v")}>OK</span>;
  }

  function tagValidade(val) {
    if (!val) return <span style={tag("g")}>—</span>;
    const d = diasParaVencer(val);
    if (d < 0) return <span style={tag("vm")}>Vencido</span>;
    if (d <= 30) return <span style={tag("am")}>⏰ {d}d</span>;
    return <span style={tag("g")}>{new Date(val).toLocaleDateString("pt-BR")}</span>;
  }

  const margem = (p) => p.preco_compra > 0
    ? ((p.preco - p.preco_compra) / p.preco * 100).toFixed(1) + "%"
    : "—";

  // ── render ───────────────────────────────────────────────────────
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 999,
          background: toast.tipo === "erro" ? "#b91c1c" : "#0a6238",
          color: "#fff", padding: "11px 18px", borderRadius: 10,
          fontWeight: 700, fontSize: 13.5, boxShadow: "0 4px 20px rgba(0,0,0,.2)"
        }}>
          {toast.tipo === "erro" ? "❌" : "✅"} {toast.msg}
        </div>
      )}

      {/* Cabeçalho */}
      <div style={styles.secHeader}>
        <span style={styles.secTitulo}>📦 Produtos ({lista.length})</span>
        <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
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
          <button style={styles.btnVerde} onClick={abrirNovo}>+ Novo produto</button>
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
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.td}><b>{p.nome}</b></td>
                    <td style={{ ...styles.td, color: "#64748b", fontSize: 12.5 }}>{p.principio_ativo || "—"}</td>
                    <td style={styles.td}><span style={tag("g")}>{p.categoria}</span></td>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontWeight: 600 }}>{p.estoque}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", color: "#64748b" }}>{p.estoque_minimo}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12.5 }}>{fmt(p.preco_compra || 0)}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", fontWeight: 700 }}>{fmt(p.preco)}</td>
                    <td style={styles.td}><span style={tag("az")}>{margem(p)}</span></td>
                    <td style={styles.td}>{tagValidade(p.validade)}</td>
                    <td style={styles.td}>{tagEstoque(p)}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={styles.btnAmbar} title="Entrada de estoque"
                          onClick={() => { setModalEntrada(p); setQtdEntrada(""); }}>📥</button>
                        <button style={styles.btnGhost} onClick={() => abrirEditar(p)}>✏️</button>
                        <button style={styles.btnVermelho} onClick={() => excluir(p.id, p.nome)}>🗑️</button>
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
      {modal && (
        <div style={styles.overlay} onClick={() => setModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitulo}>
              <span>{editando ? "✏️ Editar produto" : "➕ Novo produto"}</span>
              <button style={styles.btnGhost} onClick={() => setModal(false)}>✕</button>
            </div>

            <Campo label="Nome do produto *">
              <input autoFocus style={styles.input} value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Dipirona 500mg" />
            </Campo>

            <Campo label="Princípio ativo">
              <input style={styles.input} value={form.principio_ativo}
                onChange={e => setForm(f => ({ ...f, principio_ativo: e.target.value }))}
                placeholder="Ex: Metamizol sódico" />
            </Campo>

            <div style={styles.row2}>
              <Campo label="Categoria">
                <select style={styles.input} value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </Campo>
              <Campo label="Código de barras">
                <input style={styles.input} value={form.codigo_barras}
                  onChange={e => setForm(f => ({ ...f, codigo_barras: e.target.value }))}
                  placeholder="EAN-13" />
              </Campo>
            </div>

            <div style={styles.row3}>
              <Campo label="Estoque atual">
                <input type="number" style={styles.input} value={form.estoque}
                  onChange={e => setForm(f => ({ ...f, estoque: e.target.value }))} placeholder="0" />
              </Campo>
              <Campo label="Estoque mínimo">
                <input type="number" style={styles.input} value={form.estoque_minimo}
                  onChange={e => setForm(f => ({ ...f, estoque_minimo: e.target.value }))} placeholder="10" />
              </Campo>
              <Campo label="Validade">
                <input type="date" style={styles.input} value={form.validade}
                  onChange={e => setForm(f => ({ ...f, validade: e.target.value }))} />
              </Campo>
            </div>

            <div style={styles.row2}>
              <Campo label="Preço de compra (R$)">
                <input type="number" step="0.01" style={styles.input} value={form.preco_compra}
                  onChange={e => setForm(f => ({ ...f, preco_compra: e.target.value }))} placeholder="0,00" />
              </Campo>
              <Campo label="Preço de venda (R$) *">
                <input type="number" step="0.01" style={styles.input} value={form.preco}
                  onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="0,00" />
              </Campo>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
              <button style={styles.btnGhost} onClick={() => setModal(false)}>Cancelar</button>
              <button style={styles.btnVerde} onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "💾 Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal entrada de estoque */}
      {modalEntrada && (
        <div style={styles.overlay} onClick={() => setModalEntrada(null)}>
          <div style={{ ...styles.modal, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitulo}>
              <span>📥 Entrada de estoque</span>
              <button style={styles.btnGhost} onClick={() => setModalEntrada(null)}>✕</button>
            </div>
            <div style={{ background: "#edf7f2", border: "1px solid #a8d5bc", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#0a6238", fontWeight: 600 }}>
              {modalEntrada.nome} — estoque atual: <b>{modalEntrada.estoque} unidades</b>
            </div>
            <Campo label="Quantidade a adicionar">
              <input autoFocus type="number" style={{ ...styles.input, fontSize: 22, fontWeight: 700, textAlign: "center" }}
                value={qtdEntrada} onChange={e => setQtdEntrada(e.target.value)}
                onKeyDown={e => e.key === "Enter" && confirmarEntrada()}
                placeholder="Ex: 50" />
            </Campo>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
              <button style={styles.btnGhost} onClick={() => setModalEntrada(null)}>Cancelar</button>
              <button style={styles.btnVerde} onClick={confirmarEntrada}>Confirmar entrada</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUBCOMPONENTE ────────────────────────────────────────────────────────────
function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px", color: "#64748b", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = {
  sec: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)", overflow: "hidden" },
  secHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "11px 16px", borderBottom: "1px solid #e2e8f0", background: "#fff", borderRadius: "12px 12px 0 0" },
  secTitulo: { fontSize: 14, fontWeight: 700 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { background: "#f1f5f9", padding: "8px 13px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", color: "#64748b", whiteSpace: "nowrap" },
  td: { padding: "9px 13px", borderTop: "1px solid #e2e8f0", verticalAlign: "middle" },
  tr: {},
  vazio: { textAlign: "center", padding: 32, color: "#64748b", fontSize: 13 },
  input: { fontFamily: "inherit", fontSize: 14, padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, width: "100%", background: "#fff", color: "#0f172a", outline: "none" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.46)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 },
  modal: { background: "#fff", borderRadius: 12, padding: 22, width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,.18)" },
  modalTitulo: { fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  btnVerde: { display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "#0d7a45", color: "#fff" },
  btnGhost: { display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", border: "1.5px solid #e2e8f0", color: "#0f172a" },
  btnVermelho: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 8, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" },
  btnAmbar: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 8, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "#fff3d6", border: "1px solid #fcd34d", color: "#c47700" },
};

function tag(tipo) {
  const map = {
    v: { background: "#edf7f2", color: "#0d7a45" },
    vm: { background: "#fef2f2", color: "#b91c1c" },
    am: { background: "#fff3d6", color: "#c47700" },
    az: { background: "#e8f0fb", color: "#1251a3" },
    g: { background: "#f1f5f9", color: "#64748b" },
  };
  return { ...map[tipo], display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 99, fontSize: 11, fontWeight: 700 };
}