import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from './Dashboard.jsx'

// Âncora global: todos os testes deste arquivo cobrem UC-01, linha 1 da matriz A1.6
// Risco coberto: frontend exibe "---" ou tela em branco sem sinalizar falha ao usuário.

vi.mock('../../hooks/useSensorData.js')
import { useSensorData } from '../../hooks/useSensorData.js'

const DADOS_MOCK = {
  id: 142,
  dataHora: '2026-05-31 14:32:05',
  temperatura: 24.5,
  umidadeAr: 72,
  luminosidade: 68,
  umidadeSolo: 68.0,
  pHSolo: 6.2,
  alertaCritico: false,
  statusIrrigacao: 'DESLIGADO',
  modoManual: false,
}

const HISTORICO_MOCK = [
  { hora: '06:00', umidade: 66 },
  { hora: '07:00', umidade: 58 },
  { hora: '08:00', umidade: 72 },
]

beforeEach(() => vi.clearAllMocks())

// ── Teste 1: Estado 'success' ──────────────────────────────────────────────
// Âncora: UC-01, matriz A1.6 linha 1
// Valida que dados reais da horta chegam ao usuário sem alteração.
describe('Dashboard — estado success', () => {
  it('exibe valores dos sensores quando dados chegam com sucesso', () => {
    useSensorData.mockReturnValue({
      status: 'success',
      dados: DADOS_MOCK,
      erro: null,
      historico: HISTORICO_MOCK,
      threshold: 55,
      alertaAtivo: false,
      relatorio: null,
      retentar: vi.fn(),
    })

    render(<Dashboard />)

    // Temperatura do ar
    expect(screen.getByText('24.5°C')).toBeInTheDocument()
    // Umidade do solo
    expect(screen.getByText('68.0%')).toBeInTheDocument()
    // Status da irrigação
    expect(screen.getByTestId('irrigation-status')).toBeInTheDocument()
    // Gráfico renderizado
    expect(screen.getByTestId('humidity-chart')).toBeInTheDocument()
    // Container do estado correto
    expect(screen.getByTestId('estado-sucesso')).toBeInTheDocument()
  })
})

// ── Teste 2: Estado 'loading' ──────────────────────────────────────────────
// Âncora: UC-01, matriz A1.6 linha 1
// Valida que o usuário recebe feedback visual durante o fetch inicial.
describe('Dashboard — estado loading', () => {
  it('exibe skeletons enquanto os dados estão sendo carregados', () => {
    useSensorData.mockReturnValue({
      status: 'loading',
      dados: null,
      erro: null,
      historico: [],
      threshold: 55,
      alertaAtivo: false,
      relatorio: null,
      retentar: vi.fn(),
    })

    render(<Dashboard />)

    expect(screen.getByTestId('estado-loading')).toBeInTheDocument()
    // Não deve mostrar valores reais durante loading
    expect(screen.queryByTestId('estado-sucesso')).not.toBeInTheDocument()
    expect(screen.queryByTestId('estado-erro')).not.toBeInTheDocument()
  })
})

// ── Teste 3: Estado 'error' ────────────────────────────────────────────────
// Âncora: UC-01, matriz A1.6 linha 1
// Risco real: se a API falhar silenciosamente, o usuário vê tela em branco e
// não sabe que os dados estão desatualizados — pode tomar decisão de irrigação errada.
describe('Dashboard — estado error', () => {
  it('exibe banner de erro com botão de retentar quando o fetch falha', async () => {
    const mockRetentar = vi.fn()
    useSensorData.mockReturnValue({
      status: 'error',
      dados: null,
      erro: 'HTTP 500: falha ao buscar dados dos sensores',
      historico: [],
      threshold: 55,
      alertaAtivo: false,
      relatorio: null,
      retentar: mockRetentar,
    })

    render(<Dashboard />)

    expect(screen.getByTestId('estado-erro')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Falha ao buscar dados dos sensores')).toBeInTheDocument()

    const botao = screen.getByRole('button', { name: /tentar novamente/i })
    await userEvent.click(botao)
    expect(mockRetentar).toHaveBeenCalledTimes(1)
  })
})

// ── Teste 4: Estado 'partial' ──────────────────────────────────────────────
// Âncora: UC-01, matriz A1.6 linha 1
// Risco real: sensor offline faz campo chegar null; frontend mostra "---" sem
// sinalizar ao usuário que aquele dado está indisponível (parece dado zero).
describe('Dashboard — estado partial (sensor offline)', () => {
  it('exibe badge "sensor offline" quando campo crítico está nulo', () => {
    useSensorData.mockReturnValue({
      status: 'partial',
      dados: { ...DADOS_MOCK, umidadeSolo: null }, // sensor de solo offline
      erro: null,
      historico: HISTORICO_MOCK,
      threshold: 55,
      alertaAtivo: false,
      relatorio: null,
      retentar: vi.fn(),
    })

    render(<Dashboard />)

    expect(screen.getByTestId('estado-parcial')).toBeInTheDocument()
    expect(screen.getByTestId('banner-parcial')).toBeInTheDocument()
    expect(screen.getByTestId('sensor-card-offline')).toBeInTheDocument()
    expect(screen.getByText('sensor offline')).toBeInTheDocument()
  })
})
