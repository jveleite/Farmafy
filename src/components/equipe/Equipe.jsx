import { useEffect, useState } from "react";
import {
  listarMembros,
  listarConvitesPendentes,
  convidarUsuario,
  cancelarConvite,
} from "../../services/equipe.service";
import { useToast } from "../../ui/Toast";
import { useAuth } from "../../ui/Auth";
import { fmtData } from "../../lib/format";
import { colors, radius, shadow } from "../../styles/tokens";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Field from "../../ui/Field";
import Tag from "../../ui/Tag";
import Modal from "../../ui/Modal";

const ROLES = [
  { value: "farmaceutico", label: "Farmacêutico" },
  { value: "atendente",    label: "Atendente" },
];

export default function Equipe() {
  const toast = useToast();
  const { profile } = useAuth();

  const [membros, setMembros]   = useState([]);
  const [convites, setConvites] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [modal, setModal]       = useState(false);
  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState("atendente");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([listarMembros(), listarConvitesPendentes()]);
      setMembros(m);
      setConvites(c);
    } catch (e) {
      toast("Erro ao carregar equipe: " + e.message, "erro");
    } finally {
      setLoading(false);
    }
  }

  async function salvarConvite() {
    if (!email.trim()) return toast("Informe o email.", "erro");
    if (!email.includes("@")) return toast("Email inválido.", "erro");
    setSalvando(true);
    try {
      const res = await convidarUsuario(email, role);
      toast(res.emailEnviado
        ? `📧 Convite enviado para ${email}`
        : `Convite criado. Email não saiu — avise ${email} manualmente.`);
      setModal(false);
      setEmail("");
      setRole("atendente");
      carregar();
    } catch (e) {
      const msg = (e.message || "").includes("duplicate")
        ? "Já existe convite pra esse email."
        : "Erro: " + e.message;
      toast(msg, "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar(c) {
    if (!confirm(`Cancelar convite para ${c.email}?`)) return;
    try {
      await cancelarConvite(c.id);
      toast("Convite cancelado.");
      carregar();
    } catch (e) {
      toast("Erro: " + e.message, "erro");
    }
  }

  const isOwner = profile?.role === "owner";

  return (
    <div>
      <div style={styles.cabecalho}>
        <h2 style={{ margin: 0 }}>👥 Equipe</h2>
        {isOwner && (
          <Button onClick={() => { setEmail(""); setRole("atendente"); setModal(true); }}>
            + Convidar
          </Button>
        )}
      </div>

      {loading ? (
        <div style={styles.vazio}>Carregando...</div>
      ) : (
        <>
          {/* MEMBROS */}
          <div style={styles.bloco}>
            <h3 style={styles.tituloBloco}>Membros ({membros.length})</h3>
            {membros.length === 0 ? (
              <div style={styles.vazio}>Nenhum membro além de você.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Nome", "Função", "Entrou em"].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {membros.map((m) => (
                      <tr key={m.id}>
                        <td style={styles.td}>
                          <b>{m.nome || "—"}</b>
                          {m.id === profile.id && (
                            <span style={{ marginLeft: 8, fontSize: 11, color: colors.textFaint }}>
                              (você)
                            </span>
                          )}
                        </td>
                        <td style={styles.td}><RoleTag role={m.role} /></td>
                        <td style={{ ...styles.td, color: colors.textSubtle }}>
                          {fmtData(m.criadoEm)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CONVITES PENDENTES */}
          {isOwner && (
            <div style={{ ...styles.bloco, marginTop: 18 }}>
              <h3 style={styles.tituloBloco}>Convites pendentes ({convites.length})</h3>
              {convites.length === 0 ? (
                <div style={styles.vazio}>Nenhum convite pendente.</div>
              ) : (
                <>
                  <div style={styles.dica}>
                    💡 Compartilhe o link/URL do FarmaFy com a pessoa e peça que ela
                    se cadastre usando este email. Ao criar a conta, ela entra
                    direto na sua farmácia com a função escolhida.
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          {["Email", "Função", "Enviado em", ""].map((h) => (
                            <th key={h} style={styles.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {convites.map((c) => (
                          <tr key={c.id}>
                            <td style={styles.td}><b>{c.email}</b></td>
                            <td style={styles.td}><RoleTag role={c.role} /></td>
                            <td style={{ ...styles.td, color: colors.textSubtle }}>
                              {fmtData(c.created_at)}
                            </td>
                            <td style={styles.td}>
                              <Button variant="danger" size="sm" onClick={() => cancelar(c)}>
                                Cancelar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL CONVIDAR */}
      <Modal
        aberto={modal}
        onClose={() => setModal(false)}
        titulo="✉️ Convidar pra equipe"
        maxWidth={420}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={salvarConvite} disabled={salvando}>
              {salvando ? "Salvando..." : "Convidar"}
            </Button>
          </>
        }
      >
        <Field label="Email da pessoa">
          <Input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="farmaceutico@exemplo.com"
          />
        </Field>
        <Field label="Função">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={styles.select}
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
        <div style={styles.dica}>
          Avise a pessoa pra acessar o FarmaFy e cadastrar com este email.
          O sistema reconhece o convite automaticamente.
        </div>
      </Modal>
    </div>
  );
}

function RoleTag({ role }) {
  if (role === "owner")        return <Tag variant="info">Dono</Tag>;
  if (role === "farmaceutico") return <Tag variant="success">Farmacêutico</Tag>;
  return <Tag>Atendente</Tag>;
}

const styles = {
  cabecalho: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  bloco: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    overflow: "hidden",
    boxShadow: shadow.card,
  },
  tituloBloco: {
    margin: 0,
    padding: "12px 16px",
    fontSize: 14,
    borderBottom: `1px solid ${colors.border}`,
    background: colors.surfaceAlt,
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
  vazio: { padding: 24, color: colors.textSubtle, textAlign: "center", fontSize: 13 },
  dica: {
    background: colors.infoBgSoft,
    border: `1px solid ${colors.infoBorder}`,
    color: colors.info,
    borderRadius: radius.md,
    padding: "10px 14px",
    fontSize: 12.5,
    margin: "12px 16px",
  },
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
