import styles from './Dashboard.module.css'

export default function SensorCard({ titulo, valor, unidade, icone, offline }) {
  if (offline) {
    return (
      <div className={`${styles.card} ${styles.cardOffline}`} data-testid="sensor-card-offline">
        <span className={styles.cardIcon}>{icone}</span>
        <div>
          <p className={styles.cardTitulo}>{titulo}</p>
          <p className={styles.cardValor}>---</p>
          <span className={styles.badgeOffline}>sensor offline</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card} data-testid="sensor-card">
      <span className={styles.cardIcon}>{icone}</span>
      <div>
        <p className={styles.cardTitulo}>{titulo}</p>
        <p className={styles.cardValor}>
          {valor !== null && valor !== undefined ? `${valor}${unidade}` : '---'}
        </p>
      </div>
    </div>
  )
}
