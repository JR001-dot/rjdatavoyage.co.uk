/* Project thumbnails: one canvas renderer per project, drawn from each case study's published figures.
   Every number shown comes from the project's case study; diagrams show method only, never invented data. Animates only while on screen. */
(function () {
  var C = { bg: '#07080B', grid: '#16181F', dim: '#262935', line: '#353948', mute: '#6E758B', text: '#A9AEC0', white: '#F5F6FA', cob: '#4352FF', cobS: '#8F9BFF', amb: '#FFC23D' };
  var MONO = '"Geist Mono", ui-monospace, Menlo, Consolas, monospace';
  var SANS = 'Geist, "Helvetica Neue", Arial, sans-serif';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function seq(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function gauss(r) { var u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function txt(g, s, x, y, o) {
    o = o || {};
    g.font = (o.weight || 400) + ' ' + (o.size || 10) + 'px ' + (o.font || MONO);
    g.fillStyle = o.color || C.text; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'alphabetic';
    if (o.spacing && 'letterSpacing' in g) g.letterSpacing = o.spacing + 'px';
    g.fillText(s, x, y);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }
  /* caption as a split-flap tile, like the departures board: it scrambles once, then settles left to right */
  var FT = 999, GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function flapText(s, T) {
    var settled = Math.floor((T - .2) / .035) - 6; if (settled >= s.length) return s;
    var tick = Math.floor(T * 24), out = '';
    for (var i = 0; i < s.length; i++) { var ch = s[i]; out += (i < settled || /[\s,.\/%\-+&·()]/.test(ch)) ? ch : GL[((i * 7919 + tick * 104729) >>> 0) % GL.length]; }
    return out;
  }
  function frame(g, w, h, caption, tag) {
    g.fillStyle = C.bg; g.fillRect(0, 0, w, h);
    var size = 9.5, sp = .8, pad = 8, x = 10, y = 7, th = 22, tw;
    do { g.font = '600 ' + size + 'px ' + MONO; if ('letterSpacing' in g) g.letterSpacing = sp + 'px'; tw = g.measureText(caption).width + pad * 2; if ('letterSpacing' in g) g.letterSpacing = '0px'; if (tw <= w - 20) break; size -= .5; } while (size > 7);
    var top = g.createLinearGradient(0, y, 0, y + th / 2); top.addColorStop(0, '#22242E'); top.addColorStop(1, '#1B1D25');
    var bot = g.createLinearGradient(0, y + th / 2, 0, y + th); bot.addColorStop(0, '#17181F'); bot.addColorStop(1, '#121319');
    g.save(); rrect(g, x, y, tw, th, 5); g.clip();
    g.fillStyle = top; g.fillRect(x, y, tw, th / 2); g.fillStyle = bot; g.fillRect(x, y + th / 2, tw, th / 2);
    txt(g, flapText(caption, FT), x + pad, y + th / 2, { size: size, color: '#F5F6FA', weight: 600, spacing: sp, base: 'middle' });
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x, y + th / 2 - .5, tw, 1);
    g.restore(); rrect(g, x + .5, y + .5, tw - 1, th - 1, 5); g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; g.stroke();
  }
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
  function glowDot(g, x, y, r, col, a) {
    g.save(); g.globalAlpha = a == null ? 1 : a; g.shadowColor = col; g.shadowBlur = r * 4;
    g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore();
  }
  function bar(g, x, y, w, h, frac, col, track) {
    rrect(g, x, y, w, h, h / 2); g.fillStyle = track || C.grid; g.fill();
    if (frac > 0) { rrect(g, x, y, Math.max(h, w * frac), h, h / 2); g.fillStyle = col; g.fill(); }
  }

  var V = {};

  /* 1. Manual backpropagation: 2-2-1, input [0.3, 0.4], ReLU hidden, sigmoid output 0.9209, target 1, lr 0.02 */
  V.backprop = {
    period: 7, draw: function (g, w, h, t) {
      frame(g, w, h, '2-2-1 NETWORK · NUMPY ONLY', 'SCHEMATIC');
      var top = 40, bot = h - 34, mid = (top + bot) / 2;
      var I = [[w * .16, lerp(top, bot, .22)], [w * .16, lerp(top, bot, .78)]];
      var H = [[w * .5, lerp(top, bot, .22)], [w * .5, lerp(top, bot, .78)]];
      var O = [w * .82, mid];
      var E1 = [], E2 = [];
      I.forEach(function (a) { H.forEach(function (b) { E1.push([a, b]); }); });
      H.forEach(function (a) { E2.push([a, O]); });
      var fw1 = seq(t, .3, 1.5), fw2 = seq(t, 1.5, 2.6), bw2 = seq(t, 3.4, 4.4), bw1 = seq(t, 4.4, 5.5), upd = seq(t, 5.5, 6.1) * (1 - seq(t, 6.5, 7));
      function edge(e, k, hot, col) {
        g.strokeStyle = hot ? col : C.line; g.lineWidth = hot ? 1.8 : 1.2; g.globalAlpha = 1;
        g.beginPath(); g.moveTo(e[0][0], e[0][1]); g.lineTo(e[1][0], e[1][1]); g.stroke();
      }
      E1.forEach(function (e) { edge(e, 0, (bw1 > 0 && bw1 < 1) || upd > 0, C.amb); });
      E2.forEach(function (e) { edge(e, 0, (bw2 > 0 && bw2 < 1) || upd > 0, C.amb); });
      function pulse(e, p, col) { if (p <= 0 || p >= 1) return; var q = ease(p); glowDot(g, lerp(e[0][0], e[1][0], q), lerp(e[0][1], e[1][1], q), 3.2, col); }
      E1.forEach(function (e) { pulse(e, fw1, C.cob); });
      E2.forEach(function (e) { pulse(e, fw2, C.cob); });
      E2.forEach(function (e) { pulse([e[1], e[0]], bw2, C.amb); });
      E1.forEach(function (e) { pulse([e[1], e[0]], bw1, C.amb); });
      function node(p, r, fill, ring, label, sub) {
        g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fillStyle = fill; g.fill();
        g.lineWidth = 1.5; g.strokeStyle = ring; g.stroke();
        if (label) txt(g, label, p[0], p[1] + 3.5, { size: 10, color: C.white, align: 'center', weight: 600 });
        if (sub) txt(g, sub, p[0], p[1] + r + 13, { size: 8.5, color: C.mute, align: 'center' });
      }
      node(I[0], 14, C.grid, fw1 > 0 && fw1 < 1 ? C.cob : C.line, '0.3', 'x1');
      node(I[1], 14, C.grid, fw1 > 0 && fw1 < 1 ? C.cob : C.line, '0.4', 'x2');
      H.forEach(function (p) { node(p, 14, C.grid, fw1 >= 1 && fw2 < 1 ? C.cob : (bw2 >= 1 && bw1 < 1 ? C.amb : C.line), '', 'ReLU'); });
      var outOn = fw2 >= 1;
      node(O, 18, outOn ? C.cob : C.grid, outOn ? C.cob : C.line, 'σ', '');
      var a = seq(t, 2.6, 3.0) * (1 - seq(t, 6.6, 7));
      g.globalAlpha = a;
      txt(g, '0.9209', O[0], O[1] - 28, { size: 13, color: C.white, align: 'center', weight: 600, font: SANS });
      txt(g, 'TARGET 1', O[0], O[1] + 34, { size: 8.5, color: C.mute, align: 'center' });
      g.globalAlpha = 1;
      var ph = t < 3.2 ? 'FORWARD PASS' : t < 5.5 ? 'BACKWARD PASS · ∂L/∂w' : 'WEIGHT UPDATE · η = 0.02';
      txt(g, ph, 14, h - 12, { size: 9.5, color: t < 3.2 ? C.cobS : C.amb, spacing: 0.6 });
    }
  };

  /* 2. Spam classifier: 57 features -> 64 -> 32 -> sigmoid (94.6% baseline) */
  V.nnarch = {
    period: 4, init: function (s) {
      var r = rng(7); s.p = [];
      for (var i = 0; i < 46; i++) s.p.push({ l: (r() * 3) | 0, a: (r() * 12) | 0, b: (r() * 12) | 0, o: r() });
    },
    draw: function (g, w, h, t, s) {
      frame(g, w, h, 'SPAM CLASSIFIER · 4,601 EMAILS', 'SCHEMATIC');
      var cols = [[w * .12, 12, '57'], [w * .39, 14, '64'], [w * .66, 9, '32'], [w * .88, 1, '1']];
      var top = 36, bot = h - 36;
      var P = cols.map(function (c) { var n = c[1], out = []; for (var i = 0; i < n; i++) out.push([c[0], n === 1 ? (top + bot) / 2 : lerp(top, bot, i / (n - 1))]); return out; });
      g.lineWidth = .6; g.strokeStyle = 'rgba(143,155,255,.10)';
      for (var l = 0; l < 3; l++) P[l].forEach(function (a) { P[l + 1].forEach(function (b) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }); });
      s.p.forEach(function (q) {
        var A = P[q.l][q.a % P[q.l].length], B = P[q.l + 1][q.b % P[q.l + 1].length];
        var f = ((t / 4) * 1.6 + q.o) % 1;
        glowDot(g, lerp(A[0], B[0], f), lerp(A[1], B[1], f), 1.7, C.cob, Math.sin(f * Math.PI));
      });
      P.forEach(function (col, ci) {
        col.forEach(function (p) {
          g.beginPath(); g.arc(p[0], p[1], ci === 3 ? 9 : 3.2, 0, 7);
          g.fillStyle = ci === 3 ? C.cob : C.dim; g.fill();
        });
        txt(g, cols[ci][2], cols[ci][0], h - 14, { size: 10, color: ci === 3 ? C.cobS : C.text, align: 'center', weight: 600 });
      });
      var pulse = (Math.sin(t / 4 * Math.PI * 2) + 1) / 2;
      glowDot(g, P[3][0][0], P[3][0][1], 9, C.cob, .25 + pulse * .5);
      txt(g, 'σ', P[3][0][0], P[3][0][1] + 3.5, { size: 10, color: '#fff', align: 'center', weight: 600 });
    }
  };

  /* 3. Optimisers: identical 64-32 networks, 10 features, 10 epochs; RMSprop 86.0% vs Adam 83.2% on the test set;
        ~3 points is roughly five passengers, so one split cannot separate them */
  V.optim = {
    period: 6, draw: function (g, w, h, t) {
      frame(g, w, h, w < 480 ? '64-32 NETWORK · 10 EPOCHS' : 'SAME 64-32 NETWORK · 10 EPOCHS · TWO OPTIMISERS');
      var top = 46, bot = h - 52, midY = (top + bot) / 2;
      var cols = [[w * .07, 10, '10 FEATURES'], [w * .22, 16, '64'], [w * .37, 10, '32'], [w * .49, 1, 'OUTPUT']];
      var P = cols.map(function (c) { var o = []; for (var i = 0; i < c[1]; i++) o.push([c[0], c[1] === 1 ? midY : lerp(top, bot, i / (c[1] - 1))]); return o; });
      function curve(a, b) { var mx = (a[0] + b[0]) / 2; g.beginPath(); g.moveTo(a[0], a[1]); g.bezierCurveTo(mx, a[1], mx, b[1], b[0], b[1]); }
      function onCurve(a, b, f) { var mx = (a[0] + b[0]) / 2, u = 1 - f;
        return [u*u*u*a[0] + 3*u*u*f*mx + 3*u*f*f*mx + f*f*f*b[0], u*u*u*a[1] + 3*u*u*f*a[1] + 3*u*f*f*b[1] + f*f*f*b[1]]; }
      g.lineWidth = .7;
      for (var l = 0; l < 3; l++) P[l].forEach(function (a, i) { P[l + 1].forEach(function (b, j) {
        g.strokeStyle = 'rgba(143,155,255,' + (l === 2 ? .22 : .07) + ')'; curve(a, b); g.stroke(); }); });
      // signal pulses moving left to right
      for (var k = 0; k < 14; k++) {
        var l2 = k % 3, A = P[l2][(k * 7) % P[l2].length], B = P[l2 + 1][(k * 5) % P[l2 + 1].length];
        var f = ((t / 1.6) + k * .137) % 1, p = onCurve(A, B, ease(f));
        glowDot(g, p[0], p[1], 1.9, C.cobS, Math.sin(f * Math.PI));
      }
      P.forEach(function (c, ci) { c.forEach(function (p) {
        g.beginPath(); g.arc(p[0], p[1], ci === 3 ? 7 : 3, 0, 7); g.fillStyle = ci === 3 ? '#fff' : '#2E3242'; g.fill(); }); });
      cols.forEach(function (c, ci) { txt(g, ci === 0 && w < 480 ? '10 IN' : c[2], ci === 0 ? 14 : c[0], h - 32, { size: 8.5, color: C.mute, align: ci === 0 ? 'left' : 'center', spacing: .4 }); });
      // two branches from the output to the two optimisers
      var O = P[3][0], gx = w * .62, rows = [[C.cob, 'RMSprop', .86, '86.0%', top + (bot - top) * .2], ['#8C93A8', 'Adam', .832, '83.2%', top + (bot - top) * .8]];
      rows.forEach(function (r, i) {
        var T = [gx - 10, r[4]];
        g.lineWidth = 1.6; g.strokeStyle = i ? 'rgba(140,147,168,.45)' : 'rgba(67,82,255,.6)'; curve(O, T); g.stroke();
        var f2 = ((t / 1.6) + i * .5) % 1, q = onCurve(O, T, ease(f2));
        glowDot(g, q[0], q[1], 2.6, r[0], Math.sin(f2 * Math.PI));
        var big = clamp(w * .065, 18, 34), fill = ease(seq(t, .4 + i * .3, 2.4 + i * .3));
        txt(g, r[1].toUpperCase(), gx, r[4] - big * .9, { size: 9, color: i ? C.text : C.cobS, weight: 600, spacing: .8 });
        txt(g, (r[2] * 100 * fill).toFixed(1) + '%', gx, r[4] + big * .32, { size: big, color: C.white, weight: 500, font: SANS });
        var bw = w - 14 - gx;
        rrect(g, gx, r[4] + big * .62, bw, 5, 2.5); g.fillStyle = C.grid; g.fill();
        rrect(g, gx, r[4] + big * .62, bw * r[2] * fill, 5, 2.5); g.fillStyle = r[0]; g.fill();
        if (!i) { g.save(); g.shadowColor = C.cob; g.shadowBlur = 12; rrect(g, gx, r[4] + big * .62, bw * r[2] * fill, 5, 2.5); g.fill(); g.restore(); }
      });
      g.globalAlpha = seq(t, 2.8, 3.3);
      txt(g, w < 480 ? '~3 POINTS ≈ 5 PASSENGERS: TOO CLOSE' : '~3 POINTS ≈ 5 PASSENGERS: TOO CLOSE TO CALL ON ONE SPLIT', 14, h - 12, { size: 8.5, color: C.amb, spacing: .3 });
      g.globalAlpha = 1;
    }
  };

  /* 4. Segmentation: 951,669 order lines -> 68,300 customers; Isolation Forest removed 3,415 (5%);
        largest K-Means cluster 66% (k = 5); silhouette 0.266 (k = 2), 0.255 (k = 5) */
  V.segment = {
    period: 7, draw: function (g, w, h, t) {
      frame(g, w, h, 'CUSTOMER SEGMENTATION PIPELINE');
      var steps = [['951,669', 'ORDER LINES'], ['68,300', 'CUSTOMERS'], ['3,415', 'OUTLIERS OUT']];
      var bw = (w - 28 - 20) / 3;
      steps.forEach(function (s, i) {
        var x = 14 + i * (bw + 10), a = seq(t, .2 + i * .45, .7 + i * .45);
        g.globalAlpha = .25 + .75 * a;
        rrect(g, x, 34, bw, 42, 8); g.fillStyle = i === 2 ? 'rgba(255,194,61,.12)' : C.grid; g.fill();
        txt(g, s[0], x + 10, 54, { size: 13, color: i === 2 ? C.amb : C.white, weight: 600, font: SANS });
        txt(g, s[1], x + 10, 68, { size: 7.5, color: C.mute, spacing: .4 });
        if (i < 2) { g.strokeStyle = C.line; g.beginPath(); g.moveTo(x + bw + 2, 55); g.lineTo(x + bw + 8, 55); g.stroke(); }
        g.globalAlpha = 1;
      });
      var narrow = w < 480;
      var cy = narrow ? 86 + Math.min(30, (h - 190) / 2) + 4 : 86 + (h - 112) / 2, R = narrow ? Math.max(18, Math.min(30, (h - 190) / 2)) : Math.min(34, (h - 112) / 2), cx = 14 + R + 6;
      var p = ease(seq(t, 1.8, 3.4)) * .66;
      g.lineWidth = 11; g.strokeStyle = C.grid; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
      g.strokeStyle = C.cob; g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); g.stroke();
      txt(g, '66%', cx, cy + 4, { size: 12, color: C.white, align: 'center', weight: 600, font: SANS });
      txt(g, 'IN THE LARGEST', cx + R + 16, cy - 6, { size: 8, color: C.mute, spacing: .3 });
      txt(g, 'CLUSTER (K = 5)', cx + R + 16, cy + 6, { size: 8, color: C.mute, spacing: .3 });
      var sx = narrow ? 14 : w * .58, sw = w - 14 - sx, sy = narrow ? cy + R + 30 : cy - 12;
      txt(g, 'SILHOUETTE', sx, sy - 10, { size: 8, color: C.mute, spacing: .4 });
      [['K = 2', .266, '0.266'], ['K = 5', .255, '0.255']].forEach(function (s, i) {
        var y = sy + i * 20;
        txt(g, s[0], sx, y + 7, { size: 8.5, color: C.text });
        bar(g, sx + 38, y, sw - 76, 7, s[1] * ease(seq(t, 2.2 + i * .2, 3.4 + i * .2)), i ? '#8C93A8' : C.cob);
        txt(g, s[2], w - 14, y + 7, { size: 9, color: C.white, align: 'right', weight: 600 });
      });
      g.globalAlpha = seq(t, 3.6, 4); txt(g, 'GROUPS OVERLAP: NOT YET SEGMENTS TO ACT ON', 14, h - 12, { size: 8.5, color: C.amb, spacing: .3 }); g.globalAlpha = 1;
    }
  };

  /* helper: sample with exact Pearson r */
  function corrSample(n, r, seed) {
    var R = rng(seed), x = [], e = [], i;
    for (i = 0; i < n; i++) { x.push(gauss(R)); e.push(gauss(R)); }
    function centre(a) { var m = a.reduce(function (s, v) { return s + v; }, 0) / n; return a.map(function (v) { return v - m; }); }
    function dot(a, b) { var s = 0; for (var i = 0; i < n; i++) s += a[i] * b[i]; return s; }
    x = centre(x); e = centre(e);
    var k = dot(e, x) / dot(x, x); e = e.map(function (v, i) { return v - k * x[i]; });
    var sx = Math.sqrt(dot(x, x)), se = Math.sqrt(dot(e, e));
    x = x.map(function (v) { return v / sx; }); e = e.map(function (v) { return v / se; });
    return x.map(function (v, i) { return [v, r * v + Math.sqrt(1 - r * r) * e[i]]; });
  }

  /* 5. Insurance: Pearson r vs charges, 1,000 records: BMI 0.709 (p < 0.001), age 0.080 (p 0.012), children 0.031 (p 0.332) */
  V.insurance = {
    period: 6, draw: function (g, w, h, t) {
      frame(g, w, h, 'WHAT MOVES INSURANCE CHARGES?');
      var rows = [['BMI', .709, 'r 0.709', 'STRONG · p < 0.001', C.cob], ['AGE', .080, 'r 0.080', 'WEAK · p 0.012', '#8C93A8'], ['CHILDREN', .031, 'r 0.031', 'NOT SIGNIFICANT · p 0.332', C.line]];
      var top = 40, step = (h - 74) / 3, bx = 14, bw = w - 28;
      rows.forEach(function (r, i) {
        var y = top + i * step, a = ease(seq(t, .3 + i * .35, 1.8 + i * .35));
        txt(g, r[0], bx, y + 10, { size: 10, color: i ? C.text : C.white, weight: 600, spacing: .4 });
        txt(g, r[2], w - 14, y + 10, { size: 11, color: i ? C.text : C.cobS, align: 'right', weight: 600 });
        bar(g, bx, y + 17, bw, 9, r[1] * a, r[4]);
        g.globalAlpha = seq(t, 1.4 + i * .35, 1.9 + i * .35);
        txt(g, r[3], bx, y + 40, { size: 8, color: C.mute, spacing: .3 });
        g.globalAlpha = 1;
      });
      txt(g, '1,000 ANONYMISED RECORDS', 14, h - 12, { size: 8.5, color: C.mute, spacing: .3 });
    }
  };

  /* 6. Loyalty: r quality 0.713, negative publicity -0.449, brand awareness 0.18; R² 0.628 */
  V.loyalty = {
    period: 6, draw: function (g, w, h, t) {
      frame(g, w, h, 'LOYALTY DRIVERS · 1,711 CUSTOMERS', 'TO SCALE');
      var rows = [['QUALITY', 0.713, '0.713'], ['NEG. PUBLICITY', -0.449, '-0.449'], ['BRAND AWARENESS', 0.18, '0.18']];
      var x0 = 14, x1 = w - 14, zero = (x0 + x1) / 2, half = (x1 - x0) / 2, top = 46, step = (h - 86) / 3;
      g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath(); g.moveTo(zero, top - 8); g.lineTo(zero, top + step * 3 - 6); g.stroke();
      rows.forEach(function (r, i) {
        var y = top + i * step, v = r[1] * ease(seq(t, .3 + i * .25, 1.6 + i * .25));
        txt(g, r[0], v >= 0 ? zero - 8 : zero + 8, y + 12, { size: 9, color: C.mute, align: v >= 0 ? 'right' : 'left', spacing: .4 });
        var bx = v >= 0 ? zero : zero + v * half, bw = Math.abs(v) * half;
        rrect(g, bx, y + 17, Math.max(bw, 2), 10, 3); g.fillStyle = i === 0 ? C.cob : (r[1] < 0 ? C.amb : '#8C93A8'); g.fill();
        txt(g, r[2], v >= 0 ? zero + bw + 6 : bx - 6, y + 26, { size: 10, color: C.white, align: v >= 0 ? 'left' : 'right', weight: 600 });
      });
      txt(g, '-1', x0, top + step * 3 + 6, { size: 8.5, color: C.mute });
      txt(g, '0', zero, top + step * 3 + 6, { size: 8.5, color: C.mute, align: 'center' });
      txt(g, '1', x1, top + step * 3 + 6, { size: 8.5, color: C.mute, align: 'right' });
      g.globalAlpha = seq(t, 2.2, 2.7); txt(g, 'MODEL R² 0.628 (HELD-OUT)', 14, h - 10, { size: 9.5, color: C.cobS, spacing: .4 }); g.globalAlpha = 1;
    }
  };

  /* 7. Automobile: 26 raw -> 60 encoded -> 25 selected features; R² RF 0.894 vs linear 0.717 */
  V.auto = {
    period: 6, draw: function (g, w, h, t) {
      frame(g, w, h, '205 VEHICLES · FEATURE PIPELINE', 'TO SCALE');
      var stages = [[26, 'RAW'], [60, 'ENCODED'], [25, 'SELECTED']];
      var top = 36, colH = h * .44, cx = [w * .2, w * .5, w * .8];
      stages.forEach(function (s, i) {
        var a = ease(seq(t, .2 + i * .7, 1 + i * .7)), n = Math.round(s[0] * a);
        var gap = colH / 60;
        for (var j = 0; j < n; j++) { g.fillStyle = i === 2 ? C.cob : (i === 1 ? '#8C93A8' : C.line); g.fillRect(cx[i] - 14, top + j * gap, 28, Math.max(gap - .8, .8)); }
        txt(g, String(s[0]), cx[i] + 20, top + 10, { size: 12, color: C.white, weight: 600 });
        txt(g, s[1], cx[i], top + colH + 13, { size: 8.5, color: C.mute, align: 'center', spacing: .5 });
        if (i < 2 && a >= 1) { g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath(); g.moveTo(cx[i] + 40, top + colH / 2); g.lineTo(cx[i + 1] - 22, top + colH / 2); g.stroke(); }
      });
      var by = top + colH + 28, bw = w - 28;
      [['RANDOM FOREST', .894, 'R² 0.894', C.cob], ['LINEAR', .717, 'R² 0.717', '#8C93A8']].forEach(function (b, i) {
        var y = by + i * 22, f = b[1] * ease(seq(t, 2.6 + i * .3, 3.8 + i * .3));
        txt(g, b[0], 14, y + 2, { size: 8.5, color: C.mute, spacing: .4 });
        txt(g, b[2], w - 14, y + 2, { size: 9.5, color: i ? C.text : C.cobS, align: 'right', weight: 600 });
        bar(g, 14, y + 6, bw, 6, f, b[3]);
      });
    }
  };

  /* 8. Bank marketing: test ROC AUC for seven models, axis 0.70-1.00; SHAP #1 call duration */
  V.marketing = {
    period: 6, draw: function (g, w, h, t) {
      frame(g, w, h, 'TEST ROC AUC · 41,188 CONTACTS', 'TO SCALE');
      var m = [['GRADIENT BOOSTING', .9485], ['XGBOOST', .9446], ['RANDOM FOREST', .9393], ['ADABOOST', .9341], ['LOGISTIC REG.', .9288], ['TREE (TUNED)', .9213], ['TREE (BASELINE)', .738]];
      var top = 34, step = (h - 70) / m.length, lx = w * .42, bw = w - 14 - lx - 40;
      m.forEach(function (r, i) {
        var y = top + i * step, f = r[1] * ease(seq(t, .2 + i * .12, 1.4 + i * .12));
        txt(g, r[0], lx - 8, y + step * .62, { size: 8.5, color: i ? C.mute : C.white, align: 'right', spacing: .3 });
        bar(g, lx, y + step * .3, bw, Math.min(7, step * .45), f, i ? '#5B6178' : C.cob);
        txt(g, r[1].toFixed(i === 6 ? 3 : 4), w - 14, y + step * .62, { size: 9, color: i ? C.text : C.cobS, align: 'right', weight: 600 });
      });
      g.globalAlpha = seq(t, 2.3, 2.8); txt(g, 'SHAP #1: CALL DURATION · KNOWN ONLY AFTER THE CALL', 14, h - 10, { size: 8.5, color: C.amb, spacing: .3 }); g.globalAlpha = 1;
    }
  };

  /* 9. Churn: random forest accuracy 86.1%, precision 0.74, recall 0.52, F1 0.61;
        class-weighted tree (depth 8) recall 0.70, F1 0.59 */
  V.churn = {
    period: 7, draw: function (g, w, h, t) {
      frame(g, w, h, '5,034 CUSTOMERS · 20.8% CHURN');
      var root = [w / 2, 42], L = [w * .3, 72], R = [w * .7, 72], LL = [w * .18, 100], LR = [w * .42, 100], RL = [w * .58, 100], RR = [w * .82, 100];
      var path = [[root, L], [L, LL]], f = (t % 3.5) / 3.5;
      g.strokeStyle = C.line; g.lineWidth = 1.2;
      [[root, L], [root, R], [L, LL], [L, LR], [R, RL], [R, RR]].forEach(function (e) { g.beginPath(); g.moveTo(e[0][0], e[0][1]); g.lineTo(e[1][0], e[1][1]); g.stroke(); });
      var seg = f < .5 ? path[0] : path[1], q = ease((f % .5) * 2);
      glowDot(g, lerp(seg[0][0], seg[1][0], q), lerp(seg[0][1], seg[1][1], q), 2.6, C.cob);
      [root, L, R].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 4, 0, 7); g.fillStyle = C.dim; g.fill(); });
      [LL, LR, RL, RR].forEach(function (p, i) { rrect(g, p[0] - (i ? 6 : 30), p[1] - 7, i ? 12 : 60, 14, 7); g.fillStyle = i ? C.dim : C.cob; g.fill(); });
      txt(g, 'HIGH RISK', LL[0], LL[1] + 3, { size: 7.5, color: '#fff', align: 'center', spacing: .3 });
      var rows = [['RECALL', [['FOREST', .52, '0.52'], ['BALANCED TREE', .70, '0.70']]], ['F1', [['FOREST', .61, '0.61'], ['BALANCED TREE', .59, '0.59']]]];
      var y0 = Math.max(124, h - 96), cw = (w - 28 - 16) / 2;
      rows.forEach(function (blk, bi) {
        var x = 14 + bi * (cw + 16);
        txt(g, blk[0], x, y0, { size: 8, color: C.mute, spacing: .4 });
        blk[1].forEach(function (r, i) {
          var y = y0 + 8 + i * 22;
          txt(g, r[0], x, y + 7, { size: 7.5, color: C.text, spacing: .2 });
          txt(g, r[2], x + cw, y + 7, { size: 9, color: C.white, align: 'right', weight: 600 });
          bar(g, x, y + 11, cw, 5, r[1] * ease(seq(t, .6 + i * .2 + bi * .3, 1.8 + i * .2 + bi * .3)), i ? C.cob : '#8C93A8');
        });
      });
      g.globalAlpha = seq(t, 2.4, 2.8); txt(g, 'CATCH MORE CHURNERS = MORE FALSE ALARMS', 14, h - 12, { size: 8.5, color: C.amb, spacing: .3 }); g.globalAlpha = 1;
    }
  };

  /* 10. Student non-completion: F1 by stage 0.614 / 0.650 / 0.879 (stage 3 flagged for leakage) */
  V.student = {
    period: 6, draw: function (g, w, h, t) {
      frame(g, w, h, 'XGBOOST F1 BY STAGE · 25,059 STUDENTS', 'TO SCALE');
      var st = [['APPLICATION', .614, '0.614'], ['+ ENGAGEMENT', .650, '0.650'], ['+ ACADEMIC', .879, '0.879']];
      var base = h - 44, top = 44, cw = (w - 28) / 3;
      g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath(); g.moveTo(14, base + .5); g.lineTo(w - 14, base + .5); g.stroke();
      st.forEach(function (s, i) {
        var x = 14 + i * cw + cw * .22, bw = cw * .56, f = ease(seq(t, .3 + i * .35, 1.6 + i * .35)), bh = (base - top) * s[1] * f;
        if (i === 2) { g.setLineDash([3, 3]); rrect(g, x, base - bh, bw, bh, 5); g.strokeStyle = C.amb; g.lineWidth = 1.4; g.stroke(); g.setLineDash([]); }
        else { rrect(g, x, base - bh, bw, bh, 5); g.fillStyle = i === 1 ? C.cob : '#5B6178'; g.fill(); }
        txt(g, s[2], x + bw / 2, base - bh - 6, { size: 11, color: i === 1 ? C.cobS : (i === 2 ? C.amb : C.text), align: 'center', weight: 600 });
        txt(g, 'STAGE ' + (i + 1), x + bw / 2, base + 13, { size: 8.5, color: C.mute, align: 'center', spacing: .4 });
        txt(g, s[0], x + bw / 2, base + 24, { size: 8, color: C.mute, align: 'center' });
      });
      // flag sits inside the dashed stage-3 box, clear of the value label above it
      var lx = 14 + 2 * cw + cw * .5, ly = base - (base - top) * .879 * ease(seq(t, 1.0, 2.3)) / 2;
      g.globalAlpha = seq(t, 2.4, 2.8);
      txt(g, 'LEAKAGE', lx, ly - 3, { size: 8.5, color: C.amb, align: 'center', spacing: .5 });
      txt(g, 'CHECK', lx, ly + 9, { size: 8.5, color: C.amb, align: 'center', spacing: .5 }); g.globalAlpha = 1;
    }
  };

  /* 11. Movie reviews: bidirectional recurrent chain; five-class test accuracy (axis 0-50%) */
  V.movie = {
    period: 5, draw: function (g, w, h, t) {
      frame(g, w, h, w < 440 ? 'FIVE-CLASS · 2,210 TEST SENTENCES' : 'FIVE-CLASS SENTIMENT · 2,210 TEST SENTENCES', '');
      var n = 7, y = 52, x0 = 24, x1 = w - 24, step = (x1 - x0) / (n - 1);
      for (var i = 0; i < n; i++) {
        var x = x0 + i * step;
        rrect(g, x - 9, y - 9, 18, 18, 4); g.fillStyle = C.grid; g.fill(); g.strokeStyle = C.line; g.lineWidth = 1; g.stroke();
        rrect(g, x - 6, y + 18, 12, 6, 2); g.fillStyle = C.dim; g.fill();
        if (i < n - 1) { g.strokeStyle = C.line; g.beginPath(); g.moveTo(x + 10, y - 3); g.lineTo(x + step - 10, y - 3); g.moveTo(x + 10, y + 3); g.lineTo(x + step - 10, y + 3); g.stroke(); }
      }
      var f = (t % 5) / 5, fx = lerp(x0, x1, ease(f)), bx = lerp(x1, x0, ease(f));
      glowDot(g, fx, y - 3, 2.6, C.cob); glowDot(g, bx, y + 3, 2.6, C.cobS);
      var bars = [['BIDIRECTIONAL LSTM', .385, '38.5%', C.cob], ['VANILLA RNN', .264, '26.4%', '#8C93A8'], ['LSTM / GRU', .231, '23.1%', '#5B6178']];
      var by = Math.max(92, h * .44), lx = w * .44, bw = w - 14 - lx - 40;
      bars.forEach(function (b, i) {
        var yy = by + i * Math.max(20, (h - by - 34) / 3);
        txt(g, b[0], lx - 8, yy + 7, { size: 8.5, color: i ? C.mute : C.white, align: 'right', spacing: .3 });
        bar(g, lx, yy, bw, 7, b[1], b[3]);
        txt(g, b[2], w - 14, yy + 7, { size: 9.5, color: i ? C.text : C.cobS, align: 'right', weight: 600 });
      });
      var mx = lx + bw * .23;
      g.setLineDash([2, 3]); g.strokeStyle = C.amb; g.beginPath(); g.moveTo(mx, by - 6); g.lineTo(mx, h - 24); g.stroke(); g.setLineDash([]);
      txt(g, 'MAJORITY ~23%', mx, h - 10, { size: 8.5, color: C.amb, align: 'center' });
    }
  };

  /* 12. Hypothesis tests: p-values placed on a two-tailed scale, alpha 0.05 */
  function zFromP(p) { // inverse of two-tailed p for a standard normal (Acklam approximation)
    var q = 1 - p / 2, a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00], b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01], c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00], d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var r, x;
    if (q > 0.97575) { r = Math.sqrt(-2 * Math.log(1 - q)); x = -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); }
    else { r = q - .5; var s = r * r; x = (((((a[0] * s + a[1]) * s + a[2]) * s + a[3]) * s + a[4]) * s + a[5]) * r / (((((b[0] * s + b[1]) * s + b[2]) * s + b[3]) * s + b[4]) * s + 1); }
    return x;
  }
  V.hypo = {
    period: 6, draw: function (g, w, h, t) {
      frame(g, w, h, 'SIX TESTS · α = 0.05', 'p TO SCALE');
      var T = [['PRICING', .151, 'p 0.151'], ['PRODUCTIVITY', .0005, 'p < 0.001'], ['SOCIAL MEDIA', .441, 'p 0.441'], ['DEFECTS', .004, 'p 0.004'], ['REVENUE', .0005, 'p < 0.001'], ['CAMPAIGN', .528, 'p 0.528']];
      var cols = 3, pw = (w - 28 - 16) / 3, ph = (h - 46) / 2 - 6;
      T.forEach(function (d, i) {
        var x0 = 14 + (i % cols) * (pw + 8), y0 = 30 + ((i / cols) | 0) * (ph + 8), rej = d[1] < .05;
        rrect(g, x0, y0, pw, ph, 8); g.fillStyle = C.grid; g.fill();
        var bx = x0 + 8, bw = pw - 16, base = y0 + ph - 18, amp = ph - 38;
        var X = function (z) { return bx + (z + 4) / 8 * bw; };
        g.beginPath();
        for (var z = -4; z <= 4.001; z += .1) { var yv = base - Math.exp(-z * z / 2) * amp; z === -4 ? g.moveTo(X(z), yv) : g.lineTo(X(z), yv); }
        g.strokeStyle = C.line; g.lineWidth = 1.2; g.stroke();
        [[-4, -1.96], [1.96, 4]].forEach(function (rg) {
          g.beginPath(); g.moveTo(X(rg[0]), base);
          for (var z = rg[0]; z <= rg[1] + .001; z += .05) g.lineTo(X(z), base - Math.exp(-z * z / 2) * amp);
          g.lineTo(X(rg[1]), base); g.closePath(); g.fillStyle = 'rgba(67,82,255,.28)'; g.fill();
        });
        var zt = Math.min(zFromP(d[1]), 3.6) * ease(seq(t, .4 + i * .15, 2 + i * .15)), mx = X(zt);
        g.strokeStyle = rej ? C.cobS : C.amb; g.lineWidth = 1.6; g.beginPath(); g.moveTo(mx, base); g.lineTo(mx, y0 + 18); g.stroke();
        glowDot(g, mx, y0 + 18, 2.4, rej ? C.cob : C.amb);
        txt(g, d[0], x0 + 8, y0 + 13, { size: 7.5, color: C.mute, spacing: .3 });
        txt(g, d[2], x0 + 8, y0 + ph - 5, { size: 8.5, color: rej ? C.cobS : C.amb, weight: 600 });
        txt(g, rej ? 'REJECT' : 'RETAIN', x0 + pw - 8, y0 + ph - 5, { size: 7.5, color: C.mute, align: 'right', spacing: .3 });
      });
    }
  };

  /* 13. PDF harness: ten lines at 10.8 pt checked; 300 verdicts (210 valid, 90 defective) all matched */
  V.pdf = {
    period: 8, draw: function (g, w, h, t) {
      frame(g, w, h, 'LAYOUT + CONTENT CHECKS', 'TO SCALE');
      var px = 14, py = 38, pw = w * .3, ph = h - 52;
      rrect(g, px, py, pw, ph, 6); g.fillStyle = '#E9EBF2'; g.fill();
      var lh = (ph - 24) / 10, scan = (t % 4) / 4;
      for (var i = 0; i < 10; i++) {
        var ly = py + 14 + i * lh, lw = (pw - 20) * (i === 0 ? .55 : [.9, .7, .8, .6, .95, .85, .5, .75, .65][i - 1]);
        g.fillStyle = i === 3 ? '#1B1D26' : '#9AA0B4'; g.fillRect(px + 10, ly, lw, Math.max(2, lh * .32));
        if (scan * 10 > i + .5) { txt(g, '✓', px + pw - 8, ly + 5, { size: 8, color: '#1FA36A', align: 'right', weight: 600 }); }
      }
      var sy = py + 8 + scan * (ph - 16);
      g.fillStyle = 'rgba(67,82,255,.18)'; g.fillRect(px, sy - 6, pw, 12);
      g.strokeStyle = C.cob; g.lineWidth = 1.2; g.beginPath(); g.moveTo(px - 3, sy); g.lineTo(px + pw + 3, sy); g.stroke();
      txt(g, '10.8 pt', px + pw + 8, sy + 3, { size: 8.5, color: C.cobS });
      var gx = px + pw + 52, gw = w - 14 - gx, cols = 20, sz = gw / cols, n = Math.round(ease(seq(t, .3, 6)) * 300);
      for (var k = 0; k < 300; k++) {
        var c = k % cols, r = (k / cols) | 0, x = gx + c * sz, y = py + r * sz;
        if (y + sz > py + ph - 14) break;
        rrect(g, x + .8, y + .8, sz - 1.6, sz - 1.6, 1.2);
        g.fillStyle = k >= n ? C.grid : (k < 210 ? '#1FA36A' : '#E5484D'); g.fill();
      }
      txt(g, n + ' / 300 MATCH', gx, h - 10, { size: 9.5, color: C.white, weight: 600 });
      txt(g, '■ PASS ■ FAIL', w - 14, h - 10, { size: 8.5, color: C.mute, align: 'right' });
    }
  };

  /* 14. Book sales, Title B, 32-week test MAE: SARIMA 382.3, LSTM 592.2, sequential hybrid 1,096.5, parallel hybrid 1,174.4 */
  V.books = {
    period: 6, draw: function (g, w, h, t) {
      frame(g, w, h, 'TITLE B · ERROR ON 32-WEEK TEST (MAE)');
      var m = [['SARIMA', 382.3, '382.3', C.cob], ['LSTM', 592.2, '592.2', '#8C93A8'], ['SEQUENTIAL HYBRID', 1096.5, '1,096.5', '#5B6178'], ['PARALLEL HYBRID', 1174.4, '1,174.4', '#5B6178']];
      var top = 40, step = (h - 76) / 4, bw = w - 28 - 52;
      m.forEach(function (r, i) {
        var y = top + i * step, a = ease(seq(t, .3 + i * .25, 1.8 + i * .25));
        txt(g, r[0], 14, y + 8, { size: 8.5, color: i ? C.text : C.white, weight: i ? 400 : 600, spacing: .3 });
        bar(g, 14, y + 13, bw, 8, r[1] / 1174.4 * a, r[3]);
        txt(g, r[2], w - 14, y + 21, { size: 9.5, color: i ? C.text : C.cobS, align: 'right', weight: 600 });
      });
      g.globalAlpha = seq(t, 2.4, 2.8); txt(g, 'LOWER IS BETTER · THE HYBRIDS DID NOT HELP', 14, h - 12, { size: 8.5, color: C.amb, spacing: .3 }); g.globalAlpha = 1;
    }
  };

  /* 15. Crime: monthly incidents 2,478 (Feb) to 4,776 (Jul), average 3,940; 52-week cycle (brief said 70);
        test MSE SARIMA(1,0,1)(1,1,1,52) 139.98 vs auto_arima 160.46 */
  V.crime = {
    period: 6, draw: function (g, w, h, t) {
      // on wide frames, enlarge the whole drawing so it fills the space instead of floating small
      var k = Math.max(1, Math.min(w / 440, h / 260)); if (k > 1) { g.scale(k, k); w /= k; h /= k; }
      frame(g, w, h, 'MONTHLY INCIDENTS · 2011-2015');
      var x0 = 14, x1 = w - 14, lo = 2478, hi = 4776, y = Math.max(62, 54 + ((h - 50) - 142) / 2), a = ease(seq(t, .2, 1.6));
      var X = function (v) { return lerp(x0 + 6, x1 - 6, (v - lo) / (hi - lo)); };
      var grad = g.createLinearGradient(x0, 0, x1, 0); grad.addColorStop(0, '#2A2D38'); grad.addColorStop(1, C.cob);
      rrect(g, x0, y - 6, (x1 - x0) * a, 12, 6); g.fillStyle = grad; g.fill();
      txt(g, 'FEB LOW', x0, y - 14, { size: 8, color: C.mute, spacing: .3 }); txt(g, '2,478', x0, y + 22, { size: 11, color: C.white, weight: 600, font: SANS });
      txt(g, 'JUL HIGH', x1, y - 14, { size: 8, color: C.mute, align: 'right', spacing: .3 }); txt(g, '4,776', x1, y + 22, { size: 11, color: C.white, align: 'right', weight: 600, font: SANS });
      if (a > .99) { var mx = X(3940); g.strokeStyle = C.amb; g.lineWidth = 1.5; g.beginPath(); g.moveTo(mx, y - 9); g.lineTo(mx, y + 9); g.stroke(); txt(g, 'AVG 3,940', mx, y + 22, { size: 8.5, color: C.amb, align: 'center' }); }
      txt(g, 'TEST MSE · FINAL 52 WEEKS · LOWER IS BETTER', 14, y + 50, { size: 8, color: C.mute, spacing: .4 });
      [['SARIMA (HAND-SPECIFIED)', 139.98, '139.98', C.cob], ['AUTO_ARIMA', 160.46, '160.46', '#8C93A8']].forEach(function (r, i) {
        var yy = y + 58 + i * 22;
        txt(g, r[0], 14, yy + 7, { size: 8, color: i ? C.text : C.white, spacing: .2 });
        txt(g, r[2], w - 14, yy + 7, { size: 9.5, color: i ? C.text : C.cobS, align: 'right', weight: 600 });
        bar(g, 14, yy + 11, w - 28, 5, r[1] / 160.46 * ease(seq(t, 1.4 + i * .25, 2.6 + i * .25)), r[3]);
      });
      g.globalAlpha = seq(t, 2.8, 3.2); txt(g, 'CYCLE IS 52 WEEKS (THE BRIEF SAID 70)', 14, Math.min(h - 12, y + 132), { size: 8.5, color: C.amb, spacing: .3 }); g.globalAlpha = 1;
    }
  };

  /* ---------- runtime ---------- */
  var items = [];
  document.querySelectorAll('canvas[data-viz]').forEach(function (cv) {
    var def = V[cv.getAttribute('data-viz')]; if (!def) return;
    items.push({ cv: cv, def: def, st: {}, on: false, t0: 0, inited: false });
  });
  function size(it) {
    // Draw on a logical canvas at least MIN wide; narrower containers scale it down uniformly,
    // so labels never collide and text stays legible on the smallest phones.
    var r = it.cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 3), MIN = 340;
    var s = r.width > 0 && r.width < MIN ? r.width / MIN : 1;
    it.w = r.width / s; it.h = r.height / s;
    it.cv.width = Math.round(r.width * d); it.cv.height = Math.round(r.height * d);
    it.g = it.cv.getContext('2d'); it.g.setTransform(d * s, 0, 0, d * s, 0, 0);
    if (!it.inited && it.w > 0) { it.def.init && it.def.init(it.st, it.w, it.h); it.inited = true; }
  }
  function paint(it, now) {
    if (!it.w) return;
    var t = reduce ? 999 : ((now - it.t0) / 1000); FT = t;
    if (it.def.period < 999 && !reduce) t = t % it.def.period;
    if (reduce && it.def.period < 999) t = it.def.period - .01;
    it.g.save(); it.def.draw(it.g, it.w, it.h, t, it.st); it.g.restore();
  }
  items.forEach(size);
  // re-measure whenever a canvas box changes size (late CSS, font swap, mobile toolbar), so the
  // drawing buffer always matches the box and text is never stretched
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (es) { es.forEach(function (e) { var it = items.find(function (x) { return x.cv === e.target; }); if (it) { size(it); paint(it, performance.now()); } }); });
    items.forEach(function (it) { ro.observe(it.cv); });
  }
  window.addEventListener('resize', function () { items.forEach(function (it) { size(it); paint(it, performance.now()); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { items.forEach(function (it) { paint(it, performance.now()); }); });
  if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (it) { paint(it, performance.now()); }); if (reduce) return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { var it = items.find(function (x) { return x.cv === e.target; }); if (!it) return; if (e.isIntersecting && !it.on) { it.on = true; it.t0 = performance.now(); } else if (!e.isIntersecting) it.on = false; });
  }, { threshold: 0.15 });
  items.forEach(function (it) { io.observe(it.cv); paint(it, performance.now()); });
  (function loop(now) {
    if (!document.hidden) items.forEach(function (it) { if (it.on) paint(it, now); });
    requestAnimationFrame(loop);
  })(performance.now());
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
