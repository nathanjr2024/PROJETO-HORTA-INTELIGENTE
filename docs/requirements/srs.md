# Especificação de Requisitos de Software (SRS)

**Projeto:** Horta Inteligente  
**Versão:** 0.1  
**Equipe:** Nathan Junior, Bruno Avelino e Kauã Martins

---

## 1. Requisitos Funcionais

### RF-001: Leitura dos Sensores

**Descrição:** O dispositivo na horta (microcontrolador) **DEVE** ler os sensores de umidade do solo e de nível do reservatório de água a cada **30 segundos**.  
**Prioridade:** Must Have  
**Critério de Aceitação:** Com o dispositivo ligado, o banco de dados recebe uma nova leitura a cada 30 segundos, contendo os dois valores.

---

### RF-002: Envio dos Dados para o Site

**Descrição:** O dispositivo **DEVE** enviar as leituras dos sensores para o servidor via Wi-Fi, para que o site possa exibir os dados atualizados.  
**Prioridade:** Must Have  
**Critério de Aceitação:** Após cada leitura, os dados aparecem atualizados no site em até **5 segundos**, desde que haja Wi-Fi disponível.

---

### RF-003: Irrigação Automática

**Descrição:** O dispositivo **DEVE** ligar a bomba d'água automaticamente quando a umidade do solo estiver abaixo de **40%**, e **NÃO DEVE** ligar a bomba se o nível do reservatório estiver abaixo de **10%** (para não queimar a bomba operando sem água).  
**Prioridade:** Must Have  
**Critério de Aceitação:** Com umidade a 35% e reservatório a 50%, a bomba liga. Com umidade a 35% e reservatório a 5%, a bomba não liga e o site exibe o aviso "Reservatório vazio".

---

### RF-004: Desligar a Irrigação

**Descrição:** O dispositivo **DEVE** desligar a bomba quando a umidade do solo atingir **70%**. A bomba **NÃO DEVE** ficar ligada por mais de **10 minutos seguidos**, mesmo que a umidade não suba (proteção contra sensor com defeito).  
**Prioridade:** Must Have  
**Critério de Aceitação:** Com a bomba ligada e umidade subindo para 72%, ela desliga na próxima leitura. Se ficar ligada por 10 minutos sem atingir 70%, ela desliga automaticamente.

---

### RF-005: Painel de Dados no Site

**Descrição:** O site **DEVE** exibir, em tempo real, os valores atuais de umidade do solo e nível do reservatório, e indicar se a bomba está ligada ou desligada.  
**Prioridade:** Must Have  
**Critério de Aceitação:** Ao abrir o site, o usuário vê os três valores sem precisar recarregar a página. Os dados refletem a última leitura disponível.

---

### RF-006: Histórico de Leituras

**Descrição:** O site **DEVE** mostrar um gráfico com as leituras das últimas **24 horas** de umidade do solo e nível do reservatório.  
**Prioridade:** Should Have  
**Critério de Aceitação:** O gráfico exibe corretamente os dados do período. Se não houver dados, exibe a mensagem "Nenhum dado disponível para este período".

---

### RF-007: Login para Acessar o Site

**Descrição:** O site **NÃO DEVE** mostrar os dados nem permitir qualquer ação a quem não estiver logado.  
**Prioridade:** Must Have  
**Critério de Aceitação:** Acessar qualquer página sem estar logado redireciona para a tela de login. Usuário com e-mail e senha corretos consegue entrar.

---

## 2. Requisitos Não-Funcionais

### NFR-001: Velocidade do Site

**Descrição:** O site **DEVE** carregar a tela principal em no máximo **3 segundos** em uma conexão de internet normal.  
**Categoria:** Performance  
**Critério de Aceitação:** Abrindo o site em uma rede de pelo menos 10 Mbps, a página principal fica totalmente carregada em até 3 segundos (medido pelo DevTools do navegador).

---

### NFR-002: Segurança do Login

**Descrição:** As senhas dos usuários **NÃO DEVEM** ser salvas no banco de dados em texto puro — **DEVEM** ser armazenadas com **hash** (ex.: bcrypt).  
**Categoria:** Segurança  
**Critério de Aceitação:** Consultando diretamente o banco de dados, o campo de senha não contém a senha original, apenas uma sequência cifrada.

---

### NFR-003: Consumo de Energia do Dispositivo

**Descrição:** O microcontrolador com sensores ativos e Wi-Fi conectado (sem a bomba ligada) **DEVE** consumir no máximo **150 mA**, para que uma bateria recarregável simples consiga alimentá-lo por horas.  
**Categoria:** Restrição Física  
**Critério de Aceitação:** Medição com multímetro em série com a alimentação do dispositivo, durante 5 minutos sem irrigação ativa, aponta consumo médio ≤ 150 mA.

---

### NFR-004: Tamanho do Código no Microcontrolador

**Descrição:** O programa gravado no microcontrolador **NÃO DEVE** ocupar mais de **1 MB** de armazenamento, deixando espaço livre para futuras atualizações.  
**Categoria:** Restrição Física  
**Critério de Aceitação:** O log de gravação da IDE (Arduino IDE ou PlatformIO) mostra que o binário final ocupa ≤ 1.024 KB de flash.
