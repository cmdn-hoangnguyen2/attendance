import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireAuthenticatedContractSession } from './httpHarness.mjs';

function session(role = 'member', overrides = {}) {
  return requireAuthenticatedContractSession(role, { ...process.env, ...overrides });
}
async function request(identity, path = '/api/me', headers = {}) {
  return fetch(`${identity.baseUrl}${path}`, {
    headers: { Cookie: identity.cookie, ...headers }, redirect: 'manual', signal: AbortSignal.timeout(15000),
  });
}
test('anonymous session is denied by actual HTTP boundary', async () => {
  const identity = session();
  const response = await fetch(`${identity.baseUrl}/api/me`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, 'UNAUTHENTICATED');
});
test('repeated real session provisioning returns one stable user identity', async () => {
  const identity = session();
  const first = await request(identity);
  const second = await request(identity);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  const initial = await first.json();
  const repeated = await second.json();
  assert.equal(initial.user.id, repeated.user.id);
  assert.equal(initial.user.auth0Subject, repeated.user.auth0Subject);
  assert.equal(initial.user.status, 'active');
});
test('client role and actor claims cannot override verified session', async () => {
  const identity = session();
  const actual = await request(identity);
  const spoofed = await request(identity, '/api/me?role=admin&actorId=spoofed', { 'X-Global-Role': 'admin', 'X-Actor-Id': 'spoofed' });
  assert.equal(actual.status, 200);
  assert.equal(spoofed.status, 200);
  const expected = await actual.json();
  const received = await spoofed.json();
  assert.equal(expected.globalRole, 'user', 'Configured member must be a real non-admin Auth0 identity');
  assert.equal(received.globalRole, 'user');
  assert.equal(received.user.id, expected.user.id);
});
test('archived real session remains denied after repeated provisioning', async () => {
  assert.ok(process.env.CMDN_CONTRACT_ARCHIVED_COOKIE, 'Real archived Auth0 session fixture required');
  const identity = session('member', { CMDN_CONTRACT_MEMBER_COOKIE: process.env.CMDN_CONTRACT_ARCHIVED_COOKIE });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await request(identity);
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, 'ACCOUNT_ARCHIVED');
  }
});
test('provisioning failure is explicit on isolated failure application', async () => {
  assert.ok(process.env.CMDN_CONTRACT_PROVISIONING_FAILURE_ORIGIN, 'Dedicated failure application origin required');
  const identity = session('member', {
    CMDN_CONTRACT_BASE_URL: process.env.CMDN_CONTRACT_PROVISIONING_FAILURE_ORIGIN,
    CMDN_CONTRACT_DEDICATED_ORIGIN: process.env.CMDN_CONTRACT_PROVISIONING_FAILURE_ORIGIN,
  });
  const response = await request(identity);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'PROFILE_PROVISIONING_FAILED');
});
