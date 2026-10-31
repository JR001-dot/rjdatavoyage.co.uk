/* RJ Data Voyage - shared behaviour for inner pages: mobile nav, sticky nav border, departures strip */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.querySelector('.nav'), links = document.querySelector('.nav-links'), toggle = document.querySelector('.nav-toggle');
  if (toggle && links) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', function () { var o = links.classList.toggle('open'); toggle.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }); });
  }
  if (nav) { var s = function () { nav.classList.toggle('scrolled', window.scrollY > 8); }; window.addEventListener('scroll', s, { passive: true }); s(); }

  /* departures strip: each field scrambles left to right once, then settles */
  if (reduce) return;
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  document.querySelectorAll('.dep-strip .flap').forEach(function (fl, idx) {
    var t = fl.querySelector('.ft > span'), b = fl.querySelector('.fb > span'), target = t.textContent, n = target.length, frame = 0, frames = n + 6;
    setTimeout(function step() {
      var settled = Math.max(0, frame - 6), out = '';
      for (var i = 0; i < n; i++) { var ch = target[i]; out += (i < settled || /[\s,.\/%\-+&·]/.test(ch)) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
      t.textContent = out; b.textContent = out;
      if (frame++ < frames) setTimeout(step, 42);
    }, 250 + idx * 180);
  });
})();

/* split-flap figure captions: scramble once when the figure comes into view, then settle */
(function () {
  if (window.__figFlaps) return; window.__figFlaps = 1;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var G = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function run(head) {
    head.querySelectorAll('.flap').forEach(function (fl, idx) {
      var t = fl.querySelector('.ft > span'), b = fl.querySelector('.fb > span'), target = fl.getAttribute('data-t') || t.textContent, n = target.length, frame = 0;
      fl.setAttribute('data-t', target);
      setTimeout(function step() {
        var settled = Math.max(0, frame - 6), out = '';
        for (var i = 0; i < n; i++) { var ch = target[i]; out += (i < settled || /[\s,.\/%\-+&·()]/.test(ch)) ? ch : G[(Math.random() * G.length) | 0]; }
        t.textContent = out; b.textContent = out;
        if (frame++ < n + 6) setTimeout(step, 38);
      }, 120 + idx * 160);
    });
  }
  var heads = document.querySelectorAll('.fig-head.flaps');
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } }); }, { threshold: .4 });
  heads.forEach(function (h) { io.observe(h); });
})();

/* open every page at the top when arriving from a link (back/forward still restores the old position) */
(function () {
  if (location.hash) return;
  var nav = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
  if (nav && nav.type !== 'navigate') return;
  var top = function () { window.scrollTo(0, 0); };
  top(); window.addEventListener('load', top, { once: true });
})();
