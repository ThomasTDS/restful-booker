import { Given, When, Then, Before, After, Status, ITestCaseHookParameter } from '@cucumber/cucumber';
import { request as newApiRequest, APIRequestContext, APIResponse } from 'playwright';
import { expect } from '@playwright/test';
import { AuthApiClient } from '../api/AuthApiClient';
import { BookingApiClient } from '../api/BookingApiClient';
import { Booking, CreateBookingResponse, AuthResponse, BookingId } from '../types/booking';

const BASE_URL = process.env.BASE_URL ?? 'https://restful-booker.herokuapp.com';

const defaultBooking: Booking = {
  firstname: 'Fulano',
  lastname: 'Ciclano',
  totalprice: 150,
  depositpaid: true,
  bookingdates: { checkin: '2026-01-01', checkout: '2026-01-05' },
  additionalneeds: 'Breakfast',
};

let apiContext: APIRequestContext;
let authClient: AuthApiClient;
let bookingClient: BookingApiClient;
let lastResponse: APIResponse;
let token: string | undefined;
let bookingId: number | undefined;
let bookingData: Booking | undefined;

Before(async () => {
  apiContext = await newApiRequest.newContext({ baseURL: BASE_URL });
  authClient = new AuthApiClient(apiContext);
  bookingClient = new BookingApiClient(apiContext);
  token = undefined;
  bookingId = undefined;
  bookingData = undefined;
});

After(async function (this: any, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === Status.FAILED && lastResponse) {
    try {
      let responseBody: unknown;
      try {
        responseBody = await lastResponse.json();
      } catch {
        responseBody = await lastResponse.text();
      }
      const evidence = {
        url: lastResponse.url(),
        status: lastResponse.status(),
        statusText: lastResponse.statusText(),
        headers: lastResponse.headers(),
        body: responseBody,
      };
      this.attach(JSON.stringify(evidence, null, 2), 'application/json');
    } catch {
      // evita mascarar a falha original do teste com um erro na captura de evidência
    }
  }

  if (bookingId !== undefined) {
    try {
      const cleanupToken = await authClient.getValidToken();
      await bookingClient.deleteBooking(bookingId, cleanupToken);
    } catch {
      // booking já pode ter sido removido pelo próprio cenário; ignora falha de limpeza
    }
  }
  await apiContext.dispose();
});

// AUTENTICAÇÃO
Given('que ele não possui nenhum token de autenticação', async () => {
  token = undefined;
});

Given('que ele possui um token de autenticação válido', async () => {
  token = await authClient.getValidToken();
});

When('ele solicita um token com o usuário {string} e a senha {string}', async (username: string, password: string) => {
  lastResponse = await authClient.createToken(username, password);
});

Then('ele deve receber um token de autenticação válido', async () => {
  expect(lastResponse.status()).toBe(200);
  const body: AuthResponse = await lastResponse.json();
  expect(body.token).toBeTruthy();
});

Then('a resposta deve indicar credenciais inválidas', async () => {
  const body = await lastResponse.json();
  expect(body.reason).toBe('Bad credentials');
});

// CRIAÇÃO
Given('que existe um booking criado', async () => {
  bookingData = { ...defaultBooking };
  const response = await bookingClient.createBooking(bookingData);
  const body: CreateBookingResponse = await response.json();
  bookingId = body.bookingid;
});

When('ele cria um booking com dados válidos', async () => {
  bookingData = { ...defaultBooking };
  lastResponse = await bookingClient.createBooking(bookingData);
});

Then('o booking deve ser criado com sucesso', async () => {
  expect(lastResponse.status()).toBe(200);
});

Then('o id do booking criado deve ser retornado', async () => {
  const body: CreateBookingResponse = await lastResponse.json();
  expect(body.bookingid).toBeGreaterThan(0);
  bookingId = body.bookingid;
});

// CONSULTA
When('ele busca o booking pelo id', async () => {
  lastResponse = await bookingClient.getBooking(bookingId as number);
});

When('ele busca o booking pelo id {string}', async (id: string) => {
  lastResponse = await bookingClient.getBooking(Number(id));
});

Then('os dados retornados devem corresponder ao booking criado', async () => {
  expect(lastResponse.status()).toBe(200);
  const body: Booking = await lastResponse.json();
  expect(body).toEqual(bookingData);
});

Then('a resposta deve indicar que o booking não foi encontrado', async () => {
  expect(lastResponse.status()).toBe(404);
});

When('ele busca bookings filtrando pelo firstname e lastname do booking criado', async () => {
  const { firstname, lastname } = bookingData as Booking;
  lastResponse = await bookingClient.getBookingIds({ firstname, lastname });
});

Then('o id do booking criado deve estar entre os resultados', async () => {
  expect(lastResponse.status()).toBe(200);
  const body: BookingId[] = await lastResponse.json();
  expect(body.some((b) => b.bookingid === bookingId)).toBe(true);
});

When('ele busca bookings filtrando por um firstname e lastname que não correspondem a nenhum booking', async () => {
  lastResponse = await bookingClient.getBookingIds({ firstname: 'Inexistente-xyz-999', lastname: 'NaoExiste-abc-000' });
});

Then('o id do booking criado não deve estar entre os resultados', async () => {
  expect(lastResponse.status()).toBe(200);
  const body: BookingId[] = await lastResponse.json();
  expect(body.some((b) => b.bookingid === bookingId)).toBe(false);
});

// ATUALIZAÇÃO (PUT/PATCH)
When('ele atualiza o booking com novos dados', async () => {
  const updated: Booking = { ...(bookingData as Booking), firstname: 'Atualizado', totalprice: 200 };
  lastResponse = await bookingClient.updateBooking(bookingId as number, updated, token as string);
  bookingData = updated;
});

When('ele tenta atualizar o booking com novos dados', async () => {
  const updated: Booking = { ...(bookingData as Booking), firstname: 'NaoDeveriaFuncionar' };
  lastResponse = await bookingClient.updateBooking(bookingId as number, updated, token ?? '');
});

Then('o booking deve ser atualizado com sucesso', async () => {
  expect(lastResponse.status()).toBe(200);
});

Then('a resposta deve indicar acesso não autorizado', async () => {
  expect(lastResponse.status()).toBe(403);
});

When('ele atualiza parcialmente o booking alterando o sobrenome para {string}', async (lastname: string) => {
  lastResponse = await bookingClient.partialUpdateBooking(bookingId as number, { lastname }, token as string);
});

Then('o sobrenome do booking deve ser {string}', async (lastname: string) => {
  const body: Booking = await lastResponse.json();
  expect(body.lastname).toBe(lastname);
});

// REMOÇÃO
When('ele remove o booking', async () => {
  lastResponse = await bookingClient.deleteBooking(bookingId as number, token as string);
});

When('ele tenta remover o booking', async () => {
  lastResponse = await bookingClient.deleteBooking(bookingId as number, token ?? '');
});

Then('o booking deve ser removido com sucesso', async () => {
  expect(lastResponse.status()).toBe(201);
});
