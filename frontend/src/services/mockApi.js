// Mock plugável: substitui api.js sem mudar nenhum outro arquivo.
// Para usar a API real, trocar o import em useSensorData.js de mockApi.js para api.js.

const MOCK_DATA = {
  id: 142,
  dataHora: '2026-05-31 14:32:05',
  temperatura: 24.5,
  umidadeAr: 72,
  luminosidade: 68,
  condicaoCeu: 'ensolarado',
  estacao: 'outono',
  estaChovendo: false,
  umidadeSolo: 68.0,
  pHSolo: 6.20,
  alertaCritico: false,
  statusIrrigacao: 'DESLIGADO',
  modoManual: false,
}

// Histórico simulando um ciclo real: queda de umidade → irrigação automática → recuperação
export const MOCK_HISTORICO = [
  { hora: '02:00', umidade: 78 },
  { hora: '04:00', umidade: 74 },
  { hora: '06:00', umidade: 66 },
  { hora: '07:00', umidade: 58 }, // abaixo do threshold (55%) → irrigação automática
  { hora: '08:00', umidade: 72 }, // após irrigação
  { hora: '09:00', umidade: 70 },
  { hora: '10:00', umidade: 68 },
  { hora: '11:00', umidade: 65 },
  { hora: '12:00', umidade: 68 },
]

export const MOCK_THRESHOLD = 55

export async function fetchSensorData() {
  await new Promise((resolve) => setTimeout(resolve, 800)) // simula latência de rede
  return { ...MOCK_DATA, dataHora: new Date().toISOString().replace('T', ' ').slice(0, 19) }
}

export async function acionarIrrigacao(ligar) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    mensagem: `Bomba configurada manualmente para: ${ligar ? 'LIGADO' : 'DESLIGADO'}`,
    statusAtual: ligar ? 'LIGADO' : 'DESLIGADO',
  }
}

// ── UC-03: Controle Manual ────────────────────────────────────────────────────
export let MOCK_BOMBA_STATUS = 'DESLIGADO'

export const MOCK_LOG_IRRIGACOES = [
  { id: 1, timestampInicio: '2026-06-14 08:30:00', duracao_min: 4, acionadoPor: 'automatico' },
  { id: 2, timestampInicio: '2026-06-14 05:12:00', duracao_min: 5, acionadoPor: 'automatico' },
  { id: 3, timestampInicio: '2026-06-13 14:47:00', duracao_min: 2, acionadoPor: 'manual' },
]

export async function toggleBomba(ligar) {
  await new Promise((resolve) => setTimeout(resolve, 500))
  MOCK_BOMBA_STATUS = ligar ? 'LIGADO' : 'DESLIGADO'
  const entry = {
    id: Date.now(),
    timestampInicio: new Date().toISOString().replace('T', ' ').slice(0, 19),
    duracao_min: null,
    acionadoPor: 'manual',
  }
  MOCK_LOG_IRRIGACOES.unshift(entry)
  return { statusAtual: MOCK_BOMBA_STATUS, log: entry }
}

export async function fetchBombaStatus() {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { statusAtual: MOCK_BOMBA_STATUS, log: [...MOCK_LOG_IRRIGACOES] }
}

// ── UC-05: Histórico ──────────────────────────────────────────────────────────
import historico24h from './data/historico-24h.json'
import historico7d from './data/historico-7d.json'
import historico30d from './data/historico-30d.json'
import irrigacoesData from './data/irrigacoes.json'

export async function fetchHistorico(periodo) {
  await new Promise((resolve) => setTimeout(resolve, 700))
  const mapa = { '24h': historico24h, '7d': historico7d, '30d': historico30d }
  return mapa[periodo] ?? historico24h
}

export async function fetchIrrigacoesHistorico() {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return irrigacoesData
}
