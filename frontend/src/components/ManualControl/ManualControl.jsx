import { useIrrigationControl } from '../../hooks/useIrrigationControl.js'
import styles from './ManualControl.module.css'

export default function ManualControl() {
  const { status, bombaStatus, log, actionStatus, erro, acionar, retentar } = useIrrigationControl()

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className={styles.container} data-testid="estado-loading">
        <Header />
        <main className={styles.main}>
          <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
          <div className={`${styles.skeleton} ${styles.skeletonBtn}`} />
          <div className={`${styles.skeleton} ${styles.skeletonTable}`} />
        </main>
      </div>
    )
  }

  // ── Erro de carga ────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className={styles.container} data-testid="estado-erro">
        <Header />
        <main className={styles.main}>
          <div className={styles.erroBanner} role="alert">
            <p>Falha ao carregar status da bomba</p>
            <p className={styles.erroDetalhe}>{erro}</p>
            <button className={styles.btnRetentar} onClick={retentar}>
              Tentar novamente
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── Sucesso ──────────────────────────────────────────────────────────────────
  const ligada = bombaStatus === 'LIGADO'

  return (
    <div className={styles.container} data-testid="estado-sucesso">
      <Header />

      <main className={styles.main}>
        {/* Card de status */}
        <section className={styles.statusCard} data-testid="status-bomba">
          <div className={styles.secaoHeader}>
            <h2 className={styles.secaoTitulo}>Status da Bomba</h2>
            <span className={styles.ucTag}>UC-03</span>
          </div>
          <div className={styles.statusRow}>
            <span className={`${styles.indicador} ${ligada ? styles.ligado : styles.desligado}`} />
            <span className={`${styles.statusLabel} ${ligada ? styles.statusLigado : ''}`}>
              {bombaStatus}
            </span>
          </div>
          <p className={styles.latenciaAviso}>⚠ Comandos chegam em até 30 segundos</p>
        </section>

        {/* Botão de acionamento */}
        <button
          className={`${styles.btnAcionar} ${ligada ? styles.btnDesligar : styles.btnLigar}`}
          disabled={actionStatus === 'sending'}
          onClick={() => acionar(!ligada)}
          data-testid="btn-toggle-bomba"
        >
          {actionStatus === 'sending'
            ? '⏳ Enviando comando…'
            : ligada
              ? '🔴 Desligar Irrigação'
              : '💧 Acionar Irrigação'}
        </button>

        {actionStatus === 'error' && (
          <div className={styles.acaoErroBanner} role="alert">
            Falha ao enviar comando — tente novamente
          </div>
        )}

        {/* Log de acionamentos */}
        <section>
          <h2 className={styles.secaoTituloLog}>Histórico de acionamentos</h2>
          {log.length === 0 ? (
            <p className={styles.vazio}>Nenhum acionamento registrado.</p>
          ) : (
            <div className={styles.tabelaWrapper} data-testid="log-irrigacoes">
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Tipo</th>
                    <th>Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((item) => (
                    <tr key={item.id}>
                      <td>{item.timestampInicio}</td>
                      <td>
                        <span className={`${styles.badge} ${item.acionadoPor === 'manual' ? styles.badgeManual : styles.badgeAuto}`}>
                          {item.acionadoPor}
                        </span>
                      </td>
                      <td>{item.duracao_min != null ? `${item.duracao_min} min` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function Header() {
  return (
    <header className={styles.header}>
      <h1 className={styles.titulo}>💧 Controle Manual</h1>
      <p className={styles.subtitulo}>ACIONAMENTO DA BOMBA · UC-03</p>
    </header>
  )
}
