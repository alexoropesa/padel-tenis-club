/* ==========================================================================
   Entry point. Module scripts are deferred and run after the deferred
   GSAP / Motion CDN scripts declared before it in <head>.
   ========================================================================== */
import { initOverlays } from './ui/overlay.js';
import { segmented, carousel, accordion } from './ui/controls.js';
import { initPress, enter } from './motion/micro.js';
import { initScroll } from './motion/scroll.js';
import { initBooking } from './features/booking.js';
import { initB2B } from './features/b2b.js';
import { initLive } from './features/live.js';

function initAudienceSwitch() {
  const root = document.querySelector('[data-segmented="audience"]');
  const panels = document.querySelectorAll('[data-widget-panel]');
  segmented(root, (value) => {
    panels.forEach((p) => {
      const show = p.dataset.widgetPanel === value;
      if (show && p.hidden) { p.hidden = false; enter(p, { y: 8 }); } else if (!show) p.hidden = true;
    });
  });
}

function boot() {
  initOverlays();
  initPress();
  initAudienceSwitch();
  carousel('svc');
  accordion(document.querySelector('[data-accordion]'));
  initLive();
  initBooking();
  initB2B();
  enter(document.querySelector('[data-widget]'), { delay: 0.35, y: 32 });
  initScroll();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
