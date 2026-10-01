import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const excluded = new Set(['tests', '__tests__', 'docs', 'node_modules', '.next']);
const rules = [
  ['mock-auth-context', /\bAuthMock(?:Context|Provider)\b/g],
  ['mock-auth-flag', /\bNEXT_PUBLIC_ALLOW_MOCK_AUTH\b/g],
  ['mock-debts', /\bMOCK_DEBTS\b/g],
  ['local-invitation-users', /\b(?:mockUsers|inviteUsers|invitationUsers)\s*(?::[^=;]+)?=\s*\[/g],
  ['runtime-mock-import', /(?:from\s*|import\s*\(|require\s*\()?["'][^"'\n]*(?:@\/mocks|src\/mocks|(?:\.\.\/|\.\/)mocks)(?:\/[^"'\n]*)?["']/g],
  ['dummy-supabase', /["'](?:https?:\/\/placeholder\.supabase\.co|placeholder-(?:service-)?key)["']/g],
  ['dummy-auth0', /["'](?:dummy\.auth0\.com|dummy-client-(?:id|secret)|0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef)["']/g],
  ['noop-handler', /\b(?:on[A-Z]\w*\s*=\s*\{?|(?:const\s+)?handle[A-Z]\w*\s*=)\s*\([^)]*\)\s*=>\s*(?:undefined\b|\{\s*\})/g],
];

export async function scanRuntimeDataBoundary(root) {
  const findings = [];
  const rootEntries = await readdir(root, { withFileTypes: true });
  const sources = rootEntries.filter((entry) => entry.isDirectory() && ['src', 'app', 'pages', 'public'].includes(entry.name));
  if (!sources.length) throw new Error('Runtime scan requires a production source directory');
  async function visit(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries) {
      const file = join(directory, entry.name);
      if (entry.isDirectory() && !excluded.has(entry.name)) await visit(file);
      if (!entry.isFile() || !['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.html'].includes(extname(file))) continue;
      if (/\.(?:test|spec)\.[^.]+$/.test(entry.name)) continue;
      const content = await readFile(file, 'utf8');
      for (const [name, expression] of rules) {
        for (const match of content.matchAll(expression)) {
          const line = content.slice(0, match.index).split('\n').length;
          findings.push(`${relative(root, file)}:${line} ${name}`);
        }
      }
    }
  }
  // ponytail: lexical known-pattern gate; new mock shapes need a rule and fixture test.
  for (const source of sources) await visit(join(root, source.name));
  return findings.sort();
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const findings = await scanRuntimeDataBoundary(resolve(process.argv[2] || '.'));
    console.log(findings.length ? findings.join('\n') : 'Runtime data boundary: zero findings');
    process.exitCode = findings.length ? 1 : 0;
  } catch {
    console.error('FAIL runtime data boundary: target must exist and contain a readable production source directory');
    process.exitCode = 1;
  }
}
