const crypto = require('crypto');

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET no está configurada');
  const body = base64url(JSON.stringify(payload));
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${hmac}`;
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verify(token) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !token) return null;
  const [body, hmac] = token.split('.');
  if (!body || !hmac) return null;

  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (!safeEqual(hmac, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function createSessionCookie() {
  const token = sign({ exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS });
  const parts = [
    `session=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  return parts.join('; ');
}

function clearSessionCookie() {
  return 'session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verify(cookies.session) !== null;
}

module.exports = { createSessionCookie, clearSessionCookie, isAuthenticated, safeEqual };
