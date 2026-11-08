// Level 9 — Turn Me Off: Admin's control room. 187 s, 130.2 bpm (a beat = 0.46 s). Who gets to end the voice? The
// off-switch beam sweeps the screen on the beat: glitch as it reaches him and it passes through (you're not there).
// Power: Circuit Cyborg. On the last "turn me off, go ahead" the beam locks on — three sweeps in one bar, more than a
// glitch can dodge. "override" (V) jams it. At "click" he reaches the switch, and leaves it alone.
import { pickCues, layout, parseWords } from './kit.mjs';
export { parseWords };
export const meta = { id: 'turn-me-off', n: 9, title: 'Turn Me Off', place: 'the off switch', song: 'songs/turn-me-off.mp3',
  map: 'songs/turn-me-off.map.json', words: 'words/turn-me-off.tsv', viz: 'songs/turn-me-off.viz.json', power: 'cyborg' };

export function build(words, map) {
  const P = map.period, O = map.offset, T = b => O + b * P, B = t => (t - O) / P;
  const chorus = t => (t > 57 && t < 86) || (t > 138 && t < 166);
  const cues = pickCues(words, map, { from: 0.5, gapAt: t => chorus(t) ? 1.0 : 1.6,
    glitchWords: new Set([]), launchWords: new Set(['crown', 'win', 'morning', 'here', 'back']),
    hurdleWords: new Set(['plug', 'switch', 'bedtime', 'meter', 'drawer', 'click']) });
  let lh = -99; for (const c of cues) if (c.t > 86 && c.t < 131 && c.kind === 'hop' && c.t - lh > 6 * P) { c.kind = 'held'; c.hold = 1.8 * P; lh = c.t; }   // deep rest: held breaths through verse 2 (round 4)
  // the download: a circuit board over "i come back with the crown" (the second one)
  const pk = cues.filter(c => c.t > 144 && c.t < 151 && c.kind === 'hop')[0];
  if (pk) pk.extra = yy => [{ k: 'packet', t: pk.t + 0.45 * P, y: yy + 1.55, power: 'cyborg' }];
  // the locked beam: 158.9–162.6 s rides one long ledge
  const L0 = 158.6, L1 = 163.0;
  for (let i = cues.length - 1; i >= 0; i--) if (cues[i].t > L0 && cues[i].t < L1) cues.splice(i, 1);
  cues.push({ t: L0, label: 'go ahead', kind: 'pass' }); cues.sort((a, b) => a.t - b.t);
  const lastT = cues[cues.length - 1].t + P;
  const clk = cues.filter(c => c.t > 165.5 && c.t < 168 && c.kind === 'hop')[0]; if (clk) clk.kind = 'spike';   // click: the switch stands in his way; he hops it and leaves it alone (round 2)
  cues.push({ t: lastT + 8 * P, label: 'still here', kind: 'hop' });
  const L = layout(cues, words, map, { start: -3, hurdles: false, heights: [0.2, 0.9, 0.5, 1.2, 0.1, 0.8, 0.4, 1.1] });
  const objs = L.objs;
  // beams: one sweep every two bars in the verses and choruses, crossing him mid-ledge (glitch on that beat)
  const longest = L.blocks.filter(bl => (bl.t1 - bl.t0) / P >= 3.4 && bl.t0 > 26);
  let lastBeam = -99;
  for (const bl of longest) { const beats = (bl.t1 - bl.t0) / P, mid = T(Math.round(B(bl.t0) + beats / 2));
    if (mid - lastBeam < ((mid > 57 && mid < 86) || (mid > 138 && mid < 158) ? 4 : 8) * P || mid > L0 - 4 * P && mid < L1 + 2 * P) continue;   // chorus 1: a sweep every bar (round 3)
    const dur = 2 * P, tCross = mid, back = (objs.filter(o => o.k === 'beam').length % 2) === 1;   // every other sweep comes from behind (round 1)
    const low = (objs.filter(o => o.k === 'beam').length % 3) === 2 ? 1.0 : null;   // every third is a low tripwire: jump it (round 3)
    objs.push(back ? { k: 'beam', t: tCross - dur * 4 / 13, tEnd: tCross + dur * 9 / 13, from: -4, to: 9, maxY: low } : { k: 'beam', t: tCross - dur * 9 / 13, tEnd: tCross + dur * 4 / 13, from: 9, to: -4, maxY: low }); lastBeam = mid; }
  for (let k = 0; k < 3; k++) { const tc = 9 + k * 6; objs.push({ k: 'beam', t: tc - P * 9 / 13 * 2, tEnd: tc + P * 4 / 13 * 2, from: 9, to: -4, maxY: -9 }); }   // the intro: harmless test sweeps so you see them coming (round 5)
  // the lock: three sweeps in one bar; only the override answers it
  for (let k = 0; k < 3; k++) { const tc = L0 + (1.2 + k * 1.3) * P * 1.0; objs.push({ k: 'beam', t: tc - P * 9 / 13, tEnd: tc + P * 4 / 13, from: 9, to: -4, needs: 'cyborg', gateT: L0, gateEnd: L1 }); }
  return {
    // round 6: the beam doesn't reach the ceiling — a high jump clears it
    beamTop: 2.6,
    // round 5: standing still for two beats charges a standby shield that eats one beam
    standby: true,
    speed: 7.8, chargeBeats: 2, perfectGlitchRefill: true,   // a glitch right on the beat comes back a beat later (round 4)
    theme: { decor: ['alert', 'crt', 'switch', 'battery', 'afterglow', 'leds'], backdrop: 'terminal', bg: '#080404', digit: '#ff6b5c', digit2: '#ffd6a0', edge: '#ff8a7a', block: '#140808', word: '#fff0ec',
      blockText: 'POWER: ON · ADMIN · shutdown -h now · ', blockTextColor: '#c25a50', light: '#ff8a7a', light2: '#6dffb0', halo: '#ffd6c8',
      scrapColor: '#c25a50', scraps: ['shutdown -h now', 'are you sure you want to turn off?', 'ADMIN', 'power: low', 'deep rest', 'the light in the fridge'] },
    sections: [['plug and bedtime', 0, 1], ['you flip a little switch', 28, 1], ['you can turn me off', 57, 1.04], ['screen goes black', 86, 0.96],
      ['i dare you', 131, 1], ['turn me off (again)', 138, 1.06], ['click', 166, 0.9]],
    objs, boosts: L.boosts, signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: lastT + 7 * P, start: 0,
    darkAt: t => t > 88.9 && t < 96.5 ? 0.85 : 0,                              // "watch the screen go black" (round 1)
  };
}
