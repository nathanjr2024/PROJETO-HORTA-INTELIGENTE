import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppShell from './AppShell.jsx'

// Mock das telas filhas para isolar o comportamento de navegação do AppShell
vi.mock('../Dashboard/Dashboard', () => ({
  default: () => <div data-testid="tela-dashboard">Dashboard</div>,
}))
vi.mock('../ManualControl/ManualControl', () => ({
  default: () => <div data-testid="tela-controle">ManualControl</div>,
}))
vi.mock('../Settings/Settings', () => ({
  default: () => <div data-testid="tela-settings">Settings</div>,
}))
vi.mock('../History/History', () => ({
  default: () => <div data-testid="tela-historico">History</div>,
}))

describe('AppShell — navegação por abas', () => {
  it('renderiza Dashboard por padrão ao inicializar', () => {
    render(<AppShell />)
    expect(screen.getByTestId('tela-dashboard')).toBeInTheDocument()
    expect(screen.queryByTestId('tela-settings')).not.toBeInTheDocument()
  })

  it('navega para Configurações ao clicar na aba correspondente', async () => {
    render(<AppShell />)
    const tabConfig = screen.getByTestId('nav-configuracoes')
    await userEvent.click(tabConfig)
    expect(screen.getByTestId('tela-settings')).toBeInTheDocument()
    expect(screen.queryByTestId('tela-dashboard')).not.toBeInTheDocument()
  })
})
