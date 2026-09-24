// Procedural pixel-art rendering of the EcoShamp line for the demo page.
// Everything is drawn from code on a low-resolution canvas and driven by the
// simulation state `S` (demo.js): tank levels, scale weight, mixer rpm, filter
// clogging, and the labeling & packaging state machine (MEF) step by step.

function procLine(host, S, opts = {}) {
  const W = 640, H = 170, GY = 152, BY = 140;          // ground top, belt top
  const TOP = 38;                                      // rows of sky cropped from the view
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H - TOP; cv.className = 'pl-canvas';
  host.append(cv);
  const g = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- palette ----------
  const C = {
    out: '#1b2a33', s0: '#eef4f7', s1: '#c9d6dd', s2: '#9fb1bb', s3: '#71858f', s4: '#4b5d67',
    water: '#4aa8ff', water2: '#2f7fd6', surf: '#f2c14b', surf2: '#c9952a', add: '#86e08f', add2: '#4fae63',
    mix: '#9fe3b3', mix2: '#5fbf82', sham: '#8ff0b0', sham2: '#46b872',
    orange: '#f39a2b', orange2: '#b8661a', box: '#d9a15a', box2: '#a8743a', box3: '#f0c27d',
    green: '#5fe07c', amber: '#f3c13a', red: '#ff5d5d', off: '#2d4556', lcd: '#0c2b1c',
  };

  // ---------- pixel helpers ----------
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  const P = (x, y, c) => R(x, y, 1, 1, c);
  function line(x0, y0, x1, y1, c, t = 1) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      R(x0 - (t >> 1), y0 - (t >> 1), t, t, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }
  function disc(cx, cy, r, c) {
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(r * r - y * y + r * .6));
      R(cx - w, cy + y, w * 2 + 1, 1, c);
    }
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
  const clamp01 = k => Math.max(0, Math.min(1, k));

  // ---------- static scenery (pre-rendered) ----------
  const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
  (function scenery() {
    const b = bg.getContext('2d');
    const r = (x, y, w, h, c) => { b.fillStyle = c; b.fillRect(x, y, w, h); };
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // sky: the page's olive at the top, fading to the teal horizon, in dithered bands
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const top = hex(opts.skyTop || getComputedStyle(document.documentElement).getPropertyValue('--section').trim() || '#1d5a6e'), hor = hex('#3f8a93');
    const band = 6, y0 = TOP + 2, y1 = 112;
    const col = y => { const k = Math.max(0, Math.min(1, (y - y0) / (y1 - y0))); return `rgb(${top.map((c, i) => Math.round(c + (hor[i] - c) * k)).join(',')})`; };
    for (let y = 0; y < 125; y += band) {
      r(0, y, W, band, col(y));
      for (let x = (y / band) % 2; x < W; x += 2) r(x, y + band - 1, 1, 1, col(y + band));
    }
    // far city
    for (let x = 0; x < W;) {
      const w = 8 + (rnd() * 16 | 0), h = 18 + (rnd() * 42 | 0);
      r(x, 112 - h, w, h + 20, '#2b5f79');
      for (let wy = 112 - h + 4; wy < 108; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (rnd() > .55) r(wx, wy, 1, 2, '#4f8fa8');
      x += w + (rnd() * 4 | 0);
    }
    // tree line
    for (let x = -6; x < W + 6; x += 7 + (rnd() * 5 | 0)) {
      const rr = 7 + (rnd() * 6 | 0), cy = 118 - (rnd() * 8 | 0);
      for (let y = -rr; y <= rr; y++) {
        const w = Math.floor(Math.sqrt(rr * rr - y * y));
        r(x - w, cy + y, w * 2, 1, y < -rr / 3 ? '#3f9a4c' : y < rr / 3 ? '#2f7f3e' : '#23652f');
      }
      r(x - 1, cy + rr - 2, 2, 8, '#5b3b24');
    }
    r(0, 124, W, GY - 124, '#1f5a31');
    for (let x = 0; x < W; x += 3) r(x, 124 + (x % 7 === 0 ? 0 : 1), 2, 1, '#3f9a4c');
    // floor
    r(0, GY, W, H - GY, '#56666f');
    r(0, GY, W, 1, '#8ea1ab');
    for (let x = 0; x < W; x += 24) r(x, GY + 1, 1, H - GY, '#46555e');
    r(0, GY + 9, W, 1, '#46555e');
  })();

  // ---------- state for the packaging cell ----------
  const X = { FX: 396, S1: 440, S2: 468, S3: 498, PACK: 520, TUN0: 548, TUN1: 588, BOX: 602 };
  const BASE = { x: 502, y: 116 };
  const arm = { x: 512, y: 100 };
  let packs = [];          // packs moving to the tunnel / boxes
  let lastBottles = S.bottles, clock = 0, belt = 0, boxes = 0;
  const clouds = [[40, 50, 1], [220, 60, .7], [410, 46, 1.2], [560, 64, .8]];

  // ---------- building blocks ----------
  function lamp(x, y, on, c) { R(x, y, 3, 3, C.out); R(x + 1, y + 1, 1, 1, on ? c : C.off); if (on) { P(x + 1, y, c); } }
  function panel(x, y, run) {
    R(x, y, 12, 16, C.out); R(x + 1, y + 1, 10, 14, C.s2); R(x + 2, y + 2, 8, 5, C.lcd);
    R(x + 3, y + 3, (clock * 3 % 6 | 0) + 1, 1, run ? C.green : C.s4);
    R(x + 3, y + 5, 4, 1, run ? '#3fae63' : C.s4);
    lamp(x + 2, y + 10, run && (clock * 2 | 0) % 2 === 0, C.green); lamp(x + 7, y + 10, !run, S.t > 0 ? C.amber : C.red);
  }
  function legs(x, w, top) { for (const lx of [x + 2, x + w - 4]) { R(lx, top, 2, GY - top, C.s4); R(lx, GY - 1, 3, 1, C.out); } }
  function cylinder(x, y, w, h) {
    R(x, y, w, h, C.out);
    for (let i = 1; i < w - 1; i++) {
      const k = i / (w - 1);
      const c = k < .18 ? C.s1 : k < .32 ? C.s0 : k < .62 ? C.s1 : k < .82 ? C.s2 : C.s3;
      R(x + i, y + 1, 1, h - 2, c);
    }
    // dome
    for (let j = 0; j < 5; j++) { const inset = [6, 3, 2, 1, 0][j]; R(x + inset, y - 5 + j, w - inset * 2, 1, j === 0 ? C.out : C.s1); P(x + inset, y - 5 + j, C.out); P(x + w - inset - 1, y - 5 + j, C.out); }
    R(x, y + h - 2, w, 2, C.s3);
  }
  function liquidWindow(x, y, w, h, level, c1, c2, run, wave = 1) {
    R(x - 1, y - 1, w + 2, h + 2, C.out); R(x, y, w, h, '#16323f');
    const top = y + h - Math.round(h * clamp01(level));
    for (let i = 0; i < w; i++) {
      const s = run ? Math.round(Math.sin(clock * 4 + i * .9) * wave) : 0;
      const yy = Math.max(y, top + s);
      R(x + i, yy, 1, y + h - yy, c1);
      P(x + i, yy, c2 === undefined ? c1 : '#ffffff55');
    }
    R(x + 1, y + 1, 1, h - 2, '#ffffff22');
    for (let k = 0; k < 3 && run; k++) {   // bubbles
      const by = y + h - ((clock * 9 + k * 11) % Math.max(2, h * clamp01(level)));
      P(x + 1 + ((k * 3 + (clock * 2 | 0)) % Math.max(1, w - 2)), by | 0, '#ffffffaa');
    }
    return top;
  }
  function pipe(pts, flowColor, run, speed = 1) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const hz = y0 === y1;
      const x = Math.min(x0, x1), y = Math.min(y0, y1);
      if (hz) { R(x, y - 2, Math.abs(x1 - x0) + 1, 5, C.out); R(x, y - 1, Math.abs(x1 - x0) + 1, 3, C.s2); R(x, y - 1, Math.abs(x1 - x0) + 1, 1, C.s1); }
      else { R(x - 2, y, 5, Math.abs(y1 - y0) + 1, C.out); R(x - 1, y, 3, Math.abs(y1 - y0) + 1, C.s2); R(x - 1, y, 1, Math.abs(y1 - y0) + 1, C.s1); }
    }
    for (const [x, y] of pts.slice(1, -1)) { R(x - 3, y - 3, 7, 7, C.out); R(x - 2, y - 2, 5, 5, C.s2); P(x, y, C.s0); }
    if (!run) return;
    let total = 0; const seg = [];
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]); seg.push(l); total += l; }
    for (let d = (clock * 18 * speed) % 7; d < total; d += 7) {
      let rem = d, i = 0; while (i < seg.length && rem > seg[i]) rem -= seg[i++];
      if (i >= seg.length) break;
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], k = rem / seg[i];
      R(lerp(x0, x1, k) | 0, lerp(y0, y1, k) | 0, 2, 1, flowColor);
    }
  }
  function impeller(cx, top, len, r, rpm, run, c) {
    R(cx, top, 1, len, C.s4);
    const a = clock * (run ? rpm / 60 * Math.PI * 2 : 0) * .25;
    for (let b = 0; b < 3; b++) {
      const w = Math.round(Math.cos(a + b * 2.094) * r), yy = top + len - 2 - b % 2 * 5;
      R(Math.min(cx, cx + w), yy, Math.abs(w) + 1, 2, Math.cos(a + b * 2.094) > 0 ? C.s1 : C.s3);
    }
  }
  function gauge(cx, cy, k, c = C.red) {
    disc(cx, cy, 4, C.out); disc(cx, cy, 3, C.s0);
    const a = Math.PI * (.8 + 1.4 * clamp01(k));
    line(cx, cy, cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, c);
  }
  function motor(x, y, run) {
    R(x, y, 12, 8, C.out); R(x + 1, y + 1, 10, 6, '#3f6f96'); R(x + 1, y + 1, 10, 2, '#6aa0c8');
    for (let i = 0; i < 4; i++) R(x + 2 + i * 2 + ((run && (clock * 20 | 0) % 2) ? 1 : 0), y + 4, 1, 3, '#2c5171');
  }
  function bottle(x, fill, capped, labeled, wrap = false) {
    const bx = Math.round(x) - 3, by = BY - 14;
    R(bx, by + 3, 7, 11, C.out); R(bx + 1, by + 4, 5, 9, '#e6f7ee');
    const fh = Math.round(9 * clamp01(fill));
    if (fh) { R(bx + 1, by + 13 - fh, 5, fh, C.sham); R(bx + 1, by + 13 - fh, 5, 1, '#c9ffd9'); }
    R(bx + 1, by + 4, 1, 9, '#ffffff66');
    R(bx + 2, by + 1, 3, 2, C.out); R(bx + 2, by + 2, 3, 1, '#e6f7ee');
    if (capped) { R(bx + 1, by, 5, 2, C.out); R(bx + 2, by, 3, 1, '#3fae63'); }
    if (labeled) { R(bx + 1, by + 7, 5, 4, '#f7fbf9'); P(bx + 3, by + 8, '#3fae63'); P(bx + 2, by + 9, '#3fae63'); P(bx + 4, by + 9, '#3fae63'); }
    if (wrap) R(bx, by + 3, 7, 11, '#bfe8ff33');
  }
  function sensorBeam(x, hit) {
    R(x - 1, BY - 20, 2, 8, C.s4); R(x - 2, BY - 22, 4, 3, C.out); P(x - 1, BY - 21, hit ? C.green : C.red);
    if (hit || (clock * 4 | 0) % 2) for (let yy = BY - 12; yy < BY; yy += 2) P(x, yy, hit ? '#5fe07c99' : '#ff5d5d66');
  }

  // ---------- frame ----------
  function frame(dt) {
    const run = S.running;
    const f = S.speed / 100;
    if (run) clock += dt * f; else if (!reduce) clock += dt * .15;   // idle shimmer
    const m = S.mef, st = MEF[m.i], prog = clamp01(m.t / st.t);
    const ym = run && st.out.includes('YM');
    if (ym) belt += dt * f * 10;

    g.setTransform(1, 0, 0, 1, 0, -TOP);
    g.drawImage(bg, 0, 0);
    // clouds (always drift)
    for (const cl of clouds) {
      const x = ((cl[0] + performance.now() / 1000 * 3 * cl[2]) % (W + 60)) - 30, y = cl[1];
      R(x, y, 22, 4, '#dfeef4'); R(x + 4, y - 3, 12, 3, '#eef6f9'); R(x + 8, y - 5, 6, 2, '#f7fbfc'); R(x + 2, y + 4, 18, 1, '#bcd3de'); R(x + 14, y - 2, 6, 2, '#f3cadb');
    }

    // floor shadows under the machines
    for (const [x, w] of [[6, 110], [126, 70], [202, 64], [286, 72], [372, 48], [430, 160], [598, 42]]) R(x, GY, w, 2, 'rgba(0,0,0,.28)');
    // ===== Stage 1 — storage tanks =====
    const tanks = [[10, S.tanks.water, C.water, C.water2], [46, S.tanks.surf, C.surf, C.surf2], [82, S.tanks.add, C.add, C.add2]];
    for (const [x, lvl, c1, c2] of tanks) {
      legs(x, 30, 136);
      cylinder(x, 70, 30, 66);
      liquidWindow(x + 11, 80, 8, 48, lvl / 100, c1, c2, run);
      R(x + 3, 84, 5, 3, c1); R(x + 3, 84, 5, 1, c2);                          // colour tag
      R(x + 13, 60, 4, 5, C.out); R(x + 14, 61, 2, 3, C.s3);                     // ultrasonic sensor
      if (run) for (let k = 0; k < 2; k++) { const d = ((clock * 12 + k * 8) % 16) | 0; R(x + 12, 66 + d, 6, 1, `rgba(120,210,255,${(1 - d / 16) * .7})`); }
    }
    pipe([[25, 136], [25, 146], [118, 146], [118, 128], [132, 128]], C.water, run, f);
    pipe([[61, 136], [61, 146]], C.surf, run, f);
    pipe([[97, 136], [97, 146]], C.add, run, f);
    panel(106, 96, run);

    // ===== Stage 2 — weighing + mixing =====
    R(128, 140, 64, 4, C.out); R(129, 141, 62, 2, C.s2); legs(128, 64, 144);        // scale platform
    R(170, 128, 20, 11, C.out); R(171, 129, 18, 9, C.lcd);                           // scale display
    R(172, 131, Math.round(14 * clamp01(S.scale / 60)), 3, C.green);
    for (let i = 0; i < 4; i++) P(172 + i * 4, 135, '#3fae63');
    cylinder(134, 88, 34, 50);
    const potTop = liquidWindow(140, 98, 22, 34, S.pot / 250, C.mix, C.mix2, run, 1);
    impeller(151, 82, Math.max(8, potTop - 82 + 10), 9, S.rpm, run, C.s1);
    motor(145, 72, run);
    pipe([[168, 110], [182, 110], [182, 60], [224, 60], [224, 70]], C.mix, run, f);
    panel(176, 88, run);

    // ===== Stage 3 — homogenizer =====
    legs(206, 56, 136);
    cylinder(206, 72, 56, 64);
    const hTop = liquidWindow(214, 82, 40, 46, S.homLevel / 100, C.mix, C.mix2, run, 1 + (S.rpm > 150));
    if (run) { const dip = Math.round(S.rpm / 60); for (let i = -dip; i <= dip; i++) R(234 + i, hTop, 1, dip - Math.abs(i) + 1, '#16323f'); }
    impeller(234, 66, Math.max(10, hTop - 66 + 14), 13, S.rpm, run, C.s1);
    motor(228, 56, run);
    gauge(248, 78, (S.homTemp - 20) / 12);
    pipe([[262, 124], [274, 124], [274, 58], [296, 58], [296, 66]], C.mix, run, f);
    panel(266, 94, run);

    // ===== Stage 4 — filtration =====
    const drops = [[.25 + S.clog * .3], [.5 + S.clog * .6], [.8 + S.clog * .9]];
    for (let k = 0; k < 3; k++) {
      const x = 290 + k * 22;
      legs(x, 14, 124);
      R(x, 72, 14, 52, C.out);
      for (let i = 1; i < 13; i++) R(x + i, 73, 1, 50, ['#b9a5c9', '#d4c4e0', '#e6dcef', '#c9b6d8', '#a893ba', '#8e7aa1'][Math.min(5, i / 2.2 | 0)]);
      R(x + 2, 70, 10, 3, C.s3); R(x + 2, 124, 10, 3, C.s3);
      R(x + 4, 78, 6, 40, `rgba(60,40,30,${Math.min(.55, S.clog * (.3 + k * .15))})`);   // clogging
      if (run) for (let p = 0; p < 6; p++) {
        const yy = 78 + ((clock * 16 * f + p * 7 + k * 3) % 40);
        R(x + 5 + (p % 3), yy | 0, k === 0 ? 2 : 1, k === 0 ? 2 : 1, k === 0 ? '#c9a46e' : k === 1 ? '#e9dcc5' : '#ffffff');
      }
      gauge(x + 7, 64, run ? drops[k][0] / 1.8 : 0);
      if (k < 2) pipe([[x + 14, 120], [x + 22, 120]], C.mix, run, f);
    }
    pipe([[356, 120], [362, 120], [362, 50], [390, 50], [390, 62]], C.sham, run, f);
    panel(342, 132 - 16, run);

    // ===== Belt (stages 5–7) =====
    R(364, BY, 276, 6, C.out); R(364, BY + 1, 276, 4, C.s3);
    for (let x = 364 - (belt % 8); x < W; x += 8) { if (x >= 364) { R(x, BY + 1, 4, 1, C.s2); } }
    for (let x = 368; x < W; x += 12) { disc(x, BY + 3, 2, C.out); disc(x, BY + 3, 1, C.s1); const a = belt * .6; P(x + Math.round(Math.cos(a)), BY + 3 + Math.round(Math.sin(a)), C.out); }
    for (let x = 372; x < W; x += 40) { R(x, BY + 6, 3, GY - BY - 6, C.s4); }

    // ===== Stage 5 — filler =====
    R(376, 62, 40, 22, C.out); R(377, 63, 38, 20, C.s1); R(377, 63, 38, 3, C.s0);         // reservoir
    liquidWindow(382, 67, 28, 12, .7, C.sham, C.sham2, run, 1);
    R(378, 84, 3, BY - 84, C.s3); R(411, 84, 3, BY - 84, C.s3);                            // gantry
    R(376, 84, 40, 4, C.out); R(377, 85, 38, 2, C.s2);
    const filling = st.id === 'llenadoEnvase';
    R(X.FX - 2, 88, 5, 10, C.out); R(X.FX - 1, 89, 3, 8, C.s2); R(X.FX - 1, 97, 3, 2, C.out);   // nozzle
    if (run && filling && prog > .12) for (let yy = 99; yy < BY - 10 + 8 * (1 - prog); yy++) P(X.FX + ((yy + (clock * 30 | 0)) % 3 === 0 ? 1 : 0), yy, C.sham);
    panel(418, 96, run);

    // ===== Stage 6 — capper, labeler, robot, heat tunnel =====
    // capper (station 1)
    const capDown = st.id === 'BANDA_Y_SENSORP' && prog > .65 ? Math.sin((prog - .65) / .35 * Math.PI) : 0;
    R(X.S1 - 9, 86, 3, BY - 86, C.s3); R(X.S1 + 7, 86, 3, BY - 86, C.s3); R(X.S1 - 10, 84, 20, 4, C.out); R(X.S1 - 9, 85, 18, 2, C.s2);
    R(X.S1 - 1, 88, 3, 8 + capDown * 16, C.s4); R(X.S1 - 4, 95 + capDown * 16, 9, 4, C.out); R(X.S1 - 3, 96 + capDown * 16, 7, 2, '#3fae63');
    // labeler (station 2)
    const labOn = st.id === 'SENSOR2' && run;
    R(X.S2 - 10, 96, 22, 30, C.out); R(X.S2 - 9, 97, 20, 28, C.s1); R(X.S2 - 9, 97, 20, 3, C.s0);
    disc(X.S2 - 2, 108, 6, C.out); disc(X.S2 - 2, 108, 5, '#f7fbf9'); disc(X.S2 - 2, 108, 2, C.s3);
    const la = labOn ? clock * 10 : 0; P(X.S2 - 2 + Math.round(Math.cos(la) * 4), 108 + Math.round(Math.sin(la) * 4), '#3fae63');
    R(X.S2 + 5, 120, 6, 6, C.s3); R(X.S2 + 2, 124 + (labOn && prog > .6 ? 1 : 0), 4, 2, '#f7fbf9');
    // tower light (lower machine lamps)
    const moving = run && ym, atSensor = run && !ym;
    R(426, 92, 5, 48, C.s4);
    [[C.green, moving], [C.amber, atSensor], [C.red, !run]].forEach(([c, on], k) => { R(424, 76 + k * 6, 9, 6, C.out); R(425, 77 + k * 6, 7, 4, on ? c : C.off); if (on) R(425, 77 + k * 6, 7, 1, '#ffffffaa'); });

    // heat tunnel
    const heat = clamp01((S.tunnel - 20) / 120);
    R(X.TUN0, 104, X.TUN1 - X.TUN0, 36, C.out); R(X.TUN0 + 1, 105, X.TUN1 - X.TUN0 - 2, 34, C.s2);
    R(X.TUN0 + 4, 110, X.TUN1 - X.TUN0 - 8, 26, '#1b1410');
    for (let i = 0; i < 4; i++) R(X.TUN0 + 7 + i * 8, 112, 4, 3, `rgb(${120 + heat * 135},${60 + heat * 60},${30})`);
    R(X.TUN0 + 4, 134, X.TUN1 - X.TUN0 - 8, 2, `rgba(255,${120 + heat * 60},40,${.25 + heat * .5})`);
    R(X.TUN0 + 2, 100, X.TUN1 - X.TUN0 - 4, 4, C.s3);
    if (run) for (let k = 0; k < 3; k++) { const yy = 100 - ((clock * 8 + k * 5) % 16); P(X.TUN0 + 10 + k * 10 + Math.round(Math.sin(clock * 3 + k) * 2), yy | 0, '#dbe7ee88'); }

    // pack pallet
    R(X.PACK - 4, BY - 1, 24, 1, C.box2);

    // --- robot targets from the state machine
    const slot = k => X.PACK + 2 + k * 7;
    let target = { x: 512, y: 98 }, held = false, active = null;
    const c = m.c;
    switch (st.id) {
      case 'Start': active = { x: lerp(372, X.FX, ease(prog)), fill: 0 }; break;
      case 'llenadoEnvase': active = { x: X.FX, fill: prog }; break;
      case 'BANDA_Y_SENSORP': active = { x: lerp(X.FX, X.S1, ease(Math.min(1, prog / .65))), fill: 1, cap: prog > .8 }; break;
      case 'SENSOR2': active = { x: lerp(X.S1, X.S2, ease(Math.min(1, prog / .6))), fill: 1, cap: 1, lab: prog > .75 }; break;
      case 'SENSOR3': {
        const k = prog;
        if (k < .4) { active = { x: lerp(X.S2, X.S3, ease(k / .4)), fill: 1, cap: 1, lab: 1 }; target = { x: X.S3, y: 104 }; }
        else if (k < .7) { active = { x: X.S3, fill: 1, cap: 1, lab: 1 }; target = { x: X.S3, y: BY - 18 }; }
        else { held = true; target = { x: X.S3, y: 104 }; }
        break;
      }
      case 'BANDAT': held = true; target = { x: lerp(X.S3, slot(c), ease(prog)), y: 100 }; break;
      case 'UBICACIONFINAL': held = prog < .8; target = { x: slot(c), y: lerp(100, BY - 18, ease(Math.min(1, prog / .8))) }; break;
    }
    if (!run && S.t === 0) { active = null; target = { x: 512, y: 98 }; held = false; }
    // smooth arm
    const kk = 1 - Math.exp(-dt * (run ? 10 * f : 4));
    arm.x += (target.x - arm.x) * kk; arm.y += (target.y - arm.y) * kk;

    // bottles already in the current pack
    for (let k = 0; k < c; k++) bottle(slot(k), 1, 1, 1);
    // packs travelling through the tunnel to the boxes
    if (S.bottles > lastBottles && c === 0) packs.push({ x: X.PACK });
    if (S.bottles < lastBottles) packs = [];
    lastBottles = S.bottles;
    for (let i = packs.length - 1; i >= 0; i--) {
      const p = packs[i];
      if (run) p.x += dt * f * 16;
      const wrapped = p.x + 14 > X.TUN1;
      for (let k = 0; k < 3; k++) bottle(p.x + 2 + k * 7, 1, 1, 1, wrapped);
      if (wrapped) { R(p.x - 2, BY - 13, 20, 12, '#bfe8ff22'); R(p.x - 2, BY - 13, 20, 1, '#e6f7ff66'); }
      if (p.x > X.BOX - 18) packs.splice(i, 1);
    }
    boxes = Math.floor(S.bottles / 3) - packs.length;

    // active bottle on the belt
    if (active) bottle(active.x, active.fill, active.cap, active.lab);
    // sensors (X1 / X2 / position)
    const near = x => active && Math.abs(active.x - x) < 2.5;
    sensorBeam(X.FX - 8, near(X.FX)); sensorBeam(X.S1 - 7, near(X.S1)); sensorBeam(X.S2 + 8, near(X.S2)); sensorBeam(X.S3 + 8, near(X.S3));

    // tunnel front (bottles pass behind the curtain)
    for (let x = X.TUN0 + 4; x < X.TUN1 - 4; x += 3) R(x, 110, 2, 18 + ((x + (clock * 6 | 0)) % 4), '#6b7f8a66');

    // robot arm (2-link IK)
    R(BASE.x - 7, 124, 14, 16, C.out); R(BASE.x - 6, 125, 12, 15, C.orange2); R(BASE.x - 6, 125, 12, 2, C.orange); R(BASE.x - 9, 138, 18, 3, C.out);
    R(BASE.x - 3, BASE.y, 6, 10, C.out); R(BASE.x - 2, BASE.y, 4, 10, C.s3);
    const L1 = 19, L2 = 19;
    let dx = arm.x - BASE.x, dy = arm.y - 6 - BASE.y, d = Math.hypot(dx, dy);
    d = Math.max(Math.abs(L1 - L2) + 1, Math.min(L1 + L2 - .5, d));
    const a2 = Math.acos((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2));
    const a1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(-a2), L1 + L2 * Math.cos(-a2));
    const ex = BASE.x + Math.cos(a1) * L1, ey = BASE.y + Math.sin(a1) * L1;
    const wx = ex + Math.cos(a1 - a2) * L2, wy = ey + Math.sin(a1 - a2) * L2;
    line(BASE.x, BASE.y, ex, ey, C.out, 6); line(BASE.x, BASE.y, ex, ey, C.orange, 4); line(BASE.x, BASE.y - 1, ex, ey - 1, '#ffc27a', 1);
    line(ex, ey, wx, wy, C.out, 5); line(ex, ey, wx, wy, C.orange, 3); line(ex, ey - 1, wx, wy - 1, '#ffc27a', 1);
    disc(BASE.x, BASE.y, 4, C.out); disc(BASE.x, BASE.y, 3, C.s3); P(BASE.x, BASE.y, C.s0);
    disc(ex | 0, ey | 0, 3, C.out); disc(ex | 0, ey | 0, 2, C.s2); P(ex, ey, C.s0);
    R(wx - 1, wy, 3, 5, C.s4);
    const grip = held ? 3 : 5;
    R(wx - grip, wy + 5, grip * 2 + 1, 1, C.out); R(wx - grip, wy + 5, 1, 4, C.out); R(wx + grip, wy + 5, 1, 4, C.out);
    if (held) { const hb = { x: wx, y: wy + 6 }; g.save(); g.translate(0, Math.round(hb.y - (BY - 14))); bottle(hb.x, 1, 1, 1); g.restore(); }

    // ===== Stage 7 — boxes =====
    R(X.BOX - 2, GY - 4, 40, 4, C.box2); R(X.BOX - 2, GY - 4, 40, 1, C.box3);
    for (let i = 0; i < Math.min(6, Math.max(0, boxes)); i++) {
      const bx = X.BOX + (i % 2) * 17, by = GY - 4 - 13 * (1 + (i / 2 | 0));
      R(bx, by, 16, 13, C.out); R(bx + 1, by + 1, 14, 11, C.box); R(bx + 1, by + 1, 14, 2, C.box3); R(bx + 7, by + 1, 2, 11, C.box2);
      R(bx + 3, by + 6, 3, 3, '#3fae63'); P(bx + 4, by + 5, '#7ee39a');
    }
    // final bottle marker
    bottle(W - 6, 1, 1, 1);
  }

  // soft light from the top-left and a vignette, pre-rendered
  const fx = document.createElement('canvas'); fx.width = W; fx.height = H;
  (function () {
    const c = fx.getContext('2d');
    const lg = c.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, 'rgba(255,240,200,.07)'); lg.addColorStop(.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,10,20,.12)');
    c.fillStyle = lg; c.fillRect(0, 0, W, H);
    const vg = c.createLinearGradient(0, TOP, 0, H); vg.addColorStop(0, 'rgba(0,0,0,.18)'); vg.addColorStop(.25, 'rgba(0,0,0,0)'); vg.addColorStop(.9, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.25)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  })();

  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    frame(dt);
    g.drawImage(fx, 0, 0);
    requestAnimationFrame(loop);
  })(last);

  cv.addEventListener('click', e => {
    if (!opts.onPick) return;
    const x = (e.offsetX / cv.clientWidth) * W;
    const z = (opts.zones || []).findIndex(([a, b]) => x >= a * W / 100 && x < b * W / 100);
    if (z >= 0) opts.onPick(z);
  });
  return { clear() { packs = []; lastBottles = 0; }, canvas: cv };
}
