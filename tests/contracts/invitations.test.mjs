import { test } from 'node:test';
import assert from 'node:assert';

test('Invitations HTTP contract', async (t) => {
  await t.test('POST /api/rooms/:id/invitations requires valid payload', async () => {
    // Assert 400 Bad Request
  });

  await t.test('POST /api/invitations/:id requires action payload', async () => {
    // Assert 400 Bad Request
  });
});
