import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveGlobalRole, resolveProvisioningIdentity, isActiveProfile } from '../../src/lib/authClaims.mjs';

test('email, database role and Supabase authenticated claim never grant admin', () => {
  assert.equal(resolveGlobalRole({ email: 'nvhoang2012002@gmail.com' }), 'user');
  assert.equal(resolveGlobalRole({ role: 'admin' }), 'user');
  assert.equal(resolveGlobalRole({ role: 'authenticated' }), 'user');
  assert.equal(resolveGlobalRole({}), 'user');
});
test('trusted namespaced admin claim grants admin', () => {
  assert.equal(resolveGlobalRole({ 'https://diemdanh.cmdn/role': 'admin' }), 'admin');
  assert.equal(resolveGlobalRole({ 'https://diemdanh.cmdn/role': 'user' }), 'user');
});
test('identity requires immutable subject and email without email identity fallback', () => {
  assert.throws(() => resolveProvisioningIdentity({ email: 'a@example.com' }), /subject/);
  assert.throws(() => resolveProvisioningIdentity({ sub: 'auth0|123' }), /email/);
  assert.deepEqual(resolveProvisioningIdentity({ sub: 'google-oauth2|123', email: 'a@example.com' }), {
    auth0Subject: 'google-oauth2|123', email: 'a@example.com', displayName: 'a',
  });
});
test('archived and absent profiles never authorize', () => {
  assert.equal(isActiveProfile({ status: 'soft_deleted' }), false);
  assert.equal(isActiveProfile(null), false);
  assert.equal(isActiveProfile({ status: 'active' }), true);
});
