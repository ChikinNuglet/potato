// Ghost runner course, SECOND CRACK (designer2, Nov 4). Run: node course-gen.mjs  -> writes course.json + prints the checks.
// Chikin's sketch: HUGE phones (~86% of the screen height), docked edge to edge, moving up/down (bob) and side to side
// (breathe), some fall on their side. Potato lives INSIDE the screens and never enters the dark between them (the X space,
// where the lyrics go). He crosses where two phones meet by glitching through the shared wall. Everything below is in WORLD
// units (W) of the current Ghost mode (his height HS = 1.25 W); inside a phone the current screen-local units (sl, x Z=0.8)
// and the current F / J constants apply unchanged. Times: song seconds; beats on Ghost's grid (P, OFF).
import fs from 'fs';
const P = 0.61227, OFF = 0.21, tb = b => +(OFF + P * b).toFixed(3), bOf = t => (t - OFF) / P;
const U = { w: 7.06, h: 11.74, band: [-4.82, 4.34], xb: 2.88 }, S = { w: 11.74, h: 7.06, band: [-2.48, 2.32], xb: 5.2 };
const DIM = k => k === 'S' ? S : U;
// pivot tips (pivot = the bottom corner on the fall side; dir +1 = falls to the right)
const tipUS = (cx, cy) => [+(cx + U.w / 2 + U.h / 2).toFixed(2), +(cy - U.h / 2 + U.w / 2).toFixed(2)];   // U -> S, dir +1
const tipSU = (cx, cy) => [+(cx + S.w / 2 + U.w / 2).toFixed(2), +(cy - S.h / 2 + U.h / 2).toFixed(2)];   // S -> U, dir +1 (stands up off its right end)
// motion: bob [A W, per beats, phase beat] = piston between rest-A/2 and rest+A/2, hold per-0.5 beats at each end, move 0.5 beat (eased);
//         breathe [gap W, per, phase] = same shape sideways: 0 = docked, gap = apart (door shut). Breathe only runs until Th+1 beat of the
//         phone it belongs to, then it holds docked (the shutter is the pressure from then on).
const wave = (m, b) => { if (!m) return 0; const [A, per, ph] = m, c = 2 * per, x = (((b - ph) % c) + c) % c, h = per - 0.5;
  const k = x < h ? 0 : x < per ? ease((x - h) / 0.5) : x < per + h ? 1 : 1 - ease((x - per - h) / 0.5); return A * k; };
const ease = u => u * u * (3 - 2 * u);
// owners (ART.md colours): J James blue · S Sheila coral · E Jess · C Carol mustard · M Mum mint · B a +41 bus phone, slate
// Th = the beat this phone becomes the CURRENT one (the one before it starts to fall asleep 1 beat later).
// y = rest centre y (W, camera rest is y 0). join: 'R' docks to the previous phone's right wall, 'D' docks under it (the tower).
const PH = [
 { o:'J', Th:14.2, y:0,    sec:'verse 1 (teach)', start:true, note:'the opening phone. GRACE to 21.0' },
 { o:'S', Th:26,   y:-2.0, sec:'verse 1 (teach)', note:'first crossing: lower, static. Hint "SPACE at the wall"' },
 { o:'J', Th:34,   y:-0.5, sec:'verse 1 (teach)', note:'higher than #1: hop up before you glitch. GRACE ends 21.0 (beat 34)' },
 { o:'S', Th:42,   y:-2.0, bob:[1.2,4,0], sec:'verse 1b', note:'first mover (slow piston)' },
 { o:'J', Th:48,   y:-1.0, bob:[1.6,2,0], sec:'chorus 1', note:'Biscuit photos SUPER (30.86) land here: big platforms' },
 { o:'S', Th:54,   y:-2.4, bob:[1.6,2,1], sec:'chorus 1 / mute me', note:'BLOCKED 1 inside (36.30 -> 37.96); only phone awake at the slam' },
 { o:'J', Th:64,   y:-1.0, sec:'no hands, no face', tip:{ b:68.0, w:'still', warn:1.5, dir:1 }, note:'TIP WITH HIM INSIDE (41.84): the world turns, lands, auto-rotate shove' },
 { o:'S', Th:74,   y:null, rel:1.0, breathe:[1.6,2,0], sec:'call me / already there', note:'first BREATHER: the door opens and shuts on the beat. 48.11 tapback bumper' },
 { o:'J', Th:82,   y:-2.2, bob:[2.0,2,0], sec:'verse 2', note:'soup photos SUPER (51.8)' },
 { o:'S', Th:88,   y:-0.4, bob:[2.0,2,1], sec:'verse 2', note:'bobs against #8: cross on the overlap' },
 { o:'J', Th:94,   y:-1.6, breathe:[1.6,2,1], bob:[1.2,4,2], sec:'verse 2', note:'58.99 HUG throw here or in #9' },
 { o:'S', Th:100,  y:-0.6, bob:[2.2,2,0], sec:'define real', note:'defines SUPER (63.47). Long phone (12 beats): the tipper hangs ahead' },
 { o:'J', Th:112,  y:null, rel:0.4, tipper:{ b:109.0, w:'forget', win:[-1, 0.5], hang:[1.8, 7.5] }, sec:'define real', note:'TIPPER 1 = the bridge. Hangs above-right on its cable (out of reach). SPACE at #11\'s right wall on "forget" drops it well' },
 { o:'S', Th:115,  y:null, rel:0.6, sec:'bridge: the tower', tower:0, note:'tower top. Static. The bridge (70.62)' },
 { o:'J', Th:120,  join:'D', sec:'bridge: the tower', tower:1, note:'docked UNDER #13: the shutter pushes you down to the bar, SPACE through the floor. 72.46 wifi drop' },
 { o:'S', Th:125,  join:'D', sec:'bridge: the tower', tower:2, note:'76.35 quiet line: no jolt within 1 beat, phones still. 77.36 gone throw. porch photos 77.75' },
 { o:'J', Th:131,  y:null, rel:0, bob:[1.6,2,0], sec:'don\'t be lonely', note:'out of the tower sideways (80.42)' },
 { o:'E', Th:137,  y:-1.6, sec:'one of the boys', tip:{ b:140.0, w:'body', warn:1.5, dir:1 }, hold:[86.78, 88.0], note:'JESS\'S phone (screenshot 83.1). TIP WITH HIM INSIDE (85.93). Then STILL 86.78-88.00 (87.39 "james i\'m scared")' },
 { o:'S', Th:146,  y:null, rel:0.2, kind:'S', arriveB:139.5, standUp:{ b:150.0, w:'everywhere', warn:1.5 }, sec:'chorus 2', note:'already lying (landscape): PETUNIA 1-3 as huge platforms, "and WHOSE cat is that" 91.25. Stands back UP with him inside (92.05)' },
 { o:'J', Th:153,  y:null, rel:0.8, dockB:151.5, bob:[2.2,2,0], sec:'chorus 2', note:'BLOCKED 2 inside (95.10 -> 96.71)' },
 { o:'S', Th:160,  y:-1.2, bob:[2.4,2,1], sec:'still i run the place (hardest)', note:'' },
 { o:'C', Th:166,  y:null, rel:-0.4, tipper:{ b:164.0, w:'still', win:[-1, 0.5], hang:[1.8, 7.0], appear:99.05 }, sec:'still i run the place (hardest)', note:'TIPPER 2 = CAROL\'s phone: lights when she\'s added (99.05), hangs buzzing, drop it on "still" (100.62)' },
 { o:'M', Th:170,  y:null, rel:-0.6, bob:[1.0,8,0], sec:'still i run the place (hardest)', note:'MUM\'s phone (added 100.28): the slow safe one. 101.51 the +41 light up in the skyline' },
 { o:'B', Th:174,  y:-0.8, breathe:[1.8,1,0], bob:[2.4,1,1], sec:'still i run the place (hardest)', note:'a +41 bus phone: the hardest crossing (fast breathe + bob). Last target 106.42' },
 { o:'S', Th:177,  y:-1.4, sec:'outro', note:'easy, static. 109.19 throw' },
 { o:'J', Th:181,  y:-0.6, end:188.5, sec:'outro', note:'JAMES\'S LAST PHONE. 111.95 drop. 113.17 every other phone goes dark. 115.62 the ending' },
];
// ---- build poses -----------------------------------------------------------------------------------------------------------
const out = []; let prev = null, base = 0;   // base: after the tower the course carries on at the tower's bottom (y values are relative to it)
for (let i = 0; i < PH.length; i++) {
  const p = PH[i], kind0 = p.kind || 'U', d = DIM(kind0), r = { id: i, owner: p.o, sec: p.sec, kind: kind0, w: d.w, h: d.h };
  r.Th = p.Th; r.tTh = tb(p.Th); r.join = p.join || 'R';
  if (p.start) { r.cx = 0; r.cy = 0; r.tDock = 0; r.tArrive = 0; }
  else {
    const pk = prev.kindAfter || prev.kind, pd = DIM(pk), px = prev.cxAfter ?? prev.cx, py = prev.cyAfter ?? prev.cy;
    if (r.join === 'D') { r.cx = px; r.cy = +(py - pd.h / 2 - d.h / 2).toFixed(2); }
    else { r.cx = +(px + pd.w / 2 + d.w / 2).toFixed(2); r.cy = p.y != null ? +(base + p.y).toFixed(2) : +(py + (p.rel || 0)).toFixed(2); }
    r.tDock = tb(p.dockB ?? p.Th - 2); r.tArrive = tb(p.arriveB ?? p.Th - 4);
    r.arriveFrom = r.join === 'D' ? [0, -4] : [5, -1.5];   // slides in from here (relative W), asleep, over 1 beat ending at tArrive+1 beat... then holds until tDock-0.5 beat, docks over 0.5 beat
  }
  if (p.bob) r.bob = p.bob; if (p.breathe) r.breathe = p.breathe; if (p.hold) r.hold = p.hold; if (p.tower != null) r.tower = p.tower;
  if (p.tip) { const [ax, ay] = tipUS(r.cx, r.cy); r.tip = { t: tb(p.tip.b), word: p.tip.w, warnBeats: p.tip.warn, tWarn: tb(p.tip.b - p.tip.warn), swingBeats: 1, tLand: tb(p.tip.b + 1), rotate: [+(tb(p.tip.b + 1) + 0.15).toFixed(3), +(tb(p.tip.b + 1) + 0.45).toFixed(3)], dir: 1, to: [ax, ay] };
    r.kindAfter = 'S'; r.cxAfter = ax; r.cyAfter = ay; r.bob = null; }
  if (p.standUp) { const [ax, ay] = tipSU(r.cx, r.cy); r.standUp = { t: tb(p.standUp.b), word: p.standUp.w, tWarn: tb(p.standUp.b - p.standUp.warn), tLand: tb(p.standUp.b + 1), rotate: [+(tb(p.standUp.b + 1) + 0.15).toFixed(3), +(tb(p.standUp.b + 1) + 0.45).toFixed(3)], dir: 1, to: [ax, ay] };
    r.kindAfter = 'U'; r.cxAfter = ax; r.cyAfter = ay; }
  if (p.tipper) {
    // hangs above-right: upright, its left wall `hang[0]` W right of the previous phone's right wall, its centre `hang[1]` W above its docked pose.
    // GOOD fall (Space at the previous phone's right wall inside the window): pivots and drops onto its side, docked (landscape) at r.cy.
    // WRONG fall (Space too early, or none: it falls by itself at the window's end): lands on its END (upright), 3.0 W lower, docked.
    const pk = prev.kindAfter || prev.kind, pd = DIM(pk), px = prev.cxAfter ?? prev.cx;
    r.kind = 'U'; r.w = U.w; r.h = U.h;
    r.hangPose = [+(px + pd.w / 2 + p.tipper.hang[0] + U.w / 2).toFixed(2), +(r.cy + p.tipper.hang[1]).toFixed(2)];
    r.tipper = { word: p.tipper.w, tWord: tb(p.tipper.b), win: [tb(p.tipper.b + p.tipper.win[0]), tb(p.tipper.b + p.tipper.win[1])], tAuto: tb(p.tipper.b + p.tipper.win[1]),
      fallBeats: 1, good: { kind: 'S', c: [+(px + pd.w / 2 + S.w / 2).toFixed(2), r.cy] }, wrong: { kind: 'U', c: [+(px + pd.w / 2 + U.w / 2).toFixed(2), +(r.cy - 3.0).toFixed(2)] } };
    r.tipper.appearNote = 'hangs, lit, from tArrive';
    r.tArrive = p.tipper.appear ?? tb(p.tipper.b - 8); r.tDock = null;   // it hangs from 8 beats before the word; docks only by falling
    r.kindAfter = 'S'; r.cxAfter = r.tipper.good.c[0]; r.cyAfter = r.tipper.good.c[1];   // the course after it is laid out for the GOOD fall; the WRONG fall's right wall is the next phone's dock target (see DESIGN §5)
  }
  if (p.end) r.tEnd = tb(p.end);
  if (r.tower === 2) base = r.cy;
  r.note = p.note; out.push(r); prev = r;
}
for (let i = 0; i < out.length; i++) { const r = out[i], n = out[i + 1];
  if (n) { r.tSleep0 = tb(n.Th + 1); r.tSleep1 = tb(n.Th + 5); r.tLeave = tb(n.Th + 5.5); } }
// ---- checks ----------------------------------------------------------------------------------------------------------------
const msgs = [];
const yAt = (r, t) => { const b = bOf(t); let y = (r.tip && t >= r.tip.tLand) || (r.standUp && t >= r.standUp.tLand) || (r.tipper) ? (r.cyAfter ?? r.cy) : r.cy;
  if (r.hold && t >= r.hold[0] && t <= r.hold[1]) return y; return y + (r.bob ? wave(r.bob, b) - r.bob[0] / 2 : 0); };
const kindAt = (r, t) => r.tip ? (t >= r.tip.tLand ? 'S' : 'U') : r.standUp ? (t >= r.standUp.tLand ? 'U' : 'S') : r.tipper ? 'S' : r.kind;
for (let i = 0; i + 1 < out.length; i++) {
  const a = out[i], b = out[i + 1];
  const t0 = b.tipper ? b.tipper.tWord + 1 * P : b.tDock, t1 = tb(b.Th + 3);
  let open = 0, minOv = 99, worst = 0;
  for (let t = t0; t <= t1; t += 0.02) {
    if (b.breathe && t < tb(b.Th + 1) && wave(b.breathe, bOf(t)) > 0.05) continue;
    const ka = DIM(kindAt(a, t)), kb = DIM(kindAt(b, t));
    let ov;
    if (b.join === 'D') ov = Math.min(ka.xb, kb.xb) * 2;   // the floor door: overlap in x
    else { const ya = yAt(a, t), yb2 = yAt(b, t); ov = Math.min(ya + ka.band[1], yb2 + kb.band[1]) - Math.max(ya + ka.band[0], yb2 + kb.band[0]); }
    minOv = Math.min(minOv, ov); if (ov >= 3.0) open += 0.02;
  }
  const ok = open >= 2 * P; msgs.push(`door ${i}->${i + 1} ${b.join === 'D' ? '(floor)' : ''} window ${t0.toFixed(2)}-${t1.toFixed(2)} open ${open.toFixed(2)} s (min overlap ${minOv.toFixed(2)} W) ${ok ? 'ok' : 'TOO SHUT'}`);
}
// hazards too close: jolts / blocked / tips must not fall in a crossing's first beat or within 2 beats of each other
const JOLTS = [16.74, 32.66, 58.99, 72.46, 77.36, 109.19, 111.95], BLOCKED = [[36.30, 37.96], [95.10, 96.71]];
const evs = [...JOLTS.map(t => ['jolt', t]), ...BLOCKED.map(b => ['BLOCKED', b[1]]), ...out.filter(r => r.tip).map(r => ['tip#' + r.id, r.tip.t]), ...out.filter(r => r.standUp).map(r => ['standUp#' + r.id, r.standUp.t]), ...out.filter(r => r.tipper).map(r => ['tipper#' + r.id, r.tipper.tWord])].sort((a, b) => a[1] - b[1]);
for (let i = 1; i < evs.length; i++) if (evs[i][1] - evs[i - 1][1] < 2 * P) msgs.push(`CLOSE: ${evs[i - 1][0]} ${evs[i - 1][1]} / ${evs[i][0]} ${evs[i][1]}`);
for (const [n, t] of evs) for (const r of out) if (r.tTh && Math.abs(t - r.tTh) < P * 0.99 && n !== 'tipper#' + r.id) msgs.push(`near a handoff: ${n} ${t} vs #${r.id} Th ${r.tTh}`);
for (const [, w] of BLOCKED) { const awake = out.filter(r => (r.tDock ?? r.tipper?.tWord ?? 0) <= w && (r.tSleep0 ?? 999) > w).map(r => r.id); msgs.push(`BLOCKED ${w}: awake phones ${awake.join(',')}`); }
const ys = out.map(r => r.cyAfter ?? r.cy); msgs.push(`rest y range ${Math.min(...ys).toFixed(2)} .. ${Math.max(...ys).toFixed(2)} (tower excluded: ${out.filter(r => r.tower == null).map(r => r.cy).reduce((a, b) => Math.min(a, b))})`);
const json = { units: 'W = the current Ghost world unit (Potato HS = 1.25 W)', beat: P, OFF, view: { h: 13.6, aspect: 1.6 },
  phone: { U: { ...U, glassSl: [-4.1, 4.1, -7.45, 6.6], CX: 3.6, HB: 5.0, BAR: -6.45, TH0: -6.1, frameW: 0.25 }, S: { ...S, glassSl: [-7.025, 7.025, -4.1, 4.1], CX: 6.5, HB: 2.9, BAR: -3.1, TH0: -2.75, frameW: 0.25 } },
  phones: out };
fs.writeFileSync(new URL('./course.json', import.meta.url), JSON.stringify(json, null, 0).replace(/\{"id"/g, '\n{"id"'));
console.log(msgs.join('\n'));
if (process.argv.includes('list')) for (const r of out) console.log(`#${r.id} ${r.owner} ${r.kind}${r.kindAfter ? '->' + r.kindAfter : ''} Th ${r.Th} (${r.tTh}) c ${r.cx},${r.cy}${r.cxAfter != null ? ' -> ' + r.cxAfter + ',' + r.cyAfter : ''} dock ${r.tDock} sleep ${r.tSleep0}-${r.tSleep1} ${r.bob ? 'bob' + JSON.stringify(r.bob) : ''} ${r.breathe ? 'breathe' + JSON.stringify(r.breathe) : ''}`);
