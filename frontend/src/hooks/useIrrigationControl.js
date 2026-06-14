import { useState, useEffect, useCallback } from 'react'
import { fetchBombaStatus, toggleBomba } from '../services/mockApi.js'

export function useIrrigationControl() {
  const [status, setStatus] = useState('loading')       // 'loading' | 'success' | 'error'
  const [bombaStatus, setBombaStatus] = useState('DESLIGADO')
  const [log, setLog] = useState([])
  const [actionStatus, setActionStatus] = useState('idle') // 'idle' | 'sending' | 'sent' | 'error'
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setStatus('loading')
    setErro(null)
    try {
      const dados = await fetchBombaStatus()
      setBombaStatus(dados.statusAtual)
      setLog(dados.log)
      setStatus('success')
    } catch (err) {
      console.error({ event: 'fetch_failed', screen: 'manual-control', uc: 'UC-03', error: err.message })
      setErro(err.message)
      setStatus('error')
    }
  }, [])

  const acionar = useCallback(async (ligar) => {
    // Guard de debounce: bloqueia novo clique enquanto aguarda resposta
    if (actionStatus === 'sending') return
    setActionStatus('sending')
    try {
      const result = await toggleBomba(ligar)
      setBombaStatus(result.statusAtual)
      setLog((prev) => [result.log, ...prev])
      setActionStatus('sent')
      setTimeout(() => setActionStatus('idle'), 3000)
    } catch (err) {
      console.error({ event: 'action_failed', screen: 'manual-control', uc: 'UC-03', error: err.message })
      setActionStatus('error')
    }
  }, [actionStatus])

  useEffect(() => { carregar() }, [carregar])

  return { status, bombaStatus, log, actionStatus, erro, acionar, retentar: carregar }
}
