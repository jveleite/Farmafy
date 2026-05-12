import { useEffect, useState } from "react";
import {
  sessaoCaixaAtiva,
  abrirCaixa,
  fecharCaixa,
  listarMovimentacoesDaSessao,
  criarMovimentacaoCaixa,
  calcularSaldoEsperadoCaixa,
} from "../../services/financeiro.service";
import { useToast } from "../../ui/Toast";
import { fmt, fmtDataHora } from "../../lib/format";
import { colors, radius, shadow } from "../../styles/tokens";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Field from "../../ui/Field";
import Tag from "../../ui/Tag";
import Modal from "../../ui/Modal";

export default function Caixa() {
  const toast = useToast();
  const [sessao, setSessao]   = useState(null);
  const [movs, setMovs]       = useState([]);
  const [esperado, setEsperado] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modais
  const [modalAbrir, setModalAbrir]     = useState(false);
  const [modalFechar, setModalFechar]   = useState(false);
  const [modalMov, setModalMov]         = useState(null); // 'sangria' | 'suprimento' | null

  // Forms
  const [valorAbertura, setValorAbertura]     = useState("");
  const [obsAbertura, setObsAbertura]         = useState("");
  const [valorContado, setValorContado]       = useState("");
  const [obsFechamento, setObsFechamento]     = useState("");
  const [valorMov, setValorMov]               = useState("");
  const [obsMov, setObsMov]                   = useState("");

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      const s = await sessaoCaixaAtiva();
      setSessao(s);
      if (s) {
        const [m, esp] = await Promise.all([
          listarMovimentacoesDaSessao(s.id),
          calcularSaldoEsperadoCaixa(s),
        ]);
        setMovs(m);
        setEsperado(esp);
      } else {
        setMovs([]);
        setEsperado(0);
      }
    } catch (e) {
      toast("Erro: " + e.message, "erro");
    } finally {
      setLoading(false);
    }
  }

  async function confirmarAbertura() {
    try {
      await abrirCaixa(valorAbertura || 0, obsAbertura);
      toast("Caixa aberto!");
      setModalAbrir(false);
      setValorAbertura(""); setObsAbertura("");
      carregar();
    } catch (e) {
      toast("Erro: " + e.message, "erro");
    }
  }

  async function confirmarFechamento() {
    if (!valorContado) return toast("Informe o valor contado.", "erro");
    try {
      const dif = await fecharCaixa(sessao, valorContado, obsFechamento);
      const sinal = dif === 0 ? "🎯 fechado certinho!" : dif > 0 ? `📈 sobrou ${fmt(dif)}` : `📉 faltou ${fmt(Math.abs(dif))}`;
      toast(`Caixa fechado — ${sinal}`);
      setModalFechar(false);
      setValorContado(""); setObsFechamento("");
      carregar();
    } catch (e) {
      toast("Erro: " + e.message, "erro");
    }
  }

  async function confirmarMov() {
    if (!valorMov || Number(valorMov) <= 0) return toast("Informe um valor válido.", "erro");
    try {
      await criarMovimentacaoCaixa(sessao.id, modalMov, valorMov, obsMov);
      toast(modalMov === "sangria" ? "Sangria registrada." : "Suprimento registrado.");
      setModalMov(null);
      setValorMov(""); setObsMov("");
      carregar();
    } catch (e) {
      toast("Erro: " + e.message, "erro");
    }
  }

  if (loading) return <div style={styles.loading}>Carregando...</div>;

  // ── SEM SESSÃO ABERTA ─────────────────────────────────────────────────────
  if (!sessao) {
    return (
      <>
        <div style={styles.boxFechado}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Caixa fechado</div>
          <div style={{ color: colors.textSubtle, marginBottom: 16 }}>
            Abra o caixa para começar o dia.
          </div>
          <Button onClick={() => setModalAbrir(true)}>🔓 Abrir caixa</Button>
        </div>

        <Modal
          aberto={modalAbrir}
          onClose={() => setModalAbrir(false)}
          titulo="🔓 Abertura de caixa"
          maxWidth={400}
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalAbrir(false)}>Cancelar</Button>
              <Button onClick={confirmarAbertura}>Abrir caixa</Button>
            </>
          }
        >
          <Field label="Troco inicial (R$)">
            <Input autoFocus type="number" step="0.01" value={valorAbertura}
              onChange={(e) => setValorAbertura(e.target.value)}
              placeholder="Ex: 100,00"
              style={{ fontSize: 22, fontWeight: 700, textAlign: "center" }} />
          </Field>
          <Field label="Observação">
            <Input value={obsAbertura}
              onChange={(e) => setObsAbertura(e.target.value)}
              placeholder="Opcional" />
          </Field>
        </Modal>
      </>
    );
  }

  // ── SESSÃO ABERTA ─────────────────────────────────────────────────────────
  const sangrias    = movs.filter((m) => m.tipo === "sangria").reduce((s, m) => s + Number(m.valor), 0);
  const suprimentos = movs.filter((m) => m.tipo === "suprimento").reduce((s, m) => s + Number(m.valor), 0);

  return (
    <>
      {/* Status */}
      <div style={styles.statusBox}>
        <div>
          <div style={{ fontSize: 13, color: colors.brandText, fontWeight: 600 }}>Caixa aberto desde</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{fmtDataHora(sessao.abertura_em)}</div>
        </div>
        <Button variant="danger" onClick={() => setModalFechar(true)}>🔒 Fechar caixa</Button>
      </div>

      {/* Resumo de saldo */}
      <div style={styles.resumoGrid}>
        <Card titulo="Abertura"      valor={fmt(sessao.valor_abertura)} />
        <Card titulo="Suprimentos +" valor={fmt(suprimentos)} cor={colors.brand} />
        <Card titulo="Sangrias −"    valor={fmt(sangrias)}    cor={colors.danger} />
        <Card titulo="Saldo esperado" valor={fmt(esperado)}   cor={colors.brand} destaque />
      </div>

      {/* Ações */}
      <div style={styles.acoes}>
        <Button variant="warning" onClick={() => { setModalMov("sangria"); setValorMov(""); setObsMov(""); }}>
          📤 Sangria
        </Button>
        <Button variant="info" onClick={() => { setModalMov("suprimento"); setValorMov(""); setObsMov(""); }}>
          📥 Suprimento
        </Button>
      </div>

      {/* Movimentações */}
      <div style={styles.box}>
        <h3 style={{ margin: "0 0 12px" }}>📋 Movimentações</h3>
        {movs.length === 0 ? (
          <div style={styles.vazio}>Nenhuma movimentação ainda.</div>
        ) : (
          <div>
            {movs.map((m) => (
              <div key={m.id} style={styles.linha}>
                <div>
                  <Tag variant={m.tipo === "sangria" ? "warning" : "info"}>
                    {m.tipo === "sangria" ? "📤 Sangria" : "📥 Suprimento"}
                  </Tag>
                  {m.observacao && (
                    <span style={{ marginLeft: 10, color: colors.textSubtle }}>{m.observacao}</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: colors.textFaint }}>{fmtDataHora(m.created_at)}</span>
                  <b style={{
                    fontFamily: "monospace",
                    color: m.tipo === "sangria" ? colors.danger : colors.brand,
                  }}>
                    {m.tipo === "sangria" ? "−" : "+"}{fmt(m.valor)}
                  </b>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal sangria/suprimento */}
      <Modal
        aberto={!!modalMov}
        onClose={() => setModalMov(null)}
        titulo={modalMov === "sangria" ? "📤 Sangria" : "📥 Suprimento"}
        maxWidth={400}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalMov(null)}>Cancelar</Button>
            <Button onClick={confirmarMov}>Confirmar</Button>
          </>
        }
      >
        <Field label="Valor (R$)">
          <Input autoFocus type="number" step="0.01" value={valorMov}
            onChange={(e) => setValorMov(e.target.value)}
            style={{ fontSize: 22, fontWeight: 700, textAlign: "center" }} />
        </Field>
        <Field label="Observação">
          <Input value={obsMov}
            onChange={(e) => setObsMov(e.target.value)}
            placeholder={modalMov === "sangria" ? "Ex: pagar entregador" : "Ex: troco para nota grande"} />
        </Field>
      </Modal>

      {/* Modal fechar caixa */}
      <Modal
        aberto={modalFechar}
        onClose={() => setModalFechar(false)}
        titulo="🔒 Fechar caixa"
        maxWidth={420}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalFechar(false)}>Cancelar</Button>
            <Button onClick={confirmarFechamento}>Fechar caixa</Button>
          </>
        }
      >
        <div style={styles.esperadoBox}>
          <span style={{ color: colors.textSubtle, fontSize: 13 }}>Saldo esperado</span>
          <strong style={{ fontSize: 22, color: colors.brand }}>{fmt(esperado)}</strong>
        </div>
        <Field label="Valor contado (físico em caixa)">
          <Input autoFocus type="number" step="0.01" value={valorContado}
            onChange={(e) => setValorContado(e.target.value)}
            style={{ fontSize: 22, fontWeight: 700, textAlign: "center" }} />
        </Field>
        <Field label="Observação">
          <Input value={obsFechamento}
            onChange={(e) => setObsFechamento(e.target.value)}
            placeholder="Opcional" />
        </Field>
      </Modal>
    </>
  );
}

function Card({ titulo, valor, cor, destaque }) {
  return (
    <div style={{
      ...styles.cardSmall,
      ...(destaque ? styles.cardDestaque : null),
    }}>
      <div style={styles.cardTitulo}>{titulo}</div>
      <div style={{ ...styles.cardValor, color: cor || colors.text }}>{valor}</div>
    </div>
  );
}

const styles = {
  loading: { padding: 30, color: colors.textSubtle, textAlign: "center" },
  boxFechado: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: 40,
    textAlign: "center",
    boxShadow: shadow.card,
  },
  statusBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: colors.brandBgSoft,
    border: `1px solid ${colors.brandBorder}`,
    borderRadius: radius.xl,
    padding: "14px 20px",
    marginBottom: 16,
  },
  resumoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
    marginBottom: 16,
  },
  cardSmall: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: 14,
  },
  cardDestaque: {
    background: colors.brandBgSoft,
    border: `2px solid ${colors.brandBorder}`,
  },
  cardTitulo: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.textSubtle,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardValor: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "monospace",
  },
  acoes: { display: "flex", gap: 10, marginBottom: 16 },
  box: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: 18,
    boxShadow: shadow.card,
  },
  vazio: { color: colors.textSubtle, padding: 20, textAlign: "center", fontSize: 13 },
  linha: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: `1px solid ${colors.surfaceMute}`,
    fontSize: 13,
  },
  esperadoBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: colors.brandBgSoft,
    border: `1px solid ${colors.brandBorder}`,
    borderRadius: radius.md,
    padding: "10px 14px",
    marginBottom: 12,
  },
};
