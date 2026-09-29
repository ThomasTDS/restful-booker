import { Given, When, Then, Before, After, Status, ITestCaseHookParameter, IWorld } from '@cucumber/cucumber';
import { request as newApiRequest, APIRequestContext, APIResponse } from 'playwright';
import { expect } from '@playwright/test';
import { AuthApiClient } from '../api/AuthApiClient';
import { BookingApiClient } from '../api/BookingApiClient';
import {
  Booking,
  BookingSchema,
  CreateBookingResponse,
  CreateBookingResponseSchema,
  AuthResponse,
  AuthResponseSchema,
  BookingId,
  BookingIdSchema,
} from '../types/booking';
import { z } from 'zod';

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

After(async function (this: IWorld, scenario: ITestCaseHookParameter) {
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
Given('que ele não possui nenhum token de autenticação', () => {
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
  const body: AuthResponse = AuthResponseSchema.parse(await lastResponse.json());
  expect(body.token).toBeTruthy();
});

Then('a resposta deve indicar credenciais inválidas', async () => {
  const body = (await lastResponse.json()) as { reason: string };
  expect(body.reason).toBe('Bad credentials');
});

// CRIAÇÃO
Given('que existe um booking criado', async () => {
  bookingData = { ...defaultBooking };
  const response = await bookingClient.createBooking(bookingData);
  const body: CreateBookingResponse = CreateBookingResponseSchema.parse(await response.json());
  bookingId = body.bookingid;
});

When('ele cria um booking com dados válidos', async () => {
  bookingData = { ...defaultBooking };
  lastResponse = await bookingClient.createBooking(bookingData);
});

Then('o booking deve ser criado com sucesso', () => {
  expect(lastResponse.status()).toBe(200);
});

Then('o id do booking criado deve ser retornado', async () => {
  const body: CreateBookingResponse = CreateBookingResponseSchema.parse(await lastResponse.json());
  expect(body.bookingid).toBeGreaterThan(0);
  bookingId = body.bookingid;
});

// CRIAÇÃO — payload inválido
When('ele cria um booking sem nenhum campo obrigatório', async () => {
  lastResponse = await bookingClient.createBookingRaw({});
});

When('ele cria um booking com totalprice do tipo texto', async () => {
  lastResponse = await bookingClient.createBookingRaw({ ...defaultBooking, totalprice: 'cento_e_cinquenta' });
});

When('ele cria um booking com depositpaid do tipo texto', async () => {
  lastResponse = await bookingClient.createBookingRaw({ ...defaultBooking, depositpaid: 'sim' });
});

When('ele cria um booking com uma data de check-in em formato inválido', async () => {
  lastResponse = await bookingClient.createBookingRaw({
    ...defaultBooking,
    bookingdates: { ...defaultBooking.bookingdates, checkin: 'data-invalida' },
  });
});

When('ele cria um booking com totalprice negativo', async () => {
  lastResponse = await bookingClient.createBookingRaw({ ...defaultBooking, totalprice: -150 });
});

Then('a API deve responder com erro interno do servidor', () => {
  expect(lastResponse.status()).toBe(500);
});

Then('o totalprice do booking criado deve ser nulo', async () => {
  const body = (await lastResponse.json()) as { bookingid: number; booking: { totalprice: number | null } };
  expect(body.booking.totalprice).toBeNull();
  bookingId = body.bookingid;
});

Then('o depositpaid do booking criado deve ser convertido para true', async () => {
  const body = (await lastResponse.json()) as { bookingid: number; booking: { depositpaid: boolean } };
  expect(body.booking.depositpaid).toBe(true);
  bookingId = body.bookingid;
});

Then('o checkin do booking criado deve estar corrompido', async () => {
  const body = (await lastResponse.json()) as { bookingid: number; booking: { bookingdates: { checkin: string } } };
  expect(body.booking.bookingdates.checkin).not.toBe('data-invalida');
  expect(body.booking.bookingdates.checkin).toContain('NaN');
  bookingId = body.bookingid;
});

Then('o totalprice do booking criado deve ser negativo', async () => {
  const body = (await lastResponse.json()) as { bookingid: number; booking: { totalprice: number } };
  expect(body.booking.totalprice).toBeLessThan(0);
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
  const body: Booking = BookingSchema.parse(await lastResponse.json());
  expect(body).toEqual(bookingData);
});

Then('a resposta deve indicar que o booking não foi encontrado', () => {
  expect(lastResponse.status()).toBe(404);
});

When('ele busca bookings filtrando pelo firstname e lastname do booking criado', async () => {
  const { firstname, lastname } = bookingData as Booking;
  lastResponse = await bookingClient.getBookingIds({ firstname, lastname });
});

Then('o id do booking criado deve estar entre os resultados', async () => {
  expect(lastResponse.status()).toBe(200);
  const body: BookingId[] = z.array(BookingIdSchema).parse(await lastResponse.json());
  expect(body.some((b) => b.bookingid === bookingId)).toBe(true);
});

When('ele busca bookings filtrando por um firstname e lastname que não correspondem a nenhum booking', async () => {
  lastResponse = await bookingClient.getBookingIds({ firstname: 'Inexistente-xyz-999', lastname: 'NaoExiste-abc-000' });
});

Then('o id do booking criado não deve estar entre os resultados', async () => {
  expect(lastResponse.status()).toBe(200);
  const body: BookingId[] = z.array(BookingIdSchema).parse(await lastResponse.json());
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

Then('o booking deve ser atualizado com sucesso', () => {
  expect(lastResponse.status()).toBe(200);
});

Then('a resposta deve indicar acesso não autorizado', () => {
  expect(lastResponse.status()).toBe(403);
});

When('ele atualiza parcialmente o booking alterando o sobrenome para {string}', async (lastname: string) => {
  lastResponse = await bookingClient.partialUpdateBooking(bookingId as number, { lastname }, token as string);
});

When('ele tenta atualizar parcialmente o booking alterando o sobrenome para {string}', async (lastname: string) => {
  lastResponse = await bookingClient.partialUpdateBooking(bookingId as number, { lastname }, token ?? '');
});

Then('o sobrenome do booking deve ser {string}', async (lastname: string) => {
  const body: Booking = BookingSchema.parse(await lastResponse.json());
  expect(body.lastname).toBe(lastname);
});

// ATUALIZAÇÃO — payload inválido
When('ele atualiza o booking com corpo vazio', async () => {
  lastResponse = await bookingClient.updateBookingRaw(bookingId as number, {}, token as string);
});

When('ele atualiza o booking com totalprice do tipo texto', async () => {
  lastResponse = await bookingClient.updateBookingRaw(
    bookingId as number,
    { ...defaultBooking, totalprice: 'nao_e_numero' },
    token as string,
  );
});

When('ele atualiza o booking sem o campo bookingdates', async () => {
  lastResponse = await bookingClient.updateBookingRaw(
    bookingId as number,
    {
      firstname: defaultBooking.firstname,
      lastname: defaultBooking.lastname,
      totalprice: defaultBooking.totalprice,
      depositpaid: defaultBooking.depositpaid,
    },
    token as string,
  );
});

When('ele atualiza parcialmente o booking com lastname do tipo número', async () => {
  lastResponse = await bookingClient.partialUpdateBookingRaw(bookingId as number, { lastname: 12345 }, token as string);
});

When('ele atualiza parcialmente o booking com corpo vazio', async () => {
  lastResponse = await bookingClient.partialUpdateBooking(bookingId as number, {}, token as string);
});

When('ele tenta {string} um booking inexistente', async (verbo: string) => {
  if (verbo === 'atualizar') {
    lastResponse = await bookingClient.updateBooking(999999999, defaultBooking, token as string);
  } else {
    lastResponse = await bookingClient.partialUpdateBooking(999999999, { lastname: 'Novo' }, token as string);
  }
});

Then('a API deve rejeitar o payload com erro de requisição inválida', () => {
  expect(lastResponse.status()).toBe(400);
});

Then('o totalprice do booking atualizado deve ser nulo', async () => {
  const body = (await lastResponse.json()) as { totalprice: number | null };
  expect(body.totalprice).toBeNull();
});

Then('o lastname do booking atualizado deve ser o número enviado', async () => {
  const body = (await lastResponse.json()) as { lastname: number };
  expect(body.lastname).toBe(12345);
});

Then('os dados do booking não devem ter sido alterados', async () => {
  const body: Booking = BookingSchema.parse(await lastResponse.json());
  expect(body).toEqual(bookingData);
});

Then('a API deve responder que o método não é permitido', () => {
  expect(lastResponse.status()).toBe(405);
});

// REMOÇÃO
When('ele remove o booking', async () => {
  lastResponse = await bookingClient.deleteBooking(bookingId as number, token as string);
});

When('ele tenta remover o booking', async () => {
  lastResponse = await bookingClient.deleteBooking(bookingId as number, token ?? '');
});

When('ele tenta remover um booking inexistente', async () => {
  lastResponse = await bookingClient.deleteBooking(999999999, token as string);
});

Then('o booking deve ser removido com sucesso', () => {
  expect(lastResponse.status()).toBe(201);
});
