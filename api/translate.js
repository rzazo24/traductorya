const { isAuthenticated } = require('./_auth-utils');

// Comprueba en https://api-docs.deepseek.com/quick_start/pricing qué modelo
// está vigente si este da error de "modelo no encontrado" — DeepSeek renombra
// sus modelos de vez en cuando (ahora mismo: deepseek-v4-flash / deepseek-v4-pro).
const MODEL = 'deepseek-v4-flash';
const MAX_CHARS = 8000;

// Debe coincidir con las <option> de index.html (salvo "auto", solo válido como origen).
const ALLOWED_LANGS = new Set([
  'español', 'inglés', 'francés', 'alemán', 'italiano', 'portugués',
  'neerlandés', 'ruso', 'chino', 'japonés', 'coreano', 'árabe',
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
      ? `desde ${sourceLang} `
      : '';

  // Instrucciones fijas en "system" y el texto a traducir, tal cual, en
  // "user" — separado en vez de concatenado en un único mensaje. Además de
  // más limpio, para un mismo par de idiomas el mensaje "system" es
  // idéntico entre peticiones, lo que deja a DeepSeek cachear ese prefijo
  // repetido y abaratar el coste por petición.
  const systemPrompt = `Traduces texto ${originInstruction}a ${targetLang}. Devuelve ÚNICAMENTE la traducción, sin explicaciones, sin comillas, sin comentarios adicionales. Mantén el tono, el registro y el formato (saltos de línea, listas, etc.) del original.`;

  let response;
  try {
    response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0.3,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
      }),
    });
  } catch {
    res.status(500).json({ error: 'Fallo al contactar con la API de traducción' });
    return;
  }

  if (!response.ok) {
    const errBody = await response.text();
    res.status(502).json({ error: 'Error de la API de traducción', detail: errBody });
    return;
  }

  // A partir de aquí ya no se pueden cambiar los headers/status: se hace
  // streaming del texto traducido tal como llega de DeepSeek, en texto
  // plano (no se reenvía el SSE crudo para que el cliente no tenga que
  // parsear JSON por trozo).
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) res.write(delta);
        } catch {
          // línea SSE incompleta o no-JSON: se ignora
        }
      }
    }
  } catch {
    // conexión cortada a mitad de stream: no se puede cambiar el status ya
    // enviado, simplemente se cierra la respuesta con lo que se haya escrito.
  } finally {
    res.end();
  }
};
