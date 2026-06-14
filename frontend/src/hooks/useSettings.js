import { useState, useEffect, useCallback } from 'react'
import { fetchSettings, saveSettings } from '../services/mockApi.js'

export function useSettings() {
  const [status, setStatus] = useState('loading')   // 'loading' | 'success' | 'error'
  const [config, setConfig] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [saveErro, setSaveErro] = useState(null)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setStatus('loading')
    setErro(null)
    try {
      const dados = await fetchSettings()
      setConfig(dados)
      setStatus('success')
    } catch (err) {
      console.error({ event: 'fetch_failed', screen: 'settings', uc: 'UC-04', error: err.message })
      setErro(err.message)
      setStatus('error')
    }
  }, [])

  const salvar = useCallback(async (novaConfig) => {
    if (novaConfig.threshold < 10 || novaConfig.threshold > 90) {
      setSaveErro('Valor deve estar entre 10% e 90%')
      setSaveStatus('error')
      return
    }
    setSaveStatus('saving')
    setSaveErro(null)
    try {
      await saveSettings(novaConfig)
      setConfig(novaConfig)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error({ event: 'save_failed', screen: 'settings', uc: 'UC-04', error: err.message })
      setSaveErro(err.message)
      setSaveStatus('error')
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  return { status, config, saveStatus, saveErro, erro, salvar, retentar: carregar }
}
