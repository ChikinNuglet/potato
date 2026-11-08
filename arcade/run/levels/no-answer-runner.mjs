// Level 8 — No Answer, THE RUNNER (Night Shift Detectives, Nov 4). Behind ?noanswer=runner; the old level is untouched
// (run/saved/no-answer-before-runner/). Chikin: "if we can make this a runner, we have something good. What stays, a darker
// setting and the need of a flashlight… the key point of finding a password is what drives the level" · "use the movie as a
// template for the aesthetics and storytelling". The crew's plan: levels/no-answer-runner/PLAN.md (DESIGN, LIGHTING, STORY,
// STORY-READ, JOKES beside it). All times are song seconds, on the sung WORDS (words/delivery/no-answer.json).
//
// THE CASE OF THE BIGGEST DOOR. Black city, thin teal line art, ONE warm-white cone from the torch in his hatband, and the
// ENTER MASTER PASSWORD box in the sky (top right) as the moon: the only goal, on screen all song. He runs. Whatever the beam
// finds feeds the box: LEADS (warm glint) pin a card, he types the guess, DENIED, the light steps down; BLANKS (cold glint,
// the box's cursor blinking on them) pin a card that just blinks. Five DENIEDs, four blanks, an empty field: the player
// presses Enter (Space) on nothing, and every door opens. "nobody ever set one."
//
// BEAT SHEET (t · word · what happens)
//    0.0–6.0   intro          the locked screen → he stands under the field, collar up → the street. Runs at 6.0
//    9.64      "yeah"         the box rises into the sky (the moon); the hint ______ pins (blank 1)
//   14.4–18.0                 crates (teach jump) · 19.45 the first DOOR (teach glitch: he goes through, it stays shut)
//   22.33      the first hit  the street lamp dies behind him: only his beam (stub)
//   23–36      wet street     jumps + the first ducks in the stub, one more door
//   41.00      "ask"          the FREE-POTATO coupon (lead, the beam finds it on its own) → `potato` 43.50 DENIED "with"
//   49.64      "black"        one song beat of black: his eyes, the box, the street line
//   51.20      "gap?"         the drain · 52.50 "crack?" the NIEPAL flag in the kerb: DUCK to tip the beam onto it
//   54.84      "i"            `niepal` DENIED · 58.28–60.02 "no answer, no answer": black, flat ground
//   60.02      "case"         CLICK: the beam to FULL · 63.40 question face · 64.44 the dead monitor's sticky note (lead, auto)
//   67.24      "i"            `password` DENIED on the d · 70.9–72.6 a white page blows past, out of reach (the plant)
//   84.02      "when"         the THU calendar page up on the wall: JUMP to lift the beam onto it (held back) · `> saving this one.`
//   89–92      every door     three doors glitched through, rattling locked · 97.96 "more": `maybe` DENIED · `> that was my whole answer.`
//   103.71     the swell      the BIGGEST DOOR on the horizon (moon rim) · 111.54 "name?" its brass nameplate: blank
//   119.31–120.03 "shake"     he stops at it (one song beat): it rattles hollow; Space = a purple fizzle on its frame, nothing more
//   127.44     "case"         the beam flares once · 129.64 the roofs (the peak, hardest run)
//   139.70     held "knows"   THE PAGE comes back: catch it at the top of a jump (miss: it lands on the route, he runs over it)
//   149.80     the hush       back at the door · 151.46 "again": the THU card flies in, `thursday` · 154.62 "wrong" DENIED, the
//                             beam flickers from out · the box's ↵ pulses · 157.34 "beautiful": Space = ENTER ON NOTHING
//   161.66     "no answer" ⚡ UNLOCKED. the doors open one a beat, the first warm light · 167.42 "still here" · ~170 `> nobody ever set one.`
//   172.85     inside         an empty room of screens, each one his small purple side-eye. 181.0 the end
//
// TEXT: the box (ENTER MASTER PASSWORD, his guesses, DENIED, UNLOCKED), THU on the calendar, the page's own field + its red 42.,
// the faint lyric line top centre (SURE + LIKELY lines only), three lowercase thoughts in faint purple (DRAFTS for Chikin).
// The look: modes/no-answer-runner.mjs (the box, cards, cone overlay, his glitches) + story-no-answer-runner.mjs (the city, the dark).
import { parseWords as kitParse } from './kit.mjs';
import { story } from './story-no-answer-runner.mjs';
import { mode, modeView, hunt, retryAt, SHARED } from '../modes/no-answer-runner.mjs';
export const parseWords = text => kitParse(text);
export const meta = { id: 'no-answer-runner', n: 8, title: 'No Answer', place: 'the case of the biggest door', song: 'songs/no-answer.mp3',
  map: 'songs/no-answer.map.json', words: 'words/no-answer.tsv', viz: 'songs/no-answer.viz.json', power: null };

// ---- the feel (Thursday's roomy windows: a stranger gets about ±0.15 s on a hop, a duck, a glitch) ----
const HOPB = 1.5, GLF = 0.5, DUCKF = 0.5;
export const END = 181.0;
// ---- sections + speed (units/s: DESIGN §4.1). The only standing: the ≤6 s intro and one song beat at the biggest door ----
export const SECTIONS = [['the case', 0, 0], ['the case', 6.0, 4.8], ['the street', 9.64, 5.0], ['wet street', 23.05, 5.4], ['the leads', 37.45, 5.6],
  ['still on the case', 60.02, 6.2], ['every door', 88.50, 6.2], ['the biggest door', 98.60, 5.8], ['shake', 119.31, 0], ['chorus away', 120.03, 6.4],
  ['the roofs', 129.64, 6.8], ['back to the door', 141.40, 6.0], ['the hush', 149.80, 4.6], ['the doors open', 161.66, 6.6],
  ['inside', 172.85, 6.6], ['inside', 174.0, 4.6], ['inside', 175.0, 3.2], ['inside', 176.0, 2.4]];
export const vAt = t => { let v = 0; for (const [, a, k] of SECTIONS) if (t >= a) v = k; return v; };
// ---- THE COURSE on the sung words (DESIGN §4.3): [press time, kind, word]. kinds: low = jump a crate · high = duck a sign ·
// door = glitch through a locked door · gap = jump the drain · roof = jump on and off a rooftop box · sill = a soft threshold
export const COURSE = [
  [14.41, 'low', 'hand'], [16.21, 'low', 'song'], [18.01, 'low', 'answer'], [19.45, 'door', '(the first door)'],
  [25.21, 'low'], [26.65, 'high'], [28.09, 'low'], [29.53, 'low'], [30.97, 'door'], [32.41, 'high'], [33.85, 'low'], [35.29, 'high'],
  [38.89, 'low', 'answer'], [42.13, 'high', 'what'], [45.02, 'low', 'if'], [47.18, 'high', 'ask'],
  [51.20, 'gap', 'gap?'], [53.66, 'low', 'say'], [56.18, 'low', 'know'],
  [62.66, 'low', 'mirror'], [64.44, 'low', 'they hand me'], [65.54, 'high', 'impossible'], [68.06, 'low', 'hold'], [69.50, 'low', 'whole'],
  [73.46, 'high', 'flex'], [75.26, 'low', 'solving'], [76.70, 'high', 'questions'], [78.86, 'high', "don't"], [81.03, 'low', "ain't"], [82.47, 'low', 'to'],
  [85.35, 'high', 'to'], [86.79, 'low', 'then'], [88.23, 'low', 'whole'],
  [89.31, 'door', 'check'], [90.75, 'door', 'bag'], [92.19, 'door', 'metaphor'],
  [100.83, 'low', 'couple'], [102.63, 'high', 'me'], [104.43, 'low', 'see'], [106.59, 'high', 'you'], [108.75, 'low', 'word'],
  [112.35, 'high', 'let'], [113.79, 'low', 'got'], [115.95, 'high', 'give'], [117.40, 'low', 'gift'],
  [121.72, 'low', 'and'], [123.16, 'high', "that's"], [124.60, 'low', 'some'], [125.68, 'low', 'just'], [128.92, 'low'],
  [130.36, 'low'], [131.08, 'high'], [131.80, 'roof'], [132.52, 'low'], [133.24, 'low'], [133.96, 'high'], [134.68, 'roof'], [135.40, 'low'],
  [136.12, 'high'], [136.84, 'low'], [137.56, 'roof'],
  [142.24, 'low', 'the'], [143.32, 'high', 'crown'], [144.04, 'low'], [145.48, 'high'], [146.92, 'low'],
  [150.88, 'low', 'ask'], [152.68, 'low', 'again'],
  [163.49, 'sill'], [164.93, 'sill'], [166.37, 'sill'], [168.17, 'sill', 'here'],
].map(([t, k, w, o]) => ({ t, k, w: w || '(beat)', o: o || {} }));
// his face on the song's moments (DESIGN §5 + JOKES §4; `skeptical` = his rest side-eye, so no swap there). Big: question, startled.
const FACES = [[41.10, 'thinking', 0.8], [42.90, 'proud', 0.5], [43.50, 'deadpan', 0.8], [63.40, 'question', 1.2], [67.24, 'deadpan', 0.8],
  [84.10, 'sneaky', 0.6], [97.30, 'thinking', 0.5], [97.96, 'deadpan', 0.8], [119.30, 'oh', 0.8], [154.62, 'sleepy', 1.5],
  [161.90, 'startled', 0.7], [163.00, 'smirk', 1.0], [167.42, 'warm', 1.0]];

export function build(words, map) {
  const P = map.period;
  const HOPT = HOPB * P;
  const lead = { low: v => HOPT / 2 - 0.3 / v, high: v => DUCKF / 2 - 0.475 / v, door: v => GLF / 2 - 0.35 / v };
  const objs = [], holes = [], roofs = [];
  for (const c of COURSE) { const v = vAt(c.t);
    if (c.k === 'low' || c.k === 'sill') objs.push({ k: 'word', t: c.t + lead.low(v), text: c.w, filler: false, w: 0.6, wk: 'low', y0: 0, y1: c.k === 'sill' ? 0.3 : 0.55, soft: c.k === 'sill' });
    if (c.k === 'high') objs.push({ k: 'word', t: c.t + lead.high(v), text: c.w, filler: false, w: 0.95, wk: 'high', y0: 0.82, y1: 2.9 });
    if (c.k === 'door') objs.push({ k: 'word', t: c.t + lead.door(v), text: c.w, filler: false, w: 0.7, wk: 'wall', y0: -0.6, y1: 8 });
    if (c.k === 'gap') { const mid = c.t + HOPT / 2, hw = 0.65 / v; holes.push([mid - hw, mid + hw]); }
    if (c.k === 'roof') roofs.push({ k: 'block', t: c.t + 0.30, tEnd: c.t + 0.30 + 1.6 / v, y: 0.6, h: 0.6, step: true, style: 'painted', roof: true });
  }
  // the street: one floor, the drains carved out of it (painted by the story layer: the street line, its breaks)
  let ground = [[-8, END + 30]];
  for (const [a, b] of holes) { const out = []; for (const [g0, g1] of ground) { if (g1 <= a || g0 >= b) { out.push([g0, g1]); continue; } if (g0 < a) out.push([g0, a]); if (g1 > b) out.push([b, g1]); } ground = out; }
  for (const [g0, g1] of ground) objs.push({ k: 'block', t: g0, tEnd: g1, y: 0, h: 0.6, style: 'painted' });
  objs.push(...roofs);
  Object.assign(SHARED, { holes, roofs, P, HOPT, course: COURSE });
  return {
    speed: 1, hopBeats: HOPB, glitchFor: GLF, duckFor: DUCKF, glitchReach: 2.6, coyote: 0.09, jumpBuffer: 0.12, streakRefill: 8, chargeBeats: 2,
    story, mode, modeView, onStep: hunt, costume: 'noir-detective', power: null,
    faces: FACES, retry: 'section', retryAt, outro: false, graceStart: 4.5,
    lights: () => -1,                                   // (no stage beams: the only lights are his torch, the moon box, and at the end the doors)
    deathText: s => `the case went cold at ${Math.floor(s.t / 60)}:${String(Math.floor(s.t % 60)).padStart(2, '0')} · back on it`,
    theme: { noGhost: true, backdrop: 'plain', bg: '#000000', igOff: false, objA: '#bff8ff', objB: '#9fd8e0', edge: '#1f4448', block: '#020405',
      pulse: false, decor: [], halo: '#f4ecd8', camMax: 2.2, noBeatSpin: true, gwords: false,
      lyricArt: false, lyricSide: 'center', lyricSize: 21, lyricY: 0.035, lyricGlitch: false, lyricColor: 'rgba(220,226,235,0.36)',
      lyricGcol: ['rgba(220,226,235,0.5)', 'rgba(191,248,255,0.4)'], lyricSplit: ['rgba(80,120,130,0.35)', 'rgba(140,170,180,0.3)'], lyricKeys: [] },
    sections: SECTIONS, objs, boosts: [], signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: END, start: 0,
  };
}
