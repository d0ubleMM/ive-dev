// Transactional confirmation only. No welcome mail, tracking, or submitted text.
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export function confirmationEmail(link, scope) {
  const subject = 'Confirm your email for IVE updates';
  const text = `Please confirm your email address.\n\nSomeone requested IVE beta invitations, product news and releases for this address. To confirm this request, open the link and choose “Confirm my subscription”:\n\n${link}\n\nYour consent:\n${scope}\n\nThe confirmation period ends 7 days after your signup. If you did not request this, ignore this email. You will not be added to the mailing list without confirmation. Unconfirmed requests are deleted after 7 days.\n\nYou can withdraw your consent at any time by emailing contact@aiforgov.eu.\n\nAIFOREU GmbH\nAlbert-Einstein-Str. 30, 49076 Osnabrück, Germany\nManaging director: Michael Ramich\nAmtsgericht Osnabrück, HRB 220842\nPrivacy: https://ive.dev/privacy.html#privacy-updates\nImprint: https://ive.dev/imprint.html`;
  return { subject, text, html: `<html lang="en"><body><p>Please confirm your email address.</p><p>Someone requested IVE beta invitations, product news and releases for this address.</p><p><a href="${escape(link)}">Review and confirm my subscription</a></p><p>Your consent: ${escape(scope)}</p><p>The confirmation period ends 7 days after your signup. If you did not request this, ignore this email. You will not be added to the mailing list without confirmation. Unconfirmed requests are deleted after 7 days.</p><p>You can withdraw your consent at any time by emailing contact@aiforgov.eu.</p><p>AIFOREU GmbH<br>Albert-Einstein-Str. 30, 49076 Osnabrück, Germany<br>Managing director: Michael Ramich<br>Amtsgericht Osnabrück, HRB 220842</p><p><a href="https://ive.dev/privacy.html#privacy-updates">Privacy</a> · <a href="https://ive.dev/imprint.html">Imprint</a></p></body></html>` };
}

export function mailConfigured(env) {
  return /^[a-f0-9]{32}$/.test(env.EMAIL_ACCOUNT_ID || '') && Boolean(env.EMAIL_API_TOKEN);
}

export async function sendConfirmation(env, to, link, scope) {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.EMAIL_ACCOUNT_ID}/email/sending/send`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${env.EMAIL_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: { address: 'beta@ive.dev', name: 'IVE' }, to,
        reply_to: 'contact@aiforgov.eu', ...confirmationEmail(link, scope),
        headers: { 'Auto-Submitted': 'auto-generated' } })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.success !== true) return false;
    // A 200 alone is not evidence of acceptance: bounces/suppression are not sends.
    return ['delivered', 'queued'].some(key => Array.isArray(body.result?.[key]) &&
      body.result[key].some(address => String(address).toLowerCase() === to));
  } catch { return false; } // Never log tokens, addresses or provider response bodies.
}
