import { useState, useEffect } from 'react'
import { useSettings } from '../../hooks/useSettings.js'
import styles from './Settings.module.css'

const OPCOES_POLLING = [
  { label: '30 segundos', value: 30 },
  { label: '1 minuto',    value: 60 },
  { label: '5 minutos',   value: 300 },
]

export default function Settings() {
  const { status, config, saveStatus, saveErro, erro, salvar, retentar } = useSettings()

  const [threshold, setThreshold] = useState(55)
  const [polling, setPolling] = useState(30)

  // Sincroniza com dados carregados
  useEffect(() => {
    if (config) {
      setThreshold(config.threshold)
      setPolling(config.pollingInterval)
    }
  }, [config])

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className={styles.container} data-testid="estado-loading">
        <Header />
        <main className={styles.main}>
          <div className={`${styles.skeleton} ${styles.skeletonSlider}`} />
          <div className={`${styles.skeleton} ${styles.skeletonRadio}`} />
          <div className={`${styles.skeleton} ${styles.skeletonBtn}`} />
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
            <p>Falha ao carregar configurações</p>
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
  function handleSalvar(e) {
    e.preventDefault()
    salvar({ threshold: Number(threshold), pollingInterval: Number(polling) })
  }

  return (
    <div className={styles.container} data-testid="estado-sucesso">
      <Header />

      {saveStatus === 'saved' && (
        <div className={styles.bannerSalvo} role="status" data-testid="banner-salvo">
          ✓ Configurações salvas com sucesso
        </div>
      )}

      {saveStatus === 'error' && saveErro && (
        <div className={styles.bannerErroSalvo} role="alert" data-testid="banner-erro-salvo">
          {saveErro}
        </div>
      )}

      <main className={styles.main}>
        <form onSubmit={handleSalvar} className={styles.form}>

          {/* Threshold de umidade */}
          <section className={styles.secao}>
            <div className={styles.secaoHeader}>
              <h2 className={styles.secaoTitulo}>Limiar de Umidade do Solo</h2>
              <span className={styles.ucTag}>UC-04</span>
            </div>
            <p className={styles.descricao}>
              Irrigação automática é acionada quando a umidade cai abaixo deste valor.
            </p>
            <div className={styles.sliderRow}>
              <input
                type="range"
                min={10}
                max={90}
                step={1}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className={styles.slider}
                data-testid="threshold-slider"
                aria-label="Threshold de umidade do solo"
              />
              <span className={styles.sliderValor} data-testid="threshold-valor">{threshold}%</span>
            </div>
            <div className={styles.sliderLimites}>
              <span>10%</span>
              <span>90%</span>
            </div>
          </section>

          {/* Intervalo de polling */}
          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>Frequência de Atualização</h2>
            <div className={styles.radioGroup} role="group" aria-label="Frequência de atualização">
              {OPCOES_POLLING.map((op) => (
                <label key={op.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="polling"
                    value={op.value}
                    checked={polling === op.value}
                    onChange={() => setPolling(op.value)}
                    data-testid={`radio-polling-${op.value}`}
                  />
                  {op.label}
                </label>
              ))}
            </div>
          </section>

          <button
            type="submit"
            className={styles.btnSalvar}
            disabled={saveStatus === 'saving'}
            data-testid="btn-salvar-config"
          >
            {saveStatus === 'saving' ? 'Salvando…' : 'Salvar configurações'}
          </button>
        </form>
      </main>
    </div>
  )
}

function Header() {
  return (
    <header className={styles.header}>
      <h1 className={styles.titulo}>⚙️ Configurações</h1>
      <p className={styles.subtitulo}>PARÂMETROS DO SISTEMA · UC-04</p>
    </header>
  )
}
