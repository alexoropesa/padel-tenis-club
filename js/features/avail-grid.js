/* ==========================================================================
   Availability grid component (cuadrante). Reused inline (#reservar)
   and inside the booking modal. Pure render + events, no styles.
   ========================================================================== */
import { getGrid, nextDays, dayShort, euro, SPORTS, subscribe } from '../services/availability.js';

export function createAvailability(container, { sport = 'padel', date, targetTime = null, onSelect } = {}) {
  const state = { sport, date: date || nextDays(1)[0], targetTime, selected: null };
  container.classList.add('avail');
  container.innerHTML = `
    <div class="avail__toolbar">
      <div class="datestrip" role="tablist" aria-label="Fecha" data-datestrip></div>
      <div class="avail__legend" aria-hidden="true"><span><i class="lg-free"></i>Libre</span><span><i class="lg-busy"></i>Ocupada</span><span><i class="lg-sel"></i>Tu selección</span><span><i class="lg-last"></i>Última pista</span></div>
    </div>
    <div class="grid-avail-wrap" data-gridwrap></div>`;
  const strip = container.querySelector('[data-datestrip]');
  const wrap = container.querySelector('[data-gridwrap]');

  function renderDates() {
    const days = nextDays(7);
    if (!days.includes(state.date)) state.date = days[0];
    strip.innerHTML = days.map((iso) => {
      const d = Number(iso.slice(8));
      const sel = iso === state.date;
      return `<button type="button" role="tab" class="datestrip__day" aria-selected="${sel}" tabindex="${sel ? 0 : -1}" data-date="${iso}" aria-label="${iso}"><span>${dayShort(iso)}</span><span>${d}</span></button>`;
    }).join('');
  }

  function renderGrid() {
    const g = getGrid(state.sport, state.date);
    const freeTotal = g.rows.reduce((n, r) => n + r.cells.filter((c) => c.available).length, 0);
    if (!freeTotal) {
      wrap.innerHTML = `<div class="bk-empty"><p class="t-h4">No quedan pistas libres este día.</p><p class="t-small">Prueba otra fecha o cambia de deporte.</p></div>`;
      return;
    }
    const head = `<div class="grid-avail__corner" aria-hidden="true"></div>` + g.courts.map((c) => `<div class="grid-avail__court" role="columnheader"><b>${c.name}</b><small>${c.tag}</small></div>`).join('');
    const body = g.rows.map((r) => {
      const time = `<div class="grid-avail__time" role="rowheader">${r.time}</div>`;
      const cells = r.cells.map((c) => {
        const sel = state.selected && state.selected.court.id === c.court.id && state.selected.time === r.time;
        const label = `${SPORTS[state.sport].label}, ${c.court.name}, ${r.time}, ${c.available ? euro(r.price) : 'ocupada'}`;
        const cls = ['slot', r.last && c.available ? 'is-last' : '', state.targetTime === r.time ? 'is-target' : ''].join(' ');
        return `<button type="button" class="${cls}" ${c.available ? '' : 'disabled'} aria-pressed="${!!sel}" aria-label="${label}" data-court="${c.court.id}" data-time="${r.time}" data-price="${r.price}"><small>${c.available ? euro(r.price) : ''}</small></button>`;
      }).join('');
      return time + cells;
    }).join('');
    wrap.innerHTML = `<div class="grid-avail" role="grid" style="--cols:${g.courts.length}" aria-label="Disponibilidad ${SPORTS[state.sport].label}">${head}${body}</div>`;
    if (state.targetTime) {
      const t = wrap.querySelector(`.slot.is-target`);
      if (t) {
        const top = t.offsetTop - 60;
        wrap.scrollTop = top;
        // scroll the closest vertical scroller (modal body) to the target row
        const body = container.closest('.panel__body');
        if (body) requestAnimationFrame(() => { body.scrollTop = Math.max(0, t.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 140); });
      }
    }
  }

  strip.addEventListener('click', (e) => {
    const b = e.target.closest('[data-date]'); if (!b) return;
    state.date = b.dataset.date; state.selected = null; state.targetTime = null;
    renderDates(); renderGrid();
    strip.querySelector('[aria-selected="true"]').focus({ preventScroll: true });
  });
  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('.slot'); if (!b || b.disabled) return;
    const court = SPORTS[state.sport].courts.find((c) => c.id === b.dataset.court);
    state.selected = { sport: state.sport, date: state.date, court, time: b.dataset.time, price: Number(b.dataset.price), duration: SPORTS[state.sport].duration };
    wrap.querySelectorAll('.slot[aria-pressed="true"]').forEach((s) => s.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    onSelect && onSelect(state.selected);
  });

  const unsub = subscribe((evt) => {
    if (evt.type === 'clock' || (evt.sport === state.sport && evt.date === state.date)) {
      const scroll = [wrap.scrollLeft, wrap.scrollTop];
      const prevTarget = state.targetTime; state.targetTime = null;
      renderGrid();
      state.targetTime = prevTarget;
      [wrap.scrollLeft, wrap.scrollTop] = scroll;
    }
  });

  renderDates(); renderGrid();
  return {
    state,
    set(patch) { Object.assign(state, patch); renderDates(); renderGrid(); },
    destroy() { unsub(); },
  };
}
