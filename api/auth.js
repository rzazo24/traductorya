const { createSessionCookie, safeEqual } = require('./_auth-utils');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { password } = req.body || {};
  const expected = process.env.AUTH_PASSWORD;

  if (!expected) {
    res.status(500).json({ error: 'AUTH_PASSWORD no está configurada en el servidor' });
    return;
  }

  if (typeof password !== 'string' || !safeEqual(password, expected)) {
    res.status(401).json({ error: 'Contraseña incorrecta' });
    return;
  }

  res.setHeader('Set-Cookie', createSessionCookie());
  res.status(200).json({ ok: true });
};
