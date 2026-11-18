/* ==========================================================================
   Live status (RF-01.3): "Pistas disponibles para hoy: X" + geolocation.
   ========================================================================== */
import { countFreeToday, subscribe, startLiveSimulation, CLUB } from '../services/availability.js';
import { bump } from '../motion/micro.js';

function haversineKm(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function initLive() {
  const outs = [...document.querySelectorAll('[data-live-count]')];
  const update = (animated) => {
    const n = countFreeToday();
    outs.forEach((o) => (animated ? bump(o, n) : (o.textContent = n)));
  };
  update(false);
  subscribe(() => update(true));
  startLiveSimulation();

  const geo = document.querySelector('[data-geo]');
  const label = document.querySelector('[data-geo-label]');
  if (!geo) return;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${CLUB.coords.lat},${CLUB.coords.lng}`;
  geo.addEventListener('click', () => {
    if (geo.dataset.done) { window.open(mapsUrl, '_blank', 'noopener'); return; }
    if (!('geolocation' in navigator)) { window.open(mapsUrl, '_blank', 'noopener'); return; }
    label.textContent = 'Calculando distancia…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversineKm({ lat: pos.coords.latitude, lng: pos.coords.longitude }, CLUB.coords);
        const mins = Math.max(3, Math.round((km / 32) * 60)); // ~32 km/h urban average
        const kmTxt = km < 100 ? km.toFixed(1).replace('.', ',') : Math.round(km);
        label.textContent = `Estás a ${kmTxt} km · ~${mins} min en coche · Cómo llegar`;
        geo.dataset.done = '1';
      },
      () => { label.textContent = 'Av. de la Volea 12, Alicante · Abrir en Maps'; geo.dataset.done = '1'; },
      { timeout: 8000, maximumAge: 600000 }
    );
  });
}
