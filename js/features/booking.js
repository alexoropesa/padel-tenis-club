/* ==========================================================================
   B2C conversion engine
   - Hero quick-booking widget (RF-01.1)
   - Inline live availability (RF-02.1)
   - 3-step modal / bottom sheet: Pista → Pago → Confirmación (RF-02.2, RF-02.3)
   - Same checkout reused for memberships, school and tournament enrollment
   ========================================================================== */
import { SPORTS, CLUB, nextDays, dayLong, euro, addMinutes, isPast, markBooked, toISO } from '../services/availability.js';
import { pay, createReservation, submitLead, isEmail, isPhone } from '../services/api.js';
import { createAvailability } from './avail-grid.js';
import { open as openOverlay, onClose } from '../ui/overlay.js';
import { segmented } from '../ui/controls.js';
import { animate, swap } from '../motion/micro.js';

/* ---------- catalogue for non-court checkouts ---------- */
const fridays = () => {
  const out = []; const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  for (let i = 0; i < 4; i++) { out.push(toISO(d)); d.setDate(d.getDate() + 7); }
  return out;
};
const PRODUCTS = {
  libre: { kind: 'membership', title: 'Plan Juego libre', price: 29, unit: '/mes', meta: 'Renovación mensual · sin permanencia', icon: 'i-tag' },
  club: { kind: 'membership', title: 'Plan Club', price: 59, unit: '/mes', meta: 'Renovación mensual · sin permanencia', icon: 'i-tag' },
  performance: { kind: 'membership', title: 'Plan Performance', price: 99, unit: '/mes', meta: 'Renovación mensual · sin permanencia', icon: 'i-tag' },
  escuela: {
    kind: 'enroll', title: 'Escuela · grupo de 4', price: 49, unit: '/mes', meta: '2 clases semanales de 60 min', icon: 'i-school',
    options: [
      { name: 'sport', label: 'Deporte', choices: ['Pádel', 'Tenis'] },
      { name: 'level', label: 'Nivel', choices: ['Iniciación', 'Intermedio', 'Avanzado', 'Infantil (6–14 años)'] },
      { name: 'schedule', label: 'Horario', choices: ['Lun y Mié · 19:00', 'Mar y Jue · 19:00', 'Mar y Jue · 10:00', 'Sáb · 10:00 (2 h)'] },
    ],
  },
  torneo: {
    kind: 'enroll', title: 'Americano del viernes', price: 18, unit: '/persona', meta: '19:00–22:00 · bebida incluida', icon: 'i-trophy', dated: true,
    options: [
      { name: 'date', label: 'Fecha', choices: () => fridays().map((iso) => ({ value: iso, label: dayLong(iso) })) },
      { name: 'level', label: 'Nivel', choices: ['Iniciación (2.5–3.0)', 'Medio (3.0–3.5)', 'Medio‑alto (3.5–4.0)', 'Avanzado (4.0+)'] },
    ],
  },
  'clase-prueba': {
    kind: 'enroll', title: 'Clase de prueba', price: 0, unit: '', meta: '60 min con un entrenador · material incluido', icon: 'i-school',
    options: [
      { name: 'sport', label: 'Deporte', choices: ['Pádel', 'Tenis'] },
      { name: 'schedule', label: 'Preferencia', choices: ['Mañanas', 'Tardes', 'Fin de semana'] },
    ],
  },
};

/* ---------- state ---------- */
const S = { mode: 'court', step: 1, sport: 'padel', date: null, time: null, slot: null, product: null, method: null, busy: false, avail: null };
const $ = (sel, root = document) => root.querySelector(sel);
let els;

const defaultMethod = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|CriOS|Android/.test(ua)) return 'apple';
  if (/Android/.test(ua)) return 'google';
  return 'card';
};
const store = {
  get() { try { return JSON.parse(localStorage.getItem('volea.customer')) || {}; } catch { return {}; } },
  set(v) { try { localStorage.setItem('volea.customer', JSON.stringify(v)); } catch { /* private mode */ } },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- public entry points ---------- */
export function openBooking({ sport, date, time, slot } = {}) {
  S.mode = 'court'; S.product = null;
  S.sport = sport || (slot && slot.sport) || S.sport;
  S.date = date || (slot && slot.date) || null;
  S.time = time || null;
  S.slot = slot || null;
  S.method = S.method || defaultMethod();
  render(slot ? 2 : 1, false);
  openOverlay('booking');
}
export function openProduct(key) {
  const p = PRODUCTS[key]; if (!p) return;
  S.mode = 'product'; S.product = { key, ...p }; S.slot = null;
  S.method = S.method || defaultMethod();
  render(2, false);
  openOverlay('booking');
}

/* ---------- render ---------- */
async function render(step, animated = true) {
  const dir = step >= S.step ? 1 : -1;
  S.step = step;
  const paint = () => {
    updateChrome();
    if (step === 1) renderPick();
    if (step === 2) renderPay();
  };
  if (animated) await swap(els.body, paint, dir); else paint();
  els.body.scrollTop = 0;
}

function updateChrome() {
  const titles = S.mode === 'court'
    ? ['Elige pista y hora', 'Tus datos y pago', 'Reserva confirmada']
    : [S.product.title, S.product.price ? 'Tus datos y pago' : 'Tus datos', S.product.kind === 'membership' ? 'Bienvenida al club' : 'Plaza confirmada'];
  els.title.textContent = titles[S.step - 1];
  const labels = S.mode === 'court' ? ['Pista', 'Pago', 'Confirmación'] : ['Plan', S.product.price ? 'Pago' : 'Datos', 'Confirmación'];
  [...els.labels.children].forEach((l, i) => { l.textContent = labels[i]; l.classList.toggle('is-active', i < S.step); });
  [...els.stepper.children].forEach((seg, i) => { seg.classList.toggle('is-done', i < S.step - 1); seg.classList.toggle('is-active', i === S.step - 1); });
  els.panel.classList.toggle('panel--wide', S.step === 1);
}

/* Step 1: pick court & time */
function renderPick() {
  els.body.innerHTML = `
    <div class="bk-step">
      <div class="bk-controls">
        <div class="segmented" role="tablist" aria-label="Deporte" data-bk-sport>
          <span class="segmented__pill" aria-hidden="true"></span>
          ${Object.entries(SPORTS).map(([k, s]) => `<button class="segmented__opt" role="tab" type="button" aria-selected="${k === S.sport}" data-value="${k}">${s.label} · ${s.duration} min</button>`).join('')}
        </div>
        <p class="t-small t-muted">Precio por pista, no por persona. Hora punta desde las 17:00.</p>
      </div>
      <div data-bk-avail></div>
    </div>`;
  if (S.avail) S.avail.destroy();
  S.avail = createAvailability($('[data-bk-avail]', els.body), {
    sport: S.sport, date: S.date, targetTime: S.time,
    onSelect: (slot) => {
      S.slot = slot; S.date = slot.date; S.time = slot.time;
      renderPickFoot();
      setTimeout(() => S.step === 1 && render(2), 260); // auto-advance: selection = click 2 of 3
    },
  });
  segmented($('[data-bk-sport]', els.body), (v) => { S.sport = v; S.slot = null; S.time = null; S.avail.set({ sport: v, selected: null, targetTime: null }); renderPickFoot(); });
  renderPickFoot();
}
function renderPickFoot() {
  const s = S.slot;
  els.foot.innerHTML = `
    <div class="summary">
      <span class="summary__title">${s ? `${s.court.name} · ${s.time}` : 'Selecciona un hueco libre'}</span>
      <span class="summary__meta">${s ? `${dayLong(s.date)} · ${s.duration} min` : 'Sin registro · cancelación gratis 24 h'}</span>
    </div>
    <button class="btn btn--primary" type="button" data-bk-next ${s ? '' : 'disabled'}>Continuar <svg class="icon icon--sm" aria-hidden="true"><use href="#i-arrow-right"/></svg></button>`;
  $('[data-bk-next]', els.foot).addEventListener('click', () => S.slot && render(2));
}

/* Step 2: guest checkout */
function recapHTML() {
  if (S.mode === 'court') {
    const s = S.slot;
    return `<div class="bk-recap">
      <div class="bk-recap__info"><span class="bk-recap__icon"><svg class="icon" aria-hidden="true"><use href="#i-court"/></svg></span>
        <div class="summary"><span class="summary__title">${SPORTS[s.sport].label} · ${s.court.name} (${s.court.tag})</span><span class="summary__meta">${dayLong(s.date)} · ${s.time}–${addMinutes(s.time, s.duration)}</span></div></div>
      <button class="btn btn--link t-small" type="button" data-bk-change>Cambiar</button>
    </div>`;
  }
  const p = S.product;
  return `<div class="bk-recap">
    <div class="bk-recap__info"><span class="bk-recap__icon"><svg class="icon" aria-hidden="true"><use href="#${p.icon}"/></svg></span>
      <div class="summary"><span class="summary__title">${p.title}${p.price ? ` · ${euro(p.price)}${p.unit}` : ' · Gratis'}</span><span class="summary__meta">${p.meta}</span></div></div>
  </div>`;
}
function optionsHTML() {
  if (S.mode !== 'product' || !S.product.options) return '';
  return `<div class="form-grid form-grid--2">${S.product.options.map((o) => {
    const choices = typeof o.choices === 'function' ? o.choices() : o.choices.map((c) => ({ value: c, label: c }));
    return `<div class="field"><label class="field__label" for="bk-opt-${o.name}">${o.label}</label><select class="field__control" id="bk-opt-${o.name}" name="opt-${o.name}">${choices.map((c) => `<option value="${esc(c.value)}">${esc(c.label)}</option>`).join('')}</select></div>`;
  }).join('')}</div>`;
}
const PAY_METHODS = [
  { id: 'apple', label: 'Apple Pay', mark: '<svg class="icon icon--fill" aria-hidden="true"><use href="#i-apple"/></svg>Pay' },
  { id: 'google', label: 'Google Pay', mark: '<b class="paymark__g">G</b>&nbsp;Pay' },
  { id: 'card', label: 'Tarjeta', mark: '<svg class="icon" aria-hidden="true"><use href="#i-card"/></svg>' },
  { id: 'bizum', label: 'Bizum', mark: '<span class="paymark__bizum">bizum</span>' },
];
function payHTML() {
  const price = currentPrice();
  if (!price) return '';
  return `<fieldset class="stack">
    <legend class="bk-section-title">Método de pago</legend>
    <div class="paymethods choices" role="radiogroup">
      ${PAY_METHODS.map((m) => `<label class="choice"><input type="radio" name="method" value="${m.id}" ${S.method === m.id ? 'checked' : ''}><span class="choice__box"><span class="paymark">${m.mark}</span><span class="t-caption">${m.label}</span><span class="choice__check"></span></span></label>`).join('')}
    </div>
    <div data-bk-method></div>
    <p class="secure-note"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-lock"/></svg>Pago seguro con Stripe (PCI DSS) y Bizum. No guardamos tu tarjeta.</p>
  </fieldset>`;
}
function methodHTML() {
  const c = store.get();
  if (S.method === 'card') return `<div class="bk-card-fields">
      <div class="field"><label class="field__label" for="bk-cc">Número de tarjeta</label><input class="field__control t-num" id="bk-cc" name="cc" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234" maxlength="23"><p class="field__error">Revisa el número de la tarjeta.</p></div>
      <div class="field"><label class="field__label" for="bk-exp">Caducidad</label><input class="field__control t-num" id="bk-exp" name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5"><p class="field__error">Fecha no válida.</p></div>
      <div class="field"><label class="field__label" for="bk-cvc">CVC</label><input class="field__control t-num" id="bk-cvc" name="cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"><p class="field__error">CVC no válido.</p></div>
    </div>`;
  if (S.method === 'bizum') return `<div class="field"><label class="field__label" for="bk-bizum">Móvil asociado a Bizum</label><input class="field__control t-num" id="bk-bizum" name="bizum" type="tel" inputmode="tel" autocomplete="tel" value="${esc(c.phone || '')}"><p class="field__hint">Recibirás la solicitud en la app de tu banco.</p><p class="field__error">Introduce un móvil válido.</p></div>`;
  return `<div class="bk-wallet">Confirmarás el pago con ${S.method === 'apple' ? 'Face ID o Touch ID' : 'tu cuenta de Google'} al pulsar el botón.</div>`;
}
function currentPrice() { return S.mode === 'court' ? S.slot.price : S.product.price; }

function renderPay() {
  const c = store.get();
  els.body.innerHTML = `
    <form class="bk-step" data-bk-form novalidate>
      ${recapHTML()}
      ${optionsHTML()}
      <fieldset class="stack">
        <legend class="bk-section-title">Tus datos · sin crear cuenta</legend>
        <div class="form-grid form-grid--2">
          <div class="field span-2"><label class="field__label" for="bk-name">Nombre y apellidos</label><input class="field__control" id="bk-name" name="name" autocomplete="name" value="${esc(c.name || '')}" required><p class="field__error">Indica tu nombre.</p></div>
          <div class="field"><label class="field__label" for="bk-email">Email</label><input class="field__control" id="bk-email" name="email" type="email" inputmode="email" autocomplete="email" value="${esc(c.email || '')}" required><p class="field__error">Revisa el email.</p></div>
          <div class="field"><label class="field__label" for="bk-phone">Teléfono (WhatsApp)</label><input class="field__control t-num" id="bk-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(c.phone || '')}" required><p class="field__error">Introduce un teléfono válido.</p></div>
        </div>
      </fieldset>
      ${payHTML()}
      <p class="alert alert--error" data-bk-error hidden></p>
    </form>`;
  const form = $('[data-bk-form]', els.body);
  const methodBox = $('[data-bk-method]', form);
  if (methodBox) methodBox.innerHTML = methodHTML();
  form.addEventListener('change', (e) => {
    if (e.target.name === 'method') {
      S.method = e.target.value;
      animate(methodBox, { opacity: [0, 1], y: [6, 0] }, { duration: 0.24 });
      methodBox.innerHTML = methodHTML();
      renderPayFoot();
    }
  });
  form.addEventListener('input', (e) => {
    if (e.target.name === 'cc') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
    if (e.target.name === 'exp') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');
    if (e.target.name === 'cvc') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  });
  form.addEventListener('focusout', (e) => { if (e.target.matches('.field__control') && e.target.value) validateField(e.target); });
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  const change = $('[data-bk-change]', form);
  if (change) change.addEventListener('click', () => render(1));
  renderPayFoot();
  const firstEmpty = [...form.querySelectorAll('input[required]')].find((i) => !i.value);
  if (firstEmpty && !matchMedia('(max-width: 809.98px)').matches) setTimeout(() => firstEmpty.focus({ preventScroll: true }), 350);
}
function renderPayFoot() {
  const price = currentPrice();
  const label = !price ? 'Confirmar plaza'
    : S.method === 'apple' ? `Pagar con Apple Pay`
    : S.method === 'google' ? `Pagar con Google Pay`
    : S.method === 'bizum' ? `Pagar con Bizum`
    : `Pagar ${euro(price)}`;
  els.foot.innerHTML = `
    <div class="bk-total"><span class="t-caption t-muted">Total</span><span class="bk-total__price">${price ? euro(price) + (S.mode === 'product' ? S.product.unit : '') : 'Gratis'}</span></div>
    <button class="btn ${S.method === 'apple' || S.method === 'google' ? 'btn--wallet' : 'btn--primary'} btn--lg" type="button" data-bk-pay>${label}</button>`;
  $('[data-bk-pay]', els.foot).addEventListener('click', submit);
}

/* ---------- validation ---------- */
function validateField(input) {
  const v = input.value.trim();
  let ok = true;
  switch (input.name) {
    case 'name': ok = v.length >= 2; break;
    case 'email': ok = isEmail(v); break;
    case 'phone': case 'bizum': ok = isPhone(v); break;
    case 'cc': ok = /^\d{13,19}$/.test(v.replace(/\s/g, '')); break;
    case 'exp': {
      const m = v.match(/^(\d{2})\/(\d{2})$/);
      if (!m) { ok = false; break; }
      const mm = +m[1], yy = 2000 + +m[2]; const now = new Date();
      ok = mm >= 1 && mm <= 12 && (yy > now.getFullYear() || (yy === now.getFullYear() && mm >= now.getMonth() + 1));
      break;
    }
    case 'cvc': ok = /^\d{3,4}$/.test(v); break;
  }
  const field = input.closest('.field');
  if (field) field.classList.toggle('is-error', !ok);
  input.setAttribute('aria-invalid', String(!ok));
  return ok;
}

async function submit() {
  if (S.busy) return;
  const form = $('[data-bk-form]', els.body);
  const inputs = [...form.querySelectorAll('input[name="name"], input[name="email"], input[name="phone"], input[name="cc"], input[name="exp"], input[name="cvc"], input[name="bizum"]')];
  const bad = inputs.filter((i) => !validateField(i));
  if (bad.length) { bad[0].focus(); return; }
  if (S.mode === 'court' && isPast(S.slot.date, S.slot.time)) { showError('Ese horario ya ha pasado. Elige otro hueco.'); return; }

  const fd = new FormData(form);
  const customer = { name: fd.get('name').trim(), email: fd.get('email').trim(), phone: fd.get('phone').trim() };
  store.set(customer);
  const options = {};
  for (const [k, v] of fd.entries()) if (k.startsWith('opt-')) options[k.slice(4)] = v;

  const btn = $('[data-bk-pay]', els.foot);
  S.busy = true; btn.setAttribute('aria-busy', 'true');
  try {
    const price = currentPrice();
    const description = S.mode === 'court' ? `${SPORTS[S.slot.sport].label} ${S.slot.court.name} ${S.slot.date} ${S.slot.time}` : S.product.title;
    const payment = price ? await pay({ amount: price, method: S.method, customer, description }) : { ok: true, paymentId: null };
    let code;
    if (S.mode === 'court') {
      const r = await createReservation({ ...S.slot, court: S.slot.court.id, customer, paymentId: payment.paymentId, method: S.method });
      code = r.code;
      markBooked(S.slot.sport, S.slot.date, S.slot.court.id, S.slot.time);
    } else {
      const r = await submitLead(S.product.kind, { product: S.product.key, options, customer, paymentId: payment.paymentId });
      code = r.id;
    }
    S.busy = false;
    await swap(els.body, () => renderConfirm({ code, customer, options }), 1);
  } catch (err) {
    S.busy = false; btn.removeAttribute('aria-busy');
    showError('No hemos podido completar el pago. No se ha realizado ningún cargo; inténtalo de nuevo.');
    console.error(err);
  }
}
function showError(msg) {
  const el = $('[data-bk-error]', els.body);
  el.textContent = msg; el.hidden = false;
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* Step 3: confirmation */
function eventInfo(options) {
  if (S.mode === 'court') {
    const s = S.slot;
    return { title: `${SPORTS[s.sport].label} · ${s.court.name} · Volea Club`, date: s.date, start: s.time, end: addMinutes(s.time, s.duration) };
  }
  if (S.product.key === 'torneo' && options.date) return { title: `Americano del viernes · Volea Club`, date: options.date, start: '19:00', end: '22:00' };
  return null;
}
function renderConfirm({ code, customer, options }) {
  S.step = 3; updateChrome();
  const ev = eventInfo(options);
  const price = currentPrice();
  const rows = S.mode === 'court'
    ? [['Deporte', SPORTS[S.slot.sport].label], ['Pista', `${S.slot.court.name} · ${S.slot.court.tag}`], ['Fecha', dayLong(S.slot.date)], ['Hora', `${S.slot.time}–${ev.end}`], ['Pagado', euro(price)]]
    : [['Producto', S.product.title], ...Object.entries(options).map(([k, v]) => [S.product.options.find((o) => o.name === k).label, k === 'date' ? dayLong(v) : v]), ['Importe', price ? `${euro(price)}${S.product.unit}` : 'Gratis']];
  const first = customer.name.split(' ')[0];
  const head = S.mode === 'court' ? `Todo listo, ${esc(first)}.` : S.product.kind === 'membership' ? `Ya eres socio, ${esc(first)}.` : `Plaza reservada, ${esc(first)}.`;
  els.body.innerHTML = `
    <div class="confirm">
      <div class="confirm__hero">
        <span class="confirm__icon" data-confirm-icon><svg class="icon icon--lg" aria-hidden="true"><use href="#i-check"/></svg></span>
        <h3 class="t-h3">${head}</h3>
        <p class="t-body">Te hemos enviado la confirmación a <b>${esc(customer.email)}</b> y por WhatsApp al <b class="t-num">${esc(customer.phone)}</b>.</p>
      </div>
      <div class="ticket">
        <dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        <div><div class="ticket__qr" data-qr aria-label="Código QR de acceso ${code}"></div><p class="ticket__code ticket__code--inverse">${code}</p></div>
      </div>
      <p class="t-small t-muted">${S.mode === 'court' ? 'Enseña el QR en el torno de acceso. Puedes cancelar gratis hasta 24 h antes desde el email.' : 'Enseña el QR en recepción el primer día.'}</p>
      <div class="confirm__actions">
        ${ev ? `<a class="btn btn--secondary" target="_blank" rel="noopener" href="${googleCalUrl(ev, code)}"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-calendar"/></svg>Google Calendar</a>
        <button class="btn btn--secondary" type="button" data-ics><svg class="icon icon--sm" aria-hidden="true"><use href="#i-download"/></svg>Apple / iCal</button>` : ''}
        <a class="btn btn--secondary" target="_blank" rel="noopener" href="${whatsappUrl(ev, code)}"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-whatsapp"/></svg>Compartir por WhatsApp</a>
      </div>
    </div>`;
  const ics = $('[data-ics]', els.body);
  if (ics) ics.addEventListener('click', () => downloadICS(ev, code));
  renderQR($('[data-qr]', els.body), code);
  animate($('[data-confirm-icon]', els.body), { scale: [0.4, 1], opacity: [0, 1] }, { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] });
  els.foot.innerHTML = `
    <button class="btn btn--secondary" type="button" data-bk-again>${S.mode === 'court' ? 'Reservar otra' : 'Reservar pista'}</button>
    <button class="btn btn--primary" type="button" data-close>Hecho</button>`;
  $('[data-bk-again]', els.foot).addEventListener('click', () => { S.mode = 'court'; S.slot = null; S.product = null; S.time = null; render(1); });
}

/* ---------- QR / calendar / WhatsApp ---------- */
let qrLib;
function loadQR() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (!qrLib) qrLib = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    s.onload = () => res(window.qrcode); s.onerror = rej;
    document.head.appendChild(s);
  });
  return qrLib;
}
async function renderQR(el, code) {
  try {
    const qrcode = await loadQR();
    const qr = qrcode(0, 'M'); qr.addData(`VOLEA:${code}`); qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch {
    el.innerHTML = `<p class="ticket__code">${code}</p>`;
  }
}
const calStamp = (date, time) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
function googleCalUrl(ev, code) {
  const p = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: `${calStamp(ev.date, ev.start)}/${calStamp(ev.date, ev.end)}`, ctz: CLUB.tz, location: CLUB.address, details: `Código de acceso: ${code}` });
  return `https://calendar.google.com/calendar/render?${p}`;
}
function downloadICS(ev, code) {
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Volea Club//Reservas//ES', 'BEGIN:VEVENT', `UID:${code}@voleaclub.es`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`, `DTSTART;TZID=${CLUB.tz}:${calStamp(ev.date, ev.start)}`, `DTEND;TZID=${CLUB.tz}:${calStamp(ev.date, ev.end)}`,
    `SUMMARY:${ev.title}`, `LOCATION:${CLUB.address.replace(/,/g, '\\,')}`, `DESCRIPTION:Código de acceso: ${code}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Recordatorio de tu pista', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `volea-${code}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function whatsappUrl(ev, code) {
  const txt = ev ? `¡Pista reservada en Volea Club! ${ev.title.split(' · Volea')[0]} · ${dayLong(ev.date)} a las ${ev.start}. ${CLUB.address}. Código: ${code}` : `Me he apuntado en Volea Club (${code}). ¿Te vienes?`;
  return `https://wa.me/?text=${encodeURIComponent(txt)}`;
}

/* ---------- hero widget + inline grid ---------- */
function fillTimes(sel, sport, date) {
  const times = SPORTS[sport].times.filter((t) => !isPast(date, t));
  sel.innerHTML = `<option value="">Cualquier hora</option>` + times.map((t) => `<option value="${t}">${t}</option>`).join('');
}
function initWidget() {
  const form = $('[data-quick-booking]');
  const sport = form.sport, date = form.date, time = form.time;
  date.innerHTML = nextDays(7).map((iso) => `<option value="${iso}">${dayLong(iso)}</option>`).join('');
  fillTimes(time, sport.value, date.value);
  sport.addEventListener('change', () => fillTimes(time, sport.value, date.value));
  date.addEventListener('change', () => fillTimes(time, sport.value, date.value));
  form.addEventListener('submit', (e) => { e.preventDefault(); openBooking({ sport: sport.value, date: date.value, time: time.value || null }); });
}
function initInline() {
  const host = $('[data-avail-inline]'); if (!host) return;
  const grid = createAvailability(host, { sport: 'padel', onSelect: (slot) => openBooking({ slot }) });
  segmented($('[data-segmented="inline-sport"]'), (v) => grid.set({ sport: v, selected: null }));
  onClose('booking', () => { grid.set({ selected: null }); });
}

export function initBooking() {
  els = {
    panel: $('#booking [data-panel]'), body: $('[data-bk-body]'), foot: $('[data-bk-foot]'),
    title: $('[data-bk-title]'), stepper: $('[data-bk-stepper]'), labels: $('[data-bk-labels]'),
  };
  initWidget();
  initInline();
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open-booking]');
    if (b) { e.preventDefault(); openBooking({ sport: b.dataset.sport }); return; }
    const j = e.target.closest('[data-join]');
    if (j) { openProduct(j.dataset.join); return; }
    const en = e.target.closest('[data-enroll]');
    if (en) openProduct(en.dataset.enroll);
  });
  onClose('booking', () => { if (S.avail) { S.avail.destroy(); S.avail = null; } });
  if (window.location.hash === '#reservar-ahora') openBooking(); // deep link for ads / QR posters
}
