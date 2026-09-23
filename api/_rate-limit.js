const WINDOW_MS = 5 * 60 * 1000; // ventana de conteo: 5 minutos
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // bloqueo tras superar el límite

// Estado en memoria del proceso: se pierde en cada cold start o al escalar
// a otra instancia. Es un best-effort, no una barrera perfecta.
const attempts = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function getLockoutSeconds(req) {
  const entry = attempts.get(getClientIp(req));
  if (!entry || !entry.lockedUntil) return 0;
  const remaining = entry.lockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

function registerFailedAttempt(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  let entry = attempts.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { count: 0, windowStart: now, lockedUntil: 0 };
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }

  attempts.set(ip, entry);
}

function registerSuccess(req) {
  attempts.delete(getClientIp(req));
}

module.exports = { getLockoutSeconds, registerFailedAttempt, registerSuccess };
