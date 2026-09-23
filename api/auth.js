const { createSessionCookie, safeEqual } = require('./_auth-utils');
const { getLockoutSeconds, registerFailedAttempt, registerSuccess } = require('./_rate-limit');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const lockoutSeconds = getLockoutSeconds(req);
  if (lockoutSeconds > 0) {
    res.setHeader('Retry-After', String(lockoutSeconds));
    res.status(429).json({ error: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' });
    return;
  }

  const { password } = req.body || {};
  const expected = process.env.AUTH_PASSWORD;

  if (!expected) {
    res.status(500).json({ error: 'AUTH_PASSWORD no está configurada en el servidor' });
    return;
  }

  if (typeof password !== 'string' || !safeEqual(password, expected)) {
    registerFailedAttempt(req);
    res.status(401).json({ error: 'Contraseña incorrecta' });
    return;
  }

  registerSuccess(req);
  res.setHeader('Set-Cookie', createSessionCookie());
  res.status(200).json({ ok: true });
};
