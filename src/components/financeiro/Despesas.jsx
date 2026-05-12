import { useEffect, useState } from "react";
import {
  listarDespesas,
  criarDespesa,
  removerDespesa,
  marcarDespesaPaga,
} from "../../services/financeiro.service";
import { useToast } from "../../ui/Toast";
import { fmt, fmtData, diasParaVencer } from "../../lib/format";
import { colors, radius, shadow } from "../../styles/tokens";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Field from "../../ui/Field";
import Tag from "../../ui/Tag";
import Modal from "../../ui/Modal";

const CATEGORIAS = [
  "Fornecedor", "Aluguel", "Energia", "Água", "Internet",
  "Salário", "Imposto", "Manutenção", "Outros",
];

const FORM_VAZIO = {
  descricao: "",
  valor: "",
  categoria: "Fornecedor",
  data_vencimento: "",
  observacao: "",
};

export default function Despesas() {
  const toast = useToast();
  const [despesas, setDespesas] = useState([]);
  const [filtro, setFiltro]     = useState("a_pagar");
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { carregar(); }, [filtro]);

  async function carregar() {
    setLoading(true);
    try {
      setDespesas(await listarDespesas(filtro));
    } catch (e) {
      toast("Erro: " + e.message, "erro");
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    if (!form.descricao.trim()) return toast("Informe a descrição.", "erro");
    if (!form.valor)             return toast("Informe o valor.", "erro");
    setSalvando(true);
    try {
      await criarDespesa({
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        categoria: form.categoria,
        data_vencimento: form.data_vencimento || null,
        observacao: form.observacao.trim() || null,
      });
      toast("Despesa cadastrada!");
      setModal(false);
      setForm(FORM_VAZIO);
      carregar();
    } catch (e) {
      toast("Erro ao salvar: " + e.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarPago(d) {
    try {
      await marcarDespesaPaga(d.id, !d.pago);
      toast(d.pago ? "Despesa desmarcada." : "Despesa paga!");
      carregar();
    } catch (e) {
      toast("Erro: " + e.message, "erro");
    }
  }

  async function excluir(d) {
    if (!confirm(`Excluir "${d.descricao}"?`)) return;
    try {
      await removerDespesa(d.id);
      toast("Despesa removida.");
      carregar();
    } catch (e) {
      toast("Erro: " + e.message, "erro");
    }
  }

  return (
    <div>
      {/* Filtros + nova */}
      <div style={styles.barraTop}>
        <div style={{ display: "flex", gap: 6 }}>
          <FiltroBtn label="A pagar" ativo={filtro === "a_pagar"} onClick={() => setFiltro("a_pagar")} />
          <FiltroBtn label="Pagas"   ativo={filtro === "pagas"}   onClick={() => setFiltro("pagas")} />
          <FiltroBtn label="Todas"   ativo={filtro === "todas"}   onClick={() => setFiltro("todas")} />
        </div>
        <Button onClick={() => { setForm(FORM_VAZIO); setModal(true); }}>+ Nova despesa</Button>
      </div>

      {/* Lista */}
      <div style={styles.box}>
        {loading ? (
          <div style={styles.vazio}>Carregando...</div>
        ) : despesas.length === 0 ? (
          <div style={styles.vazio}>Nenhuma despesa.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Descrição", "Categoria", "Vencimento", "Valor", "Status", ""].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {despesas.map((d) => (
                <tr key={d.id}>
                  <td style={styles.td}><b>{d.descricao}</b></td>
                  <td style={styles.td}><Tag>{d.categoria}</Tag></td>
                  <td style={styles.td}>{tagVencimento(d)}</td>
                  <td style={{ ...styles.td, fontFamily: "monospace", fontWeight: 700 }}>
                    {fmt(d.valor)}
                  </td>
                  <td style={styles.td}>
                    {d.pago
                      ? <Tag variant="success">✓ Paga</Tag>
                      : <Tag variant="warning">A pagar</Tag>}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Button size="sm" onClick={() => alternarPago(d)}>
                        {d.pago ? "↺ Desmarcar" : "✓ Marcar paga"}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => excluir(d)}>🗑️</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nova despesa */}
      <Modal
        aberto={modal}
        onClose={() => setModal(false)}
        titulo="➕ Nova despesa"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "💾 Salvar"}
            </Button>
          </>
        }
      >
        <Field label="Descrição *">
          <Input autoFocus value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            placeholder="Ex: Energia março/2026" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Categoria">
            <select style={styles.select} value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Valor (R$) *">
            <Input type="number" step="0.01" value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
              placeholder="0,00" />
          </Field>
        </div>
        <Field label="Vencimento">
          <Input type="date" value={form.data_vencimento}
            onChange={(e) => setForm((f) => ({ ...f, data_vencimento: e.target.value }))} />
        </Field>
        <Field label="Observação">
          <Input value={form.observacao}
            onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
            placeholder="Opcional" />
        </Field>
      </Modal>
    </div>
  );
}

function tagVencimento(d) {
  if (!d.data_vencimento) return <Tag>—</Tag>;
  const dias = diasParaVencer(d.data_vencimento);
  if (d.pago)      return <Tag>{fmtData(d.data_vencimento)}</Tag>;
  if (dias < 0)    return <Tag variant="danger">⚠️ Vencida ({fmtData(d.data_vencimento)})</Tag>;
  if (dias <= 7)   return <Tag variant="warning">⏰ {dias}d ({fmtData(d.data_vencimento)})</Tag>;
  return <Tag>{fmtData(d.data_vencimento)}</Tag>;
}

function FiltroBtn({ label, ativo, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: radius.md,
        border: `1.5px solid ${ativo ? colors.brand : colors.border}`,
        background:  ativo ? colors.brandBgSoft : colors.surface,
        color:       ativo ? colors.brand : colors.textMuted,
        fontWeight:  ativo ? 700 : 500,
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

const styles = {
  barraTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 10,
  },
  box: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    overflow: "hidden",
    boxShadow: shadow.card,
  },
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
  },
  td: { padding: "9px 13px", borderTop: `1px solid ${colors.border}` },
  vazio: { textAlign: "center", padding: 32, color: colors.textSubtle, fontSize: 13 },
  select: {
    fontFamily: "inherit",
    fontSize: 14,
    padding: "8px 10px",
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.md,
    width: "100%",
    background: colors.surface,
    outline: "none",
  },
};
