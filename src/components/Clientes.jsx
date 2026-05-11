import { useState, useEffect } from "react";
import {
  listarClientes,
  criarCliente,
  atualizarCliente,
  removerCliente,
} from "../services/clientes.service";
import { listarVendasComItens } from "../services/vendas.service";
import { fmt, fmtData, matchStr } from "../lib/format";
import { colors, radius, shadow } from "../styles/tokens";
import { useToast } from "../ui/Toast";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Field from "../ui/Field";
import Tag from "../ui/Tag";
import Modal from "../ui/Modal";

const FORM_VAZIO = { nome: "", telefone: "", cidade: "", observacoes: "" };

export default function Clientes() {
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [modalHistorico, setModalHistorico] = useState(null);

  // ── carregar dados ───────────────────────────────────────────────
  async function recarregar() {
    setLoading(true);
    try {
      setClientes(await listarClientes());
    } catch (e) {
      toast("Erro ao buscar clientes: " + e.message, "erro");
    } finally {
      setLoading(false);
    }
  }

  async function recarregarVendas() {
    try {
      setVendas(await listarVendasComItens());
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    recarregar();
    recarregarVendas();
  }, []);

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
    if (!form.nome.trim()) return toast("Informe o nome do cliente.", "erro");
    setSalvando(true);

    const dados = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      cidade: form.cidade.trim(),
      observacoes: form.observacoes.trim()
    };

    try {
      if (editando) await atualizarCliente(editando, dados);
      else          await criarCliente(dados);
      toast(editando ? "Cliente atualizado!" : "Cliente cadastrado!");
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
      await removerCliente(id);
      toast("Cliente removido.");
      recarregar();
    } catch (e) {
      toast("Erro ao excluir: " + e.message, "erro");
    }
  }

  // ── helpers ──────────────────────────────────────────────────────
  const vendasCliente = (id) => vendas.filter(v => v.cliente_id === id);
  const totalGasto = (id) => vendasCliente(id).reduce((s, v) => s + Number(v.total), 0);
  const fiadoAberto = (id) => vendasCliente(id)
    .filter(v => v.pagamento === "Fiado")
    .reduce((s, v) => s + Number(v.total), 0);

  const lista = clientes.filter(c =>
    matchStr(c.nome, busca) ||
    (c.telefone ?? "").includes(busca) ||
    matchStr(c.cidade, busca)
  );

  return (
    <div>
      {/* Cabeçalho */}
      <div style={styles.secHeader}>
        <span style={styles.secTitulo}>👥 Clientes ({lista.length})</span>
        <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="🔍 Buscar por nome, telefone ou cidade..."
            style={{ width: 280 }}
          />
          <Button onClick={abrirNovo}>+ Novo cliente</Button>
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
                      <td style={{ ...styles.td, color: colors.textSubtle }}>{c.telefone || "—"}</td>
                      <td style={styles.td}><Tag>{c.cidade || "—"}</Tag></td>
                      <td style={styles.td}>
                        <Tag variant="info">{vendasCliente(c.id).length}</Tag>
                      </td>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontWeight: 700 }}>
                        {fmt(totalGasto(c.id))}
                      </td>
                      <td style={styles.td}>
                        {fi > 0
                          ? <Tag variant="danger">⚠️ {fmt(fi)}</Tag>
                          : <Tag>—</Tag>
                        }
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Button variant="info" size="sm" onClick={() => setModalHistorico(c)}>
                            📋 Histórico
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => abrirEditar(c)}>✏️</Button>
                          <Button variant="danger" size="sm" onClick={() => excluir(c.id, c.nome)}>🗑️</Button>
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
      <Modal
        aberto={modal}
        onClose={() => setModal(false)}
        titulo={editando ? "✏️ Editar cliente" : "➕ Novo cliente"}
        maxWidth={500}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "💾 Salvar"}
            </Button>
          </>
        }
      >
        <Field label="Nome completo *">
          <Input autoFocus value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Nome do cliente" />
        </Field>

        <div style={styles.row2}>
          <Field label="Telefone / WhatsApp">
            <Input value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
              placeholder="(88) 99999-9999" />
          </Field>
          <Field label="Cidade">
            <Input value={form.cidade}
              onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
              placeholder="Ex: Quixadá" />
          </Field>
        </div>

        <Field label="Observações (alergias, condições, etc.)">
          <textarea rows={3}
            style={{ ...styles.textarea }}
            value={form.observacoes}
            onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
            placeholder="Ex: Alérgico à dipirona, hipertenso..." />
        </Field>
      </Modal>

      {/* Modal histórico */}
      <Modal
        aberto={!!modalHistorico}
        onClose={() => setModalHistorico(null)}
        titulo={modalHistorico ? `📋 ${modalHistorico.nome}` : ""}
        maxWidth={460}
      >
        {modalHistorico && (
          <>
            {/* Resumo do cliente */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={styles.cardResumo}>
                <div style={styles.cardResumoLabel}>Total gasto</div>
                <div style={{ ...styles.cardResumoValor, color: colors.brand }}>
                  {fmt(totalGasto(modalHistorico.id))}
                </div>
              </div>
              <div style={styles.cardResumo}>
                <div style={styles.cardResumoLabel}>Fiado em aberto</div>
                <div style={{
                  ...styles.cardResumoValor,
                  color: fiadoAberto(modalHistorico.id) > 0 ? colors.dangerDark : colors.textSubtle,
                }}>
                  {fmt(fiadoAberto(modalHistorico.id))}
                </div>
              </div>
            </div>

            {/* Observações */}
            {modalHistorico.observacoes && (
              <div style={styles.alertaObs}>
                ⚠️ <b>Obs:</b> {modalHistorico.observacoes}
              </div>
            )}

            {/* Lista de compras */}
            <div style={styles.tituloSecao}>Histórico de compras</div>

            {vendasCliente(modalHistorico.id).length === 0 ? (
              <div style={styles.vazio}>Nenhuma compra registrada.</div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {[...vendasCliente(modalHistorico.id)]
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map(v => (
                    <div key={v.id} style={styles.itemHistorico}>
                      <div>
                        <b>{fmtData(v.created_at)}</b>
                        <span style={{ marginLeft: 8 }}><Tag>{v.pagamento}</Tag></span>
                        {v.pagamento === "Fiado" && (
                          <span style={{ marginLeft: 4 }}><Tag variant="danger">fiado</Tag></span>
                        )}
                      </div>
                      <b style={{ fontFamily: "monospace" }}>{fmt(v.total)}</b>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

// ─── ESTILOS LOCAIS ──────────────────────────────────────────────────────────
const styles = {
  sec: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: `0 0 ${radius.xl}px ${radius.xl}px`,
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
    border: `1px solid ${colors.border}`,
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
  textarea: {
    fontFamily: "inherit",
    fontSize: 14,
    padding: "8px 10px",
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.md,
    width: "100%",
    background: colors.surface,
    color: colors.text,
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  cardResumo: {
    background: colors.surfaceAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: "12px 14px",
  },
  cardResumoLabel: {
    fontSize: 11,
    color: colors.textSubtle,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  cardResumoValor: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "monospace",
  },
  alertaObs: {
    background: colors.warningBgSoft,
    border: `1px solid ${colors.warningBorder2}`,
    borderRadius: radius.md,
    padding: "9px 13px",
    marginBottom: 14,
    fontSize: 13,
    color: colors.warningDark,
  },
  tituloSecao: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.textSubtle,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: ".3px",
  },
  itemHistorico: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 0",
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 13,
  },
};
