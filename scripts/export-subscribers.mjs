import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPORT_QUERY } from '../worker/index.mjs';

export const COLUMNS = ['email', 'source', 'consent_at', 'consent_scope', 'consent_version', 'verification'];
export function toCsv(rows) {
  const cell = value => {
    let text = String(value ?? '');
    if (/^\s*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [COLUMNS.join(','), ...rows.map(row => COLUMNS.map(key => cell(row[key])).join(','))].join('\r\n') + '\r\n';
}
function main() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  const database = config.d1_databases.find(item => item.binding === 'DB');
  if (!database || !database.database_id) throw new Error('Provision the subscriber database before exporting.');
  const args = ['d1', 'execute', database.database_name, '--remote', '--json', '--command', EXPORT_QUERY];
  // WRANGLER_CLI can point at an existing installation; nothing is downloaded.
  const command = process.env.WRANGLER_CLI ? process.execPath : 'npx';
  const commandArgs = process.env.WRANGLER_CLI ? [process.env.WRANGLER_CLI, ...args] : ['--no-install', 'wrangler', ...args];
  const result = JSON.parse(execFileSync(command, commandArgs, { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
  if (!Array.isArray(result) || result.some(item => item.success !== true)) throw new Error('Export failed.');
  const rows = result.flatMap(item => item.results || []);
  const stamp = new Date().toISOString().replaceAll(':', '-');
  const output = resolve(process.argv[2] || `${root}subscriber-exports/ive-unverified-${stamp}.csv`);
  mkdirSync(dirname(output), { recursive: true, mode: 0o700 });
  writeFileSync(output, toCsv(rows), { mode: 0o600, flag: 'wx' });
  console.log(`Exported ${rows.length} unverified entries to ${output}. No email was sent.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
