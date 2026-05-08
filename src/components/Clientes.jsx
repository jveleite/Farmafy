import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FORM_VAZIO = { nome: "", telefone: "", cidade: "", observacoes: "" };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [modalHistorico, setModalHistorico] = useState(null);
  const [toast, setToast] = useState(null);

  // ── carregar dados ───────────────────────────────────────────────
  async function buscarClientes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("nome", { ascending: true });

    if (error) mostrarToast("Erro ao buscar clientes: " + error.message, "erro");
    else setClientes(data || []);
    setLoading(false);
  }

  async function buscarVendas() {
    const { data } = await supabase
      .from("vendas")
      .select("*, itens_venda(*)");
    setVendas(data || []);
  }

  useEffect(() => {
    buscarClientes();
    buscarVendas();
  }, []);

  // ── toast ────────────────────────────────────────────────────────
  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2800);
  }

  // ── modal ────────────────────────────────────────────────────────
  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setModal(true);
  }

  function abrirEditar(c) {
    setEditando(c.id);
    setForm({
      nome: c.nome || "",
      telefone: c.telefone || "",
      cidade: c.cidade || "",
      observacoes: c.observacoes || ""
    });
    setModal(true);
  }

  // ── salvar ───────────────────────────────────────────────────────
  async function salvar() {
    if (!form.nome.trim()) return alert("Informe o nome do cliente.");
    setSalvando(true);

    const dados = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      cidade: form.cidade.trim(),
      observacoes: form.observacoes.trim()
    };

    if (editando) {
      const { error } = await supabase
        .from("clientes")
        .update(dados)
        .eq("id", editando);

      if (error) mostrarToast("Erro ao atualizar: " + error.message, "erro");
      else { mostrarToast("Cliente atualizado!"); setModal(false); buscarClientes(); }
    } else {
      const { error } = await supabase
        .from("clientes")
        .insert(dados);

      if (error) mostrarToast("Erro ao cadastrar: " + error.message, "erro");
      else { mostrarToast("Cliente cadastrado!"); setModal(false); buscarClientes(); }
    }

    setSalvando(false);
  }

  // ── excluir ──────────────────────────────────────────────────────
  async function excluir(id, nome) {
    if (!confirm(`Excluir "${nome}"?`)) return;

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);

    if (error) mostrarToast("Erro ao excluir: " + error.message, "erro");
    else { mostrarToast("Cliente removido."); buscarClientes(); }
  }

  // ── helpers ──────────────────────────────────────────────────────
  const vendasCliente = (id) => vendas.filter(v => v.cliente_id === id);
  const totalGasto = (id) => vendasCliente(id).reduce((s, v) => s + Number(v.total), 0);
  const fiadoAberto = (id) => vendasCliente(id)
    .filter(v => v.pagamento === "Fiado")
    .reduce((s, v) => s + Number(v.total), 0);

  const lista = clientes.filter(c => {
    const q = busca.toLowerCase();
    return (
      c.nome?.toLowerCase().includes(q) ||
      c.telefone?.includes(q) ||
      c.cidade?.toLowerCase().includes(q)
    );
  });

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
        <span style={styles.secTitulo}>👥 Clientes ({lista.length})</span>
        <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="🔍 Buscar por nome, telefone ou cidade..."
            style={{ ...styles.input, width: 280 }}
          />
          <button style={styles.btnVerde} onClick={abrirNovo}>+ Novo cliente</button>
        </div>
      </div>

      {/* Tabela */}
      <div style={styles.sec}>
        {loading ? (
          <div style={styles.vazio}>Carregando clientes...</div>
        ) : lista.length === 0 ? (
          <div style={styles.vazio}>
            {busca ? `Nenhum cliente encontrado para "${busca}"` : "Nenhum cliente cadastrado ainda."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Nome", "Telefone", "Cidade", "Compras", "Total gasto", "Fiado em aberto", ""].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(c => {
                  const fi = fiadoAberto(c.id);
                  return (
                    <tr key={c.id}>
                      <td style={styles.td}><b>{c.nome}</b></td>
                      <td style={{ ...styles.td, color: "#64748b" }}>{c.telefone || "—"}</td>
                      <td style={styles.td}>
                        <span style={tag("g")}>{c.cidade || "—"}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={tag("az")}>{vendasCliente(c.id).length}</span>
                      </td>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontWeight: 700 }}>
                        {fmt(totalGasto(c.id))}
                      </td>
                      <td style={styles.td}>
                        {fi > 0
                          ? <span style={tag("vm")}>⚠️ {fmt(fi)}</span>
                          : <span style={tag("g")}>—</span>
                        }
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button style={styles.btnAzul} onClick={() => setModalHistorico(c)}>
                            📋 Histórico
                          </button>
                          <button style={styles.btnGhost} onClick={() => abrirEditar(c)}>✏️</button>
                          <button style={styles.btnVermelho} onClick={() => excluir(c.id, c.nome)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              <span>{editando ? "✏️ Editar cliente" : "➕ Novo cliente"}</span>
              <button style={styles.btnGhost} onClick={() => setModal(false)}>✕</button>
            </div>

            <Campo label="Nome completo *">
              <input autoFocus style={styles.input} value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome do cliente" />
            </Campo>

            <div style={styles.row2}>
              <Campo label="Telefone / WhatsApp">
                <input style={styles.input} value={form.telefone}
                  onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                  placeholder="(88) 99999-9999" />
              </Campo>
              <Campo label="Cidade">
                <input style={styles.input} value={form.cidade}
                  onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                  placeholder="Ex: Quixadá" />
              </Campo>
            </div>

            <Campo label="Observações (alergias, condições, etc.)">
              <textarea rows={3} style={{ ...styles.input, resize: "vertical" }}
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                placeholder="Ex: Alérgico à dipirona, hipertenso..." />
            </Campo>

            <div style={styles.modalFooter}>
              <button style={styles.btnGhost} onClick={() => setModal(false)}>Cancelar</button>
              <button style={styles.btnVerde} onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "💾 Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal histórico */}
      {modalHistorico && (
        <div style={styles.overlay} onClick={() => setModalHistorico(null)}>
          <div style={{ ...styles.modal, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitulo}>
              <span>📋 {modalHistorico.nome}</span>
              <button style={styles.btnGhost} onClick={() => setModalHistorico(null)}>✕</button>
            </div>

            {/* Resumo do cliente */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={cardResumo}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total gasto</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0d7a45", fontFamily: "monospace" }}>
                  {fmt(totalGasto(modalHistorico.id))}
                </div>
              </div>
              <div style={cardResumo}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Fiado em aberto</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: fiadoAberto(modalHistorico.id) > 0 ? "#b91c1c" : "#64748b", fontFamily: "monospace" }}>
                  {fmt(fiadoAberto(modalHistorico.id))}
                </div>
              </div>
            </div>

            {/* Observações */}
            {modalHistorico.observacoes && (
              <div style={{ background: "#fff3d6", border: "1px solid #fde68a", borderRadius: 8, padding: "9px 13px", marginBottom: 14, fontSize: 13, color: "#92400e" }}>
                ⚠️ <b>Obs:</b> {modalHistorico.observacoes}
              </div>
            )}

            {/* Lista de compras */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".3px" }}>
              Histórico de compras
            </div>

            {vendasCliente(modalHistorico.id).length === 0 ? (
              <div style={styles.vazio}>Nenhuma compra registrada.</div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {[...vendasCliente(modalHistorico.id)]
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map(v => (
                    <div key={v.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 0", borderBottom: "1px solid #e2e8f0", fontSize: 13
                    }}>
                      <div>
                        <b>{new Date(v.created_at).toLocaleDateString("pt-BR")}</b>
                        <span style={{ ...tag("g"), marginLeft: 8 }}>{v.pagamento}</span>
                        {v.pagamento === "Fiado" && (
                          <span style={{ ...tag("vm"), marginLeft: 4 }}>fiado</span>
                        )}
                      </div>
                      <b style={{ fontFamily: "monospace" }}>{fmt(v.total)}</b>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────
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
  sec: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0 0 12px 12px", boxShadow: "0 1px 4px rgba(0,0,0,.08)", overflow: "hidden" },
  secHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "11px 16px", borderBottom: "1px solid #e2e8f0", background: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid #e2e8f0" },
  secTitulo: { fontSize: 14, fontWeight: 700 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { background: "#f1f5f9", padding: "8px 13px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", color: "#64748b", whiteSpace: "nowrap" },
  td: { padding: "9px 13px", borderTop: "1px solid #e2e8f0", verticalAlign: "middle" },
  vazio: { textAlign: "center", padding: 32, color: "#64748b", fontSize: 13 },
  input: { fontFamily: "inherit", fontSize: 14, padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, width: "100%", background: "#fff", color: "#0f172a", outline: "none" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.46)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 },
  modal: { background: "#fff", borderRadius: 12, padding: 22, width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,.18)" },
  modalTitulo: { fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" },
  modalFooter: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, paddingTop: 14, borderTop: "1px solid #e2e8f0" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  btnVerde: { display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "#0d7a45", color: "#fff" },
  btnAzul: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #bfdbfe", background: "#e8f0fb", color: "#1251a3" },
  btnGhost: { display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", border: "1.5px solid #e2e8f0", color: "#0f172a" },
  btnVermelho: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 8, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" },
};

const cardResumo = {
  background: "#f8fafc", border: "1px solid #e2e8f0",
  borderRadius: 8, padding: "12px 14px"
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