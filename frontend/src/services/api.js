const API_BASE = '/api'

export async function fetchSensorData() {
  const response = await fetch(`${API_BASE}/aquisicao/avancada`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: falha ao buscar dados dos sensores`)
  }
  const json = await response.json()
  return normalizar(json)
}

export async function acionarIrrigacao(ligar) {
  const response = await fetch(`${API_BASE}/controle/irrigacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ligar, automatico: false }),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: falha ao acionar irrigação`)
  }
  return response.json()
}

// Normaliza a resposta aninhada da API para o formato flat que os componentes esperam
function normalizar(json) {
  const d = json.aquisicao_avancada?.[0]
  if (!d) throw new Error('Resposta da API em formato inesperado')

  return {
    id: d.id,
    dataHora: d.dataHora,
    temperatura: d.condicoes_ambientais?.temperaturaCelsius ?? null,
    umidadeAr: d.condicoes_ambientais?.umidadeArPorcentagem ?? null,
    luminosidade: d.condicoes_ambientais?.luminosidadeSolarPorcentagem ?? null,
    condicaoCeu: d.condicoes_ambientais?.condicaoCeu ?? null,
    estacao: d.condicoes_ambientais?.estacao ?? null,
    estaChovendo: d.condicoes_ambientais?.estaChovendo ?? false,
    umidadeSolo: d.sensores_solo?.umidadeSoloPorcentagem ?? null,
    pHSolo: d.sensores_solo?.pHSolo ?? null,
    alertaCritico: d.sensores_solo?.alertaCriticoAlface ?? false,
    statusIrrigacao: d.atuadores?.statusIrrigacao ?? null,
    modoManual: d.atuadores?.controleManualAtivo ?? false,
  }
}
