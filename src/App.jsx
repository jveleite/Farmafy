import { useState } from 'react'

import Produtos from './components/Produtos'
import Clientes from './components/Clientes'
import PDV from './components/pdv/PDV'
import Financeiro from './components/financeiro/Financeiro'
import Relatorios from './components/relatorios/Relatorios'
import HistoricoVendas from './components/HistoricoVendas'

export default function App() {

  const [tela, setTela] = useState('pdv')

  function renderTela() {
    switch (tela) {

      case 'produtos':
        return <Produtos />

      case 'clientes':
        return <Clientes />

      case 'pdv':
        return <PDV />

      case 'historico':
        return <HistoricoVendas />

      case 'financeiro':
        return <Financeiro />

      case 'relatorios':
        return <Relatorios />

      default:
        return <PDV />
    }
  }

  return (
    <div style={styles.layout}>

      {/* MENU */}
      <aside style={styles.sidebar}>

        <div style={styles.logo}>
          💊 Farmafy
        </div>

        <button
          style={tela === 'pdv'
            ? styles.menuAtivo
            : styles.menuBtn}
          onClick={() => setTela('pdv')}
        >
          🛒 PDV
        </button>

        <button
          style={tela === 'historico'
            ? styles.menuAtivo
            : styles.menuBtn}
          onClick={() => setTela('historico')}
        >
          🧾 Histórico de Vendas
        </button>

        <button
          style={tela === 'produtos'
            ? styles.menuAtivo
            : styles.menuBtn}
          onClick={() => setTela('produtos')}
        >
          📦 Produtos
        </button>

        <button
          style={tela === 'clientes'
            ? styles.menuAtivo
            : styles.menuBtn}
          onClick={() => setTela('clientes')}
        >
          👥 Clientes
        </button>

        <button
          style={tela === 'financeiro'
            ? styles.menuAtivo
            : styles.menuBtn}
          onClick={() => setTela('financeiro')}
        >
          💰 Financeiro
        </button>

        <button
          style={tela === 'relatorios'
            ? styles.menuAtivo
            : styles.menuBtn}
          onClick={() => setTela('relatorios')}
        >
          📊 Relatórios
        </button>

      </aside>

      {/* CONTEÚDO */}
      <main style={styles.content}>
        {renderTela()}
      </main>

    </div>
  )
}

const styles = {

  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9',
    fontFamily: 'Arial'
  },

  sidebar: {
    width: 240,
    background: '#0f172a',
    color: '#fff',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },

  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30
  },

  menuBtn: {
    background: 'transparent',
    color: '#fff',
    border: 'none',
    padding: 14,
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 15,
    transition: '.2s'
  },

  menuAtivo: {
    background: '#0d7a45',
    color: '#fff',
    border: 'none',
    padding: 14,
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 15,
    fontWeight: 'bold'
  },

  content: {
    flex: 1,
    padding: 20,
    overflowY: 'auto'
  }

}