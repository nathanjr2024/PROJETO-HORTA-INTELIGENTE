import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSensorData, fetchRelatorioSemanal } from '../services/mockApi.js'
import { MOCK_HISTORICO, MOCK_THRESHOLD } from '../services/mockApi.js'

const POLLING_INTERVAL_MS = 30_000

export function useSensorData() {
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error' | 'partial'
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [historico, setHistorico] = useState(MOCK_HISTORICO)
  const [threshold] = useState(MOCK_THRESHOLD)
  const [alertaAtivo, setAlertaAtivo] = useState(false)
  const [relatorio, setRelatorio] = useState(null)
  const intervalRef = useRef(null)
  const consecutiveErrorsRef = useRef(0)

  const buscar = useCallback(async () => {
    try {
      const novos = await fetchSensorData()

      // Estado 'partial': resposta chega mas campos críticos estão nulos
      const camposCriticos = ['temperatura', 'umidadeSolo', 'statusIrrigacao']
      const temCampoNulo = camposCriticos.some((c) => novos[c] === null || novos[c] === undefined)

      setDados(novos)
      setErro(null)
      setStatus(temCampoNulo ? 'partial' : 'success')
      consecutiveErrorsRef.current = 0

      // Alerta: umidade do solo abaixo do threshold
      if (novos.umidadeSolo !== null && novos.umidadeSolo !== undefined) {
        setAlertaAtivo(novos.umidadeSolo < threshold)
      }

      // Acumula histórico de umidade (últimos 12 pontos)
      const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      if (novos.umidadeSolo !== null) {
        setHistorico((prev) => {
          const novo = [...prev, { hora, umidade: novos.umidadeSolo }]
          return novo.slice(-12)
        })
      }
    } catch (err) {
      consecutiveErrorsRef.current += 1
      if (consecutiveErrorsRef.current >= 2) {
        console.error({
          event: 'persistent_error',
          screen: 'dashboard',
          uc: 'UC-01',
          consecutiveErrors: consecutiveErrorsRef.current,
          error: err.message,
        })
      } else {
        console.error({ event: 'fetch_failed', screen: 'dashboard', uc: 'UC-01', error: err.message })
      }
      setErro(err.message)
      setStatus('error')
    }
  }, [threshold])

  useEffect(() => {
    buscar()
    fetchRelatorioSemanal().then(setRelatorio).catch(() => {})
    intervalRef.current = setInterval(buscar, POLLING_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [buscar])

  return { status, dados, erro, historico, threshold, alertaAtivo, relatorio, retentar: buscar }
}
