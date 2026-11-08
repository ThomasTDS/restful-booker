# 🔌 QA API + Cucumber - restful-booker

[🇧🇷 Português](README.md) | [🇺🇸 English](README.en.md) | 🇪🇸 Español

[![API Tests](https://github.com/ThomasTDS/restful-booker/actions/workflows/tests.yml/badge.svg)](https://github.com/ThomasTDS/restful-booker/actions/workflows/tests.yml)
[![Smoke Tests](https://github.com/ThomasTDS/restful-booker/actions/workflows/smoke-tests.yml/badge.svg)](https://github.com/ThomasTDS/restful-booker/actions/workflows/smoke-tests.yml)
[![codecov](https://codecov.io/gh/ThomasTDS/restful-booker/branch/main/graph/badge.svg)](https://codecov.io/gh/ThomasTDS/restful-booker)

## Descripción

Este repositorio contiene pruebas automatizadas de la API pública **[restful-booker](https://restful-booker.herokuapp.com)** utilizando **Playwright** (capa `request`, sin navegador), **Cucumber (BDD/Gherkin)** y una capa de **API Clients** que cumple, para pruebas de API, el mismo papel que el Page Object Model cumple en pruebas de UI: encapsular las llamadas HTTP y ocultar los detalles de endpoints/headers de los steps y de los escenarios.

El objetivo es practicar pruebas de API "de verdad": autenticación, CRUD completo, diferencia entre PUT y PATCH, y validación de reglas de autorización.

---

## Estructura del Proyecto

```text
qa-api-restful-booker/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── bug_report.md   # Plantilla de Issue para bugs reales
│   ├── workflows/
│   │   ├── tests.yml       # Pipeline de CI completo (push/PR a main y ejecución diaria programada) — check obligatorio para el merge
│   │   └── smoke-tests.yml # Smoke suite en cualquier push, para feedback rápido en ramas de feature
│   └── CODEOWNERS          # Revisor obligatorio de Pull Requests en la rama main
├── docs/
│   └── test-cases.md       # Matriz de trazabilidad de los test cases
├── features/               # Escenarios en Gherkin (.feature)
├── steps/                  # Implementación de los steps de Cucumber
├── api/                    # API Clients (AuthApiClient, BookingApiClient)
├── types/                  # Schemas Zod y tipos TypeScript derivados (estructura de los datos de la API)
├── tests/unit/             # Pruebas unitarias aisladas de api/ y types/ (sin red, sin la API pública)
├── reports/                # Reporte HTML, cobertura, etc. generados en cada ejecución (no versionado)
├── cucumber.js             # Configuración de Cucumber
├── vitest.config.mts       # Configuración de Vitest (pruebas unitarias + cobertura)
├── codecov.yml             # Gate de cobertura en Codecov (patch 100%, project con margen de 1%)
├── eslint.config.js        # Configuración de ESLint
├── .prettierrc             # Configuración de Prettier
├── package.json            # Dependencias y scripts NPM
├── tsconfig.json           # Configuración de TypeScript
├── LICENSE
├── SECURITY.md             # Política de seguridad y cómo reportar vulnerabilidades
├── README.md               # Versión en portugués
├── README.en.md            # Versión en inglés
└── README.es.md            # Este archivo (español)
```

---

### Instalar Dependencias

```
npm install
```

No es necesario ejecutar `npx playwright install`: como son pruebas de API, no se abre ningún navegador — solo se usa la capa `request` de Playwright para hacer las llamadas HTTP.

### Ejecutar todas las pruebas

```
npm test
```

Al final de la ejecución, se genera un reporte HTML en `reports/cucumber-report.html` (no versionado).

### Ejecutar solo la smoke suite

```
npm run test:smoke
```

Ejecuta solo los flujos de punta a punta más críticos (autenticación, creación, consulta, actualización y eliminación — ver [docs/test-cases.md](docs/test-cases.md)). Como `cucumber.js` siempre escribe en el mismo archivo, ejecutar esto después de `npm test` **sobrescribe** `reports/cucumber-report.html` con solo esos 5 escenarios.

### Ejecutar las pruebas unitarias

```
npm run test:unit  # vitest run
npm run coverage   # vitest run --coverage (genera reports/coverage/lcov.info)
```

Pruebas aisladas de `api/` y `types/`, en las que `AuthApiClient`/`BookingApiClient` reciben un fake del `APIRequestContext` de Playwright en lugar de llamar a la API pública — no hacen ninguna llamada de red, por lo que se ejecutan en milisegundos y no dependen de que la API pública esté disponible. Complementan los escenarios de `steps/`, que son pruebas de integración reales contra `restful-booker`.

### Lint y formato

```
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint (typescript-eslint, con información de tipos)
npm run format:check  # Prettier, solo verifica
npm run format        # Prettier, aplica las correcciones
```

El CI ejecuta `typecheck`, `lint`, `format:check`, `npm audit` y las pruebas unitarias (con cobertura) antes de las pruebas de integración, de modo que los cambios con problemas de tipos, estilo, vulnerabilidades en dependencias o lógica de los API Clients fallan rápido, sin perder tiempo llamando a la API pública.

Un hook de pre-commit (Husky + lint-staged, instalado automáticamente vía `npm install`) ejecuta `eslint --fix` y `prettier --write` sobre los archivos en staging antes de cada commit, por lo que la mayoría de los problemas de lint/formato ya se corrigen localmente antes de llegar al CI.

### Ejecutar contra otra URL

Por defecto, las pruebas apuntan a `https://restful-booker.herokuapp.com`. Para ejecutarlas contra otro entorno (por ejemplo, una instancia local o de staging), define la variable de entorno `BASE_URL`:

```
# PowerShell
$env:BASE_URL="http://localhost:3001"; npm test

# bash
BASE_URL=http://localhost:3001 npm test
```

---

### API probada

| Método | Ruta           | Función                                                  |
| ------ | -------------- | -------------------------------------------------------- |
| POST   | `/auth`        | Genera un token de autenticación                         |
| GET    | `/booking`     | Lista los IDs de bookings (acepta filtros)               |
| GET    | `/booking/:id` | Obtiene un booking específico                            |
| POST   | `/booking`     | Crea un booking                                          |
| PUT    | `/booking/:id` | Actualiza un booking (todos los campos son obligatorios) |
| PATCH  | `/booking/:id` | Actualiza parcialmente un booking                        |
| DELETE | `/booking/:id` | Elimina un booking                                       |

Autenticación: `POST /auth` con `{ "username": "admin", "password": "password123" }` devuelve un token, que se envía en las llamadas `PUT`, `PATCH` y `DELETE` mediante el header `Cookie: token=<valor>`.

**Observación de seguridad:** `POST /booking` (creación) **no requiere autenticación** — cualquier persona puede crear bookings sin token. Esto es una falla de control de acceso de la propia aplicación de demostración, y está cubierta explícitamente en [features/create-booking.feature](features/create-booking.feature) como comportamiento documentado, no como un bug de la prueba.

---

### Estructura de Pruebas y Patrones Aplicados

- BDD / Gherkin: escenarios claros y legibles en `.feature`.
- API Client Objects: `AuthApiClient` y `BookingApiClient` encapsulan las llamadas HTTP, del mismo modo que los Page Objects encapsulan elementos de UI.
- Validación de schema con [Zod](https://zod.dev/): las respuestas de la API se validan en tiempo de ejecución contra los schemas de `types/booking.ts` (única fuente de verdad, con los tipos TypeScript derivados vía `z.infer`), no solo se tipan por anotación — si la API cambia el formato de una respuesta, la prueba falla con un mensaje claro en lugar de pasar silenciosamente o romperse más adelante.
- Cobertura de autenticación, CRUD completo, PUT vs. PATCH y casos de acceso no autorizado (403).
- Auditoría de dependencias vulnerables con `npm audit`, ejecutada en el CI justo después de los checks de tipos/lint/formato y antes de las pruebas — bloquea el merge si encuentra cualquier vulnerabilidad conocida en una dependencia instalada, ya sea directa o de desarrollo.
- Pirámide de pruebas: además de los escenarios BDD (`steps/`), que son pruebas de integración reales contra `restful-booker`, `tests/unit/` cubre `api/` y `types/` de forma aislada, con un fake del `APIRequestContext` de Playwright en lugar de la llamada de red — sin red y sin depender de que la API pública esté disponible. La cobertura se mide con [`@vitest/coverage-v8`](https://vitest.dev/guide/coverage.html) y se envía a [Codecov](https://codecov.io/gh/ThomasTDS/restful-booker), con un gate del 100% en código nuevo/modificado por PR (`codecov.yml`). El envío usa `secrets.CODECOV_TOKEN` con `fail_ci_if_error: false`: hasta que el repositorio esté conectado en codecov.io y el secret esté configurado, este paso se ejecuta sin romper el CI, solo que sin actualizar el badge.
- Reporte HTML automatizado en cada ejecución (`reports/cucumber-report.html`).
- Limpieza automática: el hook `After` elimina el booking creado en el escenario (con un token de limpieza propio), evitando la acumulación de datos en la API pública.
- Retry automático (`retry: 1` en `cucumber.js`): un escenario que falla se ejecuta una segunda vez antes de reportarse como fallido, amortiguando la inestabilidad transitoria de la API pública de demostración.
- Integración continua con GitHub Actions en dos workflows: la suite completa (ver [.github/workflows/tests.yml](.github/workflows/tests.yml)) se ejecuta en cada push y pull request a `main` y también diariamente a las 06:00 UTC, para detectar fallos causados por la propia API pública, con el reporte HTML publicado como artifact del workflow — es el check obligatorio para el merge; y la smoke suite (ver [.github/workflows/smoke-tests.yml](.github/workflows/smoke-tests.yml)) se ejecuta en cada push a cualquier rama, dando feedback rápido mientras se trabaja en una feature, antes de abrir el PR.
- Reportes publicados en GitHub Pages en cada push a `main`: **[thomastds.github.io/restful-booker](https://thomastds.github.io/restful-booker/)** reúne el reporte de ejecución de Cucumber y el reporte de cobertura de Vitest, siempre con el resultado más reciente.
- Dependencias actualizadas automáticamente por Dependabot (npm y GitHub Actions, semanalmente — ver [.github/dependabot.yml](.github/dependabot.yml)). Los PRs de patch/minor con CI en verde se mergean automáticamente ([.github/workflows/dependabot-auto-merge.yml](.github/workflows/dependabot-auto-merge.yml)); los bumps de major requieren revisión manual.
- Trazabilidad de QA: matriz de test cases en [docs/test-cases.md](docs/test-cases.md), con tags `@TC-XXX` en cada `Scenario` y un subconjunto `@smoke` (`npm run test:smoke`) que cubre los flujos de punta a punta más críticos. Los bugs reales encontrados se documentan como GitHub Issues usando la plantilla de [.github/ISSUE_TEMPLATE/bug_report.md](.github/ISSUE_TEMPLATE/bug_report.md).

---

### Flujo de Trabajo

La rama `main` está protegida: todo cambio pasa por un Pull Request, y el merge solo se habilita después de que el check de CI (`test`) pase. Flujo estándar:

```
git checkout -b mi-rama
# editar, ejecutar npm test localmente
git push -u origin mi-rama
# abrir el PR en GitHub, esperar a que el check "test" pase y hacer el merge
```
