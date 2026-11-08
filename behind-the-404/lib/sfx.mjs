// sfx.mjs — tiny synthesized sounds (WebAudio, no files): they sit under the song, never over it.
let ac = null, out = null, bus = null, sbus = null;   // (bus: where tone/noise go right now — the shooter's sounds have their own louder bus)
export function initSfx() {
  if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); out = ac.createGain(); out.gain.value = 0.22; out.connect(ac.destination); } catch (e) { ac = null; }
}
export function setSfxMuted(m) { if (out) out.gain.value = m ? 0 : 0.22; }
function tone(f0, f1, dur, type = 'square', vol = 0.5, at = 0) {
  if (!ac) return; const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(bus || out); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.4, hp = 800, crush = 1, at = 0, ft = 'highpass') {
  if (!ac) return; const n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  let hold = 0; for (let i = 0; i < n; i++) { if (i % crush === 0) hold = Math.random() * 2 - 1; d[i] = hold * (1 - i / n); }
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = ft; f.frequency.value = hp; g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(bus || out); s.start(ac.currentTime + at);
}
// the shooter's bus (round 21, the gamer review: "the gun and hits are nearly silent and the booms are almost all bass"): its
// sounds play through a gain of 2 into the same master (so mute still mutes them), loud enough to sit ON the song, not under it
const SB = fn => (...a) => { if (!ac) return; if (!sbus) { sbus = ac.createGain(); sbus.gain.value = 2.0; sbus.connect(out); } bus = sbus; try { fn(...a); } finally { bus = null; } };
export const SFX = {
  orb: () => { tone(660, 1320, 0.12, 'triangle', 0.28); tone(990, 1980, 0.1, 'sine', 0.14, 0.04); },        // a fresh jump: a bright chime up
  pad: () => { tone(180, 720, 0.22, 'square', 0.28); tone(90, 360, 0.25, 'sine', 0.25); },                 // boing
  shot: () => { tone(1500, 260, 0.08, 'sawtooth', 0.2); tone(2600, 900, 0.035, 'square', 0.1); tone(170, 60, 0.07, 'sine', 0.3); noise(0.03, 0.14, 4200, 3); },   // PEW: a bright zap down, a click on top, a little thump under it (Chikin: "punchier pew pew")
  pop: () => { tone(500, 1400, 0.07, 'triangle', 0.2); noise(0.08, 0.25, 1500, 4); },                     // a word blown apart
  // ---- Confidently Incorrect's shooter (round 20: "is the sound right? do things actually feel like they are getting hit and
  // exploding"): layered, short, a little random each time so a stream of them never buzzes; quiet enough to sit under the song ----
  zap: SB((lv = 0) => { const p = 1 + (Math.random() - 0.5) * 0.1; tone(2700 * p, 1900 * p, 0.04, 'square', 0.16 + 0.02 * lv); noise(0.03, 0.12, 3200, 7); tone(150 * p, 70, 0.035, 'sine', 0.14); }),   // his glitch bolt: a bright crushed blip with a thump (on the 16ths)
  rockHit: SB(() => { const p = 1 + (Math.random() - 0.5) * 0.2; noise(0.012, 0.4, 3000, 1); noise(0.05, 0.38, 1700 * p, 3, 0, 'bandpass'); tone(420 * p, 190, 0.05, 'triangle', 0.2); }),        // a chip knocked off: click + crunch
  tink: SB(() => { tone(2300, 2250, 0.08, 'sine', 0.16); tone(3400, 3300, 0.05, 'sine', 0.09); }),                                                                      // a bolt off the iron
  shipHit: SB(() => { const p = 1 + (Math.random() - 0.5) * 0.15; tone(300 * p, 170, 0.06, 'triangle', 0.16); noise(0.035, 0.2, 2400, 2, 0, 'bandpass'); }),                // a bolt on the hull: clank (one per ~4 bolts)
  rockBoom: SB((big) => { const p = 1 + (Math.random() - 0.5) * 0.16, L = big ? 1.35 : 1;                                                                               // a rock goes up: click, mid crunch, thump, crackle
    noise(0.014, 0.6, 2800, 1); noise(0.2 * L, 0.5, 1300 * p, 3, 0, 'bandpass'); tone(130 * p, 38, 0.3 * L, 'sine', 0.42); noise(0.3 * L, 0.26, 650 * p, 3, 0, 'lowpass'); tone(240 * p, 60, 0.1, 'square', 0.08);
    for (let i = 0; i < 3; i++) noise(0.025, 0.14, 2400, 2, 0.08 + i * 0.05 + Math.random() * 0.03); }),
  bossChunk: SB(() => { noise(0.02, 0.6, 2400, 1); noise(0.3, 0.5, 1000, 4, 0, 'bandpass'); tone(95, 30, 0.6, 'sine', 0.5); noise(0.5, 0.3, 520, 4, 0, 'lowpass'); [420, 630].forEach((f, i) => tone(f, f * 0.96, 0.3, 'triangle', 0.1, 0.02 * i)); noise(0.16, 0.2, 2600, 5, 0.05); }),   // a piece of the hull gives
  bossBoom: SB((small) => { const k = small ? 0.6 : 1; noise(0.02, 0.7, 2400, 1); noise(0.5 * k, 0.5 * k, 1100, 4, 0, 'bandpass'); tone(80, 24, 1.3 * k, 'sine', 0.6 * k); noise(1.2 * k, 0.4 * k, 380, 5, 0, 'lowpass'); tone(160, 40, 0.5, 'sawtooth', 0.08 * k, 0.05);   // a ship goes up: crunch + a long low roll, then debris raining
    for (let i = 0; i < (small ? 3 : 7); i++) noise(0.05, 0.16, 1800 + i * 200, 3, 0.18 + i * 0.11 + Math.random() * 0.05); for (let i = 0; i < (small ? 1 : 3); i++) tone(100 - i * 15, 30, 0.4, 'sine', 0.25, 0.25 + i * 0.22); }),
  spit: SB(() => { tone(130, 420, 0.34, 'sawtooth', 0.09); noise(0.34, 0.22, 600, 4, 0, 'bandpass'); tone(65, 90, 0.34, 'sine', 0.2); }),                                // the ship WINDS UP to spit: a rising gurgle (you hear it coming)
  spitGo: SB(() => { tone(520, 140, 0.1, 'square', 0.14); noise(0.08, 0.3, 900, 2, 0, 'bandpass'); tone(90, 60, 0.08, 'sine', 0.2); }),                                     // …ptoo
  gpulse: SB(() => { noise(0.2, 0.18, 900, 12); tone(1400, 120, 0.2, 'sawtooth', 0.06); tone(70, 140, 0.18, 'sine', 0.12); }),                                             // his glitch pulse: torn digital whoomp (under a rock going up)
  hullHit: SB((last) => { noise(0.015, 0.7, 2600, 1); tone(240, 80, 0.3, 'sawtooth', 0.22); noise(0.22, 0.5, 1200, 3, 0, 'bandpass'); noise(0.18, 0.3, 2000, 14, 0.03); [700, 1050].forEach((f, i) => tone(f, f * 0.97, 0.25, 'triangle', 0.1, 0.01 * i));   // HIS hull takes a hit: crunch + clang + his glitch
    if (last) tone(300, 60, 0.6, 'square', 0.12, 0.1); }),
  mend: SB(() => [523, 784, 1046].forEach((f, i) => tone(f, f * 1.01, 0.14, 'triangle', 0.14, 0.05 + i * 0.07))),                                                        // a worn-down ship: his hull mends
  transform: () => { noise(0.3, 0.45, 900, 10); [300, 450, 680, 1020].forEach((f, i) => tone(f, f * 1.5, 0.08, 'sawtooth', 0.12, i * 0.06)); },   // he glitches into the costume
  revert: () => { noise(0.2, 0.3, 900, 10); [1020, 680, 450].forEach((f, i) => tone(f, f * 0.7, 0.07, 'sawtooth', 0.1, i * 0.05)); },
  beat: () => tone(1200, 1200, 0.025, 'square', 0.06),                                                      // a perfect on-beat landing: a tick
  jump: (big) => tone(big ? 330 : 280, big ? 880 : 620, big ? 0.16 : 0.11, 'square', 0.32),
  land: (k = 1) => tone(140, 60, 0.08, 'sine', Math.min(0.6, 0.25 * k)),
  glitch: (clean) => { noise(clean ? 0.14 : 0.24, 0.5, 1200, clean ? 6 : 14); tone(clean ? 1200 : 700, 150, 0.12, 'sawtooth', 0.12); },
  download: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.1, 'square', 0.22, i * 0.07)),
  dlTick: () => tone(900, 900, 0.03, 'square', 0.08),
  key: (back) => { noise(0.025, back ? 0.22 : 0.3, back ? 2200 : 3200, 1); tone(back ? 300 : 180 + Math.random() * 60, 80, 0.02, 'square', 0.06); },   // a keystroke (Confidently Incorrect's opening)
  power: () => { [392, 494, 587].forEach(f => tone(f, f * 1.01, 0.5, 'triangle', 0.22)); tone(1568, 784, 0.4, 'sine', 0.1); },
  hit: () => { tone(220, 90, 0.25, 'sawtooth', 0.35); noise(0.15, 0.25, 400, 3); },
  die: () => { noise(0.6, 0.55, 300, 20); tone(600, 40, 0.6, 'square', 0.2); },
  checkpoint: () => [880, 1320].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.18, i * 0.09)),
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.22, i * 0.11)),
  click: () => tone(660, 660, 0.04, 'square', 0.12),
  // ---- the kitchen's props (intro.mjs + kitchens.mjs): small, under the instrumental ----
  flick: () => { noise(0.02, 0.3, 2500, 1); tone(1800, 1400, 0.03, 'square', 0.08); },                                                     // a switch
  lampOn: () => { noise(0.02, 0.3, 2500, 1); tone(1800, 1400, 0.03, 'square', 0.08); tone(110, 112, 0.25, 'sawtooth', 0.04, 0.02); },      // click + a little mains hum
  lampOff: () => { noise(0.02, 0.28, 2000, 1); tone(1300, 900, 0.03, 'square', 0.07); },
  burner: () => { noise(0.35, 0.35, 500, 2, 0, 'lowpass'); tone(90, 60, 0.3, 'sine', 0.2); },                                              // whoomp, the gas catches
  rattle: () => { for (let i = 0; i < 5; i++) tone(900 + Math.random() * 300, 700, 0.025, 'square', 0.07, i * 0.05); },                    // a lid chattering
  lidPop: () => { tone(300, 1200, 0.1, 'triangle', 0.25); noise(0.12, 0.3, 3000, 2); tone(1400, 1300, 0.18, 'sine', 0.12, 0.42); noise(0.06, 0.25, 2600, 1, 0.42); },   // pop... clang
  fridgeOpen: () => { noise(0.08, 0.3, 300, 3, 0, 'lowpass'); tone(60, 62, 0.6, 'sine', 0.12, 0.05); tone(120, 121, 0.6, 'triangle', 0.05, 0.05); },   // the seal, the hum
  fridgeShut: () => { noise(0.1, 0.45, 220, 2, 0, 'lowpass'); tone(80, 50, 0.12, 'sine', 0.35); },
  creak: () => { tone(220, 150, 0.22, 'sawtooth', 0.07); tone(330, 260, 0.16, 'sawtooth', 0.05, 0.08); },
  scoot: () => { noise(0.14, 0.25, 900, 6, 0, 'bandpass'); tone(180, 140, 0.12, 'square', 0.06); },
  clatter: () => { [1500, 1900, 1300].forEach((f, i) => tone(f, f * 0.9, 0.06, 'triangle', 0.1, i * 0.07)); noise(0.05, 0.2, 3000, 1); },
  thunk: () => { tone(160, 70, 0.12, 'sine', 0.45); noise(0.06, 0.25, 400, 3, 0, 'lowpass'); },
  squeak: () => { tone(1200, 1700, 0.08, 'sine', 0.12); tone(1700, 1100, 0.1, 'sine', 0.1, 0.08); },
  partyOn: () => { [392, 494, 587, 784].forEach((f, i) => tone(f, f, 0.12, 'square', 0.14, i * 0.06)); noise(0.3, 0.12, 6000, 1, 0.24); },
  partyOff: () => [784, 587, 392].forEach((f, i) => tone(f, f * 0.98, 0.1, 'square', 0.1, i * 0.06)),
  juke: () => { noise(0.05, 0.2, 2500, 1); [262, 330, 392, 523, 392, 330].forEach((f, i) => tone(f, f, 0.09, 'triangle', 0.16, 0.1 + i * 0.09)); },   // a record drops
  boom: () => { tone(110, 38, 0.4, 'sine', 0.6); noise(0.22, 0.35, 220, 4, 0, 'lowpass'); },
  clink: () => { tone(2400, 2300, 0.12, 'sine', 0.14); tone(3100, 3000, 0.08, 'sine', 0.08, 0.03); },
  splash: () => { noise(0.3, 0.3, 1400, 1, 0.05, 'bandpass'); tone(500, 200, 0.12, 'sine', 0.1, 0.05); },
  fanfare: () => [523, 523, 659, 784].forEach((f, i) => tone(f, f, i === 3 ? 0.3 : 0.1, 'sawtooth', 0.11, i * 0.11)),
  bubble: () => { for (let i = 0; i < 6; i++) { const f = 300 + Math.random() * 500; tone(f, f * 2.2, 0.05, 'sine', 0.14, i * 0.07 + Math.random() * 0.03); } },
  flare: () => { noise(0.4, 0.3, 700, 1, 0, 'bandpass'); tone(200, 520, 0.3, 'sine', 0.08); },                                         // a torch / a candle catching
  snuff: () => { noise(0.18, 0.25, 1800, 1); tone(400, 180, 0.15, 'sine', 0.06); },
  clang: () => { [520, 780, 1170].forEach((f, i) => tone(f, f * 0.995, 0.5 - i * 0.1, 'triangle', 0.16)); noise(0.05, 0.3, 2000, 1); for (let i = 1; i < 5; i++) tone(700, 690, 0.05, 'triangle', 0.12 / i, 0.35 + i * 0.12 / (1 + i * 0.3)); },
  hiss: () => { noise(0.6, 0.22, 3500, 1); tone(900, 300, 0.25, 'square', 0.05, 0.3); },
  gravOff: () => { tone(520, 130, 0.7, 'sine', 0.18); tone(780, 195, 0.7, 'triangle', 0.07); },
  gravOn: () => { tone(130, 520, 0.4, 'sine', 0.18); tone(65, 60, 0.15, 'sine', 0.3, 0.38); },
  clunk: () => { tone(140, 90, 0.08, 'square', 0.18); noise(0.05, 0.3, 600, 3, 0, 'lowpass'); },
  clam: () => { tone(200, 500, 0.12, 'sine', 0.18); [1568, 2093].forEach((f, i) => tone(f, f, 0.25, 'sine', 0.08, 0.15 + i * 0.08)); },
  conch: () => { tone(147, 150, 0.6, 'sawtooth', 0.09); tone(294, 296, 0.6, 'triangle', 0.08); tone(147, 140, 0.15, 'sine', 0.2, 0.55); },
  ring: () => { for (let i = 0; i < 8; i++) { tone(1320, 1320, 0.04, 'square', 0.07, i * 0.055); tone(1660, 1660, 0.04, 'square', 0.05, i * 0.055 + 0.027); } },   // an old desk phone's bell
  radio: () => { noise(0.12, 0.12, 2000, 2); [220, 277, 330, 415, 330, 277].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.12, 0.12 + i * 0.16)); },
  drawer: () => { noise(0.22, 0.28, 900, 5, 0, 'bandpass'); tone(90, 70, 0.08, 'sine', 0.3, 0.2); },
  bong: () => [0, 0.45, 0.9].forEach(a => { tone(196, 194, 0.7, 'sine', 0.25, a); tone(392, 390, 0.5, 'triangle', 0.08, a); tone(588, 585, 0.35, 'sine', 0.05, a); }),
  beep: () => { tone(1320, 1320, 0.05, 'square', 0.08); tone(1980, 1980, 0.05, 'square', 0.06, 0.07); },
  regen: () => { tone(110, 440, 0.9, 'sawtooth', 0.06); tone(220, 880, 0.9, 'sine', 0.08); },
  powerDown: () => { tone(440, 90, 0.6, 'sawtooth', 0.06); tone(880, 180, 0.6, 'sine', 0.06); },
  holo: () => { for (let i = 0; i < 5; i++) tone(600 + i * 220, 900 + i * 220, 0.05, 'square', 0.06, i * 0.04); },
  tubeOn: () => { [0, 0.09, 0.16, 0.3].forEach(a => { noise(0.03, 0.2, 2500, 1, a); tone(120, 120, 0.05, 'sawtooth', 0.05, a); }); tone(2000, 2000, 0.02, 'sine', 0.05, 0.32); },
  brew: () => { noise(0.5, 0.18, 1500, 3, 0, 'bandpass'); for (let i = 0; i < 4; i++) tone(500, 900, 0.04, 'sine', 0.08, 0.3 + i * 0.12); },
  hum: () => { tone(120, 120, 0.8, 'sawtooth', 0.05); tone(240, 240, 0.8, 'sine', 0.04); },
  ding: () => { tone(1760, 1750, 0.6, 'sine', 0.2); tone(3520, 3500, 0.3, 'sine', 0.05); },
  glug: () => [0, 0.16, 0.3].forEach((a, i) => { tone(140 + i * 20, 420 + i * 40, 0.1, 'sine', 0.22, a); }),
  thud: () => { tone(120, 50, 0.15, 'sine', 0.45); noise(0.08, 0.3, 300, 4, 0, 'lowpass'); },
  roll: () => { for (let i = 0; i < 6; i++) tone(300 - i * 20, 280 - i * 20, 0.05, 'triangle', 0.08, i * 0.07); },
  fan: () => { noise(0.9, 0.16, 500, 2, 0, 'bandpass'); for (let i = 0; i < 7; i++) tone(70 + i * 9, 72 + i * 9, 0.09, 'triangle', 0.07, i * 0.11); },   // the ceiling fan spinning up: a whirr that climbs
  bloop: () => { tone(240, 520, 0.14, 'sine', 0.2); tone(180, 360, 0.18, 'sine', 0.1, 0.09); },                                               // under water: a soft bloop (a chair floats up)
  sizzle: () => { noise(0.5, 0.3, 2600, 1); tone(900, 1500, 0.12, 'square', 0.06); },                                                          // hot burners under his feet
  // the kitchen of tomorrow (Turn Me Off's room): the saucer lamp's beam, the round TV, the meal dispenser, the glass tube
  beamUp: () => { tone(220, 880, 0.7, 'sine', 0.14); tone(330, 1320, 0.7, 'triangle', 0.05, 0.04); for (let i = 0; i < 6; i++) tone(700 + i * 90, 760 + i * 90, 0.07, 'sine', 0.05, 0.12 + i * 0.09); },   // a rising warble
  beamDown: () => { tone(880, 200, 0.55, 'sine', 0.12); tone(1320, 300, 0.45, 'triangle', 0.04); },
  tvOn: () => { noise(0.02, 0.3, 2500, 1); noise(0.55, 0.22, 1800, 1, 0.03); tone(3000, 3000, 0.4, 'sine', 0.025, 0.1); },                  // clunk, static, the tube's whine
  tvOff: () => { noise(0.02, 0.25, 2200, 1); tone(1300, 70, 0.28, 'sine', 0.12); },                                                          // the picture shrinks to a dot
  dispense: () => { tone(520, 520, 0.06, 'square', 0.1); noise(0.35, 0.16, 700, 3, 0.08, 'bandpass'); tone(180, 260, 0.32, 'sawtooth', 0.05, 0.08); },   // boop + the machine whirring
  pelletPop: () => { tone(400, 1600, 0.09, 'triangle', 0.22); noise(0.04, 0.2, 3000, 1); },
  poof: () => { noise(0.22, 0.25, 1200, 2, 0, 'bandpass'); [784, 1046, 1318].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.1, 0.06 + i * 0.06)); },   // a pellet becomes a whole dinner: ta-da
  tubeWhoosh: () => { noise(0.75, 0.3, 900, 1, 0, 'bandpass'); tone(260, 1100, 0.45, 'sine', 0.06); tone(1100, 360, 0.35, 'sine', 0.05, 0.45); },
  // Ghost (rhythm typing): a key he gets (perfect: a bright keystroke + a glitch chirp; good: just the keystroke) · a miss · a send
  // (his: the swoosh with his glitch on it; James's: the plain swoosh) · the phone booting back up after a phone-off
  note: (perfect) => { noise(0.02, 0.28, 3200, 1); tone(perfect ? 1760 : 1320, perfect ? 2640 : 1320, 0.05, 'square', perfect ? 0.1 : 0.07); if (perfect) noise(0.05, 0.12, 2000, 8, 0.02); },
  flub: () => { tone(200, 110, 0.12, 'triangle', 0.22); noise(0.06, 0.12, 600, 2); },
  whoosh: (his) => { noise(0.22, his ? 0.3 : 0.2, his ? 1400 : 2400, his ? 7 : 1); tone(his ? 900 : 700, his ? 300 : 1400, 0.18, his ? 'sawtooth' : 'sine', his ? 0.1 : 0.08); },
  boot: () => [262, 392, 523].forEach((f, i) => tone(f, f, 0.6, 'triangle', 0.14, i * 0.01)),
};
