import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { CONSENT_SCOPE, CONSENT_VERSION, EXPORT_QUERY } from './index.mjs';
import { COLUMNS, toCsv } from '../scripts/export-subscribers.mjs';
import { confirmationEmail } from './email.mjs';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const BASE = 'https://ive-updates.example.workers.dev';
const valid = { email: 'Builder@Example.com', consent: true, consent_version: CONSENT_VERSION, source: 'home', website: '' };
function fixture(withSchema = true) {
  const sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  if (withSchema) sql.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const keys = [], mails = [];
  const statement = (query, args = []) => ({
    bind: (...values) => statement(query, values),
    run: async () => ({ success: true, meta: { changes: Number(sql.prepare(query).run(...args).changes) } }),
    first: async () => sql.prepare(query).get(...args) ?? null,
    all: async () => ({ success: true, results: sql.prepare(query).all(...args) })
  });
  const env = { DB: { prepare: query => statement(query) }, SIGNUPS_ENABLED: 'true', PUBLIC_BASE_URL: BASE,
    EMAIL_ACCOUNT_ID: '1'.repeat(32), EMAIL_API_TOKEN: 'test-only',
    SIGNUP_LIMITER: { limit: async ({ key }) => { keys.push(key); return { success: true }; } } };
  globalThis.fetch = async (url, init) => {
    const mail = JSON.parse(init.body); mails.push(mail);
    assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/${env.EMAIL_ACCOUNT_ID}/email/sending/send`);
    assert.equal(init.redirect, 'error');
    return Response.json({ success: true, result: { queued: [mail.to], delivered: [], permanent_bounces: [] } });
  };
  return { sql, keys, mails, env };
}
const request = (data = valid, headers = {}, path = '/api/subscribe') => new Request(BASE+path, {
  method: 'POST', headers: { Origin: 'https://ive.dev', Accept: 'application/json', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data)
});
const rows = sql => sql.prepare('SELECT * FROM subscribers').all();
const tokens = sql => sql.prepare('SELECT * FROM confirmation_tokens ORDER BY created_at').all();
const link = mail => mail.text.match(/https:\/\/[^\s]+\/confirm\?token=[A-Za-z0-9_-]{43}/)[0];
const token = mail => new URL(link(mail)).searchParams.get('token');
const confirm = (env, mail) => worker.fetch(request({ token: token(mail) }, { Origin: BASE }, '/confirm'), env);

test('signup sends one neutral confirmation but remains ineligible until an explicit confirmation', async () => {
  const { sql, env, mails } = fixture();
  const response = await worker.fetch(request({ ...valid, confirmed_at: 'forged', confirmation_method: 'email-link', verification: 'confirmed' }), env);
  assert.equal(response.status, 200); assert.match((await response.json()).message, /Check your inbox/);
  const [row] = rows(sql);
  assert.equal(row.email, 'builder@example.com'); assert.equal(row.consent_scope, CONSENT_SCOPE);
  assert.equal(row.consent_version, CONSENT_VERSION); assert.equal(row.confirmed_at, null);
  assert.equal(row.confirmation_method, null); assert.equal(row.initial_verification, 'unverified');
  assert.match(row.pending_expires_at, /^\d{4}-\d{2}-\d{2} /);
  assert.equal(sql.prepare(EXPORT_QUERY).all().length, 0); assert.equal(mails.length, 1);
  assert.equal(mails[0].from.address, 'beta@ive.dev'); assert.equal(mails[0].reply_to, 'contact@aiforgov.eu');
  assert.equal(mails[0].to, 'builder@example.com'); assert(mails[0].text.includes(CONSENT_SCOPE));
  assert.match(tokens(sql)[0].token_hash, /^[a-f0-9]{64}$/);
  assert(!JSON.stringify(rows(sql)).includes(token(mails[0]))); assert(!JSON.stringify(tokens(sql)).includes(token(mails[0])));
  sql.close();
});
test('GET and mail scanners never confirm; explicit native POST confirms once without another email', async () => {
  const { sql, env, mails } = fixture(); await worker.fetch(request(), env);
  for (let i=0; i<2; i++) {
    const page = await worker.fetch(new Request(link(mails[0])), env); const html = await page.text();
    assert.equal(page.status, 200); assert.match(html, /method="post"/); assert.match(html, /Confirm my subscription/);
    assert.doesNotMatch(html, /builder@example.com|<script|<img/);
    assert.equal(page.headers.get('Cache-Control'), 'no-store'); assert.equal(page.headers.get('Referrer-Policy'), 'strict-origin');
    assert.match(page.headers.get('Content-Security-Policy'), /form-action 'self'/);
    assert.equal(rows(sql)[0].confirmed_at, null);
  }
  assert.equal((await worker.fetch(new Request(link(mails[0]), { method: 'HEAD' }), env)).status, 405);
  const post = new Request(BASE+'/confirm', { method: 'POST', headers: { Origin: BASE }, body: new URLSearchParams({ token: token(mails[0]) }) });
  const success = await worker.fetch(post, env); assert.equal(success.status, 200); assert.match(await success.text(), /Your email is confirmed/);
  const before = rows(sql)[0]; assert.match(before.confirmed_at, /^\d{4}-\d{2}-\d{2} /); assert.equal(before.confirmation_method, 'email-link');
  assert.equal(tokens(sql)[0].used_at, before.confirmed_at);
  assert.equal((await confirm(env,mails[0])).status, 200);
  assert.deepEqual(rows(sql)[0],before); assert.equal(mails.length, 1); assert.equal(sql.prepare(EXPORT_QUERY).all().length, 1); sql.close();
});
test('duplicate and concurrent signups reserve only one message and preserve consent', async () => {
  const { sql, env, mails } = fixture();
  const responses = await Promise.all(Array.from({ length: 8 }, () => worker.fetch(request(), env)));
  assert(responses.every(r => [200,503].includes(r.status))); assert.equal(mails.length, 1); assert.equal(rows(sql).length, 1);
  const before = rows(sql)[0];
  const duplicate = await worker.fetch(request({ ...valid, email: ' BUILDER@EXAMPLE.COM ', source: 'download' }), env);
  assert.equal(duplicate.status,200); assert.deepEqual(rows(sql)[0],before); assert.equal(mails.length,1);
  await confirm(env,mails[0]); const confirmed = rows(sql)[0];
  await worker.fetch(request(),env); assert.deepEqual(rows(sql)[0],confirmed); assert.equal(mails.length,1); sql.close();
});
test('requires explicit current consent, valid email and allowed source; SQL values stay bound', async () => {
  const { sql, env } = fixture();
  for (const change of [{ consent: false }, { consent: 'true' }, { consent: undefined }, { consent_version: 'old' }, { source: 'import' }, { source: undefined }]) assert.equal((await worker.fetch(request({ ...valid, ...change }), env)).status,400);
  for (const email of ['', 'bad', 'x@y', 'a b@example.com', 'a\nb@example.com', 'x'.repeat(255)+'@example.com']) assert.equal((await worker.fetch(request({ ...valid,email }),env)).status,400);
  assert.equal(rows(sql).length,0);
  assert.equal((await worker.fetch(request({ ...valid,email:"quote'@example.com" }),env)).status,200);
  assert.equal(rows(sql)[0].email,"quote'@example.com"); sql.close();
});
test('missing mail credentials, disabled service and incomplete schemas fail closed', async () => {
  const { sql, env } = fixture();
  for (const override of [{ EMAIL_API_TOKEN: '' }, { EMAIL_ACCOUNT_ID: '' }, { SIGNUPS_ENABLED:'false' }, { DB:null }, { SIGNUP_LIMITER:null }, { PUBLIC_BASE_URL:'http://unsafe.example' }]) {
    assert.equal((await worker.fetch(request(),{...env,...override})).status,503);
    const health = await worker.fetch(new Request(BASE+'/health'),{...env,...override});
    assert.equal(health.status,503); assert.deepEqual(await health.json(),{ok:false,ready:false});
  }
  assert.equal(rows(sql).length,0);
  assert.equal((await worker.fetch(new Request(BASE+'/health'),env)).status,200);
  const empty=fixture(false); assert.equal((await worker.fetch(new Request(BASE+'/health'),empty.env)).status,503); empty.sql.close(); sql.close();
});
test('confirmation still works when new signup sending is paused or the API key is removed', async () => {
  const {sql,env,mails}=fixture(); await worker.fetch(request(),env);
  assert.equal((await confirm({...env,SIGNUPS_ENABLED:'false',EMAIL_API_TOKEN:''},mails[0])).status,200);
  assert.equal(sql.prepare(EXPORT_QUERY).all().length,1); sql.close();
});
test('honeypot, IPv6 /64 and rate limit stop abuse without sending', async () => {
  const {sql,env,keys,mails}=fixture();
  for(const ip of ['2001:DB8:aa::1','2001:db8:aa:0:ffff:1:2:3']) assert.equal((await worker.fetch(request({...valid,website:'bot'},{'CF-Connecting-IP':ip}),env)).status,200);
  assert.deepEqual(keys,['2001:0db8:00aa:0000::/64','2001:0db8:00aa:0000::/64']);
  const response=await worker.fetch(request(),{...env,SIGNUP_LIMITER:{limit:async()=>({success:false})}});
  assert.equal(response.status,429); assert.equal(response.headers.get('Retry-After'),'60'); assert.equal(mails.length,0); assert.equal(rows(sql).length,0); sql.close();
});
test('CORS rejects foreign origins for signup and confirmation; private lists have no public route', async () => {
  const {sql,env,mails}=fixture(); await worker.fetch(request(),env);
  for(const Origin of ['https://evil.example','null','https://ive.dev.evil.example']) {
    for(const [path,data] of [['/api/subscribe',valid],['/confirm',{token:token(mails[0])}]]) {
      const response=await worker.fetch(request(data,{Origin},path),env); assert.equal(response.status,403); assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
    }
  }
  assert.equal(rows(sql)[0].confirmed_at,null);
  const options=await worker.fetch(new Request(BASE+'/api/subscribe',{method:'OPTIONS',headers:{Origin:'https://ive.dev'}}),env);
  assert.equal(options.status,204); assert.equal(options.headers.get('Access-Control-Allow-Origin'),'https://ive.dev');
  for(const path of ['/subscribers','/export']) assert.equal((await worker.fetch(new Request(BASE+path),env)).status,404);
  assert.equal((await worker.fetch(new Request(BASE+'/api/subscribe'),env)).status,405); sql.close();
});
test('native signup works without JS and does not echo the address', async () => {
  const {sql,env}=fixture();
  const req=new Request(BASE+'/api/subscribe',{method:'POST',headers:{Origin:'https://ive.dev'},body:new URLSearchParams({...valid,consent:'yes',email:'native@example.com',source:'download'})});
  const response=await worker.fetch(req,env); const html=await response.text(); assert.equal(response.status,200);
  assert.match(html,/Check your inbox/); assert.doesNotMatch(html,/native@example.com/); assert.equal(rows(sql)[0].confirmed_at,null); sql.close();
});
test('malformed, oversized or unexpected content fails before persistence; errors reveal no internals', async () => {
  const {sql,env}=fixture();
  for(const data of [null,[],123,'hello']) assert.equal((await worker.fetch(request(data),env)).status,400);
  assert.equal((await worker.fetch(request(valid,{'Content-Type':'text/plain'}),env)).status,415);
  assert.equal((await worker.fetch(request({...valid,ignored:'x'.repeat(5000)}),env)).status,413);
  assert.equal((await worker.fetch(request(valid,{'Content-Length':'5000'}),env)).status,413);
  const broken=await worker.fetch(request(),{...env,DB:{prepare(){throw new Error('PRIVATE DATABASE DETAIL');}}});
  assert.equal(broken.status,503); assert.doesNotMatch(await broken.text(),/PRIVATE/); assert.equal(rows(sql).length,0); sql.close();
});
test('invalid, altered and expired tokens cannot confirm or export; GET never refreshes expiry', async () => {
  const {sql,env,mails}=fixture(); await worker.fetch(request(),env);
  const original=tokens(sql)[0];
  for(const t of ['x','A'.repeat(43),'<script>','',null]) assert.equal((await worker.fetch(request({token:t},{Origin:BASE},'/confirm'),env)).status,410);
  assert.deepEqual(tokens(sql)[0],original);
  sql.exec("UPDATE confirmation_tokens SET expires_at=datetime('now','-1 second')");
  assert.equal((await confirm(env,mails[0])).status,410);
  assert.equal((await worker.fetch(new Request(link(mails[0])),env)).status,410);
  assert.equal(rows(sql)[0].confirmed_at,null); assert.equal(sql.prepare(EXPORT_QUERY).all().length,0); sql.close();
});
test('failed resend keeps the earlier link usable and never activates a subscription', async () => {
  const {sql,env,mails}=fixture(); await worker.fetch(request(),env); const first=mails[0];
  sql.exec("UPDATE confirmation_tokens SET created_at=datetime('now','-11 minutes')");
  globalThis.fetch=async()=>{throw new Error('provider unavailable PRIVATE');};
  const fail=await worker.fetch(request(),env); assert.equal(fail.status,503); assert.doesNotMatch(await fail.text(),/PRIVATE/);
  assert.equal(tokens(sql).length,2); assert.equal(rows(sql)[0].confirmed_at,null); assert.equal(sql.prepare(EXPORT_QUERY).all().length,0);
  assert.equal((await confirm(env,first)).status,200); sql.close();
});
test('a 200 with no accepted recipient, bounced recipient or an API error is never success', async () => {
  const {sql,env}=fixture();
  const outcomes=[{success:true,result:{}},{success:true,result:{permanent_bounces:['b1@example.com']}},{success:false,errors:[{message:'PRIVATE'}]}];
  for(let i=0;i<outcomes.length;i++) {
    globalThis.fetch=async()=>Response.json(outcomes[i]);
    const response=await worker.fetch(request({...valid,email:`b${i}@example.com`}),env);
    assert.equal(response.status,503); assert.doesNotMatch(await response.text(),/PRIVATE/);
  }
  assert.equal(sql.prepare(EXPORT_QUERY).all().length,0); assert(tokens(sql).every(t=>t.send_status==='failed')); sql.close();
});
test('per-address and daily budgets apply atomically, including concurrent new addresses', async () => {
  const {sql,env,mails}=fixture();
  for(let i=0;i<3;i++) { assert.equal((await worker.fetch(request(),env)).status,200); sql.exec("UPDATE confirmation_tokens SET created_at=datetime('now','-11 minutes')"); }
  await worker.fetch(request(),env); assert.equal(mails.length,3);
  sql.exec("UPDATE send_budget SET attempts=499 WHERE day=date('now')");
  await Promise.all(Array.from({length:8},(_,i)=>worker.fetch(request({...valid,email:`budget${i}@example.com`}),env)));
  assert.equal(mails.length,4); assert.equal(sql.prepare('SELECT attempts FROM send_budget').get().attempts,500); sql.close();
});
test('exports require actual confirmation, current exact consent, and retention; CSV is private-data safe', async () => {
  const {sql,env,mails}=fixture(); await worker.fetch(request(),env); await confirm(env,mails[0]);
  for(const name of ['pending','old','legacy']) {
    await worker.fetch(request({...valid,email:name+'@example.com'}),env);
    if(name!=='pending') await confirm(env,mails.at(-1));
  }
  sql.exec("UPDATE subscribers SET consent_at=datetime('now','-13 months') WHERE email='old@example.com'");
  sql.exec("UPDATE subscribers SET consent_scope='old beta only',consent_version='old' WHERE email='legacy@example.com'");
  const exported=sql.prepare(EXPORT_QUERY).all(); assert.equal(exported.length,1); assert.equal(exported[0].email,'builder@example.com');
  assert.equal(exported[0].verification,'confirmed'); assert.equal(exported[0].confirmation_method,'email-link');
  const csv=toCsv(exported); assert(csv.startsWith('\uFEFF'+COLUMNS.join(','))); assert.match(csv,/"confirmed"/); assert.doesNotMatch(csv,/pending@example.com|old@example.com|legacy@example.com/);
  assert.match(toCsv([{email:'=FORMULA@example.com',source:'a"b'}]),/"'=FORMULA@example.com","a""b"/); sql.close();
});
test('additive migration preserves legacy rows but cannot make them exportable or send email', async () => {
  const {sql,env,mails}=fixture(false);
  sql.exec(`CREATE TABLE subscribers (id TEXT PRIMARY KEY,email TEXT NOT NULL COLLATE NOCASE UNIQUE,consent_scope TEXT NOT NULL,consent_version TEXT NOT NULL,consent_at TEXT NOT NULL DEFAULT (datetime('now')),source TEXT NOT NULL CHECK(source IN ('home','download')),verification TEXT NOT NULL DEFAULT 'unverified' CHECK(verification='unverified')); CREATE INDEX subscribers_consent_at ON subscribers(consent_at);`);
  sql.prepare('INSERT INTO subscribers (id,email,consent_scope,consent_version,source) VALUES (?,?,?,?,?)').run('legacy','legacy@example.com',CONSENT_SCOPE,CONSENT_VERSION,'download');
  const before=sql.prepare('SELECT * FROM subscribers').get();
  sql.exec(readFileSync(new URL('../migrations/0001_double_opt_in.sql',import.meta.url),'utf8'));
  const after=rows(sql)[0]; assert.equal(after.email,before.email); assert.equal(after.consent_at,before.consent_at); assert.equal(after.initial_verification,'unverified'); assert.equal(after.confirmed_at,null);
  assert.equal(sql.prepare(EXPORT_QUERY).all().length,0); await worker.scheduled({},env); assert.equal(mails.length,0);
  await worker.fetch(request({...valid,email:'legacy@example.com'}),env); assert.equal(mails.length,1); assert.equal(rows(sql)[0].confirmed_at,null);
  await confirm(env,mails[0]); assert.equal(sql.prepare(EXPORT_QUERY).all().length,1); sql.close();
});
test('cleanup expires pending requests and tokens, preserves recent confirmations, and never sends', async () => {
  const {sql,env,mails}=fixture(); await worker.fetch(request(),env); await confirm(env,mails[0]);
  for(const name of ['pending','old','boundary']) await worker.fetch(request({...valid,email:name+'@example.com'}),env);
  sql.exec("UPDATE subscribers SET pending_expires_at=datetime('now','-1 second') WHERE email='pending@example.com'");
  sql.exec("UPDATE subscribers SET consent_at=datetime('now','-13 months') WHERE email='old@example.com'");
  sql.exec("UPDATE subscribers SET consent_at=datetime('now','-12 months') WHERE email='boundary@example.com'");
  const before=mails.length; await worker.scheduled({},env);
  assert.deepEqual(rows(sql).map(r=>r.email),['builder@example.com']); assert.equal(tokens(sql).length,1); assert.equal(mails.length,before);
  sql.exec("DELETE FROM subscribers WHERE email='builder@example.com'"); assert.equal(tokens(sql).length,0); sql.close();
});
test('confirmation templates contain consent, expiry, withdrawal, company and no remote tracking', () => {
  const mail=confirmationEmail(BASE+'/confirm?token='+'a'.repeat(43),CONSENT_SCOPE);
  assert(mail.text.includes(CONSENT_SCOPE)); assert.match(mail.text,/7 days|contact@aiforgov.eu|AIFOREU GmbH/);
  assert.doesNotMatch(mail.html,/<img|<script|utm_|unsubscribe\?email=/);
});
