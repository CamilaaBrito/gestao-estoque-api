# Gestão de Estoque API — Suite de Testes

> Projeto de portfólio demonstrando habilidades em **automação de testes** e **testes de performance** para uma API REST de gestão de estoque.

---

##  Objetivo

Este repositório contém uma **suíte de testes** desenvolvida para a API REST de Gestão de Estoque, cobrindo três camadas de qualidade:

-  **Testes de Integração (Automação):** Validação de regras de negócio, fluxos de autenticação e movimentações de estoque.
-  **Testes de Segurança:** Validação de rotas protegidas contra tokens inválidos, ausentes e expirados.
-  **Testes de Performance (k6):** Análise do comportamento da API sob diferentes perfis de carga.

---

##  Stack Utilizada

| Camada | Tecnologia |
| :--- | :--- |
| **Runtime / API** | Node.js + Express |
| **Autenticação** | JSON Web Token (JWT) |
| **Documentação API** | Swagger UI + YAML |
| **Test Runner** | [Mocha](https://mochajs.org/) |
| **Asserções** | [Chai](https://www.chaijs.com/) |
| **Requisições HTTP (testes)** | [Supertest](https://github.com/ladjs/supertest) |
| **Relatórios de Integração** | [Mochawesome](https://github.com/adamgruber/mochawesome) |
| **Testes de Performance** | [k6 (Grafana)](https://k6.io/) |
| **Variáveis de Ambiente** | [dotenv](https://github.com/motdotla/dotenv) |

---

## Estrutura de Diretórios

```
gestao-estoque-api/
│
├── src/                        # Código-fonte da API
│   ├── app.js
│   ├── server.js
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── test/                       # Suíte de Testes
│   ├── automation/             # Testes de Integração (Mocha + Chai)
│   │   ├── autorizacao.test.js     # Testes de segurança (token inválido/expirado)
│   │   ├── cadastro.test.js        # Testes de cadastro de itens (POST/GET)
│   │   ├── login.test.js           # Testes de autenticação
│   │   └── movimentacoes.test.js   # Testes de entrada e saída de estoque
│   │
│   └── performance/            # Testes de Performance (k6)
│       ├── cadastrosSimultaneos.test.js  # Script base de referência
│       ├── loadTest.test.js              # Teste de carga (uso normal)
│       ├── stressTest.test.js            # Teste de estresse (limite do sistema)
│       ├── soakTest.test.js              # Teste de resistência (longa duração)
│       ├── spikeTest.test.js             # Teste de pico (tráfego abrupto)
│       └── Performance_Report.md         # Relatório de resultados de performance
│
├── fixtures/                   # Dados estáticos reutilizáveis nos testes
│   ├── postItems.json
│   ├── postLogin.json
│   └── postEntradaItem.json
│
├── helpers/                    # Funções auxiliares reutilizáveis
│   ├── autenticacao.js         # Helper para obter token JWT
│   ├── criarItem.js            # Helper para criar item via API
│   └── itemFactory.js          # Gerador de itens aleatórios únicos
│
├── docs/                       # Documentação Swagger
├── .gitignore
└── package.json
```

---

##  Configuração do `.env`

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
BASE_URL="http://localhost:3000"
```

> **Observação:** A variável `BASE_URL` é lida pelos testes de integração via `process.env` (Node.js/dotenv) e pelos testes de performance via `__ENV` (k6).

---

##  Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) v18 ou superior
- [k6](https://k6.io/docs/get-started/installation/) instalado globalmente (para testes de performance)

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar a API

```bash
npm start
```

> A API ficará disponível em `http://localhost:3000`.

### 3. Executar os Testes de Integração

```bash
# Roda todos os testes e exibe resultado no terminal
npm test

# Roda os testes e gera relatório HTML (Mochawesome)
npm run test:report
```

### 4. Executar os Testes de Performance (k6)

Certifique-se de que a API está rodando antes de executar os testes de performance.

```bash
# Teste de Carga (Load Test) — uso normal/pico esperado
k6 run test/performance/loadTest.test.js

# Teste de Estresse (Stress Test) — aumenta a carga até o limite
k6 run test/performance/stressTest.test.js

# Teste de Resistência (Soak Test) — carga constante por longa duração
k6 run test/performance/soakTest.test.js

# Teste de Pico (Spike Test) — simula tráfego abrupto (ex: Black Friday)
k6 run test/performance/spikeTest.test.js
```

> **Tip:** Passe a `BASE_URL` como variável de ambiente do k6 se precisar apontar para outro ambiente:
> ```bash
> k6 run -e BASE_URL=http://meu-servidor.com test/performance/loadTest.test.js
> ```

---

## Geração de Relatórios

### Relatório de Integração (Mochawesome)

O `npm run test:report` gera automaticamente uma pasta `mochawesome-report/` com um dashboard HTML interativo contendo:
- Total de testes passados/falhados
- Duração de cada teste
- Detalhes de erros por caso de teste

### Relatório de Performance (k6 Web Dashboard)

Para gerar um relatório HTML interativo durante a execução do k6:

```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-report.html k6 run test/performance/loadTest.test.js
```

> Um dashboard em tempo real ficará disponível em `http://127.0.0.1:5665` durante a execução. O arquivo `html-report.html` é gerado ao final.

Os resultados consolidados de todas as execuções estão documentados em [`test/performance/Performance_Report.md`](./test/performance/Performance_Report.md).

---

##  Documentação de Dependências

### Dependências de Produção

- **Express:** https://expressjs.com/
- **Jsonwebtoken:** https://github.com/auth0/node-jsonwebtoken
- **Swagger UI Express:** https://github.com/scottie1984/swagger-ui-express
- **YAML JS:** https://github.com/jeremyfa/yaml.js

### Dependências de Desenvolvimento

- **Mocha:** https://mochajs.org/
- **Chai:** https://www.chaijs.com/
- **Supertest:** https://github.com/ladjs/supertest
- **Dotenv:** https://github.com/motdotla/dotenv
- **Mochawesome:** https://github.com/adamgruber/mochawesome

---

##  Ferramenta k6 — Guia Rápido

[k6](https://k6.io/) é uma ferramenta de testes de performance open-source desenvolvida pela Grafana Labs. Ela executa scripts JavaScript em um motor de alta performance (escrito em Go), permitindo simular milhares de usuários virtuais com baixo consumo de recursos.

### Conceitos Usados neste Projeto

| Conceito | Descrição |
| :--- | :--- |
| **VU (Virtual User)** | Usuário virtual simulado. Cada VU executa o script `default function` em loop. |
| **stages** | Define fases de carga com `duration` (duração) e `target` (VUs desejados). |
| **thresholds** | Critérios de aceitação automáticos. O teste "falha" se os thresholds não forem atingidos. |
| **setup()** | Função executada **uma única vez** antes do teste. Usada para autenticação e setup de dados. |
| **check()** | Validações leves dentro do fluxo (equivalente ao `expect` do Chai). |
| **`__ENV`** | Variáveis de ambiente no k6. Equivalente ao `process.env` do Node.js. |
| **`__VU`** | ID único do Virtual User atual. Usado para gerar dados únicos por usuário. |
| **`__ITER`** | Número da iteração atual do VU. Garante unicidade nos nomes dos itens criados. |
| **`open()`** | Lê arquivos estáticos do disco no estágio de inicialização. Usado para carregar fixtures JSON. |

### Tipos de Teste Implementados

| Tipo | Arquivo | Objetivo | VUs Simulados |
| :--- | :--- | :--- | :--- |
| **Load Test** | `loadTest.test.js` | Comportamento sob uso diário esperado | Até 50 |
| **Stress Test** | `stressTest.test.js` | Encontrar o ponto de ruptura do sistema | Até 100 |
| **Soak Test** | `soakTest.test.js` | Detectar memory leaks em execução longa | 30 constantes |
| **Spike Test** | `spikeTest.test.js` | Simular tráfego explosivo e inesperado | Até 150 |

---

##  Observações

- **Banco em Memória:** A API utiliza um banco de dados em memória. Ao reiniciar o servidor, todos os dados são perdidos. Os testes foram projetados para serem **autossuficientes**, criando seus próprios dados antes de cada validação.

- **Unicidade nos Testes de Performance:** Para evitar erros `409 Conflict` (item duplicado) durante testes de carga paralelos, o nome de cada item gerado combina `Date.now()`, `__VU` e `__ITER`, garantindo unicidade mesmo com centenas de usuários simultâneos.

- **Testes de Segurança:** O `autorizacao.test.js` testa **todas as rotas protegidas** de uma só vez usando um array de rotas. Para adicionar novos endpoints protegidos, basta incluí-los no array `rotasProtegidas`.

- **Soak Test em Produção:** A duração atual do Soak Test é de ~6 minutos (fins didáticos). Em ambiente real, o recomendado é executar por **4h a 12h** para detectar vazamentos de memória graduais.