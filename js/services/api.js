/* ==========================================================================
   API adapters: payments (Stripe / wallets / Bizum), CRM leads, notifications.
   With no endpoint configured, every call runs in DEMO mode (simulated latency,
   payload logged to the console). Configure via window.VOLEA_CONFIG before
   main.js loads, or edit DEFAULTS.
   ========================================================================== */

const DEFAULTS = {
  crmEndpoint: null, // e.g. 'https://api.yourcrm.com/v1/leads' (HubSpot / Pipedrive webhook)
  bookingEndpoint: null, // e.g. 'https://api.booking-software.com/v1/reservations'
  paymentIntentEndpoint: null, // your server: creates Stripe PaymentIntent / Bizum (Redsys) order
  stripePublishableKey: null,
  whatsappNumber: '34600000000',
};
export const CONFIG = Object.assign({}, DEFAULTS, window.VOLEA_CONFIG || {});
export const DEMO = !CONFIG.crmEndpoint && !CONFIG.bookingEndpoint;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now().toString(36).slice(-3).toUpperCase()}`;

function attribution() {
  const p = new URLSearchParams(location.search);
  const utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach((k) => {
    if (p.get(k)) utm[k] = p.get(k);
  });
  return { ...utm, referrer: document.referrer || null, landing: location.pathname, ts: new Date().toISOString() };
}

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** CRM: B2B quote, dossier lead magnet, membership, enrollment. */
export async function submitLead(type, data) {
  const payload = { type, data, attribution: attribution() };
  if (CONFIG.crmEndpoint) return post(CONFIG.crmEndpoint, payload);
  console.info('[DEMO] CRM lead', payload);
  await wait(900);
  return { ok: true, id: rid('VB') };
}

/** Payment: returns { ok, paymentId } or throws. */
export async function pay({ amount, method, customer, description }) {
  if (CONFIG.paymentIntentEndpoint) {
    // Real flow: create intent server-side, then confirm with Stripe.js / Payment Request API / Bizum redirect.
    return post(CONFIG.paymentIntentEndpoint, { amount: Math.round(amount * 100), currency: 'eur', method, customer, description });
  }
  console.info('[DEMO] payment', { amount, method, customer, description });
  await wait(1200);
  return { ok: true, paymentId: rid('PAY') };
}

/** Reservation + confirmations (email/WhatsApp) handled server-side. */
export async function createReservation(reservation) {
  if (CONFIG.bookingEndpoint) return post(CONFIG.bookingEndpoint, reservation);
  console.info('[DEMO] reservation', reservation);
  await wait(300);
  return { ok: true, code: rid('VC'), notified: ['email', 'whatsapp'] };
}

/* ---------- validation shared by forms ---------- */
const FREE_DOMAINS = ['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'live.com', 'yahoo.com', 'yahoo.es', 'icloud.com', 'me.com', 'aol.com', 'gmx.com', 'gmx.es', 'proton.me', 'protonmail.com', 'msn.com'];
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isCorporateEmail = (v) => isEmail(v) && !FREE_DOMAINS.includes(v.trim().split('@')[1].toLowerCase());
export const isPhone = (v) => v.replace(/[^\d]/g, '').length >= 9;
