/**
 * @typedef {{auth0Subject: string, email: string, displayName: string}} Identity
 */

/**
 * Read current lifecycle on every request; unchanged reads must not emit updates.
 * Existing subject-conflict upsert handles creation without writing role/status.
 *
 * @template {{email: string, displayName: string, status: string}} Profile
 * @param {{
 *   findByAuth0Subject: (subject: string) => Promise<Profile | null>,
 *   createOrSync: (identity: Identity) => Promise<Profile>
 * }} repository
 * @param {Identity} identity
 * @returns {Promise<Profile>}
 */
export async function provisionProfile(repository, identity) {
  const profile = await repository.findByAuth0Subject(identity.auth0Subject);
  if (profile && profile.status !== 'active') return profile;
  if (profile && profile.email === identity.email && profile.displayName === identity.displayName) return profile;
  return repository.createOrSync({
    auth0Subject: identity.auth0Subject,
    email: identity.email,
    displayName: identity.displayName,
  });
}
