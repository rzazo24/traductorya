# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [1.3.0] - 2026-09-23

### Added
- Selector de modo de traducción: automático (traduce al escribir, como
  hasta ahora) o manual (solo al pulsar "traducir"). La preferencia se
  guarda en `localStorage`.

## [1.2.1] - 2026-09-23

### Removed
- Catalán, gallego y euskera de los idiomas disponibles (frontend y
  validación del backend).

### Changed
- Scrollbars estilizadas a juego con la paleta oscura, en vez de las
  del navegador por defecto.

## [1.2.0] - 2026-09-23

### Changed
- La traducción llega por streaming en vez de esperar la respuesta
  completa de DeepSeek: el texto va apareciendo progresivamente en el
  panel de destino según lo genera el modelo, en vez de quedarse en
  blanco hasta el final. No reduce el tiempo total, pero mejora mucho
  la sensación de velocidad con textos largos.

## [1.1.0] - 2026-09-23

### Added
- Captura de pantalla y README más detallado (características, estructura
  del proyecto y notas de seguridad actualizadas).
- Label accesible en el campo de contraseña (para lectores de pantalla) y
  `aria-label` en el botón de intercambiar idiomas.

### Fixed
- Condición de carrera al traducir: si dos peticiones quedaban en vuelo a
  la vez, una respuesta desordenada podía pisar la traducción más reciente
  con una obsoleta. Ahora se aborta la petición anterior al lanzar una
  nueva.

### Security
- `sourceLang`/`targetLang` ahora se validan contra la lista de idiomas
  permitidos en el backend; antes cualquier string llegaba directo al
  prompt de DeepSeek.

### Changed
- `max_tokens` sube de 2048 a 4096 para evitar que se trunquen
  traducciones largas.

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
