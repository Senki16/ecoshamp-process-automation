// Time-scaled simulation of the EcoShamp line, shared by every page.
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

// Stage zones on the procedural line (percent of its width)
const PROC_ZONES = [[0, 18.8], [18.8, 31.3], [31.3, 44], [44, 56.6], [56.6, 67.2], [67.2, 93.4], [93.4, 100]];

// Runs the simulation on its own and draws the procedural line into `host`
// (used on the pages without simulation controls).
function autoLine(host, opts = {}) {
  sim.running = true;
  const view = procLine(host, sim, opts);
  let last = performance.now();
  (function loop(now) {
    step(Math.min(.1, (now - last) / 1000)); last = now;
    requestAnimationFrame(loop);
  })(last);
  return view;
}
