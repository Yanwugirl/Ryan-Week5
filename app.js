'use strict';
// What Is It Made Of? — the same falling circle with different sounds,
// watched alone or in a row.
//
// How it works:
// 1. Physics: bounceSchedule() works out when the circle hits the line and how hard.
// 2. Sound: the Web Audio API synthesises each sound and schedules it on the
//    audio clock, so it lands exactly on (or deliberately off) each impact.
// 3. Animation: the canvas reads the same audio clock, so picture and sound stay in sync.
// 4. Watching: "Alone" plays one version; "In a row" plays a list, asking after each one.
// 5. Answers: saved in this browser (localStorage) and compared in "Your answers".

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;

// ---------- 1. physics of one drop ----------
const DROP = { fall: 0.75, restitution: 0.55, minSpeed: 0.08 };

function bounceSchedule() {
  // times are in seconds, heights are 0..1 (1 = starting height)
  const impacts = [];
  let t = DROP.fall;           // first contact
  let v = 1;                   // relative impact speed
  let hop = DROP.fall * 2;     // time in the air for a bounce at speed 1
  while (v > DROP.minSpeed) {
    impacts.push({ t, v });
    v *= DROP.restitution;
    t += hop * v;
  }
  return { impacts, end: t + 0.6 };
}
const SCHEDULE = bounceSchedule();

// height of the circle above the line at time s (0 = touching, 1 = start)
function heightAt(s) {
  if (s <= DROP.fall) {
    const k = s / DROP.fall;
    return 1 - k * k;
  }
  const im = SCHEDULE.impacts;
  for (let i = 0; i < im.length; i++) {
    const v = im[i].v * DROP.restitution;       // speed leaving this impact
    const air = DROP.fall * 2 * v;               // time until the next impact
    const t0 = im[i].t;
    if (s < t0 + air) {
      const u = (s - t0) / air;                  // 0..1 through the hop
      return v * v * 4 * u * (1 - u);            // a parabola with peak v²
    }
  }
  return 0;
}

// ---------- 2. sounds (synthesised, no files) ----------
let audio = null;

function ensureAudio() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

function noiseBuffer(seconds) {
  const a = ensureAudio();
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * seconds), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function envGain(at, peak, decay) {
  const a = ensureAudio();
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  g.connect(a.destination);
  return g;
}

function tone(at, freq, peak, decay, type = 'sine') {
  const a = ensureAudio();
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  o.connect(envGain(at, peak, decay));
  o.start(at);
  o.stop(at + decay + 0.05);
  return o;
}

function noise(at, peak, decay, filterType, freq, q = 1) {
  const a = ensureAudio();
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(decay + 0.05);
  const f = a.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = freq;
  f.Q.value = q;
  src.connect(f);
  f.connect(envGain(at, peak, decay));
  src.start(at);
}

const SOUNDS = {
  none() {},
  // short and dry: a filtered click with a small body
  dry(at, v) {
    noise(at, 0.5 * v, 0.045, 'bandpass', 1900, 1.2);
    tone(at, 190, 0.25 * v, 0.05, 'triangle');
  },
  // resonant: inharmonic partials with a long decay, like a small bell
  ring(at, v) {
    const f0 = 330;
    [[1, 0.35, 1.8], [2.76, 0.16, 1.2], [5.4, 0.08, 0.7], [8.93, 0.04, 0.4]].forEach(([m, g, d]) => {
      tone(at, f0 * m, g * v, d);
    });
    noise(at, 0.08 * v, 0.02, 'highpass', 3000);
  },
  // heavy: a low thump whose pitch drops, plus a dull noise
  thud(at, v) {
    const a = ensureAudio();
    const o = tone(at, 95, 0.6 * v, 0.32);
    o.frequency.exponentialRampToValueAtTime(42, at + 0.15);
    noise(at, 0.3 * v, 0.09, 'lowpass', 260);
  },
  // glass: bright, high partials with a short decay
  glass(at, v) {
    [[2400, 0.12, 0.35], [3900, 0.08, 0.25], [6150, 0.05, 0.18]].forEach(([f, g, d]) => tone(at, f, g * v, d));
    noise(at, 0.06 * v, 0.012, 'highpass', 5000);
  }
};

// schedule every impact sound for one viewing that starts at audio time t0
function scheduleSounds(version, t0) {
  SCHEDULE.impacts.forEach(im => {
    const at = t0 + im.t + version.offset;
    const v = Math.pow(im.v, 1.2);
    if (v < 0.02) return;
    SOUNDS[version.sound](Math.max(at, ensureAudio().currentTime + 0.005), v);
  });
}

// ---------- 3. animation on the audio clock ----------
let playing = null;    // { version, t0, onEnd }

function resize() {
  const r = canvas.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  W = r.width; H = r.height;
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
new ResizeObserver(resize).observe(canvas);

function draw() {
  ctx.clearRect(0, 0, W, H);
  const ground = H * 0.74;
  const top = H * 0.16;
  const r = Math.max(12, Math.min(W, H) * 0.045);

  // ground line
  ctx.strokeStyle = '#c9ccd2';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.3, ground);
  ctx.lineTo(W * 0.7, ground);
  ctx.stroke();

  let h = 0;
  if (playing) {
    const s = ensureAudio().currentTime - playing.t0;
    if (s < 0) h = 1;
    else if (s < SCHEDULE.end) h = heightAt(s);
    else finish();
  }
  const y = ground - r - h * (ground - r - top);
  ctx.fillStyle = '#1f2326';
  ctx.beginPath();
  ctx.arc(W / 2, y, r, 0, Math.PI * 2);
  ctx.fill();
  requestAnimationFrame(draw);
}

function play(version, onEnd) {
  const a = ensureAudio();
  const t0 = a.currentTime + 0.6;     // a short pause before the drop
  scheduleSounds(version, t0);
  playing = { version, t0, onEnd };
  document.getElementById('stage-hint').hidden = true;
}

function finish() {
  const done = playing;
  playing = null;
  if (done && done.onEnd) done.onEnd();
}

// ---------- 5. answers, saved in this browser ----------
const STORE_KEY = 'what-is-it-made-of-answers';

function loadAnswers() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
}
function saveAnswers(a) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(a)); } catch (e) { /* storage unavailable: keep in memory */ }
}
let answers = loadAnswers();   // { "03": { alone: "Metal", row: "Metal", rowPos: 3 } }

function record(id, context, value, pos) {
  answers[id] = answers[id] || {};
  answers[id][context] = value;
  if (context === 'row') answers[id].rowPos = pos;
  saveAnswers(answers);
  renderAnswers();
}

// ---------- asking after a viewing ----------
const ask = document.getElementById('ask');
const label = document.getElementById('stage-label');
let current = null;   // { version, context, pos, after }

MATERIALS.forEach(m => {
  const b = document.createElement('button');
  b.textContent = m;
  b.addEventListener('click', () => answer(m));
  document.getElementById('choices').append(b);
});

function askAbout(version, context, pos, after) {
  current = { version, context, pos, after };
  ask.hidden = false;
  ask.querySelector('button').focus({ preventScroll: true });
}

function answer(material) {
  if (!current) return;
  const { version, context, pos, after } = current;
  record(version.id, context, material, pos);
  ask.hidden = true;
  label.textContent = version.id + '  ' + version.name;
  current = null;
  if (after) after();
}

document.getElementById('replay').addEventListener('click', () => {
  if (!current) return;
  ask.hidden = true;
  const c = current;
  play(c.version, () => { ask.hidden = false; });
});

// ---------- 4a. alone ----------
function renderCards() {
  const box = document.getElementById('cards');
  box.innerHTML = '';
  VERSIONS.forEach(v => {
    const done = answers[v.id] && answers[v.id].alone;
    const b = document.createElement('button');
    b.className = 'card';
    b.innerHTML = '<span class="card-id">' + v.id + '</span>' +
      '<span class="card-name">' + (done ? v.name : 'Hidden until you answer') + '</span>' +
      (done ? '<span class="card-answer">You said: ' + answers[v.id].alone + '</span>' : '');
    b.addEventListener('click', () => {
      if (playing || current) return;
      label.textContent = v.id;
      play(v, () => askAbout(v, 'alone', null, renderCards));
    });
    box.append(b);
  });
}

// ---------- 4b. in a row ----------
function runRow(list, name) {
  if (playing || current) return;
  const progress = document.getElementById('row-progress');
  progress.innerHTML = '';
  list.forEach(v => {
    const li = document.createElement('li');
    li.id = 'row-' + v.id;
    li.textContent = '…';
    progress.append(li);
  });
  let i = 0;
  const next = () => {
    if (i >= list.length) {
      label.textContent = name + ' finished. Compare in Your answers.';
      return;
    }
    const v = list[i];
    const pos = i + 1;
    label.textContent = pos + ' of ' + list.length;
    document.getElementById('row-' + v.id).textContent = 'Playing';
    play(v, () => askAbout(v, 'row', pos, () => {
      document.getElementById('row-' + v.id).textContent = v.id + ' ' + v.name + ': ' + answers[v.id].row;
      i += 1;
      setTimeout(next, 900);
    }));
  };
  next();
}

const film = VERSIONS.filter(v => v.inFilm);
document.getElementById('row-film').addEventListener('click', () => runRow(film, 'Film order'));
document.getElementById('row-reverse').addEventListener('click', () => runRow(film.slice().reverse(), 'Reversed order'));
document.getElementById('row-shuffle').addEventListener('click', () => {
  const list = VERSIONS.slice();
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  runRow(list, 'Shuffled order');
});

// ---------- your answers ----------
function renderAnswers() {
  const body = document.querySelector('#answers-table tbody');
  body.innerHTML = '';
  let both = 0, changed = 0;
  VERSIONS.forEach(v => {
    const a = answers[v.id] || {};
    const tr = document.createElement('tr');
    const row = a.row ? a.row + ' <span class="pos">(position ' + a.rowPos + ')</span>' : '—';
    const diff = a.alone && a.row && a.alone !== a.row;
    if (a.alone && a.row) { both += 1; if (diff) changed += 1; }
    tr.innerHTML = '<td>' + v.id + ' ' + v.name + '</td><td>' + (a.alone || '—') + '</td><td' + (diff ? ' class="changed"' : '') + '>' + row + '</td>';
    body.append(tr);
  });
  const sum = document.getElementById('answers-summary');
  sum.textContent = both
    ? 'You answered ' + both + ' version' + (both > 1 ? 's' : '') + ' both ways. ' + changed + ' answer' + (changed === 1 ? '' : 's') + ' changed with the context.'
    : 'Watch at least one version both alone and in a row to compare.';
}

document.getElementById('clear-answers').addEventListener('click', () => {
  answers = {};
  saveAnswers(answers);
  renderAnswers();
  renderCards();
});

// ---------- tabs ----------
const tabs = ['alone', 'row', 'answers'];
tabs.forEach(name => {
  document.getElementById('tab-' + name).addEventListener('click', () => {
    tabs.forEach(n => {
      document.getElementById('tab-' + n).setAttribute('aria-selected', String(n === name));
      document.getElementById('panel-' + n).hidden = n !== name;
    });
  });
});

// ---------- the version notes ----------
const list = document.getElementById('version-list');
VERSIONS.forEach(v => {
  const div = document.createElement('div');
  div.className = 'version';
  div.innerHTML = '<p class="version-head"><span class="card-id">' + v.id + '</span> ' + v.name +
    (v.inFilm ? '' : ' <span class="tag">new</span>') + '</p><p>' + v.text + '</p>';
  list.append(div);
});

resize();
renderCards();
renderAnswers();
requestAnimationFrame(draw);
