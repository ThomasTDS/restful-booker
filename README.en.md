# 🔌 QA API + Cucumber - restful-booker

[🇧🇷 Português](README.md) | 🇺🇸 English

[![API Tests](https://github.com/ThomasTDS/restful-booker/actions/workflows/tests.yml/badge.svg)](https://github.com/ThomasTDS/restful-booker/actions/workflows/tests.yml)
[![Smoke Tests](https://github.com/ThomasTDS/restful-booker/actions/workflows/smoke-tests.yml/badge.svg)](https://github.com/ThomasTDS/restful-booker/actions/workflows/smoke-tests.yml)
[![codecov](https://codecov.io/gh/ThomasTDS/restful-booker/branch/main/graph/badge.svg)](https://codecov.io/gh/ThomasTDS/restful-booker)

## Description

This repository contains automated tests for the public **[restful-booker](https://restful-booker.herokuapp.com)** demo API, using **Playwright** (the `request` layer, no browser), **Cucumber (BDD/Gherkin)**, and a layer of **API Clients** that plays the same role for API testing that the Page Object Model plays for UI testing: encapsulating HTTP calls and hiding endpoint/header details from the steps and scenarios.

The goal is to practice "real" API testing: authentication, full CRUD, the difference between PUT and PATCH, and authorization rule validation.

---

## Project Structure

```text
qa-api-restful-booker/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── bug_report.md   # Issue template for real bugs
│   ├── workflows/
│   │   ├── tests.yml       # Full CI pipeline (push/PR to main and daily scheduled run) — required merge check
│   │   └── smoke-tests.yml # Smoke suite on every push, for fast feedback on feature branches
│   └── CODEOWNERS          # Required reviewer for Pull Requests on the main branch
├── docs/
│   └── test-cases.md       # Test case traceability matrix
├── features/               # Gherkin scenarios (.feature)
├── steps/                  # Cucumber step implementations
├── api/                    # API Clients (AuthApiClient, BookingApiClient)
├── types/                  # Zod schemas and derived TypeScript types (shape of the API data)
├── tests/unit/             # Unit tests isolating api/ and types/ (no network, no public API)
├── reports/                # HTML report, coverage, etc. generated on every run (not versioned)
├── cucumber.js             # Cucumber configuration
├── vitest.config.mts       # Vitest configuration (unit tests + coverage)
├── codecov.yml             # Codecov coverage gate (100% on patch, project with a 1% margin)
├── eslint.config.js        # ESLint configuration
├── .prettierrc             # Prettier configuration
├── package.json            # NPM dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── LICENSE
├── SECURITY.md             # Security policy and how to report vulnerabilities
└── README.md               # This file (Portuguese); see README.en.md for English
```

---

### Install Dependencies

```
npm install
```

There's no need to run `npx playwright install`: since these are API tests, no browser is ever opened — only Playwright's `request` layer is used to make HTTP calls.

### Run All Tests

```
npm test
```

At the end of the run, an HTML report is generated at `reports/cucumber-report.html` (not versioned).

### Run Only the Smoke Suite

```
npm run test:smoke
```

Runs only the most critical end-to-end flows (authentication, creation, retrieval, update, and deletion — see [docs/test-cases.md](docs/test-cases.md)). Since `cucumber.js` always writes to the same file, running this after `npm test` **overwrites** `reports/cucumber-report.html` with just those 5 scenarios.

### Run the Unit Tests

```
npm run test:unit  # vitest run
npm run coverage   # vitest run --coverage (generates reports/coverage/lcov.info)
```

Isolated tests for `api/` and `types/`, with `AuthApiClient`/`BookingApiClient` receiving a fake of Playwright's `APIRequestContext` instead of hitting the public API — no network calls at all, so they run in milliseconds and don't depend on the public API being up. They complement the scenarios in `steps/`, which are real integration tests against `restful-booker`.

### Lint and Formatting

```
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint (typescript-eslint, with type information)
npm run format:check  # Prettier, check only
npm run format        # Prettier, applies fixes
```

CI runs `typecheck`, `lint`, `format:check`, and the unit tests (with coverage) before the integration tests, so changes with a type, style, or API-Client-logic problem fail fast, without spending time hitting the public API.

A pre-commit hook (Husky + lint-staged, installed automatically via `npm install`) runs `eslint --fix` and `prettier --write` on staged files before every commit, so most lint/formatting issues are already fixed locally before reaching CI.

### Run Against a Different URL

By default, tests point to `https://restful-booker.herokuapp.com`. To run against a different environment (e.g. a local or staging instance), set the `BASE_URL` environment variable:

```
# PowerShell
$env:BASE_URL="http://localhost:3001"; npm test

# bash
BASE_URL=http://localhost:3001 npm test
```

---

### API Under Test

| Method | Route          | Function                                |
| ------ | -------------- | --------------------------------------- |
| POST   | `/auth`        | Generates an authentication token       |
| GET    | `/booking`     | Lists booking IDs (accepts filters)     |
| GET    | `/booking/:id` | Fetches a specific booking              |
| POST   | `/booking`     | Creates a booking                       |
| PUT    | `/booking/:id` | Updates a booking (all fields required) |
| PATCH  | `/booking/:id` | Partially updates a booking             |
| DELETE | `/booking/:id` | Deletes a booking                       |

Authentication: `POST /auth` with `{ "username": "admin", "password": "password123" }` returns a token, sent on `PUT`, `PATCH`, and `DELETE` calls via the `Cookie: token=<value>` header.

**Security note:** `POST /booking` (creation) **does not require authentication** — anyone can create bookings without a token. This is an access-control flaw in the demo app itself, and it is explicitly covered in [features/create-booking.feature](features/create-booking.feature) as documented behavior, not as a test bug.

---

### Test Structure and Patterns Applied

- BDD / Gherkin: clear, readable scenarios in `.feature` files.
- API Client Objects: `AuthApiClient` and `BookingApiClient` encapsulate HTTP calls, the same way Page Objects encapsulate UI elements.
- Schema validation with [Zod](https://zod.dev/): API responses are validated at runtime against the schemas in `types/booking.ts` (the single source of truth, with TypeScript types derived via `z.infer`), not just typed by annotation — if the API changes a response's shape, the test fails with a clear message instead of passing silently or breaking further down the line.
- Coverage of authentication, full CRUD, PUT vs. PATCH, and unauthorized-access cases (403).
- Test pyramid: besides the BDD scenarios (`steps/`), which are real integration tests against `restful-booker`, `tests/unit/` covers `api/` and `types/` in isolation, with a fake of Playwright's `APIRequestContext` standing in for the network call — no network, no dependency on the public API being up. Coverage is measured with [`@vitest/coverage-v8`](https://vitest.dev/guide/coverage.html) and sent to [Codecov](https://codecov.io/gh/ThomasTDS/restful-booker), with a 100% gate on new/changed code per PR (`codecov.yml`). The upload uses `secrets.CODECOV_TOKEN` with `fail_ci_if_error: false`: until the repository is connected on codecov.io and the secret is configured, this step runs without breaking CI, it just won't populate the badge.
- Automated HTML report on every run (`reports/cucumber-report.html`).
- Automatic cleanup: the `After` hook removes the booking created in the scenario (via its own cleanup token), avoiding data buildup on the public API.
- Automatic retry (`retry: 1` in `cucumber.js`): a failing scenario runs a second time before being reported as a failure, cushioning transient instability from the public demo API.
- Continuous integration via GitHub Actions across two workflows: the full suite (see [.github/workflows/tests.yml](.github/workflows/tests.yml)) runs on every push and pull request to `main` and also daily at 06:00 UTC, to catch breakages caused by the public API itself, with the HTML report published as a workflow artifact — it's the required check for merging; and the smoke suite (see [.github/workflows/smoke-tests.yml](.github/workflows/smoke-tests.yml)) runs on every push to any branch, giving fast feedback while working on a feature, before opening a PR.
- Dependencies updated automatically by Dependabot (npm and GitHub Actions, weekly — see [.github/dependabot.yml](.github/dependabot.yml)). Patch/minor PRs with green CI are merged automatically ([.github/workflows/dependabot-auto-merge.yml](.github/workflows/dependabot-auto-merge.yml)); major bumps require manual review.
- QA traceability: a test case matrix in [docs/test-cases.md](docs/test-cases.md), with `@TC-XXX` tags on each `Scenario` and a `@smoke` subset (`npm run test:smoke`) covering the most critical end-to-end flows. Real bugs found are documented as GitHub Issues using the template in [.github/ISSUE_TEMPLATE/bug_report.md](.github/ISSUE_TEMPLATE/bug_report.md).

---

### Workflow

The `main` branch is protected: every change goes through a Pull Request, and merging is only allowed once the CI check (`test`) passes. Standard flow:

```
git checkout -b my-branch
# edit, run npm test locally
git push -u origin my-branch
# open a PR on GitHub, wait for the "test" check to pass, merge
```
