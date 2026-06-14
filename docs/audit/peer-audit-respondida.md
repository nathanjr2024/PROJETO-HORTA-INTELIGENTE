# Peer-Audit Respondida — A1.8

**Respondido por:** Nathan Junior  
**Auditoria original de:** Kauã Martins  
**Data de resposta:** 2026-06-14

---

## Respostas aos achados

### F1 — Slider sem validação visual imediata

**Status:** Aceito — dívida técnica  
**Resposta:** O `input[type="range"]` já tem `min={10}` e `max={90}` aplicados via
props React, então o browser bloqueia valores fora do range via arrastar. O cenário
levantado (usuário digitando via teclado em campo associado) não existe na
implementação atual — o slider não tem campo de texto editável, apenas o valor
exibido em `<span>`. O achado é válido como prevenção para futuro campo numérico;
registrado como `TODO` no código.

---

### F2 — AppShell sem teste de unidade

**Status:** Corrigido  
**Resposta:** Teste adicionado em `frontend/src/components/AppShell/AppShell.test.jsx`
cobrindo: (1) renderiza Dashboard por padrão; (2) navega para Configurações ao clicar
no tab correspondente. Incluído no mesmo commit deste arquivo de resposta.

---

### F3 — `drop: ['console']` não configurado no vite.config.js

**Status:** Corrigido — threat model atualizado  
**Resposta:** A afirmação estava incorreta. `drop: ['console']` foi adicionado ao
`vite.config.js` dentro do bloco `build`:

```js
build: {
  minify: 'esbuild',
  rollupOptions: {},
},
```

↓ Atualizado para:

```js
build: {
  minify: 'esbuild',
  esbuildOptions: { drop: ['console'] },
},
```

O `docs/dashboard/threat-model.md` foi atualizado para referenciar a configuração
real ao invés de uma afirmação sem evidência.

---

## Nota sobre o peer-audit de Kauã

A auditoria foi de qualidade. Os 3 achados são acionáveis e têm evidência concreta
(localização de arquivo + código afetado). O achado F3 identificou uma inconsistência
real entre documentação e código — exatamente o tipo de revisão que o processo de
peer-audit deve capturar.
