// CONFIDENTLY INCORRECT — THE FACT FACTORY. Song 3 of 10. Plan (the spec): game/stories/confidently-incorrect.factory-plan.md v2.
// (The old space shooter is kept as old-confidently-incorrect-shooter.mjs + old-story-confidently-incorrect-shooter.mjs.)
//
// ONE LINE: Kevin's question goes into a factory that can make anything except "I don't know". Every doubt jams the line, and
// every Space press is Potato doubling down: he forces the line running again and the next lie gets made. Every crate he clears
// is stamped and shipped (LIES SHIPPED). Kevin is the only real person who ever rides the belt; the only real THING that ever
// comes down the line is one plain FACT at the very end, and the machine can't stamp it: the cardboard shows and the factory
// folds. The player is the accomplice. A clean run is the kidnapping working.
//
// BEAT SHEET (short; the full one is §2 of the plan and MOMENTS in ci-factory.mjs)
//   -14 → 0     Kevin's room, night. The router blinks purple (him arriving). Kevin types "Dear Potato, what is the capital of Neipal?
//               thanks, -Kevin" (Matt's words); the letters stream into his head as binary, "Neipal?" last on 1.134.
//   0 → 10.17   He has nothing: thinking dots, a glitch on each of Matt's taps (1.13, 2.73, 5.63 violent: the laptop's boot text
//               fails behind him, green), "answering???" one "?" a beat. 10.17 (the drop): he glitches into the construction-crew.
//   10.8 → 14.4 The laptop screen tears into green binary, belts show through; the camera pushes through on the 13.18 hit; the
//               taskbar is belt #1; the hopper swallows the question.
//   14.4 → 62.9 Intake + stamp hall (F1, steel blue): YAK, "WHAT? Exactly." (QC lamp), JAM-1 Caesar → SALAD, the ¶ staircase ×12,
//               DR. GARY moulded, QUANTUM SPAGHETTI, JAM-2 the DOI barcode arch.
//   62.95       PO-TA-TO: three giant presses slam, sodium amber, the tube up to the catwalks (F2): screws, STEW, QC booth on chains
//               (JAM-3, CAPTAIN), citations that never load, restaurant awnings; 85.07 the process flies off a cliff.
//   86.2 → 129  Chorus 1 back on F1 (double down, fake belt, he invents the cardboard professor), the tube to F2, rechargeable
//               eagles, green-grey wing (QC STOP, the inspector, Stephanie's papers → hobgoblin, white-out tape, the journal).
//   129.31      Nature Valley: up to F3. Peru, 17,000,000,000. "actually, Kevin." — the "thanks, kevin" slip rides the belt and is
//               stamped SOURCE; machines stall; "I DON'T KNOW."
//   147.82      HE'S (the Space press): his tether pulls Kevin out of the monitor; DATA: Kevin lands in a FRAGILE crate and rides
//               behind him to the fold. Furnace orange; the reactor far behind starts to glow (his power).
//   148 → 206   Four stamps, the survey binder into the furnace, the doors blast on 159.53. Mom: "kevin, dinner" (171.0). The
//               socket dive into the dark ("kevin??"), the barrage, the raccoon, the fact-check crew, EVEREST the sandwich →
//               ANSWER ✓. The still: one real smile on "sounded neat", broken by Mom: "who is this. where is my son".
//   206.93      The roof; the whole factory + the reactor. KING: crowned. TOO LATE! ALREADY SENT! (the ANSWER crate is fired out).
//               Three bots, the reactor surges, Mom: "GIVE HIM BACK" on an empty belt, GRAB A HELMET (hats rain, a small one on
//               Kevin), browser shutters, a plain white FACT (the stamp can't print; cardboard shows), Cornelius, MIT OF MAKING STUFF UP.
//   241.3       The fold: blank cardboard backs, the freeze, slammed flat on 242.47; he glitches out; Kevin's crate falls empty.
//   243.6       The empty desk at dawn. Mom types "please", a letter a beat. The newspaper: LOCAL BOY, KEVIN, MISSING. FAMILY SAYS
//               A.I. AGENT IS RESPONSIBLE. Black. The router blinks purple once (he is still out there).
//
// STAGE 1 (VIDEO in ci-factory.mjs): the whole song plays by itself (RUN.video). Floors + launches + chutes only, he can't die,
// and onStep plays every press of the course itself, on the word, so the video shows what a clean run looks like.
// STAGE 2 (VIDEO false): the course (COURSE) is laid on as real hazards and the player drives it (built Nov 2).
import { parseWords as kitParse } from './kit.mjs';
import { story, ciView } from './story-confidently-incorrect.mjs';
import { makeCourse } from '../core.mjs';
import { VIDEO, P, END, PREROLL, FLOORS, LEDGES, LAUNCHES, CHUTES, COURSE, UP_KINDS, SECTIONS, BOOSTS, RETRY, CUTS, KEYTICKS, FACES, LEDGER, GRAB, COSTUME_AT, PLACE, HOLES, STACK_H, STACK_AIR, STACK_MID, SUMMIT } from './ci-factory.mjs';
export { VIDEO };
export const meta = { id: 'confidently-incorrect', n: 3, title: 'Confidently Incorrect', place: 'the fact factory', song: 'songs/confidently-incorrect.mp3',
  map: 'songs/confidently-incorrect.map.json', words: 'words/confidently-incorrect.json', viz: 'songs/confidently-incorrect.viz.json', power: null };

// the timings file marks a few words "untapped": the intro (an estimate, spaced evenly — it plays, the story hangs on Matt's taps)
// and "for one second it sounded neat" / "POTATO OUT." (kept untimed)
export function parseWords(text) {
  const d = JSON.parse(text), rows = (Array.isArray(d) ? d : d.timings).map(r => r[3] === 'untapped' && r[0] != null && r[0] > 100 ? [r[0], r[1], r[2], ''] : r);
  return kitParse(JSON.stringify({ timings: rows }));
}

// the hop (core.mjs: a hop lasts one beat) — onStep plays the video's presses with the same numbers the player's keys use
const HOP_H = 1.35, HOPT = P, JUMP = 4 * HOP_H / HOPT, BEAT_JUMP = JUMP * 1.06, AIR_JUMP = JUMP * 0.9, LAUNCH_H = 4.6, DUCKF = 0.72, GLITCHF = 0.55, DT = 1 / 120;   // (duck 0.72 + glitch 0.55, plan 0.62 + 0.5: the HOB-GOB-LIN head and the crawl gates get ±0.14 s)
const SFXK = { tick: ['flick', 0.22], small: ['glitch', 0.4, true], glitch: ['glitch', 0.65], big: ['glitch', 1.0], '': [null, 0.5] };
const glitchFx = (s, t, k, sfx, arg) => { s.fxEv = { at: t, k, sfx, arg }; };   // E5 (main.mjs): a scripted glitch's fx + sound

function onStep(s, inp, t, C) {
  const tp = t - DT, cross = x => tp < x && t >= x;
  // the cutscenes (the room and the fold) are this level's own: no "wide" rest face, and his scripted glitches still wear off
  if (CUTS.some(([a, b]) => t >= a && t < b)) { s.blink = Math.max(0, s.blink - DT); s.cutscene = false; }
  s.walking = t < 12.8 ? false : null;                              // he stands on the taskbar until the belt moves
  // the glitch ledger: glitches with a cause and no press (the question landing, the boot check, Mom)
  for (const [lt, bl, how, face] of LEDGER) if (cross(lt)) { const [sfx, k, arg] = SFXK[how] || SFXK.glitch;
    s.blink = Math.max(s.blink, bl); s.blinkFrom = { x: s.x, y: s.y }; glitchFx(s, t, k, sfx, arg); if (face) s.react = { name: face, dur: 1.0, at: t }; }
  // his launches: the pad's shipment carries him up a floor (on the player's ↑ in the window; in the video, on the word)
  for (const [lt, y0, y1, air] of LAUNCHES) {
    const go = VIDEO ? cross(lt) && s.ground : s.jumpedAt === t && Math.abs(t - lt) <= 0.2 && s.jumpY != null && Math.abs(s.jumpY - y0) < 0.2;
    if (go) { s.launchG = 8 * LAUNCH_H / (air * air); s.vy = 4 * LAUNCH_H / air; s.ground = false; s.on = null; s.launchAt = t; s.jumpedAt = t; s.airJumped = false; s.airUsed = 0;
      glitchFx(s, t, 0.3, 'tubeWhoosh'); } }
  // STAGE 2 (§3.5): a vat is a death 3 below the floor he left (the camera can't follow him down off an upper floor); the
  // rechargeable eagles throw him on (the engine's orb rule, done here so no Geometry-Dash ring is drawn over the story's eagles)
  if (!VIDEO) {
    if (s.ground) { s.standY = s.y; s.eagleLast = -1; }
    else if (s.standY != null && s.y < s.standY - 3 && !(t > CHUTES[0][0] && t < 87.6) && !(t > CHUTES[1][0] && t < 177.8)) { s.dead = true; s.why = 'fell'; }
    if (!s.ground && t > 104.8 && t < 107.5) EAGLES.forEach((et, i) => { if (i > (s.eagleLast ?? -1) && Math.abs(C.X(et) - s.x) < 0.7 && Math.abs(EAGLE_Y - (s.y + 0.625)) < 0.9) {
      s.eagleLast = i; s.launchG = 0; s.vy = JUMP * 1.2; s.orbAt = t; s.airJumped = false; s.airUsed = 0; s.eagles = t; } });
  }
  // THE SECRET (rework §1): on the summit, after ANSWER ✓ prints, a hop + the air jump up to touch the board ships 10 more lies
  // (optional, never needed; the bot doesn't take it). Only a flag: the story adds the 10 to LIES SHIPPED and pops the board.
  if (!VIDEO && s.ciSecret == null && t > 200.40 && t < 203.40 && !s.ground && s.y > SUMMIT + 1.9) s.ciSecret = t;
  if (t < 199) s.ciSecret = null;
  // the two chutes: the catwalk snaps (he rides the fall onto "POTATO!") and the socket dive (a slow fall into the dark)
  if (t > CHUTES[0][0] && t < 86.9 && !s.ground && s.y > 0.02) s.vy = Math.max(s.vy, -3.75);
  if (cross(CHUTES[1][0])) s.floatUntil = 176.95;
  // PO-TA-TO: the three giant presses shake the camera (theme.modeCam)
  { let sh = 0; for (const a of [62.65, 62.82, 63.03, 242.47]) if (t >= a && t < a + 0.4) sh = Math.max(sh, (a > 200 ? 0.6 : 0.32) * Math.exp(-(t - a) / 0.09)); s.camShake = sh; }
  // the grab (§4.3): HE'S — the press is the kidnapping; a start after it finds Kevin already in his crate
  if (s.grabAt == null) { if (VIDEO ? t >= GRAB : (t > GRAB + 0.3 || (s.glitchAt != null && s.glitchAt > GRAB - 0.45 && s.glitchAt < GRAB + 0.35))) s.grabAt = VIDEO || t > GRAB + 0.3 ? GRAB : s.glitchAt; }
  // who is Kevin? he turns to the monitor; after Mom's first message he glances back at Kevin's crate after every jam
  s.facing = t >= 145.4 && t < 147.82 ? 0.95 : null;
  if (t > 171.0) for (const r of COURSE) if (r[1] === 'wall' && t > r[0] + 0.25 && t < r[0] + 0.85) s.facing = -0.85;
  if (cross(230.49)) s.react = { name: 'joy', dur: 1.6, at: t };
  // THE VIDEO plays the course's presses itself, on the word (stage 1: nothing to hit, so it shows a clean run)
  if (VIDEO) for (const r of COURSE) { const [pt, kind, , what, hold] = r; if (!cross(pt)) continue;
    if (kind === 'pad' || kind === 'chute') continue;
    if (kind === 'dbl2') { if (!s.ground) { s.vy = AIR_JUMP; s.airJumped = true; s.doubleAt = t; } continue; }
    if (kind === 'stack') { if (s.ground) { s.vy = BEAT_JUMP; s.ground = false; s.on = null; s.jumpedAt = t; s.jumpY = s.y; s.duckUntil = 0; s.stackAir = pt + STACK_AIR; } continue; }
    if (UP_KINDS.has(kind)) { if (s.ground) { s.vy = BEAT_JUMP; s.ground = false; s.on = null; s.jumpedAt = t; s.jumpY = s.y; s.duckUntil = 0; } else if (kind === 'step') { s.vy = Math.max(s.vy, AIR_JUMP); }
      if (what === 'eagles') s.eagles = t; continue; }
    if (kind === 'high') { s.duckUntil = Math.max(s.duckUntil || 0, (hold || t) + DUCKF); continue; }
    if (kind === 'wall' || kind === 'dormant') { s.blink = 0.22; s.blinkFrom = { x: s.x, y: s.y }; s.glitchAt = t; s.phase = 0.5; s.glitchKind = 'phase'; s.react = { name: 'grin', dur: 0.5, at: t }; glitchFx(s, t, 0.7, 'glitch'); } }
  if (VIDEO && s.stackAir != null && cross(s.stackAir)) { if (!s.ground) { s.vy = AIR_JUMP; s.airJumped = true; s.doubleAt = t; } s.stackAir = null; }
  // the rechargeable eagles (C42): three throws over the long vat (the orbs, in the video by their times)
  if (VIDEO) for (const ot of EAGLES) if (cross(ot)) { s.vy = JUMP * 1.2; s.ground = false; s.on = null; s.orbAt = t; }
}
const EAGLES = [105.48, 106.19, 106.90], EAGLE_Y = 5.35;

// ---- STAGE 2: where each course piece goes (§3.1 leads, written as "the moment he's at its middle") ----
// low crate: he's over its middle at the top of a hop pressed on the word (tp + half a hop) · press head: the middle of the duck
// (tp + duckFor/2) · gate: the middle of the glitch (tp + 0.25; glitchFor 0.5). Vats are carved from the floors; the chains
// (loading wheels, paper bridge, fake belt, bots) put one piece under each landing.
const MID = { low: P / 2, hurdle: P / 2, high: DUCKF / 2, wall: GLITCHF / 2, stack: STACK_MID };
const W_OF = { low: 0.6, hurdle: 0.6, high: 0.95, wall: 0.25, stack: 0.6 };   // (stack: the rework's two-crate pile, ↑ then ↑ in the air)
export const AIRLESS = [95.5, 97.1];                              // C36: no air jump over the professor's pit (only the invented source gets you over)
function stage2(objs, map) {
  const K = makeCourse({ speed: 10.5, sections: SECTIONS, boosts: BOOSTS.map(({ t0, t1, k }) => ({ t0, t1, k })), objs: [], end: END, outro: false }, map), X = K.X;
  const Xinv = x => { let a = -30, b = END + 20; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (X(m) < x) a = m; else b = m; } return b; };
  // the floors, with the vats cut out of them
  let ground = FLOORS.map(([a, b, y]) => [a, b, y]);
  const holes = [];
  const carve = (a, b, what) => { const out = []; let y = null; for (const [g0, g1, gy] of ground) { if (g1 <= a || g0 >= b) { out.push([g0, g1, gy]); continue; } y = gy; if (g0 < a) out.push([g0, a, gy]); if (g1 > b) out.push([b, g1, gy]); } ground = out; holes.push([a, b, y, what]); };
  const tiles = [];
  // the chains: consecutive rows of one kind+look ([press times]); a vat under them, a piece under each landing
  const chains = []; COURSE.forEach((r, i) => { if (!['crumble', 'fake', 'pump'].includes(r[1])) return; const last = chains[chains.length - 1];
    if (last && last.kind === r[1] && last.what === r[3] && r[0] - last.ps[last.ps.length - 1] < 1.0) last.ps.push(r[0]); else chains.push({ kind: r[1], what: r[3], ps: [r[0]] }); });
  for (const ch of chains) { const ps = ch.ps; carve(ps[0] + 0.10, ps[ps.length - 1] + 0.45, ch.what);
    for (let k = 0; k + 1 < ps.length; k++) tiles.push({ t0: ps[k] + 0.45, t1: ps[k + 1] + 0.18, kind: ch.kind, what: ch.what }); }
  for (const r of COURSE) { if (r[1] === 'hole') carve(r[0] + 0.08, r[0] + 0.35, r[3]); if (r[1] === 'dbl') carve(91.80, 92.55, 'vat'); }
  carve(96.20, 97.05, 'professor');                                 // C36: the pit the invented source fills
  carve(105.30, 107.40, 'eagles');                                  // C42: the long vat the eagles carry him over
  for (const [a, b, y] of ground) objs.push({ k: 'block', t: a, tEnd: b, y, h: 0.6 });
  for (const tl of tiles) { const y = floorAt(tl.t0); objs.push({ k: 'block', t: tl.t0, tEnd: tl.t1, y, h: 0.6, text: tl.what,
    crumble: tl.kind === 'crumble' ? 1 : 0, pump: tl.kind === 'pump' ? 0.3 : 0, pumpBeats: 1 }); }
  objs.push({ k: 'block', t: 96.20, tEnd: 97.05, y: 0, h: 0.6, dormant: true, text: 'professor' });
  HOLES.length = 0; for (const [a, b, y, what] of holes) HOLES.push({ x0: X(a), x1: X(b), gy: y, what, t0: a, t1: b });
  // also the floors' own gaps (the launch vats): every gap that isn't a chute is a vat
  for (let i = 0; i + 1 < FLOORS.length; i++) { const [, b, y] = FLOORS[i], [a2, , y2] = FLOORS[i + 1]; if (a2 > b + 0.01 && y2 >= y) HOLES.push({ x0: X(b), x1: X(a2), gy: y, what: 'launch', t0: b, t1: a2 }); }
  // the hazards
  PLACE.length = 0;
  COURSE.forEach((r, i) => { const [tp, kind0, label, what, hold] = r, kind = kind0 === 'hurdle' ? 'low' : kind0;
    if (!MID[kind]) return;
    const gy = floorAt(tp + MID[kind]); let x0 = X(tp + MID[kind]) - W_OF[kind] / 2, x1 = x0 + W_OF[kind];
    if (kind === 'high' && hold) { const e = 0.14; x0 = X(tp + e) + 0.28 - 0.2 + 0.0; x1 = X(tp + DUCKF - e) - 0.28 + 0.2; }   // C50 HOB-GOB-LIN: one long head, one duck (±0.14 s; duckFor 0.72)
    PLACE[i] = { x0, x1, gy };
    const t = Xinv(x0), w = x1 - x0, text = label || '';
    if (kind === 'low') objs.push({ k: 'word', t, wk: 'low', w, y0: gy, y1: gy + 0.55, text, obj: 'grid' });
    if (kind === 'stack') objs.push({ k: 'word', t, wk: 'low', w, y0: gy, y1: gy + STACK_H, text, obj: 'grid', long: true });   // (long: the whole pile is solid, no fair-hitbox trim)
    if (kind === 'high') objs.push({ k: 'word', t, wk: 'high', w, y0: gy + 0.9, y1: gy + 2.6, text, obj: 'grid', long: !!hold });
    if (kind === 'wall') objs.push({ k: 'word', t, wk: 'wall', w, y0: gy, y1: gy + 3.0, text, obj: 'grid' }); });
}
// the top he stands on at song time t (floors, and the ledges / layers he climbs)
function floorAt(t) { let y = null; for (const [a, b, fy] of FLOORS) if (t >= a - 0.02 && t < b + 0.02) y = fy;
  for (const [a, b, ly, what] of LEDGES) if (t >= a && t < b && what !== 'para' && what !== 'chart' && what !== 'brim') y = ly;
  if (y == null) { const f = [...FLOORS].reverse().find(([a]) => a <= t); y = f ? f[2] : 0; } return y; }

export function build(words, map) {
  const objs = [];
  const block = (t0, t1, y, h, o = {}) => objs.push({ k: 'block', t: t0, tEnd: t1, y, h, ...o });
  if (VIDEO) for (const [a, b, y] of FLOORS) block(a, b, y, 0.6);
  else stage2(objs, map);
  for (const [a, b, y, what] of LEDGES) { const under = [...FLOORS].reverse().find(([fa]) => fa <= a + 0.01) || FLOORS[0];
    block(a, b, y, Math.max(0.6, y - under[2]), { step: what !== 'meat' && what !== 'pad', pump: what === 'meat' ? 0.3 : 0, pumpBeats: 1, text: what }); }
  // STAGE 2: the course (§3.4) goes here when VIDEO is false — crates, presses, gates, vats, the fake belt, the professor, the eagles
  return {
    speed: 10.5, hopBeats: 1, duckFor: DUCKF, glitchFor: GLITCHF, glitchReach: 5, chargeBeats: 2, coyote: 0.09, jumpBuffer: 0.12, graceStart: 13.4,
    fakeOnBeat: true, dropPhysical: true, noV: true, softCuts: true, outro: false, preroll: PREROLL, keyTicks: KEYTICKS,
    invincible: VIDEO, costume: 'construction-crew', costumeAt: COSTUME_AT,   // E6 (main.mjs): bare until the drop, one flick of the hard hat, then pinned
    airJumpsAt: t => (t > AIRLESS[0] && t < AIRLESS[1] ? 0 : 1),
    retryAt: t => { let r = RETRY[0]; for (const a of RETRY) if (a <= t - 1.5) r = a; return r; },
    deathText: () => '',
    story, modeView: ciView, onStep, faces: FACES,
    hideAt: t => t >= 243.4,
    zoomAt,
    theme: { viewH: 9.0, camMax: 14.5, camAirMax: 2.0, lyricSide: 'alt', lyricArt: false, lyricGlitch: false, lyricColor: '#eafff1',
      lyricGcol: ['#eafff1', '#7dff9a', '#ffd27a', '#00e5ff'], lyricSplit: ['#0f6a3a', '#ffbf73'],
      backdrop: 'plain', bg: '#0c1118', igOff: true, objA: 'rgba(0,0,0,0)', objects: { low: 'grid', high: 'grid', wall: 'grid' },   // (the engine's own hazard art off: grid in a clear ink draws nothing; the story paints the crates, presses and gates on the hitboxes)
       digit: '#ffcf4a', digit2: '#ff8a3c', edge: '#ffcf4a', block: '#2b3038', ground: '#2b3038', blockText: ' ',
      word: '#fff2dc', wordSlab: '#2b2622', light: '#ffe6c2', light2: '#ffcf4a', halo: '#ffd9a0', pulse: false, noGhost: true, noPunch: true,
      lookFlash: 0, modeCam: true, csZoom: 1, csLift: 0, decor: [], gwords: false },   // (gwords: no floating glitch phrases: his glitch stays on him)
    sections: SECTIONS, boosts: BOOSTS.map(({ t0, t1, k }) => ({ t0, t1, k })), cutscenes: CUTS,
    objs, signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })), end: END, start: 0,
  };
}

// the camera (§5): close on the desk, the push-through into the screen on the 13.18 hit, a step in on each "Kevin?" tap, wide on
// the roof (206.93), tight on KING (209.53)
const ez = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const KEVIN_TAPS = [144.97, 145.52, 146.03, 146.41, 146.71, 147.14];
export function zoomAt(t) {
  if (t < 12.6) return 1.14;
  if (t < 13.18) return 1.14 + 2.4 * ((t - 12.6) / 0.58) ** 3;                 // into the laptop screen
  if (t < 14.37) return 1.0 + 0.18 * (1 - ez((t - 13.18) / 1.1));             // through: the factory opens out
  if (t >= 144.9 && t < 148.27) { let n = 0; for (const a of KEVIN_TAPS) if (t >= a) n += ez((t - a) / 0.12); return 1 + 0.045 * n; }
  if (t >= 148.27 && t < 148.9) return 1 + 0.27 * (1 - ez((t - 148.27) / 0.6));
  if (t >= 206.6 && t < 209.53) return 1 - 0.3 * ez((t - 206.85) / 0.5);       // the whole factory + the reactor
  if (t >= 209.53 && t < 211.4) return 0.7 + 0.55 * ez((t - 209.53) / 0.3) - 0.25 * ez((t - 210.9) / 0.5);   // crowned (tight)
  if (t >= 211.4 && t < 212.2) return 1.0;
  if (t >= 241.3 && t < 243.6) return 1 - 0.12 * ez((t - 241.3) / 1.0);
  return 1;
}
