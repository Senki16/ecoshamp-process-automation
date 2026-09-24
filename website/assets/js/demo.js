// Interactive demo: a time-scaled simulation of the EcoShamp line.
// The labeling & packaging stage runs the real state sequence of the
// three-bottle controller (04_State_Machines/controller_three_bottles.js);
// every other reading is simulated for illustration.

const sim = {
  running: false, t: 0, speed: 80, fill: 400, rpm: 120,
  tanks: { water: 75, surf: 60, add: 45 }, tankTemp: 21,
  scale: 0, pot: 0, homLevel: 55, homTemp: 24,
  clog: 0, integrity: 100,
  bottles: 0, filled: 0, rejected: 0,
  mef: { i: 0, t: 0, c: 0 }, tunnel: 22,
  hist: {},
};
const noise = a => (Math.random() - .5) * 2 * a;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (v, d = 0) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// ---- Readings per stage: [label, value, unit, bar% | null]
function readings(n) {
  const s = sim, f = s.speed / 100, on = s.running;
  switch (n) {
    case 1: return [
      ['Level — water tank', s.tanks.water, '%', s.tanks.water, 0],
      ['Level — surfactant tank', s.tanks.surf, '%', s.tanks.surf, 0],
      ['Level — additives tank', s.tanks.add, '%', s.tanks.add, 0],
      ['Temperature — tanks', s.tankTemp, '°C', null, 1],
    ];
    case 2: return [
      ['Weight sensor — scale', s.scale, 'kg', s.scale / 60 * 100, 1],
      ['Mixing pot volume', s.pot, 'L', s.pot / 250 * 100, 0],
      ['Robotic arm', on ? 1 : 0, '', null, -1],
      ['Inlet valve', on && s.scale > 0 ? 1 : 0, '', null, -1],
    ];
    case 3: return [
      ['Level — homogenizer', s.homLevel, '%', s.homLevel, 0],
      ['Temperature — mixture', s.homTemp, '°C', null, 1],
      ['Mixer speed', on ? s.rpm + noise(2) : 0, 'rpm', null, 0],
      ['Outlet valve', on ? 1 : 0, '', null, -1],
    ];
    case 4: return [
      ['Pressure drop — coarse', on ? (0.25 + s.clog * .3) * f : 0, 'bar', null, 2],
      ['Pressure drop — fine', on ? (0.5 + s.clog * .6) * f : 0, 'bar', null, 2],
      ['Flow rate — outlet', on ? 12 * f * (1 - s.clog * .3) + noise(.2) : 0, 'L/min', null, 1],
      ['Filter integrity', s.integrity, '%', s.integrity, 0],
    ];
    case 5: return [
      ['Fill volume set-point', s.fill, 'ml', null, 0],
      ['Bottles filled', s.filled, '', null, 0],
      ['Rejected at level check', s.rejected, '', null, 0],
      ['Presence sensor', on && MEF[s.mef.i].id === 'llenadoEnvase' ? 1 : 0, '', null, -1],
    ];
    case 6: return [
      ['Controller state', MEF[s.mef.i].id, '', null, 'txt'],
      ['Bottle counter C', s.mef.c, '/ 3', null, 0],
      ['Heat tunnel temperature', s.tunnel, '°C', null, 0],
      ['Conveyor motor YM', MEF[s.mef.i].out.includes('YM') ? 1 : 0, '', null, -1],
    ];
    default: return [
      ['Bottles packed', s.bottles, '', null, 0],
      ['Shrink-wrapped packs', Math.floor(s.bottles / 3), '', null, 0],
      ['Shampoo dispensed', s.bottles * s.fill / 1000, 'L', null, 1],
      ['Out-feed conveyor', on ? 1 : 0, '', null, -1],
    ];
  }
}
function fmtReading([, v, u, , d]) {
  if (d === -1) return v ? 'ON' : 'OFF';
  if (d === 'txt') return v;
  return fmt(v, d) + (u ? ` <em>${u}</em>` : '');
}

// ---- Simulation step
function step(dt) {
  const s = sim, f = s.speed / 100, T = dt * f;
  s.t += dt;
  // stage 1: tanks drain, automated refill at 20 %
  for (const [k, r] of [['water', .9], ['surf', .5], ['add', .3]]) {
    s.tanks[k] -= r * T;
    if (s.tanks[k] < 20) s.tanks[k] = 90;
  }
  s.tankTemp = clamp(s.tankTemp + noise(.08), 18, 23);
  // stage 2: weigh then transfer
  s.scale += 6 * T; if (s.scale > 60) { s.scale = 0; s.pot += 40; }
  if (s.pot > 250) s.pot = 40;
  // stage 3
  s.homLevel = clamp(s.homLevel + noise(.6) + (s.rpm - 120) * .002 * T, 35, 85);
  s.homTemp = clamp(s.homTemp + noise(.07) + (s.rpm - 120) * .0008 * T, 22, 30);
  // stage 4: filters slowly clog, then are changed
  s.clog += .004 * T; if (s.clog > 1) s.clog = 0;
  s.integrity = clamp(100 - s.clog * 12 + noise(.3), 80, 100);
  // stage 6: state machine
  s.tunnel = clamp(s.tunnel + (140 - s.tunnel) * .05 * T + noise(.5), 20, 145);
  const m = s.mef, st = MEF[m.i];
  m.t += T;
  if (m.t >= st.t) {
    m.t = 0;
    const go = id => { m.i = MEF.findIndex(x => x.id === id); };
    switch (st.id) {
      case 'Start': go('llenadoEnvase'); break;
      case 'llenadoEnvase':
        s.filled++;
        if (Math.random() < .03) s.rejected++;
        go('BANDA_Y_SENSORP'); break;
      case 'BANDA_Y_SENSORP': go('SENSOR2'); break;
      case 'SENSOR2': go('SENSOR3'); break;
      case 'SENSOR3': go('BANDAT'); break;
      case 'BANDAT': go('UBICACIONFINAL'); break;
      case 'UBICACIONFINAL':
        m.c++; s.bottles++;
        if (m.c >= 3) { m.c = 0; go('Start'); } else go('llenadoEnvase');
        break;
      default: go('Start');
    }
  }
  // history for the chart
  STAGES.forEach(stg => readings(stg.n).forEach(r => {
    if (typeof r[1] !== 'number' || r[4] === -1) return;
    const key = stg.n + '|' + r[0];
    (s.hist[key] ||= []).push([s.t, r[1]]);
    if (s.hist[key].length > 240) s.hist[key].shift();
  }));
}

// ---- UI
document.addEventListener('DOMContentLoaded', () => {
  let sel = 0, tab = 'flow';

  // stepper + line labels
  $('#dstep').innerHTML = STAGES.map((s, i) => `${i ? '<span class="arrow-sep" aria-hidden="true">→</span>' : ''}<button class="step" data-i="${i}"><span class="num ghost">${s.n}</span><span>${esc(s.name)}</span></button>`).join('');
  $('#dline').insertAdjacentHTML('beforeend',
    STAGES.map((s, i) => `<div class="zone" data-i="${i}" style="left:${s.zone[0]}%;width:${s.zone[1] - s.zone[0]}%"></div>`).join('') +
    STAGES.map((s, i) => `<button class="lbl" data-i="${i}" style="left:${(s.zone[0] + s.zone[1]) / 2}%"><span class="num">${s.n}</span>${esc(s.short)}</button>`).join(''));
  $('#live-sel').innerHTML = $('#chart-stage').innerHTML = STAGES.map((s, i) => `<option value="${i}">Stage ${s.n} · ${esc(s.short)}</option>`).join('');

  const belt = animateBelt($('#dline .belt'), { speed: () => sim.speed / 100, running: () => sim.running });

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

  function paintTab() {
    const s = STAGES[sel], r = readings(s.n);
    if (tab === 'flow') {
      const caps = r.slice(0, s.sprites.length === 1 ? 1 : s.sprites.length);
      $('#tab-dyn').innerHTML = `<div class="pf">${s.sprites.map((sp, k) => `
        <figure>${caps[k] ? `<figcaption>${esc(caps[k][0])}<b>${fmtReading(caps[k])}</b></figcaption>` : ''}<img class="px" src="${IMG}${sp}.png" alt=""></figure>`).join('')}
        ${s.n < 7 ? `<div class="arrow">To ${esc(STAGES[s.n].short)}<br>→</div>` : ''}</div>
        <div class="flow">${s.flow.map(([h, p], k) => `<div class="flow-step"><h4><span class="num">${k + 1}</span>${esc(h)}</h4><p>${esc(p)}</p></div>`).join('')}</div>`;
    } else if (tab === 'io') {
      const cur = MEF[sim.mef.i];
      const OUT_NAMES = { YA: 'Bottle filling', YV: 'Positioner (empty-bottle position)', Y1: 'Station 1', Y2: 'Station 2', Y3: 'Station 3', YM: 'Conveyor motor' };
      const acts = s.n === 6
        ? MEF_OUTPUTS.map(([o, p]) => ['a_onoff_switch', `${o} — ${OUT_NAMES[o]}`, `ESP32 pin ${p}`, sim.running && cur.out.includes(o)])
        : s.actuators.map(([ic, n, d]) => [ic, n, d, sim.running]);
      $('#tab-dyn').innerHTML = `<div class="io-list">
        <div><h4><span class="chip sensor">Sensors</span></h4>${s.sensors.map(([ic, n, d]) => `<div class="io-row"><img class="px" src="${ICON}${ic}.png" alt=""><div>${esc(n)}${d ? `<div class="muted small">${esc(d)}</div>` : ''}</div><span class="st ${sim.running ? 'on' : ''}">${sim.running ? 'READING' : 'IDLE'}</span></div>`).join('')}</div>
        <div><h4><span class="chip actuator">${s.n === 6 ? 'Controller outputs' : 'Actuators'}</span></h4>${acts.map(([ic, n, d, on]) => `<div class="io-row"><img class="px" src="${ICON}${ic}.png" alt=""><div>${esc(n)}${d ? `<div class="muted small">${esc(d)}</div>` : ''}</div><span class="st ${on ? 'on' : ''}">${on ? 'ON' : 'OFF'}</span></div>`).join('')}</div>
      </div>`;
    }
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
