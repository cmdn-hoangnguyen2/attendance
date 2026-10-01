import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function requireAuthenticatedContractSession(role, environment = process.env) {
  if (!['member', 'owner', 'admin'].includes(role)) throw new Error('Unsupported contract identity role');
  if (environment.CMDN_TEST_ENVIRONMENT !== 'dedicated-test') throw new Error('Dedicated test environment marker required');
  const base = new URL(environment.CMDN_CONTRACT_BASE_URL || 'invalid');
  const dedicated = new URL(environment.CMDN_CONTRACT_DEDICATED_ORIGIN || 'invalid');
  if (base.username || base.password || base.search || base.hash || base.pathname !== '/' || dedicated.href !== base.href) throw new Error('Contract base must match a dedicated plain origin');
  const local = base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  const productionOrigin = environment.CMDN_PRODUCTION_APP_ORIGIN;
  if (!local && (base.protocol !== 'https:' || !productionOrigin)) throw new Error('Remote contract target requires production exclusion');
  if (productionOrigin && new URL(productionOrigin).origin === base.origin) throw new Error('Production contract target refused');
  const cookie = environment[`CMDN_CONTRACT_${role.toUpperCase()}_COOKIE`];
  if (!cookie || /[\r\n]/.test(cookie) || !/^[^=;\s]+=[^;]+(?:;\s*[^=;\s]+=[^;]+)*$/.test(cookie)) throw new Error('Real Auth0 session cookie required for requested role');
  return { baseUrl: base.origin, cookie };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    for (const role of ['member', 'owner', 'admin']) {
      const { baseUrl, cookie } = requireAuthenticatedContractSession(role);
      const response = await fetch(`${baseUrl}/auth/profile`, { headers: { Cookie: cookie }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
      if (response.status !== 200) throw new Error('Session rejected');
      const profile = await response.json();
      if (typeof profile.sub !== 'string' || !profile.sub) throw new Error('Invalid authenticated profile');
      console.log(`PASS real Auth0 session for configured ${role} identity; domain authorization matrix remains required`);
    }
  } catch {
    console.error('FAIL authenticated contracts: check dedicated origin, real Auth0 sessions and application availability');
    process.exitCode = 1;
  }
}
