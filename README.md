# 🔌 QA API + Cucumber - restful-booker

[![API Tests](https://github.com/ThomasTDS/restful-booker/actions/workflows/tests.yml/badge.svg)](https://github.com/ThomasTDS/restful-booker/actions/workflows/tests.yml)

## Descrição

Este repositório contém testes automatizados da API pública **[restful-booker](https://restful-booker.herokuapp.com)** utilizando **Playwright** (camada `request`, sem navegador), **Cucumber (BDD/Gherkin)** e uma camada de **API Clients** que cumpre, para testes de API, o mesmo papel que o Page Object Model cumpre em testes de UI: encapsular as chamadas HTTP e esconder detalhes de endpoint/headers dos steps e dos cenários.

O objetivo é praticar testes de API "de verdade": autenticação, CRUD completo, diferença entre PUT e PATCH, e validação de regras de autorização.

---

## Estrutura do Projeto

```text
qa-api-restful-booker/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── bug_report.md   # Template de Issue para bugs reais
│   └── workflows/
│       └── tests.yml       # Pipeline de CI (push, PR e execução diária agendada)
├── docs/
│   └── test-cases.md       # Matriz de rastreabilidade dos test cases
├── features/               # Cenários em Gherkin (.feature)
├── steps/                  # Implementação dos steps do Cucumber
├── api/                    # API Clients (AuthApiClient, BookingApiClient)
├── types/                  # Interfaces TypeScript (shape dos dados da API)
├── reports/                # Relatório HTML gerado a cada execução (não versionado)
├── cucumber.js             # Configuração do Cucumber
├── package.json            # Dependências e scripts NPM
├── tsconfig.json           # Configuração do TypeScript
├── LICENSE
└── README.md               # Este arquivo
```

---

### Instalar Dependências
```
npm install
```

Não é necessário rodar `npx playwright install`: como são testes de API, nenhum navegador é aberto — só a camada `request` do Playwright é usada para fazer as chamadas HTTP.

### Rodar todos os testes
```
npm test
```

Ao final da execução, um relatório HTML é gerado em `reports/cucumber-report.html` (não versionado).

### Rodar contra outra URL

Por padrão os testes apontam para `https://restful-booker.herokuapp.com`. Para rodar contra outro ambiente (ex: uma instância local ou de staging), defina a variável de ambiente `BASE_URL`:

```
# PowerShell
$env:BASE_URL="http://localhost:3001"; npm test

# bash
BASE_URL=http://localhost:3001 npm test
```

---

### API testada

| Método | Rota          | Função                                             |
|--------|---------------|-----------------------------------------------------|
| POST   | `/auth`       | Gera token de autenticação                          |
| GET    | `/booking`    | Lista IDs de bookings (aceita filtros)               |
| GET    | `/booking/:id`| Busca um booking específico                          |
| POST   | `/booking`    | Cria um booking                                      |
| PUT    | `/booking/:id`| Atualiza um booking (todos os campos obrigatórios)   |
| PATCH  | `/booking/:id`| Atualiza parcialmente um booking                     |
| DELETE | `/booking/:id`| Remove um booking                                    |

Autenticação: `POST /auth` com `{ "username": "admin", "password": "password123" }` retorna um token, enviado nas chamadas de `PUT`, `PATCH` e `DELETE` via header `Cookie: token=<valor>`.

**Observação de segurança:** `POST /booking` (criação) **não exige autenticação** — qualquer pessoa consegue criar bookings sem token. Isso é uma falha de controle de acesso do próprio app de demonstração, e está coberta explicitamente em [features/create-booking.feature](features/create-booking.feature) como comportamento documentado, não como bug do teste.

---

### Estrutura de Testes e Padrões Aplicados

- BDD / Gherkin: cenários claros e legíveis em `.feature`.
- API Client Objects: `AuthApiClient` e `BookingApiClient` encapsulam as chamadas HTTP, do mesmo jeito que Page Objects encapsulam elementos de UI.
- Cobertura de autenticação, CRUD completo, PUT vs. PATCH, e casos de acesso não autorizado (403).
- Relatório HTML automatizado a cada execução (`reports/cucumber-report.html`).
- Limpeza automática: o hook `After` remove o booking criado no cenário (via token próprio de limpeza), evitando acúmulo de dados na API pública.
- Integração contínua via GitHub Actions: os testes rodam automaticamente a cada push e pull request para `main`, e também diariamente às 06:00 UTC (ver [.github/workflows/tests.yml](.github/workflows/tests.yml)) para detectar quebras causadas pela própria API pública, com o relatório HTML publicado como artifact do workflow.
- Rastreabilidade de QA: matriz de test cases em [docs/test-cases.md](docs/test-cases.md), com tags `@TC-XXX` em cada `Scenario` e um subconjunto `@smoke` (`npm run test:smoke`) cobrindo os fluxos ponta-a-ponta mais críticos. Bugs reais encontrados são documentados como GitHub Issues usando o template em [.github/ISSUE_TEMPLATE/bug_report.md](.github/ISSUE_TEMPLATE/bug_report.md).
