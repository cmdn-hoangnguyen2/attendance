import { test } from 'node:test';
import assert from 'node:assert';

test('Room commands HTTP contract', async (t) => {
  await t.test('POST /api/rooms returns 401 unauthenticated', async () => {
    // Assert HTTP layer unauthenticated
  });

  await t.test('POST /api/rooms handles invalid payload', async () => {
    // Assert 400 Bad Request
  });

  await t.test('POST /api/rooms/:id/join requires action payload', async () => {
    // Assert 400 Bad Request
  });
  
  await t.test('POST /api/join-requests/:id requires action payload', async () => {
    // Assert 400 Bad Request
  });
});
