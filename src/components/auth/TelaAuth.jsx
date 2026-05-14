import { useState } from "react";
import { login, signup } from "../../services/auth.service";
import { useAuth } from "../../ui/Auth";
import { useToast } from "../../ui/Toast";
import { colors, radius, shadow } from "../../styles/tokens";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Field from "../../ui/Field";
import LogoCompleto from "../../ui/LogoCompleto";

/**
 * Tela única de Login / Signup. Modo controlado por `aba`.
 * Renderizada quando o usuário não está autenticado.
 */
export default function TelaAuth() {
  const [aba, setAba] = useState("login");
  const toast = useToast();
  const { recarregarProfile } = useAuth();

  // Form
  const [email, setEmail]                 = useState("");
  const [senha, setSenha]                 = useState("");
  const [nomeUser, setNomeUser]           = useState("");
  const [nomeFarmacia, setNomeFarmacia]   = useState("");
  const [carregando, setCarregando]       = useState(false);

  async function entrar(e) {
    e.preventDefault();
    if (!email || !senha) return toast("Preencha email e senha.", "erro");
    setCarregando(true);
    try {
      await login(email, senha);
      toast("Bem-vindo!");
      // AuthProvider vai detectar a sessão nova via onAuthStateChange.
    } catch (err) {
      toast("Login falhou: " + (err.message || "tente de novo"), "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function cadastrar(e) {
    e.preventDefault();
    if (!email || !senha || !nomeUser) {
      return toast("Preencha email, senha e nome.", "erro");
    }
    if (!nomeFarmacia.trim()) {
      return toast("Informe o nome da farmácia. Se foi convidado, use o link do email de convite.", "erro");
    }
    if (senha.length < 6) {
      return toast("Senha tem que ter pelo menos 6 caracteres.", "erro");
    }
    setCarregando(true);
    try {
      const res = await signup({ email, senha, nomeUser, nomeFarmacia });
      if (res.precisaConfirmarEmail) {
        toast("Confirme seu email pra continuar.", "ok");
        setAba("login");
      } else if (res.veioDeConvite) {
        toast(`Bem-vindo à ${res.farmaciaNome}!`);
        await recarregarProfile();
      } else {
        toast(`Farmácia "${res.farmaciaNome}" criada!`);
        await recarregarProfile();
      }
    } catch (err) {
      const msg = (err.message || "").includes("nome da farmácia")
        ? "Você precisa informar o nome da farmácia (ou pedir um convite)."
        : "Cadastro falhou: " + (err.message || "tente de novo");
      toast(msg, "erro");
    } finally {
      setCarregando(false);
    }
  }

  const isLogin = aba === "login";

  return (
    <div style={styles.tela}>
      <div style={styles.card}>
        <div style={styles.cabecalho}>
          <LogoCompleto size={92} />
          <div style={styles.subtitulo}>
            {isLogin ? "Entre na sua farmácia" : "Crie sua conta"}
          </div>
        </div>

        <div style={styles.tabs}>
          <Aba label="Entrar"   ativa={isLogin}   onClick={() => setAba("login")} />
          <Aba label="Cadastrar" ativa={!isLogin} onClick={() => setAba("signup")} />
        </div>

        <form onSubmit={isLogin ? entrar : cadastrar}>
          {!isLogin && (
            <>
              <Field label="Seu nome">
                <Input value={nomeUser} onChange={(e) => setNomeUser(e.target.value)}
                  placeholder="João Victor" />
              </Field>
              <Field label="Nome da farmácia">
                <Input value={nomeFarmacia} onChange={(e) => setNomeFarmacia(e.target.value)}
                  placeholder="Ex: Farmácia Central" />
              </Field>
            </>
          )}

          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com" autoComplete="email" autoFocus={isLogin} />
          </Field>

          <Field label="Senha">
            <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"} />
          </Field>

          <Button
            type="submit"
            disabled={carregando}
            style={{ width: "100%", justifyContent: "center", padding: 14, marginTop: 8 }}
          >
            {carregando
              ? "Aguarde..."
              : isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div style={styles.rodape}>
          {isLogin
            ? <>Não tem conta? <button style={styles.link} onClick={() => setAba("signup")}>Cadastre-se</button></>
            : <>Já tem conta? <button style={styles.link} onClick={() => setAba("login")}>Entrar</button></>
          }
        </div>
      </div>
    </div>
  );
}

function Aba({ label, ativa, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 0",
        background: "transparent",
        border: "none",
        borderBottom: `3px solid ${ativa ? colors.brand : "transparent"}`,
        color: ativa ? colors.brand : colors.textSubtle,
        fontWeight: ativa ? 700 : 500,
        fontSize: 14,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

const styles = {
  tela: {
    minHeight: "100vh",
    background: colors.surfaceMute,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    background: colors.surface,
    borderRadius: radius.xl,
    padding: 32,
    width: "100%",
    maxWidth: 380,
    boxShadow: shadow.modal,
  },
  cabecalho: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 26,
  },
  subtitulo: {
    fontSize: 14,
    color: colors.textSubtle,
    marginTop: 14,
  },
  tabs: {
    display: "flex",
    gap: 4,
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: 22,
  },
  rodape: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 13,
    color: colors.textSubtle,
  },
  link: {
    background: "none",
    border: "none",
    color: colors.brand,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    padding: 0,
  },
};
