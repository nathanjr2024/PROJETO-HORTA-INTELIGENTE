import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import styles from './Dashboard.module.css'

export default function HumidityChart({ historico, threshold }) {
  return (
    <div className={styles.chartWrapper} data-testid="humidity-chart">
      <h3 className={styles.chartTitulo}>Histórico de Umidade do Solo — Últimas 12h</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={historico} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis dataKey="hora" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#4ade80' }}
            formatter={(v) => [`${v}%`, 'Umidade Solo']}
          />
          {threshold && (
            <ReferenceLine
              y={threshold}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: `Threshold ${threshold}%`, fill: '#f59e0b', fontSize: 11 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="umidade"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ r: 3, fill: '#4ade80' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
