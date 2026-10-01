import { test } from 'node:test';
import assert from 'node:assert/strict';

let provider;
let importFailure;
try {
  provider = await import('../../src/lib/supabase/tokenProvider.ts');
} catch (error) {
  importFailure = error;
}

test('token provider exposes the approved token and clear interfaces', () => {
  assert.equal(importFailure, undefined, `Actual tokenProvider.ts must import: ${importFailure?.message}`);
  assert.equal(typeof provider.getSupabaseToken, 'function');
  assert.equal(typeof provider.clearSupabaseTokenCache, 'function');
});

function cacheTest(name, body) {
  test(name, { skip: Boolean(importFailure) }, async (context) => {
    provider.clearSupabaseTokenCache();
    context.mock.method(Date, 'now', () => 1_000_000);
    context.mock.method(globalThis, 'fetch', () => {
      throw new Error('Unexpected fetch');
    });
    context.after(() => provider.clearSupabaseTokenCache());
    await body(context);
  });
}

function deferred() {
  let resolve;
  const promise = new Promise((settle) => { resolve = settle; });
  return { promise, resolve };
}

function tokenResponse(token = 'token-a', expiresAt = 1_300) {
  return Response.json({ token, expiresAt });
}

async function flushPromises() {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
}

cacheTest('reuses a valid token and requests only the same-origin token endpoint', async (context) => {
  let requests = 0;
  context.mock.method(globalThis, 'fetch', async (input, options) => {
    requests += 1;
    assert.equal(input, '/api/auth/supabase-token');
    assert.equal(options?.method ?? 'GET', 'GET');
    assert.equal(options?.credentials ?? 'same-origin', 'same-origin');
    return tokenResponse();
  });
  assert.equal(await provider.getSupabaseToken(), 'token-a');
  assert.equal(await provider.getSupabaseToken(), 'token-a');
  assert.equal(requests, 1);
});

cacheTest('refreshes exactly 60 seconds before expiry', async (context) => {
  let now = 1_000_000;
  let requests = 0;
  context.mock.method(Date, 'now', () => now);
  context.mock.method(globalThis, 'fetch', async () => {
    requests += 1;
    return requests === 1 ? tokenResponse() : tokenResponse('token-b', 1_600);
  });
  assert.equal(await provider.getSupabaseToken(), 'token-a');
  now = 1_239_000;
  assert.equal(await provider.getSupabaseToken(), 'token-a');
  assert.equal(requests, 1);
  now = 1_240_000;
  assert.equal(await provider.getSupabaseToken(), 'token-b');
  assert.equal(requests, 2);
});

cacheTest('deduplicates concurrent reads until the shared response completes', async (context) => {
  const response = deferred();
  let requests = 0;
  context.mock.method(globalThis, 'fetch', () => { requests += 1; return response.promise; });
  const first = provider.getSupabaseToken();
  const second = provider.getSupabaseToken();
  const third = provider.getSupabaseToken();
  assert.equal(requests, 1);
  response.resolve(tokenResponse());
  assert.deepEqual(await Promise.all([first, second, third]), ['token-a', 'token-a', 'token-a']);
});

cacheTest('401 terminates the request and allows a later authenticated request', async (context) => {
  let requests = 0;
  context.mock.method(globalThis, 'fetch', async () => {
    requests += 1;
    return requests === 1 ? new Response(null, { status: 401 }) : tokenResponse();
  });
  assert.equal(await provider.getSupabaseToken(), null);
  assert.equal(requests, 1);
  assert.equal(await provider.getSupabaseToken(), 'token-a');
  assert.equal(requests, 2);
});

for (const [label, payload] of [
  ['null payload', null],
  ['missing token', { expiresAt: 1_300 }],
  ['non-string token', { token: 42, expiresAt: 1_300 }],
  ['empty token', { token: '', expiresAt: 1_300 }],
  ['whitespace-only token', { token: '   ', expiresAt: 1_300 }],
  ['missing expiry', { token: 'token-a' }],
  ['string expiry', { token: 'token-a', expiresAt: '1300' }],
  ['expired token', { token: 'token-a', expiresAt: 999 }],
  ['token expiring now', { token: 'token-a', expiresAt: 1_000 }],
]) {
  cacheTest(`rejects ${label} without caching it`, async (context) => {
    let requests = 0;
    context.mock.method(globalThis, 'fetch', async () => {
      requests += 1;
      return requests === 1 ? Response.json(payload) : tokenResponse('recovered-token');
    });
    assert.equal(await provider.getSupabaseToken(), null);
    assert.equal(await provider.getSupabaseToken(), 'recovered-token');
    assert.equal(requests, 2);
  });
}

cacheTest('rejects a token that expires while its response is pending', async (context) => {
  let now = 1_000_000;
  const response = deferred();
  context.mock.method(Date, 'now', () => now);
  context.mock.method(globalThis, 'fetch', () => response.promise);
  const pending = provider.getSupabaseToken();
  now = 1_301_000;
  response.resolve(tokenResponse());
  assert.equal(await pending, null);
});

for (const [label, response] of [
  ['HTTP failure', () => new Response(null, { status: 500 })],
  ['invalid JSON', () => new Response('{', { headers: { 'content-type': 'application/json' } })],
  ['network rejection', () => { throw new Error('Offline'); }],
]) {
  cacheTest(`returns null on ${label} without automatic retry`, async (context) => {
    let requests = 0;
    context.mock.method(globalThis, 'fetch', async () => {
      requests += 1;
      return requests === 1 ? response() : tokenResponse('recovered-token');
    });
    assert.equal(await provider.getSupabaseToken(), null);
    assert.equal(requests, 1);
    assert.equal(await provider.getSupabaseToken(), 'recovered-token');
    assert.equal(requests, 2);
  });
}

cacheTest('bounds a fetch that ignores cancellation and allows a subsequent request', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const response = deferred();
  let requests = 0;
  let signal;
  context.mock.method(globalThis, 'fetch', (_input, options) => {
    requests += 1;
    signal = options?.signal;
    return requests === 1 ? response.promise : Promise.resolve(tokenResponse('fresh-token'));
  });
  let outcome = 'unsettled';
  const pending = provider.getSupabaseToken().then((result) => { outcome = result; });
  context.mock.timers.tick(30_000);
  await flushPromises();
  assert.equal(outcome, null, 'Network failure must settle within a bounded deadline');
  assert.equal(signal?.aborted, true);
  await pending;
  assert.equal(requests, 1);
  assert.equal(await provider.getSupabaseToken(), 'fresh-token');
  response.resolve(tokenResponse('late-token'));
  await flushPromises();
  assert.equal(await provider.getSupabaseToken(), 'fresh-token');
  assert.equal(requests, 2);
});

cacheTest('keeps the deadline active while parsing the response body', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let streamController;
  const response = new Response(new ReadableStream({ start(controller) { streamController = controller; } }));
  let requests = 0;
  context.mock.method(globalThis, 'fetch', async () => {
    requests += 1;
    return requests === 1 ? response : tokenResponse('fresh-token');
  });
  let outcome = 'unsettled';
  const pending = provider.getSupabaseToken().then((result) => { outcome = result; });
  await flushPromises();
  context.mock.timers.tick(30_000);
  await flushPromises();
  assert.equal(outcome, null, 'Body parsing must share the bounded request deadline');
  await pending;
  streamController.enqueue(new TextEncoder().encode('{"token":"late-token","expiresAt":1300}'));
  streamController.close();
  await flushPromises();
  assert.equal(await provider.getSupabaseToken(), 'fresh-token');
  assert.equal(requests, 2);
});

cacheTest('clearing a settled cache forces a fresh request', async (context) => {
  let requests = 0;
  context.mock.method(globalThis, 'fetch', async () => {
    requests += 1;
    return tokenResponse(requests === 1 ? 'token-a' : 'token-b');
  });
  assert.equal(await provider.getSupabaseToken(), 'token-a');
  provider.clearSupabaseTokenCache();
  assert.equal(await provider.getSupabaseToken(), 'token-b');
  assert.equal(requests, 2);
});

cacheTest('clearing during a fetch discards its eventual token', async (context) => {
  const oldResponse = deferred();
  let requests = 0;
  context.mock.method(globalThis, 'fetch', () => {
    requests += 1;
    return requests === 1 ? oldResponse.promise : Promise.resolve(tokenResponse('fresh-token'));
  });
  const oldRequest = provider.getSupabaseToken();
  provider.clearSupabaseTokenCache();
  oldResponse.resolve(tokenResponse('logged-out-token'));
  assert.equal(await oldRequest, null);
  assert.equal(await provider.getSupabaseToken(), 'fresh-token');
  assert.equal(requests, 2);
});

cacheTest('an old request finishing after clear cannot erase the new pending request', async (context) => {
  const oldResponse = deferred();
  const newResponse = deferred();
  let requests = 0;
  context.mock.method(globalThis, 'fetch', () => {
    requests += 1;
    return requests === 1 ? oldResponse.promise : newResponse.promise;
  });
  const oldRequest = provider.getSupabaseToken();
  provider.clearSupabaseTokenCache();
  const newRequest = provider.getSupabaseToken();
  oldResponse.resolve(tokenResponse('logged-out-token'));
  assert.equal(await oldRequest, null);
  const concurrentNewRequest = provider.getSupabaseToken();
  assert.equal(requests, 2, 'Old cleanup must preserve new request deduplication');
  newResponse.resolve(tokenResponse('fresh-token'));
  assert.deepEqual(await Promise.all([newRequest, concurrentNewRequest]), ['fresh-token', 'fresh-token']);
  assert.equal(await provider.getSupabaseToken(), 'fresh-token');
  assert.equal(requests, 2);
});
