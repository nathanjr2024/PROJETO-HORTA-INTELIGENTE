import { useSensorData } from '../../hooks/useSensorData.js'
import SensorCard from './SensorCard.jsx'
import HumidityChart from './HumidityChart.jsx'
import IrrigationStatus from './IrrigationStatus.jsx'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { status, dados, erro, historico, threshold, retentar } = useSensorData()

  // ── Estado: carregando ──────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className={styles.container} data-testid="estado-loading">
        <Header />
        <main className={styles.main}>
          <section className={styles.sensorGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`${styles.card} ${styles.skeleton}`} />
            ))}
          </section>
          <div className={`${styles.chartWrapper} ${styles.skeleton}`} style={{ height: 220 }} />
        </main>
      </div>
    )
  }

  // ── Estado: erro de fetch ───────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className={styles.container} data-testid="estado-erro">
        <Header />
        <main className={styles.main}>
          <div className={styles.erroBanner} role="alert">
            <p>Falha ao buscar dados dos sensores</p>
            <p className={styles.erroDetalhe}>{erro}</p>
            <button className={styles.btnRetentar} onClick={retentar}>
              Tentar novamente
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── Estado: sucesso ou parcial ─────────────────────────────────────────────
  const tempOffline = dados?.temperatura === null || dados?.temperatura === undefined
  const umidadeOffline = dados?.umidadeSolo === null || dados?.umidadeSolo === undefined
  const lumOffline = dados?.luminosidade === null || dados?.luminosidade === undefined

  return (
    <div className={styles.container} data-testid={status === 'partial' ? 'estado-parcial' : 'estado-sucesso'}>
      <Header ultimaAtualizacao={dados?.dataHora} />

      {status === 'partial' && (
        <div className={styles.alertaParcial} role="alert" data-testid="banner-parcial">
          Alguns sensores estão offline — dados incompletos
        </div>
      )}

      <main className={styles.main}>
        <section>
          <div className={styles.secaoHeader}>
            <h2 className={styles.secaoTitulo}>Dados em tempo real</h2>
            <span className={styles.ucTag}>UC-01</span>
          </div>

          <div className={styles.sensorGrid}>
            <SensorCard
              titulo="Umidade Solo"
              valor={dados?.umidadeSolo?.toFixed(1)}
              unidade="%"
              icone="💧"
              offline={umidadeOffline}
            />
            <SensorCard
              titulo="Temp. Ar"
              valor={dados?.temperatura}
              unidade="°C"
              icone="🌡"
              offline={tempOffline}
            />
            <SensorCard
              titulo="Luminosidade"
              valor={dados?.luminosidade}
              unidade="%"
              icone="☀"
              offline={lumOffline}
            />
            <SensorCard
              titulo="Última Atualização"
              valor={dados?.dataHora?.slice(11, 19)}
              unidade=""
              icone="🕐"
            />
          </div>
        </section>

        <section className={styles.secaoInferior}>
          <div className={styles.colunaGrafico}>
            <HumidityChart historico={historico} threshold={threshold} />
          </div>

          <div className={styles.colunaLateral}>
            <div className={styles.secaoHeader}>
              <h2 className={styles.secaoTitulo}>Status Irrigação</h2>
              <span className={styles.ucTag}>UC-02</span>
            </div>
            <IrrigationStatus
              statusIrrigacao={dados?.statusIrrigacao}
              modoManual={dados?.modoManual}
              alertaCritico={dados?.alertaCritico}
            />
          </div>
        </section>
      </main>
    </div>
  )
}

function Header({ ultimaAtualizacao }) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.titulo}>🌿 Horta Inteligente</h1>
        <p className={styles.subtitulo}>MONITORAMENTO &amp; CONTROLE · Release 1.0 MVP</p>
      </div>
      {ultimaAtualizacao && (
        <span className={styles.timestamp}>atualizado {ultimaAtualizacao.slice(11, 19)}</span>
      )}
    </header>
  )
}
