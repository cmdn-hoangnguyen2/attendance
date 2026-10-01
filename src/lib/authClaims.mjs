/** @param {Record<string, unknown>} claims @returns {'admin' | 'user'} */
export function resolveGlobalRole(claims) {
  if (claims['https://diemdanh.cmdn/role'] === 'admin') return 'admin';
  for (const key of ['https://diemdanh.cmdn/roles', 'https://diemdanh.cmdn/permissions']) {
    const values = claims[key];
    if (Array.isArray(values) && values.includes('admin')) return 'admin';
  }
  return 'user';
}
/** @param {Record<string, unknown>} claims */
export function resolveProvisioningIdentity(claims) {
  if (typeof claims.sub !== 'string' || !claims.sub.trim()) throw new Error('Verified Auth0 subject required');
  if (typeof claims.email !== 'string' || !claims.email.trim()) throw new Error('Verified Auth0 email required for profile provisioning');
  const name = typeof claims.name === 'string' && claims.name.trim();
  const nickname = typeof claims.nickname === 'string' && claims.nickname.trim();
  return { auth0Subject: claims.sub, email: claims.email, displayName: name || nickname || claims.email.split('@')[0] || 'User' };
}
/** @param {{status: string} | null} profile */
export function isActiveProfile(profile) { return profile?.status === 'active'; }
