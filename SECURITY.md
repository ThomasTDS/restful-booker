# Política de Segurança

## Escopo

Este repositório contém **testes automatizados** contra a API pública de demonstração [restful-booker](https://restful-booker.herokuapp.com). Ele não expõe nenhum serviço próprio em produção — o único código que roda "para valer" é a suíte de testes e o pipeline de CI.

Isso divide os relatos em dois grupos:

- **Falhas de segurança/comportamento na própria restful-booker** (ex: a ausência de autenticação em `POST /booking`, já coberta em [features/create-booking.feature](features/create-booking.feature)): não são vulnerabilidades deste repositório, e sim comportamento de uma aplicação de demonstração de terceiros, fora do nosso controle. Esses achados são documentados como testes/comentários no código ou, quando relevante, como uma issue pública usando o [template de bug report](.github/ISSUE_TEMPLATE/bug_report.md) — não como um advisory de segurança.
- **Vulnerabilidades neste repositório** (dependências com CVE conhecido, um workflow do GitHub Actions mal configurado que exponha segredos, código malicioso introduzido via PR, etc.): é o que esta política cobre.

## Versões suportadas

Não há versionamento formal — só a branch `main` é mantida. Reports devem ser feitos contra o estado atual de `main`.

## Reportando uma vulnerabilidade

Para uma vulnerabilidade neste repositório (não um comportamento da API de terceiros sob teste), **não abra uma issue pública**. Em vez disso, use a aba [Security do repositório no GitHub](https://github.com/ThomasTDS/restful-booker/security/advisories/new) para reportar de forma privada.

Inclua, se possível:

- Descrição do problema e impacto potencial
- Passos para reproduzir
- Versão/commit afetado

Não há SLA formal de resposta — é um projeto de portfólio mantido por uma pessoa — mas relatos são levados a sério e recebem retorno assim que possível.

## Dependências

Atualizações de dependências (npm e GitHub Actions) são automatizadas pelo Dependabot, com auto-merge para bumps de patch/minor com CI verde (ver [.github/dependabot.yml](.github/dependabot.yml) e [.github/workflows/dependabot-auto-merge.yml](.github/workflows/dependabot-auto-merge.yml)). Alertas de segurança do Dependabot para vulnerabilidades conhecidas em dependências também passam por esse mesmo fluxo.
