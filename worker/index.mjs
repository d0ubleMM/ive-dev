import { mailConfigured, sendConfirmation } from './email.mjs';

const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => escapes[char]);

export const CONSENT_VERSION = '2026-11-01-beta-news-v1';
export const CONSENT_SCOPE = 'I’d like emails from AIFOREU GmbH about IVE beta testing, product news and releases.';
export const EXPORT_QUERY = `SELECT email, consent_scope, consent_version, consent_at, source,
  'confirmed' AS verification, confirmed_at, confirmation_method
  FROM subscribers WHERE consent_version = '${CONSENT_VERSION}' AND consent_scope = '${CONSENT_SCOPE}'
  AND confirmed_at IS NOT NULL AND confirmation_method = 'email-link'
  AND consent_at > datetime('now', '-12 months') ORDER BY consent_at`;
const MAX_BODY = 4096;
const SUCCESS = 'Check your inbox. If your address still needs confirmation, use the link in our email to join the list. Check spam too. You can request another link after 10 minutes.';
const NOT_READY = 'The signup list is not available yet. Please try again later.';
const SEND_FAILED = 'We could not send a confirmation email. Please try again in 10 minutes, or contact contact@aiforgov.eu.';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

function baseUrl(env) {
  try {
    const url = new URL(env.PUBLIC_BASE_URL);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    return url.origin;
  } catch { return null; }
}
function allowedOrigin(origin, env) {
  return ['https://ive.dev', 'https://www.ive.dev', baseUrl(env)].filter(Boolean).includes(origin);
}
function configured(env) {
  return env.SIGNUPS_ENABLED === 'true' && Boolean(env.DB?.prepare && env.SIGNUP_LIMITER?.limit && baseUrl(env)) && mailConfigured(env);
}
function headers(request, env) {
  const origin = request.headers.get('Origin');
  return {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', Vary: 'Origin',
    ...(allowedOrigin(origin, env) ? { 'Access-Control-Allow-Origin': origin } : {})
  };
}
function htmlPage(title, message, form = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} · IVE</title><style>body{margin:0;background:#0e1014;color:#f2f3f5;font:18px/1.6 system-ui,sans-serif}main{max-width:560px;margin:12vh auto;padding:32px}h1{font-size:40px;line-height:1.1;letter-spacing:-.035em}p{color:#c6cad1}a{color:#ff4f9b;text-underline-offset:4px}button{border:0;border-radius:6px;background:#ff4f9b;color:#17191c;font:600 17px system-ui;padding:14px 22px;cursor:pointer}button:focus-visible,a:focus-visible{outline:2px solid #ff4f9b;outline-offset:5px}.brand{font-weight:750;color:#f2f3f5;font-size:24px}.foot{font-size:14px}</style></head><body><main><a class="brand" href="https://ive.dev/">IVE</a><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>${form}<p class="foot"><a href="https://ive.dev/">Back to IVE</a> · <a href="https://ive.dev/privacy.html">Privacy</a></p></main></body></html>`;
}
function reply(request, env, status, message, ok = false, title = null) {
  const h = headers(request, env);
  if (status === 429) h['Retry-After'] = '60';
  if (request.headers.get('Accept')?.includes('application/json')) return Response.json({ ok, message }, { status, headers: h });
  return new Response(htmlPage(title || (ok ? 'Check your inbox.' : 'Please try again.'), message), {
    status, headers: { ...h, 'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" }
  });
}
async function readBody(request) {
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) throw new Error('large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  let size = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) { await reader.cancel(); throw new Error('large'); }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(body);
}
function clientKey(ip) {
  if (!ip.includes(':')) return ip;
  const [head, tail] = ip.toLowerCase().split('::');
  const front = head ? head.split(':') : [];
  const back = tail ? tail.split(':') : [];
  const groups = tail === undefined ? front : [...front, ...Array(Math.max(0, 8 - front.length - back.length)).fill('0'), ...back];
  return groups.slice(0, 4).map(group => group.padStart(4, '0')).join(':') + '::/64';
}
async function signup(request, env, data) {
  if (data.website) return reply(request, env, 200, SUCCESS, true);
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@\u0000-\u001f\u007f]+@[^\s@\u0000-\u001f\u007f]+\.[^\s@\u0000-\u001f\u007f]+$/.test(email)) return reply(request, env, 400, 'Enter a valid email address.');
  if (![true, 'yes'].includes(data.consent) || data.consent_version !== CONSENT_VERSION) return reply(request, env, 400, 'Please agree to join the IVE beta and product updates list. Reload the page if needed.');
  if (!['home', 'download'].includes(data.source)) return reply(request, env, 400, 'Please use the signup form on ive.dev.');
  // Only an explicit new signup can start (or restart an expired) pending request.
  // Legacy entries are not contacted by deployment, migration or the scheduler.
  await env.DB.prepare(`INSERT INTO subscribers (id,email,consent_scope,consent_version,source,pending_expires_at)
    VALUES (?,?,?,?,?,datetime('now','+7 days')) ON CONFLICT(email) DO UPDATE SET
      consent_scope=excluded.consent_scope, consent_version=excluded.consent_version,
      consent_at=datetime('now'), source=excluded.source, pending_expires_at=excluded.pending_expires_at
    WHERE subscribers.confirmed_at IS NULL AND (subscribers.pending_expires_at IS NULL OR subscribers.pending_expires_at<=datetime('now'))`)
    .bind(crypto.randomUUID(), email, CONSENT_SCOPE, CONSENT_VERSION, data.source).run();
  const subscriber = await env.DB.prepare('SELECT id,confirmed_at,pending_expires_at FROM subscribers WHERE email=?').bind(email).first();
  if (subscriber.confirmed_at) return reply(request, env, 200, SUCCESS, true);
  const token = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  const hash = await tokenHash(token);
  // One atomic reservation: concurrent submissions cannot send duplicate emails.
  // Every attempt, including failures, participates in the abuse limits.
  const reserved = await env.DB.prepare(`INSERT INTO confirmation_tokens (token_hash,subscriber_id,expires_at)
    SELECT ?,id,pending_expires_at FROM subscribers WHERE id=? AND confirmed_at IS NULL
      AND pending_expires_at>datetime('now')
      AND NOT EXISTS (SELECT 1 FROM confirmation_tokens WHERE subscriber_id=? AND created_at>datetime('now','-10 minutes'))
      AND (SELECT count(*) FROM confirmation_tokens WHERE subscriber_id=? AND created_at>datetime('now','-1 day'))<3
    RETURNING token_hash`).bind(hash,subscriber.id,subscriber.id,subscriber.id).first();
  if (!reserved) {
    const accepted = await env.DB.prepare(`SELECT 1 FROM confirmation_tokens WHERE subscriber_id=?
      AND send_status='accepted' AND expires_at>datetime('now') LIMIT 1`).bind(subscriber.id).first();
    return accepted ? reply(request,env,200,SUCCESS,true) : reply(request,env,503,SEND_FAILED);
  }
  const budget = await env.DB.prepare(`INSERT INTO send_budget (day,attempts) VALUES (date('now'),1)
    ON CONFLICT(day) DO UPDATE SET attempts=attempts+1 WHERE attempts<500 RETURNING attempts`).first();
  if (!budget) {
    await env.DB.prepare('DELETE FROM confirmation_tokens WHERE token_hash=?').bind(hash).run();
    return reply(request,env,503,'The confirmation service is busy. Please try again tomorrow.');
  }
  const accepted = await sendConfirmation(env,email,`${baseUrl(env)}/confirm?token=${token}`,CONSENT_SCOPE);
  await env.DB.prepare('UPDATE confirmation_tokens SET send_status=? WHERE token_hash=?').bind(accepted?'accepted':'failed',hash).run();
  if (!accepted) return reply(request,env,503,SEND_FAILED);
  return reply(request, env, 200, SUCCESS, true);
}

async function tokenHash(token) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)));
  return Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
}
async function confirm(request,env,token) {
  const invalid = () => reply(request,env,410,'This confirmation link is invalid or has expired. Please sign up again on ive.dev.',false,'Link unavailable.');
  if (typeof token!=='string' || !TOKEN.test(token)) return invalid();
  const hash = await tokenHash(token);
  const found = await env.DB.prepare(`SELECT s.id,s.confirmed_at FROM subscribers s
    JOIN confirmation_tokens t ON t.subscriber_id=s.id
    WHERE t.token_hash=? AND t.expires_at>datetime('now')
      AND s.consent_scope=? AND s.consent_version=? AND s.consent_at>datetime('now','-12 months')`)
    .bind(hash,CONSENT_SCOPE,CONSENT_VERSION).first();
  if (!found) return invalid();
  if (request.method==='GET') {
    // Mail scanners can follow links. Only the person's explicit POST confirms.
    const form = `<p>${escapeHtml(CONSENT_SCOPE)}</p><form action="/confirm" method="post"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit">Confirm my subscription</button></form><p class="foot">Didn’t request this? Close this page. You can withdraw your consent anytime at <a href="mailto:contact@aiforgov.eu">contact@aiforgov.eu</a>.</p>`;
    return new Response(htmlPage('Confirm your subscription.','One more step to receive IVE beta invitations, product news and releases.',form),{
      // Strip the token from referrers while preserving Origin on native form POSTs.
      headers:{...headers(request,env),'Referrer-Policy':'strict-origin','Content-Type':'text/html; charset=utf-8',
        'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}
    });
  }
  // One conditional UPDATE checks the token and expiry at the moment of mutation.
  const confirmed = await env.DB.prepare(`UPDATE subscribers SET
      confirmed_at=COALESCE(confirmed_at,datetime('now')),confirmation_method='email-link',pending_expires_at=NULL
    WHERE id=? AND consent_scope=? AND consent_version=? AND EXISTS
      (SELECT 1 FROM confirmation_tokens WHERE token_hash=? AND subscriber_id=subscribers.id AND expires_at>datetime('now'))
    RETURNING confirmed_at`).bind(found.id,CONSENT_SCOPE,CONSENT_VERSION,hash).first();
  if (!confirmed) return invalid();
  await env.DB.prepare('UPDATE confirmation_tokens SET used_at=COALESCE(used_at,?) WHERE token_hash=?').bind(confirmed.confirmed_at,hash).run();
  return reply(request,env,200,'Your email is confirmed. You can now receive IVE beta invitations, product news and releases. You can leave the list anytime by emailing contact@aiforgov.eu.',true,'You’re on the list.');
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/health' && request.method === 'GET') {
      let ready = configured(env);
      if (ready) { try {
        await env.DB.prepare('SELECT confirmed_at,confirmation_method,pending_expires_at FROM subscribers LIMIT 1').first();
        await env.DB.prepare('SELECT token_hash FROM confirmation_tokens LIMIT 1').first();
        await env.DB.prepare('SELECT day FROM send_budget LIMIT 1').first();
      } catch { ready = false; } }
      return Response.json({ ok: ready, ready }, { status: ready ? 200 : 503, headers: headers(request, env) });
    }
    if (!['/api/subscribe','/confirm'].includes(path)) return reply(request, env, 404, 'Page not found.');
    if (path==='/confirm' && request.method==='GET') {
      if (!env.DB?.prepare || !baseUrl(env)) return reply(request,env,503,NOT_READY);
      try { return await confirm(request,env,new URL(request.url).searchParams.get('token')); }
      catch { return reply(request,env,503,'Confirmation is temporarily unavailable. Please try this link again later.'); }
    }
    if (request.method === 'OPTIONS' && allowedOrigin(request.headers.get('Origin'), env)) return new Response(null, { status: 204,
      headers: { ...headers(request, env), 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } });
    if (request.method !== 'POST') return reply(request, env, 405, 'Use the signup form on ive.dev.');
    if (!allowedOrigin(request.headers.get('Origin'), env)) return reply(request, env, 403, 'Please use the signup form on ive.dev.');
    if (path==='/api/subscribe' ? !configured(env) : !env.DB?.prepare || !env.SIGNUP_LIMITER?.limit || !baseUrl(env)) return reply(request, env, 503, NOT_READY);
    try {
      const key = clientKey(request.headers.get('CF-Connecting-IP') || 'unknown');
      if (!(await env.SIGNUP_LIMITER.limit({ key: path==='/confirm'?'confirm:'+key:key })).success) return reply(request, env, 429, 'Please wait a minute before trying again.');
      const type = request.headers.get('Content-Type')?.split(';')[0].trim();
      if (!['application/json', 'application/x-www-form-urlencoded'].includes(type)) return reply(request, env, 415, 'Please use the signup form to continue.');
      let data;
      try {
        const raw = await readBody(request);
        data = type === 'application/json' ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
      } catch (error) { return reply(request, env, error.message === 'large' ? 413 : 400, 'Please check your entry and try again.'); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(request, env, 400, 'Please check your entry and try again.');
      return path==='/confirm' ? await confirm(request,env,data.token) : await signup(request, env, data);
    } catch { return reply(request, env, 503, 'We could not process your request. Please try again later.'); }
  },
  async scheduled(_event, env) {
    // Cleanup only: no unsolicited reminders or automatic mail to legacy entries.
    await env.DB.prepare("DELETE FROM confirmation_tokens WHERE expires_at<=datetime('now')").run();
    await env.DB.prepare("DELETE FROM subscribers WHERE consent_at<=datetime('now','-12 months') OR (confirmed_at IS NULL AND pending_expires_at<=datetime('now'))").run();
    await env.DB.prepare("DELETE FROM send_budget WHERE day<date('now','-7 days')").run();
  }
};
