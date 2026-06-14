# Observabilidade — Dashboard Horta Inteligente

**Escopo:** Frontend React (UC-01 a UC-05).
**Data:** 2026-06-14 · **Responsável:** Nathan Junior

---

## 1. Logs estruturados

Cada hook de dados emite um evento estruturado no `console.error` quando falha:

```js
// Padrão aplicado em useSensorData.js, useSettings.js, useIrrigationControl.js, useHistoricalData.js
console.error({
  event: 'fetch_failed',     // identificador do evento — grep-ável
  screen: 'dashboard',       // tela onde ocorreu
  uc: 'UC-01',               // caso de uso afetado
  error: err.message,        // mensagem da exceção
})
```

**Erro persistente** (≥ 2 ciclos consecutivos sem sucesso) emite evento adicional:

```js
console.error({
  event: 'persistent_error',
  screen: 'dashboard',
  uc: 'UC-01',
  consecutiveErrors: 3,
  error: err.message,
})
```

Esses eventos são estruturados (objeto JS, não string livre) para permitir integração
futura com Sentry ou Datadog via `beforeSend` hook — sem refatoração dos call sites.

---

## 2. Métrica de fetch

`mockApi.js` exporta um contador incremental:

```js
export let fetchCallCount = 0  // incrementado em fetchSensorData()
```

Em ambiente de desenvolvimento (`import.meta.env.DEV === true`), o componente
`DevMetrics` (renderizado pelo `App.jsx` em modo dev) exibe o contador no canto
inferior direito da tela, visível durante testes manuais.

**Evidência:** abrir o console do navegador após 60s de uso mostra o log estruturado
e o contador chegando a 2+ (polling a cada 30s).

---

## 3. Runbook — erro persistente no dashboard

**Sintoma:** Banner vermelho "Falha ao buscar dados dos sensores" persiste por mais
de 1 minuto. Console mostra `event: 'persistent_error'`.

**Passos de investigação:**

1. **Verificar o console do navegador**
   - Abrir DevTools → aba Console
   - Filtrar por `fetch_failed` ou `persistent_error`
   - Anotar o campo `error` — geralmente indica `TypeError: Failed to fetch` (rede)
     ou `SyntaxError` (resposta não é JSON)

2. **Verificar a URL do proxy**
   - Abrir `frontend/vite.config.js`
   - Confirmar que `target` aponta para o endpoint correto do Azure
   - Testar manualmente: `curl -s https://<endpoint>/api/aquisicao/avancada`

3. **Isolar com o mock**
   - Em `frontend/src/hooks/useSensorData.js`, trocar o import:
     ```diff
     - import { fetchSensorData } from '../services/api.js'
     + import { fetchSensorData } from '../services/mockApi.js'
     ```
   - Se o dashboard funcionar com mock, o problema é no backend/rede.
   - Se continuar falhando, o problema é no hook ou componente.

4. **Verificar o backend**
   - Acessar Render.com dashboard → verificar se o serviço está acordado (cold start)
   - Verificar logs do Render para erros de inicialização do FastAPI

---

## 4. Evidência de instrumentação

Os logs aparecem no console ao rodar `npm run dev` e forçar erro de rede:

```bash
cd frontend
npm run dev
# Em outro terminal, bloquear a porta do proxy:
# Desligar a VPN ou simular offline no DevTools → Network → Offline
```

O console mostrará:
```
{event: 'fetch_failed', screen: 'dashboard', uc: 'UC-01', error: 'Failed to fetch'}
```

Após 2 ciclos (60s):
```
{event: 'persistent_error', screen: 'dashboard', uc: 'UC-01', consecutiveErrors: 2, error: 'Failed to fetch'}
```
