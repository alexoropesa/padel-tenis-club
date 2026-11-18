/* ==========================================================================
   B2B conversion
   - Hero B2B quick form → pre-fills the smart quote form (RF-01.2)
   - Smart multi-step quote form (RF-03.2) → CRM
   - Dossier lead magnet behind corporate email (RF-03.3) → CRM + PDF
   ========================================================================== */
import { submitLead, isCorporateEmail, isPhone } from '../services/api.js';
import { open as openOverlay } from '../ui/overlay.js';
import { animate, swap } from '../motion/micro.js';
import { toast } from '../ui/controls.js';
import { toISO, pad } from '../services/availability.js';

const $ = (s, r = document) => r.querySelector(s);
const COURTS_BY_ATTENDEES = { '10-24': 3, '25-49': 6, '50-99': 10, '100+': 12 };
const DOSSIER_URL = 'assets/dossier-volea-b2b.pdf';

function scrollToEl(el) {
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

/* ---------- Smart quote form ---------- */
function initQuoteForm() {
  const form = $('[data-b2b-form]'); if (!form) return {};
  const steps = [...form.querySelectorAll('[data-q-step]')];
  const prev = $('[data-q-prev]', form), next = $('[data-q-next]', form), counter = $('[data-q-counter]', form);
  const stepper = $('[data-q-stepper]'), labels = $('[data-q-labels]'), status = $('[data-q-status]', form);
  let step = 1, courtsTouched = false, sending = false;

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  form.date.min = toISO(tomorrow);

  const type = () => (form.querySelector('input[name="eventType"]:checked') || {}).value;
  const applyType = () => {
    const sponsor = type() === 'patrocinio';
    form.querySelectorAll('[data-hide-for="patrocinio"]').forEach((el) => { el.hidden = sponsor; el.querySelectorAll('input,select').forEach((i) => (i.disabled = sponsor)); });
    form.querySelectorAll('[data-show-for="patrocinio"]').forEach((el) => { el.hidden = !sponsor; el.querySelectorAll('input,select').forEach((i) => (i.disabled = !sponsor)); });
  };
  const suggestCourts = () => {
    const n = COURTS_BY_ATTENDEES[form.attendees.value];
    if (n && !courtsTouched) { form.courts.value = n; $('[data-courts-hint]', form).textContent = `Sugerido para ${form.attendees.value} asistentes.`; }
  };

  const chrome = () => {
    [...stepper.children].forEach((s, i) => { s.classList.toggle('is-done', i < step - 1); s.classList.toggle('is-active', i === step - 1); });
    [...labels.children].forEach((l, i) => l.classList.toggle('is-active', i < step));
    prev.hidden = step === 1;
    counter.textContent = `Paso ${step} de 3`;
    next.innerHTML = step === 3 ? 'Enviar solicitud <svg class="icon icon--sm" aria-hidden="true"><use href="#i-arrow-right"/></svg>' : 'Continuar <svg class="icon icon--sm" aria-hidden="true"><use href="#i-arrow-right"/></svg>';
    status.textContent = `Paso ${step} de 3: ${labels.children[step - 1].textContent}`;
  };

  const validateInput = (i) => {
    if (i.disabled || i.closest('[hidden]')) return true;
    const v = (i.value || '').trim();
    let ok = true;
    if (i.type === 'checkbox') ok = !i.required || i.checked;
    else if (i.required && !v) ok = false;
    else if (i.dataset.corporate !== undefined) ok = isCorporateEmail(v);
    else if (i.type === 'tel') ok = isPhone(v);
    else if (i.name === 'courts') ok = +v >= 1 && +v <= 12;
    else if (i.type === 'date') ok = v >= i.min;
    const holder = i.closest('.field') || i.closest('.check');
    if (holder) holder.classList.toggle('is-error', !ok);
    i.setAttribute('aria-invalid', String(!ok));
    return ok;
  };
  const validateStep = (n) => {
    const fs = steps[n - 1];
    if (n === 1) {
      const ok = !!type();
      fs.classList.toggle('is-error', !ok);
      $('[data-choice-group]', fs).classList.toggle('is-error', !ok);
      return ok;
    }
    const inputs = [...fs.querySelectorAll('input[required], select[required]')];
    const bad = inputs.filter((i) => !validateInput(i));
    if (bad.length) bad[0].focus();
    return !bad.length;
  };

  const go = async (n) => {
    const dir = n > step ? 1 : -1;
    const body = form;
    await animate(steps[step - 1], { opacity: [1, 0], x: [0, -16 * dir] }, { duration: 0.16 });
    steps[step - 1].hidden = true;
    step = n;
    steps[step - 1].hidden = false;
    chrome();
    animate(steps[step - 1], { opacity: [0, 1], x: [16 * dir, 0] }, { duration: 0.28 });
    const r = body.closest('.quote__form').getBoundingClientRect();
    if (r.top < 0) scrollToEl(body.closest('.quote__form'));
    const f = steps[step - 1].querySelector('input:not([type=radio]):not([disabled]), select:not([disabled])');
    if (f && step > 1 && !matchMedia('(max-width: 809.98px)').matches) f.focus({ preventScroll: true });
  };

  const send = async () => {
    if (sending) return;
    sending = true; next.setAttribute('aria-busy', 'true');
    const fd = new FormData(form);
    const data = Object.fromEntries([...fd.entries()].filter(([k]) => k !== 'extras'));
    data.extras = fd.getAll('extras');
    try {
      const res = await submitLead('b2b_quote', data);
      $('[data-q-ref]', form).textContent = res.id;
      await swap(form, () => {
        steps.forEach((s) => (s.hidden = true));
        $('[data-q-foot]', form).hidden = true;
        $('[data-q-success]', form).hidden = false;
        [...stepper.children].forEach((s) => { s.classList.add('is-done'); });
        [...labels.children].forEach((l) => l.classList.add('is-active'));
      });
      $('[data-q-success]', form).focus();
    } catch (e) {
      toast('No se ha podido enviar. Llámanos al 965 000 000.', { icon: 'i-phone', duration: 6000 });
      console.error(e);
    } finally {
      sending = false; next.removeAttribute('aria-busy');
    }
  };

  form.addEventListener('change', (e) => {
    if (e.target.name === 'eventType') { applyType(); steps[0].classList.remove('is-error'); $('[data-choice-group]', form).classList.remove('is-error'); if (step === 1) setTimeout(() => go(2), 220); }
    if (e.target.name === 'attendees') suggestCourts();
    if (e.target.type === 'checkbox' && e.target.required) validateInput(e.target);
  });
  form.addEventListener('input', (e) => { if (e.target.name === 'courts') courtsTouched = true; });
  form.addEventListener('focusout', (e) => { if (e.target.matches('.field__control') && e.target.value) validateInput(e.target); });
  next.addEventListener('click', () => { if (!validateStep(step)) return; if (step < 3) go(step + 1); else send(); });
  prev.addEventListener('click', () => step > 1 && go(step - 1));
  form.addEventListener('submit', (e) => { e.preventDefault(); next.click(); });
  chrome();

  return {
    prefill({ eventType, attendees, month }) {
      const radio = form.querySelector(`input[name="eventType"][value="${eventType}"]`);
      if (radio) radio.checked = true;
      applyType();
      if (attendees) { form.attendees.value = attendees; suggestCourts(); }
      if (month) {
        const [y, m] = month.split('-').map(Number);
        const d = new Date(y, m - 1, 15);
        const v = toISO(d);
        form.date.value = v < form.date.min ? form.date.min : v;
      }
      if (step === 1) go(2);
    },
  };
}

/* ---------- Hero quick B2B ---------- */
function initQuickB2B(quote) {
  const form = $('[data-quick-b2b]'); if (!form) return;
  const months = [];
  const d = new Date(); d.setDate(1);
  for (let i = 0; i < 9; i++) {
    const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(d);
    months.push(`<option value="${d.getFullYear()}-${pad(d.getMonth() + 1)}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`);
    d.setMonth(d.getMonth() + 1);
  }
  form.month.innerHTML = months.join('');
  form.month.selectedIndex = 1;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    quote.prefill && quote.prefill({ eventType: form.eventType.value, attendees: form.attendees.value, month: form.month.value });
    scrollToEl($('#presupuesto'));
    toast('Hemos rellenado los datos del evento. Revisa y continúa.', { icon: 'i-check' });
  });
}

/* ---------- Dossier lead magnet ---------- */
function initDossier() {
  const form = $('[data-dossier-form]'); if (!form) return;
  const success = $('[data-dossier-success]');
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-open-dossier]')) return;
    form.hidden = false; success.hidden = true; form.reset();
    form.querySelectorAll('.is-error').forEach((x) => x.classList.remove('is-error'));
    openOverlay('dossier');
  });
  form.email.addEventListener('blur', () => { if (form.email.value) check(form.email); });
  function check(i) {
    const ok = i.type === 'checkbox' ? i.checked : isCorporateEmail(i.value);
    (i.closest('.field') || i.closest('.check')).classList.toggle('is-error', !ok);
    i.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const okEmail = check(form.email), okConsent = check(form.consent);
    if (!okEmail) { form.email.focus(); return; }
    if (!okConsent) { form.consent.focus(); return; }
    const btn = form.querySelector('button[type="submit"]');
    btn.setAttribute('aria-busy', 'true');
    try {
      await submitLead('dossier_download', { email: form.email.value.trim(), company: form.company.value.trim() });
      const a = document.createElement('a'); a.href = DOSSIER_URL; a.download = 'Volea-Club-Dossier-Empresas.pdf'; a.click();
      await swap(form.parentElement, () => { form.hidden = true; success.hidden = false; });
      success.focus();
    } finally { btn.removeAttribute('aria-busy'); }
  });
}

/* ---------- B2B CTAs ---------- */
function initCtas() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-b2b-cta]');
    if (!a) return;
    e.preventDefault();
    scrollToEl($('#empresas'));
  });
}

export function initB2B() {
  const quote = initQuoteForm();
  initQuickB2B(quote);
  initDossier();
  initCtas();
}
