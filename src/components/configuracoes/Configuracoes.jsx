import { useEffect, useState } from "react";
import { carregarMinhaFarmacia, atualizarMinhaFarmacia } from "../../services/farmacia.service";
import { useToast } from "../../ui/Toast";
import { useAuth } from "../../ui/Auth";
import { colors, radius, shadow } from "../../styles/tokens";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Field from "../../ui/Field";

const FORM_VAZIO = {
  nome: "", cnpj: "", cidade: "", uf: "",
  endereco: "", telefone: "", chave_pix: "",
};

export default function Configuracoes() {
  const toast = useToast();
  const { recarregarProfile } = useAuth();
  const [farmacia, setFarmacia] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      const f = await carregarMinhaFarmacia();
      setFarmacia(f);
      if (f) {
        setForm({
          nome: f.nome || "",
          cnpj: f.cnpj || "",
          cidade: f.cidade || "",
          uf: f.uf || "",
          endereco: f.endereco || "",
          telefone: f.telefone || "",
          chave_pix: f.chave_pix || "",
        });
      }
    } catch (e) {
      toast("Erro ao carregar: " + e.message, "erro");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) return toast("Nome da farmácia é obrigatório.", "erro");
    setSalvando(true);
    try {
      await atualizarMinhaFarmacia(farmacia.id, {
        nome: form.nome.trim(),
        cnpj: form.cnpj.trim() || null,
        cidade: form.cidade.trim() || null,
        uf: form.uf.trim().toUpperCase() || null,
        endereco: form.endereco.trim() || null,
        telefone: form.telefone.trim() || null,
        chave_pix: form.chave_pix.trim() || null,
      });
      toast("Configurações salvas!");
      // Recarrega o profile pra a sidebar e ModalPagamento pegarem o nome/PIX novos
      recarregarProfile();
      carregar();
    } catch (e) {
      toast("Erro ao salvar: " + e.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <div style={styles.loading}>Carregando...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>⚙️ Configurações da farmácia</h2>

      <form onSubmit={salvar} style={styles.card}>
        <Field label="Nome da farmácia *">
          <Input value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Farmácia Central" />
        </Field>

        <div style={styles.row2}>
          <Field label="CNPJ">
            <Input value={form.cnpj}
              onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
              placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="Telefone">
            <Input value={form.telefone}
              onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              placeholder="(88) 99999-9999" />
          </Field>
        </div>

        <Field label="Endereço">
          <Input value={form.endereco}
            onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
            placeholder="Rua, número, bairro" />
        </Field>

        <div style={styles.row2}>
          <Field label="Cidade">
            <Input value={form.cidade}
              onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
              placeholder="Quixadá" />
          </Field>
          <Field label="UF">
            <Input value={form.uf} maxLength={2}
              onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value }))}
              placeholder="CE" />
          </Field>
        </div>

        <div style={styles.bloco}>
          <div style={styles.blocoTitulo}>💳 Pagamento</div>
          <Field label="Chave PIX (usada no PDV)">
            <Input value={form.chave_pix}
              onChange={(e) => setForm((f) => ({ ...f, chave_pix: e.target.value }))}
              placeholder="email, CPF, telefone ou chave aleatória" />
          </Field>
          <div style={styles.dica}>
            Antes essa chave ficava no arquivo .env. Agora ela vive no banco e
            cada farmácia tem a própria.
          </div>
        </div>

        <div style={{ marginTop: 18, textAlign: "right" }}>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "💾 Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  loading: { padding: 30, color: colors.textSubtle, textAlign: "center" },
  card: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: 22,
    boxShadow: shadow.card,
    maxWidth: 700,
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  bloco: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: `1px solid ${colors.border}`,
  },
  blocoTitulo: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: ".3px",
    marginBottom: 10,
  },
  dica: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: -4,
  },
};
