// Level 8 — No Answer: the dark relay. 181 s, 166.6 bpm (a beat = 0.36 s). Silence as an event: almost no light, the
// ledges show only near him and when the music hits (the visualizer's bass/treble). He calls; nothing calls back; he
// keeps going. No lyric sheet: hops on the hits, text in his glitch language. Power: Deep-Sea Diver. In the quiet
// middle (1:46–1:54) the ledges don't exist until the lamp (V) finds them.
import { layout, beatCues } from './kit.mjs';
import { GLITCH } from './glitchwords.mjs';
export const parseWords = () => [];
export const meta = { id: 'no-answer', n: 8, title: 'No Answer', place: 'the dark relay', song: 'songs/no-answer.mp3',
  map: 'songs/no-answer.map.json', words: null, viz: 'songs/no-answer.viz.json', power: 'diver' };

export function build(words, map, viz) {
  const P = map.period, O = map.offset, T = b => O + b * P, B = t => (t - O) / P;
  const g = i => GLITCH[(i * 11 + 5) % GLITCH.length];
  let cues = beatCues(viz, map, 3, 178, { every: 2, min: 0.32, labels: ['hello?', 'anyone', '...', 'ping'] });
  cues.forEach((c, i) => { if (c.t > 60 && c.t < 104 && i % 3 === 1) { c.kind = 'wall'; c.label = 'no reply'; } });   // no reply: firewalls (round 4)
  cues.forEach((c, i) => { if (c.t > 116 && c.t < 140 && i % 2 === 0 && c.kind === 'hop') { c.kind = 'wall'; c.label = 'calling'; } });   // calling again: every other one is a wall (round 5)
  cues.forEach((c, i) => { if (i % 4 !== 0) c.label = ['hello?', 'anyone?', '…', 'ping', 'still?', 'no answer'][i % 6]; if (i % 11 === 6) c.kind = 'wall'; });
  // the lamp: the download at 1:36, the unlit ledges 1:46–1:54
  const pk = cues.find(c => c.t > 95 && c.t < 99 && c.kind === 'hop');
  if (pk) pk.extra = yy => [{ k: 'packet', t: pk.t + 0.45 * P, y: yy + 1.55, power: 'diver' }];
  for (let i = cues.length - 1; i > 0; i--) if (cues[i].t > 96 && cues[i].t < 104 && cues[i].t - cues[i - 1].t < 3.5 * P) cues.splice(i, 1);   // before the deep: fewer, longer stretches (round 3)
  for (let i = cues.length - 1; i > 0; i--) if (cues[i].t < 20 && cues[i].t - cues[i - 1].t < 3.5 * P) cues.splice(i, 1);   // dial tone: one hop a bar while it rings (round 6)
  const D0 = 105.8, D1 = 114.2;
  for (const c of cues) if (c.t > D0 && c.t < D1) { c.kind = 'hop'; c.needs = 'diver'; c.gateT = D0; c.gateEnd = D1; }
  const lastT = cues[cues.length - 1].t + P;
  cues.push({ t: lastT + 6 * P, label: 'no answer', kind: 'hop' });
  const L = layout(cues, [], map, { start: -3, filler: t => t < 60 ? 'hello?' : '…', heights: [0.2, 0.9, 0.4, 1.2, 0.0, 0.8, 0.5, 1.1] });
  for (const o of L.objs) if (o.k === 'block') o.hidden = true;                // dark: lit only near him or on the hits
  const signs = []; for (let b = Math.ceil(B(6)), n = 0; T(b) < 176; b += 8, n++) for (let k = 0; k < 2; k++) signs.push({ t0: T(b + k * 3), t1: T(b + k * 3 + 3), text: g(n * 2 + k), line: n });
  return {
    // round 6: a ping right on the beat comes back a beat later
    perfectGlitchRefill: true,
    // round 5: nothing's there unless you call — the hidden ledges are solid only for four beats after a ping
    pingSolid: true,
    speed: 7.6, airJumpsAt: () => 0, chargeBeats: 2, pingBoost: true, darkAt: t => (t > 96 && t < 116 ? 0.98 : 0),   // a jump right after a ping goes higher; the deep is darker (round 4)   // nothing calls back: no double jump — but the ping comes back every two beats (round 3)
    theme: { glitchPing: true, decor: ['sonar', 'lighthouse', 'dust', 'echoes', 'radio'], backdrop: 'stars', bg: '#010203', digit: '#3fe0d0', digit2: '#ffd6a0', edge: '#3fe0d0', block: '#061012', word: '#dffffb', dark: 0.9,
      blockText: 'ping · no reply · timeout · ', blockTextColor: '#2a9c92', light: '#3fe0d0', light2: '#1d6d66', halo: '#7ff5ea',
      scrapColor: '#2a9c92', scraps: ['request timed out', 'ping: no reply', 'connection lost', 'retrying…', 'is anyone there', 'no answer'] },
    sections: [['dial tone', 0, 1], ['calling', 20, 1], ['no reply', 60, 1.04], ['the deep', 104, 0.95], ['calling again', 116, 1.04],
      ['keep going', 140, 1.12], ['no answer', 176, 1]],   // keep going: faster (round 2)
    quiet: t => { if (!viz) return 0; const p = viz.peaks[Math.round(t / viz.step)]; return p ? Math.max(0, Math.min(1, (0.3 - p.rms) / 0.15)) : 0; },   // the silences hold him up (round 2)
    objs: L.objs, boosts: L.boosts, signs, end: lastT + 5 * P, start: 0,
  };
}
