import { memo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useHistoricalData } from '../../hooks/useHistoricalData.js'
import styles from './History.module.css'

const PERIODOS = [
  { id: '24h', label: 'Últimas 24h' },
  { id: '7d',  label: '7 dias' },
  { id: '30d', label: '30 dias' },
]

const THRESHOLD = 55

// Memoizados para evitar re-renders desnecessários ao trocar de período
const GraficoUmidade = memo(function GraficoUmidade({ dados }) {
  return (
    <div data-testid="grafico-umidade">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="hora" stroke="#475569" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis stroke="#475569" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }}
            formatter={(v) => [`${v}%`, 'Umidade']}
          />
          <ReferenceLine y={THRESHOLD} stroke="#fbbf24" strokeDasharray="5 5" label={{ value: `Limiar ${THRESHOLD}%`, fill: '#fbbf24', fontSize: 11 }} />
          <Line type="monotone" dataKey="umidade" stroke="#38bdf8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

const GraficoTemperatura = memo(function GraficoTemperatura({ dados }) {
  return (
    <div data-testid="grafico-temperatura">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="hora" stroke="#475569" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis stroke="#475569" tick={{ fontSize: 11 }} domain={['auto', 'auto']} unit="°C" />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }}
            formatter={(v) => [`${v}°C`, 'Temperatura']}
          />
          <Line type="monotone" dataKey="temperatura" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

export default function History() {
  const { status, periodo, setPeriodo, leituras, irrigacoes, erro, exportarCSV, retentar } = useHistoricalData()

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className={styles.container} data-testid="estado-loading">
        <Header periodo={periodo} setPeriodo={setPeriodo} exportarCSV={exportarCSV} loading />
        <main className={styles.main}>
          <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
          <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
          <div className={`${styles.skeleton} ${styles.skeletonTable}`} />
        </main>
      </div>
    )
  }

  // ── Erro ─────────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className={styles.container} data-testid="estado-erro">
        <Header periodo={periodo} setPeriodo={setPeriodo} exportarCSV={exportarCSV} />
        <main className={styles.main}>
          <div className={styles.erroBanner} role="alert">
            <p>Falha ao carregar histórico</p>
            <p className={styles.erroDetalhe}>{erro}</p>
            <button className={styles.btnRetentar} onClick={retentar}>Tentar novamente</button>
          </div>
        </main>
      </div>
    )
  }

  // ── Vazio ─────────────────────────────────────────────────────────────────────
  if (status === 'empty') {
    return (
      <div className={styles.container} data-testid="estado-vazio">
        <Header periodo={periodo} setPeriodo={setPeriodo} exportarCSV={exportarCSV} />
        <main className={styles.main}>
          <div className={styles.vazioBox}>
            <span className={styles.vazioIcon}>📭</span>
            <p>Sem dados para o período selecionado</p>
            <p className={styles.vazioHint}>Tente selecionar um intervalo diferente.</p>
          </div>
        </main>
      </div>
    )
  }

  // ── Sucesso ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container} data-testid="estado-sucesso">
      <Header periodo={periodo} setPeriodo={setPeriodo} exportarCSV={exportarCSV} />

      <main className={styles.main}>
        <section className={styles.secao}>
          <div className={styles.secaoHeader}>
            <h2 className={styles.secaoTitulo}>Umidade do Solo</h2>
            <span className={styles.ucTag}>UC-05</span>
          </div>
          <GraficoUmidade dados={leituras} />
        </section>

        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>Temperatura do Ar</h2>
          <GraficoTemperatura dados={leituras} />
        </section>

        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>Eventos de Irrigação</h2>
          {irrigacoes.length === 0 ? (
            <p className={styles.vazio}>Sem eventos no período.</p>
          ) : (
            <div className={styles.tabelaWrapper} data-testid="tabela-irrigacoes">
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th>Início</th>
                    <th>Tipo</th>
                    <th>Duração</th>
                    <th>Solo antes</th>
                    <th>Solo depois</th>
                  </tr>
                </thead>
                <tbody>
                  {irrigacoes.map((ev) => (
                    <tr key={ev.id}>
                      <td>{ev.timestampInicio}</td>
                      <td>
                        <span className={`${styles.badge} ${ev.acionadoPor === 'manual' ? styles.badgeManual : styles.badgeAuto}`}>
                          {ev.acionadoPor}
                        </span>
                      </td>
                      <td>{ev.duracao_min} min</td>
                      <td>{ev.umidadeSoloAntes}%</td>
                      <td>{ev.umidadeSoloDepois}%</td>
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

function Header({ periodo, setPeriodo, exportarCSV, loading }) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.titulo}>📊 Histórico</h1>
        <p className={styles.subtitulo}>DADOS HISTÓRICOS · UC-05</p>
      </div>
      <div className={styles.headerAcoes}>
        <div className={styles.seletorPeriodo} data-testid="selector-periodo">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              className={`${styles.btnPeriodo} ${periodo === p.id ? styles.periodoAtivo : ''}`}
              onClick={() => setPeriodo(p.id)}
              disabled={loading}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          className={styles.btnExportar}
          onClick={exportarCSV}
          disabled={loading}
          data-testid="btn-exportar-csv"
        >
          ⬇ CSV
        </button>
      </div>
    </header>
  )
}
