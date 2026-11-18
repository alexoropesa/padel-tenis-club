/* ==========================================================================
   Availability service.
   Deterministic demo inventory (seeded by date/court/slot) + a live layer
   that simulates other people booking/cancelling. Replace `isBusy` and
   `subscribe` with your booking software's API/WebSocket when integrating.
   ========================================================================== */

export const CLUB = {
  name: 'Volea Club',
  address: 'Av. de la Volea 12, 03016 Alicante',
  coords: { lat: 38.3606, lng: -0.4467 },
  tz: 'Europe/Madrid',
};

export const SPORTS = {
  padel: {
    label: 'Pádel',
    duration: 90,
    times: ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00', '21:30'],
    courts: [
      { id: 'P1', name: 'Pista 1', tag: 'Panorámica' },
      { id: 'P2', name: 'Pista 2', tag: 'Panorámica' },
      { id: 'P3', name: 'Pista 3', tag: 'Indoor' },
      { id: 'P4', name: 'Pista 4', tag: 'Indoor' },
      { id: 'P5', name: 'Pista 5', tag: 'Exterior' },
      { id: 'P6', name: 'Pista 6', tag: 'Exterior' },
      { id: 'P7', name: 'Pista 7', tag: 'Exterior' },
      { id: 'P8', name: 'Pista 8', tag: 'Exterior' },
    ],
    price: { off: 24, peak: 32 },
  },
  tenis: {
    label: 'Tenis',
    duration: 60,
    times: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
    courts: [
      { id: 'T1', name: 'Pista 1', tag: 'Tierra batida' },
      { id: 'T2', name: 'Pista 2', tag: 'Tierra batida' },
      { id: 'T3', name: 'Pista 3', tag: 'Tierra batida' },
      { id: 'T4', name: 'Pista 4', tag: 'Tierra batida' },
    ],
    price: { off: 14, peak: 18 },
  },
};

/* ---------- date helpers ---------- */
export const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
export const minutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const addMinutes = (hhmm, add) => { const t = minutes(hhmm) + add; return `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`; };
const nowMinutes = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
export const isToday = (iso) => iso === toISO(new Date());

const fmtDay = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
const fmtLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
export const dayShort = (iso) => fmtDay.format(fromISO(iso)).replace('.', '');
export const dayLong = (iso) => {
  if (isToday(iso)) return 'Hoy, ' + fmtLong.format(fromISO(iso)).split(', ')[1];
  const t = new Date(); t.setDate(t.getDate() + 1);
  if (iso === toISO(t)) return 'Mañana, ' + fmtLong.format(fromISO(iso)).split(', ')[1];
  const s = fmtLong.format(fromISO(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const euro = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);

/** Next n bookable days (skips today when no slot is left). */
export function nextDays(n = 7) {
  const out = [];
  const d = new Date();
  if (!hasFutureSlotsToday()) d.setDate(d.getDate() + 1);
  for (let i = 0; i < n; i++) { out.push(toISO(d)); d.setDate(d.getDate() + 1); }
  return out;
}
function hasFutureSlotsToday() {
  const now = nowMinutes();
  return Object.values(SPORTS).some((s) => s.times.some((t) => minutes(t) > now + 10));
}

/* ---------- deterministic occupancy ---------- */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}
const liveBooked = new Set();
const liveFreed = new Set();
const key = (sport, date, court, time) => `${sport}|${date}|${court}|${time}`;

export function isPeak(date, time) {
  const day = fromISO(date).getDay();
  const weekend = day === 0 || day === 6;
  const m = minutes(time);
  return weekend ? m < 14 * 60 : m >= 17 * 60;
}
export function priceFor(sport, date, time) {
  const p = SPORTS[sport].price;
  return isPeak(date, time) ? p.peak : p.off;
}
export function isPast(date, time) {
  return isToday(date) && minutes(time) <= nowMinutes() + 10;
}
export function isBusy(sport, date, court, time) {
  const k = key(sport, date, court, time);
  if (liveBooked.has(k)) return true;
  if (liveFreed.has(k)) return false;
  const base = isPeak(date, time) ? 0.72 : 0.38;
  const dayOffset = (fromISO(date) - fromISO(toISO(new Date()))) / 864e5;
  const decay = Math.max(0, 0.22 - dayOffset * 0.04); // closer dates are fuller
  return hash(k) < base + decay;
}

/** Full grid model for a sport/date. */
export function getGrid(sport, date) {
  const s = SPORTS[sport];
  const rows = s.times.map((time) => {
    const cells = s.courts.map((c) => {
      const busy = isBusy(sport, date, c.id, time);
      const past = isPast(date, time);
      return { court: c, time, available: !busy && !past, past };
    });
    const free = cells.filter((c) => c.available).length;
    return { time, price: priceFor(sport, date, time), cells, last: free === 1 };
  });
  return { sport, date, duration: s.duration, courts: s.courts, rows };
}

export function countFreeToday() {
  const date = toISO(new Date());
  let n = 0;
  for (const sport of Object.keys(SPORTS)) {
    for (const row of getGrid(sport, date).rows) n += row.cells.filter((c) => c.available).length;
  }
  return n;
}

/* ---------- live layer (simulated) ---------- */
const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const emit = (evt) => listeners.forEach((fn) => fn(evt));

export function markBooked(sport, date, court, time) {
  liveBooked.add(key(sport, date, court, time));
  emit({ type: 'booked', sport, date, court, time });
}

let timer;
export function startLiveSimulation() {
  if (timer) return;
  const tick = () => {
    const date = toISO(new Date());
    const sport = Math.random() < 0.7 ? 'padel' : 'tenis';
    const grid = getGrid(sport, date);
    const free = grid.rows.flatMap((r) => r.cells.filter((c) => c.available));
    if (Math.random() < 0.8 && free.length) {
      const c = free[Math.floor(Math.random() * free.length)];
      markBooked(sport, date, c.court.id, c.time);
    } else {
      const busy = grid.rows.flatMap((r) => r.cells.filter((c) => !c.available && !c.past));
      if (busy.length) {
        const c = busy[Math.floor(Math.random() * busy.length)];
        const k = key(sport, date, c.court.id, c.time);
        liveBooked.delete(k); liveFreed.add(k);
        emit({ type: 'freed', sport, date, court: c.court.id, time: c.time });
      }
    }
    timer = setTimeout(tick, 18000 + Math.random() * 22000);
  };
  timer = setTimeout(tick, 12000);
  // refresh past slots each minute
  setInterval(() => emit({ type: 'clock' }), 60000);
}
