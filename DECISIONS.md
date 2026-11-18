# DECISIONS.md: ambigüedades del brief y cómo se resolvieron

Cada entrada recoge la ambigüedad, la decisión que se tomó y el criterio que la justifica. Si una decisión afecta al sistema visual, también está reflejada en `Design.md`.

---

## A. Referencias y sistema visual

**D‑01 · Las dos referencias apuntan a la misma URL.**
El brief separa una Web A (estructura) y una Web B (estética), pero ambas son `padelon.framer.website`.
→ Se usa el mismo sitio con dos lecturas independientes: (1) el **orden y la jerarquía de secciones** como wireframe, y (2) el **CSS de producción** (descargado y analizado) como fuente de tokens: colores, radios, tracking, line-height y breakpoints. Así se cumple la separación de responsabilidades sin inventar una segunda referencia.
*Criterio:* respetar la letra del brief (una fuente para cómo funciona y otra para cómo se ve) sin introducir un gusto propio no respaldado.

**D‑02 · Tipografía de la referencia con licencia comercial.**
Padelon usa *Neue Montreal* (Pangram Pangram), que no se puede redistribuir.
→ Se carga **Inter Tight 400/500** (Google Fonts) como sustituto métrico cercano, y la cadena `--font-sans` prioriza "PP Neue Montreal" por si el club compra la licencia. Pesos, tracking (`-0.02em` a `-0.038em`) y line-height (1.1) se copian tal cual de la referencia.

**D‑03 · Colores de la referencia que no forman parte de su marca.**
El CSS contiene `rgb(0,153,255)` 270 veces.
→ Se descarta: es el color de enlace por defecto de Framer, no un color de marca. La paleta final es **lima `#c9f13e` + navy `#042644`** (con sus variantes), negro y grises, que son los valores que sí aparecen como tokens de diseño.

**D‑04 · Componentes del SRS sin equivalente en la referencia.**
Padelon no tiene formularios, modales, cuadrante de disponibilidad, checkout, drawers ni toasts.
→ Se aplicó la regla de resolución de conflictos: la estructura sale del SRS y de las convenciones de producto, y el estilo usa exclusivamente los tokens de la referencia (radio 16/20/40, pill, hairline `#dfdfdf`, sombra en capas, inputs sobre `#f4f6f8`). Todos quedan documentados en `Design.md §7`.

**D‑05 · Formularios multi‑paso o en línea.**
La referencia no tiene formularios.
→ **Multi‑paso** en los dos embudos con más datos: reserva (Pista → Pago → Confirmación, exigido por RNF‑02) y presupuesto B2B (Evento → Detalles → Contacto). **En línea** para los formularios cortos (widget del hero y dossier).
*Criterio:* revelar los campos poco a poco baja el abandono cuando hay más de 6 campos, y un solo paso es mejor cuando hay 1–3.

**D‑06 · Modal o drawer.**
→ Se usa un **modal centrado** para tareas de foco con estado (la reserva) y un **drawer lateral** para tareas secundarias que no deben sacarte de la página (el dossier). En móvil, ambos se convierten en **bottom sheet**, como pide el brief.

**D‑07 · Colores de estado (error, éxito, aviso).**
La referencia no define estados.
→ Se añadieron `--success #1f8a4c`, `--warning #b26a00` y `--danger #c4321f`, con variantes *soft*, todos con contraste AA sobre blanco. No se usa el lima como "éxito" porque no tiene contraste como color de texto (1.3:1).

---

## B. Producto y contenido

**D‑08 · Nombre del club ("[Nombre del Club]").**
→ **Volea Club**, en Alicante. Es corto, propio del deporte (la volea existe en pádel y tenis) y no coincide con ninguna marca real conocida. Se cambia buscando "Volea" en `index.html` y en `js/services/availability.js` (`CLUB`).

**D‑09 · Deportes ("Pádel, Tenis, etc.").**
→ El widget y el cuadrante muestran **pádel (90 min) y tenis (60 min)**, que son los deportes que se reservan por pista. El gimnasio aparece como servicio y va incluido en los planes, pero no se reserva por franja horaria.

**D‑10 · Inventario, precios y horarios.**
No se facilitaron.
→ Se definieron 8 pistas de pádel (2 panorámicas, 2 indoor) y 4 de tierra batida. El horario es de 07:00 a 23:00. El pádel cuesta 24/32 € y el tenis 14/18 €, con la hora punta a partir de las 17:00 entre semana y antes de las 14:00 en fin de semana. Todo vive en `availability.js → SPORTS` para que se edite en un solo sitio.

**D‑11 · Cifras de prueba social.**
El brief pide contador de reservas, reseñas de Google y logos, pero no da datos.
→ Se usan cifras **plausibles marcadas como contenido de demo** (48.210 reservas, 4,8 en Google con 612 reseñas, 96% de recomendación…). **Hay que sustituirlas por datos reales antes de publicar**: inventar métricas en producción sería publicidad engañosa. Los logos B2B son "Logo Ipsum", como pide el brief. Los torneos son nombres ficticios.

**D‑12 · Personas.**
→ Coaches y autores de reseñas son personajes ficticios con fotos generadas, sin parecido intencionado con personas reales. Las reseñas se atribuyen a "Google" solo como formato de demostración y deben sustituirse por reseñas reales (por ejemplo, con la Google Places API).

---

## C. Requisitos funcionales

**D‑13 · "Reserva en < 3 clics" (RF/B2C) frente a "Máximo 3 pasos hasta el pago" (RNF‑02).**
→ El recorrido es: clic 1 en **Ver disponibilidad**, clic 2 en un **hueco libre** (la selección **avanza sola** al paso de pago tras 260 ms, sin botón "Continuar" obligatorio) y clic 3 en **Pagar**. Teclear los datos no cuenta como clic. Desde el cuadrante en línea, el paso 1 ya está hecho: un clic en un hueco abre el pago directamente. Si el visitante ya reservó antes, sus datos se recuerdan (`localStorage`, con try/catch).

**D‑14 · "Disponibilidad en tiempo real" sin backend.**
→ `availability.js` genera ocupación **determinista** (un hash por fecha, pista y hora, más ocupación en hora punta y en fechas cercanas) y una **capa en vivo simulada** que reserva o libera un hueco cada 18–40 s y emite eventos. El contador del hero, el cuadrante y el CTA final se suscriben a esos eventos. Para integrarlo, hay que sustituir `isBusy()` y `subscribe()` por la API o el WebSocket del software de reservas (Playtomic Manager, Matchpoint, etc.).

**D‑15 · "Geolocalización y Estado" (RF‑01.3).**
→ El **estado** (pistas libres hoy) se muestra siempre. La **geolocalización** se pide solo cuando el usuario toca "¿A qué distancia estoy?", nunca al cargar: un permiso pedido sin contexto se rechaza y penaliza la confianza. El resultado son km y minutos aproximados en coche, con un enlace a Google Maps. Si el usuario lo rechaza, solo se muestra el enlace a Maps.

**D‑16 · Pagos (Stripe, Apple Pay, Google Pay, Bizum).**
→ En el frontend hay un selector de método con su interfaz propia (campos de tarjeta, aviso del wallet y móvil para Bizum). `api.js → pay()` se ejecuta en **modo DEMO** (latencia simulada) mientras no se configure `paymentIntentEndpoint`. La integración real requiere un servidor que cree el PaymentIntent de Stripe (tarjeta y wallets mediante Payment Request) y el pedido de Bizum (Redsys). Ninguna clave secreta debe ir en el cliente.

**D‑17 · Confirmación inmediata (QR, iCal/Google, WhatsApp/Email).**
→ El **QR** se genera en el cliente (con qrcode-generator, cargado bajo demanda). El **.ics** incluye un recordatorio 2 h antes y **Google Calendar** se abre como enlace de plantilla. El **WhatsApp** del cliente sirve para compartir con los compañeros (`wa.me/?text=`). El envío real del email y del WhatsApp transaccional se delega al servidor en `createReservation()`, que debe usar un proveedor de email y la WhatsApp Business API.

**D‑18 · CTA B2B: "¿Eventos de empresa o grupos? Haz clic aquí".**
→ Aparece con el texto literal al pie del widget del hero. Además está en la cabecera ("Empresas y grupos" en desktop, "Empresas" en móvil) y en un **switch B2C/B2B** dentro del widget. En modo B2B, el widget recoge el tipo de evento, los asistentes y el mes, y **rellena el formulario de presupuesto** saltando al paso 2.

**D‑19 · Formulario B2B "inteligente".**
→ Es inteligente en cuatro aspectos: (1) el tipo "Patrocinio" oculta asistentes y pistas y muestra el formato de patrocinio; (2) las pistas necesarias se **sugieren según los asistentes** hasta que el usuario las edita; (3) el email debe ser **corporativo** (se rechazan Gmail, Hotmail y similares); (4) la fecha mínima es mañana. Al enviar se genera una referencia y el lead va a `submitLead('b2b_quote')` con los UTM y el referrer adjuntos.

**D‑20 · Lead magnet del dossier (RF‑03.3).**
→ Para descargarlo se pide email corporativo y consentimiento (RGPD). El dossier es un **PDF real de 4 páginas** (`assets/dossier-volea-b2b.pdf`) generado con las fotos del proyecto. Las tarifas que aparecen en él son orientativas, igual que las de la web.

**D‑21 · CRM.**
→ Hay un único adaptador, `submitLead(type, data)`, con los tipos `b2b_quote`, `dossier_download`, `membership` y `enroll`. Se configura con `window.VOLEA_CONFIG = { crmEndpoint: '…' }` antes de `main.js`, apuntando por ejemplo a un webhook de HubSpot, Pipedrive o Make. Sin endpoint, el payload se muestra en la consola.

**D‑22 · Alta de socios, escuela y torneos (objetivo B2C).**
→ Se **reutiliza el mismo checkout**, entrando directamente en el paso 2 con el producto ya elegido. Así no se crea un tercer patrón de formulario. La clase de prueba es gratis: oculta el pago y el botón pasa a ser "Confirmar plaza".

---

## D. Estructura, layout y app shell

**D‑23 · Mapeo de la estructura de Padelon con el SRS.**

| Padelon (wireframe) | Volea (SRS) |
|---|---|
| Nav + Hero (2 CTAs) | Topbar + Hero con widget de reserva y switch B2C/B2B (RF‑01) |
| Mission statement | Eliminado a petición del cliente (no tiene equivalente en la página) |
| Our people + About us | El club (collage + datos clave) |
| Our impact in numbers | Impacto: contador de reservas (RF‑04.1) |
| Services (carrusel 01/05) | Servicios: Pádel, Tenis, Escuela, Gym, Torneos |
| How to join (01–04) | Cómo reservar + **cuadrante en vivo** (RF‑02.1) |
| Why us + testimonials | Por qué Volea + reseñas de Google + torneos (RF‑04.1) |
| Coaches | Escuela |
| Membership (3 tiers) | Membresías |
| — | **Bloque B2B**: propuesta, prueba social y formulario (RF‑03, RF‑04.2) |
| FAQ | Ayuda (B2C + B2B) |
| Closing CTA | CTA final con el contador en vivo |

El bloque B2B se inserta después de las membresías, porque es donde termina el embudo B2C y empieza el de empresa, siguiendo el árbol del SRS §3.

**D‑24 · App shell móvil (scroll interno, tab bar, sheets).**
→ Por debajo de 810 px, `html` y `body` no hacen scroll: lo hace `#app-scroll`, que tiene un header de 56 px y una tab bar de 64 px más la *safe area*. GSAP usa ese contenedor como `scroller` mediante `gsap.matchMedia`. Las tabs son Inicio, Pistas, **Reservar** (central, abre el sheet), Planes y Empresas. La tab activa se sincroniza con el scroll. Ayuda se queda fuera de la tab bar para que Reservar ocupe el centro, que es la acción con más valor.

**D‑25 · Breakpoints.**
→ Se usan los mismos que la referencia: **810 px** y **1200 px**, con enfoque mobile‑first.

---

## E. Secciones de respiro

**D‑26 · Elección y ubicación.**
→ **A · Atmosférica**, a sangre (la pelota sobre la línea al anochecer), justo **después del cuadrante**, que es la sección más densa y operativa de la página. Aquí el ojo necesita descanso.
→ **D · Cinética**, un marquee tipográfico ("Ligas de empresa · Teambuilding · Patrocinios · Eventos con catering"), **entre las membresías y el bloque B2B**. Funciona como bisagra narrativa: avisa del cambio de audiencia antes de pasar al fondo navy.
Están separadas por 3 secciones y tienen arquetipos distintos. No se usó la categoría B (manifiesto): el único bloque de ese tipo, el mission statement, se eliminó a petición del cliente.

---

## F. Imágenes

**D‑27 · Dirección de arte.**
→ El género elegido es **documental‑editorial deportivo**: club mediterráneo, luz de tarde, look de película de 35 mm (grano fino, sombras navy), jugadores amateur reales de 25 a 55 años y ropa neutra sin logos. La paleta de las fotos (pistas azules, pelotas lima) es la misma que la de la interfaz. Se evitaron las poses de stock y el "fitness aspiracional".

**D‑28 · Modelos.**
→ Todas las fotografías se generaron con **Nano Banana 2 Lite** (`google/gemini-3.1-flash-lite-image`). El mockup del dossier necesitaba transparencia, así que se generó con **GPT Image** y su halo semitransparente se limpió con un umbral de alfa. Una imagen (el detalle del grip) se **regeneró** porque las pelotas traían texto de marca.

**D‑29 · Formatos.**
→ Los originales están en `assets/raw/` y las versiones optimizadas en WebP en `assets/img/` (`-480` y original). En móvil, el hero usa un **recorte vertical** propio centrado en los jugadores (`hero-m.webp`, 22 KB).

---

## G. Motion

**D‑30 · "Motion for React / Motion One" en un proyecto sin React.**
El scaffold existente era HTML/CSS/JS sin build.
→ Se mantiene **vanilla y sin bundler**: Motion se carga por CDN (`motion@11.11.13`, global `Motion.animate`) y GSAP 3.12.5 con ScrollTrigger por cdnjs. "Client components only where needed" se traduce aquí en que **cada módulo JS solo se ocupa de su componente** y el HTML funciona sin JS (el contenido es visible y los formularios son semánticos).

**D‑31 · Reparto Motion/GSAP sin conflictos.**
→ **Motion** se encarga de los paneles de overlay, los pasos de los formularios, la píldora de los segmented, el acordeón, los toasts, el *press* en controles, la entrada del widget y el *bump* de los contadores en vivo. **GSAP** se encarga de la secuencia del hero, los reveals (`[data-reveal-item]`), los contadores al entrar, el parallax, los marquees acoplados a la velocidad de scroll, la línea de progreso de los pasos y el estado de la topbar y la navegación. Ningún elemento comparte una propiedad animada entre ambas librerías: los reveals de GSAP animan contenedores y el *press* de Motion anima botones.

**D‑32 · Movimiento reducido.**
→ Con `prefers-reduced-motion` no hay secuencias, parallax ni marquees, los contadores muestran directamente el valor final y Motion usa una duración de aproximadamente 0.

---

## H. Rendimiento (RNF‑01)

**D‑33 · Cómo se verificó.**
→ Se midió en Chrome headless con un servidor local, en un viewport de 390×844 a DPR 2, con **Slow 4G (1,6 Mbps, 150 ms RTT) y CPU 4×** y sin caché. El **LCP** (la imagen del hero) fue de **1,60–1,72 s** y el **CLS de 0**, con 387 KB transferidos. En desktop sin throttling, el LCP fue de 0,7 s. **No se ejecutó Lighthouse ni PageSpeed**: el objetivo de "> 90" debe confirmarse sobre el hosting final (con HTTP/2, compresión y CDN).
Para llegar ahí se aplicaron cuatro medidas: fuente no bloqueante, precarga de la imagen LCP por media query, recorte móvil propio a 22 KB y `defer` en todos los scripts.

---

## I. Pendientes conocidos (fuera de alcance del frontend)
- Sustituir la capa DEMO (`api.js`, `availability.js`) por la integración real de reservas, pagos y CRM.
- Sustituir las métricas, reseñas y precios de demo por datos reales.
- Páginas legales (privacidad, cookies, condiciones de reserva) y banner de consentimiento si se añaden analíticas.
- `style.css` y `script.js` (vacíos, del scaffold original) no se usan y se pueden borrar.
