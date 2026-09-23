const { isAuthenticated } = require('./_auth-utils');

// Comprueba en https://api-docs.deepseek.com/quick_start/pricing qué modelo
// está vigente si este da error de "modelo no encontrado" — DeepSeek renombra
// sus modelos de vez en cuando (ahora mismo: deepseek-v4-flash / deepseek-v4-pro).
const MODEL = 'deepseek-v4-flash';
const MAX_CHARS = 8000;

// Debe coincidir con las <option> de index.html (salvo "auto", solo válido como origen).
const ALLOWED_LANGS = new Set([
  'español', 'inglés', 'francés', 'alemán', 'italiano', 'portugués',
  'catalán', 'gallego', 'euskera', 'neerlandés', 'ruso', 'chino',
  'japonés', 'coreano', 'árabe',
]);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const { text, targetLang, sourceLang } = req.body || {};

  if (typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Falta el texto a traducir' });
    return;
  }
  if (text.length > MAX_CHARS) {
    res.status(400).json({ error: `El texto supera el límite de ${MAX_CHARS} caracteres` });
    return;
  }
  if (typeof targetLang !== 'string' || !ALLOWED_LANGS.has(targetLang)) {
    res.status(400).json({ error: 'Idioma de destino no válido' });
    return;
  }
  if (sourceLang && sourceLang !== 'auto' && !ALLOWED_LANGS.has(sourceLang)) {
    res.status(400).json({ error: 'Idioma de origen no válido' });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'DEEPSEEK_API_KEY no está configurada en el servidor' });
    return;
  }

  const originInstruction =
    sourceLang && sourceLang !== 'auto'
      ? `de ${sourceLang} `
      : '';

  const prompt = `Traduce el siguiente texto ${originInstruction}a ${targetLang}. Devuelve ÚNICAMENTE la traducción, sin explicaciones, sin comillas, sin comentarios adicionales. Mantén el tono, el registro y el formato (saltos de línea, listas, etc.) del original.

Texto:
${text}`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      res.status(502).json({ error: 'Error de la API de traducción', detail: errBody });
      return;
    }

    const data = await response.json();
    const translation = (data.choices?.[0]?.message?.content || '').trim();

    res.status(200).json({ translation });
  } catch (err) {
    res.status(500).json({ error: 'Fallo al contactar con la API de traducción' });
  }
};
