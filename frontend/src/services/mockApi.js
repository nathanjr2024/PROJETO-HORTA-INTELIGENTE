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
