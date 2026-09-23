# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [1.5.0] - 2026-09-23

### Added
- El destino distingue "Inglés (EE. UU.)" e "Inglés (Reino Unido)",
  como en DeepL, en vez de un "Inglés" genérico. El origen mantiene
  un "Inglés" genérico.

### Fixed
- El botón de intercambiar idiomas asumía que origen y destino
  ofrecían siempre las mismas opciones; ahora convierte correctamente
  entre el "Inglés" genérico del origen y las variantes del destino.

## [1.4.4] - 2026-09-23

### Fixed
- El botón ⇄ no hacía nada cuando el origen era "Detectar idioma" (el
  valor por defecto al abrir la app), sin ningún indicio visual de
  que estaba deshabilitado. Ahora el origen pasa a ser el destino
  actual, y el destino cae a "español" (o "inglés" si ya lo era).

## [1.4.3] - 2026-09-23

### Fixed
- El botón de modo auto/manual descentraba visualmente la barra de
  idiomas en escritorio. Se mueve a la cabecera, junto a "cerrar
  sesión"; la barra de idiomas vuelve a ser select ⇄ select.

## [1.4.2] - 2026-09-23

### Changed
- El prompt a DeepSeek separa las instrucciones fijas (mensaje
  `system`) del texto a traducir (mensaje `user`), en vez de
  concatenarlos en uno solo. Para un mismo par de idiomas dentro de
  la misma sesión, esto deja el mensaje `system` idéntico entre
  peticiones, lo que permite a DeepSeek cachear ese prefijo y
  abaratar el coste por petición.

### Fixed
- La traducción ya no se muestra envuelta entre comillas si el
  modelo las añade pese a la instrucción de no hacerlo.

## [1.4.1] - 2026-09-23

### Changed
- `sw.js` pasa de archivo estático a función serverless (`api/sw.js`,
  servida en `/sw.js` vía rewrite) que genera `CACHE_VERSION` a partir
  del hash de commit de cada despliegue. Antes había que subirlo a
  mano, y si se olvidaba, ni siquiera cambios reales en el resto de
  la app disparaban el aviso de actualización (el navegador solo
  compara los bytes del propio `sw.js`).

## [1.4.0] - 2026-09-23

### Added
- La app es instalable como PWA (manifest, iconos, modo standalone) en
  iOS, Android y escritorio.
- Service worker que cachea el shell de la app y muestra un banner
  para recargar cuando detecta que hay una versión nueva publicada.
- Interfaz adaptada a iOS/Android: respeta las safe-areas (notch/home
  indicator), evita el zoom automático de iOS al enfocar campos, y
  quita el flash de "tap highlight" táctil.

### Fixed
- La barra de idiomas se desbordaba horizontalmente en pantallas de
  móvil, cortando el selector de destino y el botón de modo.

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
