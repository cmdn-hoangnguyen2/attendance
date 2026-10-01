import assert from 'node:assert/strict';
import test from 'node:test';

const identity = {
  auth0Subject: 'auth0|immutable',
  email: 'member@example.invalid',
  displayName: 'Member',
};
const profile = {
  id: 'profile-id',
  ...identity,
  role: 'user',
  status: 'active',
  createdAt: 'before',
  updatedAt: 'before',
};
const helper = () => import('../../src/lib/server/provisionProfile.mjs');

test('repeated unchanged refresh reads fresh profile with zero writes', async () => {
  const { provisionProfile } = await helper();
  let reads = 0;
  const repository = {
    findByAuth0Subject: async (subject) => {
      assert.equal(subject, identity.auth0Subject);
      reads++;
      return profile;
    },
    createOrSync: async () => assert.fail('unchanged refresh must not write'),
  };
  assert.equal(await provisionProfile(repository, identity), profile);
  assert.equal(await provisionProfile(repository, identity), profile);
  assert.equal(reads, 2);
});

test('changed safe identity fields sync without role or lifecycle fields', async () => {
  const { provisionProfile } = await helper();
  const changed = {
    ...identity,
    email: 'changed@example.invalid',
    displayName: 'Changed',
  };
  let writes = 0;
  const updated = { ...profile, ...changed };
  const repository = {
    findByAuth0Subject: async () => profile,
    createOrSync: async (payload) => {
      writes++;
      assert.deepEqual(payload, changed);
      return updated;
    },
  };
  const result = await provisionProfile(repository, {
    ...changed,
    role: 'admin',
    status: 'active',
    deletedAt: null,
    deletedBy: null,
  });
  assert.equal(result, updated);
  assert.equal(writes, 1);
});

test('archived profile skips identity sync and reactivation', async () => {
  const { provisionProfile } = await helper();
  const archived = { ...profile, status: 'soft_deleted' };
  const repository = {
    findByAuth0Subject: async () => archived,
    createOrSync: async () => assert.fail('archived profile must not write'),
  };
  assert.equal(
    await provisionProfile(repository, {
      ...identity,
      email: 'changed@example.invalid',
    }),
    archived,
  );
});

test('lookup failure propagates without attempting provisioning', async () => {
  const { provisionProfile } = await helper();
  const failure = new Error('lookup unavailable');
  const repository = {
    findByAuth0Subject: async () => {
      throw failure;
    },
    createOrSync: async () => assert.fail('failed lookup must not write'),
  };
  await assert.rejects(
    provisionProfile(repository, identity),
    (error) => error === failure,
  );
});

test('missing profile provisions once using only immutable subject and identity fields', async () => {
  const { provisionProfile } = await helper();
  let writes = 0;
  const repository = {
    findByAuth0Subject: async (subject) => {
      assert.equal(subject, identity.auth0Subject);
      return null;
    },
    createOrSync: async (payload) => {
      writes++;
      assert.deepEqual(payload, identity);
      return profile;
    },
  };
  assert.equal(await provisionProfile(repository, identity), profile);
  assert.equal(writes, 1);
});
