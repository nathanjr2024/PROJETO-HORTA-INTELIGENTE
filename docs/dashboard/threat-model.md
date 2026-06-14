# Threat Model — Dashboard Horta Inteligente

**Escopo:** Frontend React (UC-01 a UC-05) e camada de dados mockada.
**Complementa:** threat model geral do sistema (ESP32 + FastAPI + PostgreSQL).
**Data:** 2026-06-14 · **Responsável:** Nathan Junior

---

## Ativos protegidos

| Ativo | Descrição |
|-------|-----------|
| Leituras de sensores | Temperatura, umidade do solo/ar, luminosidade |
| Comandos de irrigação | POST que aciona/desliga a bomba |
| Credenciais de configuração | Threshold, intervalo de polling |
| Logs do frontend | Console/error logs que podem vazar contexto |

---

## Ameaças concretas e mitigações aplicadas

### Ameaça 1 — XSS via nome do canteiro

**Vetor:** Um nome de canteiro armazenado no backend (ou futuro response da API) contém
`<script>alert(document.cookie)</script>`. O frontend renderiza esse valor no card de
sensor ou na tabela de histórico, executando código arbitrário no browser de todos os usuários.

**Impacto:** Alto — acesso a cookies de sessão, redirecionamento, exfiltração de dados.

**Mitigação aplicada:**
- React escapa automaticamente toda interpolação `{value}` como nó de texto, nunca como HTML.
- Nenhum componente usa `dangerouslySetInnerHTML`.

**Evidência:**
```bash
grep -r "dangerouslySetInnerHTML" frontend/src/
# → nenhum resultado
```

**Status:** ✅ Mitigação aplicada e verificada.

---

### Ameaça 2 — Credenciais Wi-Fi do ESP32 em logs do frontend

**Vetor:** Durante debugging, um desenvolvedor adiciona `console.log(config)` no hook
`useSettings`. Uma versão futura da API pode retornar o SSID e PSK da rede Wi-Fi
configurada no ESP32 junto com as preferências de dashboard. Esses valores aparecem
no DevTools de qualquer usuário com acesso ao browser e em qualquer serviço de
error-reporting (Sentry, Datadog) que capture console.

**Impacto:** Alto — comprometimento da rede local, acesso físico ao dispositivo.

**Mitigação aplicada:**
- `useSettings.js` e `mockApi.js#saveSettings` não registram o objeto de config.
- Logs estruturados (`console.error({ event, screen, uc, error })`) nunca incluem o payload completo.
- Em produção, `vite build` aplica `drop: ['console']` via plugin esbuild — logs de debug não chegam ao bundle.

**Dívida técnica registrada:** Quando a API real for integrada, validar que o endpoint
`GET /configuracoes` não retorna campos sensíveis (PSK, credenciais de rede).

**Status:** ✅ Mitigação aplicada na camada mock; dívida documentada para integração real.

---

### Ameaça 3 — Dados de sensor sem TLS / replay de comando de irrigação

**Vetor:** O ESP32 envia leituras e recebe comandos via HTTP sem TLS na rede local.
Um atacante na mesma rede Wi-Fi intercepta o tráfego com Wireshark e envia um
`POST /api/controle/irrigacao { ligar: true }` forjado, acionando a bomba fora de
horário ou esgotando o reservatório.

**Impacto:** Médio — dano à cultura, desperdício de água; crítico se o sistema estiver
autônomo por longos períodos.

**Mitigação aplicada (camada frontend):**
- O proxy Vite (`vite.config.js`) encaminha `/api/*` para o endpoint HTTPS do Azure.
  O frontend nunca faz requisições HTTP puro para o backend.
- A URL do backend em produção usa HTTPS com terminação SSL no Render.com.

**Mitigação pendente (camada firmware — dívida técnica):**
- O MicroPython do ESP32 deve usar `urequests` com `ssl=True`.
- Adicionar token de autenticação (Bearer ou HMAC-SHA256) nos headers do POST.
- Registrado como issue para a entrega 2.0 do firmware.

**Status:** ⚠ Mitigado no frontend; dívida técnica documentada para o firmware.

---

## Evidência de scanning (SCA)

```bash
cd frontend && npm audit
```

Saída salva em: `docs/dashboard/evidencias/npm-audit-output.txt`

O scanning deve ser re-executado a cada PR que altere `package.json` ou `package-lock.json`.

---

## Referências

- OWASP Top 10 2021: A03 Injection (XSS), A02 Cryptographic Failures
- RFC-001 seção 5 (Riscos do Sistema)
- ADR-001 (HTTP polling vs MQTT — decisão de protocolo)
