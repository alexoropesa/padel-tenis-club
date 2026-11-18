/* ==========================================================================
   Motion (motion.dev) layer: microinteractions, component entrances,
   state-driven transitions. Owns: overlay panels, step panes, segmented pill,
   accordion height, toasts, press scale on controls, widget entrance.
   GSAP never touches these elements (see Design.md §8).
   ========================================================================== */

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isMobile = () => window.matchMedia('(max-width: 809.98px)').matches;
export const EASE_OUT = [0.22, 1, 0.36, 1];

/** Promise-returning animate with graceful fallback when Motion isn't loaded. */
export function animate(el, keyframes, opts = {}) {
  if (!el) return Promise.resolve();
  const M = window.Motion;
  const options = { duration: 0.28, ease: EASE_OUT, ...opts };
  if (reduced()) options.duration = 0.001;
  if (!M || !M.animate) {
    // fallback: jump to final values
    const last = (v) => (Array.isArray(v) ? v[v.length - 1] : v);
    const t = [];
    for (const [k, v] of Object.entries(keyframes)) {
      const val = last(v);
      if (k === 'x') t.push(`translateX(${typeof val === 'number' ? val + 'px' : val})`);
      else if (k === 'y') t.push(`translateY(${typeof val === 'number' ? val + 'px' : val})`);
      else if (k === 'scale') t.push(`scale(${val})`);
      else el.style[k] = typeof val === 'number' && k !== 'opacity' ? val + 'px' : val;
    }
    if (t.length) el.style.transform = t.join(' ');
    return Promise.resolve();
  }
  const ctrl = M.animate(el, keyframes, options);
  return ctrl && ctrl.finished ? ctrl.finished : Promise.resolve(ctrl);
}

/** Press feedback (scale) for tappable controls. */
export function initPress(root = document) {
  const SEL = '.btn, .slot:not([disabled]), .datestrip__day, .choice__box, .tabbar__item, .panel__close, .segmented__opt';
  root.addEventListener('pointerdown', (e) => {
    const el = e.target.closest(SEL);
    if (!el || el.disabled) return;
    const target = el.classList.contains('segmented__opt') ? el : el;
    animate(target, { scale: 0.97 }, { duration: 0.12 });
    const up = () => {
      animate(target, { scale: 1 }, { duration: 0.22 });
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, { passive: true });
}

/** Entrance for components above the fold (not scroll-driven). */
export function enter(el, { delay = 0, y = 24 } = {}) {
  if (!el) return;
  return animate(el, { opacity: [0, 1], y: [y, 0] }, { duration: 0.7, delay });
}

/** Number tick for live values. */
export function bump(el, value) {
  if (!el) return;
  if (el.textContent === String(value)) return;
  animate(el, { opacity: [1, 0], y: [0, -6] }, { duration: 0.14 }).then(() => {
    el.textContent = value;
    animate(el, { opacity: [0, 1], y: [6, 0] }, { duration: 0.22 });
  });
}

/** Swap content of a container with a directional slide. */
export async function swap(container, render, dir = 1) {
  await animate(container, { opacity: [1, 0], x: [0, -16 * dir] }, { duration: 0.16 });
  render();
  await animate(container, { opacity: [0, 1], x: [16 * dir, 0] }, { duration: 0.26 });
}
