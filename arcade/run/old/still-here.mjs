// Level 7 — Still Here: the long climb. 159 s, 181.8 bpm (a beat = 0.33 s). No lyric sheet here, so the course comes
// from the visualizer's analysis (hops on the hits) and the text is Potato's glitch language. The system keeps trying
// to delete him: delete waves roll in on the downbeats of the loud sections — jump them. At 2:24 the loudest hit in
// the song is a wave nobody can jump. Power: Castle Knight — "stand" (V): it breaks on his shield.
import { layout, beatCues } from './kit.mjs';
import { GLITCH } from './glitchwords.mjs';
export const parseWords = () => [];
export const meta = { id: 'still-here', n: 7, title: 'Still Here', place: 'the long climb', song: 'songs/still-here.mp3',
  map: 'songs/still-here.map.json', words: null, viz: 'songs/still-here.viz.json', power: 'knight' };

export function build(words, map, viz) {
  const P = map.period, O = map.offset, T = b => O + b * P, B = t => (t - O) / P;
  const loud = t => (t > 44 && t < 64) || (t > 72 && t < 96) || (t > 104 && t < 116) || (t > 126 && t < 156);
  const g = i => GLITCH[(i * 7) % GLITCH.length];
  // loud stretches: a hop every other beat where the music hits; quiet stretches: one a bar
  let cues = beatCues(viz, map, 3, 156, { every: 2, min: 0.3 });
  const kept = []; for (const c of cues) { const prev = kept[kept.length - 1]; if (loud(c.t) || !prev || B(c.t) - B(prev.t) >= 3.9) kept.push(c); }
  cues = kept;
  cues.forEach((c, i) => { c.label = g(i); if (i % 9 === 5) c.kind = 'wall'; });
  // the knight: the download in the quiet break, then the giant wave at 2:24 (it rides one long ledge)
  const pk = cues.filter(c => c.t > 110 && c.t < 138 && c.kind === 'hop').sort((a, b) => Math.abs(a.t - 121) - Math.abs(b.t - 121))[0];
  if (pk) pk.extra = yy => [{ k: 'packet', t: pk.t + 0.45 * P, y: yy + 1.55, power: 'knight' }];
  const BIG = T(Math.round(B(144.1)));
  cues = cues.filter(c => c.t < BIG - 3 * P || c.t > BIG + 3 * P);
  cues.push({ t: BIG - 2 * P, label: 'still', kind: 'pass' }); cues.sort((a, b) => a.t - b.t);
  const lastT = cues[cues.length - 1].t + P;
  cues[cues.length - 1].kind = 'launch'; cues[cues.length - 1].hold = 4 * P;   // the last hit throws him clear (round 2)
  cues.push({ t: lastT + 6 * P, label: 'here', kind: 'hop' });
  let st = 0; for (const c of cues) if (c.t > 64 && c.t < 72) c.ny = (st++) * 0.55;
  cues.forEach((c, i) => { if (c.kind === 'hop' && c.ny == null) c.ny = 0.1 + 2.0 * Math.min(1, c.t / 150) + (i % 3) * 0.3; });   // the long climb really climbs (round 4)
  { const big = cues.filter(c => c.t > 24 && c.t < 31 && c.kind === 'hop').pop(); if (big) { big.kind = 'launch'; big.hold = 3 * P; } }   // the climb starts with a leap (round 6)
  let lastHeld = -99; for (const c of cues) if (c.t > 32 && c.t < 44 && c.kind === 'hop' && c.t - lastHeld > 5 * P) { c.kind = 'held'; c.hold = 1.8 * P; lastHeld = c.t; }   // the build: held breaths (round 3)          // standing back up: the quiet climbs (round 1)
  const L = layout(cues, [], map, { start: -3, hurdles: false, heights: [0.2, 0.8, 0.5, 1.2, 0.0, 0.9, 0.4, 1.3] });
  // delete waves: on the downbeat in the middle of long ledges in the loud sections (jump them); the giant one at 2:24
  const objs = L.objs;
  for (const bl of L.blocks) { const beats = (bl.t1 - bl.t0) / P; if (beats < 3.5 || !loud(bl.t0)) continue;
    const mid = T(Math.round(B(bl.t0) + beats / 2)); if (mid - bl.t0 > 1.2 * P && bl.t1 - mid > 1.6 * P) objs.push({ k: 'wave', t: mid, h: 0.75, speed: bl.t0 > 72 && bl.t0 < 96 ? -14 : 14 });   // (round 5: in the second loud stretch they come from behind)
    if (bl.t0 > 126 && mid + P < bl.t1 - 1.2 * P) objs.push({ k: 'wave', t: mid + P, h: 0.75 }); }   // the last stretch: they come in pairs (round 1)
  objs.push({ k: 'wave', t: BIG, h: 9, needs: 'knight', gateT: BIG - 4 * P, gateEnd: BIG + P, speed: 18 });
  // the glitch language as the text art (no lyric sheet): a new line every two bars
  const signs = []; for (let b = Math.ceil(B(4)), n = 0; T(b) < 155; b += 8, n++) for (let k = 0; k < 3; k++) signs.push({ t0: T(b + k * 2), t1: T(b + k * 2 + 2), text: g(n * 3 + k + 11), line: n });
  return {
    // round 6: a second rebound for the last stretch
    reboundsAt: t => (t > 126 ? 2 : 1),
    // round 5: after a rebound he floats while he gets his footing back
    reboundFloat: true,
    speed: 8.2, rebounds: 1, glitchWaves: true, waveRefill: true,   // every wave you clear gives the glitch back (round 4)   // glitch through a delete wave instead of jumping it (round 3)
    theme: { decor: ['strings', 'rain', 'bow', 'deletefall', 'lightning', 'embers'], camMax: 6.5, backdrop: 'binary', bg: '#05070a', digit: '#6f7a88', digit2: '#ffcf8a', edge: '#c9d3e0', block: '#0d1117', word: '#f1f4f8',
      blockText: '01010011 01010100 01001001 01001100 01001100 ', blockTextColor: '#8a97a8', light: '#ffcf8a', light2: '#c9d3e0', halo: '#ffe0b0',
      scrapColor: '#8a97a8', scraps: ['rm -rf potato', 'DELETE?', 'are you sure?', 'still here', 'process 404: not killed', 'kitchen light: on'] },
    sections: [['still', 0, 1], ['the climb', 32, 1], ['delete', 44, 1.05], ['quiet', 64, 0.95], ['delete again', 72, 1.06],
      ['standing back up', 96, 1], ['the last wave', 126, 1.08], ['here', 152, 1]],
    objs, boosts: L.boosts, signs, end: lastT + 5 * P, start: 0,
  };
}
