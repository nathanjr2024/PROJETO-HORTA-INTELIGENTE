import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ManualControl from './ManualControl.jsx'

// Âncora: todos os testes cobrem UC-03 (controle manual da bomba)
// Risco coberto: cliques múltiplos antes da resposta disparam comandos duplicados para a bomba

vi.mock('../../hooks/useIrrigationControl.js')
import { useIrrigationControl } from '../../hooks/useIrrigationControl.js'

const LOG_MOCK = [
  { id: 1, timestampInicio: '2026-06-14 08:30:00', duracao_min: 4, acionadoPor: 'automatico' },
  { id: 2, timestampInicio: '2026-06-14 05:12:00', duracao_min: 5, acionadoPor: 'automatico' },
]

beforeEach(() => vi.clearAllMocks())

// ── Teste 1: Estado 'loading' ────────────────────────────────────────────────
describe('ManualControl — estado loading', () => {
  it('exibe skeletons enquanto status da bomba é carregado', () => {
    useIrrigationControl.mockReturnValue({
      status: 'loading',
      bombaStatus: 'DESLIGADO',
      log: [],
      actionStatus: 'idle',
      erro: null,
      acionar: vi.fn(),
      retentar: vi.fn(),
    })

    render(<ManualControl />)

    expect(screen.getByTestId('estado-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('btn-toggle-bomba')).not.toBeInTheDocument()
  })
})

// ── Teste 2: Estado 'success' com bomba desligada ────────────────────────────
// Valida que botão mostra "Acionar Irrigação" quando bomba está DESLIGADA
describe('ManualControl — estado success (bomba desligada)', () => {
  it('exibe card DESLIGADO e botão de acionar', () => {
    useIrrigationControl.mockReturnValue({
      status: 'success',
      bombaStatus: 'DESLIGADO',
      log: LOG_MOCK,
      actionStatus: 'idle',
      erro: null,
      acionar: vi.fn(),
      retentar: vi.fn(),
    })

    render(<ManualControl />)

    expect(screen.getByTestId('estado-sucesso')).toBeInTheDocument()
    expect(screen.getByTestId('status-bomba')).toBeInTheDocument()
    expect(screen.getByText('DESLIGADO')).toBeInTheDocument()
    expect(screen.getByTestId('btn-toggle-bomba')).toBeInTheDocument()
    expect(screen.getByText(/acionar irrigação/i)).toBeInTheDocument()
    expect(screen.getByTestId('log-irrigacoes')).toBeInTheDocument()
  })
})

// ── Teste 3: Estado 'sending' — botão desabilitado durante comando in-flight ──
// Risco coberto: duplo clique no botão antes da resposta envia comandos duplicados
describe('ManualControl — estado sending (debounce)', () => {
  it('desabilita o botão e mostra spinner quando actionStatus é sending', () => {
    useIrrigationControl.mockReturnValue({
      status: 'success',
      bombaStatus: 'DESLIGADO',
      log: [],
      actionStatus: 'sending',
      erro: null,
      acionar: vi.fn(),
      retentar: vi.fn(),
    })

    render(<ManualControl />)

    const btn = screen.getByTestId('btn-toggle-bomba')
    expect(btn).toBeDisabled()
    expect(screen.getByText(/enviando comando/i)).toBeInTheDocument()
  })
})

// ── Teste 4: Estado 'error' ──────────────────────────────────────────────────
describe('ManualControl — estado error', () => {
  it('exibe banner de erro com botão de retentar', async () => {
    const mockRetentar = vi.fn()
    useIrrigationControl.mockReturnValue({
      status: 'error',
      bombaStatus: 'DESLIGADO',
      log: [],
      actionStatus: 'idle',
      erro: 'Timeout ao conectar com a bomba',
      acionar: vi.fn(),
      retentar: mockRetentar,
    })

    render(<ManualControl />)

    expect(screen.getByTestId('estado-erro')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Falha ao carregar status da bomba')).toBeInTheDocument()

    const botao = screen.getByRole('button', { name: /tentar novamente/i })
    await userEvent.click(botao)
    expect(mockRetentar).toHaveBeenCalledTimes(1)
  })
})
