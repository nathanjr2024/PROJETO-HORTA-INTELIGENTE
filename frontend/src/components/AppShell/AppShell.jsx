import { useState } from 'react'
import Dashboard from '../Dashboard/Dashboard'
import ManualControl from '../ManualControl/ManualControl'
import Settings from '../Settings/Settings'
import History from '../History/History'
import styles from './AppShell.module.css'

const TELAS = [
  { id: 'dashboard',      label: 'Dashboard',  emoji: '🌱', testId: 'nav-dashboard' },
  { id: 'controle',       label: 'Controle',   emoji: '💧', testId: 'nav-controle' },
  { id: 'configuracoes',  label: 'Config',     emoji: '⚙️',  testId: 'nav-configuracoes' },
  { id: 'historico',      label: 'Histórico',  emoji: '📊', testId: 'nav-historico' },
]

export default function AppShell() {
  const [telaAtiva, setTelaAtiva] = useState('dashboard')

  function renderTela() {
    switch (telaAtiva) {
      case 'dashboard':     return <Dashboard />
      case 'controle':      return <ManualControl />
      case 'configuracoes': return <Settings />
      case 'historico':     return <History />
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
