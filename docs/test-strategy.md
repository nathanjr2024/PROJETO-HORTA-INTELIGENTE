# Estratégia de Testes — Horta Inteligente

## 1. Cabeçalho

| Campo | Valor |
|-------|-------|
| Equipe | Nathan Junior, Bruno Avelino, Kauã Martins |
| Versão | v0.1 |
| Data | 2026-05-10 |
| RFC de referência | [`docs/rfc/rfc-001-arquitetura-mvp.md`](../rfc/rfc-001-arquitetura-mvp.md) |
| Marco | Marco 3 do PI |
| Stack | Python 3.11 · FastAPI · SQLAlchemy · pytest · GitHub Actions |

---

## 2. Escopo dessa estratégia

**O que cobre na v0.1:**
- Os UCs do fluxo principal: **UC-01** (visualizar leituras dos sensores), **UC-02** (irrigação automática por threshold), **UC-03** (acionar irrigação manualmente) e **UC-04** (configurar limites de umidade).
- A API REST que recebe os dados do ESP32 (`POST /leituras`) e a que o frontend consome (`GET /leituras`, `POST /irrigacao/acionar`).
- A lógica de decisão de irrigação — essa é a parte mais crítica porque um erro aqui desperdiça água ou deixa a planta secar.

**O que fica pra v0.2:**
- Testes E2E com frontend — a UI ainda não tá estabilizada, não faz sentido escrever teste pra HTML que vai mudar.
- UC-05 (histórico de leituras com volume real de dados) — precisa de um seed de 500k registros que ainda não temos estruturado.
- Testes com o ESP32 físico integrado ao CI — não temos como rodar hardware no GitHub Actions agora.

**Premissas:**
- A API de referência (`aula-13/assets/api-horta-ref/`) é usada como alvo dos testes de contrato enquanto a nossa API própria não tá funcional.
- Nenhum teste depende de hardware real — tudo usa mocks ou a API de referência.

---

## 3. Matriz risco → teste

| UC | Risco técnico concreto | Nível | Justificativa |
|----|------------------------|-------|---------------|
| UC-01 — Visualizar leituras | O sensor envia `umidade` mas a API renomeia o campo pra `soil_humidity` num refactor; o frontend passa a receber `undefined` e mostra "---" sem lançar nenhum erro. O bug pode ficar dias sem ser notado | Contrato (Integration) | Unit não testa a fronteira entre firmware e API porque mocka o repositório. E2E com hardware físico é inviável no CI. Contract test congela o schema que o ESP32 envia e quebra no CI se alguém mudar silenciosamente |
| UC-02 — Irrigação automática | A função retorna `true` pra irrigar quando umidade tá em 65% e o threshold é 60%, mas com o sinal invertido ela irriga solo encharcado — desperdício de água e possível dano à planta | Unit | A lógica `deve_irrigar(umidade, threshold)` é pura, sem dependência de banco ou rede. Unit cobre todos os casos de borda com custo mínimo. Integration não agrega nada aqui |
| UC-03 — Acionar irrigação manual | O endpoint `POST /irrigacao/acionar` retorna 200 mas não envia o comando pro hardware por falha silenciosa na camada de saída | Integration | Unit testa a função isolada mas não pega falha na comunicação com o driver. Integration com mock do driver captura esse problema. E2E seria caro e instável sem hardware real |
| UC-04 — Configurar limites | Um valor de threshold negativo tipo `-5` passa pela validação e persiste no banco, o que faz a irrigação ficar acionando o tempo todo | Unit | Validação de entrada é lógica pura. Unit consegue testar todos os casos inválidos rapidamente, e qualquer mudança na validação vai aparecer imediatamente |
| UC-05 — Histórico de leituras | Query sem índice em `SELECT * FROM leituras WHERE data BETWEEN ...` com 500k registros demora mais de 10 segundos, deixando o site inutilizável | System — Performance (v0.2) | Unit e integration não revelam degradação com volume real de dados. Precisa de teste de carga com dataset representativo. Fica pra v0.2 |

### Linhas adicionadas na v0.2 (A1.8)

| UC | Risco técnico concreto | Nível | Justificativa |
|----|------------------------|-------|---------------|
| UC-03 — Controle Manual (frontend) | Botão "Acionar" dispara múltiplos cliques antes da resposta chegar, enviando comandos duplicados para a bomba | Unit (Vitest) | Debounce via guard `actionStatus === 'sending'` — teste de unidade verifica que estado `sending` desabilita o botão durante requisição in-flight |
| UC-04 — Configurações (frontend) | Threshold salvo como string `"50"` em vez de número `50` faz a comparação `umidadeSolo < threshold` retornar `true` sempre (coerção JS) | Unit (Vitest) | Lógica pura de validação e conversão de tipo — `Number(threshold)` explícito no `useSettings.salvar`. Unit test cobre sem depender de UI |
| UC-05 — Histórico (frontend) | Renderizar 288 pontos no Recharts sem memoização trava o navegador ao trocar de período (re-render desnecessário) | System (manual) | Verificado manualmente: `React.memo` nos wrappers de gráfico e `useMemo` no hook garantem re-render só quando `periodo` muda |
| E2E alerta → histórico | Usuário não consegue navegar da tela de alerta para o histórico — fluxo crítico de diagnóstico da planta | E2E (Playwright) | Playwright percorre o caminho completo: Dashboard → alerta visível → clique na aba Histórico → gráfico renderizado |

---

## 4. Níveis de teste aplicados ao projeto

**Unit.** Cobre as funções de domínio que não dependem de banco, rede ou hardware: `deve_irrigar()`, `validar_threshold()`, `calcular_media_leituras()`. Rodam em menos de 5 segundos e são obrigatórios pra merge. Ficam em `tests/unit/`.

**Integration.** Principal aposta da v0.1. Cobre a fronteira entre os módulos — especialmente o contract test que valida o que o ESP32 manda contra o que a API espera. Roda no CI em todo PR. Fica em `tests/integration/` e `tests/contract/`.

**System / E2E.** Decidimos não usar na v0.1 porque a UI ainda não existe e o hardware não roda no CI. Entra na v0.2 quando o frontend tiver uma versão minimamente navegável e conseguirmos simular o sensor.

**Acceptance.** Também fora da v0.1 pelos mesmos motivos — sem ambiente de staging com hardware integrado não dá pra validar o sistema ponta a ponta de forma estável.

---

## 5. Técnica moderna — ADR: Contract Testing

**Contexto.**
O projeto tem uma fronteira que consideramos a mais arriscada: o firmware do ESP32 e a API backend evoluem de forma independente. O firmware é compilado e instalado fisicamente no dispositivo — não tem como fazer deploy rápido se algo quebrar. Quando o ESP32 manda `POST /leituras` com `{"temperatura": 28.5, "umidade": 62, "nivel_agua": 80}`, ele assume que esse schema vai ser aceito pra sempre. Se alguém refatora a API e renomeia `umidade` pra `soil_humidity`, o sensor continua mandando o campo antigo, a API devolve 200 (porque o campo é ignorado silenciosamente), e o banco passa a salvar `null` pra umidade. O dashboard mostra "---" pra todo mundo e ninguém entende o que aconteceu.

Percebemos isso quando discutimos o cenário de manutenção: qualquer mudança no schema sem um teste quebrando antes chegaria em produção sem aviso. Isso convenceu a gente de que a fronteira ESP32 ↔ API era o lugar certo pra investir.

**Decisão.**
Vamos usar **contract testing** com `pytest` + `jsonschema`. O schema que o ESP32 publica fica versionado em `tests/contract/schemas/leituras_v1.json`. Qualquer PR que altere o endpoint `/leituras` precisa atualizar esse schema explicitamente — e o CI vai quebrar se não atualizar. O teste roda contra a API de referência da aula enquanto a nossa não tá pronta.

**Alternativas rejeitadas.**

*E2E com hardware real:* a ideia seria rodar o ESP32 físico no CI e testar o sistema completo. Descartamos porque não dá pra conectar hardware no GitHub Actions — precisaria de um runner dedicado com o dispositivo, o que tá fora do escopo do PI. Além disso, testes E2E com hardware são notoriamente instáveis (Wi-Fi, conexão serial, timing).

*Mock completo da API no lado do firmware:* manteriamos um mock da API nos testes do firmware. O problema é óbvio: se a API mudar e a gente não atualizar o mock, o teste passa mesmo com o sistema quebrado. É exatamente o cenário que queremos evitar.

**Consequências.**

*O que ganhamos:* qualquer mudança de schema que quebre o firmware é detectada no CI antes do merge, não em produção. O arquivo de schema vira documentação viva do contrato entre sensor e API.

*O que pagamos:* toda vez que o firmware mudar o payload, a gente tem que atualizar o schema manualmente. Estimamos uns 20-30 minutos por mudança. Se o schema mudar mais de duas vezes por sprint, vale reavaliar se a burocracia tá valendo.

**Quando não usar.**
Se o projeto migrar pra MQTT — que é o protocolo assíncrono mais comum em IoT mais avançado — contract testing via HTTP não se aplica mais. O contrato seria validado de outra forma (schema de tópico MQTT, Avro, etc). Também revisaríamos se a API virar um monolito com consumer único interno, embora isso não pareça o caminho do projeto.

---

## 6. Estratégia de regressão

Quando um PR é aberto contra `main`, o GitHub Actions executa automaticamente:

1. **Suíte unit** (`tests/unit/`) — obrigatória, bloqueia merge se falhar. Cobre a lógica de irrigação e validação de threshold. Tempo alvo: menos de 30 segundos.
2. **Suíte de contrato** (`tests/contract/`) — obrigatória, bloqueia merge. Valida o schema do ESP32 contra a API. Tempo alvo: menos de 15 segundos (depende da API de referência rodando como serviço no CI).
3. **Suíte de integration** (`tests/integration/`) — roda no CI mas só alerta na v0.1, sem bloquear merge. O resultado aparece como comentário no PR. Passa a bloquear na v0.2 quando os mocks estiverem mais estáveis.

Sobre como detectamos regressão: se um teste que passou no commit anterior começa a falhar sem mudança intencional, é regressão e a PR não pode ser mergeada. Teste passando local mas falhando no CI é problema de ambiente — investigamos antes de mexer no teste.

**Regra de ouro:** todo bug novo encontrado vira um teste permanente antes da correção. O fluxo é: escreve o teste que reproduz o bug → confirma que ele falha → faz o fix. Sem exceção.

---

## 7. Evidência executável

| Arquivo | Nível | UC coberto |
|---------|-------|------------|
| [`tests/contract/test_api_leituras.py`](../../tests/contract/test_api_leituras.py) | Contrato | UC-01 |

Extrato do teste principal:

```python
def test_api_aceita_payload_do_esp32_retorna_201(self):
    """
    A API deve aceitar o payload do ESP32 e retornar HTTP 201.
    Âncora: UC-01, linha 1 da matriz de risco.
    """
    response = requests.post(f"{BASE_URL}/leituras", json=PAYLOAD_VALIDO, timeout=5)

    assert response.status_code == 201, (
        f"API retornou {response.status_code} em vez de 201. "
        f"RISCO: firmware não consegue registrar leituras."
    )
```

Log de execução: [`docs/test-strategy/evidencias/pytest_output.txt`](./evidencias/pytest_output.txt)
— 5 testes executados, 5 passando, tempo total 1.23s. Rodado em 2026-05-10 contra a API de referência.

---

## 8. Próximos passos (v0.2 — Marco 4)

1. Implementar os testes de integration de verdade pro UC-03 (acionar irrigação manual) com mock do driver de hardware — hoje só temos o contract test do UC-01.
2. Mover a suíte de integration de "só alerta" pra "bloqueia merge" depois que os mocks estiverem estáveis.
3. Com o frontend minimamente funcionando, adicionar 1 teste E2E cobrindo o fluxo: visualizar leitura atual → acionar irrigação manual.
4. Montar o dataset de 500k registros e medir o tempo da query de histórico com e sem índice (UC-05).
5. Avaliar property-based testing com `hypothesis` pra função `deve_irrigar` — gerar combinações de umidade e threshold pra cobrir bordas que a gente não pensou enumerar manualmente.
