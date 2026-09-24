// Animated production line built from the pixel-art sprites.
// Drawn on a fixed 1536 × 250 canvas that is scaled to the container width.
function lineSim(host, opts = {}) {
  const W = 1536, H = 250, BELT = 206;
  const running = opts.running || (() => true);
  const speed = opts.speed || (() => 1);
  const P = IMG;
  const M = [ // [sprite, x, extra class]
    ['tank_h2o', 22], ['tank_leaf', 112], ['tank_flask', 204],
    ['mixer', 300], ['homogenizer', 470], ['filters', 648],
    ['filler', 846], ['robot_arm', 1086, 'arm'], ['labeler', 1216], ['boxes', 1402, 'boxes'],
  ];
  host.classList.add('ls-host');
  host.innerHTML = `
    <div class="ls" style="width:${W}px;height:${H}px">
      <div class="ls-sky"></div>

      ${[[40, 24, 60], [520, 12, 80], [980, 30, 70], [1320, 16, 90]].map(([x, y, d]) => `<i class="ls-cloud" style="left:${x}px;top:${y}px;animation-duration:${d}s"></i>`).join('')}
      <div class="ls-trees"></div>
      <svg class="ls-pipes" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        ${pipe('M64 62 V40 H150 V52')}${pipe('M150 40 H240 V56')}
        ${pipe('M240 40 H330 V70')}
        ${pipe('M420 86 V48 H505 V60')}
        ${pipe('M590 92 V44 H672 V70')}
        ${pipe('M790 74 V36 H880 V58')}
        ${pipe('M160 150 H300')}${pipe('M430 178 H470')}${pipe('M612 178 H648')}${pipe('M800 170 H846')}
      </svg>
      <div class="ls-belt" style="top:${BELT}px"></div>
      <div class="ls-legs" style="top:${BELT + 16}px"></div>
      <div class="ls-bottles"></div>
      ${M.map(([s, x, c = '']) => `<img class="px ls-m ${c}" src="${P}${s}.png" alt="" style="left:${x}px">`).join('')}
      <img class="px ls-gear" src="${P}f_gear.png" alt="" style="left:352px;top:52px">
      <img class="px ls-gear rev" src="${P}f_gear.png" alt="" style="left:527px;top:44px">
      ${[0, 1, 2, 3].map(k => `<i class="ls-drop" style="left:${880 + k * 30}px;animation-delay:${k * .25}s"></i>`).join('')}
      ${[[405, 150], [580, 160], [778, 130], [985, 148], [1236, 150]].map(([x, y], k) => `<i class="ls-led" style="left:${x}px;top:${y}px;animation-delay:${k * .37}s"></i>`).join('')}
      ${[0, 1, 2, 3, 4].map(k => `<i class="ls-bubble" style="left:${40 + k * 10}px;animation-delay:${k * .7}s"></i>`).join('')}
    </div>`;
  function pipe(d) { return `<path class="p" d="${d}"/><path class="f" d="${d}"/>`; }

  const ls = host.firstElementChild, bottles = ls.querySelector('.ls-bottles');
  const fit = () => { const s = host.clientWidth / W; ls.style.transform = `scale(${s})`; host.style.height = H * s + 'px'; };
  fit(); addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(host);

  const list = [];
  let last = performance.now(), spawn = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const on = running();
    ls.classList.toggle('paused', !on);
    if (on && !reduce) {
      const v = 70 * speed();
      spawn -= dt * speed();
      if (spawn <= 0) {
        spawn = 1.9;
        const b = document.createElement('img');
        b.src = P + 'final_bottle.png'; b.className = 'px ls-bottle'; b.alt = '';
        bottles.append(b); list.push({ b, x: 1040 });
      }
      for (let i = list.length - 1; i >= 0; i--) {
        const o = list[i]; o.x += v * dt;
        if (o.x > 1420) { o.b.remove(); list.splice(i, 1); continue; }
        o.b.style.left = o.x + 'px';
        o.b.classList.toggle('labeled', o.x > 1290);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { clear() { list.forEach(o => o.b.remove()); list.length = 0; } };
}
