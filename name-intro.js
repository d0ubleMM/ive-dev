/* Original zoom out of the V and measured word reveal, without the agent tunnel. */
(function () {
  'use strict';
  var root = document.documentElement;
  var intro = document.querySelector('[data-name-intro]');
  if (!intro) return;
  var pin = intro.querySelector('[data-name-pin]');
  var line = intro.querySelector('[data-name-line]');
  var caps = Array.from(intro.querySelectorAll('[data-name-cap]'));
  var rests = Array.from(intro.querySelectorAll('[data-name-rest]'));
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = window.matchMedia('(max-width: 720px)');
  var measureData = null;
  var scheduled = false;
  var fontsReady = !document.fonts || document.fonts.status === 'loaded';
  var GAP0 = .02, GAP1 = .24;
  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function header() {
    var rect = intro.getBoundingClientRect();
    root.classList.toggle('name-intro-active', rect.top < 64 && rect.bottom > 64);
  }
  function measure() {
    root.classList.toggle('name-intro-live', !motion.matches);
    if (motion.matches) {
      intro.removeAttribute('style');
      measureData = null;
      header();
      return;
    }
    intro.classList.add('is-measuring');
    var capEm = caps.map(function (el) { return el.getBoundingClientRect().width / 100; });
    var restEm = rests.map(function (el) { return el.getBoundingClientRect().width / 100; });
    var lineHeight = line.getBoundingClientRect().height / 100;
    intro.classList.remove('is-measuring');
    rests.forEach(function (el, i) { el.parentNode.style.setProperty('--rest-em', restEm[i]); });
    var cs = getComputedStyle(pin);
    var width = pin.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    measureData = {
      column: narrow.matches, capEm: capEm, restEm: restEm,
      width: Math.min(width, 1480) * .9, height: pin.clientHeight * .56,
      lineHeight: lineHeight,
      a: narrow.matches ? Math.max.apply(null, capEm) : capEm.reduce(function (a, b) { return a + b; }, 0) + 2 * GAP0,
      b: narrow.matches ? Math.max.apply(null, restEm) : restEm.reduce(function (a, b) { return a + b; }, 0),
      top: intro.getBoundingClientRect().top + window.scrollY,
      travel: Math.max(1, intro.offsetHeight - pin.offsetHeight)
    };
    var m = measureData;
    m.originX = m.column ? (.31 * capEm[1]) / m.a : (capEm[0] + GAP0 + .31 * capEm[1]) / m.a;
    var size0 = Math.min(m.width / m.a, m.height / m.lineHeight);
    var diagonal = Math.hypot(pin.clientWidth, pin.clientHeight);
    m.zoom0 = Math.max(10, 1.45 * diagonal / (.19 * size0));
    render();
    intro.classList.toggle('is-ready', fontsReady);
  }
  function render() {
    scheduled = false;
    header();
    if (!measureData || motion.matches) return;
    var m = measureData;
    var raw = clamp((window.scrollY - m.top) / m.travel);
    var z = clamp(raw / .2);
    var p = clamp((raw - .24) / .62);
    var u = ease(p);
    var reveal = (m.a / m.b) * (Math.pow(1 + m.b / m.a, u) - 1);
    var gap = GAP0 + (GAP1 - GAP0) * ease(p / .5);
    var em = m.column
      ? Math.max.apply(null, m.capEm.map(function (cap, i) { return cap + m.restEm[i] * reveal; }))
      : m.a - 2 * GAP0 + m.b * reveal + 2 * gap;
    var size = Math.min(m.width / em, m.height / m.lineHeight);
    var pop = Math.pow(m.zoom0, 1 - ease(z));
    var shiftX = 0, transformPop = 1;
    if (pop > 1.0001) {
      // Grow actual type first so WebKit keeps the edges sharp, as in the original.
      var fontPop = Math.min(pop, 6000 / size);
      transformPop = pop / fontPop;
      var width0 = m.a * size;
      shiftX = m.column ? -m.originX * width0 * (fontPop - 1) : -(m.originX - .5) * width0 * (fontPop - 1);
      size *= fontPop;
    }
    intro.style.setProperty('--name-size', size.toFixed(2) + 'px');
    intro.style.setProperty('--name-shift-x', shiftX.toFixed(2) + 'px');
    intro.style.setProperty('--name-pop', transformPop.toFixed(4));
    intro.style.setProperty('--name-origin-x', (m.originX * 100).toFixed(2) + '%');
    intro.style.setProperty('--name-cue', z < .2 ? '#24282E' : '#A7B0BB');
    intro.style.setProperty('--name-link-cue', z < .2 ? '#24282E' : '#DCE4EA');
    intro.style.setProperty('--name-gap', gap.toFixed(4) + 'em');
    intro.style.setProperty('--name-reveal', reveal.toFixed(4));
    intro.style.setProperty('--name-slide', (-.15 * (1 - reveal)).toFixed(4) + 'em');
    intro.style.setProperty('--name-alpha', ease(p / .28).toFixed(3));
    intro.style.setProperty('--name-hint', (1 - ease(raw / .3)).toFixed(3));
    var by = ease((p - .78) / .22);
    intro.style.setProperty('--name-by', by.toFixed(3));
    intro.classList.toggle('has-maker', by > .05);
  }
  function queue() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  if (motion.addEventListener) motion.addEventListener('change', measure);
  else motion.addListener(measure);
  if (document.fonts) document.fonts.ready.then(function () { fontsReady = true; measure(); });
  measure();
})();
