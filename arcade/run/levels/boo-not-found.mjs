// 404 BOO NOT FOUND — the secret level (Halloween). Plan: game/stories/boo-not-found.md (story §1–7, BUILD PLAN A–K).
// THE ONE PLACE: one town on one night, running a program called Halloween. Doorstep → the crash (everything frozen white,
// only he moves) → the street of costumes → the town looks at him → the chorus push (his DELETE wipe fries the power) →
// moonlit porches + the alley → the MONSTERS ONLY mansion (candlelit) → the basement door. Every scare that fails on him
// leaves itself in his lane: that's the course. The cast is the playdough figure pressed into monsters (assets3d/boo/).
// Potato: the sheet-ghost outfit until GOOD. (26.12), then bare (the sheet drifts at the edge of the frame all night).
// Purple = his glitch only. Orange, black, sick green and moon blue belong to the world.
//
// ALL TIMES ARE ESTIMATES (machine listen of the vocal stem, game/words/boo-not-found.json): nobody has tapped this song.
// Every press below sits ON a sung word: when Matt taps it, rerun the word file and move these with it.
//
// BEAT SHEET (press time · word · move · what's in the lane)  — ↑ hop · ↓ duck · ␣ glitch · (soft) = breaks round him, can't kill
//   0–20.2   doorstep, x0.6, all soft   3.40 Trick ↑ pumpkin · 5.40 Who ↓ the bowl held out · 9.52 POTATO ␣ the scanner beam ·
//                                       11.96 UNNECESSARY ↑ plain pumpkin · 15.80 GROWN ↓ the bat cape · 17.82 PROBLEMS ↑ the bowl set down
//   20.22    THE CRASH                  everything flat white, HALLOWEEN.EXE not responding, he walks (x0.35)
//   26.12    GOOD.  ␣ CUE 1             his glitch tears the frozen frame; the sheet blows off him (bare from here)
//   26.7–84  verse 1, x1.0              street ↑ · feet ↑ · scary ↓ wire · COOL ␣ vampire cape · Pepto ↑ · SIT ↑ · ducked ↓ werewolf ·
//                                       loops ↓ witch · eyebrows ↑ broom · CURSE ↓ hex · wraps ↑ long (mummy) · SCORE ↑ · BRAAAINS ↑ grave ·
//                                       INVENTORY ↓ zombie arm · 80–84 the lid (dark inside, one warm dot) · LOSE. ␣ CUE 2 (the lid slams)
//   84.4–93.7 pre-chorus, x0.8, calm    jack-o-lanterns turn to watch him; 89.44 ANATOMY NOT INSTALLED: the blank figure in his place
//   93.7–111 chorus, x1.1               404! ↑ ghost · CRYPT ↓ door · TRICK! ↑ wrappers · DELETE! ␣ CUE 3 (deletes the next three ghosts +
//                                       fries the wires: SYSTEM FRIED, porches die left to right) · LEGS ↑ / BEAT! ↓ / BOO! ↑ (only if missed) ·
//                                       SCREAM! ↑ · BACK! ↑ · CRACK! his tear is the section turn
//   111–164  verse 2, moonlit, x1.0     rang ↑ onto the Raisin Lady's veranda · WHAT ↓ door · Where's ↑ · down · FRUIT ↑ raisin · talking ↑ bar ·
//                                       took ↑ THE HOOP (optional: the O of TAKE ONE; the bowl goes on his head = the secret key) · legs ↓ spider ·
//                                       THEM. ↑ leg pile · THREATENING ↓ · path ↑ cat · TWENTY-FOUR ↑ can · GLITCH ␣ ladder · out ↓ clown ·
//                                       CRY ↑ shoe · honked ↑ horn · crying: the manhole (hole)
//   164–236  verse 3, the mansion, x0.9 mansion ↑ ONLY ↑ (hill steps) · dusty ↑ speaker · BACK ↑ bones · YOUR ↑ arm · ALL ↑ head · UP ↓ ·
//                                       191.4 the sheet possesses him (one beat) · VOICES/screaming ↑ pots · WRONG ↓ pan · LADY/CHARGE ↑ ·
//                                       SCREAMING ↓ · A-T-E ↑ · laptop ↑ · file ↑ · moving ↑ · LOL ␣ (optional bonus) · WHO ↑ · SATAN ↓ ·
//                                       blade ↑ doll · NIGHTMARE ↑ · WRITE-OFF ↓ stamp
//   236–252  breakdown, x0.8 → x0.5     the scream upstairs, a candle ↑, a portrait ↓, RENT DUE under the door
//   251.92→  the basement door (cutscene): no bowl = the door shuts on a warm line; the bowl = the door stays open: his kitchen.
import { parseWords } from './kit.mjs';
import { story, setSong, setCourse, booView } from './story-boo-not-found.mjs';
export { parseWords };
export const meta = { id: 'boo-not-found', n: 404, title: '404 Boo Not Found', place: 'the street that crashed', song: 'songs/boo-not-found.mp3',
  map: 'songs/boo-not-found.map.json', words: 'words/boo-not-found.json', power: null, secret: true };

export const END = 261.8;
const HOPB = 1, GLF = 0.45, DUCKF = 0.5, SPEED = 7;
export const UPE = 0.5;   // a ledge's edge sits UPE beats (0.28 s) after its word: a hop ON the word lands on it
// the course: [word time, kind, word, extra]. kinds: low ↑ · high ↓ · wall ␣ · long (↑ over a wide low thing) · hole (↑ the pit) ·
// up dy (a ledge) · down (the floor drops back). extra: soft · cue (a big glitch: the ring + bonus) · ghost (deleted by DELETE) ·
// art (what stands there: assets3d/boo sprites or the level's own drawings, story-boo-not-found.mjs LANE)
export const COURSE = [
  // 1. the doorstep (soft: it teaches ↑ ↓ ␣)
  [3.40, 'low', 'Trick', { soft: true, art: 'pumpkin' }], [5.40, 'high', 'Who', { soft: true, art: 'bowlout' }], [9.52, 'wall', 'POTATO', { soft: true, art: 'scanner' }],
  [11.96, 'low', 'UNNECESSARY', { soft: true, art: 'pumpkin-plain' }], [15.80, 'high', 'GROWN', { soft: true, art: 'cape' }], [17.82, 'low', 'PROBLEMS.', { soft: true, art: 'candy-bowl' }],
  // 2. the crash: GOOD. tears the frozen frame
  [26.12, 'wall', 'GOOD.', { soft: true, cue: 500, art: 'dialog' }],
  // 3. verse 1, the street of costumes
  [32.42, 'low', 'street,', { art: 'pumpkin' }], [34.56, 'low', 'feet.', { art: 'pumpkin-plain' }], [36.80, 'high', 'scary,', { art: 'wire' }],
  [43.06, 'wall', 'COOL,', { art: 'vampcape' }], [47.34, 'low', 'Pepto', { art: 'pumpkin' }], [51.06, 'low', 'SIT.', { art: 'pumpkin' }],
  [53.44, 'high', 'ducked,', { art: 'werewolf--lunge' }], [58.46, 'high', 'loops', { art: 'witch--broom' }], [60.80, 'low', 'eyebrows', { art: 'witch-broom' }],
  [64.68, 'high', 'CURSE', { art: 'hex' }], [68.44, 'long', 'wraps,', { art: 'wrap' }], [74.84, 'low', 'SCORE', { art: 'meter300' }],
  [76.38, 'low', 'BRAAAINS,', { art: 'grave' }], [78.46, 'high', 'INVENTORY', { art: 'zombie--reach' }],
  [84.02, 'wall', 'LOSE.', { soft: true, cue: 500, art: 'lid' }],
  // 5. chorus, the push
  [94.60, 'low', '404!', { art: 'ghostlow' }], [96.24, 'high', 'CRYPT,', { art: 'cryptdoor' }], [97.78, 'low', 'TRICK!', { art: 'wrappers' }],
  [99.32, 'wall', 'DELETE!', { soft: true, cue: 1000, art: 'ghostwall' }],
  [100.56, 'low', 'LEGS', { ghost: true, art: 'ghostlow' }], [101.80, 'high', 'BEAT!', { ghost: true, art: 'ghosthigh' }], [103.12, 'low', 'BOO!', { ghost: true, art: 'ghostlow' }],
  [106.84, 'low', 'SCREAM!', { art: 'pumpkin' }], [108.36, 'low', 'BACK!', { art: 'pumpkin' }],
  // 6. verse 2, porches and the alley (moonlit)
  [112.22, 'up', 'rang', 0.6], [114.66, 'high', 'WHAT', { art: 'door' }], [117.98, 'low', "Where's", { art: 'pumpkin' }], [122.14, 'down'],
  [125.76, 'low', 'FRUIT', { art: 'raisincrate' }], [130.22, 'low', 'talking', { art: 'bar' }],
  [139.04, 'high', 'legs', { art: 'spider' }], [141.98, 'low', 'THEM.', { art: 'legpile' }], [145.68, 'high', 'THREATENING', { art: 'spider--legs-off' }],
  [147.46, 'low', 'path,', { art: 'black-cat' }], [152.48, 'low', 'TWENTY-FOUR', { art: 'trashcan' }], [154.66, 'wall', 'GLITCH', { art: 'ladder' }],
  [156.24, 'high', 'out', { art: 'clown--jump' }], [158.82, 'low', 'CRY', { art: 'shoe' }], [161.26, 'low', 'honked', { art: 'horn' }],
  [162.46, 'hole', 'crying'],
  // 7. verse 3, the MONSTERS ONLY mansion (candlelit)
  [165.24, 'up', 'mansion,', 0.6], [166.12, 'up', 'ONLY,', 0.6], [167.44, 'down'],
  [170.28, 'low', 'dusty', { art: 'speaker' }], [172.88, 'low', 'BACK.', { art: 'bones' }], [180.54, 'low', 'YOUR', { art: 'frankarm' }],
  [185.84, 'low', 'ALL', { art: 'pumpkin-head' }], [189.40, 'high', 'UP', { art: 'horsearm' }],
  [194.26, 'low', 'VOICES', { art: 'pot' }], [196.88, 'low', 'screaming', { art: 'pot' }], [198.90, 'high', 'WRONG', { art: 'pan' }],
  [200.88, 'low', 'LADY.', { art: 'potcup' }], [203.00, 'low', 'CHARGE.', { art: 'pot' }], [205.20, 'high', 'SCREAMING', { art: 'pan' }], [207.47, 'low', 'A-T-E', { art: 'pot' }],
  [210.80, 'low', 'laptop,', { art: 'laptop' }], [214.68, 'low', 'file', { art: 'filebox' }], [218.48, 'low', 'moving,', { art: 'fileboxes' }],
  [222.78, 'low', 'WHO', { art: 'ouija-board' }], [224.60, 'high', 'SATAN.', { art: 'planchette' }],
  [228.50, 'low', 'blade,', { art: 'doll' }], [231.86, 'low', 'NIGHTMARE!', { art: 'doll--lunge' }], [234.08, 'high', 'WRITE-OFF', { art: 'stampdown' }],
  // 8. breakdown
  [242.27, 'low', 'AAAAAAHHHH', { art: 'candle' }], [245.18, 'high', 'SOMETHING', { art: 'portrait' }],
];
export const HOOP = 134.68, LOL = 220.69;   // the optional moves: ↑ through the O of TAKE ONE on "took" (the bowl) · ␣ on "LOL," (the planchette)
export const CUTS = [[251.92, 256.6, 'float'], [256.6, END + 1, 'dance']];   // he reaches the basement door on 256.6 and stops there
const SECTIONS = [['the doorstep', 0, 0.6], ['the crash', 20.22, 0.35], ['the crash', 25.57, 0.6], ['the street of costumes', 26.7, 1], ['the town looks at him', 84.4, 0.8],
  ['the push', 93.66, 1.1], ['the porches', 111.1, 1], ['monsters only', 164.4, 0.9], ['monsters only', 208.9, 1], ['something in the basement', 236.3, 0.8],
  ['something in the basement', 249.16, 0.5], ['the door', 251.92, 0.5], ['the door', 256.6, 0.04]];
export const RETRY = [26.7, 48.6, 66.9, 84.4, 93.6, 111.1, 146.7, 164.4, 191.4, 208.9, 236.3];
const retryAt = t => { const tt = Math.max(0, t - 1.5); let r = 26.7; for (const a of RETRY) if (a <= tt) r = a; return r; };
// the sheet: on him for the doorstep, blown off by GOOD.; back for one beat when it possesses him
const LOOKS = [[-30, 26.12, 'sheet-ghost', '#f4f1ea'], [191.36, 192.48, 'sheet-ghost', '#f4f1ea']];
// his face on the song's moments (the plan's list)
const FACES = [[7.56, 'deadpan', 1.2], [13.58, 'skeptical', 1.4], [16.90, 'smirk', 1.0], [20.22, 'question', 2.0], [26.12, 'grin', 1.0], [42.44, 'deadpan', 1.0],
  [44.20, 'smirk', 1.0], [53.44, 'smirk', 0.8], [59.64, 'wide', 0.8], [72.78, 'laugh', 1.0], [80.12, 'oh', 1.6], [82.92, 'deadpan', 1.0], [84.02, 'angry', 0.8],
  [89.44, 'shock', 0.6], [91.96, 'skeptical', 1.4], [99.32, 'grin', 0.8], [103.78, 'laugh', 1.0], [110.62, 'determined', 1.0], [115.16, 'skeptical', 1.2],
  [121.08, 'deadpan', 1.4], [126.88, 'smirk', 1.0], [140.84, 'smirk', 0.8], [150.54, 'deadpan', 1.0], [156.24, 'startled', 0.6], [161.60, 'laugh', 0.8],
  [166.96, 'sad', 1.4], [172.88, 'smirk', 0.8], [179.54, 'shock', 0.6], [184.66, 'smirk', 0.8], [189.68, 'laugh', 0.8], [191.36, 'startled', 1.0],
  [197.74, 'grin', 1.0], [208.89, 'question', 1.0], [217.41, 'deadpan', 1.0], [220.69, 'grin', 0.8], [231.86, 'deadpan', 1.0], [241.14, 'startled', 1.0],
  [244.06, 'skeptical', 1.4], [248.60, 'deadpan', 1.2], [251.92, 'determined', 2.0]];

// ---------------- the score (Thursday's committed system): +100 a thing got past, ×2 on the word (±0.10 s), combo ×1..×4 at 4/8/16;
// candy +50; the cues GOOD 500 · LOSE 500 · DELETE 1000 (PERFECT full, GOOD 60%); LOL +300 (optional, ±0.2 s); finish +2000;
// CLEAN (no retry) +10%; grade S 90%+ & CLEAN · A 75% · B 55% · C. The story's own numbers: s.deleted (the wipe), s.bowl (the key).
const comboOf = n => 1 + (n >= 4) + (n >= 8) + (n >= 16);
const SNAP = {};
let ITEMS = [], CUES = [], MAXPTS = 1, HOOPT = 0, HOOPX = 0, HOOP_C = null, GHOSTS = [], GHOST_HZ = null, GHOST_C = null;
const press = (s, k) => k === 'high' ? s.thD : k === 'wall' ? s.thG : s.thJ;
function fresh(t, C) { const x = C.X(t); let done = 0; while (done < ITEMS.length && C.X(ITEMS[done].tEnd) + (ITEMS[done].dx || 0) <= x) done++;
  const cue = {}; CUES.forEach((q, i) => { if (q.t + 0.3 < t) cue[i] = { t: null, d: null, g: 'MISS', skipped: true }; });
  let tok = 0; while (tok < C.tokens.length && C.tokens[tok].x < x - 1.2) tok++;
  return { pts: 0, chain: 0, combo: 1, best: 1, on: 0, n: 0, candy: 0, cue, ev: [], from: t, done, tok, retried: t > 0.01 }; }
function ghostHz(C) { if (GHOST_C !== C) { GHOST_C = C; GHOST_HZ = GHOSTS.map(g => C.hazards.findIndex(h => h.kind === 'word' && Math.abs(h.t - g) < 1e-6)).filter(i => i >= 0); } return GHOST_HZ; }
function onStep(s, inp, t, C) {
  if (!s.sc) { const from = t - 1 / 120; if (from < 0.01) for (const k in SNAP) delete SNAP[k];
    const r = SNAP[from.toFixed(2)]; s.sc = r ? { ...r, retried: true } : fresh(from, C); }
  for (const a of RETRY) if (t - 1 / 120 < a && t >= a) SNAP[a.toFixed(2)] = s.sc;
  let sc = s.sc; const ev = [];
  if (inp.J && s.jumpedAt === t) { s.thJ = t; ev.push({ t, k: 'jump' }); }
  if (s.ducking && !s.thDuck) s.thD = t; s.thDuck = !!s.ducking;
  if (s.glitchAt === t) { s.thG = t; ev.push({ t, k: 'glitch' }); }
  const nx = s.x;
  // the cues: the first glitch from a beat before to 0.3 s after the word is judged; a miss breaks the combo (never kills)
  for (let i = 0; i < CUES.length; i++) { const q = CUES[i]; if (sc.cue[i]) continue;
    if (s.glitchAt === t && t >= q.t - C.P - 0.02 && t <= q.t + 0.3) { const d = t - q.t, g = Math.abs(d) <= 0.10 ? 'PERFECT' : d >= -0.2 ? 'GOOD' : 'MISS';
      const pts = g === 'PERFECT' ? q.pts : g === 'GOOD' ? Math.round(q.pts * 0.6) : 0;
      sc = { ...sc, cue: { ...sc.cue, [i]: { t, d, g } }, pts: sc.pts + pts * (g === 'MISS' ? 1 : sc.combo), ...(g === 'MISS' ? { chain: 0, combo: 1 } : {}) }; ev.push({ t, k: 'cue', i, g, w: q.w });
      // DELETE!: his wipe rolls out and deletes the three ghosts ahead (core skips a hazard in s.cuts) — and fries the wires (the story layer)
      if (q.w === 'DELETE!' && g !== 'MISS') { const cuts = { ...(s.cuts || {}) }; for (const i2 of ghostHz(C)) cuts[i2] = t; s.cuts = cuts; s.deleted = t; } }
    else if (t > q.t + 0.3) { sc = { ...sc, cue: { ...sc.cue, [i]: { t, d: null, g: 'MISS' } }, chain: 0, combo: 1 }; ev.push({ t, k: 'cue', i, g: 'MISS', w: q.w }); } }
  // things got past (in course order): soft bumps and deleted ghosts score nothing (and don't break the combo)
  while (sc.done < ITEMS.length) { const it = ITEMS[sc.done]; if (it.xEnd == null) it.xEnd = C.X(it.tEnd) + (it.dx || 0); if (nx < it.xEnd) break;
    if (it.k === 'up' && s.y < it.y - 0.05) { sc = { ...sc, done: sc.done + 1 }; continue; }
    const hz = it.hz != null ? it.hz : (it.hz = C.hazards.findIndex(h => h.kind === 'word' && Math.abs(h.t - it.ot) < 1e-6));
    if (hz >= 0 && s.cuts && s.cuts[hz] != null) { sc = { ...sc, done: sc.done + 1 }; ev.push({ t, k: 'deleted', i: sc.done - 1 }); continue; }
    const bumped = hz >= 0 && s.bumped && s.bumped[hz] != null;
    const p = press(s, it.k), d = p != null ? p - it.tw : null, on = !bumped && d != null && Math.abs(d) <= 0.10 && t - p < 1.2;
    if (bumped) { sc = { ...sc, done: sc.done + 1 }; ev.push({ t, k: 'soft', i: sc.done - 1, what: it.k }); continue; }
    const chain = on ? sc.chain + 1 : sc.chain, combo = comboOf(chain);
    sc = { ...sc, done: sc.done + 1, pts: sc.pts + 100 * (on ? 2 : 1) * combo, chain, combo, best: Math.max(sc.best, combo), n: sc.n + 1, on: sc.on + (on ? 1 : 0) };
    ev.push({ t, k: 'clear', i: sc.done - 1, on, what: it.k, tw: it.tw }); }
  // candy corn on the hop arcs (never kills)
  const TK = C.tokens; let tok = sc.tok; while (tok < TK.length && TK[tok].x < nx - 1.2) tok++;
  for (let i = tok; i < TK.length && TK[i].x < nx + 0.8; i++) { const k = TK[i]; if (k.got) continue;
    if (Math.abs(k.x - nx) < 0.7 && k.y > s.y - 0.35 && k.y < s.y + 1.25 + 0.4) { k.got = true; sc = { ...sc, candy: sc.candy + 1, pts: sc.pts + (k.big ? 250 : 50) }; ev.push({ t, k: 'candy' }); } }
  if (tok !== sc.tok) sc = { ...sc, tok };
  if (s.softAt === t) ev.push({ t, k: 'bump', i: s.softI });
  // THE HOOP (the secret key): through the O of TAKE ONE at the right height → the bowl goes on his head and stays until a death
  if (HOOP_C !== C) { HOOP_C = C; HOOPX = C.X(HOOPT); }
  if (!s.bowl && Math.abs(nx - HOOPX) < 0.3 && s.y > 0.75 && s.y < 1.75) { s.bowl = t; s.react = { name: 'proud', dur: 1.2, at: t }; sc = { ...sc, pts: sc.pts + 404 }; ev.push({ t, k: 'bowl' }); }
  // LOL: the planchette (optional bonus, ±0.2 s)
  if (s.glitchAt === t && Math.abs(t - LOL) <= 0.2 && !sc.lol) { sc = { ...sc, lol: t, pts: sc.pts + 300 * sc.combo }; ev.push({ t, k: 'lol' }); }
  if (ev.length) sc = { ...sc, ev: [...sc.ev, ...ev] };
  if (t >= END && !sc.final) { const clean = !sc.retried, raw = sc.pts + 2000, pts = Math.round(raw * (clean ? 1.1 : 1)), share = pts / MAXPTS;
    sc = { ...sc, pts, clean, share: +share.toFixed(3), grade: share >= 0.9 && clean ? 'S' : share >= 0.75 ? 'A' : share >= 0.55 ? 'B' : 'C', final: true }; }
  // his side-eye on the beats the story asks for it
  if (t >= 91.96 && t - 1 / 120 < 91.96) s.facing = 0.05;
  if (t >= 93.4 && t - 1 / 120 < 93.4) s.facing = 0;
  if (t >= 244.06 && t - 1 / 120 < 244.06) s.facing = 0.05;
  if (t >= 246.0 && t - 1 / 120 < 246.0) s.facing = 0;
  if (s.bowl && t >= 257.0 && t - 1 / 120 < 257.0) s.react = { name: 'warm', dur: 2.5, at: t };
  s.sc = sc;
}

export function build(words, map) {
  const P = map.period;
  const LEADV = { low: v => HOPB * P / 2 - 0.3 / v, high: v => DUCKF / 2 - 0.475 / v, wall: v => GLF / 2 - 0.35 / v, long: v => HOPB * P / 2 - 0.6 / v };
  // ---- the floor: steps up on a word (its edge UPE beats after), drops back on a quiet beat ----
  const steps = [[-3, 0]];
  for (const [x, k, , dy] of COURSE) { if (k === 'up') steps.push([x + UPE * P, steps[steps.length - 1][1] + dy]); else if (k === 'down') steps.push([x, 0]); }
  const yAt = t => { let y = 0; for (const [a, yy] of steps) if (t >= a) y = yy; return y; };
  let ground = steps.map((st, i) => [st[0], i + 1 < steps.length ? steps[i + 1][0] : END + 60, st[1]]);
  const carve = (a, b) => { const out = []; for (const [g0, g1, y] of ground) { if (g1 <= a || g0 >= b) { out.push([g0, g1, y]); continue; } if (g0 < a) out.push([g0, a, y]); if (g1 > b) out.push([b, g1, y]); } ground = out; };
  const holes = [];
  for (const [x, k] of COURSE) if (k === 'hole') { const a = x + 0.08, b = x + 0.08 + 0.5 * P; carve(a, b); holes.push({ t0: a, t1: b, y: yAt(x), tw: x }); }
  GHOSTS = [];
  const vAt = t => { let k = 1; for (const [, a, m] of SECTIONS) if (t >= a) k = m; return SPEED * k; };
  const objs = [], tokens = [], lane = [];
  for (const [g0, g1, y] of ground) objs.push({ k: 'block', t: g0, tEnd: g1, y, h: 0.6 });
  const items = [], cues = [], cut0 = CUTS.map(c => c[0]);
  const fit = t => { for (const a of cut0) if (t > a - 0.32 && t < a) return a - 0.33; return t; };
  for (const [x, k, text, a] of COURSE) {
    const o = typeof a === 'object' && a ? a : {}, gy = yAt(x), soft = !!o.soft;
    if (k === 'low' || k === 'high' || k === 'wall' || k === 'long') {
      const t = fit(x + LEADV[k](vAt(x)));
      if (k === 'low') objs.push({ k: 'word', t, text, filler: false, w: 0.6, wk: 'low', y0: gy, y1: gy + 0.4, obj: 'rtNone', soft });
      if (k === 'long') objs.push({ k: 'word', t, text, filler: false, w: 1.2, wk: 'low', y0: gy, y1: gy + 0.35, long: true, obj: 'rtNone', soft });
      if (k === 'high') objs.push({ k: 'word', t, text, filler: false, w: 0.95, wk: 'high', y0: gy + 0.82, y1: gy + 2.6, obj: 'rtNone', soft });
      if (k === 'wall') objs.push({ k: 'word', t, text, filler: false, w: 0.7, wk: 'wall', y0: gy - 0.6, y1: gy + 8, obj: 'rtNone', soft });
      const w = k === 'low' ? 0.6 : k === 'long' ? 1.2 : k === 'high' ? 0.95 : 0.7;
      items.push({ k: k === 'long' ? 'low' : k, tw: x, ot: t, tEnd: t, dx: w + 0.45, soft });
      lane.push({ tw: x, t, w, k, gy, art: o.art, soft, ghost: !!o.ghost, cue: !!o.cue, text });
      if (o.cue) cues.push({ t: x, pts: o.cue, ot: t, w: text });
      if (o.ghost) GHOSTS.push(t);
      if ((k === 'low' || k === 'long') && x > 26.7 && !o.ghost) tokens.push({ k: 'token', t: t + 0.04, y: gy + 1.75 });   // a candy corn on the arc of the hop
    }
    if (k === 'hole') { items.push({ k: 'hole', tw: x, tEnd: x + 0.08 + 0.5 * P, dx: 0.45 }); tokens.push({ k: 'token', t: x + 0.17, y: gy + 1.8 }); }
    if (k === 'up' && text) { items.push({ k: 'up', tw: x, tEnd: x + UPE * P, dx: 0.6, y: yAt(x + UPE * P + 0.1) }); tokens.push({ k: 'token', t: x + UPE * P + 0.1, y: yAt(x + P) + 1.2 }); }
  }
  GHOSTS = [...new Set(GHOSTS)];
  tokens.sort((a, b) => a.t - b.t); objs.push(...tokens);
  items.sort((a, b) => a.tEnd + (a.dx || 0) / 8 - (b.tEnd + (b.dx || 0) / 8));
  // the perfect run (for the grade): every item on the word, every candy, every cue PERFECT, the bowl, LOL, finish, CLEAN
  { let pts = 0, chain = 0; const all = [...items.filter(i => !GHOSTS.includes(i.ot)).map(i => ({ t: i.tEnd, k: 'i' })), ...cues.map(c => ({ t: c.t, k: 'c', pts: c.pts }))].sort((a, b) => a.t - b.t);
    for (const e of all) { if (e.k === 'i') { chain++; pts += 200 * comboOf(chain); } else pts += e.pts * comboOf(chain); }
    pts += tokens.length * 50 + 404 + 300 * 4 + 2000; MAXPTS = Math.round(pts * 1.1); }
  ITEMS = items.map(i => ({ ...i, xEnd: null, hz: null })); CUES = cues; GHOST_C = null;
  HOOPT = HOOP + HOPB * P / 2; HOOP_C = null;   // the hoop's O sits over the apex of a hop pressed on "took"
  setSong(words, P, map.offset, map.music || null);
  setCourse({ holes, cues, items: ITEMS, lane, steps, yAt, END, HOOP, HOOPT: HOOP + HOPB * P / 2, LOL, maxPts: MAXPTS, ghosts: GHOSTS });
  const lastLine = (() => { const byL = new Map(); for (const w of words) if (w.t0 != null) byL.set(w.line, Math.max(byL.get(w.line) || 0, w.t1 ?? w.t0)); return [...byL.values()].sort((a, b) => a - b); })();
  const progressAt = t => { let n = 0; for (const e of lastLine) if (t >= e - 0.05) n++; return lastLine.length ? Math.min(1, n / lastLine.length) : t / END; };
  return {
    speed: SPEED, coyote: 0.09, jumpBuffer: 0.12, streakRefill: 8, hopBeats: HOPB, glitchFor: GLF, duckFor: DUCKF, glitchReach: 2.6, chargeBeats: 2,
    story, modeView: booView, looks: LOOKS, faces: FACES, onStep, softCuts: true, secretWon: s => !!s.bowl,
    lights: t => t >= 20.22 && t < 26.12 ? 0.2 : t >= 102.46 && t < 164.4 ? 0.6 : 1,
    hideAt: (t, s) => (t >= 89.44 && t < 90.28) || t > END - 0.12 || (!s.bowl && t >= 256.75),   // (no bowl: he walks in, the door shuts behind him)   // ANATOMY NOT INSTALLED: the blank figure stands in his place (booView)
    retryAt, progressAt,
    deathText: s => `halloween.exe stopped at ${Math.floor(s.t / 60)}:${String(Math.floor(s.t % 60)).padStart(2, '0')}  ·  ${s.why}${s.bowl ? '  ·  the bowl fell off' : ''}`,
    theme: { lyricColor: '#ffb04a', lyricKeys: ['boo', '404!', 'good.', 'lose.', 'delete!', 'glitch', 'potato', 'monsters', 'basement', 'halloween.exe'],
      objects: { low: 'rtNone', high: 'rtNone', wall: 'rtNone' }, igOff: true, objA: '#ffb04a', objB: '#9fe3ff',
      decor: ['landflash'], backdrop: 'plain', bg: '#05070d', digit: '#ffb04a', digit2: '#9fe3ff', edge: '#c4521a',
      block: '#1a1512', ground: '#1a1512', blockText: ' ', groundTex: 'road', pulse: false, csZoom: 1.08, csLift: 0, noWave: true,
      word: '#ffd9a0', wordSlab: '#1b130b', light: '#ffe6c2', light2: '#ff8a2b', halo: '#ffb04a', lyricArt: false, camMax: 3.6, camAirMax: 1.5,
      lyricGlitch: false, lyricSize: 30, lyricGcol: ['#fff2dc', '#ffb04a', '#ffd84a', '#9fe3ff'], lyricSplit: ['#7a2a0a', '#9fe3ff'],
      token: '#ff8a2b', tokenStyle: 'coin', tokenGlyph: '▲' },
    sections: SECTIONS, cutscenes: CUTS, outro: false, graceStart: 2.0,
    objs, boosts: [], signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: END, start: 0,
  };
}
