# Traductor

Traductor personal (estilo DeepL) construido con HTML/CSS/JS vanilla y funciones
serverless de Vercel. Usa la API de DeepSeek para traducir. Protegido con login
por contraseña.

## Estructura

```
index.html          Interfaz de login + traducción
api/auth.js          Valida la contraseña y emite la cookie de sesión
api/check.js          Comprueba la sesión actual / cierra sesión
api/translate.js      Traduce el texto (requiere sesión válida)
api/_auth-utils.js    Helpers de firma/verificación de la cookie
```

## Despliegue en Vercel

1. Sube este repo a GitHub (puede ser público: no hay secretos en el código).
2. Impórtalo en [vercel.com](https://vercel.com/new).
3. En **Project Settings → Environment Variables**, añade:

   | Variable | Descripción |
   |---|---|
   | `AUTH_PASSWORD` | La contraseña que pedirá el login |
   | `SESSION_SECRET` | String aleatorio largo para firmar las cookies (`openssl rand -hex 32`) |
   | `DEEPSEEK_API_KEY` | Tu API key de [platform.deepseek.com](https://platform.deepseek.com) |

4. Despliega. No compartas la URL de `*.vercel.app` que te asigna Vercel —
   es lo único que mantiene esto "privado" además del login.

## Desarrollo local

```bash
npm i -g vercel
cp .env.example .env   # rellena los valores
vercel dev
```

## Notas de seguridad

- La contraseña y las API keys viven solo en variables de entorno, nunca en
  el código — por eso el repo puede ser público con seguridad.
- La sesión se guarda en una cookie `HttpOnly` + `Secure`, firmada con HMAC,
  no accesible desde JavaScript del navegador.
- El endpoint `/api/translate` rechaza cualquier petición sin sesión válida,
  así que aunque alguien descubra la URL no puede gastar tu cuota de API sin
  la contraseña.
