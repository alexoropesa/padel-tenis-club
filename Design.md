# Design.md: Volea Club Design System

> Fuente única de verdad del sistema visual. **Consúltalo antes de crear cualquier página o sección.**
> Los tokens viven en `css/tokens.css`. Si cambias un valor aquí, cámbialo allí, y viceversa.
>
> - **Origen de los tokens:** CSS de producción de `padelon.framer.website`, extraído el 2026‑11‑18 (colores, radios, tipografía, tracking, breakpoints).
> - **Origen de la estructura:** el mismo sitio, usado solo como wireframe. Ver `DECISIONS.md`.

---

## 1. Design Principles

1. **Lima sobre navy, nada más.** Un solo color de acento (`--accent`) reservado para la acción principal, el estado *seleccionado* y los indicadores en vivo. Si todo es lima, nada es lima. Máximo **1 botón primario por viewport**.
2. **Superficies planas, hairlines finas.** La elevación se expresa con contraste de superficie (canvas → surface → navy) y bordes de 1px, no con sombras. La sombra solo aparece en overlays (modal, sheet, drawer, dropdown).
3. **Tipografía grande y apretada.** Titulares con `line-height: 1.1` y tracking negativo (`-0.02em` a `-0.038em`). Peso máximo 500: la jerarquía sale del tamaño, no de la negrita.
4. **Fotografía como prueba, no como decoración.** Cada imagen muestra el club real (pistas, gente, espacios). Sin stock genérico, sin texto incrustado.
5. **Radio generoso y consistente.** Píldora (40px) para controles interactivos y 16/20px para contenedores. Nunca mezclar radios en un mismo nivel.
6. **Conversión primero.** Un CTA de reserva siempre alcanzable: topbar en desktop, tab bar en móvil.

---

## 2. Color Tokens

### 2.1 Primitivos (extraídos de la referencia)

| Token primitivo | Valor | Origen |
|---|---|---|
| `--lime-500` | `#c9f13e` | acento principal |
| `--lime-400` | `#d8fa50` | hover del acento |
| `--lime-100` | `#ebffb6` | fondo suave del acento |
| `--navy-900` | `#01233e` | surface oscura profunda |
| `--navy-800` | `#042644` | surface oscura base |
| `--navy-700` | `#032f5f` | surface oscura elevada |
| `--navy-600` | `#034275` | borde/hover sobre navy |
| `--ink-1000` | `#000000` | texto principal |
| `--ink-900` | `#0a0a0a` | botón oscuro |
| `--ink-800` | `#1b1b1b` | hover del botón oscuro |
| `--grey-600` | `#5c656c` | texto secundario sobre claro (AA 5.9:1) |
| `--grey-500` | `#6c6c6c` | texto terciario (AA 5.3:1) |
| `--grey-200` | `#dfdfdf` | hairline |
| `--grey-100` | `#f1f1f1` | surface neutra |
| `--grey-50` | `#f4f6f8` | canvas alternativo |
| `--white` | `#ffffff` | canvas |

### 2.2 Semánticos (los que usa el código)

| Token | Valor | Uso |
|---|---|---|
| `--bg-canvas` | `--white` | fondo de página |
| `--bg-canvas-alt` | `--grey-50` | secciones alternas y fondo de inputs |
| `--bg-surface` | `--white` | cards sobre `canvas-alt` |
| `--bg-surface-muted` | `--grey-100` | chips, celdas deshabilitadas |
| `--bg-inverse` | `--navy-800` | secciones oscuras, footer, hero overlay |
| `--bg-inverse-deep` | `--navy-900` | bloques sobre navy |
| `--bg-inverse-raised` | `--navy-700` | cards sobre navy |
| `--border-hairline` | `--grey-200` | bordes 1px sobre claro |
| `--border-subtle` | `rgba(0,0,0,.06)` | divisores internos de card |
| `--border-inverse` | `rgba(255,255,255,.10)` | bordes sobre navy/foto |
| `--border-inverse-strong` | `rgba(255,255,255,.20)` | hover sobre navy, inputs en oscuro |
| `--text-primary` | `--ink-1000` | titulares y cuerpo |
| `--text-secondary` | `--grey-600` | párrafos de apoyo |
| `--text-tertiary` | `--grey-500` | metadatos, captions |
| `--text-inverse` | `--white` | texto sobre navy/foto |
| `--text-inverse-secondary` | `rgba(255,255,255,.60)` | apoyo sobre navy (solo ≥14px) |
| `--accent` | `--lime-500` | CTA primario, seleccionado, live dot |
| `--accent-hover` | `--lime-400` | hover del primario |
| `--accent-soft` | `--lime-100` | fondo de badge "Popular", selección suave |
| `--on-accent` | `--ink-1000` | texto sobre lima (contraste 15.6:1) |
| `--glass-1` | `rgba(255,255,255,.04)` | superficie translúcida sobre foto |
| `--glass-2` | `rgba(255,255,255,.10)` | chip/píldora sobre foto |
| `--scrim` | `rgba(0,0,0,.40)` | backdrop de modal/sheet |

### 2.3 Estados (nuevos, no existen en la referencia; ver DECISIONS §D‑07)

| Token | Valor | Uso |
|---|---|---|
| `--success` | `#1f8a4c` | confirmación, slot libre (texto) |
| `--success-soft` | `#e6f4ec` | fondo de alerta de éxito |
| `--warning` | `#b26a00` | "Últimas pistas" |
| `--warning-soft` | `#fff3df` | fondo de aviso |
| `--danger` | `#c4321f` | error de validación |
| `--danger-soft` | `#fdecea` | fondo de error |
| `--focus-ring` | `#034275` | anillo de foco sobre claro (`--navy-600`) |
| `--focus-ring-inverse` | `--lime-500` | anillo de foco sobre navy |

**Regla:** el lima **nunca** se usa como color de texto sobre blanco (contraste 1.3:1). Solo como fondo, o como texto sobre navy/negro.

---

## 3. Typography

**Familia:** `--font-sans: "PP Neue Montreal", "Inter Tight", "Inter", system-ui, sans-serif`.
La referencia usa *Neue Montreal* (licencia comercial). Se carga **Inter Tight** (Google Fonts, 400/500) como sustituto. Si el club adquiere la licencia, basta con añadir el `@font-face` y la cadena ya lo prioriza.

**Pesos:** solo `400` (regular) y `500` (medium). Prohibido 600+.

| Token | Desktop (≥1200) | Tablet (810–1199) | Mobile (<810) | LH | Tracking | Peso | Uso |
|---|---|---|---|---|---|---|---|
| `--fs-display` | 70px | 56px | 42px | 1.0 | -0.038em | 500 | H1 hero |
| `--fs-h2` | 48px | 40px | 32px | 1.1 | -0.027em | 500 | titulares de sección |
| `--fs-h3` | 32px | 28px | 24px | 1.1 | -0.02em | 500 | card destacada, precios |
| `--fs-h4` | 24px | 22px | 20px | 1.2 | -0.02em | 500 | títulos de card |
| `--fs-lead` | 20px | 18px | 17px | 1.4 | -0.01em | 400 | subtítulos |
| `--fs-body` | 16px | 16px | 16px | 1.4 | -0.01em | 400 | párrafos, inputs |
| `--fs-small` | 14px | 14px | 14px | 1.4 | 0 | 400/500 | labels, botones sm |
| `--fs-caption` | 12px | 12px | 12px | 1.2 | 0.02em | 500 | eyebrows (MAYÚSCULAS), badges |
| `--fs-stat` | 68px | 54px | 44px | 1.0 | -0.038em | 500 | cifras grandes |

Las escalas fluidas se implementan con `clamp()` entre los valores móvil y desktop.

**Eyebrow** (patrón de la referencia `• SERVICES`): `--fs-caption`, uppercase, `letter-spacing: .08em`, precedido de un punto lima de 6px.

**Números:** `font-variant-numeric: tabular-nums` en precios, horarios, contadores y tablas.

**Medida de línea:** párrafos con un máximo de `62ch`; titulares de sección con un máximo de `18ch`.

---

## 4. Spacing System

Base de 2px, con los pasos que usa la referencia (gaps de 6/8/10/12/16/20/24/30/32/40/52/64/80).

| Token | Valor | Uso típico |
|---|---|---|
| `--space-1` | 4px | icono–texto ajustado |
| `--space-2` | 6px | gap interno de badge |
| `--space-3` | 8px | gap de botón con icono |
| `--space-4` | 10px | gap de lista de chips |
| `--space-5` | 12px | gap de campos en línea |
| `--space-6` | 16px | padding de card sm, gap de grid sm |
| `--space-7` | 20px | gutter móvil, padding de input-x |
| `--space-8` | 24px | padding de card |
| `--space-9` | 30px | gutter desktop |
| `--space-10` | 32px | padding de card lg |
| `--space-11` | 40px | separación cabecera de sección → contenido |
| `--space-12` | 52px | — |
| `--space-13` | 64px | separación entre bloques dentro de sección |
| `--space-14` | 80px | padding vertical de sección (tablet) |
| `--space-15` | 120px | padding vertical de sección (desktop) |

**Ritmo de sección:** `padding-block: clamp(64px, 10vw, 120px)` (`--section-y`).
**Gutter horizontal:** `--gutter: 20px` en móvil y `30px` desde 810px.

---

## 5. Layout Rules

- **Contenedor:** `--container: 1140px` de contenido, con un máximo de 1200px incluido el gutter (`max-width: 1199px` en la referencia). Para el contenido de lectura se usa `--container-narrow: 760px`.
- **Grid:** 12 columnas, `gap: 20px` en móvil y tablet, `30px` en desktop. Las cards de servicio, coaches y pricing usan `repeat(auto-fit, minmax(…))`.
- **Breakpoints (de la referencia):**
  - `--bp-tablet: 810px`
  - `--bp-desktop: 1200px`
  - Mobile‑first: los estilos base son móvil y se amplían con `@media (min-width: 810px)` y `@media (min-width: 1200px)`.
- **Navegación:**
  - **Desktop/tablet (≥810):** topbar fija de 72px, translúcida sobre el hero (`--glass`) y sólida (`--bg-canvas` + hairline) tras 40px de scroll. Contiene: logo · links ancla · CTA B2B (ghost) · CTA "Reservar" (primary).
  - **Mobile (<810), app shell:** header compacto de 56px (logo + botón "Empresas") y **tab bar inferior** de 64px más `env(safe-area-inset-bottom)`, con 5 tabs: Inicio · Pistas · **Reservar** (central, burbuja `--accent` de 44×32 que abre el bottom sheet de reserva) · Planes · Empresas. `body` no hace scroll: el scroll ocurre dentro de `#app-scroll` (scroll interno). La tab activa se sincroniza con la sección visible (indicador superior de 24×3px en `--ink-1000`). Ayuda/FAQ se alcanza por scroll y desde el footer.
- **Z‑index:** `--z-nav: 50`, `--z-tabbar: 60`, `--z-overlay: 90`, `--z-modal: 100`, `--z-toast: 120`.

---

## 6. Visual Effects

### Radios (extraídos de la referencia)
| Token | Valor | Uso |
|---|---|---|
| `--radius-xs` | 8px | celdas del cuadrante, chips pequeños |
| `--radius-sm` | 12px | inputs internos de grupo, thumbnails |
| `--radius-md` | 16px | cards, inputs, dropdowns |
| `--radius-lg` | 20px | cards grandes, modal |
| `--radius-xl` | 40px | contenedores de sección destacados (hero widget, CTA final) |
| `--radius-pill` | 999px | botones, tabs, segmented control, badges |
| `--radius-round` | 50% | avatares, live dot |

### Sombras (solo overlays)
| Token | Valor |
|---|---|
| `--shadow-none` | `none`, por defecto para cards |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.04), 0 2px 6px -3px rgba(0,0,0,.10)` (dropdown, toast) |
| `--shadow-lg` | `0 0.6px 1.6px -1.5px rgba(0,0,0,.17), 0 2.3px 6px -3px rgba(0,0,0,.14), 0 10px 26px -4.5px rgba(0,0,0,.06)`, la sombra en capas de la referencia (modal, sheet, widget de reserva) |

### Outlines y bordes
- Card: `1px solid var(--border-hairline)`.
- Botón secundario: `box-shadow: inset 0 0 0 1px currentColor` (patrón de la referencia).
- Foco: `outline: 2px solid var(--focus-ring); outline-offset: 2px`. Nunca `outline: none` sin sustituto.

### Overlays sobre fotografía
- Degradado inferior para cards: `linear-gradient(180deg, rgba(4,38,68,0) 40%, rgba(4,38,68,.85) 100%)` (`--overlay-photo`).
- Hero (`--overlay-hero`): un degradado lateral `90deg` (de navy‑900 al 55% hasta 0 en el 62%) más uno vertical (55% → 15% → 80%), para garantizar el contraste del texto blanco sobre cielos claros.
- Grano: no se añade por CSS, ya viene en la fotografía.

---

## 7. Component Guidelines

### Botones (`.btn`)
| Variante | Fondo | Texto | Borde | Uso |
|---|---|---|---|---|
| `.btn--primary` | `--accent` | `--on-accent` | — | 1 por viewport: Reservar, Pagar, Enviar |
| `.btn--dark` | `--ink-900` | `--white` | — | acción fuerte sobre claro (Pedir presupuesto) |
| `.btn--secondary` | transparente | `--text-primary` | inset 1px | acción alternativa |
| `.btn--ghost-inverse` | `--glass-2` | `--white` | inset 1px `--border-inverse-strong` | sobre foto/navy |
| `.btn--link` | — | hereda | subrayado 1px | acciones terciarias |

- Altura: `sm` 40px · `md` 48px (por defecto) · `lg` 56px. Padding‑x de 20/24/28px. Radio `--radius-pill`. `--fs-small` en sm y `--fs-body` en md/lg, con peso 500.
- Con icono, se usa el patrón de la referencia `padding: 8px 8px 8px 20px` y el icono en un círculo de 32px (`.btn__icon`) con fondo invertido.
- Ancho completo en móvil dentro de sheets y forms (`.btn--block`).

### Inputs (`.field`)
- Altura de 52px, fondo `--bg-canvas-alt`, borde `1px solid transparent`, radio `--radius-md` y padding 0 16px.
- Label encima (`--fs-small`, peso 500, `--text-secondary`) con un gap de 8px.
- En hover el borde pasa a `--border-hairline`. En focus, a `--ink-1000` con fondo `--white`. En error, a `--danger`, con un mensaje de 12px en `--danger` debajo.
- Sobre navy (`.field--inverse`) el fondo es `--glass-1`, el borde `--border-inverse` y el texto blanco.
- **Segmented control** (`.segmented`): contenedor píldora en `--bg-canvas-alt` con padding de 4px. La opción activa es una píldora `--ink-900` con texto blanco (o `--accent` en el switch B2C/B2B del hero).
- **Choice cards** (`.choice`): radio o checkbox visual; seleccionado = borde 1px `--ink-1000` + check lima.

### Cards (`.card`)
- Fondo `--bg-surface`, borde hairline, radio `--radius-lg`, padding `--space-8` y sin sombra.
- **Media card** (servicios, coaches): imagen con ratio 3/4, radio `--radius-lg`, overlay `--overlay-photo` y texto blanco abajo.
- **Stat card**: cifra en `--fs-stat` + label en `--fs-small` `--text-secondary`.
- **Pricing card**: la destacada (`.card--featured`) va sobre `--bg-inverse` con texto blanco y badge `--accent`.

### Tabla / cuadrante de disponibilidad (`.grid-avail`)
- Cabecera de columnas (pistas) sticky arriba y horas sticky a la izquierda, en `--fs-small` con tabular-nums.
- Celda de 44px de alto mínimo (touch target), radio `--radius-xs` y gap de 6px.
- Estados de celda: **libre** = `--bg-canvas-alt` y texto `--text-primary`; **ocupada** = `--bg-surface-muted` rayado (`repeating-linear-gradient` a 45°) y texto `--text-tertiary`, no interactiva; **seleccionada** = `--accent`; **última** = punto `--warning`.
- En móvil, scroll horizontal interno con la columna de horas fija.

### Modal (`.modal`) y Bottom sheet
- Desktop: centrado, máximo de 720px (o 960px para el checkout con cuadrante), radio `--radius-lg`, `--shadow-lg`, backdrop `--scrim` con `backdrop-filter: blur(4px)`.
- **Mobile (<810): todos los modales se renderizan como bottom sheet**: anclados abajo, radio `20px 20px 0 0`, altura máxima del 92dvh, *grabber* de 36×4px y cierre por swipe‑down (>120px o velocidad >0.5) o por tap en el scrim.
- Estructura: `header` (título + stepper + cerrar) · `body` (scroll interno) · `footer` sticky (resumen + CTA).
- **Stepper** (`.stepper`): 3 segmentos de 4px de alto; el completado/activo en `--ink-1000` y el pendiente en `--border-hairline`.

### Drawer (`.drawer`)
- Desktop: lateral derecho de 480px, a altura completa, con `--shadow-lg`. Se usa para el *Dossier B2B* y el formulario B2B rápido desde el hero.
- Mobile: se convierte en bottom sheet (misma regla que el modal).

### Badges (`.badge`)
- Píldora de 24px de alto, padding 0 10px, `--fs-caption`.
- Variantes: `--accent` (lima/ink), `--soft` (`--accent-soft`/ink), `--neutral` (`--bg-surface-muted`), `--inverse` (`--glass-2`/blanco), `--live` (punto lima pulsante + texto).

### Accordion (FAQ)
- Ítem con borde inferior hairline y padding de 24px en vertical. La pregunta va en `--fs-h4` (20–24px). El icono "+" rota 45° al abrirse y la altura se anima.

### Carrusel (servicios, logos)
- Contador `01 / 05` en `--fs-small` tabular, con botones prev/next circulares de 48px (`.btn--secondary`).
- Track con `scroll-snap-type: x mandatory`, que también es arrastrable en touch.
- Los logos B2B van en marquee continuo en escala de grises al 60% de opacidad, que pasa al 100% en hover.

### Toast
- Abajo en el centro (por encima de la tab bar en móvil), en `--ink-900` con texto blanco, radio pill, `--shadow-sm` y duración de 4s.

### Checkout (dentro del modal de reserva)
- **Recap** (`.bk-recap`): fondo `--bg-canvas-alt`, radio `--radius-md` e icono de 44px sobre `--accent` (`--radius-sm`). La acción "Cambiar" va como `.btn--link`.
- **Métodos de pago** (`.paymethods`): choice cards en 2 columnas en móvil y 4 desde 810px. El orden es fijo: Apple Pay · Google Pay · Tarjeta · Bizum. El método por defecto depende del dispositivo (iOS/Safari → Apple Pay, Android → Google Pay, resto → Tarjeta).
- **Botón wallet** (`.btn--wallet`): fondo `--ink-1000` con texto blanco (convención de Apple/Google Pay). Es la única excepción a "primary = lima".
- **Ticket** (`.ticket`): bloque `--bg-inverse` con radio `--radius-lg`, `dl` de 2 columnas y QR sobre blanco de 168px.

### Logo marquee (prueba social B2B)
- Los logos son SVG monocromos de 28px de alto en `currentColor`, al 55% de opacidad y en escala de grises (100% en hover). El carril tiene una máscara lateral del 10% y la animación corre a cargo de GSAP.

### Secciones de respiro
- **A (atmosférica):** foto a sangre de `clamp(360px, 72vh, 760px)`, sin titular, con solo un caption `--fs-small` en `--text-inverse-secondary` abajo a la izquierda. Parallax de scale 1.18→1 por scroll.
- **D (cinética):** marquee tipográfico a `clamp(48px, 8vw, 128px)` donde se alternan palabras sólidas y en contorno, con separadores circulares `--accent`. La velocidad se acopla a la velocidad de scroll.
- **Texto en contorno:** nunca usar `color: transparent` + `text-stroke`, porque la fuente variable muestra sus contornos internos superpuestos. El patrón obligatorio es `color: <fondo de la sección>; -webkit-text-stroke: 3px var(--ink-1000); paint-order: stroke fill;`, que deja visible un contorno de 1,5px. Sobre fondo navy: `color: var(--bg-inverse)` y trazo `var(--white)`.
- Regla: máximo 2 por página, nunca contiguas y nunca del mismo arquetipo.

---

## 8. Interaction States

| Estado | Regla |
|---|---|
| **Hover** | Primary: fondo a `--accent-hover`. Dark: a `--ink-800`. Secondary: fondo `rgba(0,0,0,.04)`. Cards interactivas: borde a `--ink-1000` e imagen con scale 1.03 (600ms). Solo con `@media (hover:hover)`. |
| **Focus‑visible** | `outline: 2px solid var(--focus-ring); outline-offset: 2px`. Sobre navy se usa `--focus-ring-inverse`. |
| **Active / pressed** | `transform: scale(.97)` en 120ms (vía Motion `press`). |
| **Disabled** | Opacidad .4, `cursor: not-allowed` y sin hover. Las celdas ocupadas usan el rayado. |
| **Loading** | Texto del botón sustituido por un spinner de 16px (borde 2px currentColor, gira en 700ms), con ancho bloqueado y `aria-busy="true"`. |
| **Selected** | Fondo `--accent` con texto `--on-accent` (slots, segmented B2C/B2B), o borde 1px `--ink-1000` con check lima (choice cards). |
| **Error** | Borde `--danger`, mensaje de 12px con icono y `aria-invalid="true"`. Se valida al hacer blur y al enviar, nunca mientras se escribe. |
| **Success** | Panel `--success-soft` con icono check en `--success` y el titular de confirmación en `--fs-h3`. |

**Motion tokens**
| Token | Valor |
|---|---|
| `--ease-out` | `cubic-bezier(.22, 1, .36, 1)` |
| `--ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` |
| `--dur-fast` | 160ms (hover, press) |
| `--dur-base` | 280ms (UI, tabs, acordeón) |
| `--dur-slow` | 600ms (entradas de sección) |

Con `prefers-reduced-motion: reduce` se desactivan el parallax, el marquee y los staggers, y las transiciones pasan a ≤ 1ms (solo opacidad).

**Reparto de librerías:** **Motion** se encarga de las microinteracciones, el press/hover, las entradas de componentes, los modales/sheets y los cambios de estado. **GSAP + ScrollTrigger** se encarga de los reveals por scroll, el parallax, el pin y el marquee. *Nunca animan la misma propiedad del mismo elemento.*

---

## 9. Responsive Rules

| Componente | Mobile < 810 | Tablet 810–1199 | Desktop ≥ 1200 |
|---|---|---|---|
| Shell | Header de 56px + tab bar de 64px; scroll interno en `#app-scroll` | Topbar de 72px; scroll del documento | Topbar de 72px |
| Hero | Foto vertical (`hero-m`) y widget apilado en sheet inline a ancho completo | Foto 16:9, widget en fila de 2×2 | Widget en una sola fila (4 campos + CTA) |
| Widget de reserva | Campos apilados, CTA a ancho completo | Grid de 2 columnas | Grid de 5 columnas |
| Modal / drawer | Bottom sheet | Modal centrado / drawer | Modal centrado / drawer |
| Cuadrante | Scroll horizontal con horas sticky | 4 pistas visibles | 6 pistas visibles |
| Servicios | Carrusel con snap y 1.15 cards visibles | 2.3 cards | 3.3 cards |
| Pricing | Carrusel con snap y la card "Club" centrada inicialmente | 3 columnas compactas | 3 columnas |
| Form B2B | Pasos a ancho completo y footer sticky | 2 columnas (form + aside) | 2 columnas |
| Tipografía | Valores "Mobile" de §3 | "Tablet" | "Desktop" |
| Touch targets | ≥ 44×44px siempre | — | — |

---

## 10. Performance guardrails
- El webfont (Inter Tight) se carga sin bloquear el render (`media="print"` + `onload`) y con `display=swap`. La cadena de fallback (`system-ui`) pinta primero.
- La imagen LCP del hero se precarga por media query: `hero-m.webp` (540×720, ~22 KB) en móvil y `hero-960/1376.webp` en desktop, con `fetchpriority="high"`. El resto de imágenes van con `loading="lazy"`, `decoding="async"` y `width`/`height` explícitos (CLS 0).
- Fotografía en WebP: q≈70 y 2 tamaños (`-480` y original ≤ 1600px).
- Librerías: GSAP 3.12.5 y ScrollTrigger (cdnjs), Motion 11.11.13 (jsDelivr), todas `defer`. La librería de QR (qrcode-generator 1.4.4) se carga bajo demanda en la confirmación.

## 11. Changelog
- **2026‑11‑18 · v1.1**: Tab bar real (Reservar central), `--overlay-hero` con degradado lateral, checkout (recap, wallets, ticket), logo marquee, reglas de secciones de respiro y guardrails de rendimiento.
- **2026‑11‑18 · v1.0**: Sistema inicial. Se introducen los tokens de estado (§2.3), el cuadrante (`.grid-avail`), el stepper, el bottom sheet y el drawer, que no existen en la referencia y siguen la regla de resolución de conflictos.
