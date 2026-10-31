/* IVE.DEV · cursor-intro.js — before the name. A prompt is typed; scrolling fills the board
   (1, 2, 4, 8, 12 sessions, each split off another), the sessions fold into their cursors,
   the cursors run together into one block cursor, turning the site's pop colour as they
   arrive, and that cursor types "Meet IVE" small, in the prompt's own mono (the text stays
   ink). The typed line then grows: the mono IVE dissolves into the name
   intro's own letters, which grow with it to their full size and unfold as before. One canvas
   over the name intro's pinned letters once they are in view; redrawn only when the scroll
   position, the typing or a blink changes. No zoom in either direction: the camera never
   moves, only the type grows. */
(function () {
  'use strict';
  var root = document.documentElement;
  var section = document.querySelector('[data-cursor-intro]');
  var intro = document.querySelector('[data-name-intro]');
  if (!section || !intro || !root.classList.contains('name-intro-live')) return;
  var pin = section.querySelector('[data-cursor-pin]');
  var canvas = section.querySelector('[data-cursor-canvas]');
  var ctx = canvas.getContext('2d');
  if (!ctx) { root.classList.add('cursor-intro-off'); return; }
  root.classList.add('cursor-intro-on');
  var introPin = intro.querySelector('[data-name-pin]');
  var line = intro.querySelector('[data-name-line]');
  var caps = Array.prototype.slice.call(intro.querySelectorAll('[data-name-cap]'));
  var CAP_VARS = ['--cap-i', '--cap-v', '--cap-e'];
  var narrowMQ = window.matchMedia('(max-width: 720px)');

  var BG = '#0E1014', TILE = '#15181D', LINE = 'rgba(255,255,255,.08)', BOX = 'rgba(255,255,255,.14)';
  var INK = '#F2F3F5', TITLE = '#DCE0E5', OUT = '#A9B0B9', MUTED = '#7C828C', PROMPT = '#8B919B', RUNNING = '#5B8CFF', WORKING = '#E0A54A';
  var SANS = "'Source Sans 3', system-ui, sans-serif", MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
  var PROMPT_TEXT = 'Check the sign-in flow';
  var SESSIONS = [
    [PROMPT_TEXT, 'Bash(npm test)', '12 passed, 0 failed'],
    ['Connect the API', 'Read src/lib/cursor.js', 'Read 174 lines'],
    ['Update the docs', 'Update(docs/settings.md)', 'Added 8 lines'],
    ['Write the migration', 'Update(db/0008_sessions.sql)', 'Added 5 lines'],
    ['Fix the flaky test', 'Read playwright.config.js', 'Read 191 lines'],
    ['Add the audit log', 'Bash(npm test)', '14 passed, 0 failed'],
    ['Review the changes', 'Read tests/sign-in.spec.js', 'Read 174 lines'],
    ['Type the API client', 'Update(src/lib/api.js)', 'Added 5 lines'],
    ['Clean up the imports', 'Bash(npm run lint)', '0 problems'],
    ['Build the keymap', 'Read src/lib/keymap.js', 'Read 85 lines'],
    ['Rename the settings keys', 'Update(src/settings.js)', 'Added 3 lines'],
    ['Speed up the build', 'Bash(npm run build)', 'Built in 4.2 s']
  ];
  // slot = [col, row] on the full board; parent = the session a new one splits off
  var BOARDS = {
    wide: {
      counts: [1, 2, 4, 8, 12], grids: [[1, 1], [2, 1], [2, 2], [4, 2], [4, 3]],
      slots: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [3, 0], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2]],
      parents: [0, 0, 0, 1, 0, 1, 2, 3, 2, 3, 6, 7]
    },
    narrow: {
      counts: [1, 2, 4, 8], grids: [[1, 1], [2, 1], [2, 2], [2, 4]],
      slots: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3], [1, 3]],
      parents: [0, 0, 0, 1, 2, 3, 2, 3]
    }
  };
  // the scroll timeline, 0 to 1 over the pinned travel (280svh on desktop, 230svh on phones):
  // the board takes two thirds, each doubling of the sessions about 28svh (owner: the board
  // went too fast at half that), the typed line and its growth the last third. The name's
  // letters come into view under the canvas at letterP (from the layout, .75), just before
  // the line starts to grow.
  var T = { hint: [0, .039], morph: [.021, .064], spawn: [.064, .464], fold: [.5, .557], gather: [.543, .664], grow: [.771, .957] };
  // the typed line: one character per LINE_STEP of travel from LINE_AT on
  var LINE_TEXT = 'Meet IVE', LINE_AT = .679, LINE_STEP = .0089, SOLID_AFTER = .012;
  // inside the growth: "Meet" and the block cursor go (MEET, CURSOR), the mono letters move
  // onto the name's letters (SHUFFLE) and dissolve into them (DISSOLVE)
  var MEET = [0, .18], CURSOR = [.04, .24], SHUFFLE = [.08, .3], DISSOLVE = [.2, .45];

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function inOut(x) { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(p, r) { return clamp((p - r[0]) / (r[1] - r[0])); }
  // '#RGB' or '#RRGGBB' to [r, g, b] (null for anything else), and the blend of two such triples
  function hexRgb(s) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s || '');
    if (!m) return null;
    var n = parseInt(m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1], 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function mix(a, b, t) {
    return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
  }
  // the pop (design/ACCENT-BRIEF.md): the cursor's colour at the moment it matters. The gathering
  // cursors tint from INK to it as they arrive, the merged cursor types "Meet IVE" in it; nothing
  // else on the canvas uses it. Read from the site's --pop token in measure(); the fallback
  // stands until the token exists or when it is not a hex colour
  var POP_FALLBACK = '#FF4F9B', INK_RGB = hexRgb(INK), POP_RGB = hexRgb(POP_FALLBACK);
  function pop(t) { return mix(INK_RGB, POP_RGB, t); }

  var W = 0, H = 0, dpr = 1, narrow = false, board, G, layouts, travel = 1, top0 = 0, letterP = .8;
  var fontsReady = false, typed = 0, typeTimer = 0, visible = true, drawn = '', drawing = false;
  var mono = null, geom = null, geomReady = false;
  // compared with the element itself: name-intro.js wipes the name intro's inline style on a
  // reduced-motion change, so a shadow cache would go stale
  function setVar(el, name, val) {
    if (el.style.getPropertyValue(name) === val) return;
    el.style.setProperty(name, val);
  }

  function fitGrid(cols, rows) {
    var w = Math.min(G.maxW, (G.rw - (cols - 1) * G.gap) / cols, ((G.rh - (rows - 1) * G.gap) / rows) * G.aspect);
    var h = w / G.aspect;
    return { w: w, h: h, left: G.cx - (cols * w + (cols - 1) * G.gap) / 2, top: G.cy - (rows * h + (rows - 1) * G.gap) / 2 };
  }
  function slotPos(L, slot) { return { x: L.left + slot[0] * (L.w + G.gap), y: L.top + slot[1] * (L.h + G.gap) }; }

  function measure() {
    W = pin.clientWidth; H = pin.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    narrow = narrowMQ.matches;
    board = narrow ? BOARDS.narrow : BOARDS.wide;
    var head = narrow ? 56 : 64, room = H - head;
    G = narrow
      ? { gap: 10, aspect: 1.6, maxW: 320, rw: W - 40, rh: room * .64, cx: W / 2, cy: head + room * .52 }
      : { gap: 16, aspect: 1.6, maxW: 460, rw: Math.min(W * .86, 1240), rh: room * .62, cx: W / 2, cy: head + room * .52 };
    layouts = board.grids.map(function (d) { return fitGrid(d[0], d[1]); });
    travel = Math.max(1, section.offsetHeight - pin.offsetHeight);
    top0 = section.getBoundingClientRect().top + window.scrollY;
    var introTop = intro.getBoundingClientRect().top + window.scrollY;
    letterP = clamp((introTop - top0) / travel);
    POP_RGB = hexRgb(getComputedStyle(root).getPropertyValue('--pop').trim()) || hexRgb(POP_FALLBACK);
    mono = null; geom = null; drawn = '';
    // the CSS loading status stands on the prompt's left edge, so it becomes the prompt instead
    // of jumping (before the fonts are in, the fallback mono's width is close enough)
    setVar(section, '--prompt-x', promptX().toFixed(1) + 'px');
  }
  // the typed prompt's left edge: the whole line (prefix, text, a .7 em tail) is centred on the
  // pin at the mono's size; draw() types it there and measure() hands it to the loading status
  function promptX() {
    var size = narrow ? 17 : 26;
    ctx.font = '400 ' + size + 'px ' + MONO;
    return W / 2 - (ctx.measureText('> ').width + ctx.measureText(PROMPT_TEXT).width + size * .7) / 2;
  }

  // the typed line in the prompt's mono: its size, the character advance, the cap height over
  // the baseline, where it starts and where its IVE is centred (the anchor the growth works from)
  function monoLayout() {
    if (mono) return mono;
    var size = narrow ? 17 : 26;
    ctx.font = '400 ' + size + 'px ' + MONO;
    ctx.textBaseline = 'alphabetic';
    var m = ctx.measureText('I');
    var adv = m.width || size * .6, capR = (m.actualBoundingBoxAscent || size * .7) / size;
    var x0 = W / 2 - (adv * LINE_TEXT.length) / 2, ive = LINE_TEXT.indexOf('IVE');
    mono = { size: size, adv: adv, capR: capR, x0: x0, cy: H / 2, cx: x0 + (ive + 1.5) * adv, ive: ive };
    return mono;
  }
  // the block cursor of a typed mono line at font size fm: the prompt's proportions
  function monoBlock(fm, capR) { return { w: .58 * fm, h: 1.1 * fm, top: capR * fm / 2 - .925 * fm }; } // top: from the cap centre

  // the name's three capitals at full size, as boxes in the pinned screen: their slot (advance
  // width) and the cap height over the baseline, from the same font the DOM renders. Also the
  // group's centre and the point the letters scale around (flex centres the line; on phones
  // it sits at the left).
  function measureCaps() {
    if (!intro.classList.contains('is-ready') || !introPin) return null;
    setVar(intro, '--pro-scale', '1'); setVar(intro, '--pro-x', '0px'); setVar(intro, '--pro-y', '0px');
    var fs = parseFloat(getComputedStyle(line).fontSize) || 0;
    if (!fs) return null;
    var pr = introPin.getBoundingClientRect(), lr = line.getBoundingClientRect();
    if (!pr.width || !lr.width) return null;
    ctx.font = '800 ' + fs + 'px Archivo';
    ctx.textBaseline = 'alphabetic'; // the box metrics are relative to the current baseline
    var m = ctx.measureText('I');
    var asc = m.fontBoundingBoxAscent || fs * .88, desc = m.fontBoundingBoxDescent || fs * .2;
    var capH = m.actualBoundingBoxAscent || fs * .7;
    var boxes = caps.map(function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width) return null;
      var base = r.top - pr.top + (r.height - (asc + desc)) / 2 + asc;
      return { x: r.left - pr.left, right: r.right - pr.left, w: r.width, top: base - capH, h: capH };
    });
    var gx = 0, gy = 0;
    for (var i = 0; i < boxes.length; i++) {
      if (!boxes[i]) return null;
      gx += boxes[i].x + boxes[i].w / 2; gy += boxes[i].top + boxes[i].h / 2;
    }
    return {
      // the name intro sizes its type to the unfolded words further down: a reading is good
      // only while the size it was taken at stands
      nameSize: intro.style.getPropertyValue('--name-size'),
      boxes: boxes,
      gc: { x: gx / boxes.length, y: gy / boxes.length },
      o: { x: narrow ? lr.left - pr.left : lr.left + lr.width / 2 - pr.left, y: lr.top + lr.height / 2 - pr.top }
    };
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fit(text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    var t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t.trimEnd() + '…';
  }

  // a session tile; returns where its cursor sits
  function metrics(x, y, w, h) {
    var k = w / 280, pad = 12 * k, boxH = Math.max(16, 26 * k);
    return {
      k: k, pad: pad, boxY: y + h - pad - boxH, boxH: boxH,
      titleX: x + pad + Math.max(10, 14 * k), titleY: y + pad + Math.max(7, 9 * k), titleSize: Math.max(10.5, 13 * k),
      cx: x + pad + Math.max(15, 22 * k), cy: y + h - pad - boxH / 2, cw: Math.max(5, 7.5 * k), ch: Math.max(10, 14 * k)
    };
  }
  function drawTile(i, x, y, w, h, frameA, textA, titleA) {
    var M = metrics(x, y, w, h);
    if (frameA > 0) {
      ctx.globalAlpha = frameA;
      roundRect(x, y, w, h, Math.max(5, 8 * M.k));
      ctx.fillStyle = TILE; ctx.fill();
      ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.stroke();
    }
    if (textA > 0) {
      ctx.globalAlpha = textA;
      ctx.fillStyle = RUNNING;
      ctx.beginPath(); ctx.arc(x + M.pad + Math.max(3, 4 * M.k), M.titleY, Math.max(2.5, 3.5 * M.k), 0, Math.PI * 2); ctx.fill();
      ctx.textBaseline = 'middle';
      if (w >= 200) {
        var ms = Math.max(9, 11 * M.k);
        ctx.font = '400 ' + ms + 'px ' + MONO;
        ctx.fillStyle = OUT;
        ctx.fillText(fit('• ' + SESSIONS[i][1], w - 2 * M.pad), x + M.pad, y + M.pad + 38 * M.k);
        ctx.fillStyle = MUTED;
        ctx.fillText(fit('  └ ' + SESSIONS[i][2], w - 2 * M.pad), x + M.pad, y + M.pad + 55 * M.k);
        // the CLI's own status line, as on the app's board
        ctx.fillStyle = WORKING;
        ctx.fillText('*', x + M.pad, y + M.pad + 82 * M.k);
        ctx.fillStyle = MUTED;
        ctx.fillText(fit('Working… (' + (4 + (i * 5) % 9) + 's · esc to interrupt)', w - 2 * M.pad - 14 * M.k), x + M.pad + 14 * M.k, y + M.pad + 82 * M.k);
      }
      roundRect(x + M.pad, M.boxY, w - 2 * M.pad, M.boxH, Math.max(3, 5 * M.k));
      ctx.strokeStyle = BOX; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = '400 ' + Math.max(9, 12 * M.k) + 'px ' + MONO;
      ctx.fillStyle = PROMPT;
      ctx.fillText('>', x + M.pad + Math.max(5, 9 * M.k), M.cy);
    }
    if (titleA > 0) {
      ctx.globalAlpha = titleA;
      ctx.font = '600 ' + M.titleSize + 'px ' + SANS;
      ctx.fillStyle = TITLE; ctx.textBaseline = 'middle';
      ctx.fillText(fit(SESSIONS[i][0], x + w - M.pad - M.titleX), M.titleX, M.titleY);
    }
    ctx.globalAlpha = 1;
    return M;
  }
  // a block cursor, INK unless a colour is given (the gathering and the merged cursor: the pop)
  function block(x, y, w, h, a, colour) {
    if (a <= 0) return;
    ctx.globalAlpha = a; ctx.fillStyle = colour || INK;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
  }
  // three blink groups, so a redraw is due only when one of them toggles
  function blinkOn(i, now) { return Math.floor((now + (i % 3) * 177) / 530) % 2 === 0; }
  function blinkKey(now) { return (blinkOn(0, now) ? 1 : 0) + (blinkOn(1, now) ? 2 : 0) + (blinkOn(2, now) ? 4 : 0); }

  function progress() { return clamp((window.scrollY - top0) / travel); }

  function restName() {
    setVar(intro, '--pro-scale', '1'); setVar(intro, '--pro-x', '0px'); setVar(intro, '--pro-y', '0px');
  }
  function showCaps(a) {
    for (var j = 0; j < CAP_VARS.length; j++) setVar(intro, CAP_VARS[j], a);
  }

  function draw(p, now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    // once the name's letters stand under the canvas (and are measured), the ground goes
    var letters = p >= letterP && geom;
    if (letters) ctx.clearRect(0, 0, W, H);
    else { ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); }
    if (!fontsReady) return;
    // the first frame with the fonts: the loading status in the markup goes
    if (!drawing) { drawing = true; section.classList.add('is-drawing'); }
    var L = monoLayout();
    var n = board.counts[board.counts.length - 1];

    // the board: layout between two wave counts
    var waves = board.counts.length - 1;
    var s = seg(p, T.spawn) * waves, wk = Math.min(Math.floor(s), waves - 1), wf = inOut(s - wk);
    if (p < T.spawn[0]) { wk = 0; wf = 0; }
    var L0 = layouts[wk], L1 = layouts[wk + 1];
    var tw = lerp(L0.w, L1.w, wf), th = lerp(L0.h, L1.h, wf);
    var fold = ease(seg(p, T.fold)), morph = ease(seg(p, T.morph));
    var tiles = [];
    for (var i = n - 1; i >= 0; i--) {
      var a, from, to;
      if (i < board.counts[wk]) { a = 1; from = slotPos(L0, board.slots[i]); to = slotPos(L1, board.slots[i]); }
      else if (i < board.counts[wk + 1]) { a = clamp(wf * 3); from = slotPos(L0, board.slots[board.parents[i]]); to = slotPos(L1, board.slots[i]); }
      else continue;
      tiles[i] = { a: a, x: lerp(from.x, to.x, wf), y: lerp(from.y, to.y, wf) };
    }
    // new sessions under their parents, so each one slides out from under the session it split off
    var cursors = [];
    for (i = n - 1; i >= 0; i--) {
      var t = tiles[i];
      if (!t || t.a <= 0) continue;
      var frameA = t.a * (i === 0 ? morph : 1) * (1 - fold);
      var M = drawTile(i, t.x, t.y, tw, th, frameA, frameA, i === 0 && morph < 1 ? 0 : frameA);
      cursors[i] = { x: M.cx, y: M.cy - M.ch / 2, w: M.cw, h: M.ch, a: t.a };
    }

    // the running count above the board
    var countA = seg(p, [T.spawn[0], T.spawn[0] + .04]) * (1 - fold);
    if (countA > 0) {
      var running = 0;
      for (i = 0; i < n; i++) if (tiles[i] && tiles[i].a >= .5) running++;
      var top = lerp(L0.top, L1.top, wf);
      ctx.globalAlpha = countA;
      ctx.font = '400 12px ' + MONO; ctx.textBaseline = 'middle';
      var label = running + ' running', lw = ctx.measureText(label).width;
      var ly = Math.max((narrow ? 56 : 64) + 14, top - 26);
      ctx.fillStyle = RUNNING; ctx.beginPath(); ctx.arc(W / 2 - lw / 2 - 8, ly, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PROMPT; ctx.fillText(label, W / 2 - lw / 2 + 2, ly);
      ctx.globalAlpha = 1;
    }

    // the prompt, typed, then moving into the first session's title
    if (morph < 1) {
      var M0 = metrics(tiles[0].x, tiles[0].y, tw, th);
      var size = L.size;
      ctx.font = '400 ' + size + 'px ' + MONO; ctx.textBaseline = 'middle';
      var pre = '> ', preW = ctx.measureText(pre).width;
      var startX = promptX();
      var text = PROMPT_TEXT.slice(0, p > .02 ? PROMPT_TEXT.length : typed);
      var fs = lerp(size, M0.titleSize, morph);
      var tx = lerp(startX + preW, M0.titleX, morph), ty = lerp(G.cy, M0.titleY, morph);
      ctx.globalAlpha = 1 - morph; ctx.fillStyle = PROMPT; ctx.fillText(pre, startX, G.cy);
      // the typed mono line becomes the session's sans title: crossfade while it moves
      var sw = ease(seg(morph, [.3, .7]));
      ctx.globalAlpha = 1 - sw; ctx.font = '400 ' + fs + 'px ' + MONO; ctx.fillStyle = INK;
      ctx.fillText(text, tx, ty);
      ctx.globalAlpha = sw; ctx.font = '600 ' + fs + 'px ' + SANS; ctx.fillStyle = TITLE;
      ctx.fillText(text, tx, ty);
      ctx.globalAlpha = 1;
      ctx.font = '400 ' + size + 'px ' + MONO;
      var endX = startX + preW + ctx.measureText(text).width + 2;
      var cw = lerp(size * .58, cursors[0].w, morph), ch = lerp(size * 1.1, cursors[0].h, morph);
      var on = typed < PROMPT_TEXT.length && p <= .02 ? true : blinkOn(0, now);
      block(lerp(endX, cursors[0].x, morph), lerp(G.cy - size * .55, cursors[0].y, morph), cw, ch, on ? 1 : 0);
      cursors[0] = null;
    }

    // the cursors: blinking in their sessions, then running together into the one block cursor
    // that stands where the line will be typed
    var gatherRaw = seg(p, T.gather);
    var B0 = monoBlock(L.size, L.capR);
    var tx2 = L.x0 + 2 + B0.w / 2, ty2 = L.cy + B0.top + B0.h / 2;
    var merged = false;
    for (i = n - 1; i >= 0; i--) { // the lead last, so it lies on top of the cursors reaching it
      var c = cursors[i];
      if (!c) continue;
      var delay = (i / Math.max(1, n - 1)) * .35;
      var g = inOut(clamp((gatherRaw - delay) / .65));
      if (g >= 1) { merged = true; continue; }
      // only the lead (0, first to arrive) grows into the block; the others keep their tile size
      // and slide under it, so the block keeps a clean edge while they arrive
      var sz = i === 0 ? g : 0;
      var w = lerp(c.w, B0.w, sz), h = lerp(c.h, B0.h, sz);
      var x = lerp(c.x + c.w / 2, tx2, g) - w / 2, y = lerp(c.y + c.h / 2, ty2, g) - h / 2;
      // the colour follows the same eased progress as the position: ink at rest, pop on arrival
      block(x, y, w, h, c.a * (g > 0 || blinkOn(i, now) ? 1 : 0), pop(g));
    }
    if (merged) drawLine(p, now, L);
    else { showCaps('0'); if (geom) restName(); }
  }

  // the line "Meet IVE", typed by the one block cursor, then growing: "Meet" and the cursor
  // go, the mono IVE moves onto the name's letters and dissolves into them while they grow to
  // full size
  function drawLine(p, now, L) {
    var k = p < LINE_AT ? 0 : Math.min(LINE_TEXT.length, Math.floor((p - LINE_AT) / LINE_STEP) + 1);
    var t = seg(p, T.grow), e = ease(t);
    var gro = t > 0 && geom; // the growth needs the name's measure
    var s0 = geom ? (L.capR * L.size) / geom.boxes[0].h : 1; // the name's scale at the line's size
    var sig = gro ? Math.pow(s0, 1 - e) : s0;                 // the name's scale now
    var q = gro ? sig / s0 : 1;                                // the line's scale now
    var fm = L.size * q, capH = L.capR * fm;
    var u = gro ? ease(seg(t, SHUFFLE)) : 0, d = gro ? ease(seg(t, DISSOLVE)) : 0, meetA = gro ? 1 - ease(seg(t, MEET)) : 1;
    // the anchor: the IVE's centre, moving from the typed line to the name's letters
    var ax = L.cx, ay = L.cy;
    if (gro) { ax = lerp(L.cx, geom.gc.x, e); ay = lerp(L.cy, geom.gc.y, e); }

    ctx.font = '400 ' + fm + 'px ' + MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = INK;
    for (var j = 0; j < k; j++) {
      var mx = ax + (L.x0 + (j + .5) * L.adv - L.cx) * q, my = ay, a = 1, i = j - L.ive;
      if (i < 0) a = meetA;
      else if (gro) {
        var b = geom.boxes[i];
        mx = lerp(mx, ax + (b.x + b.w / 2 - geom.gc.x) * sig, u);
        my = lerp(my, ay + (b.top + b.h / 2 - geom.gc.y) * sig, u);
        a = 1 - d;
      }
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      ctx.fillText(LINE_TEXT[j], mx, my + capH / 2);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';

    // the name's own letters: scaled to the line and shifted so their group sits on the anchor
    if (geom) {
      var dx = ax - geom.o.x - (geom.gc.x - geom.o.x) * sig, dy = ay - geom.o.y - (geom.gc.y - geom.o.y) * sig;
      setVar(intro, '--pro-scale', sig.toFixed(5));
      setVar(intro, '--pro-x', dx.toFixed(2) + 'px'); setVar(intro, '--pro-y', dy.toFixed(2) + 'px');
    }
    showCaps(d.toFixed(3));

    // the block cursor after the typed text; it goes as the type starts to grow (owner: no
    // cursor next to the big letters)
    var cursorA = gro ? 1 - ease(seg(t, CURSOR)) : 1;
    if (cursorA <= 0) return;
    var B = monoBlock(fm, L.capR);
    var bx = ax + (L.x0 + k * L.adv + 2 - L.cx) * q, by = ay + B.top;
    // solid while it goes, right after a keystroke, and alone on the dark ground before the
    // typing (a blink would leave the screen empty)
    var since = k > 0 ? p - (LINE_AT + (k - 1) * LINE_STEP) : 0;
    var solid = p < LINE_AT || since < SOLID_AFTER || t > 0;
    block(bx, by, B.w, B.h, solid || blinkOn(0, now) ? cursorA : 0, pop(1));
  }

  function frame(now) {
    var p = progress();
    var done = p >= 1;
    // the hand-over (ACCENT-BRIEF story): the header's dot takes the pop as the merged cursor
    // goes (1 - cursorA in drawLine), 1 once the prologue lies above. Set before the loop may
    // stop, so a page that opens or is restored below the prologue ends at 1 as well
    setVar(root, '--dot-pop', done ? '1' : ease(seg(seg(p, T.grow), CURSOR)).toFixed(3));
    if (!visible) { raf = 0; return; }
    var ready = intro.classList.contains('is-ready');
    if (ready !== geomReady) { geomReady = ready; geom = null; drawn = ''; }
    if (geom && intro.style.getPropertyValue('--name-size') !== geom.nameSize) { geom = null; drawn = ''; }
    var key = p.toFixed(4) + '|' + typed + '|' + blinkKey(now) + '|' + fontsReady + '|' + ready;
    // measured only before the unfold, where the name stands at the size the line grows into
    if (!geom && !done && ready && fontsReady && key !== drawn) geom = measureCaps();
    section.classList.toggle('is-done', done);
    section.classList.toggle('is-letters', p >= letterP && !!geom);
    setVar(section, '--name-hint', (1 - seg(p, T.hint)).toFixed(3));
    if (done) {
      restName(); showCaps('1');
    } else if (key !== drawn) { drawn = key; draw(p, now); }
    raf = requestAnimationFrame(frame);
  }
  var raf = 0;
  function start() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  function type() {
    if (typed >= PROMPT_TEXT.length) return;
    typed++;
    typeTimer = setTimeout(type, typed === 1 ? 90 : 48 + Math.random() * 40);
  }
  measure();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      start();
    }).observe(section);
  }
  window.addEventListener('resize', function () { measure(); start(); });
  window.addEventListener('pageshow', function () { measure(); start(); });
  // a jump back into the scene from far below (scrollbar, Home key): the observer answers only
  // after the paint, so the loop is resumed in the scroll step and draws before it
  window.addEventListener('scroll', function () {
    if (visible || raf) return;
    var r = section.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) { visible = true; start(); }
  }, { passive: true });
  var fontsLoad = document.fonts && document.fonts.load
    ? Promise.all([
        document.fonts.load("400 16px 'IBM Plex Mono'"),
        document.fonts.load("600 16px 'Source Sans 3'"),
        document.fonts.load("800 16px 'Archivo'")
      ]).catch(function () {})
    : Promise.resolve();
  fontsLoad.then(function () {
    fontsReady = true; drawn = '';
    clearTimeout(typeTimer);
    typeTimer = setTimeout(type, 450);
    measure();
  });
  start();
})();
