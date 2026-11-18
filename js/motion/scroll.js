/* ==========================================================================
   GSAP + ScrollTrigger layer: hero sequence, scroll reveals,
   counters, parallax, marquees, progress lines, nav state.
   Owns only: [data-hero-line], [data-reveal]/[data-reveal-item],
   [data-count], .meter__fill, [data-parallax], [data-breath-img], .hero__img,
   .cta__img, marquee tracks, .step (--fill). Motion never touches these.
   Scroller: window on ≥810px, #app-scroll on mobile (internal scroll shell).
   ========================================================================== */

const fmtInt = new Intl.NumberFormat('es-ES');

function counter(el, scroller) {
  const end = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.decimals || '0', 10);
  const suffix = el.dataset.suffix || '';
  const write = (v) => {
    el.textContent = (dec ? v.toFixed(dec).replace('.', ',') : fmtInt.format(Math.round(v))) + suffix;
  };
  write(0);
  const obj = { v: 0 };
  gsap.to(obj, {
    v: end, duration: 1.6, ease: 'power3.out', onUpdate: () => write(obj.v),
    scrollTrigger: { trigger: el, scroller, start: 'top 90%', once: true },
  });
}

function marquee(row, { speed = 40, scroller, reverse = false }) {
  const track = row.firstElementChild;
  if (!row.dataset.cloned) {
    row.appendChild(track.cloneNode(true)).setAttribute('aria-hidden', 'true');
    row.dataset.cloned = '1';
  }
  const tracks = [...row.children];
  const tween = gsap.fromTo(tracks, { xPercent: reverse ? -100 : 0 }, { xPercent: reverse ? 0 : -100, ease: 'none', duration: speed, repeat: -1 });
  // scroll-velocity coupling: speeds up and follows scroll direction
  ScrollTrigger.create({
    trigger: row, scroller, start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = self.getVelocity() / 300;
      const ts = gsap.utils.clamp(-6, 6, (self.direction === -1 ? -1 : 1) * (1 + Math.abs(v)));
      gsap.to(tween, { timeScale: ts, duration: 0.2, overwrite: true });
      gsap.to(tween, { timeScale: self.direction === -1 ? -1 : 1, duration: 1.2, delay: 0.2, overwrite: false });
    },
  });
  return tween;
}

function heroSequence() {
  const lines = document.querySelectorAll('.hero__line > [data-hero-line]');
  const rest = document.querySelectorAll('.hero__eyebrow, .hero__sub');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(lines, { yPercent: 105, duration: 1.1, stagger: 0.08 }, 0)
    .from(rest, { opacity: 0, y: 12, duration: 0.8, stagger: 0.1 }, 0.25)
    .from('.hero__img', { scale: 1.08, duration: 1.8, ease: 'power2.out' }, 0);
}

function build(scroller, isDesktop) {
  // Generic reveals
  document.querySelectorAll('[data-reveal]').forEach((block) => {
    const items = block.querySelectorAll(':scope [data-reveal-item]');
    const targets = items.length ? items : [block];
    gsap.from(targets, {
      opacity: 0, y: 28, duration: 0.9, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: block, scroller, start: 'top 85%', once: true },
    });
  });

  // Counters + meter
  document.querySelectorAll('[data-count]').forEach((el) => counter(el, scroller));
  document.querySelectorAll('[data-meter]').forEach((el) => {
    gsap.to(el, { scaleX: parseFloat(el.dataset.meter), duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: el, scroller, start: 'top 90%', once: true } });
  });

  // Steps progress line
  const steps = document.querySelectorAll('[data-steps] .step');
  steps.forEach((s, i) => {
    gsap.fromTo(s, { '--fill': '0%' }, {
      '--fill': '100%', ease: 'none',
      scrollTrigger: { trigger: '[data-steps]', scroller, start: `top+=${i * 20} 80%`, end: `top+=${i * 20} 45%`, scrub: true },
    });
  });

  // Breathing A: cinematic scale + drift
  const breath = document.querySelector('[data-breath-img]');
  if (breath) {
    gsap.fromTo(breath, { scale: 1.18, yPercent: -6 }, {
      scale: 1, yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '.breath-a', scroller, start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.from('.breath-a__caption', { opacity: 0, y: 12, duration: 1, scrollTrigger: { trigger: '.breath-a', scroller, start: 'center 70%', once: true } });
  }

  // Closing CTA image
  gsap.fromTo('.cta__img', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.cta', scroller, start: 'top bottom', end: 'bottom bottom', scrub: true } });

  // Marquees
  const m = document.querySelector('[data-marquee]');
  if (m) marquee(m, { speed: 28, scroller });
  const logos = document.querySelector('[data-logos]');
  if (logos) marquee(logos, { speed: 36, scroller, reverse: true });

  if (isDesktop) {
    // Parallax on club collage + hero image drift
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      gsap.to(el, { yPercent: parseFloat(el.dataset.parallax), ease: 'none', scrollTrigger: { trigger: el.closest('section'), scroller, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.to('.hero__media', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', scroller, start: 'top top', end: 'bottom top', scrub: true } });

    // Topbar solid state
    const bar = document.querySelector('[data-topbar]');
    ScrollTrigger.create({ trigger: '.hero', scroller, start: 'top+=40 top', end: 'max', toggleClass: { targets: bar, className: 'is-solid' } });
  }

  // Active section → topbar links (desktop) / tab bar (mobile)
  const map = [
    ['#inicio', 'inicio'], ['#club', 'inicio'], ['#servicios', 'reservar'], ['#reservar', 'reservar'],
    ['#escuela', 'planes'], ['#planes', 'planes'], ['#empresas', 'empresas'], ['#presupuesto', 'empresas'], ['#faq', 'empresas'],
  ];
  map.forEach(([sel, tab]) => {
    const sec = document.querySelector(sel); if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, scroller, start: 'top 50%', end: 'bottom 50%',
      onToggle: (self) => {
        if (!self.isActive) return;
        document.querySelectorAll('.tabbar__item[data-tab]').forEach((t) => { if (t.dataset.tab === tab) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); });
        document.querySelectorAll('[data-nav]').forEach((a) => { if (a.getAttribute('href') === sel) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      },
    });
  });
}

export function initScroll() {
  if (!window.gsap || !window.ScrollTrigger) {
    // No GSAP: make sure everything is visible and static.
    document.querySelectorAll('.meter__fill').forEach((el) => (el.style.transform = `scaleX(${el.dataset.meter})`));
    document.querySelectorAll('[data-count]').forEach((el) => {
      const dec = parseInt(el.dataset.decimals || '0', 10); const v = parseFloat(el.dataset.count);
      el.textContent = (dec ? v.toFixed(dec).replace('.', ',') : fmtInt.format(v)) + (el.dataset.suffix || '');
    });
    document.querySelector('.topbar')?.classList.add('is-solid');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    document.querySelectorAll('.meter__fill').forEach((el) => (el.style.transform = `scaleX(${el.dataset.meter})`));
    document.querySelectorAll('[data-count]').forEach((el) => {
      const dec = parseInt(el.dataset.decimals || '0', 10); const v = parseFloat(el.dataset.count);
      el.textContent = (dec ? v.toFixed(dec).replace('.', ',') : fmtInt.format(v)) + (el.dataset.suffix || '');
    });
    const bar = document.querySelector('[data-topbar]');
    ScrollTrigger.create({ trigger: '.hero', start: 'top+=40 top', end: 'max', toggleClass: { targets: bar, className: 'is-solid' } });
    return;
  }

  heroSequence();
  const mm = gsap.matchMedia();
  mm.add('(max-width: 809.98px)', () => build(document.getElementById('app-scroll'), false));
  mm.add('(min-width: 810px)', () => build(window, true));
  // Refresh after fonts/images settle
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
