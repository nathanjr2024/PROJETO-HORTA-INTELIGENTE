import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from './Settings.jsx'

// Âncora: todos os testes cobrem UC-04 (configuração de threshold e polling)
// Risco coberto: threshold salvo como string faz comparação umidade < threshold falhar

vi.mock('../../hooks/useSettings.js')
import { useSettings } from '../../hooks/useSettings.js'

beforeEach(() => vi.clearAllMocks())

// ── Teste 1: Estado 'loading' ────────────────────────────────────────────────
describe('Settings — estado loading', () => {
  it('exibe skeletons enquanto configurações são carregadas', () => {
    useSettings.mockReturnValue({
      status: 'loading',
      config: null,
      saveStatus: 'idle',
      saveErro: null,
      erro: null,
      salvar: vi.fn(),
      retentar: vi.fn(),
    })

    render(<Settings />)

    expect(screen.getByTestId('estado-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('threshold-slider')).not.toBeInTheDocument()
  })
})

// ── Teste 2: Estado 'success' ────────────────────────────────────────────────
// Valida que slider e radio group renderizam com valores do config carregado
describe('Settings — estado success', () => {
  it('exibe slider com threshold 55 e radio 30s selecionado', () => {
    useSettings.mockReturnValue({
      status: 'success',
      config: { threshold: 55, pollingInterval: 30 },
      saveStatus: 'idle',
      saveErro: null,
      erro: null,
      salvar: vi.fn(),
      retentar: vi.fn(),
    })

    render(<Settings />)

    expect(screen.getByTestId('estado-sucesso')).toBeInTheDocument()
    expect(screen.getByTestId('threshold-slider')).toBeInTheDocument()
    expect(screen.getByTestId('radio-polling-30')).toBeChecked()
    expect(screen.queryByTestId('banner-salvo')).not.toBeInTheDocument()
  })
})

// ── Teste 3: Estado 'error' de carga ────────────────────────────────────────
describe('Settings — estado error', () => {
  it('exibe banner de erro com botão de retentar', async () => {
    const mockRetentar = vi.fn()
    useSettings.mockReturnValue({
      status: 'error',
      config: null,
      saveStatus: 'idle',
      saveErro: null,
      erro: 'Timeout ao carregar configurações',
      salvar: vi.fn(),
      retentar: mockRetentar,
    })

    render(<Settings />)

    expect(screen.getByTestId('estado-erro')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Falha ao carregar configurações')).toBeInTheDocument()

    const botao = screen.getByRole('button', { name: /tentar novamente/i })
    await userEvent.click(botao)
    expect(mockRetentar).toHaveBeenCalledTimes(1)
  })
})

// ── Teste 4: Estado 'saved' após salvar com sucesso ──────────────────────────
// Risco coberto: usuário clica Salvar e não recebe confirmação — repete a ação
describe('Settings — estado saved', () => {
  it('exibe banner de confirmação quando saveStatus é "saved"', () => {
    useSettings.mockReturnValue({
      status: 'success',
      config: { threshold: 55, pollingInterval: 30 },
      saveStatus: 'saved',
      saveErro: null,
      erro: null,
      salvar: vi.fn(),
      retentar: vi.fn(),
    })

    render(<Settings />)

    expect(screen.getByTestId('banner-salvo')).toBeInTheDocument()
    expect(screen.getByText(/configurações salvas com sucesso/i)).toBeInTheDocument()
  })
})
