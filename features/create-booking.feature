Feature: Criação de booking

  # A documentação da API indica que POST /booking não exige autenticação.
  # Ou seja, qualquer pessoa consegue criar um booking sem token — uma falha
  # de controle de acesso do próprio app de demonstração, e vale documentar
  # esse comportamento em vez de presumir que a criação seria bloqueada.
  @TC-003 @smoke
  Scenario: Criar booking sem nenhum token de autenticação
    Given que ele não possui nenhum token de autenticação
    When ele cria um booking com dados válidos
    Then o booking deve ser criado com sucesso
    And o id do booking criado deve ser retornado

  # A API não valida a presença dos campos obrigatórios: enviar um corpo
  # vazio (sem firstname, lastname, totalprice, depositpaid nem
  # bookingdates) faz o servidor quebrar com 500 em vez de retornar 400.
  # Isso é um bug real do app de demonstração — documentado aqui, não
  # presumido como "deveria ser 400" no teste.
  @TC-013
  Scenario: Criar booking com corpo vazio, sem nenhum campo obrigatório
    When ele cria um booking sem nenhum campo obrigatório
    Then a API deve responder com erro interno do servidor

  # totalprice com um tipo diferente de number não é rejeitado: a API
  # aceita a requisição e silenciosamente grava totalprice como null,
  # corrompendo o dado em vez de validar o tipo do campo.
  @TC-014
  Scenario: Criar booking com totalprice de tipo inválido
    When ele cria um booking com totalprice do tipo texto
    Then o booking deve ser criado com sucesso
    And o totalprice do booking criado deve ser nulo

  # depositpaid também não é validado como boolean: qualquer string não
  # vazia é coagida para true, então não existe forma de a API rejeitar
  # um valor inválido nesse campo.
  @TC-015
  Scenario: Criar booking com depositpaid de tipo inválido
    When ele cria um booking com depositpaid do tipo texto
    Then o booking deve ser criado com sucesso
    And o depositpaid do booking criado deve ser convertido para true

  # Uma data de check-in com formato inválido não é validada nem
  # rejeitada: o valor enviado é processado e gravado corrompido
  # (formato "NaN"), em vez de a API retornar 400.
  @TC-016
  Scenario: Criar booking com data de check-in em formato inválido
    When ele cria um booking com uma data de check-in em formato inválido
    Then o booking deve ser criado com sucesso
    And o checkin do booking criado deve estar corrompido

  # Não há validação de regra de negócio para totalprice: valores
  # negativos são aceitos normalmente, sem nenhuma restrição.
  @TC-017
  Scenario: Criar booking com totalprice negativo
    When ele cria um booking com totalprice negativo
    Then o booking deve ser criado com sucesso
    And o totalprice do booking criado deve ser negativo
