# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added
- Captura de pantalla y README más detallado (características, estructura
  del proyecto y notas de seguridad actualizadas).

## [1.0.0] - 2026-09-23

### Added
- Login por contraseña con sesión firmada mediante cookie HMAC
  (`HttpOnly` + `Secure` + `SameSite=Strict`).
- Traducción de texto vía la API de DeepSeek (`deepseek-v4-flash`),
  protegida por sesión válida.
- Rate limiting en memoria en `/api/auth`: bloquea una IP 15 minutos
  tras 5 intentos fallidos en una ventana de 5 minutos.
- `.gitignore` y `.env.example` para permitir que el repositorio sea
  público sin exponer secretos.
- Licencia MIT.

### Security
- Comparación de la contraseña de login con `crypto.timingSafeEqual`
  para evitar timing attacks.
