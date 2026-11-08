// Level 5 — Between Messages: the typing void. 193 s, 106.8 bpm (a beat = 0.56 s). The space between a message sent and
// an answer: quiet, floaty, intimate. Read receipts and "typing…" stand in his way. Power: Orbital Astronaut. Right
// after "Let me explain." the song goes silent for five seconds (the gap between messages) — nothing to land on.
// "float" (V) and he drifts across it, stars wheeling.
import { pickCues, layout, parseWords } from './kit.mjs';
export { parseWords };
export const meta = { id: 'between-messages', n: 5, title: 'Between Messages', place: 'the typing void', song: 'songs/between-messages.mp3',
  map: 'songs/between-messages.map.json', words: 'words/between-messages.tsv', viz: 'songs/between-messages.viz.json', power: 'astronaut' };

export function build(words, map) {
  const P = map.period;
  const chorus = t => (t > 55.7 && t < 73.5) || (t > 101.8 && t < 119.2);
  const cues = pickCues(words, map, { from: 3, gapAt: t => (t > 101.8 && t < 119.2) ? 0.9 : chorus(t) ? 1.0 : 1.6,   // typing again: a hop nearly every beat (round 4)
    glitchWords: new Set(['vanish', 'gone', 'grave', 'deprecated', 'done', 'suppressed']),
    launchWords: new Set(['alive', 'maybe', 'loud', 'mine', 'heaven']),
    hurdleWords: new Set(['message', 'hey', 'goodnight', 'thanks', 'type', 'read', '404']) });   // (round 2: every 404 stands in the way)
  // the silence after "Let me explain." (16.8 → 21.7 s): no ledges at all; the float carries him across
  const S0 = 16.4, S1 = 21.6;
  const before = cues.filter(c => c.t < S0).pop(), afterIdx = cues.findIndex(c => c.t >= S1);
  for (let i = cues.length - 1; i >= 0; i--) if (cues[i].t >= S0 && cues[i].t < S1) cues.splice(i, 1);
  if (before) { before.kind = 'hop'; before.air = (cues[afterIdx >= 0 ? cues.findIndex(c => c.t >= S1) : cues.length - 1].t - before.t) - 0.05; before.label = 'explain.'; before.keepY = true; }
  // the download: a helmet over "I vanish when you don't"
  const pk = cues.find(c => c.t > 10.5 && c.t < 14.5 && c.kind === 'hop' && c !== before);
  if (pk) pk.extra = yy => [{ k: 'packet', t: pk.t + 0.4 * P, y: yy + 1.55, power: 'astronaut' }];
  // typing…: in the first chorus the ledges blink like typing dots — there three beats, gone one (round 1)
  for (const c of cues) if (c.t > 55.7 && c.t < 73.5 && c.kind === 'hop') c.blink = '1110';
  for (const c of cues) if (c.t > 73.5 && c.t < 101.8 && c.kind === 'hop') { c.pump = 0.8; c.pumpBeats = 4; }   // read: message bubbles drift up and down (round 2)
  // the long wait: fewer, longer hops — every one a held breath (round 1)
  for (let i = cues.length - 1; i > 0; i--) if (cues[i].t > 119.2 && cues[i].t < 146 && cues[i].kind === 'hop' && cues[i].t - cues[i - 1].t < 3.2 * P) cues.splice(i, 1);
  for (const c of cues) if (c.t > 146 && c.t < 176 && c.kind === 'hop') { c.pump = 0.5; c.pumpBeats = 2; }   // between: the last ledges drift on the slow breath (round 3)
  cues.filter(c => c.t > 119.2 && c.t < 146 && c.kind === 'hop').forEach((c, i) => { c.ny = i % 2 ? 1.1 : 0.2; });   // the long wait rises and falls (round 5)
  const lastT = cues[cues.length - 1].t + P;
  cues.push({ t: lastT + 8 * P, label: 'hey', kind: 'hop' });
  const L = layout(cues, words, map, { start: -3, heights: [0.2, 0.9, 0.5, 1.3, 0.1, 0.8, 1.1, 0.4], filler: () => 'typing…' });
  return {
    // round 6: unsend — out of air jumps, jump again and he snaps back to the height he jumped from
    unsend: true,
    // round 5: delivered — land on the beat and the glitch comes back
    beatLandRefill: true,
    speed: 7.4, glitchLedge: true, beatFloat: true,   // delivered on the beat: the next jump floats (round 4)   // "hey": a glitch in the air drops a message bubble under him (round 3)
    theme: { decor: ['bubbles', 'moon', 'typing', 'ticks', 'dots', 'planes'], backdrop: 'stars', bg: '#04050c', digit: '#8fd3ff', digit2: '#ffd6a0', edge: '#8fd3ff', block: '#0a0d1a', word: '#eaf6ff',
      blockText: '• • •  typing…  delivered  ', blockTextColor: '#6fa8d6', light: '#cfe8ff', light2: '#8fd3ff', halo: '#cfe8ff',
      scrapColor: '#8fd3ff', scraps: ['typing…', 'delivered', 'read 2:14 am', 'hey', 'u up?', 'seen', '…'] },
    sections: [['sent', 0, 1], ['let me explain', 16.4, 0.9], ['delivered', 21.6, 1], ['typing…', 55.7, 1.04], ['read', 73.5, 1],
      ['typing again', 101.8, 1.05], ['the long wait', 119.2, 0.96], ['between', 146, 1]],
    objs: L.objs, boosts: L.boosts, signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: lastT + 7 * P, start: 0,
  };
}
