const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => escapes[char]);

export const CONSENT_VERSION = '2026-11-01-beta-news-v1';
export const CONSENT_SCOPE = 'I’d like emails from AIFOREU GmbH about IVE beta testing, product news and releases.';
export const EXPORT_QUERY = `SELECT email, consent_scope, consent_version, consent_at, source, verification
  FROM subscribers WHERE consent_version = '${CONSENT_VERSION}' AND consent_scope = '${CONSENT_SCOPE}'
  AND consent_at > datetime('now', '-12 months') ORDER BY consent_at`;
const MAX_BODY = 4096;
const SUCCESS = 'You’re on the list. Your email has been saved.';
const NOT_READY = 'The signup list is not available yet. Please try again later.';

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
  return env.SIGNUPS_ENABLED === 'true' && Boolean(env.DB?.prepare && env.SIGNUP_LIMITER?.limit && baseUrl(env));
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
  return new Response(htmlPage(title || (ok ? 'You’re on the list.' : 'Please try again.'), message), {
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
  // Single opt-in, intentionally save-only. A submitted address is not verified.
  // Duplicate requests do not overwrite the original consent, time or source.
  await env.DB.prepare(`INSERT INTO subscribers (id,email,consent_scope,consent_version,source)
    VALUES (?,?,?,?,?) ON CONFLICT(email) DO NOTHING`)
    .bind(crypto.randomUUID(), email, CONSENT_SCOPE, CONSENT_VERSION, data.source).run();
  return reply(request, env, 200, SUCCESS, true);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/health' && request.method === 'GET') {
      let ready = configured(env);
      if (ready) { try { await env.DB.prepare('SELECT id FROM subscribers LIMIT 1').first(); } catch { ready = false; } }
      return Response.json({ ok: ready, ready }, { status: ready ? 200 : 503, headers: headers(request, env) });
    }
    if (path !== '/api/subscribe') return reply(request, env, 404, 'Page not found.');
    if (request.method === 'OPTIONS' && allowedOrigin(request.headers.get('Origin'), env)) return new Response(null, { status: 204,
      headers: { ...headers(request, env), 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } });
    if (request.method !== 'POST') return reply(request, env, 405, 'Use the signup form on ive.dev.');
    if (!allowedOrigin(request.headers.get('Origin'), env)) return reply(request, env, 403, 'Please use the signup form on ive.dev.');
    if (!configured(env)) return reply(request, env, 503, NOT_READY);
    try {
      const key = clientKey(request.headers.get('CF-Connecting-IP') || 'unknown');
      if (!(await env.SIGNUP_LIMITER.limit({ key })).success) return reply(request, env, 429, 'Please wait a minute before trying again.');
      const type = request.headers.get('Content-Type')?.split(';')[0].trim();
      if (!['application/json', 'application/x-www-form-urlencoded'].includes(type)) return reply(request, env, 415, 'Please use the signup form to continue.');
      let data;
      try {
        const raw = await readBody(request);
        data = type === 'application/json' ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
      } catch (error) { return reply(request, env, error.message === 'large' ? 413 : 400, 'Please check your entry and try again.'); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(request, env, 400, 'Please check your entry and try again.');
      return await signup(request, env, data);
    } catch { return reply(request, env, 503, 'We could not save your email. Please try again later.'); }
  },
  async scheduled(_event, env) {
    // Cleanup only. No email dispatch, reminders, legacy imports or remote calls.
    await env.DB.prepare("DELETE FROM subscribers WHERE consent_at<=datetime('now','-12 months')").run();
  }
};
