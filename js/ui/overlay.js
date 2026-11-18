/* ==========================================================================
   Overlay manager: centered modal / right drawer on desktop,
   bottom sheet with swipe-to-close on mobile (<810px).
   ========================================================================== */
import { animate, isMobile } from '../motion/micro.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const stack = [];
const hooks = new Map();

const shell = () => [document.getElementById('app-scroll'), document.querySelector('.topbar'), document.querySelector('.m-header'), document.querySelector('.tabbar')].filter(Boolean);

function lock(on) {
  shell().forEach((el) => { el.inert = on; if (on) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
  const scroller = document.getElementById('app-scroll');
  if (isMobile()) scroller.style.overflowY = on ? 'hidden' : '';
  else document.documentElement.style.overflow = on ? 'hidden' : '';
}

export function onClose(id, fn) { if (!hooks.has(id)) hooks.set(id, []); hooks.get(id).push(fn); }

export async function open(id) {
  const ov = document.getElementById(id);
  if (!ov || !ov.hidden) return;
  const panel = ov.querySelector('[data-panel]');
  const scrim = ov.querySelector('.overlay__scrim');
  ov._return = document.activeElement;
  ov.hidden = false;
  stack.push(id);
  lock(true);
  const drawer = ov.classList.contains('overlay--drawer');
  animate(scrim, { opacity: [0, 1] }, { duration: 0.24 });
  const from = isMobile() ? { y: ['100%', '0%'] } : drawer ? { x: ['100%', '0%'] } : { opacity: [0, 1], y: [16, 0], scale: [0.98, 1] };
  const first = panel.querySelector('[data-autofocus]') || panel.querySelector('.panel__close');
  requestAnimationFrame(() => first && first.focus({ preventScroll: true }));
  await animate(panel, from, { duration: isMobile() ? 0.42 : 0.34 });
}

export async function close(id) {
  const ov = document.getElementById(id || stack[stack.length - 1]);
  if (!ov || ov.hidden) return;
  const panel = ov.querySelector('[data-panel]');
  const scrim = ov.querySelector('.overlay__scrim');
  const drawer = ov.classList.contains('overlay--drawer');
  const to = isMobile() ? { y: '100%' } : drawer ? { x: '100%' } : { opacity: 0, y: 12, scale: 0.98 };
  animate(scrim, { opacity: 0 }, { duration: 0.22 });
  await animate(panel, to, { duration: 0.26 });
  ov.hidden = true;
  stack.splice(stack.indexOf(ov.id), 1);
  if (!stack.length) lock(false);
  (hooks.get(ov.id) || []).forEach((fn) => fn());
  if (ov._return && document.contains(ov._return)) ov._return.focus({ preventScroll: true });
}

function trap(e) {
  if (!stack.length) return;
  const ov = document.getElementById(stack[stack.length - 1]);
  if (e.key === 'Escape') { e.preventDefault(); close(ov.id); return; }
  if (e.key !== 'Tab') return;
  const items = [...ov.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/** Swipe-down to dismiss on mobile sheets (grabber + header area). */
function swipe(ov) {
  const panel = ov.querySelector('[data-panel]');
  const handle = [ov.querySelector('.panel__grabber'), ov.querySelector('.panel__head')].filter(Boolean);
  let startY = 0, dy = 0, t0 = 0, dragging = false;
  const down = (e) => {
    if (!isMobile() || e.target.closest('button, a, input, select')) return;
    dragging = true; startY = e.clientY; dy = 0; t0 = performance.now();
    panel.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!dragging) return;
    dy = Math.max(0, e.clientY - startY);
    animate(panel, { y: dy }, { duration: 0 });
  };
  const up = () => {
    if (!dragging) return;
    dragging = false;
    const v = dy / Math.max(1, performance.now() - t0);
    if (dy > 120 || v > 0.5) close(ov.id);
    else animate(panel, { y: 0 }, { duration: 0.3 });
  };
  handle.forEach((h) => h.addEventListener('pointerdown', down));
  panel.addEventListener('pointermove', move);
  panel.addEventListener('pointerup', up);
  panel.addEventListener('pointercancel', up);
}

export function initOverlays() {
  document.querySelectorAll('[data-overlay]').forEach((ov) => {
    ov.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(ov.id); });
    swipe(ov);
  });
  document.addEventListener('keydown', trap);
}
