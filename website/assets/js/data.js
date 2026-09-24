// Content for the EcoShamp site, taken from the project reports in this repository
// (02_Process_Report, 01_Company_Report) and the README.

const IMG = 'assets/img/';
const ICON = IMG + 'icons/';

const STAGES = [
  {
    n: 1, id: 'reception', name: 'Raw Materials Reception & Storage', short: 'Raw Materials',
    owner: 'Martín Jaramillo', icon: ICON + 's_level.png',
    sprites: ['tank_h2o', 'tank_leaf', 'tank_flask'],
    zone: [0, 19.5],
    summary: 'Reception and storage of liquid and solid ingredients.',
    desc: 'Liquid and solid ingredients are received and stored under specific conditions to ensure the final product\'s quality. An automated inventory control system uses ultrasonic sensors and filling valves to keep supply precise and continuous.',
    inputs: [
      ['s_level', 'Water', 'Main base of the shampoo.'],
      ['s_conductivity', 'Surfactants', 'Responsible for the cleaning action.'],
      ['s_turbidity', 'Thickeners', 'Provide the desired texture.'],
      ['s_filter_integrity', 'Preservatives', 'Extend the shelf life.'],
      ['s_optical', 'Fragrances', 'Give the characteristic scent.'],
      ['s_ph', 'Colorants', 'Give colour to the final product.'],
    ],
    flow: [
      ['Reception', 'Arrival of ingredients at the plant.'],
      ['Quality control', 'Initial quality verification.'],
      ['Storage', 'Liquids in temperature-controlled tanks; solids in sealed containers.'],
      ['Automated control', 'Ultrasonic sensors in tanks and valves for precise management.'],
    ],
    sensors: [['s_level', 'Level sensor', 'Ultrasonic'], ['s_temperature', 'Temperature sensor', 'Tanks'], ['s_position', 'Position sensor', 'Truck connection']],
    actuators: [['a_inout_valve', 'Filling valves', 'Tank inlet'], ['a_control_valve', 'Outlet valves', 'To mixing']],
    notes: ['Liquids are stored between 15 °C and 25 °C to prevent ingredient degradation.', 'Ultrasonic sensors emit sound waves to measure liquid levels in the tanks with high precision.'],
  },
  {
    n: 2, id: 'mixing', name: 'Mixing Preparation', short: 'Mixing',
    owner: 'Juan Diego Guerra', icon: ICON + 's_weight.png',
    sprites: ['mixer'],
    zone: [19.5, 30],
    summary: 'Each ingredient is weighed to the formulation and mixed.',
    desc: 'Every ingredient passes through a weighing scale according to the shampoo formulation. Water, surfactants, conditioning agents, thickeners and stabilisers, preservatives, fragrances and pH adjusters are then moved to a pot and mixed in exact proportions, so every batch has the same formula.',
    inputs: [
      ['s_level', 'Water', 'Weighed per recipe.'],
      ['s_conductivity', 'Surfactants', 'Cleansing agents.'],
      ['s_turbidity', 'Conditioners & thickeners', 'Texture and stability.'],
      ['s_ph', 'pH adjusters', 'Final pH of the formula.'],
      ['s_optical', 'Fragrances & preservatives', 'Scent and shelf life.'],
    ],
    flow: [
      ['Weighing', 'Each ingredient is weighed on a scale according to the formulation.'],
      ['Transfer', 'A robotic arm and inlet valve move the ingredients to the pot.'],
      ['Mixing', 'Ingredients are combined in exact proportions (250 L capacity).'],
      ['Discharge', 'The automated outlet valve sends the premix to homogenisation.'],
    ],
    sensors: [['s_weight', 'Weight sensor', 'Scale'], ['s_position', 'Position sensor', 'Robotic arm']],
    actuators: [['a_inout_valve', 'Automated inlet valve', ''], ['a_control_valve', 'Automated outlet valve', ''], ['a_robotic_arm', 'Robotic arm', 'On / off']],
    notes: ['Automated from inbound to outbound.', 'Mixing pot capacity: 250 L.'],
  },
  {
    n: 3, id: 'homogenization', name: 'Homogenization', short: 'Homogenization',
    owner: 'Miguel Vargas', icon: ICON + 'a_mixer_motor.png',
    sprites: ['homogenizer'],
    zone: [30, 44],
    summary: 'The premix is refined under high pressure for a uniform texture.',
    desc: 'The premix from the blending stage is refined so that every ingredient is evenly distributed. Processing under high pressure gives the shampoo a smooth, stable consistency, while level, temperature and mixer-speed sensors keep the batch under control.',
    inputs: [
      ['s_level', 'Premix', 'From the mixing stage.'],
      ['s_conductivity', 'Surfactants & conditioners', 'Already dosed.'],
      ['s_filter_integrity', 'Preservatives & fragrances', 'Already dosed.'],
    ],
    flow: [
      ['Inlet', 'The premix enters through the automated inlet valve.'],
      ['Homogenisation', 'High-pressure mixing for a uniform texture.'],
      ['Monitoring', 'Level, temperature and mixer speed are measured.'],
      ['Outlet', 'The stable mixture is sent to filtration.'],
    ],
    sensors: [['s_level', 'Level sensor', ''], ['s_temperature', 'Temperature sensor', ''], ['s_position', 'Mixer speed sensor', '']],
    actuators: [['a_inout_valve', 'Automated inlet valve', ''], ['a_control_valve', 'Automated outlet valve', ''], ['a_mixer_motor', 'Mixer', 'On / off']],
    notes: ['Automated from inbound to outbound.', 'Tank capacity: 250 L.'],
  },
  {
    n: 4, id: 'filtration', name: 'Filtration', short: 'Filtration',
    owner: 'Alejandro Muriel', icon: ICON + 's_filter_integrity.png',
    sprites: ['filters'],
    zone: [44, 59],
    summary: 'Three filter stages remove impurities and particles.',
    desc: 'The shampoo passes through a system that removes impurities and unwanted particles, so the product is completely clean and ready to be bottled. Pressure, flow, temperature and filter-integrity sensors watch every stage.',
    inputs: [
      ['s_filter_integrity', 'Coarse filtration', 'Removes large particles and undissolved ingredients.'],
      ['s_filter_integrity', 'Fine filtration', 'Smaller pores catch finer particles.'],
      ['s_filter_integrity', 'Polishing filtration', 'Ultra-fine filter for microscopic particles.'],
    ],
    flow: [
      ['Coarse', 'Large particles and undissolved ingredients are removed.'],
      ['Fine', 'Finer particles missed by the coarse filter are removed.'],
      ['Polishing', 'An ultra-fine filter removes remaining microscopic particles.'],
    ],
    sensors: [['s_pressure', 'Pressure sensor', 'Before & after each filter'], ['s_flow', 'Flow-rate sensor', 'After each stage'], ['s_temperature', 'Temperature sensor', 'Fine & polishing'], ['s_filter_integrity', 'Filter-integrity sensor', 'Fine & polishing']],
    actuators: [['a_automatic_valve', 'Automatic valves', 'Flow in and out of each stage']],
    notes: ['Pressure is measured before and after each filter stage.', 'Filter-integrity sensors are attached directly to the fine and polishing filters.'],
  },
  {
    n: 5, id: 'filling', name: 'Bottle Filling', short: 'Bottle Filling',
    owner: 'Juan Esteban López', icon: ICON + 'a_bottle_filler.png',
    sprites: ['filler'],
    zone: [59, 72.5],
    summary: 'Bottles are aligned, filled with the exact dose and checked.',
    desc: 'The filtered shampoo is dispensed into the bottles automatically so each one holds the exact amount of product. The filling system is precise and fast, optimising production time and keeping waste to a minimum.',
    inputs: [
      ['a_bottle_filler', 'Filtered shampoo', 'From the filtration stage.'],
      ['s_presence', 'Empty bottles', 'Fed by the conveyor.'],
    ],
    flow: [
      ['Transport', 'Bottles are aligned and moved to the filling station.'],
      ['Positioning', 'Sensors align each bottle under the nozzles.'],
      ['Dosage', 'The machine dispenses the precise amount of shampoo.'],
      ['Quality control', 'Fill levels are checked; faulty bottles are removed.'],
    ],
    sensors: [['s_level', 'Level sensor', 'Liquid level in the bottle'], ['s_presence', 'Presence sensor', 'Bottle position'], ['s_optical', 'Optical sensor', 'Bottle presence']],
    actuators: [['a_capping_machine', 'Pneumatic cylinder', 'Moves the dispenser'], ['a_conveyor_motor', 'Conveyor belt motor', 'Moves bottles'], ['a_dosing_pump', 'Solenoid valve', 'Controls liquid flow']],
    notes: ['Faulty bottles are removed automatically after the level check.'],
  },
  {
    n: 6, id: 'packaging', name: 'Labeling & Packaging', short: 'Labeling & Packaging',
    owner: 'David Zuluaga Henao', icon: ICON + 'a_labeling_machine.png',
    sprites: ['robot_arm', 'labeler'],
    zone: [72.5, 88],
    summary: 'Bottles are labelled, capped and shrink-wrapped.',
    desc: 'Labelling is automatic, so every bottle is identified with the product name, ingredients and expiry date. Bottles are then capped and wrapped in shrink film for distribution. The subprocess is controlled by two finite state machines running on an ESP32.',
    inputs: [
      ['s_cap', 'Filled bottles', 'From the filling stage.'],
      ['a_labeling_machine', 'Pre-printed labels', 'Label roll.'],
      ['s_cap', 'Caps', 'Cap dispenser.'],
      ['a_heating_element', 'Shrink film', 'Heat tunnel.'],
    ],
    flow: [
      ['Labeling', 'Pre-printed labels are applied with accurate placement and adhesion.'],
      ['Capping', 'Bottles are sealed with caps to protect the product.'],
      ['Shrink wrapping', 'Groups of bottles are wrapped in film and heated so it shrinks tightly.'],
    ],
    sensors: [
      ['s_presence', 'Label presence', ''], ['s_position', 'Bottle position', ''], ['s_optical', 'Label application verification', ''],
      ['s_cap', 'Cap presence', ''], ['s_orientation', 'Bottle height', ''], ['s_cap', 'Cap application verification', ''],
      ['s_presence', 'Film presence', ''], ['s_position', 'Bottle grouping', ''], ['s_temperature', 'Temperature (heat tunnel)', ''],
    ],
    actuators: [
      ['a_labeling_machine', 'Label applicator', ''], ['a_robotic_arm', 'Bottle positioning servo', ''], ['a_mixer_motor', 'Label roll motor', ''],
      ['a_capping_machine', 'Capping head', ''], ['a_bottle_filler', 'Cap dispenser', ''], ['a_conveyor_motor', 'Bottle conveyor motor', ''],
      ['a_heating_element', 'Heat tunnel heater', ''], ['a_onoff_switch', 'Film cutter', ''], ['a_fan', 'Fan', ''],
    ],
    notes: ['Upper machine: filling, sealing, labelling and packaging stations (three bottles per cycle).', 'Lower machine: the conveyor indexes the bottle through position sensors S1–S4 with green, amber and red lamps.'],
  },
  {
    n: 7, id: 'final', name: 'Final Product', short: 'Final Product',
    owner: 'Whole team', icon: ICON + 's_presence.png',
    sprites: ['boxes', 'bottles'],
    zone: [88, 100],
    summary: 'Packaged natural shampoo, ready for points of sale.',
    desc: 'Packaged bottles leave the line ready for distribution, reaching points of sale in perfect condition. The plant is designed for 2,000–3,000 units per day, aimed at people aged 18–45 who value sustainability and natural products.',
    inputs: [
      ['s_presence', 'Shrink-wrapped packs', 'From labeling & packaging.'],
      ['s_weight', 'Boxes', 'Palletised for distribution.'],
    ],
    flow: [
      ['Inspection', 'Defective bottles are removed, re-labelled or re-packed.'],
      ['Boxing', 'Packs are boxed and palletised.'],
      ['Distribution', 'Product ships to points of sale.'],
    ],
    sensors: [['s_position', 'Bottle grouping', 'Pack count']],
    actuators: [['a_conveyor_motor', 'Conveyor belt motor', 'Out-feed']],
    notes: ['Design capacity: 2,000–3,000 units per day.', 'Target customers: 18–45 years old.'],
  },
];

// Stage-6 upper machine: states from 04_State_Machines/controller_three_bottles.js
const MEF = [
  { id: 'Start', meaning: 'Idle and reset', out: [], t: 0.8 },
  { id: 'llenadoEnvase', meaning: 'Bottle filling', out: ['YA'], t: 1.6 },
  { id: 'BANDA_Y_SENSORP', meaning: 'Conveyor to station 1', out: ['Y1', 'YM'], t: 1.2 },
  { id: 'SENSOR2', meaning: 'Station 2', out: ['Y2', 'YM'], t: 1.2 },
  { id: 'SENSOR3', meaning: 'Station 3 (t ≥ 4 s)', out: ['Y3', 'YM'], t: 4 },
  { id: 'BANDAT', meaning: 'Conveyor only (t ≥ 2 s)', out: ['YM'], t: 2 },
  { id: 'UBICACIONFINAL', meaning: 'Final positioning', out: ['YV'], t: 1 },
  { id: 'REINICIO', meaning: 'Return head to empty-bottle position', out: ['YV'], t: 1 },
];
const MEF_OUTPUTS = [['YA', 22], ['YV', 23], ['Y1', 24], ['Y2', 25], ['Y3', 26], ['YM', 27]];
const MEF_INPUTS = [['Start', 32], ['Stop', 33], ['X1', 35], ['X2', 34], ['XV', 36], ['XA', 37]];

// Component catalogue, built from the per-stage sensor and actuator lists.
const EXTRA_COMPONENTS = [
  { name: 'ESP32 controller', type: 'control', icon: 'a_onoff_switch', stages: [6], note: 'Runs the generated JavaScript state machines. Inputs on pins 32–37, outputs on pins 22–27.' },
  { name: 'Start / Stop pushbuttons', type: 'control', icon: 'a_onoff_switch', stages: [6], note: 'Start launches the cycle; Stop returns every state to Start.' },
  { name: 'Indicator lamps', type: 'control', icon: 'a_onoff_switch', stages: [6], note: 'Green: running right. Amber: stopped at a position sensor. Red: returning left.' },
  { name: 'Conveyor DC motor', type: 'actuator', icon: 'a_conveyor_motor', stages: [6], note: 'Continuous-control test: J = 0.01 kg·m², b = 0.1 N·m·s, Ke = Kt = 0.01, R = 0.9 Ω, L = 0.5 H.' },
];

function buildComponents() {
  const map = new Map();
  const add = (type, [icon, name, detail], stage) => {
    const key = type + '|' + name.toLowerCase();
    if (!map.has(key)) map.set(key, { name, type, icon, stages: [], details: [] });
    const c = map.get(key);
    if (!c.stages.includes(stage)) c.stages.push(stage);
    if (detail) c.details.push(`Stage ${stage}: ${detail}`);
  };
  STAGES.forEach(s => {
    s.sensors.forEach(x => add('sensor', x, s.n));
    s.actuators.forEach(x => add('actuator', x, s.n));
  });
  const list = [...map.values()].map(c => ({
    ...c,
    note: c.details.length ? c.details.join(' · ') : `Used in ${c.stages.map(n => STAGES[n - 1].short).join(', ')}.`,
  }));
  EXTRA_COMPONENTS.forEach(c => list.push({ ...c, icon: c.icon }));
  return list;
}

const TEAM = [
  ['David Zuluaga Henao', 'Labeling & Packaging', 6],
  ['Martín Jaramillo', 'Raw Materials Reception & Storage', 1],
  ['Juan Diego Guerra', 'Mixing Preparation', 2],
  ['Miguel Vargas', 'Homogenization', 3],
  ['Alejandro Muriel', 'Filtration', 4],
  ['Juan Esteban López', 'Bottle Filling', 5],
];

const REPO = 'https://github.com/Senki16/ecoshamp-process-automation';
