# Release v0.2.0-dashboard-rc — Dashboard Completo Mockado

**Tag:** `v0.2.0-dashboard-rc`  
**Data:** 2026-06-14  
**Equipe:** Nathan Junior, Kauã Martins  
**Atividade:** A1.8 — Dashboard Completo Mockado  
**Base:** v1.0.0-dashboard (A1.7)

---

## O que entrou nesta release (em relação à A1.7)

### 1. Tela Controle Manual — UC-03 (Kauã)

- Botão de acionamento/desligamento da bomba com estado visual (LIGADO/DESLIGADO)
- Aviso de latência: "comandos chegam em até 30 segundos"
- Log de acionamentos (timestamp + tipo + duração)
- 4 estados: loading / success / sending (botão desabilitado) / error

### 2. Tela Configurações — UC-04 (Nathan)

- Slider de threshold de umidade do solo (10–90%)
- Seletor de frequência de polling (30s / 1min / 5min)
- Banner de confirmação "Salvo com sucesso" após salvar
- 4 estados: loading / success / saved / error

### 3. Tela Histórico — UC-05 (Kauã)

- Seletor de período: 24h / 7d / 30d
- Gráfico de umidade (azul) com linha de threshold
- Gráfico de temperatura (laranja)
- Tabela de eventos de irrigação
- Exportação CSV (download via Blob)
- 4 estados: loading / success / error / empty

### 4. Melhorias no Dashboard (UC-01/02) (Nathan)

- Alerta de umidade: banner amarelo quando `umidadeSolo < threshold`
- Widget de relatório semanal: consumo de água e contagem de irrigações
- Navegação por abas (AppShell) integrando as 4 telas

### 5. Dados sintéticos realistas

- Gerados via `gerar-dados-sinteticos.py --dias 37 --seed 2026`
- Pré-processados em JSON: histórico 24h/7d/30d, irrigações, relatório semanal
- Ciclo dia/noite de temperatura, sazonalidade, curva solar, umidade do solo com decaimento

---

## Breaking changes

Nenhum. A1.7 roda com a mesma linha de comando (`npm run dev`).

---

## Testes

**16 testes Vitest + 1 E2E Playwright — todos passando:**

```
✓ Dashboard — estado success  (4 testes existentes, atualizados)
✓ Settings  — estado loading  (UC-04, novo)
✓ Settings  — estado success  (UC-04, novo)
✓ Settings  — estado error    (UC-04, novo)
✓ Settings  — estado saved    (UC-04, novo)
✓ ManualControl — estado loading  (UC-03, novo)
✓ ManualControl — estado success  (UC-03, novo)
✓ ManualControl — estado sending  (UC-03, novo)
✓ ManualControl — estado error    (UC-03, novo)
✓ History — estado loading  (UC-05, novo)
✓ History — estado success  (UC-05, novo)
✓ History — estado error    (UC-05, novo)
✓ History — estado empty    (UC-05, novo)

E2E (Playwright):
✓ usuário vê alerta de umidade baixa e navega para Histórico
```

Log Vitest: `docs/dashboard/evidencias/vitest_output_v2.txt`  
Log E2E: `docs/dashboard/evidencias/playwright_output.txt`

---

## Rastreabilidade end-to-end

| UC | Componente | Teste | Esta release |
|----|-----------|-------|-------------|
| UC-01 (leituras) + alerta | Dashboard.jsx | Dashboard.test.jsx | release-2.md linha 4.1 |
| UC-02 (irrigação automática) | IrrigationStatus.jsx | Dashboard.test.jsx | release-2.md linha 4.1 |
| UC-03 (controle manual) | ManualControl.jsx | ManualControl.test.jsx | release-2.md linha 1 |
| UC-04 (configurações) | Settings.jsx | Settings.test.jsx | release-2.md linha 2 |
| UC-05 (histórico) | History.jsx | History.test.jsx | release-2.md linha 3 |
| E2E alerta → histórico | AppShell.jsx | dashboard-alert-flow.spec.js | release-2.md linha 5 |

Âncora na matriz A1.6: UC-01 linha 1 (existente), UC-03/04/05 novas linhas em `docs/test-strategy.md`.

---

## Segurança e observabilidade

- Threat model: [`docs/dashboard/threat-model.md`](../dashboard/threat-model.md) — 3 ameaças com mitigações aplicadas
- Observabilidade: [`docs/ops/observability-dashboard.md`](../ops/observability-dashboard.md) — logs estruturados + runbook
- SCA: `docs/dashboard/evidencias/npm-audit-output.txt`

---

## Como rodar (clone fresco)

```bash
git clone https://github.com/nathanjr2024/PROJETO-HORTA-INTELIGENTE
cd PROJETO-HORTA-INTELIGENTE/frontend
npm install
npm run dev        # http://localhost:5173 — 4 telas com dados mockados
npm test -- --run  # 16 testes passam

# E2E (requer npm run dev rodando em outro terminal):
npx playwright test
```

Para forçar o alerta de umidade (útil para testar):
```bash
VITE_FORCE_ALERT=true npm run dev
```

---

## Issues fechadas / PRs mergeados

- PR: `feat/a1.8-nathan-uc04-nav-docs` — AppShell, Settings, alerta, docs
- PR: `feat/a1.8-kaua-uc03-uc05-history` — ManualControl, History, E2E
