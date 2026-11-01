import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { CONSENT_SCOPE, CONSENT_VERSION, EXPORT_QUERY } from './index.mjs';
import { COLUMNS, toCsv } from '../scripts/export-subscribers.mjs';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
function fixture(withSchema = true) {
  const sql = new DatabaseSync(':memory:');
  if (withSchema) sql.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const keys = [];
  const statement = (query, args = []) => ({
    bind: (...values) => statement(query, values),
    run: async () => ({ success: true, meta: { changes: Number(sql.prepare(query).run(...args).changes) } }),
    first: async () => sql.prepare(query).get(...args) ?? null,
    all: async () => ({ success: true, results: sql.prepare(query).all(...args) })
  });
  const env = { DB: { prepare: query => statement(query) }, SIGNUPS_ENABLED: 'true', PUBLIC_BASE_URL: 'https://ive-updates.example.workers.dev',
    SIGNUP_LIMITER: { limit: async ({ key }) => { keys.push(key); return { success: true }; } } };
  return { sql, keys, env };
}
const valid = { email: 'Builder@Example.com', consent: true, consent_version: CONSENT_VERSION, source: 'home', website: '' };
const request = (data = valid, headers = {}) => new Request('https://ive-updates.example.workers.dev/api/subscribe', {
  method: 'POST', headers: { Origin: 'https://ive.dev', Accept: 'application/json', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data)
});
const rows = sql => sql.prepare('SELECT * FROM subscribers').all();

test('saves address, exact consent, source and time as unverified, without any external request', async () => {
  const { sql, env } = fixture(); let network = 0;
  globalThis.fetch = async () => { network++; throw new Error('No network allowed'); };
  const response = await worker.fetch(request({ ...valid, name: 'Ignored', ip: 'Ignored', verification: 'verified', confirmed_at: '2026-11-01' }), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, message: 'You’re on the list. Your email has been saved.' });
  const [row] = rows(sql);
  assert.equal(row.email, 'builder@example.com'); assert.equal(row.consent_scope, CONSENT_SCOPE); assert.equal(row.consent_version, CONSENT_VERSION);
  assert.match(row.consent_at, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.equal(row.source, 'home'); assert.equal(row.verification, 'unverified');
  assert.equal('name' in row, false); assert.equal('ip' in row, false); assert.equal('confirmed_at' in row, false);
  await worker.scheduled({}, env); assert.equal(network, 0); sql.close();
});
test('duplicate and concurrent requests preserve exactly one original consent record', async () => {
  const { sql, env } = fixture(); await worker.fetch(request(), env); const before = rows(sql)[0];
  const responses = await Promise.all(Array.from({ length: 8 }, () => worker.fetch(request({ ...valid, email: ' BUILDER@EXAMPLE.COM ', source: 'download' }), env)));
  assert(responses.every(response => response.status === 200)); assert.equal(rows(sql).length, 1); assert.deepEqual(rows(sql)[0], before); sql.close();
});
test('requires explicit current consent, an allowed source and a valid email', async () => {
  const { sql, env } = fixture();
  for (const change of [{ consent: false }, { consent: 'true' }, { consent: undefined }, { consent_version: 'old-beta-only' }, { source: 'import' }, { source: undefined }]) assert.equal((await worker.fetch(request({ ...valid, ...change }), env)).status, 400);
  for (const email of ['', 'bad', 'x@y', 'a b@example.com', 'a\nb@example.com', 'x'.repeat(255)+'@example.com']) assert.equal((await worker.fetch(request({ ...valid, email }), env)).status, 400);
  assert.equal(rows(sql).length, 0); sql.close();
});
test('valid quotes in an address are parameter-bound through real SQLite', async () => {
  const { sql, env } = fixture(); assert.equal((await worker.fetch(request({ ...valid, email: "quote'@example.com" }), env)).status, 200);
  assert.equal(rows(sql)[0].email, "quote'@example.com"); sql.close();
});
test('unready configuration fails before DB access; health exposes only readiness', async () => {
  const { sql, env } = fixture(); let accesses = 0;
  const disabled = { ...env, DB: { prepare() { accesses++; throw new Error('must not reach DB'); } }, SIGNUPS_ENABLED: 'false', SECRET: 'never-return' };
  assert.equal((await worker.fetch(request(), disabled)).status, 503);
  const health = await worker.fetch(new Request(env.PUBLIC_BASE_URL+'/health'), disabled);
  assert.equal(health.status, 503); assert.deepEqual(await health.json(), { ok: false, ready: false }); assert.equal(accesses, 0);
  for (const override of [{ DB: null }, { SIGNUP_LIMITER: null }, { PUBLIC_BASE_URL: 'http://wrong.example' }]) assert.equal((await worker.fetch(request(), { ...env, ...override })).status, 503);
  assert.equal(rows(sql).length, 0);
  const ready = await worker.fetch(new Request(env.PUBLIC_BASE_URL+'/health'), env); assert.equal(ready.status, 200); assert.deepEqual(await ready.json(), { ok: true, ready: true });
  const empty = fixture(false); assert.equal((await worker.fetch(new Request(env.PUBLIC_BASE_URL+'/health'), empty.env)).status, 503); empty.sql.close(); sql.close();
});
test('honeypot saves nothing; rate limits normalize IPv6 /64 and return retry guidance', async () => {
  const { sql, env, keys } = fixture();
  assert.equal((await worker.fetch(request({ ...valid, website: 'bot' }, { 'CF-Connecting-IP': '2001:DB8:aa::1' }), env)).status, 200);
  await worker.fetch(request({ ...valid, website: 'bot' }, { 'CF-Connecting-IP': '2001:db8:aa:0:ffff:1:2:3' }), env);
  assert.deepEqual(keys, ['2001:0db8:00aa:0000::/64', '2001:0db8:00aa:0000::/64']);
  const denied = await worker.fetch(request(), { ...env, SIGNUP_LIMITER: { limit: async () => ({ success: false }) } });
  assert.equal(denied.status, 429); assert.equal(denied.headers.get('Retry-After'), '60'); assert.equal(rows(sql).length, 0); sql.close();
});
test('only allowed origins receive CORS and signup; no GET endpoint reveals the list', async () => {
  const { sql, env } = fixture();
  for (const Origin of ['https://evil.example', 'null', 'https://ive.dev.evil.example']) {
    const response = await worker.fetch(request(valid, { Origin }), env); assert.equal(response.status, 403); assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
  const options = await worker.fetch(new Request(env.PUBLIC_BASE_URL+'/api/subscribe', { method: 'OPTIONS', headers: { Origin: 'https://ive.dev' } }), env);
  assert.equal(options.status, 204); assert.equal(options.headers.get('Access-Control-Allow-Origin'), 'https://ive.dev');
  assert.equal((await worker.fetch(new Request(env.PUBLIC_BASE_URL+'/api/subscribe'), env)).status, 405);
  for (const path of ['/subscribers', '/confirm?token=x', '/unsubscribe?token=x']) assert.equal((await worker.fetch(new Request(env.PUBLIC_BASE_URL+path), env)).status, 404);
  assert.equal(rows(sql).length, 0); sql.close();
});
test('native form works without JS and never echoes personal data or asks for email confirmation', async () => {
  const { sql, env } = fixture();
  const req = new Request(env.PUBLIC_BASE_URL+'/api/subscribe', { method: 'POST', headers: { Origin: 'https://ive.dev' }, body: new URLSearchParams({ ...valid, consent: 'yes', email: 'native@example.com', source: 'download' }) });
  const response = await worker.fetch(req, env); const html = await response.text();
  assert.equal(response.status, 200); assert.match(html, /Your email has been saved/); assert.doesNotMatch(html, /native@example.com|Check your inbox|confirmation email/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store'); assert.equal(rows(sql)[0].source, 'download'); sql.close();
});
test('malformed data, wrong content types and oversized bodies fail before save; DB errors are generic', async () => {
  const { sql, env } = fixture();
  for (const value of [null, [], 123, 'hello']) assert.equal((await worker.fetch(request(value), env)).status, 400);
  assert.equal((await worker.fetch(request(valid, { 'Content-Type': 'text/plain' }), env)).status, 415);
  assert.equal((await worker.fetch(request({ ...valid, ignored: 'x'.repeat(5000) }), env)).status, 413);
  assert.equal((await worker.fetch(request(valid, { 'Content-Length': '5000' }), env)).status, 413);
  const broken = await worker.fetch(request(), { ...env, DB: { prepare() { throw new Error('PRIVATE DATABASE DETAIL'); } } });
  assert.equal(broken.status, 503); assert.doesNotMatch(await broken.text(), /PRIVATE/); assert.equal(rows(sql).length, 0); sql.close();
});
test('CSV exports only current recent consent, clearly labeled unverified and formula-safe', async () => {
  const { sql, env } = fixture(); await worker.fetch(request(), env);
  await worker.fetch(request({ ...valid, email: 'old@example.com' }), env);
  sql.exec("UPDATE subscribers SET consent_at=datetime('now','-13 months') WHERE email='old@example.com'");
  await worker.fetch(request({ ...valid, email: 'legacy@example.com' }), env);
  sql.exec("UPDATE subscribers SET consent_scope='old beta only',consent_version='old' WHERE email='legacy@example.com'");
  const exported = sql.prepare(EXPORT_QUERY).all(); assert.equal(exported.length, 1); assert.equal(exported[0].email, 'builder@example.com'); assert.equal(exported[0].verification, 'unverified');
  const csv = toCsv(exported); assert(csv.startsWith('\uFEFF'+COLUMNS.join(','))); assert.match(csv, /"unverified"/); assert.doesNotMatch(csv, /old@example.com|legacy@example.com/);
  assert.match(toCsv([{ email: '=FORMULA@example.com', source: 'a"b', verification: 'unverified' }]), /"'=FORMULA@example.com","a""b"/); sql.close();
});
test('cleanup removes only entries at least twelve months old and never sends messages', async () => {
  const { sql, env } = fixture(); await worker.fetch(request(), env);
  await worker.fetch(request({ ...valid, email: 'old@example.com' }), env); await worker.fetch(request({ ...valid, email: 'boundary@example.com' }), env);
  sql.exec("UPDATE subscribers SET consent_at=datetime('now','-13 months') WHERE email='old@example.com'");
  sql.exec("UPDATE subscribers SET consent_at=datetime('now','-12 months') WHERE email='boundary@example.com'");
  let network = 0; globalThis.fetch = async () => { network++; throw new Error('must not send'); };
  await worker.scheduled({}, env); assert.deepEqual(rows(sql).map(row => row.email), ['builder@example.com']); assert.equal(network, 0); sql.close();
});
