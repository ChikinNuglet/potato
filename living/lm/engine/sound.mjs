// sound.mjs — Potato's small sounds on the desktop (the living model). Sound Designer, team Not A Screensaver.
//
// In plain words: the engine says a NAME ("poked.2", "contact.floor"); data/sounds.json decides whether anything plays.
// Two kinds of sound:
//   VOICE = his little creature noises. Tiny files made by sound/make_creature.py + sound/build_set.py (arithmetic only,
//           never his real voice), packed into one file (sound/set/creature.wav) that this player cuts pieces from.
//   BODY  = his body in the world (plop, bump, zap, crack …). Made live here from the layer recipes in sounds.json, with the
//           same two building blocks the game uses (a tone and a burst of noise), so a landing can scale with how hard he hit.
// Rules this file keeps, always:
//   - NOTHING plays, and no audio object exists, until the user has clicked or pressed a key (unlock()).
//   - The mute is three locks: master gain 0, cue() returns before making a single node, the audio context is suspended.
//     Only mute() changes it. He never un-mutes himself.
//   - Quiet by default. Slight random pitch every time. Never the same voice file twice in a row. No sound ever loops.
//   - The voice budget belongs to the ROOM (five Potatoes are not five times as loud). Most cues end in silence. That is right.
//   - Its randomness is its own seeded stream (pass rng), never the browser's, so sound on / off cannot change what he does.
//
// Use:
//   import { createSound } from './sound.mjs';
//   const sound = createSound({ data: soundsJson, base: '../', rng: stream(seed, 'room:sound'), saved: host.load()?.sound });
//   sound.arm(window);                       // first click / key unlocks audio (or call sound.unlock() from your own handler)
//   sound.attach(living);                    // living.on('cue') and living.on('contact') -> here   (or call cue() yourself)
//   sound.cue('poked.2', { id, watched, spent, pan, k01 });   -> { voice: 'eh_flat' | null, body: [...] }
//   sound.mute('off' | 'quiet' | 'normal')   sound.mute(true | false)        sound.stats.started
//   sound.hum(id)   sound.humCut()           // the private hum (flag: sounds.json private_hum)
//   sound.state()                            // { level, tripped404 } for host.save(); sound.onchange = fn

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash01(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }

// ---- numbers in a body recipe may be small sums like "0.25+0.35*k" or "min(0.6, 0.25*k)": k = impact 0..1, i = repeat index.
// A tiny calculator (numbers, k, i, + - * /, brackets, min, max). No eval.
export function calc(expr, vars) {
  if (typeof expr === 'number') return expr;
  const s = String(expr); let p = 0;
  const ws = () => { while (s[p] === ' ') p++; };
  const atom = () => {
    ws();
    if (s[p] === '(') { p++; const v = sum(); ws(); p++; return v; }
    if (s[p] === '-') { p++; return -atom(); }
    const m = /^[a-z_]+/.exec(s.slice(p));
    if (m) {
      p += m[0].length; ws();
      if (s[p] === '(') { p++; const a = [sum()]; ws(); while (s[p] === ',') { p++; a.push(sum()); ws(); } p++; if (m[0] === 'min') return Math.min(...a); if (m[0] === 'max') return Math.max(...a); throw new Error('sound.calc: unknown ' + m[0]); }
      if (m[0] in vars) return vars[m[0]];
      throw new Error('sound.calc: unknown ' + m[0] + ' in ' + s);
    }
    const n = /^[0-9.]+/.exec(s.slice(p)); if (!n) throw new Error('sound.calc: cannot read ' + s);
    p += n[0].length; return parseFloat(n[0]);
  };
  const prod = () => { let v = atom(); for (;;) { ws(); if (s[p] === '*') { p++; v *= atom(); } else if (s[p] === '/') { p++; v /= atom(); } else return v; } };
  const sum = () => { let v = prod(); for (;;) { ws(); if (s[p] === '+') { p++; v += prod(); } else if (s[p] === '-') { p++; v -= prod(); } else return v; } };
  return sum();
}

export function createSound({ data, base = '', rng, seed = 1, time, saved, context, AudioContextClass, fetchBytes, witness = true } = {}) {
  if (!data) throw new Error('createSound: pass data = the parsed data/sounds.json');
  const rnd = rng || mulberry32(seed);
  const pick = (a, b) => a + (b - a) * rnd();
  const M = data.master, B = data.budget, V = data.voice, W = data.wear_rules || {};
  const voiceById = Object.fromEntries(V.sounds.map(s => [s.id, s]));
  const bodyById = Object.fromEntries([...data.body.reused_from_game, ...data.body.new].map(s => [s.id, s]));
  const steps = M.volume_steps;

  const stats = { cues: 0, started: 0, nodes: 0, voice: 0, body: 0, blocked_locked: 0, blocked_muted: 0, silent: 0, chance: 0, budget: 0, repeat: 0, wear: 0, not_ready: 0, dropped: 0, unmapped: [], last_voice: null, log: [] };
  const note = (name, what, extra) => { if (stats.log.length < 400) stats.log.push({ t: +now().toFixed(3), name, what, ...extra }); };

  let level = (saved && saved.level in steps) ? saved.level : (M.muted_default ? 'off' : M.volume_default);
  let lastOn = level === 'off' ? M.volume_default : level;
  let tripped404 = !!(saved && saved.tripped404);
  let ac = null, master = null, buses = null, sprite = null, clips = null, bytes = null, unlocked = false;
  let readyResolve; const ready = new Promise(r => { readyResolve = r; });
  const now = () => time ? time() : (ac ? ac.currentTime : (typeof performance !== 'undefined' ? performance.now() / 1000 : 0));

  // ---- who is in the room (for the crowd's pitch and the room's budget)
  const who = new Map();                                     // id -> { rate }
  function register(id, { personality = null, real = false } = {}) {
    const [lo, hi] = [0.90, 1.14];
    who.set(id, { rate: (real || !personality) ? 1 : +(lo + (hi - lo) * hash01(String(personality))).toFixed(3) });
  }
  const rateOf = id => (who.get(id) || { rate: 1 }).rate;

  // ---- loading. Bytes may be fetched early (no audio object is made); decoding waits for unlock().
  const url = p => base + p;
  const getBytes = fetchBytes || (async u => (await fetch(u)).arrayBuffer());
  async function preload() {
    if (bytes) return bytes;
    const setUrl = url(V.set), dir = setUrl.slice(0, setUrl.lastIndexOf('/') + 1);
    bytes = (async () => {
      const man = JSON.parse(new TextDecoder().decode(await getBytes(setUrl)));
      return { man, wav: await getBytes(dir + man.file) };
    })();
    return bytes;
  }

  function unlock() {
    if (unlocked) return ready;
    unlocked = true;
    try {
      const AC = AudioContextClass || (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));
      ac = context || new AC();
      master = ac.createGain(); master.gain.value = steps[level]; master.connect(ac.destination);
      buses = {}; for (const [k, g] of Object.entries(M.bus_gain)) { const n = ac.createGain(); n.gain.value = g; n.connect(master); buses[k] = n; }
      applyLevel();
      preload().then(async ({ man, wav }) => { sprite = await ac.decodeAudioData(wav.slice(0)); clips = man.clips; readyResolve(true); })
        .catch(e => { stats.load_error = String(e); readyResolve(false); });
    } catch (e) { stats.load_error = String(e); ac = null; readyResolve(false); }
    return ready;
  }
  function arm(target) {
    const go = () => { unlock(); target.removeEventListener('pointerdown', go, true); target.removeEventListener('keydown', go, true); };
    target.addEventListener('pointerdown', go, true); target.addEventListener('keydown', go, true);
  }

  // ---- the mute: three locks
  const muted = () => level === 'off';
  function applyLevel() {
    if (!ac) return;
    master.gain.value = steps[level];
    if (context) return;                                     // a context handed in (tests render offline) is the caller's to run
    if (muted()) { stopAll(); if (ac.state === 'running') ac.suspend(); }
    else if (ac.state === 'suspended') ac.resume();
  }
  function mute(v) {
    const was = level;
    if (v === true) level = 'off'; else if (v === false) level = lastOn; else if (v in steps) level = v; else if (v === undefined) level = muted() ? lastOn : 'off';
    if (level !== 'off') lastOn = level;
    applyLevel();
    if (was !== level && api.onchange) api.onchange(state());
    return level;
  }
  const state = () => ({ level, tripped404 });

  // ---- what is sounding now (at most M.max_at_once; private drops first)
  let live = [];                                             // { bus, end, stop }
  function room(bus, end, stop) {
    const t = ac.currentTime; live = live.filter(l => l.end > t);
    if (live.length >= M.max_at_once) {
      const i = live.findIndex(l => l.bus === 'private');
      if (i < 0 || bus === 'private') { stats.dropped++; return false; }
      live[i].stop(); live.splice(i, 1); stats.dropped++;
    }
    live.push({ bus, end, stop }); return true;
  }
  function stopAll() { for (const l of live) { try { l.stop(); } catch (e) {} } live = []; humState = null; }

  // ---- building blocks (the game's tone() and noise(), with our own random stream)
  function out(bus, gain, pan) {
    const g = ac.createGain(); g.gain.value = gain; stats.nodes++;
    let tail = g;
    if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1) * (data.crowd.pan_max || 0.6); g.connect(p); tail = p; stats.nodes++; }
    tail.connect(buses[bus]); return g;
  }
  function tone(dest, f0, f1, dur, type, vol, at, t0) {
    const t = t0 + at, o = ac.createOscillator(), g = ac.createGain(); stats.nodes += 2;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(Math.max(0.0001, vol), t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02); stats.started++;
    return o;
  }
  function noise(dest, dur, vol, hz, crush, at, ft, t0) {
    const n = Math.max(1, Math.floor(ac.sampleRate * dur)), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    let hold = 0; crush = Math.max(1, Math.round(crush));
    for (let i = 0; i < n; i++) { if (i % crush === 0) hold = rnd() * 2 - 1; d[i] = hold * (1 - i / n); }
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); stats.nodes += 3;
    s.buffer = b; f.type = ft || 'highpass'; f.frequency.value = hz; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(dest); s.start(t0 + at); stats.started++;
    return s;
  }

  // ---- BODY: play one layer recipe. k = impact 0..1. Returns its length in seconds.
  function playBody(id, { k = 1, gain = 1, rate = 1, pan = 0 } = {}) {
    const rec = bodyById[id]; if (!rec) return 0;
    const p = rate * pick(0.96, 1.04), t0 = ac.currentTime + 0.005, srcs = [];
    const dest = out('body', gain * (rec.desktop_gain ?? 1), pan);
    const rep = rec.repeat ? { from: rec.repeat.i[0], to: rec.repeat.i[1], every: rec.repeat.every_s } : { from: 0, to: 0, every: 0 };
    let end = 0;
    for (let i = rep.from; i <= rep.to; i++) {
      const off = (i - rep.from) * rep.every, v = { k, i }, c = x => calc(x, v);
      for (const L of rec.layers) {
        if (L.tone) { const [f0, f1, dur, wave, vol, at] = L.tone; srcs.push(tone(dest, c(f0) * p, c(f1) * p, c(dur), wave, c(vol), c(at || 0) + off, t0)); end = Math.max(end, c(at || 0) + off + c(dur)); }
        if (L.noise) { const [dur, vol, hz, crush, at, ft] = L.noise; srcs.push(noise(dest, c(dur), c(vol), c(hz) * p, c(crush), c(at || 0) + off, ft, t0)); end = Math.max(end, c(at || 0) + off + c(dur)); }
      }
    }
    room('body', t0 + end, () => srcs.forEach(s => { try { s.stop(); } catch (e) {} }));
    stats.body++; return end;
  }

  // ---- VOICE: one piece of the sprite
  function playClip(id, { bus = 'voice', gain = 1, rate = 1, pan = 0, at = 0, lowpass = 0, away = false, cutAfter = 0 } = {}) {
    const c = clips[id]; if (!c) return null;
    const t0 = ac.currentTime + 0.005 + at, len = c.dur / rate;
    const s = ac.createBufferSource(); s.buffer = sprite; s.playbackRate.value = rate; stats.nodes++;
    const g = out(bus, gain, pan); let head = g;
    if (lowpass || away) {
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; stats.nodes++;
      if (away) { f.frequency.setValueAtTime(6000, t0); f.frequency.exponentialRampToValueAtTime(600, t0 + len); g.gain.setValueAtTime(gain, t0); g.gain.linearRampToValueAtTime(0.0001, t0 + len); }
      else f.frequency.value = lowpass;
      f.connect(g); head = f;
    }
    s.connect(head); s.start(t0, c.at, c.dur); stats.started++;
    if (!room(bus, t0 + len, () => { try { s.stop(); } catch (e) {} })) { try { s.stop(); } catch (e) {} return null; }
    return { src: s, gainNode: g, t0, len };
  }

  // ---- the room's voice budget
  let voiceTimes = [], voiceBusyUntil = -1e9, lastVoice = null, lastFamily = null;
  const lastPlayed = {};                                     // sound id -> time
  const cueLast = {};                                        // cue name -> last voice id / time
  const wear = {};                                           // family -> { n, t }
  function wearOf(fam, t) {
    if (!data.wear) return 0;
    const w = wear[fam]; if (!w) return 0;
    const back = Math.floor((t - w.t) / (W.recover_one_every_s || 75));
    if (back > 0) { w.n = Math.max(0, w.n - back); w.t += back * (W.recover_one_every_s || 75); }
    return w.n;
  }
  function budgetOk(t) {
    voiceTimes = voiceTimes.filter(x => t - x < 60);
    const max = who.size > 1 ? B.voice_max_per_rolling_60s_crowd : B.voice_max_per_rolling_60s_one;
    return voiceTimes.length < max && t - (voiceTimes[voiceTimes.length - 1] ?? -1e9) >= B.voice_min_gap_s && t >= voiceBusyUntil;
  }
  function allowed(id, t) {
    if (id === lastVoice) return false;                      // never the same file twice in a row
    const last = lastPlayed[id] ?? -1e9, ration = (V.rations || {})[id];
    if (t - last < B.same_voice_sound_not_within_s) return false;
    if (typeof ration === 'number' && t - last < ration) return false;
    return true;
  }
  function choose(list, weights, t, cueName) {
    let c = list.map((id, i) => ({ id, w: weights ? weights[i] : 1 })).filter(x => voiceById[x.id] && allowed(x.id, t) && x.id !== (cueLast[cueName] || {}).id);
    if (!c.length) return null;
    if (B.same_family_not_twice_in_a_row) { const o = c.filter(x => voiceById[x.id].family !== lastFamily); if (o.length) c = o; }
    let r = rnd() * c.reduce((a, x) => a + x.w, 0);
    for (const x of c) { r -= x.w; if (r <= 0) return x.id; }
    return c[c.length - 1].id;
  }
  function spendVoice(id, t, len) {
    const fam = voiceById[id].family;
    voiceTimes.push(t); voiceBusyUntil = t + len; lastVoice = id; lastFamily = fam; lastPlayed[id] = t; stats.last_voice = id; stats.voice++;
    if (data.wear) { const w = wear[fam] || (wear[fam] = { n: 0, t }); if (w.n === 0) w.t = t; w.n++; }
  }

  // ---- contacts: later bounces of the same Potato fall off
  const bounce = new Map();                                  // id -> { n, t }

  function lookup(name) {
    const C = data.cues; let e = C[name];
    if (!e) { const parts = name.split('.'); for (let n = parts.length - 1; n >= 1 && !e; n--) e = C[parts.slice(0, n).join('.') + '.*']; }
    if (e && e.same_as) e = C[e.same_as];
    return e || null;
  }

  // ---- THE door: a name, and what the engine knows. Returns what played (so the brain can mark the bit's voice as spent).
  function cue(name, info = {}) {
    stats.cues++;
    const res = { voice: null, body: [] };
    if (!unlocked || !ac) { stats.blocked_locked++; return res; }
    if (muted()) { stats.blocked_muted++; return res; }      // lock 2: before any node
    if (name === 'private.hum') { hum(info.id); return res; }
    let e = lookup(name);
    if (!e) { if (!stats.unmapped.includes(name)) stats.unmapped.push(name); return res; }
    if (info.watched === false && e.if_unwatched) e = e.if_unwatched;
    if (e.silent) { stats.silent++; return res; }
    if (e.only === 'watched' && info.watched === false) return res;
    if (e.only === 'unwatched' && info.watched !== false) return res;
    const t = now(), k01 = clamp(info.k01 ?? 1, 0, 1);
    if (e.min_k && k01 < e.min_k) { stats.silent++; return res; }
    const pan = info.pan || 0, id = info.id ?? info.slot ?? 0;        // body.mjs calls a Potato's number 'slot'

    // body first: the thing that happened
    const bodies = (e.hard_body && k01 >= e.hard_k) ? e.hard_body : e.body;
    if (bodies && rnd() < (e.body_chance ?? 1)) {
      let g = e.gain_body ?? 1;
      if (name.startsWith('contact.')) {
        const b = bounce.get(id) || { n: 0, t: -1e9 };
        if (t - b.t < 0.03) return res;                      // one sound per contact
        b.n = (info.first || t - b.t > 3) ? 0 : b.n + 1; b.t = t; bounce.set(id, b);
        g *= Math.pow(B.body_bounce_gain_falloff, b.n);
      }
      const k = e.k_map ? e.k_map[0] + (e.k_map[1] - e.k_map[0]) * k01 : k01;
      for (const bid of bodies) if (g > 0.02) { playBody(bid, { k, gain: g, rate: e.rate || 1, pan }); res.body.push(bid); }
    }

    // then, maybe, his voice
    let list = e.voice;
    if (list && e.big_voice && k01 >= e.big_k) list = e.big_voice;
    if (!list) return res;
    if (!sprite) { stats.not_ready++; return res; }
    if (info.spent) { stats.budget++; return res; }          // one voice per big bit (the brain says so)
    if (e.voice_min_k && k01 < e.voice_min_k) return res;
    if (e.only_voice === 'first' && info.first === false) return res;
    const firstTrip = e.only_voice === 'first_trip_ever';
    if (firstTrip && tripped404) return res;
    if (e.every_s && t - ((cueLast[name] || {}).t ?? -1e9) < e.every_s) return res;
    if (!firstTrip) {
      if (rnd() >= (e.chance ?? 1)) { stats.chance++; return res; }
      if (!budgetOk(t)) { stats.budget++; note(name, 'budget'); return res; }
    }
    const vid = firstTrip ? list[0] : choose(list, e.weights, t, name);
    if (!vid) { stats.repeat++; note(name, 'repeat'); return res; }
    const fam = voiceById[vid].family, w = firstTrip ? 0 : wearOf(fam, t);
    if (w >= (W.silent_at || 6) || (w && rnd() >= Math.pow(W.chance_x, w))) { stats.wear++; note(name, 'wear', { w }); return res; }
    const J = V.runtime_pitch_jitter;
    const rate = pick(J[0], J[1]) * rateOf(id) * (1 + (W.rate_step || 0) * w) * (e.rate || 1);
    const gain = (e.gain ?? 1) * Math.pow(W.gain_x || 1, w);
    const p = playClip(vid, { gain, rate, pan, at: e.voice_at_s || 0, lowpass: e.lowpass_hz || 0, away: !!e.away });
    if (!p) return res;
    spendVoice(vid, t, (e.voice_at_s || 0) + p.len); cueLast[name] = { id: vid, t };
    if (firstTrip) { tripped404 = true; if (api.onchange) api.onchange(state()); }
    note(name, 'voice', { id: vid, rate: +rate.toFixed(3), gain: +gain.toFixed(3), w });
    res.voice = vid; return res;
  }

  // physics: contact { id, surface: 'floor' | 'wall' | 'ceiling' | 'potato', speedInto (bh/s) or k01, first, pan }
  // (exactly what engine/body.mjs emits as 'contact'). A surface with no cue of its own sounds like a wall.
  let pairAt = -1e9;
  function contact(c) {
    const s = c.surface || 'floor', flat = c.ny !== undefined && Math.abs(c.ny) > 0.7;
    const n = s === 'potato' ? 'contact.potato' : s === 'ceiling' ? 'contact.ceiling' : (s === 'floor' || s === 'ledge' || (flat && s !== 'left' && s !== 'right')) ? 'contact.floor' : 'contact.wall';
    if (s === 'potato') { const t = now(); if (t - pairAt < 0.03) return { voice: null, body: [] }; pairAt = t; }     // two Potatoes meeting is ONE bump, not one each
    return cue(n, { ...c, k01: c.k01 ?? clamp((c.speedInto || 0) / 22, 0, 1) });
  }

  // ---- THE PRIVATE HUM (Mid-Note's bold choice; flag: sounds.json private_hum). The brain calls hum(id) when he thinks he is
  // alone, and humCut() the moment the cursor moves: the note stops mid-way, a beat of nothing, then (half the time) a throat clear.
  let humState = null, lastHum = -1e9, lastWalk = '';
  function hum(id = 0) {
    const R = data.private_hum_rules;
    if (!data.private_hum || !witness || !unlocked || !ac || muted() || !sprite || humState) return false;
    const t = now(); if (t - lastHum < R.at_most_every_s || !budgetOk(t)) return false;
    const rates = R.note_rates; let n = Math.round(pick(R.notes[0], R.notes[1])), i = Math.floor(rnd() * rates.length), run = 0, dir = 0, walk = '';
    const g = out('private', 1, 0), srcs = []; let at = 0; const c = clips.hum_note, ends = [];
    do {
      at = 0; walk = ''; srcs.length = 0; ends.length = 0;
      for (let j = 0; j < n; j++) {
        let d = rnd() < 0.5 ? -1 : 1; if (d === dir && run >= 2) d = -d; run = d === dir ? run + 1 : 1; dir = d;
        i = clamp(i + d * (1 + Math.floor(rnd() * 2)), 0, rates.length - 1); walk += i;
        const r = rates[i] * rateOf(id), hold = pick(0.55, 1) * c.dur / r;                    // notes of different lengths: never a tune
        srcs.push({ at, r, hold }); at += hold + pick(R.note_gap_ms[0], R.note_gap_ms[1]) / 1000; ends.push(at);
      }
    } while (walk === lastWalk);
    lastWalk = walk; lastHum = t;
    const t0 = ac.currentTime + 0.01;
    const nodes = srcs.map(s => { const b = ac.createBufferSource(); b.buffer = sprite; b.playbackRate.value = s.r; b.connect(g); b.start(t0 + s.at, c.at, s.hold * s.r); stats.nodes++; stats.started++; return b; });
    const stop = () => nodes.forEach(b => { try { b.stop(); } catch (e) {} });
    if (!room('private', t0 + at, stop)) { stop(); return false; }
    humState = { g, nodes, t0, end: t0 + at };
    note('private.hum', 'hum', { notes: n, walk });
    return { notes: n, walk, seconds: +at.toFixed(3) };
  }
  function humCut() {
    const R = data.private_hum_rules, h = humState;
    if (!h || !ac || ac.currentTime >= h.end) { humState = null; return { cut: false }; }
    const t = ac.currentTime, f = R.on_cursor_move.fade_out_ms / 1000;
    h.g.gain.setValueAtTime(1, t); h.g.gain.linearRampToValueAtTime(0.0001, t + f);
    h.nodes.forEach(b => { try { b.stop(t + f + 0.005); } catch (e) {} });
    live = live.filter(l => l.bus !== 'private'); humState = null;
    const quiet = pick(R.on_cursor_move.then_silence_ms[0], R.on_cursor_move.then_silence_ms[1]) / 1000;
    const cover = rnd() < R.on_cursor_move.then_chance && !muted() && allowed(R.on_cursor_move.then, now());
    if (cover) { const p = playClip(R.on_cursor_move.then, { at: f + quiet, rate: pick(0.97, 1.03) }); if (p) spendVoice(R.on_cursor_move.then, now(), f + quiet + p.len); }
    note('private.hum', 'cut', { cover, quiet: +quiet.toFixed(3) });
    return { cut: true, cover, quiet_s: +quiet.toFixed(3) };
  }

  // engine wiring: accepts living.on('cue', (name, info)) or ({ name, ...info }); contact the same way
  function attach(living) {
    living.on('cue', (a, b) => (typeof a === 'string' ? cue(a, b) : cue(a.name, a)));
    living.on('contact', c => contact(c));
    living.on('skid', c => cue('contact.skid', { ...c, k01: c.k01 ?? clamp((c.speed || 0) / 22, 0, 1) }));
  }

  const api = {
    cue, contact, mute, unlock, arm, preload, attach, hum, humCut, state, register, ready, stats, onchange: null,
    remove: id => who.delete(id),
    get level() { return level; }, get muted() { return muted(); }, get unlocked() { return unlocked; },
    get context() { return ac; },
    names: () => Object.keys(data.cues).filter(k => k !== 'note'),
    // for tests and for the bench's sound board only: one sound by id, past chance and budget, never past the mute or the lock
    audition(id, o = {}) {
      if (!unlocked || !ac) { stats.blocked_locked++; return false; }
      if (muted()) { stats.blocked_muted++; return false; }
      if (bodyById[id]) return playBody(id, { k: o.k01 ?? 1, gain: o.gain ?? 1, rate: o.rate ?? 1 }) > 0;
      if (sprite && clips[id]) return !!playClip(id, { rate: o.rate ?? 1, gain: o.gain ?? 1, away: o.away, lowpass: o.lowpass });
      return false;
    },
  };
  return api;
}
