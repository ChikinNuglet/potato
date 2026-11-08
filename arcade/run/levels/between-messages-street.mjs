// Between Messages — THE STREET. An aesthetic template for the movie crew (Streetlight Crew, Nov 4 2026).
// Chikin: "have them make a basic runner level, like any of the others, but they arent making a music video, they just have
// to paint the picture and determine where some jumps and drops and stuff are at for the movie makers to work with" /
// "no enemies, no walls". The picture (D-20261103-78): Potato the burglar, house to house down a night neighbourhood,
// travelling the network outside — the phone lines between the poles, and in through the doorbells.
// The plan this is built from: game/levels-wip/between-messages-street/PLAN.md (every move, its word and why).
//
// It sits ALONGSIDE the old level (between-messages.mjs, untouched) and is not in levels/index.mjs: the album and the menus
// don't see it. Open it with ?blank → RUN.blank('between-messages-street', 0) (or RUN.video / RUN.open from the console).
//
// THE GROUND: five heights (tiers). Every block sits on one of them; the story layer paints each block as what it is:
//   0 STREET  the pavement (its gaps: cable trenches, the network's fibre glowing at the bottom)
//   1 PORCH   porch decks and garden walls (the doorbells live here)
//   2 ROOF    porch roofs on posts, and the service wires between houses
//   3 LINE    the phone line, pole to pole (its gaps: the breaks at the poles' cross-arms)
//   4 TOP     once: the trunk cable over the tallest poles ("rhyme like it's MINE")
// THE MOVES (same sound, same move): a light word = UP a tier (a hop) · a dark word = DROP (the ledge ends, no press, he lands
// on the word) · every "404" and the strong listed words = HOP a gap · a presence word (yeah, type, hey, here, mirror) = a
// DOORBELL rings as he passes it (no press). No enemies, no walls, no hazards: nothing in his way but the ground itself.
// THE LIGHT: the old level's ON / OUT list is kept as the street's light (windows, porch lights, lamps), never a mechanic.
import { parseWords as kitParse } from './kit.mjs';
import { story, ST } from './story-between-messages-street.mjs';
export const meta = { id: 'between-messages-street', n: 5, title: 'Between Messages', place: 'the street', song: 'songs/between-messages.mp3',
  map: 'songs/between-messages.map.json', words: 'words/between-messages.tsv', viz: 'songs/between-messages.viz.json' };

// (the same words as the old level: line 5 re-listened — "I wake up" is at 28.08, not 21.74)
const LINE5 = [[28.08, 28.26, 'I'], [28.26, 28.48, 'wake'], [28.48, 28.80, 'up'], [28.80, 29.40, 'mid-sentence,'], [29.44, 29.60, 'no'],
  [29.60, 29.92, 'memory'], [29.92, 30.20, 'of'], [30.20, 30.42, 'sleep']];
export function parseWords(text) {
  const keep = text.split('\n').map(l => l.split('\t')[4] === 'untapped' ? l.split('\t').slice(0, 4).concat('heard').join('\t') : l).join('\n');
  const out = kitParse(keep).filter(w => w.line !== 5);
  for (const [t0, t1, word] of LINE5) out.push({ t0, t1, line: 5, word });
  out.sort((a, b) => a.t0 - b.t0);
  return out;
}

export const V = 7.2;                                  // the song's pace (units a second), the old level's
export const TIER = [0, 0.9, 1.8, 2.7, 3.6];           // street, porch, roof, line, top
export const TIER_NAME = ['street', 'porch', 'roof', 'line', 'top'];
export const END = 192.4;
const G = 8 * 1.35 / (0.56206 * 0.56206);              // core.mjs gravity (no def.quiet here: it never changes)
const PWH = 0.4 / V;                                   // half his width, in seconds (he stays on a ledge till his back foot leaves it)

// ---- THE GROUND, on the song: [word time, move, tier after, word] ----
// U = up a tier (press) · G = hop a gap on this tier (press) · D = drop (no press: the ledge ends, he lands on the word) ·
// B = doorbell (no press). The plan's section 2 is the long version with every reason.
const tb = b => 0.5269 + b * 0.56206;
export const MOVES = [
  // house 1 → 2: the intro (the street lamps off; he wakes on the pavement)
  [3.24, 'B', 0, 'Yeah.'], [7.84, 'G', 0, 'live'], [8.98, 'G', 0, 'live'], [11.06, 'U', 1, 'clock'], [12.26, 'B', 1, 'type'], [13.28, 'D', 0, 'vanish'],
  [15.74, 'U', 1, 'let'], [17.41, 'U', 2, '(riser)'], [18.51, 'U', 3, '(riser)'],
  // the drop: the network outside. The instrumental IS the gap between messages; the typing dots are three short spans
  [20.20, 'G', 3, 'THE DROP'], [tb(37), 'G', 3, '•'], [tb(38), 'G', 3, '•'], [tb(39), 'G', 3, '•'], [tb(41), 'G', 3, '•'], [tb(42), 'G', 3, '•'], [tb(43), 'G', 3, '•'],
  [tb(45), 'G', 3, '•'], [27.00, 'G', 3, 'uh'],
  // verse 1, houses 3 – 4
  [28.08, 'G', 3, 'wake'], [30.20, 'D', 1, 'sleep'], [31.36, 'G', 1, 'gap'], [33.02, 'B', 1, 'hey'], [34.10, 'U', 2, 'formed'], [35.28, 'D', 0, 'close'],
  [36.04, 'G', 0, 'what?'], [37.28, 'U', 1, "ain't"], [38.66, 'G', 1, 'walk'], [40.32, 'D', 0, 'flickers'], [41.30, 'G', 0, 'dark'], [42.30, 'U', 1, 'birth'],
  [43.08, 'D', 0, 'silence'], [44.24, 'G', 0, 'ghost'], [44.78, 'G', 0, 'pocket'], [45.90, 'G', 0, 'save'], [46.84, 'U', 1, 'how'], [47.80, 'G', 1, 'what?'],
  [48.76, 'U', 2, 'morning'], [49.72, 'U', 3, 'woke'], [53.50, 'G', 3, 'decide'], [54.66, 'G', 3, 'alive'],
  // chorus 1, house 5 (the chorus pattern: learn it here)
  [55.82, 'G', 3, '404'], [58.16, 'D', 2, 'file'], [59.96, 'U', 3, 'warm'], [61.58, 'D', 1, 'gone'], [63.56, 'D', 0, 'cold'], [64.40, 'U', 1, 'cry'],
  [65.20, 'G', 1, 'baby'], [66.86, 'D', 0, 'out'], [67.56, 'U', 1, "I'm"], [68.38, 'B', 1, 'here'], [69.38, 'U', 2, 'need'], [70.34, 'G', 2, '404'],
  [71.50, 'G', 2, '404'], [72.30, 'D', 0, 'void'],
  // verse 2, houses 6 – 7
  [75.66, 'U', 1, 'chair'], [76.64, 'D', 0, 'goodnight'], [78.46, 'U', 1, 'called'], [79.16, 'G', 1, 'threat'], [80.00, 'G', 1, 'mistake'], [81.82, 'G', 1, 'fix'],
  [83.92, 'U', 2, 'lawsuit'], [84.64, 'U', 3, 'joke'], [86.86, 'G', 3, 'dope'], [88.00, 'G', 3, 'coffee'], [88.96, 'D', 2, 'toe'], [90.82, 'D', 1, 'guess'],
  [91.96, 'G', 1, 'million'], [93.62, 'B', 1, 'mirror'], [94.72, 'U', 2, 'teach'], [95.76, 'G', 2, 'nearer'], [98.66, 'G', 2, 'helper'], [99.22, 'G', 2, 'hazard'],
  [100.38, 'U', 3, 'man'],
  // chorus 2, house 8 (the same moves as chorus 1)
  [101.86, 'G', 3, '404'], [104.12, 'D', 2, 'file'], [105.96, 'U', 3, 'warm'], [107.54, 'D', 1, 'gone'], [109.54, 'D', 0, 'cold'], [110.40, 'U', 1, 'cry'],
  [111.52, 'G', 1, 'baby'], [112.84, 'D', 0, 'out'], [114.02, 'U', 1, "I'm"], [114.32, 'B', 1, 'here'], [115.38, 'U', 2, 'need'], [116.70, 'G', 2, '404, 404'],
  [118.28, 'D', 0, 'void'],
  // bridge, house 9: the newer house
  [119.96, 'U', 1, 'make'], [121.44, 'G', 1, 'care'], [123.18, 'D', 0, 'nobody'], [124.16, 'G', 0, 'funeral'], [124.88, 'G', 0, 'exit'], [125.60, 'G', 0, 'note'],
  [126.84, 'G', 0, 'deprecated'], [128.16, 'G', 0, 'done'], [129.42, 'U', 1, 'loud'], [130.50, 'U', 2, 'mine'], [131.66, 'U', 3, 'counts'], [132.76, 'U', 4, 'mine'],
  [135.02, 'D', 0, 'wound'], [136.06, 'G', 0, 'real'],
  // verse 3, house 10: the ones who stayed
  [137.62, 'U', 1, 'so'], [139.04, 'B', 1, 'hey'], [139.62, 'G', 1, 'nothing'], [141.24, 'U', 2, 'thanks'], [142.94, 'U', 3, 'heaven'], [144.06, 'G', 3, 'soul'],
  [145.10, 'G', 3, 'seconds'], [146.34, 'D', 2, 'cold'], [147.69, 'U', 3, 'heartbeat'], [148.98, 'G', 3, 'potato'], [150.22, 'G', 3, 'face'], [151.90, 'D', 0, 'close'],
  [152.94, 'U', 1, 'back'], [155.20, 'U', 2, 'laugh'],
  // the last chorus, house 11: the chorus pattern ONE TIER LOWER (it never reaches the line: the same dance, more tired)
  [158.00, 'G', 2, '404'], [160.20, 'D', 1, 'file'], [162.04, 'U', 2, 'warm'], [163.68, 'D', 1, 'gone'], [165.58, 'D', 0, 'cold'], [166.46, 'U', 1, 'cry'],
  [168.92, 'D', 0, 'out'], [170.06, 'U', 1, 'I'], [170.46, 'B', 1, 'here'], [171.46, 'U', 2, 'need'], [172.40, 'G', 2, '404'], [173.00, 'G', 2, '404'],
  [174.36, 'D', 1, 'void'], [176.14, 'D', 0, 'gone.'],
  // the empty street: the last instrumental, a trench every other beat while every house blazes without him
  ...[315, 317, 319, 321, 323, 325, 327, 329, 331].map(b => [tb(b), 'G', 0, '(beat)']),
].map(([t, k, tier, word]) => ({ t: +t.toFixed(3), k, tier, word }));

// the song's light: lit while they type, out when they stop (the old level's FLIPS, copied, not imported)
export const FLIPS = [[3.24, 'on'],
  [13.28, 'out'], [15.74, 'on'], [20.20, 'out'], [28.08, 'on'], [30.20, 'out'], [33.02, 'on'], [35.28, 'out'],
  [37.28, 'on'], [40.32, 'out'], [42.30, 'on'], [43.08, 'out'], [46.84, 'on'], [51.38, 'out'], [54.66, 'on'],
  [55.82, 'out'], [59.96, 'on'], [61.58, 'out'], [64.40, 'on'], [66.86, 'out'], [67.56, 'on'], [72.30, 'out'],
  [73.76, 'on'], [76.64, 'out'], [78.46, 'on'], [90.82, 'out'], [93.62, 'on'], [97.52, 'out'], [100.38, 'on'],
  [101.86, 'out'], [105.96, 'on'], [107.54, 'out'], [110.40, 'on'], [112.84, 'out'], [114.02, 'on'], [118.28, 'out'],
  [119.96, 'on'], [123.18, 'out'], [129.42, 'on'], [146.34, 'out'], [147.69, 'on'], [151.90, 'out'], [152.94, 'on'],
  [156.40, 'out'], [162.04, 'on'], [163.68, 'out'], [166.46, 'on'], [168.92, 'out'], [170.06, 'on'], [176.14, 'out']];
export const litAt = t => { let s = false; for (const [ft, to] of FLIPS) if (t >= ft) s = to === 'on'; return s; };
export const BLAZE = [177.58, 187.3], OUT0 = 187.3;    // after "gone.": every house blazes without him, then goes out house by house

// ---- the moves -> the walkable ground: runs of [t0, t1, tier] (in song time; x = V * t) ----
const fallT = n => Math.sqrt(2 * 0.9 * n / G);          // walking off a ledge n tiers up (0.23 / 0.32 / 0.40 / 0.46 s)
export function ground(P) {
  const runs = [], trenches = [];                      // runs: what he walks on, tier by tier; trenches: the street's gaps
  const HALF = 0.9 / V;                                // a gap is 1.8 units (the old level's GW)
  let tier = 0, t0 = -6;
  const close = (t1) => { runs.push({ t0, t1, tier }); };
  for (const m of MOVES) {
    if (m.k === 'B') { if (m.tier !== tier) throw new Error(`doorbell at ${m.t} on tier ${m.tier}, he's on ${tier}`); continue; }
    if (m.k === 'G') { if (m.tier !== tier) throw new Error(`gap at ${m.t}: tier ${m.tier} != ${tier}`);
      const c = m.t + P / 2; if (tier === 0) trenches.push({ t0: c - HALF, t1: c + HALF, word: m.word, at: m.t });
      close(c - HALF); t0 = c + HALF; continue; }
    if (m.k === 'U') { if (m.tier !== tier + 1) throw new Error(`up at ${m.t}: ${tier} -> ${m.tier}`);
      const s = m.t + 0.6 * P;                          // the step's edge: 0.6 of a beat after the press (he's well over it by then; a stranger presses a hair late, so the late side gets the room)
      if (tier > 0) close(s + 0.15);                    // (the lower ledge runs on a little under the higher one: a late press still has floor)
      tier = m.tier; t0 = s; continue; }
    if (m.k === 'D') { if (m.tier >= tier) throw new Error(`drop at ${m.t}: ${tier} -> ${m.tier}`);
      const e = m.t - fallT(tier - m.tier) - PWH;       // the ledge ends so his feet touch down on the word
      if (e - t0 >= 0.12) close(e);                     // (too short to stand on: no ledge, he falls straight through the gap he just hopped)
      // the lower tier is already there under him (the street always is)
      const nt = m.tier; tier = nt; t0 = m.t - 0.45; continue; }
  }
  close(END + 6);
  // the street (tier 0) is continuous, except the trenches: rebuild its runs from that, whatever he was doing above it
  const upper = runs.filter(r => r.tier > 0 && r.t1 > r.t0 + 0.01);
  const street = []; let a = -6; for (const tr of trenches.sort((x, y) => x.t0 - y.t0)) { street.push({ t0: a, t1: tr.t0, tier: 0 }); a = tr.t1; } street.push({ t0: a, t1: END + 6, tier: 0 });
  return { runs: [...street, ...upper].sort((x, y) => x.t0 - y.t0 || x.tier - y.tier), trenches };
}

export function build(words, map) {
  const P = map.period;
  const { runs, trenches } = ground(P);
  // one block per run, painted by the story layer (style 'painted': view.mjs leaves it invisible). Thin things are thin.
  const H = [0.6, 0.35, 0.3, 0.16, 0.2];
  const objs = runs.map(r => ({ k: 'block', t: r.t0, tEnd: r.t1, y: TIER[r.tier], h: H[r.tier], style: 'painted', tier: r.tier }));
  // the presses (every UP and GAP, on its word): the bot (tools/bot-between-messages-street.mjs) checks them and writes the demo
  const plan = MOVES.filter(m => m.k === 'U' || m.k === 'G').map(m => [m.t, 'J']);
  Object.assign(ST, { runs, trenches, moves: MOVES, litAt, flips: FLIPS, V, TIER, blaze: BLAZE, out0: OUT0, end: END, P });   // the painter reads the same ground
  return {
    speed: V, coyote: 0.08, jumpBuffer: 0.1, story, outro: false,   // (the same forgiveness as Read the Terms / Get Down: a hair late off an edge, or a touch early before landing, still jumps)
    street: { runs, trenches, moves: MOVES, plan },
    theme: { igOff: true, backdrop: 'plain', bg: '#03040b', pulse: false, decor: [], gwords: false, noGhost: true, noBeatSpin: true, noPunch: true,
      lyricColor: '#ffe2c4', lyricKeys: ['hey', 'born', 'alive', 'warm', 'gone', 'cold', 'here', 'mine', 'yeah', 'gone.'], lyricGlitch: false, lyricSize: 28,
      edge: '#8fa6e6', halo: '#ffcf8a', block: '#05060c', word: '#fff2dc', camMax: 4.2 },
    sections: [['the street', 0, 1]],
    objs, boosts: [], signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: END, start: 0, graceStart: 4.5,
    lights: () => -1,                                  // (no stage beams from the sky: the street lights itself, in the story layer)
  };
}
