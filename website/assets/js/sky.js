// Pixel-art sky behind every page banner: drifting clouds in three depth
// layers and, now and then, a small plane with blinking lights and a contrail.
// Drawn at 1/3 resolution and scaled up so it matches the procedural line.

function bannerSky(banner) {
  const PX = 3;
  const cv = document.createElement('canvas');
  cv.className = 'sky-canvas';
  cv.setAttribute('aria-hidden', 'true');
  banner.prepend(cv);
  const g = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, skyH = 0, clouds = [], plane = null, nextPlane = 4 + Math.random() * 6;

  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // A cloud is a set of overlapping puffs, pre-rendered to its own canvas
  // with a lit top, a shaded base and a faint pink rim like the asset sheets.
  function makeCloud(scale) {
    const w = Math.round((26 + rnd() * 30) * scale), h = Math.round((9 + rnd() * 6) * scale);
    const c = document.createElement('canvas'); c.width = w + 4; c.height = h + 8;
    const x = c.getContext('2d');
    const puffs = [];
    const n = 3 + (rnd() * 3 | 0);
    for (let i = 0; i < n; i++) {
      const r = Math.round((h * .45) + rnd() * h * .35);
      puffs.push([Math.round(2 + r + (w - 2 * r) * (i / Math.max(1, n - 1))), Math.round(h + 4 - r * (.7 + rnd() * .5)), r]);
    }
    const fill = (dy, col, shrink = 0) => {
      x.fillStyle = col;
      for (const [cx, cy, r0] of puffs) {
        const r = r0 - shrink;
        for (let yy = -r; yy <= r; yy++) {
          const ww = Math.floor(Math.sqrt(r * r - yy * yy + r * .5));
          x.fillRect(cx - ww, cy + yy + dy, ww * 2 + 1, 1);
        }
      }
      x.fillRect(4, h + 1 + dy, w - 4, 3);
    };
    fill(1, '#9fbfcc');           // shadow
    fill(0, '#d7e8ee');           // body
    fill(-1, '#f4fafc', 2);       // lit top
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = 'rgba(243,202,219,.55)'; x.fillRect(0, h + 1, w + 4, 7);   // pink underside
    return c;
  }

  const cloudY = () => 2 + rnd() * Math.max(4, skyH * .75 - 14);

  function resize() {
    const r = banner.getBoundingClientRect();
    const nw = Math.ceil(r.width / PX), nh = Math.ceil(r.height / PX);
    if (nw === W && nh === H) return;
    W = nw; H = nh; cv.width = W; cv.height = H;
    // keep clouds and planes in the open sky above the animated line
    const stop = banner.querySelector('#line-sim, .demo-line, #asim, #pline');
    skyH = stop ? Math.max(20, stop.offsetTop / PX) : H;
    if (!clouds.length) {
      const count = Math.max(4, Math.round(W / 70));
      for (let i = 0; i < count; i++) {
        const layer = i % 3;                       // 0 far, 2 near
        const scale = [.6, .85, 1.1][layer];
        clouds.push({ img: makeCloud(scale), x: rnd() * W, y: cloudY(), v: [1.2, 2.2, 3.4][layer], a: [.35, .5, .65][layer] });
      }
      clouds.sort((a, b) => a.v - b.v);
    }
  }

  function drawPlane(p) {
    const dir = p.dir, x = Math.round(p.x), y = Math.round(p.y);
    // contrail
    for (let i = 0; i < p.trail.length; i++) {
      const [tx, ty, age] = p.trail[i];
      const a = Math.max(0, .5 - age / 10);
      if (a <= 0) continue;
      g.fillStyle = `rgba(235,245,250,${a})`;
      g.fillRect(Math.round(tx), Math.round(ty) + (age > 3 ? 1 : 0), 2, 1);
    }
    // body (pointing in `dir`)
    const px = (dx, dy, c) => { g.fillStyle = c; g.fillRect(x + dx * dir, y + dy, 1, 1); };
    const body = '#e9f1f4', shade = '#9fb1bb', wing = '#c9d6dd';
    for (let i = -6; i <= 5; i++) px(i, 0, body);
    for (let i = -5; i <= 4; i++) px(i, 1, shade);
    px(6, 1, body); px(5, 0, '#6aa0c8');                         // nose + cockpit
    for (let i = 0; i < 4; i++) px(-1 - i, -1 - i * .5 | 0, wing);   // wing
    px(-1, 2, wing); px(-2, 2, wing); px(-2, 3, wing);
    px(-6, -1, body); px(-6, -2, body); px(-7, -2, body);         // tail fin
    const blink = (performance.now() / 350 | 0) % 2;
    px(-7, -3, blink ? '#ff5d5d' : '#5a2a2a');
    px(-4, -2, blink ? '#5a2a2a' : '#5fe07c');
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    resize();
    g.clearRect(0, 0, W, H);
    for (const c of clouds) {
      if (!reduce) c.x += c.v * dt;
      if (c.x > W + 4) { c.x = -c.img.width - 4; c.y = cloudY(); }
      g.globalAlpha = c.a; g.drawImage(c.img, Math.round(c.x), Math.round(c.y)); g.globalAlpha = 1;
    }
    if (!reduce) {
      nextPlane -= dt;
      if (!plane && nextPlane <= 0) {
        const dir = Math.random() < .5 ? 1 : -1;
        plane = { dir, x: dir > 0 ? -12 : W + 12, y: 5 + Math.random() * Math.max(4, skyH * .35), v: 16 + Math.random() * 8, climb: (Math.random() - .5) * .8, trail: [] };
      }
      if (plane) {
        plane.x += plane.v * plane.dir * dt; plane.y += plane.climb * dt;
        plane.trail.push([plane.x - 7 * plane.dir, plane.y, 0]);
        plane.trail.forEach(t => { t[2] += dt; });
        plane.trail = plane.trail.filter(t => t[2] < 5);
        drawPlane(plane);
        if (plane.x < -40 || plane.x > W + 40) { plane = null; nextPlane = 14 + Math.random() * 16; }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', () => $$('.banner').forEach(bannerSky));
