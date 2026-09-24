// Shared header, footer and helpers for every page.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const PAGES = [
  ['index.html', 'Home'],
  ['process.html', 'Process'],
  ['components.html', 'Components'],
  ['demo.html', 'Demo'],
  ['about.html', 'About'],
];

const SVG = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v5h5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M9 6l6 6-6 6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg>',
};

function renderChrome() {
  const here = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  const header = document.createElement('header');
  header.className = 'nav';
  header.innerHTML = `
    <div class="wrap">
      <a class="brand" href="index.html" aria-label="EcoShamp home">
        <img class="px" src="${IMG}leaf_logo.png" alt="">
        <span><b>ECOSHAMP</b><small>NATURAL SHAMPOO</small></span>
      </a>
      <button class="nav-toggle" aria-label="Menu" aria-expanded="false">☰</button>
      <ul>
        ${PAGES.map(([href, label]) => {
          const cur = href.replace('.html', '') === here;
          return `<li><a href="${href}"${cur ? ' aria-current="page"' : ''}>${label}</a></li>`;
        }).join('')}
      </ul>
      <a class="btn primary contact" href="about.html#contact">${SVG.mail} Contact</a>
    </div>`;
  document.body.prepend(header);
  const tog = $('.nav-toggle', header), ul = $('ul', header);
  tog.addEventListener('click', () => {
    const open = ul.classList.toggle('open');
    tog.setAttribute('aria-expanded', open);
  });

  const footer = document.createElement('footer');
  footer.innerHTML = `
    <div class="wrap">
      <div>
        <b class="display" style="color:var(--text)">EcoShamp</b> — automated natural-shampoo nano-factory.<br>
        CAP · Control Automático de Procesos · Universidad EAFIT, Medellín.
      </div>
      <div><a href="${REPO}" target="_blank" rel="noopener">Project repository on GitHub</a></div>
    </div>
    <div class="grass"></div>`;
  document.body.append(footer);
}

// Little bottles and fluid drops travelling along a production-line image.
// belt: element positioned over the conveyor; zones from STAGES.
function animateBelt(belt, opts = {}) {
  const tokens = [];
  const speed = opts.speed || (() => 1);
  const running = opts.running || (() => true);
  const fillAt = STAGES[4].zone[0] + 3;
  let last = performance.now(), spawnT = 0;
  function spawn() {
    const el = document.createElement('div');
    el.className = 'fluid-token';
    belt.append(el);
    tokens.push({ el, x: 1, bottle: false });
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (running()) {
      const v = 5.5 * speed();
      spawnT -= dt * speed();
      if (spawnT <= 0) { spawn(); spawnT = 1.6; }
      for (let i = tokens.length - 1; i >= 0; i--) {
        const t = tokens[i];
        t.x += v * dt;
        if (!t.bottle && t.x >= fillAt) { t.bottle = true; t.el.className = 'bottle-token'; }
        if (t.x > 97) { t.el.remove(); tokens.splice(i, 1); continue; }
        t.el.style.left = t.x + '%';
      }
    }
    requestAnimationFrame(frame);
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(frame);
  return { clear() { tokens.forEach(t => t.el.remove()); tokens.length = 0; spawnT = 0; } };
}

function spriteImgs(names, cls = 'px') {
  return names.map(n => `<img class="${cls}" src="${IMG}${n}.png" alt="">`).join('');
}

document.addEventListener('DOMContentLoaded', renderChrome);
