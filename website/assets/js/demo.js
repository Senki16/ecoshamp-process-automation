// Interactive demo page: controls, readings, tabs and chart.
// The simulation model lives in sim.js, the line drawing in procline.js.

// ---- UI
document.addEventListener('DOMContentLoaded', () => {
  let sel = 0, tab = 'flow';

  // stepper + line labels
  $('#dstep').innerHTML = STAGES.map((s, i) => `${i ? '<span class="arrow-sep" aria-hidden="true">→</span>' : ''}<button class="step" data-i="${i}"><span class="num ghost">${s.n}</span><span>${esc(s.name)}</span></button>`).join('');
  $('#dline').insertAdjacentHTML('beforeend',
    STAGES.map((s, i) => `<div class="zone" data-i="${i}" style="left:${PROC_ZONES[i][0]}%;width:${PROC_ZONES[i][1] - PROC_ZONES[i][0]}%"></div>`).join('') +
    STAGES.map((s, i) => `<button class="lbl" data-i="${i}" style="left:${(PROC_ZONES[i][0] + PROC_ZONES[i][1]) / 2}%"><span class="num">${s.n}</span>${esc(s.short)}</button>`).join(''));
  $('#live-sel').innerHTML = $('#chart-stage').innerHTML = STAGES.map((s, i) => `<option value="${i}">Stage ${s.n} · ${esc(s.short)}</option>`).join('');

  const belt = procLine($('#dsim'), sim, { zones: PROC_ZONES, onPick: i => pick(i) });

  // controls
  const setBtns = () => {
    $('#start').disabled = sim.running; $('#pause').disabled = !sim.running;
    $('#sim-state').innerHTML = sim.running
      ? '<span class="status-dot" style="background:var(--green)"></span>Running'
      : sim.t > 0 ? '<span class="status-dot" style="background:var(--amber)"></span>Paused'
      : '<span class="status-dot" style="background:var(--red)"></span>Stopped';
  };
  $('#start').onclick = () => { sim.running = true; setBtns(); };
  $('#pause').onclick = () => { sim.running = false; setBtns(); };
  $('#reset').onclick = () => {
    Object.assign(sim, { running: false, t: 0, tanks: { water: 75, surf: 60, add: 45 }, scale: 0, pot: 0, clog: 0, integrity: 100, bottles: 0, filled: 0, rejected: 0, mef: { i: 0, t: 0, c: 0 }, tunnel: 22, hist: {} });
    belt.clear(); setBtns(); paint();
  };
  $$('.param input').forEach(inp => {
    const upd = () => {
      sim[inp.name] = +inp.value;
      inp.style.setProperty('--p', ((inp.value - inp.min) / (inp.max - inp.min) * 100) + '%');
      $(`output[for=${inp.id}]`).textContent = inp.value + ' ' + inp.dataset.u;
    };
    inp.oninput = upd; upd();
  });

  const pick = i => { sel = i; $('#live-sel').value = i; $('#chart-stage').value = i; fillChartMetrics(); paintStatic(); paint(); };
  document.body.addEventListener('click', e => {
    const b = e.target.closest('#dstep .step, #dline .lbl');
    if (b) pick(+b.dataset.i);
  });
  $('#live-sel').onchange = e => pick(+e.target.value);
  $('#chart-stage').onchange = e => pick(+e.target.value);
  $$('.tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; $$('.tabs button').forEach(x => x.classList.toggle('active', x === b)); paintStatic(); paint(); });

  function fillChartMetrics() {
    const opts = readings(STAGES[sel].n).filter(r => typeof r[1] === 'number' && r[4] !== -1);
    $('#chart-metric').innerHTML = opts.map(r => `<option>${esc(r[0])}</option>`).join('');
  }
  $('#chart-metric').onchange = () => drawChart();

  // parts that only change with the selected stage / tab
  function paintStatic() {
    const s = STAGES[sel];
    $$('#dstep .step').forEach((b, j) => b.classList.toggle('active', j === sel));
    $$('#dline .lbl').forEach((b, j) => b.classList.toggle('active', j === sel));
    $$('#dline .zone').forEach((z, j) => z.classList.toggle('active', j === sel));
    $('#info').innerHTML = `
      <div class="info-scene">${spriteImgs(s.sprites)}</div>
      <div class="info-title"><span class="num">${s.n}</span>${esc(s.name)}</div>
      <p class="info-desc">${esc(s.summary)} ${esc(s.flow.map(f => f[0]).join(' → '))}.</p>
      <div class="eyebrow" style="margin-top:12px;font-size:12px">Key elements</div>
      <div class="key-el">${[...s.sensors.slice(0, 2), ...s.actuators.slice(0, 2)].map(([ic, n]) => `<div><img class="px" src="${ICON}${ic}.png" alt="">${esc(n)}</div>`).join('')}</div>
      <div class="info-btns"><a class="btn primary" href="process.html#${s.id}">View details</a><a class="btn" href="components.html">Show components</a></div>`;
    $('#chart-box').hidden = tab !== 'chart';
    $('#tab-dyn').hidden = tab === 'chart';
  }

  // The tab is built once per stage/tab; later paints only update the live values,
  // so the images are not reloaded (and do not flicker) four times a second.
  let tabKey = '';
  const OUT_NAMES = { YA: 'Bottle filling', YV: 'Positioner (empty-bottle position)', Y1: 'Station 1', Y2: 'Station 2', Y3: 'Station 3', YM: 'Conveyor motor' };
  function paintTab() {
    const s = STAGES[sel], r = readings(s.n);
    const key = sel + '|' + tab;
    if (tab === 'flow') {
      const n = s.sprites.length === 1 ? 1 : s.sprites.length;
      if (key !== tabKey) {
        $('#tab-dyn').innerHTML = `<div class="pf">${s.sprites.map((sp, k) => `
          <figure>${k < n && r[k] ? `<figcaption>${esc(r[k][0])}<b data-v="${k}"></b></figcaption>` : ''}<img class="px" src="${IMG}${sp}.png" alt=""></figure>`).join('')}
          ${s.n < 7 ? `<div class="arrow">To ${esc(STAGES[s.n].short)}<br>→</div>` : ''}</div>
          <div class="flow">${s.flow.map(([h, p], k) => `<div class="flow-step"><h4><span class="num">${k + 1}</span>${esc(h)}</h4><p>${esc(p)}</p></div>`).join('')}</div>`;
      }
      $$('#tab-dyn [data-v]').forEach(el => { el.innerHTML = fmtReading(r[+el.dataset.v]); });
    } else if (tab === 'io') {
      const cur = MEF[sim.mef.i];
      const acts = s.n === 6
        ? MEF_OUTPUTS.map(([o, p]) => ['a_onoff_switch', `${o} — ${OUT_NAMES[o]}`, `ESP32 pin ${p}`, sim.running && cur.out.includes(o)])
        : s.actuators.map(([ic, n, d]) => [ic, n, d, sim.running]);
      if (key !== tabKey) {
        const row = ([ic, n, d], attr) => `<div class="io-row"><img class="px" src="${ICON}${ic}.png" alt=""><div>${esc(n)}${d ? `<div class="muted small">${esc(d)}</div>` : ''}</div><span class="st" ${attr}></span></div>`;
        $('#tab-dyn').innerHTML = `<div class="io-list">
          <div><h4><span class="chip sensor">Sensors</span></h4>${s.sensors.map(x => row(x, 'data-sensor')).join('')}</div>
          <div><h4><span class="chip actuator">${s.n === 6 ? 'Controller outputs' : 'Actuators'}</span></h4>${acts.map((x, k) => row(x, `data-act="${k}"`)).join('')}</div>
        </div>`;
      }
      $$('#tab-dyn [data-sensor]').forEach(el => { el.textContent = sim.running ? 'READING' : 'IDLE'; el.classList.toggle('on', sim.running); });
      $$('#tab-dyn [data-act]').forEach(el => { const on = acts[+el.dataset.act][3]; el.textContent = on ? 'ON' : 'OFF'; el.classList.toggle('on', on); });
    }
    tabKey = key;
  }

  // ---- chart (single series, crosshair tooltip)
  const cv = $('#chart'), tip = $('#chart-tip');
  let pts = [];
  function drawChart(hoverX) {
    const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (!W) return;
    cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const key = STAGES[sel].n + '|' + $('#chart-metric').value;
    const data = sim.hist[key] || [];
    const unit = (readings(STAGES[sel].n).find(r => r[0] === $('#chart-metric').value) || [])[2] || '';
    const L = 48, R = 12, T = 12, B = 26;
    g.font = '11px Inter, sans-serif'; g.fillStyle = '#7896a3';
    if (data.length < 2) { g.fillText('Start the simulation to record data.', L, H / 2); pts = []; return; }
    let lo = Math.min(...data.map(d => d[1])), hi = Math.max(...data.map(d => d[1]));
    if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
    const pad = (hi - lo) * .12; lo -= pad; hi += pad;
    const t0 = data[0][0], t1 = data[data.length - 1][0];
    const X = t => L + (t - t0) / Math.max(1e-6, t1 - t0) * (W - L - R);
    const Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    g.strokeStyle = 'rgba(169,195,204,.14)'; g.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const v = lo + (hi - lo) * k / 4, y = Y(v);
      g.beginPath(); g.moveTo(L, y); g.lineTo(W - R, y); g.stroke();
      g.fillText(fmt(v, Math.abs(hi - lo) < 5 ? 1 : 0), 4, y + 4);
    }
    g.fillText(`${fmt(t1 - t0, 0)} s window · ${unit}`, L, H - 8);
    g.strokeStyle = '#5fe07c'; g.lineWidth = 2; g.lineJoin = 'round';
    g.beginPath(); data.forEach(([t, v], k) => k ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v))); g.stroke();
    pts = data.map(([t, v]) => [X(t), Y(v), t, v]);
    if (hoverX != null) {
      let best = pts[0]; for (const p of pts) if (Math.abs(p[0] - hoverX) < Math.abs(best[0] - hoverX)) best = p;
      g.strokeStyle = 'rgba(231,244,239,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(best[0], T); g.lineTo(best[0], H - B); g.stroke();
      g.fillStyle = '#5fe07c'; g.strokeStyle = '#071d30'; g.lineWidth = 2; g.beginPath(); g.arc(best[0], best[1], 5, 0, 7); g.fill(); g.stroke();
      tip.style.display = 'block'; tip.style.left = best[0] + 'px'; tip.style.top = best[1] + 'px';
      tip.innerHTML = `<b>${fmt(best[3], 2)} ${esc(unit)}</b><br><span class="muted">t = ${fmt(best[2], 1)} s</span>`;
    } else tip.style.display = 'none';
  }
  let hx = null;
  cv.addEventListener('pointermove', e => { hx = e.offsetX; drawChart(hx); });
  cv.addEventListener('pointerleave', () => { hx = null; drawChart(); });

  // ---- live parts
  function paint() {
    const s = STAGES[sel];
    $$('#dline .zone').forEach(z => z.classList.toggle('running', sim.running));
    $('#k-bottles').textContent = fmt(sim.bottles);
    $('#k-packs').textContent = fmt(Math.floor(sim.bottles / 3));
    $('#k-litres').textContent = fmt(sim.bottles * sim.fill / 1000, 1);
    const mm = Math.floor(sim.t / 60), ss = Math.floor(sim.t % 60);
    $('#k-time').textContent = `${mm}:${String(ss).padStart(2, '0')}`;
    $('#live').innerHTML = readings(s.n).map(r => `<div class="reading"><small>${esc(r[0])}</small><b>${fmtReading(r)}</b>${r[3] != null ? `<div class="bar"><i style="width:${clamp(r[3], 0, 100)}%"></i></div>` : ''}</div>`).join('');
    const cur = MEF[sim.mef.i];
    $('#mef-states').innerHTML = MEF.filter(m => m.id !== 'REINICIO').map(m => `<div class="${m.id === cur.id ? 'on' : ''}">${m.id}</div>`).join('');
    $('#mef-out').innerHTML = MEF_OUTPUTS.map(([o, p]) => `<span class="lamp ${cur.out.includes(o) ? 'on' : ''}"><i></i>${o}·${p}</span>`).join('');
    $('#mef-c').textContent = sim.mef.c;
    $('#mef-meaning').textContent = cur.meaning;
    if (tab !== 'chart') paintTab(); else drawChart(hx);
  }

  let last = performance.now(), acc = 0;
  function loop(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (sim.running) step(dt);
    acc += dt;
    if (acc > .25) { acc = 0; paint(); }
    requestAnimationFrame(loop);
  }
  setBtns(); fillChartMetrics(); paintStatic(); paint();
  requestAnimationFrame(loop);
  addEventListener('resize', () => drawChart());
});
