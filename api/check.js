const { isAuthenticated, clearSessionCookie } = require('./_auth-utils');

module.exports = (req, res) => {
  if (req.method === 'POST') {
    // Logout
    res.setHeader('Set-Cookie', clearSessionCookie());
    res.status(200).json({ ok: true });
    return;
  }

  res.status(200).json({ authenticated: isAuthenticated(req) });
};
