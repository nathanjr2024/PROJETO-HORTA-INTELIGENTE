# Peer-Audit Recebida — A1.8

**Auditado:** Nathan Junior (`feat/a1.8-nathan-uc04-nav-docs`)  
**Auditor:** Kauã Martins  
**Data:** 2026-06-14  
**Checklist base:** Rubrica A1.8 — critérios de qualidade e segurança

---

## Achados

### F1 — Slider de threshold sem validação visual imediata

**Localização:** `frontend/src/components/Settings/Settings.jsx` — seção do slider  
**Severidade:** Baixa  
**Descrição:** O slider aceita qualquer valor entre 10 e 90 no DOM, mas a validação
de range só ocorre no momento de salvar (dentro de `useSettings.salvar`). Se o usuário
digitar um valor fora do range via teclado em um campo numérico associado, o erro
só aparece após o clique em "Salvar", criando friction desnecessária.  
**Sugestão:** Adicionar `min={10}` e `max={90}` ao input type=range (já presente) e
considerar mostrar feedback inline (`valor inválido`) se o campo de exibição for
tornando editável.

---

### F2 — AppShell não tem teste de unidade próprio

**Localização:** `frontend/src/components/AppShell/AppShell.jsx`  
**Severidade:** Baixa  
**Descrição:** O AppShell é o componente de orquestração central (navegação entre 4 telas),
mas não possui nenhum teste Vitest. Uma regressão na lógica de tab-switching
(ex: clicar em "Histórico" abrir Configurações) não seria detectada automaticamente.  
**Sugestão:** Adicionar 1 teste de smoke: renderiza Dashboard por padrão e ao clicar
em data-testid="nav-configuracoes" renderiza Settings.

---

### F3 — Threat model menciona `drop: ['console']` no build sem confirmar configuração

**Localização:** `docs/dashboard/threat-model.md` — Ameaça 2  
**Severidade:** Média  
**Descrição:** O documento afirma que `vite build` aplica `drop: ['console']`, mas
o `vite.config.js` atual não contém essa configuração explicitamente. Se alguém
confiar nessa mitigação sem verificar, logs com dados sensíveis podem chegar ao
bundle de produção.  
**Sugestão:** Adicionar `build: { minify: 'esbuild', esbuildOptions: { drop: ['console'] } }`
ao `vite.config.js` ou remover a afirmação do threat model e documentar como dívida técnica.
