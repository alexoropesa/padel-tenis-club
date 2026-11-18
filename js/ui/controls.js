/* ==========================================================================
   Small UI controls: segmented, carousel, accordion, toast.
   ========================================================================== */
import { animate } from '../motion/micro.js';

/* ---- Segmented control (radiogroup or tablist) ---- */
export function segmented(root, onChange) {
  const pill = root.querySelector('.segmented__pill');
  const opts = [...root.querySelectorAll('.segmented__opt')];
  const attr = opts[0].getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-checked';
  const place = (opt, instant) => {
    if (!pill) return;
    const r = root.getBoundingClientRect(), o = opt.getBoundingClientRect();
    animate(pill, { x: o.left - r.left - 4, width: o.width }, { duration: instant ? 0 : 0.32 });
  };
  const select = (opt, { silent = false, instant = false } = {}) => {
    opts.forEach((o) => { o.setAttribute(attr, String(o === opt)); o.tabIndex = o === opt ? 0 : -1; });
    place(opt, instant);
    if (!silent && onChange) onChange(opt.dataset.value);
  };
  opts.forEach((o) => o.addEventListener('click', () => select(o)));
  root.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const i = opts.findIndex((o) => o.getAttribute(attr) === 'true');
    const next = opts[(i + (e.key === 'ArrowRight' ? 1 : -1) + opts.length) % opts.length];
    select(next); next.focus();
  });
  const init = () => place(opts.find((o) => o.getAttribute(attr) === 'true') || opts[0], true);
  requestAnimationFrame(init);
  new ResizeObserver(init).observe(root);
  return {
    set(value, silent = true) { const o = opts.find((x) => x.dataset.value === value); if (o) select(o, { silent }); },
    get value() { return (opts.find((o) => o.getAttribute(attr) === 'true') || opts[0]).dataset.value; },
  };
}

/* ---- Carousel with 01 / 05 counter ---- */
export function carousel(name) {
  const root = document.querySelector(`[data-carousel="${name}"]`);
  const nav = document.querySelector(`[data-carousel-nav="${name}"]`);
  if (!root || !nav) return;
  const track = root.querySelector('[data-carousel-track]');
  const items = [...track.children];
  const idxEl = nav.querySelector('[data-carousel-index]');
  const prev = nav.querySelector('[data-carousel-prev]');
  const next = nav.querySelector('[data-carousel-next]');
  nav.querySelector('[data-carousel-total]').textContent = String(items.length).padStart(2, '0');
  const step = () => items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
  const current = () => Math.round(track.scrollLeft / step());
  const update = () => {
    const i = Math.min(items.length - 1, current());
    idxEl.textContent = String(i + 1).padStart(2, '0');
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ---- Accordion (single open) ---- */
export function accordion(root) {
  const items = [...root.querySelectorAll('.acc-item')];
  const setOpen = async (item, open) => {
    const btn = item.querySelector('.acc-item__q');
    const panel = item.querySelector('.acc-item__a');
    item.dataset.open = String(open);
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      panel.hidden = false;
      const h = panel.firstElementChild.offsetHeight;
      await animate(panel, { height: [0, h], opacity: [0, 1] }, { duration: 0.32 });
      panel.style.height = 'auto';
    } else {
      const h = panel.offsetHeight;
      await animate(panel, { height: [h, 0], opacity: [1, 0] }, { duration: 0.26 });
      panel.hidden = true;
    }
  };
  items.forEach((item) => {
    const panel = item.querySelector('.acc-item__a');
    if (item.dataset.open === 'true') panel.style.height = 'auto';
    item.querySelector('.acc-item__q').addEventListener('click', () => {
      const willOpen = item.dataset.open !== 'true';
      items.forEach((o) => { if (o !== item && o.dataset.open === 'true') setOpen(o, false); });
      setOpen(item, willOpen);
    });
  });
}

/* ---- Toast ---- */
export function toast(message, { icon = 'i-check', duration = 4000 } = {}) {
  const region = document.querySelector('[data-toasts]');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<svg class="icon icon--sm" aria-hidden="true"><use href="#${icon}"/></svg><span></span>`;
  el.querySelector('span').textContent = message;
  region.appendChild(el);
  animate(el, { opacity: [0, 1], y: [16, 0] }, { duration: 0.3 });
  setTimeout(async () => { await animate(el, { opacity: 0, y: 8 }, { duration: 0.2 }); el.remove(); }, duration);
}
