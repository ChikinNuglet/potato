// Level 2 — Get Down: the party server. 132 s, 193.6 bpm (a beat = 0.31 s). The kitchen's back door opens on the party
// that never ended. The chorus "get down"s are a dance floor that pumps on the beat, and every "down" steps you down.
// Power: Disco Legend. At the break (~96 s) the floor tears away; "drop it" (V) on the drop and it slams back on the beat.
import { pickCues, layout, parseWords, beatCues, bare } from './kit.mjs';
export { parseWords };
export const meta = { id: 'get-down', n: 2, title: 'Get Down', place: 'the party server', song: 'songs/get-down.mp3',
  map: 'songs/get-down.map.json', words: 'words/get-down.tsv', viz: 'songs/get-down.viz.json', power: 'disco' };

export function build(words, map, viz) {
  const P = map.period, O = map.offset, T = b => O + b * P;
  const chorus = t => (t > 50 && t < 74) || (t > 100 && t < 130);
  // the opening bars have no words: hop the kicks the analyzer hears
  const intro = beatCues(viz, map, T(6), Math.min(words.length ? words[0].t0 - 0.4 : 15, 15.5), { every: 2, labels: ['get', 'down'] });
  const sung = pickCues(words, map, { from: 15.5, gapAt: t => chorus(t) || (t > 90 && t < 96.3) ? 0.95 : 1.9,   // the build before the break: a chain (round 3)
    glitchWords: new Set(['wrong', 'gone', 'stop', 'quit', 'skip']), launchWords: new Set(['down', 'party', 'floor', 'night']),
    hurdleWords: new Set(['bass', 'beat', 'shake']) });
  const cues = [...intro, ...sung].sort((a, b) => a.t - b.t);
  // every "down" steps him down; the chorus floor pumps on the beat
  let y = 0.6;
  for (const c of cues) {
    if (bare(c.label) === 'down' && c.kind === 'hop') { c.ny = -0.3; }
    if (chorus(c.t)) { c.pump = 0.22; c.bounce = true; }                   // the dance floor throws him on the beat (round 1)
  }
  cues.filter(c => c.t > 101 && c.t < 130 && c.kind === 'hop').forEach((c, i) => { c.ny = i % 2 ? 1.2 : 0.1; });   // the last chorus zigzags (round 4)
  cues.filter(c => c.t > 15.5 && c.t < 50 && c.kind === 'hop' && c.ny == null).forEach((c, i) => { c.ny = [0.2, 1.3, 0.6, 1.6, 0.0, 1.0][i % 6]; });   // the party never ended: more up and down (round 6)
  // the disco moment: the break tears the floor away; the drop (100 s) brings it back only if he drops it
  const BREAK = 95.6, DROP = 101.2;   // (round 5: the floor tears away a bar earlier — a longer drop)
  const gated = cues.filter(c => c.t > BREAK && c.t < DROP);
  for (const c of gated) { c.needs = 'disco'; c.gateT = BREAK; c.gateEnd = DROP; c.pump = 0.3; }
  if (!gated.length) cues.push({ t: 98.0, label: 'drop', kind: 'hop', needs: 'disco', gateT: BREAK, gateEnd: DROP });
  // the download: a mirrorball over a word in the second verse, one jump up
  const pk = cues.find(c => c.t > 84 && c.t < 90 && c.kind === 'hop');
  if (pk) pk.extra = yy => [{ k: 'packet', t: pk.t + 0.5 * P, y: yy + 1.55, power: 'disco' }];
  const lastT = cues[cues.length - 1].t + P;
  for (let k = 1; k <= 6; k++) cues.push({ t: lastT + k * 2 * P, label: ['get', 'down', 'get', 'down', 'get', 'down'][k - 1], kind: 'hop', pump: 0.22, bounce: true });   // the encore: a bouncing floor to the door (round 2)
  cues.push({ t: lastT + 16 * P, label: 'out', kind: 'hop' });
  const L = layout(cues, words, map, { start: -3, y0: y, heights: [0.4, 1.0, 0.6, 1.3, 0.2, 0.9, 0.5, 1.2], filler: t => (t > 74 && t < 96) ? 'BASS' : 'down' });
  return {
    // round 6: a glitch on the beat spins him higher
    beatBlinkK: 1.25,
    // round 5: on-beat bounces build a combo, each one higher
    bounceCombo: true,
    // after the drop the whole floor throws him on the beat for two bars (round 4)
    speed: 8.4, airJumpOnBeat: true, beatJumpK: 1.2, discoParty: true, theme: { decor: ['spots', 'crowd', 'floorlights', 'mirrorball', 'speedlines', 'partyconfetti'], backdrop: 'grid', bg: '#05060f', digit: '#38e8ff', digit2: '#ff8a3d', edge: '#38e8ff', block: '#0a0d1e', word: '#ffe2b0',
      light: '#ff8a3d', light2: '#38e8ff', halo: '#ffb36b', scrapColor: '#38e8ff',
      scraps: ['now playing', 'party.server', 'DJ booth uplink', 'request: one more', '♪ 193 bpm', 'last call (never)', 'get down'] },
    sections: [['the back door', 0, 1], ['the party never ended', 15.5, 1], ['the floor', 50, 1.05], ['the second room', 74, 1],
      ['the break', BREAK, 1], ['the drop', DROP, 1.1], ['out', lastT, 1]],
    objs: L.objs, boosts: L.boosts, signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: lastT + 14 * P, start: 0,
  };
}
