Feature: Remoção de booking

  @TC-010 @smoke
  Scenario: Remover booking com token válido
    Given que existe um booking criado
    And que ele possui um token de autenticação válido
    When ele remove o booking
    Then o booking deve ser removido com sucesso

  @TC-011
  Scenario: Tentar remover booking sem token de autenticação
    Given que existe um booking criado
    And que ele não possui nenhum token de autenticação
    When ele tenta remover o booking
    Then a resposta deve indicar acesso não autorizado

  # DELETE em um id inexistente também não retorna 404: mesma resposta 405
  # Method Not Allowed observada em PUT e PATCH (ver TC-023 em
  # update-booking.feature).
  @TC-024
  Scenario: Tentar remover um booking inexistente
    Given que ele possui um token de autenticação válido
    When ele tenta remover um booking inexistente
    Then a API deve responder que o método não é permitido
