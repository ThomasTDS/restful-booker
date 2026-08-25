Feature: Consulta de booking

  Scenario: Buscar um booking existente pelo id
    Given que existe um booking criado
    When ele busca o booking pelo id
    Then os dados retornados devem corresponder ao booking criado

  Scenario: Buscar um booking inexistente
    When ele busca o booking pelo id "999999999"
    Then a resposta deve indicar que o booking não foi encontrado
