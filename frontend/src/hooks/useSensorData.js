import { useState, useEffect, useCallback, useRef } from 'react'
// Para usar a API real: substituir a linha abaixo por:
// import { fetchSensorData } from '../services/api.js'
import { fetchSensorData, MOCK_HISTORICO, MOCK_THRESHOLD } from '../services/mockApi.js'

const POLLING_INTERVAL_MS = 30_000

export function useSensorData() {
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error' | 'partial'
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [historico, setHistorico] = useState(MOCK_HISTORICO)
  const [threshold] = useState(MOCK_THRESHOLD)
  const intervalRef = useRef(null)

  const buscar = useCallback(async () => {
    try {
      const novos = await fetchSensorData()

      // Estado 'partial': resposta chega mas campos críticos estão nulos
      const camposCriticos = ['temperatura', 'umidadeSolo', 'statusIrrigacao']
      const temCampoNulo = camposCriticos.some((c) => novos[c] === null || novos[c] === undefined)

      setDados(novos)
      setErro(null)
      setStatus(temCampoNulo ? 'partial' : 'success')

      // Acumula histórico de umidade (últimos 12 pontos)
      const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      if (novos.umidadeSolo !== null) {
        setHistorico((prev) => {
          const novo = [...prev, { hora, umidade: novos.umidadeSolo }]
          return novo.slice(-12)
        })
      }
    } catch (err) {
      // Estado 'error': qualquer falha de rede ou resposta inesperada
      setErro(err.message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    buscar()
    intervalRef.current = setInterval(buscar, POLLING_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [buscar])

  return { status, dados, erro, historico, threshold, retentar: buscar }
}
