import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isActiveProfile, resolveGlobalRole, resolveProvisioningIdentity } from '../../src/lib/authClaims.mjs';

test('onboarding uses verified immutable subject and trusted global role', () => {
  const claims = { sub: 'google-oauth2|123', email: 'nvhoang2012002@gmail.com', name: 'Hoang Nguyen', 'https://diemdanh.cmdn/role': 'admin' };
  const identity = resolveProvisioningIdentity(claims);
  assert.deepEqual(identity, { auth0Subject: 'google-oauth2|123', email: 'nvhoang2012002@gmail.com', displayName: 'Hoang Nguyen' });
  assert.equal(resolveGlobalRole(claims), 'admin');
  assert.equal(resolveGlobalRole({ ...claims, 'https://diemdanh.cmdn/role': undefined }), 'user');
});
test('display name uses name, nickname then email prefix', () => {
  const claims = { sub: 'auth0|123', email: 'alexander.great@domain.com', name: 'Full Name', nickname: 'nick' };
  assert.equal(resolveProvisioningIdentity(claims).displayName, 'Full Name');
  assert.equal(resolveProvisioningIdentity({ ...claims, name: '' }).displayName, 'nick');
  assert.equal(resolveProvisioningIdentity({ ...claims, name: '', nickname: '' }).displayName, 'alexander.great');
});
test('incomplete session fails explicitly and archived user is denied', () => {
  assert.throws(() => resolveProvisioningIdentity({}), /subject/);
  assert.throws(() => resolveProvisioningIdentity({ sub: 'auth0|123' }), /email/);
  assert.equal(isActiveProfile({ status: 'soft_deleted' }), false);
  assert.equal(isActiveProfile({ status: 'active' }), true);
});
test('only documented namespaced role arrays are trusted', () => {
  assert.equal(resolveGlobalRole({ 'https://diemdanh.cmdn/roles': ['admin'] }), 'admin');
  assert.equal(resolveGlobalRole({ 'https://diemdanh.cmdn/permissions': ['admin'] }), 'admin');
  assert.equal(resolveGlobalRole({ roles: ['admin'], permissions: ['admin'], scope: 'admin' }), 'user');
  assert.equal(resolveGlobalRole({ 'https://diemdanh.cmdn/roles': 'admin' }), 'user');
});
