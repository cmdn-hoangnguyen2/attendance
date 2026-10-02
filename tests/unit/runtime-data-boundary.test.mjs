import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const scannerPath = new URL('../../scripts/scanRuntimeData.mjs', import.meta.url);
const databasePath = new URL('../integration/supabaseHarness.mjs', import.meta.url);
const contractsPath = new URL('../contracts/httpHarness.mjs', import.meta.url);

test('scanner refuses missing roots and roots without production source through helper and CLI', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cmdn-invalid-scan-'));
  try {
    const { scanRuntimeDataBoundary } = await import(scannerPath);
    for (const target of [join(root, 'does-not-exist'), root]) {
      await assert.rejects(() => scanRuntimeDataBoundary(target));
      const execution = spawnSync(process.execPath, [scannerPath.pathname, target], { encoding: 'utf8' });
      assert.notEqual(execution.status, 0);
      assert.ok(!execution.stdout.includes('zero findings'));
    }
    await mkdir(join(root, 'src'));
    assert.deepEqual(await scanRuntimeDataBoundary(root), []);
    assert.equal(spawnSync(process.execPath, [scannerPath.pathname, root]).status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scanner detects runtime boundaries and excludes test/documentation fixtures', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cmdn-runtime-boundary-'));
  try {
    const files = {
      'src/auth.ts': 'import { useAuthMock } from "@/context/AuthMockContext";\nprocess.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH;',
      'src/debt.ts': 'const MOCK_DEBTS = [];',
      'src/invite.tsx': 'const mockUsers = [{ id: "one" }];',
      'src/repository.ts': 'import { rooms } from "@/mocks";',
      'src/credentials.ts': 'const url = "https://placeholder.supabase.co"; const key = "dummy-client-secret";',
      'src/button.tsx': '<Button onClick={() => undefined} onPageChange={() => {}} />',
      'src/real.ts': 'const users = await repository.list(); const statusOptions = ["active"];',
      'tests/fixture.ts': 'const MOCK_DEBTS = [];',
      'docs/sample.ts': 'AuthMockContext',
      'src/feature/__tests__/fixture.ts': 'AuthMockContext',
    };
    for (const [file, content] of Object.entries(files)) {
      await mkdir(join(root, file, '..'), { recursive: true });
      await writeFile(join(root, file), content);
    }
    const { scanRuntimeDataBoundary } = await import(scannerPath);
    const findings = await scanRuntimeDataBoundary(root);
    assert.equal(findings.length, 9);
    for (const file of ['auth.ts', 'debt.ts', 'invite.tsx', 'repository.ts', 'credentials.ts', 'button.tsx']) {
      assert.ok(findings.some((finding) => finding.includes(file)), file);
    }
    assert.ok(findings.every((finding) => !finding.includes('fixture') && !finding.includes('real.ts')));
    assert.ok(findings.every((finding) => !finding.includes('dummy-client-secret')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

const safeDatabase = {
  CMDN_TEST_ENVIRONMENT: 'dedicated-test',
  CMDN_TEST_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  CMDN_TEST_SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst',
  CMDN_PRODUCTION_SUPABASE_PROJECT_REF: 'zyxwvutsrqponmlkjihg',
  CMDN_TEST_SUPABASE_SERVICE_ROLE_KEY: 'test-service',
  CMDN_TEST_SUPABASE_ANON_KEY: 'test-anonymous',
};

test('database harness fails closed on absent, ambiguous, production and malformed targets', async () => {
  const { requireTestTarget } = await import(databasePath);
  const unsafe = [
    {},
    { ...safeDatabase, CMDN_TEST_ENVIRONMENT: 'development' },
    { ...safeDatabase, CMDN_TEST_SUPABASE_PROJECT_REF: 'different' },
    { ...safeDatabase, CMDN_PRODUCTION_SUPABASE_PROJECT_REF: '' },
    { ...safeDatabase, CMDN_PRODUCTION_SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst' },
    { ...safeDatabase, CMDN_PRODUCTION_SUPABASE_PROJECT_REF: 'none' },
    { ...safeDatabase, CMDN_PRODUCTION_SUPABASE_PROJECT_REF: 'ABCDEFGHIJKLMNOPQRST' },
    { ...safeDatabase, CMDN_TEST_SUPABASE_PROJECT_REF: 'short', CMDN_TEST_SUPABASE_URL: 'https://short.supabase.co' },
    { ...safeDatabase, CMDN_TEST_SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrs1', CMDN_TEST_SUPABASE_URL: 'https://abcdefghijklmnopqrs1.supabase.co' },
    { ...safeDatabase, CMDN_TEST_SUPABASE_SERVICE_ROLE_KEY: '' },
    { ...safeDatabase, CMDN_TEST_SUPABASE_URL: 'https://dedicatedtest.supabase.co.evil.test' },
    { ...safeDatabase, CMDN_TEST_SUPABASE_URL: 'https://dedicatedtest.supabase.co/path' },
    { ...safeDatabase, CMDN_TEST_SUPABASE_URL: 'https://dedicatedtest.supabase.co:444' },
    { ...safeDatabase, CMDN_TEST_SUPABASE_URL: 'http://127.0.0.1:54321', CMDN_TEST_SUPABASE_PROJECT_REF: 'local', CMDN_TEST_ENVIRONMENT: '' },
  ];
  for (const environment of unsafe) assert.throws(() => requireTestTarget(environment));
  assert.deepEqual(requireTestTarget(safeDatabase), {
    url: 'https://abcdefghijklmnopqrst.supabase.co', serviceKey: 'test-service', anonymousKey: 'test-anonymous',
  });
  assert.equal(requireTestTarget({ ...safeDatabase, CMDN_TEST_SUPABASE_URL: 'http://127.0.0.1:54321', CMDN_TEST_SUPABASE_PROJECT_REF: 'local', CMDN_PRODUCTION_SUPABASE_PROJECT_REF: '' }).url, 'http://127.0.0.1:54321');
});

test('contract harness requires dedicated origin and real per-role cookies without leaking credentials', async () => {
  const { requireAuthenticatedContractSession } = await import(contractsPath);
  const safe = {
    CMDN_TEST_ENVIRONMENT: 'dedicated-test',
    CMDN_CONTRACT_BASE_URL: 'http://localhost:3100',
    CMDN_CONTRACT_DEDICATED_ORIGIN: 'http://localhost:3100',
    CMDN_PRODUCTION_APP_ORIGIN: 'https://production.example.com',
    CMDN_CONTRACT_MEMBER_COOKIE: 'appSession=private-test-value',
  };
  for (const environment of [{}, { ...safe, CMDN_TEST_ENVIRONMENT: 'dev' }, { ...safe, CMDN_CONTRACT_DEDICATED_ORIGIN: 'http://localhost:3000' }, { ...safe, CMDN_CONTRACT_BASE_URL: 'https://test.example.com', CMDN_CONTRACT_DEDICATED_ORIGIN: 'https://test.example.com', CMDN_PRODUCTION_APP_ORIGIN: '' }, { ...safe, CMDN_PRODUCTION_APP_ORIGIN: 'http://localhost:3100' }, { ...safe, CMDN_CONTRACT_MEMBER_COOKIE: 'private-test-value' }, { ...safe, CMDN_CONTRACT_MEMBER_COOKIE: 'appSession=secret\r\nInjected: value' }]) {
    assert.throws(() => requireAuthenticatedContractSession('member', environment), (error) => !error.message.includes('private-test-value') && !error.message.includes('secret'));
  }
  assert.throws(() => requireAuthenticatedContractSession('owner', safe));
  assert.throws(() => requireAuthenticatedContractSession('superadmin', safe));
  assert.deepEqual(requireAuthenticatedContractSession('member', safe), { baseUrl: 'http://localhost:3100', cookie: 'appSession=private-test-value' });
  assert.equal(requireAuthenticatedContractSession('member', { ...safe, CMDN_PRODUCTION_APP_ORIGIN: '' }).baseUrl, 'http://localhost:3100');
});

test('test-only user factory produces isolated records matching the database insert contract', async () => {
  const { createUserFixture } = await import(databasePath);
  const first = createUserFixture();
  const second = createUserFixture();
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.auth0_subject, second.auth0_subject);
  assert.notEqual(first.email, second.email);
  assert.equal(first.role, 'user');
  assert.equal(createUserFixture({ role: 'admin' }).role, 'admin');
});

test('actual database preflight rejects missing tables and invalid counts without HEAD false positives', () => {
  function probe(status, body, contentRange) {
    // Replace transport only in this child process; the actual harness and installed SDK execute.
    const preload = `globalThis.fetch = async (input, options) => {
      const method = options?.method ?? 'GET';
      if (method === 'HEAD') return new Response(null, { status: 404 });
      const url = new URL(typeof input === 'string' ? input : input.url);
      const headers = new Headers(options?.headers);
      console.log(JSON.stringify({ method, limit: url.searchParams.get('limit'), exactCount: headers.get('prefer') === 'count=exact' }));
      return new Response(${JSON.stringify(body)}, { status: ${status}, headers: { 'Content-Type': 'application/json', ${contentRange === undefined ? '' : `'Content-Range': ${JSON.stringify(contentRange)}`} } });
    };`;
    return spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(preload)}`, databasePath.pathname], {
      env: { ...process.env, ...safeDatabase }, encoding: 'utf8', timeout: 10000,
    });
  }
  for (const result of [
    probe(404, JSON.stringify({ code: 'PGRST205', message: 'Missing table' })),
    probe(200, '[]'),
    probe(200, '[]', '*/-1'),
    probe(200, '[]', '*/invalid'),
  ]) {
    assert.equal(result.status, 1, result.stdout);
    assert.ok(result.stderr.includes('FAIL dedicated database verification'));
    assert.ok(!result.stdout.includes('PASS dedicated database connectivity'));
    assert.ok(!`${result.stdout}${result.stderr}`.includes(safeDatabase.CMDN_TEST_SUPABASE_SERVICE_ROLE_KEY));
  }
  for (const count of [0, 2]) {
    const result = probe(200, '[]', `*/${count}`);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes('PASS dedicated database connectivity'));
    assert.ok(result.stdout.includes('"method":"GET","limit":"0","exactCount":true'));
  }
});
