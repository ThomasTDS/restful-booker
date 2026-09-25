Feature: Atualização de booking (PUT e PATCH)

  # PUT substitui todos os campos do booking; exige todos os campos obrigatórios.
  @TC-007 @smoke
  Scenario: Atualizar booking com token válido
    Given que existe um booking criado
    And que ele possui um token de autenticação válido
    When ele atualiza o booking com novos dados
    Then o booking deve ser atualizado com sucesso

  @TC-008
  Scenario: Tentar atualizar booking sem token de autenticação
    Given que existe um booking criado
    And que ele não possui nenhum token de autenticação
    When ele tenta atualizar o booking com novos dados
    Then a resposta deve indicar acesso não autorizado

  # PATCH atualiza somente os campos enviados, mantendo o restante do booking.
  @TC-009
  Scenario: Atualizar parcialmente o booking com PATCH
    Given que existe um booking criado
    And que ele possui um token de autenticação válido
    When ele atualiza parcialmente o booking alterando o sobrenome para "Silva"
    Then o booking deve ser atualizado com sucesso
    And o sobrenome do booking deve ser "Silva"

  @TC-012
  Scenario: Tentar atualizar parcialmente booking sem token de autenticação
    Given que existe um booking criado
    And que ele não possui nenhum token de autenticação
    When ele tenta atualizar parcialmente o booking alterando o sobrenome para "NaoDeveriaFuncionar"
    Then a resposta deve indicar acesso não autorizado

  # PUT valida a ausência de campos obrigatórios (ao contrário do POST de
  # criação, que quebra com 500 no mesmo cenário — ver TC-013 em
  # create-booking.feature): aqui a API responde corretamente com 400.
  @TC-018
  Scenario: Tentar atualizar booking com corpo vazio
    Given que existe um booking criado
    And que ele possui um token de autenticação válido
    When ele atualiza o booking com corpo vazio
    Then a API deve rejeitar o payload com erro de requisição inválida

  # Assim como na criação (TC-014), um totalprice de tipo inválido não é
  # rejeitado no PUT: a API aceita a requisição e grava totalprice como null.
  @TC-019
  Scenario: Atualizar booking com totalprice de tipo inválido
    Given que existe um booking criado
    And que ele possui um token de autenticação válido
    When ele atualiza o booking com totalprice do tipo texto
    Then o booking deve ser atualizado com sucesso
    And o totalprice do booking atualizado deve ser nulo

  @TC-020
  Scenario: Tentar atualizar booking sem o campo bookingdates
    Given que existe um booking criado
    And que ele possui um token de autenticação válido
    When ele atualiza o booking sem o campo bookingdates
    Then a API deve rejeitar o payload com erro de requisição inválida

  # PATCH não valida o tipo dos campos enviados: um lastname numérico é
  # aceito e gravado como número, quebrando o contrato do schema.
  @TC-021
  Scenario: Atualizar parcialmente o booking com lastname de tipo inválido
    Given que existe um booking criado
    And que ele possui um token de autenticação válido
    When ele atualiza parcialmente o booking com lastname do tipo número
    Then o booking deve ser atualizado com sucesso
    And o lastname do booking atualizado deve ser o número enviado

  # PATCH com corpo vazio não falha nem altera nada — comportamento seguro,
  # documentado aqui como um no-op válido.
  @TC-022
  Scenario: Atualizar parcialmente o booking com corpo vazio não altera nada
    Given que existe um booking criado
    And que ele possui um token de autenticação válido
    When ele atualiza parcialmente o booking com corpo vazio
    Then o booking deve ser atualizado com sucesso
    And os dados do booking não devem ter sido alterados

  # PUT e PATCH em um id inexistente não retornam 404: a API responde 405
  # Method Not Allowed, um comportamento real e consistente entre os dois
  # verbos (o mesmo vale para DELETE — ver TC-024 em delete-booking.feature),
  # documentado aqui em vez de presumido.
  @TC-023
  Scenario Outline: Tentar atualizar um booking inexistente
    Given que ele possui um token de autenticação válido
    When ele tenta "<verbo>" um booking inexistente
    Then a API deve responder que o método não é permitido

    Examples:
      | verbo                  |
      | atualizar              |
      | atualizar parcialmente |
