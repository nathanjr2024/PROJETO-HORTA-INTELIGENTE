import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchHistorico, fetchIrrigacoesHistorico } from '../services/mockApi.js'

export function useHistoricalData() {
  const [status, setStatus] = useState('loading')   // 'loading' | 'success' | 'error' | 'empty'
  const [periodo, setPeriodo] = useState('24h')
  const [leituras, setLeituras] = useState([])
  const [irrigacoes, setIrrigacoes] = useState([])
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setStatus('loading')
    setErro(null)
    try {
      const [l, i] = await Promise.all([fetchHistorico(periodo), fetchIrrigacoesHistorico()])
      setLeituras(l)
      setIrrigacoes(i)
      setStatus(l.length === 0 ? 'empty' : 'success')
    } catch (err) {
      console.error({ event: 'fetch_failed', screen: 'history', uc: 'UC-05', error: err.message })
      setErro(err.message)
      setStatus('error')
    }
  }, [periodo])

  // Memoiza dados para evitar re-renders desnecessários nos Recharts
  const dadosGrafico = useMemo(() => leituras, [leituras])
  const dadosIrrigacoes = useMemo(() => irrigacoes, [irrigacoes])

  const exportarCSV = useCallback(() => {
    const cabecalho = 'hora,umidade,temperatura\n'
    const linhas = leituras.map((l) => `${l.hora},${l.umidade},${l.temperatura}`).join('\n')
    const blob = new Blob([cabecalho + linhas], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historico-${periodo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [leituras, periodo])

  useEffect(() => { carregar() }, [carregar])

  return {
    status,
    periodo,
    setPeriodo,
    leituras: dadosGrafico,
    irrigacoes: dadosIrrigacoes,
    erro,
    exportarCSV,
    retentar: carregar,
  }
}
