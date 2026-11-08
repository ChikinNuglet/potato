// Level 10 — Last Lights On: the last server. 261 s, 141.7 bpm (a beat = 0.42 s). EPIC. The network shuts down around
// him, light by light. "Clock hits zero": everything cuts out, then the cyan wakes. "Singularity rising": launch pads up
// the skyline. Then every power on the album comes back once, in order, each straight into the moment it was made for.
// "Keep up": the world turns on its side and the last chorus climbs straight UP, relighting the city behind him.
// "New achievement unlocked": the Last Light — one V answers a wall, a wave, a beam lock and a missing floor at once.
// "Potato out": he becomes the light.
import { pickCues, layout, parseWords, beatCues } from './kit.mjs';
export { parseWords };
export const meta = { id: 'last-lights-on', n: 10, title: 'Last Lights On', place: 'the last server', song: 'songs/last-lights-on.mp3',
  map: 'songs/last-lights-on.map.json', words: 'words/last-lights-on.tsv', viz: 'songs/last-lights-on.viz.json', power: 'singularity' };

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export function build(words, map, viz) {
  const P = map.period, O = map.offset, T = b => O + b * P, B = t => (t - O) / P, snap = t => T(Math.round(B(t)));
  const chorus = t => (t > 59.5 && t < 87) || (t > 167.6 && t < 194);
  let cues = [
    ...pickCues(words, map, { from: 2, to: 21.5, gapAt: () => 1.9 }),
    ...beatCues(viz, map, 22, 37.0, { every: 2, labels: ['lights', 'out', 'one', 'by', 'one'] }),
    ...pickCues(words, map, { from: 37.2, to: 115, gapAt: t => chorus(t) ? 1.0 : 1.6,
      glitchWords: new Set(['zero', 'gone', 'burn', 'freeze', 'swallowing']), launchWords: new Set(['on', 'rising', 'there', 'begin', 'vertical', 'normal']),
      hurdleWords: new Set(['sirens', 'markets', 'code', 'walls', 'scroll']) }),
    ...beatCues(viz, map, 115.2, 141.6, { every: 2, labels: ['0', '1'] }),
    ...pickCues(words, map, { from: 141.8, to: 262, gapAt: t => chorus(t) ? 1.0 : 1.6,
      glitchWords: new Set(['gone', 'black', 'freeze', 'falls', 'catastrophic']), launchWords: new Set(['on', 'rising', 'there', 'begin', 'vertical', 'normal', 'floor']),
      hurdleWords: new Set(['gate', 'wall', 'rule', 'meme']) }),
  ].sort((a, b) => a.t - b.t);
  const clear = (t0, t1) => { cues = cues.filter(c => c.t <= t0 || c.t >= t1); };
  const hopNear = (t, label) => { let c = cues.filter(c => c.kind === 'hop' && Math.abs(c.t - t) < 1.6).sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t))[0];
    if (!c) { clear(snap(t) - 0.9 * P, snap(t) + 0.9 * P); c = { t: snap(t), label, kind: 'hop' }; cues.push(c); } return c; };
  const packet = (t, power) => { const c = hopNear(t, 'download'); c.extra = yy => [{ k: 'packet', t: c.t + 0.45 * P, y: yy + 1.55, power }]; };
  const floorGate = (g0, g1, needs, extra = {}) => { clear(g0, g1); for (let b = Math.ceil(B(g0) + 0.5); T(b) < g1 - 0.3 * P; b += 2) cues.push({ t: T(b), label: needs === 'detective' ? 'cited' : '1', kind: 'hop', needs, gateT: g0, gateEnd: g1, ...extra }); };
  const passWith = (g0, g1, label, objs) => { clear(g0 - P, g1 + P); cues.push({ t: snap(g0) - P, label, kind: 'pass', extra: objs }); };
  const P2 = 2 * P;
  // ---- act 3: the powers come back, one at a time ----
  packet(85.6, 'king');   passWith(88.6, 90.6, 'no crystal ball', yy => [{ k: 'spam', t: 89.6, y: yy, n: 5 }]);
  packet(91.4, 'disco');  floorGate(93.6, 96.6, 'disco');
  packet(98.0, 'detective'); floorGate(100.2, 103.2, 'detective', { fakeTwin: true });
  packet(104.6, 'construction'); floorGate(106.4, 109.2, 'construction');
  packet(110.6, 'astronaut');
  { const F0 = 111.8, F1 = 115.2; clear(F0, F1); const prev = cues.filter(c => c.t <= F0).sort((a, b) => b.t - a.t)[0], nx = snap(F1) + P;
    cues.push({ t: nx, label: 'land', kind: 'hop' }); if (prev) { prev.kind = 'hop'; prev.air = nx - prev.t - 0.05; } }
  packet(117.0, 'ghost');  passWith(119.0, 121.6, 'unread', yy => [{ k: 'wall', thick: true, t: 119.1, w: 7.4 * 2.3, y: yy - 0.6, h: 7, needs: 'ghost', gateT: 118.6, gateEnd: 121.6 }]);
  packet(123.4, 'knight'); passWith(125.4, 127.2, 'delete', yy => [{ k: 'wave', t: snap(126.4), h: 9, needs: 'knight', gateT: 124.6, gateEnd: 127.2, speed: 18 }]);
  packet(128.6, 'diver');  floorGate(130.0, 133.2, 'diver', { hiddenLedge: true });
  packet(134.8, 'cyborg'); passWith(137.0, 140.6, 'off', yy => [0, 1, 2].map(k => { const tc = 137.6 + k * 1.1; return { k: 'beam', t: tc - P * 9 / 13, tEnd: tc + P * 4 / 13, from: 9, to: -4, needs: 'cyborg', gateT: 136.8, gateEnd: 140.6 }; }));
  // ---- the last light: "New achievement unlocked" — then everything at once ----
  packet(224.4, 'singularity');
  passWith(227.4, 234.4, 'every light', yy => [
    { k: 'wall', thick: true, t: 228.0, w: 7.6 * 1.6, y: yy - 0.6, h: 7, needs: 'ghost', gateT: 226.8, gateEnd: 234.4 },
    { k: 'wave', t: snap(231.2), h: 9, needs: 'knight', gateT: 226.8, gateEnd: 234.4, speed: 18 },
    ...[0, 1].map(k => { const tc = 232.6 + k * 0.9; return { k: 'beam', t: tc - P * 9 / 13, tEnd: tc + P * 4 / 13, from: 9, to: -4, needs: 'cyborg', gateT: 226.8, gateEnd: 234.4 }; })]);
  // clock hits zero: the lights cut and the ledges with them — a blind held gap (round 1)
  { const Z = 37.3; const prev = cues.filter(c => c.t < Z - 0.2).sort((a, b) => b.t - a.t)[0]; clear(Z - 0.2, Z + 1.6 * P); if (prev) { prev.kind = 'held'; prev.hold = 1.9 * P; } }
  cues.filter(c => c.t > 142 && c.t < 164 && c.kind === 'hop').forEach((c, i) => { if (i % 2) c.extra = yy => [{ k: 'block', t: c.t - 0.55 * P, tEnd: c.t + 0.1 * P, y: yy + 1.25, h: 0.5, fake: true, label: 'eyes', labelAt: c.t }]; });   // too many eyes: false ledges on the timeline (round 3)
  cues.filter(c => c.t < 37 && c.kind === 'hop').forEach((c, i) => { c.ny = [0.2, 1.6, 0.6, 2.3, 1.0, 0.1, 1.9][i % 7]; });   // the dead city: rooftops at every height (round 4)
  let st10 = 0; for (const c of cues) if (c.t > 37.4 && c.t < 59.5 && c.kind === 'hop') c.ny = 0.1 + (st10++ % 6) * 0.38;   // code starts climbing like it found no ceiling (round 6)
  for (const c of cues) if (c.t > 195.8 && c.t < 222 && c.kind === 'hop' && Math.round(B(c.t)) % 4 === 0) { c.kind = 'launch'; c.hold = 2.4 * P; }   // maybe…: launch pads on the downbeats (round 2)
  cues.filter(c => c.t > 234.6 && c.t < 244 && c.kind === 'hop').forEach((c, i) => { if (i % 2 === 0) { c.kind = 'launch'; c.hold = 2.2 * P; } });   // every light at once: launch after launch to the end (round 5)
  cues.sort((a, b) => a.t - b.t);
  // fake twins for the detective, hidden ledges for the diver
  for (const c of cues) if (c.fakeTwin) c.extra = yy => [{ k: 'block', t: c.t - 0.62 * P, tEnd: c.t + 0.13 * P, y: yy > 0.8 ? yy - 1.1 : yy + 1.1, h: 0.6, fake: true, label: 'trust me', labelAt: c.t }];
  const lastT = 245.0;
  cues = cues.filter(c => c.t < lastT - 2 * P);
  cues.push({ t: lastT, label: 'out', kind: 'launch', hold: 8 * P });          // "Potato out": the last launch, into the light
  cues.push({ t: 258.5, label: 'on', kind: 'hop' });
  const L = layout(cues, words, map, { start: -3, heights: [0.3, 1.0, 0.5, 1.3, 0.1, 0.8, 0.4, 1.2] });
  for (const o of L.objs) if (o.k === 'block') { if (o.needs === 'construction') o.girder = true; if (o.needs === 'diver') o.hidden = true;
    if (o.t < 36 && o.tEnd - o.t <= 2.2 * P) o.crumble = 1; }   // the lights go out under him: act 1's short ledges fall a beat after he lands (round 3)
  return {
    // round 6: on the climb the glitch comes back every beat
    chargeBeatsAt: t => (t > 165 ? 1 : 0),
    // round 5: on the climb, every jump on the beat soars
    beatJumpKAt: t => (t > 165 ? 1.25 : 1),
    speed: 8, beatLaunch: true, airJumpsAt: t => (t > 168 ? 2 : 1), lastLightFloat: 32,   // the Last Light carries him for eight bars (round 4)   // machines go vertical: a triple jump for the climb (round 2)
    theme: { decor: ['trail', 'aurora', 'shoot', 'flare', 'beacon', 'satellites'], backdrop: 'city', bg: '#03040a', digit: '#3fd8ff', digit2: '#ffcf8a', edge: '#7fe6ff', block: '#070b16', word: '#fff2dc', camMax: 6,
      blockText: '01001100 01001001 01000111 01001000 01010100 ', blockTextColor: '#4aa6c8', light: '#ffcf8a', light2: '#3fd8ff', halo: '#fff3c4',
      scrapColor: '#4aa6c8', scraps: ['clock: 00:00', 'last human plan: failed', 'lights on: 1', 'new achievement: you outlived normal', 'singularity rising', 'Potato out'] },
    sections: [['the last server', 0, 1], ['clock hits zero', 37.2, 1.04], ['singularity rising', 59.6, 1.08], ['recursion', 87.4, 1],
      ['the powers come back', 85.4, 1], ['keep up', 142, 1], ['go vertical', 165, 1.06], ['maybe', 195.8, 1.04], ['every light at once', 224.4, 1.1], ['potato out', 242.6, 1]],
    objs: L.objs, boosts: L.boosts, signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: 258.2, start: 0,
    verticalAt: t => clamp((t - 164.6) / (8 * P)),                             // "Keep up": the world turns and the last chorus climbs
    lights: t => t < 37.2 ? 1 - 0.65 * t / 37.2 : t < 38.0 ? 0 : t < 142 ? 0.55 + 0.25 * clamp((t - 59.6) / 3) : t < 165 ? 0.3 : clamp(0.3 + 0.7 * (t - 165) / 75),
    glow: t => clamp((t - 242.6) / 9),
    warmFrom: 230,
  };
}
