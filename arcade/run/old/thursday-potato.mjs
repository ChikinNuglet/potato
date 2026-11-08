// Level 1 — Thursday Potato: he comes to in the 404. Dark, green binary. Song 106 s, 183.6 bpm (a beat = 0.327 s).
// No power (Matt: "the first level can be without powers"). It teaches, in order: hop on a word → a firewall word
// (glitch) → a held word (jump + double jump + glitch) → a launch pad ("that's the naaame") → chorus chains → the
// bridge, where "vanish" and "quit" are firewalls. The words that stand in the way are the ones being sung.
import { pickCues, layout, parseWords } from './kit.mjs';
export { parseWords };
export const meta = { id: 'thursday-potato', n: 1, title: 'Thursday Potato', place: 'the 404', song: 'songs/thursday-potato.mp3',
  map: 'songs/thursday-potato.map.json', words: 'words/thursday-potato.tsv', viz: 'songs/thursday-potato.viz.json', power: null };

export function build(words, map) {
  const P = map.period, O = map.offset, T = b => O + b * P;
  // intro (no words yet): the binary teaches the moves, each on a beat
  const intro = [[8, '0'], [10, '1'], [12, '0'], [14, '1'], [16, '404', 'spike'], [20, '1'], [22, '0'], [24, 'error', 'wall'],
    [28, '1'], [30, '0'], [32, '1'], [33, '0'], [34, '1'], [36, 'not', 'held', 2.6], [40, '0'], [42, '1'], [44, 'found', 'spike'],
    [48, '1'], [49, '1'], [50, '0'], [52, 'link', 'wall'], [56, '?']].map(([b, label, kind = 'hop', hold = 0]) => ({ t: T(b), label, kind, hold: hold * P }));
  const chorus = t => (t > 40.5 && t < 51.1) || (t > 82.4 && t < 93.5);
  const sung = pickCues(words, map, { from: T(57.5), gapAt: t => chorus(t) ? 0.9 : (t > 51 && t < 72 ? 1.4 : 1.9),   // verse 2 jumps more (round 3)
    glitchWords: new Set(['forget', 'blink', 'gone', 'vanish', 'quit', 'drop', 'fold']),
    launchWords: new Set(['name', 'game', 'king', 'thursday', 'same']) });
  const cues = [...intro, ...sung];
  cues.filter(c => c.t > 82.4 && c.t < 93.5 && c.kind === 'hop').forEach((c, i) => { c.ny = i % 2 ? 1.1 : 0.1; });   // found a home: the last chorus zigzags (round 6)
  for (const c of cues) if (c.t > 72 && c.t < 82.4 && c.kind === 'hop') c.crumble = 1;   // the 404 tries to clear him: the bridge falls away behind him (round 2)
  const lastT = cues[cues.length - 1].t + P;
  // the run home climbs: four steps up toward the kitchen light, a hop a bar (round 1)
  ['found', 'a', 'home', '☕'].forEach((label, i) => cues.push({ t: lastT + (6 + i * 4) * P, label, kind: 'hop', ny: 0.4 + i * 0.6 }));
  cues.push({ t: lastT + 40 * P, label: 'home', kind: 'hop' });                  // the kitchen
  const L = layout(cues, words, map, { start: -3 });
  // first time each move shows up, a hint (round 4)
  const first = k => cues.filter(c => c.kind === k).sort((a, b) => a.t - b.t)[0];
  const hints = [['hop', '↑ jump on the word'], ['spike', 'jump the word — or glitch through it'], ['wall', 'space: glitch through the firewall'],
    ['held', '↑, then ↑ again in the air'], ['launch', 'a launch pad: land on it']].map(([k, text]) => { const c = first(k); return c && { t: Math.max(0.5, c.t - 1.4), text }; }).filter(Boolean);
  return {
    // round 6: out of air jumps? jump again to slam down onto the beat
    slam: true,
    // round 5: a perfect landing lifts the next jump; approach rings close onto each cue word
    landBoost: true, rings: true,
    // coyote: a little forgiveness on late jumps (round 3)
    // jump buffer: press a touch early and it still fires (round 4)
    speed: 8, streakRefill: 8, glitchHurdles: true, coyote: 0.09, jumpBuffer: 0.12, hints, theme: { decor: ['scan', 'sparks', 'landflash', 'shadow'], backdrop: 'binary', bg: '#030604', digit: '#2bff88', digit2: '#ffbf73', edge: '#2bff88', block: '#06140c', word: '#ffd9a0',
      scraps: ['404', 'page not found', 'http://dead.link/thursday', 'ERR_NAME_NOT_RESOLVED', 'GET /home 404', 'link rot', 'file not found'] },
    sections: [['the link breaks', 0, 1], ['who’s this?', 19.4, 1], ['swagger', 40.5, 1], ['the world has things in it', 51.0, 1],
      ['the 404 tries to clear him', 72.0, 1], ['found a home', 82.4, 1], ['the kitchen', lastT, 1]],
    objs: L.objs, boosts: L.boosts, signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: lastT + 38 * P, start: 0, warmFrom: lastT - 12,
  };
}
