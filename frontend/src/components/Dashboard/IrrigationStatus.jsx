import styles from './Dashboard.module.css'

export default function IrrigationStatus({ statusIrrigacao, modoManual, alertaCritico }) {
  const ligada = statusIrrigacao === 'LIGADO'

  return (
    <div className={`${styles.card} ${ligada ? styles.cardIrrigando : ''}`} data-testid="irrigation-status">
      <div className={styles.irrigacaoHeader}>
        <span className={`${styles.bombaIndicador} ${ligada ? styles.bombaLigada : styles.bombaDesligada}`} />
        <span className={styles.bombaLabel}>
          BOMBA: {statusIrrigacao ?? '---'}
        </span>
      </div>
      <p className={styles.irrigacaoModo}>
        Modo {modoManual ? 'MANUAL' : 'AUTOMÁTICO'}
      </p>
      {alertaCritico && (
        <p className={styles.alertaCritico} data-testid="alerta-critico">
          ⚠ Umidade crítica — alface em risco
        </p>
      )}
    </div>
  )
}
