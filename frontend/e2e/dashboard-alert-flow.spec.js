import { test, expect } from '@playwright/test'

// Âncora: UC-01 + UC-05 — fluxo crítico de diagnóstico
// Usuário vê alerta de umidade baixa → navega para histórico para investigar
// Requer: VITE_FORCE_ALERT=true (configurado em playwright.config.js webServer)
test('usuário vê alerta de umidade baixa e navega para Histórico', async ({ page }) => {
  await page.goto('/')

  // Aguarda o alerta de umidade aparecer (umidadeSolo=30% < threshold=55%)
  await page.waitForSelector('[data-testid="alerta-umidade"]', { timeout: 10000 })
  await expect(page.locator('[data-testid="alerta-umidade"]')).toBeVisible()

  // Navega para o Histórico via a aba na bottom nav
  await page.click('[data-testid="nav-historico"]')

  // Aguarda o gráfico de umidade aparecer (carregamento dos dados históricos)
  await page.waitForSelector('[data-testid="grafico-umidade"]', { timeout: 10000 })
  await expect(page.locator('[data-testid="grafico-umidade"]')).toBeVisible()

  // Confirma que também existe o seletor de período
  await expect(page.locator('[data-testid="selector-periodo"]')).toBeVisible()
})
