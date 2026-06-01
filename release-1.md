# Release v1.0.0-dashboard — Dashboard E2E v0.1

**Tag:** `v1.0.0-dashboard`  
**Data:** 2026-05-31  
**Equipe:** Nathan Junior, Bruno Avelino, Kauã Martins  
**Atividade:** A1.7 — Dashboard E2E v0.1

---

## O que entrou nesta release

### Tela entregue: Dashboard Principal (UC-01 + UC-02)

A única tela entregue nesta release — conforme o princípio da entrega honesta da A1.7:
uma tela completa vale mais do que quatro telas pela metade.

**Funcionalidades implementadas:**

- Exibição em tempo real de temperatura do ar, umidade do solo e luminosidade (UC-01)
- Indicação visual do status da bomba de irrigação e modo de operação — automático ou manual (UC-02)
- Gráfico de linha (Recharts) com histórico de umidade das últimas 12 horas e linha de threshold
- Polling automático a cada 30 segundos (conforme ADR-001 da RFC-001)

**4 estados visuais implementados:**

| Estado | Trigger | Comportamento |
|--------|---------|---------------|
| `loading` | Fetch em curso | Skeletons animados em todos os cards; nenhum dado exibido |
| `success` | Dados recebidos | Valores reais dos sensores; gráfico atualizado; status da irrigação |
| `error` | Falha de rede / HTTP ≥500 | Banner vermelho + botão "Tentar novamente"; nenhuma tela em branco |
| `partial` | Campo nulo na resposta | Badge "sensor offline" no card afetado; banner de aviso; dados restantes visíveis |

**Camada de fetch isolada (mock plugável):**

O hook `useSensorData.js` consome `mockApi.js` por padrão — a tela roda sem nenhuma
dependência externa. Para conectar à API real, trocar **1 import**:

```js
// frontend/src/hooks/useSensorData.js — linha 4
import { fetchSensorData } from '../services/api.js'      // API real (server-horta ou FastAPI)
// import { fetchSensorData } from '../services/mockApi.js' // mock (padrão)
```

O `api.js` aponta para `GET /api/aquisicao/avancada` do servidor Express em `server-horta/`
(porta 3000). O `server-horta` é um simulador local separado do repositório — alinhado com
a arquitetura da RFC-001 que prevê backend FastAPI em produção (Render.com).

---

## Testes

**4 testes Vitest + Testing Library — todos passando:**

```
✓ Dashboard — estado success → exibe valores dos sensores quando dados chegam com sucesso
✓ Dashboard — estado loading → exibe skeletons enquanto os dados estão sendo carregados
✓ Dashboard — estado error  → exibe banner de erro com botão de retentar quando o fetch falha
✓ Dashboard — estado partial → exibe badge "sensor offline" quando campo crítico está nulo

Test Files: 1 passed | Tests: 4 passed | Duration: 1.22s
```

Log completo: [`docs/dashboard/evidencias/vitest_output.txt`](docs/dashboard/evidencias/vitest_output.txt)

**Âncora na matriz de risco (A1.6):** todos os testes cobrem UC-01, linha 1.  
Risco coberto: frontend exibir "---" ou tela em branco sem sinalizar falha ao usuário.

---

## Rastreabilidade

```
UC-01 (visualizar leituras)  → Dashboard.jsx → Dashboard.test.jsx → release-1.md
UC-02 (irrigação automática) → IrrigationStatus.jsx → Dashboard.test.jsx → release-1.md
Matriz A1.6 linha 1          → Dashboard.test.jsx (4 âncoras explícitas nos comentários)
RFC-001 (React 18 + Vite 5 + Recharts 2) → frontend/package.json
ADR-003 (React SPA em vez de server-side) → frontend/
```

---

## Estrutura de arquivos entregues

```
frontend/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── services/
    │   ├── api.js          # fetch real → GET /api/aquisicao/avancada
    │   └── mockApi.js      # mock plugável com dados realistas da horta
    ├── hooks/
    │   └── useSensorData.js
    └── components/Dashboard/
        ├── Dashboard.jsx
        ├── Dashboard.module.css
        ├── Dashboard.test.jsx
        ├── SensorCard.jsx
        ├── HumidityChart.jsx
        └── IrrigationStatus.jsx

docs/dashboard/evidencias/
└── vitest_output.txt
```

---

## O que ficou fora desta release (fora do escopo)

- **Controles Manuais** (UC-03) — tela de controle manual da bomba
- **Configurações** (UC-04) — configuração de threshold de umidade
- **Histórico Completo** (UC-05) — tela com filtro por período
- Testes E2E com browser automatizado (Playwright/Cypress) — planejados para v0.2
- Deploy em Vercel — infraestrutura fora do escopo desta entrega

---

## Como rodar (clone fresco)

```bash
git clone https://github.com/nathanjr2024/PROJETO-HORTA-INTELIGENTE
cd PROJETO-HORTA-INTELIGENTE/frontend
npm install
npm run dev        # http://localhost:5173 — dashboard com dados mockados
npm test -- --run  # 4 testes passam
```

Para conectar ao servidor de simulação local (`server-horta`):
1. Em outro terminal: `cd ~/UNASP/server-horta && node app.js`
2. Trocar o import em `frontend/src/hooks/useSensorData.js` (ver seção acima)
