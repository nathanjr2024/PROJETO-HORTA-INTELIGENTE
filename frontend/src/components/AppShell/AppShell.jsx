import { useState } from 'react'
import Dashboard from '../Dashboard/Dashboard'
import styles from './AppShell.module.css'

const TELAS = [
  { id: 'dashboard',      label: 'Dashboard',  emoji: '🌱', testId: 'nav-dashboard' },
  { id: 'controle',       label: 'Controle',   emoji: '💧', testId: 'nav-controle' },
  { id: 'configuracoes',  label: 'Config',     emoji: '⚙️',  testId: 'nav-configuracoes' },
  { id: 'historico',      label: 'Histórico',  emoji: '📊', testId: 'nav-historico' },
]

function Placeholder({ nome }) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderIcon}>🚧</span>
      <p>Tela <strong>{nome}</strong> em construção…</p>
    </div>
  )
}

export default function AppShell({ ManualControl, Settings, History }) {
  const [telaAtiva, setTelaAtiva] = useState('dashboard')

  function renderTela() {
    switch (telaAtiva) {
      case 'dashboard':     return <Dashboard />
      case 'controle':      return ManualControl ? <ManualControl /> : <Placeholder nome="Controle Manual" />
      case 'configuracoes': return Settings      ? <Settings />      : <Placeholder nome="Configurações" />
      case 'historico':     return History       ? <History />       : <Placeholder nome="Histórico" />
      default:              return <Dashboard />
    }
  }

  return (
    <div className={styles.shell}>
      <main className={styles.conteudo}>
        {renderTela()}
      </main>

      <nav className={styles.navBar} role="navigation" aria-label="Navegação principal">
        {TELAS.map(tela => (
          <button
            key={tela.id}
            className={`${styles.navItem} ${telaAtiva === tela.id ? styles.ativo : ''}`}
            onClick={() => setTelaAtiva(tela.id)}
            data-testid={tela.testId}
            aria-current={telaAtiva === tela.id ? 'page' : undefined}
          >
            <span className={styles.navEmoji} aria-hidden="true">{tela.emoji}</span>
            <span className={styles.navLabel}>{tela.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
