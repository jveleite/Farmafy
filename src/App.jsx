import { useState } from 'react'

import Produtos from './components/Produtos'
import Clientes from './components/Clientes'
import PDV from './components/pdv/PDV'
import Financeiro from './components/financeiro/Financeiro'
import Relatorios from './components/relatorios/Relatorios'
import HistoricoVendas from './components/HistoricoVendas'
import TelaAuth from './components/auth/TelaAuth'

import { useAuth } from './ui/Auth'
import { logout } from './services/auth.service'
import { useToast } from './ui/Toast'

export default function App() {
  const { sessao, profile, loading } = useAuth()
  const toast = useToast()
  const [tela, setTela] = useState('pdv')

  // ── Boot inicial ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.boot}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💊</div>
        <div>Carregando...</div>
      </div>
    )
  }

  // ── Não autenticado → tela de login/signup ────────────────────────
  if (!sessao) {
    return <TelaAuth />
  }

  // ── Autenticado mas sem profile (pode acontecer se o setup_nova_farmacia
  //    não rodou). Mostra mensagem com saída. ─────────────────────────
  if (!profile) {
    return (
      <div style={styles.boot}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
        <div>Sua conta existe mas não tem farmácia vinculada.</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 8, textAlign: 'center', maxWidth: 360 }}>
          Isso geralmente acontece se o cadastro foi interrompido. Faça logout
          e cadastre-se novamente, OU vincule via SQL no Supabase.
        </div>
        <button onClick={() => logout()} style={styles.btnLogout}>Sair</button>
      </div>
    )
  }

  async function sair() {
    try {
      await logout()
      toast('Até logo!')
    } catch (e) {
      toast('Erro ao sair: ' + e.message, 'erro')
    }
  }

  function renderTela() {
    switch (tela) {
      case 'produtos':   return <Produtos />
      case 'clientes':   return <Clientes />
      case 'pdv':        return <PDV />
      case 'historico':  return <HistoricoVendas />
      case 'financeiro': return <Financeiro />
      case 'relatorios': return <Relatorios />
      default:           return <PDV />
    }
  }

  return (
    <div style={styles.layout}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logo}>💊 Farmafy</div>
          <div style={styles.farmaciaNome}>{profile.farmaciaNome}</div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <ItemMenu icon="🛒" label="PDV"                ativo={tela==='pdv'}        onClick={() => setTela('pdv')} />
            <ItemMenu icon="🧾" label="Histórico de Vendas" ativo={tela==='historico'}  onClick={() => setTela('historico')} />
            <ItemMenu icon="📦" label="Produtos"           ativo={tela==='produtos'}   onClick={() => setTela('produtos')} />
            <ItemMenu icon="👥" label="Clientes"           ativo={tela==='clientes'}   onClick={() => setTela('clientes')} />
            <ItemMenu icon="💰" label="Financeiro"         ativo={tela==='financeiro'} onClick={() => setTela('financeiro')} />
            <ItemMenu icon="📊" label="Relatórios"         ativo={tela==='relatorios'} onClick={() => setTela('relatorios')} />
          </nav>
        </div>

        {/* RODAPÉ DA SIDEBAR — usuário + logout */}
        <div style={styles.sidebarRodape}>
          <div style={styles.userInfo}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{profile.nome || profile.email}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{profile.email}</div>
          </div>
          <button onClick={sair} style={styles.btnSair}>↩️ Sair</button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main style={styles.content}>
        {renderTela()}
      </main>
    </div>
  )
}

function ItemMenu({ icon, label, ativo, onClick }) {
  return (
    <button onClick={onClick}
      style={ativo ? styles.menuAtivo : styles.menuBtn}>
      <span style={{ marginRight: 8 }}>{icon}</span>{label}
    </button>
  )
}

const styles = {
  boot: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    background: '#f1f5f9',
    fontFamily: 'system-ui, sans-serif',
  },
  btnLogout: {
    marginTop: 16,
    padding: '8px 16px',
    border: 'none',
    background: '#0d7a45',
    color: '#fff',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },

  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9',
    fontFamily: 'system-ui, sans-serif',
  },

  sidebar: {
    width: 240,
    background: '#0f172a',
    color: '#fff',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100vh',
  },

  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  farmaciaNome: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 500,
  },

  menuBtn: {
    background: 'transparent',
    color: '#fff',
    border: 'none',
    padding: 12,
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 14,
    transition: '.2s',
    fontFamily: 'inherit',
  },
  menuAtivo: {
    background: '#0d7a45',
    color: '#fff',
    border: 'none',
    padding: 12,
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'inherit',
  },

  sidebarRodape: {
    borderTop: '1px solid #1e293b',
    paddingTop: 14,
    marginTop: 14,
  },
  userInfo: {
    marginBottom: 10,
  },
  btnSair: {
    width: '100%',
    background: 'transparent',
    border: '1px solid #334155',
    color: '#cbd5e1',
    padding: '8px 0',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
  },

  content: {
    flex: 1,
    padding: 20,
    overflowY: 'auto',
  },
}
