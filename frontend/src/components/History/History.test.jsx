import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import History from './History.jsx'

// Âncora: todos os testes cobrem UC-05 (histórico de leituras)
// Risco coberto: re-render desnecessário ao trocar período trava o navegador
// (mitigado por React.memo + useMemo no hook — testado manualmente)

vi.mock('../../hooks/useHistoricalData.js')
import { useHistoricalData } from '../../hooks/useHistoricalData.js'

const LEITURAS_MOCK = [
  { hora: '08:00', umidade: 65.2, temperatura: 23.1 },
  { hora: '09:00', umidade: 61.4, temperatura: 24.5 },
  { hora: '10:00', umidade: 58.0, temperatura: 25.2 },
]

const IRRIGACOES_MOCK = [
  { id: 1, timestampInicio: '2026-06-14 08:30:00', duracao_min: 4, acionadoPor: 'automatico', umidadeSoloAntes: 39.9, umidadeSoloDepois: 60.8 },
  { id: 2, timestampInicio: '2026-06-14 05:12:00', duracao_min: 5, acionadoPor: 'automatico', umidadeSoloAntes: 40.0, umidadeSoloDepois: 64.2 },
]

beforeEach(() => vi.clearAllMocks())

// ── Teste 1: Estado 'loading' ────────────────────────────────────────────────
describe('History — estado loading', () => {
  it('exibe skeletons enquanto dados históricos são carregados', () => {
    useHistoricalData.mockReturnValue({
      status: 'loading',
      periodo: '24h',
      setPeriodo: vi.fn(),
      leituras: [],
      irrigacoes: [],
      erro: null,
      exportarCSV: vi.fn(),
      retentar: vi.fn(),
    })

    render(<History />)

    expect(screen.getByTestId('estado-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('grafico-umidade')).not.toBeInTheDocument()
  })
})

// ── Teste 2: Estado 'success' — gráficos e tabela renderizados ───────────────
describe('History — estado success', () => {
  it('exibe gráficos de umidade e temperatura e tabela de irrigações', () => {
    useHistoricalData.mockReturnValue({
      status: 'success',
      periodo: '24h',
      setPeriodo: vi.fn(),
      leituras: LEITURAS_MOCK,
      irrigacoes: IRRIGACOES_MOCK,
      erro: null,
      exportarCSV: vi.fn(),
      retentar: vi.fn(),
    })

    render(<History />)

    expect(screen.getByTestId('estado-sucesso')).toBeInTheDocument()
    expect(screen.getByTestId('grafico-umidade')).toBeInTheDocument()
    expect(screen.getByTestId('grafico-temperatura')).toBeInTheDocument()
    expect(screen.getByTestId('tabela-irrigacoes')).toBeInTheDocument()
    expect(screen.getByTestId('selector-periodo')).toBeInTheDocument()
    expect(screen.getByTestId('btn-exportar-csv')).toBeInTheDocument()
  })
})

// ── Teste 3: Estado 'error' ──────────────────────────────────────────────────
describe('History — estado error', () => {
  it('exibe banner de erro com botão de retentar', async () => {
    const mockRetentar = vi.fn()
    useHistoricalData.mockReturnValue({
      status: 'error',
      periodo: '24h',
      setPeriodo: vi.fn(),
      leituras: [],
      irrigacoes: [],
      erro: 'Falha ao buscar histórico',
      exportarCSV: vi.fn(),
      retentar: mockRetentar,
    })

    render(<History />)

    expect(screen.getByTestId('estado-erro')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Falha ao carregar histórico')).toBeInTheDocument()

    const botao = screen.getByRole('button', { name: /tentar novamente/i })
    await userEvent.click(botao)
    expect(mockRetentar).toHaveBeenCalledTimes(1)
  })
})

// ── Teste 4: Estado 'empty' — sem dados no período ───────────────────────────
// Risco coberto: API retorna array vazio — usuário deve saber que não há dados
// e não ver tela em branco
describe('History — estado empty', () => {
  it('exibe mensagem "sem dados" quando leituras estão vazias', () => {
    useHistoricalData.mockReturnValue({
      status: 'empty',
      periodo: '30d',
      setPeriodo: vi.fn(),
      leituras: [],
      irrigacoes: [],
      erro: null,
      exportarCSV: vi.fn(),
      retentar: vi.fn(),
    })

    render(<History />)

    expect(screen.getByTestId('estado-vazio')).toBeInTheDocument()
    expect(screen.getByText(/sem dados para o período selecionado/i)).toBeInTheDocument()
    expect(screen.queryByTestId('grafico-umidade')).not.toBeInTheDocument()
  })
})
