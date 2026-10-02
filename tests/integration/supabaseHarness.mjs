import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

export function requireTestTarget(environment = process.env) {
  if (environment.CMDN_TEST_ENVIRONMENT !== 'dedicated-test') throw new Error('Dedicated test environment marker required');
  const url = new URL(environment.CMDN_TEST_SUPABASE_URL || 'invalid');
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Test URL must be a plain origin');
  const reference = environment.CMDN_TEST_SUPABASE_PROJECT_REF;
  const local = url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && url.port === '54321';
  const productionReference = environment.CMDN_PRODUCTION_SUPABASE_PROJECT_REF?.trim();
  if (local && reference !== 'local') throw new Error('Local disposable target requires local reference');
  if (!local && (url.protocol !== 'https:' || url.port || !/^[a-z]{20}$/.test(reference || '') || url.hostname !== `${reference}.supabase.co` || !/^[a-z]{20}$/.test(productionReference || ''))) throw new Error('Remote dedicated target requires matching 20-letter reference and valid explicit production exclusion');
  if (reference === productionReference) throw new Error('Production target refused');
  const serviceKey = environment.CMDN_TEST_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonymousKey = environment.CMDN_TEST_SUPABASE_ANON_KEY?.trim();
  if (!serviceKey || !anonymousKey) throw new Error('Dedicated test service and anonymous credentials required');
  return { url: url.origin, serviceKey, anonymousKey };
}

export function createTestClients(environment = process.env) {
  const { url, serviceKey, anonymousKey } = requireTestTarget(environment);
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return { service: createClient(url, serviceKey, options), anonymous: createClient(url, anonymousKey, options) };
}

// Test-only controlled values. Callers must insert/clean only their own IDs on the guarded target.
export function createUserFixture(overrides = {}) {
  const id = randomUUID();
  return { id, auth0_subject: `test|${id}`, email: `test-${id}@example.invalid`, display_name: 'Integration User', role: 'user', status: 'active', ...overrides };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { service } = createTestClients();
    // HEAD can lose a missing-table 404 body in the installed SDK; zero-row GET preserves it.
    const { count, error } = await service.from('users').select('id', { count: 'exact', head: false }).limit(0);
    if (error || !Number.isInteger(count) || count < 0) throw new Error('Dedicated database read failed');
    console.log('PASS dedicated database connectivity (read-only); domain integration suites remain required');
  } catch {
    console.error('FAIL dedicated database verification: check dedicated target configuration and database availability');
    process.exitCode = 1;
  }
}
