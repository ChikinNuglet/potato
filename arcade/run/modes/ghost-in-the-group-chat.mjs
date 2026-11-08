// modes/ghost-in-the-group-chat.mjs — Level 6: James's phone, a real text thread with Sheila, and Potato inside it.
// ROUND 5 (Nov 1, Chikin, after the rhythm typing): "ghost in the group chat isnt working still. we can zoom in so the phone just
// takes up the screen, its just an illusion, then there is more room to work with to develop the game. Maybe its a moving
// platformer like thursday and read the terms, but vertical" · "where you have to keep trying to stay at the bottom" · "yeah,
// and he can glitch to them, they can read as sent, and you have until they read as read to glitch them" · "the text bubbles are
// the platforms" · "the outlines of the boxes glow where potato is standing with little glitch energy" · "only the boxes he can
// glitch" · "like digital glitching water".
// Kept from before: the phone on the table, its lock screen glitching into him, Sheila's notification as we come in, "Thursday",
// the upright phone, conversation 2 + its branches (ALT replies), the photos (a potato in each; the last one turns into Petunia),
// the tapbacks, the BLOCKED banner, the group chat, the Sheet Ghost on the choruses, the power-off and his escape into the wifi.
//
// THE LOOK: the opening is the phone lying upright on the table. When Sheila's notification opens, the phone's screen keeps
// growing until it fills the whole screen (the bezel ends up as a thin frame round the edge: the illusion) — a real iMessage
// thread, big: the status bar and the Dynamic Island on top (the lyrics play in the island, in his glitch text), Sheila's name
// and avatar, her grey bubbles on the left, James's blue ones on the right, typing dots, receipts, the input bar at the bottom.
//
// THE RULES (pure, 120 Hz; the bot runs the same code). Everything is in WORLD units round the screen's centre (S below).
//   · The thread RISES like a real one: every new text comes in at the BOTTOM (on its time in THREAD — the song's beat) and pushes
//     the whole conversation UP. The TEXT BUBBLES ARE THE PLATFORMS (one-way: you land on them from above, jump up through them).
//   · Every row lands on the song's REAL beat (def.phone.grid: the nearest half beat — map.json's grid drifts ~0.3 s off by the end).
//   · ← → walk (not past the conversation's sides) · ↑ hop · ↓ drop through the bubble you're on. Stay low: the bubble you stand on
//     keeps rising; carried up into the OLD HISTORY = LOST: the phone goes dark and boots back up at the section's start (retry:
//     'section'). The old history comes DOWN a step every time she reads one of his moments first (a grey "Read" band over the
//     top of the thread), goes back up a step for every rewrite, and leans in a little by itself in the second half (histTop).
//     (Before `grace` — the teaching verse — a miss costs nothing and the header just bonks him back down; also just after a restart.)
//   · The input bar is no floor: fall past the newest text and the bar kicks him back up (higher every time in a row, no glitch
//     back from it) — the fourth kick in a row throws him up into the old history.
//   · SPACE = his GLITCH. Standing on one of James's texts he can still glitch: it becomes POTATO'S version (conversation 2) — and
//     the bubble changes: a wider ledge (a bridge across, for the long ones); "You added Carol…" ones melt into grey lines (no
//     floor). Anywhere else: he glitch-TELEPORTS TO the nearest text he can still glitch below him (Chikin: "he can glitch to them"),
//     else the nearest bubble below (or ahead in the direction held: ← / → / ↓) — landing on one of James's glitchable texts
//     glitches it too. One glitch, then it comes back when he LANDS on a bubble (walking/dropping/hopping, not glitching) or after
//     two beats (the + in the input bar shows it). Nowhere to go = nothing happens.
//   · JAMES'S texts carry a receipt: Sent → Delivered → Read (the timer: they come in early, she reads them just before she
//     answers). Glitch it before Read and Sheila gets Potato's version and answers that (conversation 2); Read first and James's
//     words stand — she answers those (ALT) and what only follows a glitch doesn't happen. A burst (James's photos, his double /
//     triple texts) is one glitch: any bubble of it and the whole burst goes Potato's (a SUPER). The last photo turns into Petunia.
//   · ONLY James's texts he can still glitch glow (a purple rim + a pixel crawl) — like digital glitching water where he stands
//     (ghost-water.mjs); Sheila's and the Read ones stay plain under him. Their receipts are big, with a countdown ring.
//   · SHEILA'S texts: solid ground. Her typing dots are little platforms that come and go (Carol's too). Her tapback targets: her
//     bubble glows while the reaction menu is up — glitch it and the worst reaction lands; the badge is a BUMPER after.
//   · The BLOCKED banner drops down the whole thread (36.30 → 37.96, on the real grid) — only if her block line is in the thread:
//     glitch as it reaches him and it passes through him (a glitch makes him phase for PHASE s); touch it unglitched = blocked.
//   · Score hooks (s.score): every text glitched before Read (+ on the beat), on-beat teleports, time spent low.
//   · The end: 115.62 "slide to power off" — the slider goes on the beats, at 119.92 he leaps at us, 120.05 he's out; black; back
//     over the table, the phone dark, the router's lights purple.
import { SFX } from '../../play/sfx.mjs';
const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const ease5 = x => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
import { drawWater, drawShimmer, drawSpark, drawCrackle } from './ghost-water.mjs';
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare
// Everything below is in PHONE units (the phone's own coordinates: a portrait phone 4.2 wide, 9.1 tall — a real 19.5:9). The
// world sees it at K x that size, centred on x = 0.
export const G = {
  X0: -2.1, X1: 2.1, Y0: -0.45, Y1: 8.65, BZ: 0.17, RAD: 0.62,          // the glass (portrait), the bezel round it, its corners
  IB0: 0.03, IB1: 0.45, TH0: 2.2, HB: 7.3,                              // the input bar · the thread's floor (over his head: he stands on the strip under the thread, so her newest text is never behind him) · the header's bottom
  LANE0: 0.51, LANE1: 1.01, HITX: -1.02, V: 2.3, FL: 0.21,              // the suggestion strip (over the bar) · its hit line (the caret) · how fast keys come (phone units / s) · their type size
  M: 0.2,                                                                // the side margins
  FS: 0.2, LH: 0.262, PADX: 0.15, PADY: 0.09, MAXW: 0.68,              // type
  GAP1: 0.05, GAP2: 0.15, TBG: 0.21, NM: 0.18, RG: 0.22, DOTW: 0.66, DOTH: 0.42, PHW: 1.9, PHH: 1.4, ANIM: 0.18, SYSH: 0.34,
  PERF: 0.045, GOOD: 0.09, LATE: 0.2,                                    // the judge (s): perfect · good · a press this close but outside good is a miss
  HS: 1.25, HALFW: 0.375,                                                // his size (vs the sideways phone) · half his drawn width
  MAXN: 5, SQ: 0.75,                                                     // at most this many word keys in a text · how far a key's word may squeeze to fit
};
G.TW = G.X1 - G.X0 - 2 * G.M;
G.LX0 = G.X0 + G.M; G.LX1 = G.X1 - G.M;                                 // the strip's ends
G.ME = [-1.5, G.LANE1];                                                  // where he stands: on the strip, just behind the hit line, facing the keys
G.SEND = [G.X1 - G.M - 0.2, (G.IB0 + G.IB1) / 2];                       // the send button (in the bar)
G.START = [0.0, 3.1];                                                    // where he arrives on the lock screen
export const K = 1.6, OX = 0, OY = 0;                                    // phone -> world: x = OX + K*px, y = OY + K*py
export const PHONE_VIEW_H = 12.0, PHONE_CAM = OY + K * (G.Y0 + G.Y1) / 2;   // the level's theme.viewH / camFix (the mode sets the camera itself)
export const OPEN = { lit: 0.65, glitch0: 2.3, appear: 3.1, zoom0: 2.3, notify: 5.15, zoom1: 7.6, wake: 7.88, end: 7.9, wide0: 8.2, wide1: 8.85, ctl: 8.9 };   // (wide0 → wide1: the phone's screen grows to fill the screen · ctl: he's on her first text, yours)
const openOf = D => ({ ...OPEN, ...(D.open || {}) });
export const FAIL = { pull: 0.45, dim: 0.7, black: 1.15, done: 1.35 }, BOOT = { logo: 0.55, fade: 0.25 };   // lost in the old history: he's pulled up into the header, "loading earlier messages…", black — then it starts over (main.mjs) and the phone boots (his potato logo)
const LOCKP = { bw: G.X1 - G.X0, bh: G.Y1 - G.Y0, time: [0, 3.0, 1.3], date: [0, 2.08, 0.24], note: [0, 1.0, 3.9], him: [G.START[0], G.START[1] - (G.Y0 + G.Y1) / 2], btn: [1.42, -3.85], bar: -4.36, stat: [1.5, 4.3] };
export const LOCK = { P: LOCKP, L: LOCKP, NH: 0.86 };   // (NH: the notification's height)
export const lockK = (O, t) => O.turn0 == null ? 1 : ease5((t - O.turn0) / Math.max(0.1, O.turn1 - O.turn0));   // (1: no turn — the phone stays upright)
export const lockHim = (O, t) => { const k = lockK(O, t), a = LOCK.P.him, b = LOCK.L.him; return [a[0] + (b[0] - a[0]) * k, (G.Y0 + G.Y1) / 2 + a[1] + (b[1] - a[1]) * k]; };   // where he stands on it (phone units)
// the bursts: James's photo runs and his double/triple texts (rows with ph or bu), sent close together
export function bursts(thread) {
  const out = []; let cur = null;
  for (const r of thread) if (r.w === 'J' && (r.ph || r.bu)) { if (cur && r.t - cur.last < 1.0 && !!r.ph === !!cur.rows[0].ph) { cur.last = r.t; cur.rows.push(r); } else out.push(cur = { T: r.t, last: r.t, rows: [r] }); }
  return out;
}

// ======== THE INSIDE SCREEN (play): world units, round the screen's centre (SC) ========
// The camera fits IW × IH (16:10). The header's bottom is HB, the input bar's top BAR, the newest bubble's bottom TH0; the
// conversation column runs CX0 … CX1 (Sheila's bubbles hug the left of it, James's the right).
export const S = { IW: 28.6, IH: 15.5, HB: 5.0, BAR: -6.45, TH0: -6.1, CX0: -9.5, CX1: 9.5, FS: 0.56, LH: 0.72, PADX: 0.42, PADY: 0.25,
  MAXF: 0.6, GAP1: 0.16, GAP2: 0.42, TBG: 0.6, NM: 0.42, SYSH: 0.8, DOTW: 1.7, DOTH: 1.0, PHW: 3.6, PHH: 2.7, PHG: 0.18, ANIM: 0.16,
  LEDGE: 0.56, BRIDGE: 0.8, MORPH: 0.25, FRAME: 0.2, BADGE: 0.42 };
S.TW = S.CX1 - S.CX0; S.MAXW = S.MAXF * S.TW;
// The screen's units are Z world units: the inside is drawn a little smaller than the world, so Potato (a fixed size in the world)
// reads bigger against the thread. (IW is wider than 16:10 so a wider screen still fills; the frame goes at the visible edge.)
export const Z = 0.8;
export const SC = [OX + K * (G.X0 + G.X1) / 2, OY + K * (G.Y0 + G.Y1) / 2];   // the screen's centre in the world (the phone's) — a point (lx, ly) on the screen is SC + Z·(lx, ly) in the world
// his moves (world units, s): walk · ground / air accel · gravity · hop height · max fall · how long ↓ ignores the bubble · coyote ·
// his foot reach past a bubble's end · how long a glitch phases him · beats till a used glitch comes back by itself · teleport reach ·
// the bar's kicks (in a row) · lost when his feet get this close under the header (WARN: the warning band)
// (BOUNCE: the bar's kicks in a row — the last one throws him up into the old history; X: he can't walk past the bubble column.
// The old history (histTop): MISS — how far it comes down when she reads one he didn't glitch · BACK — how far a rewrite pushes it
// back up (a burst: SUPER) · MAXH — how far down it can come at most · CREEP — how far it leans in by itself over the second half ·
// GLY: how far below him a text he can glitch pulls his glitch to it)
export const F = { WALK: 7.2, ACCG: 70, ACCA: 42, GRAV: 44, HOP: 2.15, FALL: 20, DROP: 0.24, COY: 0.09, FOOT: 0.26, PHASE: 0.45, RECH: 2, TPX: 20, TPY: 9,
  BOUNCE: [3.3, 4.6, 6.0, 99], LOSE: 0.3, WARN: 3.2, X: 9.65, MISS: 1.6, BACK: 1.1, SUPER: 2.0, MAXH: 9.0, CREEP: 1.2, GLY: 6.5 };
// THE PHONE'S JOLTS (Nov 3, Chikin: "he is on James phone, so the phone is glitching too, so the phone can give out little electric
// glitches that move sheilas text, so the boxes and platforms can fall" · "it is part of the story"). On a sung word (def.phone.jolts,
// on the real grid) the phone's frame builds a spark (warn: a beat or more early), it jumps to one of SHEILA's bubbles (picked at the
// warning, then frozen), the bubble shakes loose (SHAKE) and FALLS: a drop (straight down, a hole where a step was) or a throw (flung
// at where he stood at the warning; at least MINWARN s from the warning to where it can touch him). Its slot stays a gap (the climb
// keeps its shape). A falling bubble is a platform from above (ride it down) — and hits him if it meets him: knocked off his bubble
// (never the run), unless he's glitching (it passes through him, like the BLOCKED banner). Safe times: a flinch. Story run
// (def.storyRun / ?story): every jolt shows, none touches the game.
// (POP / DROP_POP: launch pop up · G: their gravity · VXMAX: a throw's sideways speed · LIFE: the longest a fall lasts · KNOCK_VY: his
// knock down · ABOVE: the 'above' pick (its bottom this far above his feet … its top at most this) · AGE: she sent it at least this long
// ago (a row pick: ROWAGE — just landed is enough: those are the lines written to be fried as she sends them) · HOLE: beats the empty slot's outline fades over ·
// KNOCKSAFE: s after a knock that the bar's kicks don't build their streak (fix, Nov 3: a knock onto the bar mid-streak used to add the
// kicks that flung him into the old history — a knock costs his bubble, maybe a text, NEVER the run) · MEND: s the story run's rebuild of
// a knocked-out slot takes when he lands on it (fix, Nov 3: no invisible floor — his glitch holds her bubble up under him, on screen))
// (MINWARN also covers drops now: lead beats · P + SHAKE must reach it, checked in prep — a drop gets 1.5 beats, a throw lobs higher)
export const J = { POP: 2.6, DROP_POP: 1.5, G: 18, VXMAX: 12, SHAKE: 0.15, LIFE: 2.6, MINWARN: 1.0, KNOCK_VY: -5, ABOVE: [0.5, 7], AGE: 0.8, ROWAGE: 0.08, HOLE: 2,
  KNOCKSAFE: 2.5, MEND: 0.25 };
const STORYQ = typeof location !== 'undefined' && /[?&]story(=|&|$)/.test(location.search || '');
export const storyOn = C => !!C.def.storyRun || STORYQ;   // (the story run: the jolts show in full, but never touch the game)
// text widths without a canvas (the sim and the bot need them): Helvetica-ish advance widths in em
const cw = c => /[il.,:;'’!|]/.test(c) ? 0.25 : /[jft()\[\]"“”\-]/.test(c) ? 0.31 : c === ' ' ? 0.27 : c === 'r' ? 0.35 : /[mwMW]/.test(c) ? 0.84 : /[A-Z]/.test(c) ? 0.68
  : /[0-9?]/.test(c) ? 0.56 : /[a-z]/.test(c) ? 0.53 : c === '—' || c === '…' ? 0.9 : c.codePointAt(0) > 0x2000 ? 1.18 : 0.56;
export const textW = (s, fs = S.FS) => [...String(s)].reduce((a, c) => a + cw(c), 0) * fs;
export function wrap(text, maxw, fs = S.FS) {
  const words = String(text).split(/\s+/).filter(Boolean), lines = []; let cur = '';
  for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (!cur || textW(nx, fs) <= maxw) cur = nx; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur); return lines.length ? lines : [''];
}
function bubble(text, minW = 0) {   // a text bubble's size (as wide as its words, wrapping at the max width — a real thread); minW: his ledge
  const maxw = Math.max(S.MAXW, minW), lines = wrap(text, maxw - 2 * S.PADX), nat = Math.max(...lines.map(l => textW(l))) + 2 * S.PADX;
  return { lines, w: Math.min(maxw, Math.max(nat, 1.3, minW)), h: lines.length * S.LH + 2 * S.PADY };
}
const sysLine = text => ({ lines: [text], w: S.TW, h: S.SYSH });  // the phone's own grey line ("You added Carol…")
// THE BEAT GRID: map.json's grid for this song drifts off the real song by up to ~150 ms by the bridge; the song's own snares and hats
// sit on 0.61227 s / 0.275 (measured off the mp3). The level gives the real one (def.phone.grid).
export const GRID = C => { const g = (C.def.phone && C.def.phone.grid) || {}; const P = g.P ?? C.P, OFF = g.OFF ?? C.OFF; return { P, OFF, beatOf: t => (t - OFF) / P, tOfBeat: b => OFF + b * P }; };
export const beatOff = (R, t) => { const b = R.beatOf(t); return Math.abs(b - Math.round(b)) * R.P; };   // how far t is from the nearest beat (s)
// is a row in the thread at all for this run? `re` (hand-tagged in THREAD): the moments it's a reaction to — it only happens if
// every one of them went Potato's way · `reRow`: one photo it's about (it only happens if that photo went out with him in it)
const reOK = (s, q) => (!q.re || q.re.every(i => s.out[i] == null || s.out[i] === 'P')) && (q.reRow == null || (s.rowP && s.rowP[q.reRow] != null) || q.reRowT > s.t);
// ---------- the conversation, prepared once ----------
const PREP = new WeakMap();
export function prep(C) {
  if (PREP.has(C)) return PREP.get(C);
  const D = C.def.phone, R = GRID(C), P = R.P, O = openOf(D), alt = D.alt || {}, items = [], events = [];
  // ON THE SONG'S REAL BEAT: THREAD's times were set on map.json's grid (0.61372 s), which drifts ~0.3 s off the song by the end, so
  // every row lands on the real grid's nearest half beat (hb; a sung word moves ≤ 0.15 s); two that land together keep a quarter apart
  const hb = t => R.tOfBeat(Math.round(R.beatOf(t) * 2) / 2), upHB = t => R.tOfBeat(Math.ceil(R.beatOf(t) * 2 - 1e-6) / 2), upQ = t => R.tOfBeat(Math.ceil(R.beatOf(t) * 4 - 1e-6) / 4), Q = P / 4;
  const TH = D.thread.map(r => ({ ...r, t0: r.t, t: hb(r.t), ...(r.from != null ? { from: hb(r.from) } : {}) })).sort((a, b) => a.t - b.t || a.t0 - b.t0);
  for (let k = 1; k < TH.length; k++) if (TH[k].t < TH[k - 1].t + 0.1) TH[k].t = TH[k - 1].t + Q;
  // James's single texts that Potato can glitch come in EARLY: on the quarter beat just after the row before them (up to `lead` s
  // before their time), so the receipt has time to run (Sent → Delivered → Read) before Sheila answers
  for (let k = 1; k < TH.length; k++) { const r = TH[k]; if (r.w !== 'J' || !r.tg || r.ph || r.bu || r.tb) continue; r.t = Math.min(r.t, Math.max(upQ(TH[k - 1].t + 0.1), upQ(r.t - (D.lead ?? 1.3)))); }
  // ... and nothing lands straight after one of his moments for at least MINW s (her answer waits for the next half beat after that —
  // never more than two half beats late; the rows after it shuffle down with it, a quarter beat apart)
  { const MINW = D.minWin ?? 0.95, bs = bursts(TH);
    for (let k = 0; k < TH.length; k++) { const r = TH[k]; if (r.w !== 'J' || !r.tg) continue; const b = (r.ph || r.bu) && bs.find(b => b.rows.includes(r)); if (b && b.rows[0] !== r) continue;
      const rows = b ? b.rows : [r], her = r.tb ? [...TH.slice(0, k)].reverse().find(q => q.w === 'S' && q.x === r.on) : null, A = her ? her.t : rows[0].t;
      let j = TH.indexOf(rows[rows.length - 1]) + 1; if (j >= TH.length) continue; const need = upHB(Math.min(A + MINW, Math.max(TH[j].t + 0.6, A + 0.9)));   // (A + 0.9: when his text was itself pushed down by an earlier wait)
      for (let m = j; m < TH.length; m++) { const want = m === j ? need : TH[m - 1].t + Q; if (TH[m].t >= want - 1e-6) break; TH[m].t = want; } } }
  // the events (Potato's moments), in thread order: a text · a burst (photos, or a double/triple text) · a tapback
  const rowEv = new Map(); { const bs = bursts(TH), seen = new Set();
    for (const r of TH) { if (r.w !== 'J' || !r.tg) continue;
      const b = (r.ph || r.bu) && bs.find(b => b.rows.includes(r)); if (b) { if (seen.has(b)) { rowEv.set(r, b.e); continue; } seen.add(b); }
      const e = { i: events.length, kind: r.tb ? 'tap' : b ? (r.ph ? 'photos' : 'msgs') : 'text', rows: b ? b.rows : [r], T: r.t, T0: r.t0, end: b ? b.last : r.t, row: r };
      if (b) b.e = e; events.push(e); rowEv.set(r, e); } }
  // the thread: every row is an item; a row in the run straight after one of Potato's moments only happens if his version went out
  // (dep); when James's own went out instead she answers that (her `alt` line, at her first answer's time)
  const depOf = new Map(), altItems = [];
  const evOf = T => { const e = events.find(e => Math.abs(e.T0 - T) < 0.02); if (!e) throw new Error('ghost: re ' + T + ' is none of Potato\'s moments'); return e.i; };
  events.forEach((e, k) => { const nx = events[k + 1], until = nx ? nx.T - 0.05 : (D.depEnd ?? 108.0);
    const dep = TH.filter(r => r.t > e.end + 1e-3 && r.t < until && !(r.w === 'J' && r.tg) && r.re == null);
    for (const r of dep) depOf.set(r, e.i);
    const a = alt[e.T0.toFixed(2)]; if (a) { const first = dep.find(r => r.w === 'S') || TH.find(r => r.w === 'S' && r.re && r.re.includes(e.T0) && r.t > e.end && r.t < e.end + 1.6); altItems.push({ t: first ? first.t : Math.max(e.end, e.T0) + P, x: a, ev: e.i }); } });
  for (const e of events) if (e.row.re) e.re = e.row.re.map(evOf);   // (one of his own moments can be a reaction too: it's void if what it answers never happened)
  const reOf = r => r.re ? { re: r.re.map(evOf) } : {}, rowOfT = T => TH.find(q => Math.abs(q.t0 - T) < 0.005);
  const reRowOf = r => r.reRow != null ? { reRow: rowOfT(r.reRow).t.toFixed(3), reRowT: rowOfT(r.reRow).t } : {};
  const firstT = Math.min(O.wake, ...TH.map(r => r.t));
  items.push({ who: 'X', a: Math.min(O.wake + 0.05, firstT - 0.01), text: 'Thursday 9:41 PM', ...sysLine('Thursday 9:41 PM'), stamp: true });   // (a new thread starts with the phone's own time stamp — Chikin: "it should be thursday")
  let lastS = null;
  const sRows = [...TH.map(r => ({ r })), ...altItems.map(a => ({ r: { t: a.t, w: 'S', x: a.x }, altOf: a.ev }))].sort((a, b) => a.r.t - b.r.t);
  for (const { r, altOf } of sRows) {
    const base = { dep: depOf.get(r), altOf, ...reOf(r), ...reRowOf(r) };
    if (r.w === 'S') { const b = bubble(r.x), it = { ...base, who: 'S', a: r.t, text: r.x, ...b, dotsT: r.t < O.wake ? r.t - 0.5 : Math.max(r.t - 1.0, lastS && lastS.altOf === altOf ? lastS.a + S.ANIM : -9, O.wake + 0.48) };
      const tap = events.filter(e => e.kind === 'tap' && e.T < r.t).pop(); if (tap && r.t - tap.T < 1.2) it.dotsT = Math.max(it.dotsT, tap.T + 0.1);   // (she can't start answering a reaction she hasn't seen)
      items.push(it); if (altOf == null) lastS = it; continue; }
    if (r.w === 'C') { items.push({ ...base, who: 'C', a: r.t, e0: r.from, name: r.name || '', w: S.DOTW, h: S.DOTH }); continue; }
    if (r.w === 'X') { items.push({ ...base, who: 'X', a: r.t, text: r.x, ...sysLine(r.x) }); continue; }
    if (r.tb) { const her = [...items].reverse().find(q => q.who === 'S' && q.text === r.on); const e = rowEv.get(r); her.tapped = true; her.tap = e.i; e.her = her; e.emoji = r.tb; continue; }
    const e = rowEv.get(r), ev = e ? e.i : undefined;
    if (r.ph) items.push({ ...base, who: 'J', a: r.t, photo: r.ph, ph2: r.ph2 || null, w: S.PHW, h: S.PHH, ev, row: r });
    if (r.x) { const nice = bubble(r.x), gl = r.sys ? sysLine(r.sys) : r.g ? bubble(r.g, (r.full ? S.BRIDGE : S.LEDGE) * S.TW) : null;
      items.push({ ...base, who: 'J', a: r.t + (r.ph ? 0.002 : 0), text: r.x, glit: r.g || null, sys: r.sys || null, grp: r.grp || null, ...nice, nice, gl, ev, row: r }); }
  }
  items.sort((a, b) => a.a - b.a);
  // a burst of photos sits in ONE row, side by side (like photos sent together): the first takes the slot, the rest join it, leftward
  { let lead = null, k = 0; for (const q of items) { if (!q.photo) { if (q.who !== 'J' || !q.text || q.a - (lead ? lead.a : -9) > 1.0) lead = null; continue; }
      const e = q.ev != null ? events[q.ev] : null; if (lead && e && lead.ev === q.ev) { q.join = lead.id0; q.k = ++k; } else { lead = q; k = 0; q.id0 = Symbol(); } } }
  const kind = q => q.who === 'J' && q.sys ? 'X' : q.who, grpT = (TH.find(r => r.grp) || {}).t;   // (once it's a group, her bubbles carry her name, like a real group thread)
  items.forEach((q, i) => { q.id = i; const pv = i ? items[i - 1] : null; q.gap = !pv ? 0 : kind(pv) === kind(q) && q.who !== 'X' ? S.GAP1 : S.GAP2; if (q.tapped) q.gap += S.TBG;
    if (q.who === 'S' && grpT != null && q.a > grpT + 0.2 && pv && kind(pv) !== 'S') { q.named = 'Sheila'; q.gap += S.NM; }
    q.e = q.who === 'S' ? q.dotsT : q.who === 'C' ? q.e0 : q.a; });
  for (const q of items) if (q.join) q.join = items.find(o => o.id0 === q.join).id;
  // each event: when it's in (A), when she READS it (R: just before the next thing lands — her answer), and which items carry it
  for (const e of events) {
    e.items = items.filter(q => q.ev === e.i); if (e.kind === 'tap') e.items = [e.her];
    e.A = e.kind === 'tap' ? e.her.a : Math.min(...e.items.map(q => q.a));
    const last = e.kind === 'tap' ? e.T : Math.max(...e.items.map(q => q.a)), nx = items.find(q => q.a > last + 1e-3 && !e.items.includes(q) && q.who !== 'C');
    e.R = Math.min(nx ? nx.a - 0.06 : last + 6 * P, last + 6 * P);
  }
  for (const e of events) e.teach = e.kind !== 'tap' && e.A < (D.grace ?? 0);   // (the teaching verse: the first few get the sticker)
  // James types each of his texts into the bar first (from just after his last one to its send)
  let pj = -9; for (const q of items) if (q.who === 'J' && q.text) { q.ts = Math.max(pj + 0.07, q.a - Math.min(1.4, 0.05 * [...q.text].length + 0.3)); pj = q.a; }
  const photoOf = new Map(items.filter(q => q.photo).map(q => [q.row, q]));
  // the BLOCKED banner: on the real grid too, and only when her "or i'm blocking you" is in the thread (it follows "what potato?")
  const block = D.block ? { ...D.block, slam: hb(D.block.slam), wallT: hb(D.block.wallT) } : null, blockRow = items.find(q => q.who === 'S' && q.text === (D.blockText || 'or i\'m blocking you')) || null;
  // the phone's jolts, on the real grid (the hit on the sung word; the warning `lead` beats before it) — never in the BLOCKED banner,
  // never after the lock, never before the thread's up
  const jolts = (D.jolts || []).map((j, i) => ({ ...j, i, hit: hb(j.t), warn: hb(j.t) - (j.lead ?? 1) * P }));
  for (const j of jolts) { if (block && j.hit > block.slam - 0.6 && j.hit < block.wallT + 0.6) throw new Error('ghost: jolt ' + j.t + ' is inside the BLOCKED banner');
    if (D.end && D.end.lock != null && j.hit >= D.end.lock) throw new Error('ghost: jolt ' + j.t + ' is after the lock');
    if (j.warn < O.ctl || j.warn < (D.grace ?? 0) - 8) throw new Error('ghost: jolt ' + j.t + ' warns too early');
    if (j.kind !== 'throw' && j.hit - j.warn + J.SHAKE < J.MINWARN - 1e-6) throw new Error('ghost: drop ' + j.t + ' warns under ' + J.MINWARN + ' s (give it lead 1.5)'); }
  const out = { D, O, R, TH, items, events, rowEv, photoOf, block, blockRow, hb, jolts }; PREP.set(C, out); return out;
}
// is this row of James's Potato's (did his version go out)? — and is an item in the thread at all (the branch it belongs to)?
export const isP = (s, q) => q.row != null && s.rowP && s.rowP[q.row.t.toFixed(3)] != null;
const gone = (s, i) => !!s.out && (s.out[i] === 'J' || s.out[i] === 'V');   // (an event that went James's way, or never happened)
export const visible = (s, q) => (q.dep == null || !gone(s, q.dep)) && (q.altOf == null || (s.out && s.out[q.altOf] === 'J')) && (!s.out || reOK(s, q));
// a text's shape right now: his version morphs in over MORPH s once it's his (a wider ledge; a grey line for "You added…")
function dims(q, t, s) {
  if (q.gl && s && isP(s, q)) { const k = ease((t - s.rowP[q.row.t.toFixed(3)]) / S.MORPH); return { w: q.nice.w + (q.gl.w - q.nice.w) * k, h: q.nice.h + (q.gl.h - q.nice.h) * k, k, mine: true }; }
  return { w: q.w, h: q.h, k: 0, mine: false };
}
// how much of the stack an item takes at time t (it slides in from under the bar; hers start as typing dots; Carol's come and go)
function slotOf(q, t, h) {
  if (t < q.e) return [0, 0];
  if (q.who === 'S') { if (t < q.a) { const f = S.DOTH + q.gap; return [f * ease((t - q.e) / S.ANIM), f]; } const f = S.DOTH + q.gap + (h - S.DOTH) * ease((t - q.a) / S.ANIM); return [f, f]; }
  if (q.who === 'C') { const f = (S.DOTH + q.gap) * (1 - ease((t - q.a) / S.ANIM)); return [Math.min(f, (S.DOTH + q.gap) * ease((t - q.e) / S.ANIM)), f]; }
  const f = h + q.gap; return [f * ease((t - q.a) / S.ANIM), f];
}
// the visible stack at time t: [{ q, x0, x1, y0 (bottom), y1 (top), dots, mine, k }] — newest first
export function stack(C, t, s) {
  const { items } = prep(C); let hi = -1;
  for (let lo = 0, up = items.length - 1; lo <= up;) { const m = (lo + up) >> 1; if (items[m].a <= t) { hi = m; lo = m + 1; } else up = m - 1; }
  let top = hi; for (let j = hi + 1; j < items.length && items[j].a < t + 2.5; j++) if (items[j].e <= t) top = j;
  const out = [], joins = []; let acc = 0;
  for (let j = top; j >= 0; j--) { const q = items[j]; if (s && !visible(s, q)) continue;
    if (q.join != null) { if (t >= q.a) joins.push(q); continue; }
    const d = dims(q, t, s), [c, full] = slotOf(q, t, d.h); if (c <= 0) continue;
    const y0 = S.TH0 + acc - (full - c); acc += c; if (y0 > S.HB + 2.5) break;
    const dots = (q.who === 'S' && t < q.a) || q.who === 'C', kk = q.who === 'S' && !dots ? ease((t - q.a) / S.ANIM) : 1;
    const hh = dots ? S.DOTH * (q.who === 'C' ? clamp(1 - (t - q.a) / S.ANIM) : 1) : q.who === 'S' ? S.DOTH + (d.h - S.DOTH) * kk : d.h, ww = dots ? S.DOTW : q.who === 'S' ? S.DOTW + (d.w - S.DOTW) * kk : d.w;
    const sysOn = !!q.sys && d.mine, grey = q.who === 'X' || sysOn;
    const x0 = q.who === 'S' ? S.CX0 : q.who === 'C' ? S.CX0 + 0.5 : grey ? -ww / 2 : S.CX1 - ww;
    out.push({ q, x0, x1: x0 + ww, y0, y1: y0 + hh, hh, ww, dots, mine: d.mine, k: d.k, sysOn, grey, pop: full > 0 ? c / full : 1 }); }
  for (const q of joins) { const L = out.find(r => r.q.id === q.join); if (!L) continue;
    const x1 = L.x0 - S.PHG - (q.k - 1) * (S.PHW + S.PHG); out.push({ q, x0: x1 - S.PHW, x1, y0: L.y0, y1: L.y1, hh: L.hh, ww: S.PHW, dots: false, mine: false, k: 0, grey: false, pop: clamp((t - q.a) / S.ANIM) }); }
  // her bubbles the phone knocked loose: they shake (shake 0..1), then their slot is a hole (the stack keeps its height; in the story
  // run the hole stays solid — an invisible floor under its fading outline)
  if (s && s.knock) for (const r of out) { const kt = s.knock[r.q.id]; if (kt == null || t < kt) continue;
    r.knockT = kt; r.shake = t < kt + J.SHAKE ? (t - kt) / J.SHAKE : 0; r.hole = t >= kt + J.SHAKE; r.solid = storyOn(C); }
  return out;
}
// the platforms: every bubble, photo and typing-dots bubble (not the grey lines, not a knocked-out hole), above the bar
export const platsOf = st => st.filter(r => !r.grey && r.y1 > S.BAR + 0.05 && !(r.hole && !r.solid)).map(r => ({ id: r.q.id, x0: r.x0, x1: r.x1, y: r.y1, r }));
// ---------- the phone's jolts (pure: the sim, the view and the bot all read these) ----------
// which of her bubbles a jolt picks at its warning (st: the stack then) -> the row, or null (then the jolt doesn't happen)
export function joltPick(P, s, st, t, j) {
  const top = histTop(s, t), taken = new Set(Object.values(s.jolt || {}).map(o => o.id).filter(v => v != null)), row = j.pick && j.pick.startsWith('row:') ? j.pick.slice(4) : null;
  const mine = s.ground && typeof s.onId === 'number' ? s.onId : null;   // (never the bubble he's standing on: the phone knocks her texts AT him, not his floor out from under him)
  const ok = (r, age) => r.q.who === 'S' && !r.dots && !r.grey && !r.q.photo && r.q.text && !r.q.tapped && !r.hole && !taken.has(r.q.id) && r.q.id !== mine && t - r.q.a >= age
    && r.y1 < top - 0.3 && r.y0 > S.BAR + 0.1 && !glitchEv(P, s, r.q, t);
  if (row) { const r = st.find(r => r.q.text === row && ok(r, J.ROWAGE)); if (r) return r; }
  let cand = st.filter(r => ok(r, J.AGE)), best = null, bc = 1e9; if (!cand.length) cand = st.filter(r => ok(r, J.ROWAGE));   // (nothing she sent a while ago: one she's only just sent)
  for (const r of cand) { const d = r.y0 - s.ly; if (d < J.ABOVE[0] || r.y1 - s.ly > J.ABOVE[1]) continue; if (d < bc) { bc = d; best = r; } }
  if (best) return best;
  for (const r of cand) { const dx = s.lx < r.x0 ? r.x0 - s.lx : s.lx > r.x1 ? s.lx - r.x1 : 0, d = Math.hypot(dx, (r.y0 + r.y1) / 2 - (s.ly + 0.75)); if (d < bc) { bc = d; best = r; } }
  return best;
}
// its flight, frozen as it comes loose (t0): box = its slot then, aim = his middle at the warning (a throw), warn = when it warned.
// A throw arcs at the aim (a pop up, then its gravity), lobbing higher if it would reach him under MINWARN s after the warning or
// would have to fly faster than VXMAX across (so it always comes down on the mark); aimed above itself it just drops. It ends when its top passes the bar, it leaves the column, or after LIFE.
export function joltLaunch(j, box, aim, t0, warn) {
  const w = box.x1 - box.x0, h = box.y1 - box.y0, cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
  let vx = 0, vy = J.DROP_POP, kind = 'drop';
  if (j.kind === 'throw' && aim && aim[1] - cy < J.POP * J.POP / (2 * J.G) - 0.05) {
    let tau = (J.POP + Math.sqrt(J.POP * J.POP - 2 * J.G * (aim[1] - cy))) / J.G; vy = J.POP;
    const need = Math.max(J.MINWARN - (t0 - warn), Math.abs(aim[0] - cx) / J.VXMAX); if (tau < need) { tau = need; vy = (aim[1] - cy + J.G / 2 * tau * tau) / tau; }   // (a long way across: a higher lob, so it still lands on the mark)
    // (fix, Nov 3: MINWARN counts to the first touch of his body where he stood, not to his middle — lob higher till it does)
    const touch = (tt, v) => { const ux = (aim[0] - cx) / tt; for (let d = 0; d < tt + 0.05; d += 1 / 120) { const x = cx + ux * d, y = cy + v * d - J.G / 2 * d * d, ly = aim[1] - 0.75;
      if (!(aim[0] + 0.6 < x - w / 2 || aim[0] - 0.6 > x + w / 2 || ly + 1.5 < y - h / 2 || ly >= y + h / 2 - 0.08)) return d; } return 1e9; };
    for (let n = 0; n < 12 && touch(tau, vy) + (t0 - warn) < J.MINWARN; n++) { tau += 0.05; vy = (aim[1] - cy + J.G / 2 * tau * tau) / tau; }
    vx = (aim[0] - cx) / tau; kind = 'throw'; }
  const yEnd = S.BAR + 0.2 - h / 2, tb = (vy + Math.sqrt(vy * vy + 2 * J.G * Math.max(0, cy - yEnd))) / J.G, tx = vx ? (Math.sign(vx) * (F.X + w / 2) - cx) / vx : 1e9;
  return { j: j.i, t0, w, h, cx, cy, vx, vy, kind, aim, dir: vx ? Math.sign(vx) : j.i % 2 ? 1 : -1, end: t0 + Math.min(J.LIFE, tb, tx) };
}
// where it is at t: { x0, x1, y0, y1, cx, cy, vy, rot } — null before it's loose or once it's gone
export function joltBox(L, t) {
  if (!L || t < L.t0 || t >= L.end) return null; const d = t - L.t0, cx = L.cx + L.vx * d, cy = L.cy + L.vy * d - J.G / 2 * d * d;
  return { x0: cx - L.w / 2, x1: cx + L.w / 2, y0: cy - L.h / 2, y1: cy + L.h / 2, cx, cy, vy: L.vy - J.G * d, rot: -L.dir * 0.17 * clamp(d / 0.9) };
}
// the falling bubbles as platforms (one-way from above, like every bubble: ride it down) — none in the story run
export function joltPlats(P, s, t, C) {
  if (!s.jolt || storyOn(C)) return []; const out = [];
  for (const j of P.jolts) { const o = s.jolt[j.i]; if (!o || o.st !== 'fly') continue; const b = joltBox(o.L, t); if (!b || b.y1 <= S.BAR + 0.05) continue;
    out.push({ id: 'j' + j.i, x0: b.x0, x1: b.x1, y: b.y1, r: { q: P.items[o.id], x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, ww: o.L.w, hh: o.L.h, fly: true } }); }
  return out;
}
// the jolts' clock: warn (pick + freeze) → hit (the bubble's knocked) → loose (it flies) → gone
function joltStep(C, P, s, t, log) {
  for (const j of P.jolts) { const o = s.jolt[j.i] || (s.jolt[j.i] = { st: 'wait' });
    if (o.st === 'wait' && t >= j.warn) { o.st = 'none'; const r = joltPick(P, s, stack(C, t, s), t, j);
      if (r) { Object.assign(o, { st: 'warn', id: r.q.id, aim: [s.lx, s.ly + 0.75], warnT: t }); log('jwarn', { j: j.i, id: r.q.id }); } }
    if (o.st === 'warn' && t >= j.hit) { o.st = 'hit'; o.hitT = t; s.knock[o.id] = t; log('jolt', { j: j.i, on: s.ground ? s.onId : null }); }
    if (o.st === 'hit' && t >= o.hitT + J.SHAKE) { const r = stack(C, t, s).find(r => r.q.id === o.id);
      if (!r) o.st = 'gone'; else { o.L = joltLaunch(j, r, o.aim, t, o.warnT); o.st = 'fly'; } }
    if (o.st === 'fly' && t >= o.L.end) { o.st = 'gone'; log('jgone', { j: j.i }); } }
}
// fair.mjs's look at the jolts (def.fair.jolts; fix pass, Nov 3): from the demo's run (base) — every jolt that fired: the warning
// before the hit (a drop: lead + SHAKE) and, standing still where he was at the warning, how long till it could first touch him; either
// under J.MINWARN is a 'jolt' flag. A knock the run didn't survive (a fail within KNOCKSAFE + 2 s) is a 'knock' flag. And the same
// presses that win with the jolts off must not lose with them on (the jolts never decide the run) — a 'decides' flag.
export function fairJolts(C, base, replay) {
  const P = prep(C), out = [], s = base;
  for (const j of P.jolts) { const o = s.jolt && s.jolt[j.i]; if (!o || o.id == null) continue; const L = o.L, q = P.items[o.id], what = `J${j.i + 1} "${j.word}" on “${q.text}”`;
    const lead = L && L.kind === 'throw' ? null : j.hit - o.warnT + J.SHAKE;   // (a throw's warning is its reach: it lobs till that's MINWARN)
    let reach = null; if (L) for (let d = 0; d < 3 && reach == null; d += 1 / 120) { const b = joltBox(L, L.t0 + d); if (!b) break; const ax = o.aim[0], ay = o.aim[1] - 0.75; if (!(ax + 0.6 < b.x0 || ax - 0.6 > b.x1 || ay + 1.5 < b.y0 || ay >= b.y1 - 0.08)) reach = L.t0 + d - o.warnT; }
    if (lead != null && lead < J.MINWARN - 1e-3) out.push({ t: j.hit, kind: 'jolt', v: +lead.toFixed(2), what: what + ' (warning)' });
    if (reach != null && reach < J.MINWARN - 1e-3) out.push({ t: j.hit, kind: 'jolt', v: +reach.toFixed(2), what: what + ' (reach)' }); }
  for (const k of s.jlog.filter(e => e.k === 'knock')) { const f = s.jlog.find(e => e.k === 'fail' && e.t >= k.t && e.t < k.t + J.KNOCKSAFE + 2); if (f) out.push({ t: k.t, kind: 'knock', v: +(f.t - k.t).toFixed(2), what: `J${k.j + 1} knock → lost` }); }
  if (replay) { const keep = P.jolts; P.jolts = []; let off; try { off = replay(); } finally { P.jolts = keep; }
    if (off.won && !s.won) out.push({ t: s.t, kind: 'decides', v: 0, what: `jolts on: ${s.won ? 'won' : 'lost'} · off: ${off.won ? 'won' : 'lost'}` }); }
  return out;
}
// can he glitch this bubble right now? -> its event (James's texts and photos until she reads them · her bubble while its tapback is up)
export function glitchEv(P, s, q, t) {
  const i = q.ev != null ? q.ev : q.tap; if (i == null) return null; const e = P.events[i];
  if (!e || s.out[e.i] != null || t < e.A || t >= e.R) return null;
  if (q.ev != null && t < q.a) return null;
  return e;
}
// the BLOCKED banner: its middle (local y) while it drops down the thread, else null. P: prep(C) (its block is on the real grid);
// with s, only when her block line is in this run's thread (it isn't if "what potato?" went out as James typed it)
export function wallY(P, t, s) { const B = P.block; if (!B || t < B.slam || t > B.wallT + 0.25) return null; if (s && P.blockRow && !visible(s, P.blockRow)) return null;
  return S.HB - (S.HB - S.BAR) * ((t - B.slam) / (B.wallT - B.slam)); }
// the old history: how far it has come down the screen (local units) — each text she READS before he glitches it brings it down a
// step, each one he rewrites pushes it back up, and later in the song it leans in a little by itself. Its edge is the top he's lost at.
export const histTop = (s, t) => S.HB - (s.histK || 0) - histBase(t);
export const histBase = t => F.CREEP * clamp((t - 44) / 64);
// where a glitch would take him (the nearest bubble below — or ahead, the way he's holding)
export function pickTarget(P, s, plats, t, dir, down) {
  let best = null, bc = 1e9; const lx = s.lx, ly = s.ly;
  const top = histTop(s, t);
  for (const p of plats) { if (s.ground && p.id === s.onId) continue; if (p.y > ly + 0.35 || ly - p.y > F.TPY || p.y < S.BAR + 0.4 || p.y > top - 0.8) continue;
    const dx = lx < p.x0 ? p.x0 - lx : lx > p.x1 ? lx - p.x1 : 0, cx = (p.x0 + p.x1) / 2; if (dx > F.TPX) continue;
    // (he glitches TO the texts he can still change — Chikin: "he can glitch to them": with nothing held, one in reach (F.GLY below
    // him) beats any plain bubble; held ← / → / ↓ picks the way, a glitchable one still first among those)
    const gl = glitchEv(P, s, p.r.q, t) ? 1 : 0; let c;
    if (dir) { if ((cx - lx) * dir < 0.6 && !(dx > 0 && (dir > 0 ? p.x0 > lx : p.x1 < lx))) continue; c = Math.abs(ly - p.y) + 0.12 * dx - 3 * gl; }
    else if (down) { if (p.x1 < lx - 1.2 || p.x0 > lx + 1.2 || p.y > ly - 0.2) continue; c = ly - p.y - 3 * gl; }
    else { if (p.y > ly - 0.2) continue; c = (ly - p.y) + 0.3 * dx - (gl && ly - p.y <= F.GLY ? 12 : 0); }
    if (c < bc) { bc = c; best = p; } }
  return best;
}
const keyOf = r => r.t.toFixed(3);

// ---------- the rules ----------
export const mode = {
  init(s, api) {
    const C = api.C, P = prep(C), t = s.t, O = P.O;
    Object.assign(s, { out: {}, hits: {}, rowP: {}, jlog: [], score: 0, glitched: 0, lowT: 0, lx: 0, ly: 0, vx: 0, vy: 0, vyIn: 0, onId: null, ground: false, charge: true, useT: -9,
      phaseUntil: -9, hist: 0, histK: 0, readAt: null, dropId: null, dropUntil: -9, bounceN: 0, coyT: -9, pt: {}, prevLy: 0, failT: null, gone: t < O.appear, appeared: t >= O.appear, bootT: t > 1 ? t : null,
      facing: 0.3, walking: false, phase: 0, landAt: -9, tpAt: -9, bumpT: -9, rewT: -9, camX: 0, jolt: {}, knock: {} });
    for (const j of P.jolts) if (j.warn < t) s.jolt[j.i] = { st: 'past' };   // (a retry: the jolts before its line don't happen)
    // a retry / flag start: what came before went right (his)
    for (const e of P.events) if (e.R < t - 0.05) { s.out[e.i] = 'P'; s.hits[e.i] = e.A + 0.2; for (const r of e.rows) s.rowP[keyOf(r)] = e.A + 0.2; }
    if (t >= O.ctl) { const pl = platsOf(stack(C, t, s)); let low = null; for (const p of pl) if (!low || p.y < low.y) low = p;
      if (low) { s.lx = (low.x0 + low.x1) / 2; s.ly = low.y; s.onId = low.id; s.ground = true; } else { s.lx = 0; s.ly = S.BAR + 2; }
      for (const p of pl) s.pt[p.id] = p.y; s.prevLy = s.ly; s.facing = 0.6; }
    place(s, t);
  },
  step(s, inp, t, api) {
    const C = api.C, P = prep(C), D = P.D, O = P.O, end = D.end || {}, R = P.R;
    const die = why => { if (C.def.blank) { api.die(why); return; } if (!s.dead) api.die(why); if (!s.dead) { s.dead = true; s.why = why; } };   // (?blank: nothing ends the song — run/blank.mjs)
    const log = (k, extra) => s.jlog.push({ t, k, ...extra });
    // ---- the opening: the phone on the table — he arrives on its lock screen (his glitch), looks about; no control till the thread's up ----
    if (t < O.ctl) {
      if (!s.appeared && t >= O.appear) { s.appeared = true; s.glitchAt = t; s.blink = 0.22; s.blinkFrom = { x: s.x, y: s.y }; s.react = { name: 'skeptical', dur: 1.4, at: t }; }
      const [hx, hy] = lockHim(O, t), wx = (OX + K * hx - SC[0]) / Z, wy = (OY + K * hy - SC[1]) / Z; s.gone = !s.appeared || (s.bootT != null && t < s.bootT + BOOT.logo);
      if (t < O.wake) { s.lx = wx; s.ly = wy; s.facing = s.appeared ? 0.3 + 0.75 * Math.sin((t - O.appear) * 1.6) : 0.3; }
      else { const pl = platsOf(stack(C, t, s)), st = pl.find(p => p.r.q.who === 'S') || pl[0], k = ease5((t - O.wake) / Math.max(0.1, O.ctl - O.wake));   // he glides down onto her first text
        const tx = st ? (st.x0 + st.x1) / 2 : 0, ty = st ? st.y : S.TH0; s.lx = wx + (tx - wx) * k; s.ly = wy + (ty - wy) * k + Math.sin(k * Math.PI) * 1.2; s.facing = 0.5;
        if (t + 1 / 120 >= O.ctl && st) { s.onId = st.id; s.ground = true; s.ly = st.y; s.landAt = t; for (const p of pl) s.pt[p.id] = p.y; } }
      s.prevLy = s.ly; place(s, t); s.phase = s.appeared && t - O.appear < 0.25 ? 0.3 : 0; return;
    }
    if (s.bootT != null && t < s.bootT + BOOT.logo) s.gone = true;   // (the phone's booting: he's not on it yet)
    else if (s.gone && s.goneAt == null && s.failT == null) { s.gone = false; if (s.bootT != null) { s.glitchAt = t; s.blink = 0.22; s.blinkFrom = { x: s.x, y: s.y }; s.react = { name: 'smirk', dur: 0.8, at: t }; } }
    // ---- lost in the old history: he's pulled up into the header, the phone loads earlier messages, black — then it starts over ----
    if (s.failT != null) { s.walking = false; s.ly += 7 / 120; s.lx += (0 - s.lx) * 0.02; if (t >= s.failT + FAIL.pull * 0.6) s.gone = true; if (t >= s.failT + FAIL.done) return die(s.why0 || 'lost in the old history'); place(s, t); return; }
    // ---- the phone's jolts: it's glitching because he's in it (warn → pick → hit → loose → falling) ----
    if (P.jolts.length) joltStep(C, P, s, t, log);
    const plats = [...platsOf(stack(C, t, s)), ...joltPlats(P, s, t, C)], byId = new Map(plats.map(p => [p.id, p]));
    const locked = end.lock != null && t >= end.lock, safe = t < (D.grace ?? -9) || (s.bootT != null && t < s.bootT + 2.6) || locked;
    // events: a moment of his that answers one that went James's way never happens (void); a tapback on a text that never happened, too
    for (const e of P.events) { if (s.out[e.i] != null || t < e.A - 0.05 || t > e.R + 0.5) continue;
      if ((e.re && !e.re.every(j => s.out[j] == null || s.out[j] === 'P')) || (e.kind === 'tap' && !visible(s, e.her))) s.out[e.i] = 'V'; }
    // his glitch comes back by itself RECH beats after he used it
    if (!s.charge && t - s.useT >= F.RECH * R.P) { s.charge = true; log('charge'); }
    if (P.block && t >= P.block.slam && t - 1 / 120 < P.block.slam && wallY(P, t, s) != null) s.charge = true;   // (the BLOCKED banner, when she said it: he's always got one for it)
    const rewrite = (e, how) => { s.out[e.i] = 'P'; s.hits[e.i] = t; for (const r of e.rows) s.rowP[keyOf(r)] = t; s.glitched++; s.rewT = t; s.lastRew = { t, e: e.i }; s.hist = Math.max(0, s.hist - (e.rows.length > 1 ? F.SUPER : F.BACK));
      const ob = beatOff(R, t) < 0.09; if (ob) s.obAt = t; s.score += 100 + (ob ? 50 : 0) + (e.rows.length > 1 ? 100 : 0); log(e.rows.length > 1 ? 'super' : 'rewrite', { e: e.i, ob, how });
      s.react = { name: ['smirk', 'laugh', 'smirk', 'wide'][e.i % 4], dur: 0.7, at: t }; };
    // ---- moving: ← → walk, ↑ hop, ↓ drop through ----
    const hx = locked ? 0 : (inp.Rh ? 1 : 0) - (inp.Lh ? 1 : 0), acc = s.ground ? F.ACCG : F.ACCA;
    s.vx += clamp(hx * F.WALK - s.vx, -acc / 120, acc / 120);
    if (inp.J && !locked && (s.ground || t - s.coyT < F.COY)) { s.vy = Math.sqrt(2 * F.GRAV * F.HOP); s.ground = false; s.onId = null; s.jumpedAt = t; s.coyT = -9; log('hop'); }
    if (inp.D && !locked && s.ground && s.onId != null) { s.dropId = s.onId; s.dropUntil = t + F.DROP; s.ground = false; s.onId = null; s.vy = -2.5; s.coyT = -9; log('drop'); }
    // ---- SPACE: his glitch ----
    if (inp.G && !locked && !s.gone) {
      if (!s.charge) log('fizzle');
      else { const on = s.ground ? byId.get(s.onId) : null, ge = on ? glitchEv(P, s, on.r.q, t) : null;
        const pass = () => { s.useT = t; s.charge = false; s.phaseUntil = t + F.PHASE; s.glitchAt = t;
          const wy = wallY(P, t, s); if (wy != null && wy > s.ly + 0.75 && wy - (s.ly + 0.75) < 3.2) s.wallPass = true; };   // (glitching as the banner comes down: it goes through him, wherever the glitch takes him)
        if (ge) pass();
        if (ge) { rewrite(ge, 'on'); s.blink = 0.12; s.blinkFrom = { x: s.x, y: s.y }; }
        else { const tg = pickTarget(P, s, plats, t, inp.Lh ? -1 : inp.Rh ? 1 : 0, !!inp.Dh);
          if (tg) { pass(); const m = Math.min(0.45, (tg.x1 - tg.x0) / 2), from = { x: s.x, y: s.y }; s.bounceN = 0; s.lx = clamp(s.lx, tg.x0 + m, tg.x1 - m); s.ly = tg.y; s.ground = true; s.onId = tg.id; s.vy = 0; s.vx *= 0.3;
            s.blink = 0.22; s.blinkFrom = from; s.tpAt = t; s.landAt = t; const ob = beatOff(R, t) < 0.09; if (ob) { s.score += 25; s.obAt = t; } log('tp', { ob });
            const g2 = glitchEv(P, s, tg.r.q, t); if (g2) rewrite(g2, 'tp'); else s.react = { name: 'startled', dur: 0.35, at: t }; }
          else log('fizzle'); } }   // (nowhere to go: nothing happens — no phase, no pass through the banner, his glitch kept)
    }
    // ---- the step: on a bubble he rides it; in the air he falls, and lands on what's under him (one-way: from above) ----
    s.vyIn = s.vy;
    if (s.ground) { const p = byId.get(s.onId);
      if (p && s.lx >= p.x0 - F.FOOT && s.lx <= p.x1 + F.FOOT) { s.ly = p.y; s.vy = 0; }
      else { s.ground = false; s.onId = null; s.coyT = t; } }
    if (!s.ground) {
      s.vy = Math.max(-F.FALL, s.vy - F.GRAV / 120); s.ly += s.vy / 120;
      let land = null; for (const p of plats) { if (t < s.dropUntil && (s.dropId === 'all' || p.id === s.dropId)) continue; if (s.lx < p.x0 - F.FOOT || s.lx > p.x1 + F.FOOT) continue;
        const pt = s.pt[p.id] ?? p.y; if (s.prevLy - pt >= -0.03 && s.ly - p.y <= 0 && (!land || p.y > land.y)) land = p; }
      if (land) { s.ly = land.y; s.vy = 0; s.ground = true; s.onId = land.id; s.landAt = t; s.bounceN = 0; if (!s.charge) { s.charge = true; log('charge'); } log('land'); if (typeof land.id === 'string') log('jride', { j: +land.id.slice(1) }); }
      else if (s.ly <= S.BAR) {   // the input bar kicks him back up (higher each time in a row: no camping down there)
        // (no glitch back from it, and the last kick in a row throws him right up into the old history: the bar's no place to live)
        // (a knock's KNOCKSAFE s: the kicks stay the first, gentle one and don't count — the phone's jolt never feeds the fling)
        const kn = t - (s.knockAt ?? -99) < J.KNOCKSAFE, n = locked || kn ? 0 : Math.min(F.BOUNCE.length - 1, s.bounceN), last = n === F.BOUNCE.length - 1, h = last ? S.HB - S.BAR + 1 : Math.min(F.BOUNCE[n], S.HB - 1.6 - S.BAR); s.ly = S.BAR; s.vy = Math.sqrt(2 * F.GRAV * h); if (!kn) s.bounceN++; s.barAt = t; s.barN = n; if (last) s.flung = t;
        s.react = { name: 'wide', dur: 0.4, at: t }; log('bounce', { n }); } }
    s.lx = clamp(s.lx + s.vx / 120, -F.X, F.X);
    // ---- the story run: a knocked-out slot stays solid, so it's never an invisible floor — the moment he stands on it (or is about to
    // land on it) his glitch rebuilds her bubble under him, on screen (s.mend: drawing only, it changes nothing in the run) ----
    if (storyOn(C) && s.knock && !s.gone) for (const id in s.knock) { if (s.mend && s.mend[id] != null) continue; const kt = s.knock[id]; if (t < kt + J.SHAKE) continue;
      const on = s.ground && String(s.onId) === id, p = !on && !s.ground && s.vy <= 0 ? plats.find(p => String(p.id) === id) : null;
      if (on || (p && s.lx >= p.x0 - F.FOOT && s.lx <= p.x1 + F.FOOT && s.ly - p.y >= -0.05 && s.ly - p.y < 1.2)) { (s.mend || (s.mend = {}))[id] = t; log('jmend', { id: +id }); } }
    // ---- her falling bubbles: one that meets him knocks him off his bubble (never the run) — unless he's glitching: it passes
    // through him (the banner's rule). In the safe times it's a flinch; in the story run it never touches him ----
    if (P.jolts.length && !s.gone && !storyOn(C)) for (const j of P.jolts) { const o = s.jolt[j.i]; if (!o || o.st !== 'fly' || o.met != null || s.onId === 'j' + j.i) continue;
      const b = joltBox(o.L, t); if (!b || s.lx + 0.6 < b.x0 || s.lx - 0.6 > b.x1 || s.ly + 1.5 < b.y0 || s.ly >= b.y1 - 0.08) continue;
      o.met = t;
      if (t < s.phaseUntil) { o.thru = t; s.score += 50; log('jthru', { j: j.i }); }
      else if (safe) { s.react = { name: 'startled', dur: 0.35, at: t }; log('jflinch', { j: j.i }); }
      else { if (s.ground && s.onId != null) { s.dropId = s.onId; s.dropUntil = t + F.DROP; } s.ground = false; s.onId = null; s.coyT = -9; s.vy = Math.min(s.vy, J.KNOCK_VY); s.vx += o.L.vx ? Math.sign(o.L.vx) * 3 : 0;
        s.knockAt = t; s.bounceN = 0; s.react = { name: 'shock', dur: 0.6, at: t }; log('knock', { j: j.i }); } }
    // ---- the BLOCKED banner: it passes through him only while he's glitching ----
    { const w0 = wallY(P, t - 1 / 120, s), w1 = wallY(P, t, s), d0 = w0 == null ? null : w0 - (s.prevLy + 0.75), d1 = w1 == null ? null : w1 - (s.ly + 0.75);   // (the banner's side of him last step vs now — his height last step too, so a kick up through it is still a crossing)
      if (d0 != null && d1 != null && (d0 > 0) !== (d1 > 0) && !s.gone) { if (t < s.phaseUntil || s.wallPass) { s.wallThru = t; s.wallPass = false; log('thru'); s.score += 50; } else if (!(t < (D.grace ?? -9) || locked)) { s.why0 = 'blocked'; s.failT = t; s.react = { name: 'shock', dur: 1.2, at: t }; log('fail'); } } }
    // ---- her tapback badges are bumpers ----
    for (const e of P.events) { if (e.kind !== 'tap' || s.hits[e.i] == null || t - s.hits[e.i] < 0.3) continue; const r = plats.find(p => p.id === e.her.id); if (!r) continue;
      const bx = r.x1 - 0.15, by = r.y + 0.1; if (Math.hypot(s.lx - bx, s.ly + 0.75 - by) < S.BADGE + 0.6 && t - s.bumpT > 0.4) { s.bumpT = t; s.vy = 9.5; s.vx = (s.lx < bx ? -1 : 1) * 7; s.ground = false; s.onId = null; s.dropId = r.id; s.dropUntil = t + 0.2; log('bump'); s.react = { name: 'angry', dur: 0.5, at: t }; } }
    // ---- she reads it: what he didn't glitch goes out as James typed it ----
    // (from the teaching verse on, each one she reads brings the old history down a step — a miss costs room)
    for (const e of P.events) if (s.out[e.i] == null && t >= e.R) { s.out[e.i] = 'J'; const cost = !safe && !s.gone; if (cost) s.hist = Math.min(F.MAXH, s.hist + F.MISS);
      s.readAt = { t, e: e.i, cost }; log('read', { e: e.i, cost }); s.react = { name: cost ? 'shock' : 'question', dur: 0.6, at: t }; }
    s.histK += (s.hist - s.histK) * (s.hist > s.histK ? 0.06 : 0.03);   // (it slides down / back up, not a jump)
    // ---- staying low (a score hook): the lowest bubble on the screen, and him near it ----
    { let low = 1e9; for (const p of plats) low = Math.min(low, p.y); if (s.ground && s.ly <= low + 3.2) { s.lowT += 1 / 120; s.score += 10 / 120; } s.low = low; }
    // ---- the top: the old history ----
    const top = histTop(s, t);
    if (!s.gone && s.ly > top - F.LOSE) {
      if (safe) { s.ly = top - F.LOSE - 0.05; s.vy = -9; s.ground = false; s.onId = null; s.dropId = 'all'; s.dropUntil = t + 0.3; s.bonkAt = t; log('bonk'); s.react = { name: 'shock', dur: 0.5, at: t }; }
      else { s.failT = t; s.why0 = 'lost in the old history'; s.react = { name: 'scream', dur: 1.2, at: t }; log('fail'); } }
    // ---- the ending: the slider slides, he glitches, leaps at us, and he's out of the phone ----
    s.cutscene = end.see != null && t >= end.see && !s.gone ? 'see' : false;
    if (end.leap != null && t >= end.leap && !s.gone) { if (!s.leapFrom) s.leapFrom = { lx: s.lx, ly: s.ly }; const k = ease5((t - end.leap) / Math.max(0.05, (end.out ?? end.leap + 0.13) - end.leap));
      s.lx = s.leapFrom.lx * (1 - k); s.ly = s.leapFrom.ly + (-1 - s.leapFrom.ly) * k; s.ground = true; s.vx = 0; s.facing = 0; }
    if (end.out != null && t >= end.out && !s.gone) { s.gone = true; s.goneAt = t; s.goneFrom = { x: s.x, y: s.y, lx: s.lx, ly: s.ly }; }
    for (const p of plats) s.pt[p.id] = p.y; s.prevLy = s.ly;
    s.walking = s.ground && Math.abs(s.vx) > 0.6;
    if (end.leap == null || t < end.leap) s.facing = Math.abs(s.vx) > 0.4 ? Math.sign(s.vx) * 1.0 : s.facing * 0.98 + 0.3 * 0.02;
    place(s, t);
    s.phase = s.gone ? 0 : t < s.phaseUntil ? 0.6 : 0;
  },
};
function place(s, t) {   // local -> the world (the engine draws him at s.x, s.y)
  s.x = SC[0] + Z * s.lx; s.y = SC[1] + Z * s.ly; s.dx = s.x; s.ducking = false;
  s.blink = Math.max(0, (s.blink || 0) - 1 / 120);
}

// ---------- the look ----------
const FONT = (px, w = 400) => `${w} ${px}px -apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif`;
const INK = '#120a05', TOUCH = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;   // (his sticker ink · a phone: the stickers say TAP)
const BLUE = '#0a84ff', GREY = '#e9e9eb', CUE = '#ffb02e', RED = '#ff3b30', GREEN = '#4dff9a', PURP = ['#7b3cf2', '#9a52ff', '#e03ccf', '#c9a7ff'];
const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const mix = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
// the table, in world units round the phone (the opening and the last image are up here; in play its sides fall off into shadow
// either side of the phone — the lyrics in the dark on the right, the router's lights glinting on the left)
const TB = { cx: 0, cy: OY + K * (G.Y0 + G.Y1) / 2, w: 72, h: 44, S: 40 };
const MUG = { x: 10.4, y: TB.cy - 3.6, r: 2.6 }, ROUTER = { x: -9.9, y: TB.cy + 4.2, w: 8.4, h: 2.6 }, LAMP = { x: -22, y: TB.cy + 11.5, r: 3.4 };
const LEDS = [0, 1, 2, 3].map(i => ({ x: ROUTER.x - 2.4 + i * 1.6, y: ROUTER.y - 0.55 }));
export const modeView = ({ T, world, C, cam }) => {
  const P = prep(C), D = P.D, O = P.O, PX = 150, SW = G.X1 - G.X0, SH = G.Y1 - G.Y0, end = D.end || {};
  const PCX = OX + K * (G.X0 + G.X1) / 2, PCY = OY + K * (G.Y0 + G.Y1) / 2;
  const plane = (c, w, h, cx, cy, z, ro) => { const tx = new T.CanvasTexture(c); tx.colorSpace = T.NoColorSpace; tx.minFilter = T.LinearFilter;
    const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); m.renderOrder = ro; m.position.set(cx, cy, z); m.scale.set(w, h, 1); m.frustumCulled = false; (ro === 'g' ? phoneG : world).add(m); return { m, tx }; };
  // the phone (its body, its screen, its shadow and charger cable) is one group round its centre: it lies upright on the table the
  // whole level (never turned), and it buzzes when Sheila's text lands
  const phoneG = new T.Group(); phoneG.position.set(PCX, PCY, 0); world.add(phoneG);
  const gplane = (c, w, h, z, ro) => { const p = plane(c, w, h, 0, 0, z, 'g'); p.m.renderOrder = ro; return p; };
  // the screen: one canvas, redrawn every frame
  const cv = document.createElement('canvas'); cv.width = Math.round(SW * PX); cv.height = Math.round(SH * PX);
  const x = cv.getContext('2d'), scr = gplane(cv, K * SW, K * SH, -0.4, 1), tex = scr.tx;
  // the lock screen is drawn on its own canvas, then laid onto the screen
  const LS = Math.ceil(Math.hypot(cv.width, cv.height)) + 8, lc = document.createElement('canvas'); lc.width = LS; lc.height = LS; const lg = lc.getContext('2d');
  // the phone's body (drawn once): titanium rim, black bezel, the buttons on its edges
  { const S = 90, FW = SW + 2 * G.BZ, FH = SH + 2 * G.BZ, MG = 0.14, fc = document.createElement('canvas'); fc.width = Math.ceil((FW + 2 * MG) * S); fc.height = Math.ceil((FH + 2 * MG) * S);
    const f = fc.getContext('2d'), o = MG * S, bw = FW * S, bh = FH * S, R = (G.RAD + G.BZ) * S;
    f.fillStyle = '#5d6168'; for (const [by, len] of [[1.3, 0.45], [2.05, 0.8], [3.0, 0.8]]) { rr(f, o - 0.07 * S, o + by * S, 0.16 * S, len * S, 0.05 * S); f.fill(); }   // (the action button + volume, the left edge)
    rr(f, o + bw - 0.09 * S, o + 2.5 * S, 0.16 * S, 1.15 * S, 0.05 * S); f.fill();                                                                         // (the side button, the right edge)
    const rim = f.createLinearGradient(0, o, 0, o + bh); rim.addColorStop(0, '#9aa0a8'); rim.addColorStop(0.5, '#4b4f56'); rim.addColorStop(1, '#8c929a');
    f.fillStyle = rim; rr(f, o, o, bw, bh, R); f.fill();
    f.fillStyle = '#050506'; rr(f, o + 0.05 * S, o + 0.05 * S, bw - 0.1 * S, bh - 0.1 * S, R - 0.05 * S); f.fill();
    f.strokeStyle = 'rgba(255,255,255,0.18)'; f.lineWidth = 2; rr(f, o + 1.5, o + 1.5, bw - 3, bh - 3, R); f.stroke();
    gplane(fc, K * (FW + 2 * MG), K * (FH + 2 * MG), -0.8, 0).m.name = 'ghost-phone-body'; }
  // under it: its shadow on the wood, the charger cable out of its port (the bottom edge) and off the table
  { const S = 20, BW = K * (SW + 2 * G.BZ), BH = K * (SH + 2 * G.BZ), L0 = -BW / 2 - 3, L1 = BW / 2 + 14, T1 = BH / 2 + 3, B0 = -BH / 2 - 16;
    const c = document.createElement('canvas'); c.width = Math.ceil((L1 - L0) * S); c.height = Math.ceil((T1 - B0) * S); const g = c.getContext('2d');
    const tx = lx => (lx - L0) * S, ty = ly => (T1 - ly) * S, yb = -BH / 2;
    g.save(); g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = 1.6 * S; g.shadowOffsetX = 0.2 * S; g.shadowOffsetY = 0.2 * S; g.fillStyle = 'rgba(0,0,0,0.6)'; rr(g, tx(-BW / 2), ty(BH / 2), BW * S, BH * S, K * (G.RAD + G.BZ) * S); g.fill(); g.restore();
    g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.5 * S; g.beginPath(); g.moveTo(tx(0.2), ty(yb - 0.6)); g.bezierCurveTo(tx(1.2), ty(yb - 6), tx(9), ty(yb - 4), tx(13), ty(yb - 14)); g.stroke();
    g.strokeStyle = '#e8e4dc'; g.lineWidth = 0.34 * S; g.beginPath(); g.moveTo(tx(0), ty(yb)); g.bezierCurveTo(tx(1), ty(yb - 5.5), tx(8.8), ty(yb - 3.5), tx(12.8), ty(yb - 13.8)); g.stroke();
    g.fillStyle = '#d8d3ca'; rr(g, tx(-0.32), ty(yb + 0.05), 0.64 * S, 1.1 * S, 0.12 * S); g.fill(); g.restore();
    const u = gplane(c, L1 - L0, T1 - B0, -0.9, -0.5); u.m.position.set((L0 + L1) / 2, (B0 + T1) / 2, -0.9); }
  // the table under it (drawn once): night-time wood, the night light's warm pool, the mug, the router, the charger cable, the phone's shadow
  { const c = document.createElement('canvas'); c.width = TB.w * TB.S; c.height = TB.h * TB.S; const g = c.getContext('2d'), S = TB.S;
    const tx = wx => (wx - (TB.cx - TB.w / 2)) * S, ty = wy => (TB.cy + TB.h / 2 - wy) * S;
    g.fillStyle = '#2a190e'; g.fillRect(0, 0, c.width, c.height);
    for (let k = 0; k * 4.2 < TB.h; k++) { const y0 = k * 4.2 * S, tone = 0.85 + 0.3 * hash(k, 3);                    // planks, grain, seams
      g.fillStyle = `rgb(${Math.round(70 * tone)},${Math.round(43 * tone)},${Math.round(24 * tone)})`; g.fillRect(0, y0, c.width, 4.2 * S);
      g.strokeStyle = 'rgba(20,10,4,0.35)'; g.lineWidth = 1.2;
      for (let j = 0; j < 14; j++) { const yy = y0 + (0.2 + 3.8 * hash(k, j + 9)) * S, amp = (0.05 + 0.18 * hash(j, k)) * S, ph = hash(j, k + 4) * 9; g.beginPath(); g.moveTo(0, yy);
        for (let xx = 0; xx <= c.width; xx += 40) g.lineTo(xx, yy + Math.sin(xx / (S * (3 + 4 * hash(j, 2))) + ph) * amp); g.globalAlpha = 0.25 + 0.4 * hash(j, k + 1); g.stroke(); } g.globalAlpha = 1;
      g.fillStyle = 'rgba(10,5,2,0.8)'; g.fillRect(0, y0, c.width, 3);
      const kn = Math.floor(hash(k, 7) * 3); for (let j = 0; j < kn; j++) { g.fillStyle = 'rgba(30,15,6,0.5)'; g.beginPath(); g.ellipse((0.1 + 0.8 * hash(k, j + 20)) * c.width, y0 + (1 + 2 * hash(j, k + 30)) * S, 0.5 * S, 0.22 * S, 0, 0, 7); g.fill(); } }
    const pool = (wx, wy, r, col, a) => { const gr = g.createRadialGradient(tx(wx), ty(wy), 0, tx(wx), ty(wy), r * S); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); g.restore(); };
    pool(LAMP.x, LAMP.y, 34, '#ffb35c', 0.5); pool(LAMP.x, LAMP.y, 12, '#ffd9a0', 0.35);
    { const vg = g.createRadialGradient(tx(LAMP.x + 14), ty(LAMP.y - 10), 10 * S, tx(LAMP.x + 14), ty(LAMP.y - 10), 52 * S); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.8)'); g.fillStyle = vg; g.fillRect(0, 0, c.width, c.height); }
    const shadow = (fn, blur, off) => { g.save(); g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = blur * S; g.shadowOffsetX = off * S; g.shadowOffsetY = off * S; g.fillStyle = 'rgba(0,0,0,0.6)'; fn(); g.fill(); g.restore(); };
    // (the phone's shadow and its charger cable turn with it: phoneG, above)
    // the mug (seen from above): a ceramic ring, the tea, its handle
    shadow(() => { g.beginPath(); g.arc(tx(MUG.x), ty(MUG.y), MUG.r * S, 0, 7); }, 1.0, 0.45);
    g.save(); g.strokeStyle = '#d9cfbf'; g.lineWidth = 0.55 * S; g.beginPath(); g.arc(tx(MUG.x + MUG.r + 0.55), ty(MUG.y - 0.2), 0.95 * S, -1.25, 1.25); g.stroke(); g.restore();
    { const gr = g.createRadialGradient(tx(MUG.x - 0.8), ty(MUG.y + 0.8), 0.2 * S, tx(MUG.x), ty(MUG.y), MUG.r * S); gr.addColorStop(0, '#fbf5ea'); gr.addColorStop(1, '#bfb3a0'); g.fillStyle = gr; g.beginPath(); g.arc(tx(MUG.x), ty(MUG.y), MUG.r * S, 0, 7); g.fill(); }
    { const gr = g.createRadialGradient(tx(MUG.x - 0.5), ty(MUG.y + 0.5), 0.1 * S, tx(MUG.x), ty(MUG.y), 2.1 * S); gr.addColorStop(0, '#8a5a32'); gr.addColorStop(1, '#3b2312'); g.fillStyle = gr; g.beginPath(); g.arc(tx(MUG.x), ty(MUG.y), 2.08 * S, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,230,190,0.35)'; g.lineWidth = 0.12 * S; g.beginPath(); g.arc(tx(MUG.x), ty(MUG.y), 1.7 * S, 3.6, 4.6); g.stroke(); }
    // the wifi router: a dark slab, two antennas folded back, a row of status lights (lit in the overlay)
    shadow(() => rr(g, tx(ROUTER.x - ROUTER.w / 2), ty(ROUTER.y + ROUTER.h / 2), ROUTER.w * S, ROUTER.h * S, 0.5 * S), 1.0, 0.4);
    g.fillStyle = '#16181d'; for (const ax of [-ROUTER.w / 2 + 0.7, ROUTER.w / 2 - 1.1]) { rr(g, tx(ROUTER.x + ax), ty(ROUTER.y + ROUTER.h / 2 + 3.4), 0.42 * S, 3.6 * S, 0.2 * S); g.fill(); }
    { const gr = g.createLinearGradient(0, ty(ROUTER.y + ROUTER.h / 2), 0, ty(ROUTER.y - ROUTER.h / 2)); gr.addColorStop(0, '#2c3038'); gr.addColorStop(1, '#14161a'); g.fillStyle = gr; rr(g, tx(ROUTER.x - ROUTER.w / 2), ty(ROUTER.y + ROUTER.h / 2), ROUTER.w * S, ROUTER.h * S, 0.5 * S); g.fill(); }
    g.fillStyle = '#0a0b0d'; for (const L of LEDS) { g.beginPath(); g.arc(tx(L.x), ty(L.y), 0.2 * S, 0, 7); g.fill(); }
    // the night light: a little round lamp in the corner, its shade glowing
    { const gr = g.createRadialGradient(tx(LAMP.x), ty(LAMP.y), 0.3 * S, tx(LAMP.x), ty(LAMP.y), LAMP.r * S); gr.addColorStop(0, '#fff3d6'); gr.addColorStop(0.6, '#ffcf8a'); gr.addColorStop(1, '#d98c3a'); g.fillStyle = gr; g.beginPath(); g.arc(tx(LAMP.x), ty(LAMP.y), LAMP.r * S, 0, 7); g.fill(); }
    pool(LAMP.x, LAMP.y, 6, '#fff0cc', 0.5);
    plane(c, TB.w, TB.h, TB.cx, TB.cy, -1.2, -2); }
  // the table's live bits (the screen's light on the wood, the router's lights, the steam, his wifi at the end): a smaller canvas
  const fxc = document.createElement('canvas'), FS = 16; fxc.width = TB.w * FS; fxc.height = TB.h * FS; const fg = fxc.getContext('2d'), fxp = plane(fxc, TB.w, TB.h, TB.cx, TB.cy, -1.0, -1);
  const fX = wx => (wx - (TB.cx - TB.w / 2)) * FS, fY = wy => (TB.cy + TB.h / 2 - wy) * FS;
  const X = wx => (wx - G.X0) * PX, Y = wy => (G.Y1 - wy) * PX;
  let fxLast = -9, fxZ = -1;
  // Petunia (Chikin's cat, the real photo): the last picture of the level glitches a second time into her
  const petunia = { ok: false, im: null, cv: null }, petSrc = (D.thread.find(r => r.ph2) || {}).ph2;
  if (petSrc && typeof Image !== 'undefined') { const im = new Image(); im.onload = () => { petunia.ok = true; }; im.src = new URL('../' + petSrc, import.meta.url).href; petunia.im = im; }
  const petPic = (W, H) => { if (petunia.cv) return petunia.cv; const c = document.createElement('canvas'); c.width = Math.round(W); c.height = Math.round(H); const g = c.getContext('2d'), im = petunia.im;
    const sc = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight), w = im.naturalWidth * sc, h = im.naturalHeight * sc; g.drawImage(im, (c.width - w) / 2, (c.height - h) * 0.35, w, h);
    return (petunia.cv = c); };
  const screenOn = t => t < O.lit ? 0 : t < (end.black ?? 1e9) ? clamp((t - O.lit) / 0.45) : Math.max(0, 1 - (t - end.black) / 0.12);
  // ---- the camera: wide over the table, in to the phone (until it fills the screen's height), then the phone's screen fills the
  // whole screen (the camera just settles: the screen grows to meet it); a punch on a rewrite, a shake on a fail; at the end the rush
  // in on him and, once the screen's black, wide over the table again ----
  let HW = 12.4;   // half the screen's visible width (screen units): the frame, the status bar and the input bar go by it
  let zIn = 0;   // how far in we are (0 wide over the table … 1 the phone filling the screen): the table's sides fall into shadow with it
  function camera(f) {
    const { s, t } = f, vw = cam.right - cam.left, vh = cam.top - cam.bottom, BW = K * (SW + 2 * G.BZ), BH = K * (SH + 2 * G.BZ);
    const zp = Math.min(vh * 0.955 / BH, vw * 0.9 / BW), zi = Math.min(vh / (S.IH * Z), vw / (21.5 * Z)),   /* (a narrow screen: the conversation column still fits across) */ play = { x: PCX, y: PCY, z: zp }, inside = { x: SC[0], y: SC[1], z: zi }, wide = { x: PCX + 0.4, y: PCY + 1.6, z: zp * 0.45 };
    const lerpF = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * k) });
    HW = Math.min(S.IW, vw / zi / Z) / 2;
    let F = inside;
    if (t < O.zoom1) {   // the opening: wide over the table · in to the phone as the screen glitches · a slow push while he looks about · Sheila's text lands and we come on in until the phone fills the screen
      const w0 = { ...wide, z: wide.z * (1 + 0.07 * clamp(t / Math.max(0.1, O.zoom0))) }, up = { x: PCX, y: PCY + 0.3, z: zp * 0.64 }, push = { x: PCX, y: PCY + K * 1.1, z: zp * 0.8 };
      const n0 = O.notify ?? 5.15;
      if (t < O.zoom0) F = w0;
      else if (t < O.appear) F = lerpF(w0, up, ease((t - O.zoom0) / Math.max(0.1, O.appear - O.zoom0)));
      else if (t < n0) F = lerpF(up, push, ease5((t - O.appear) / Math.max(0.1, n0 - O.appear)));
      else F = lerpF(push, play, ease5((t - n0) / Math.max(0.1, O.zoom1 - n0))); }
    else if (t < O.wide1) F = lerpF(play, inside, ease5((t - O.zoom1) / Math.max(0.1, O.wide1 - O.zoom1)));
    if (end.leap != null && t >= end.leap - 0.2 && s.failT == null) {
      const gf = s.goneFrom || { x: s.x, y: s.y }, at = { x: gf.x, y: gf.y + 0.9, z: zi * 3.2 }, cut = (end.black ?? end.out + 0.15) + 0.28;
      if (t < cut) F = lerpF(inside, at, ease((t - (end.leap - 0.2)) / Math.max(0.05, (end.out ?? end.leap) - end.leap + 0.2)) ** 1.6);
      else F = { ...wide, z: wide.z * 1.12 }; }
    zIn = clamp((Math.log(F.z) - Math.log(wide.z)) / (Math.log(zp) - Math.log(wide.z)));
    let z = F.z * (1 + 0.006 * (f.kick || 0)), sx = 0, sy = 0;
    if (t >= O.ctl && s.rewT != null && t - s.rewT < 0.22 && t >= s.rewT) z *= 1 + 0.02 * (1 - (t - s.rewT) / 0.22);   // (a rewrite punches in a hair)
    const sh = s.failT != null && t - s.failT < 0.45 ? 1 - (t - s.failT) / 0.45 : s.bumpT != null && t - s.bumpT < 0.2 && t >= s.bumpT ? 0.4 * (1 - (t - s.bumpT) / 0.2) : 0;
    if (sh > 0) { sx = (hash(Math.floor(t * 60), 1) - 0.5) * 0.5 * sh; sy = (hash(Math.floor(t * 60), 2) - 0.5) * 0.35 * sh; }
    cam.up.set(0, 1, 0); cam.zoom = z; cam.position.set(F.x + sx, F.y + sy, 10); cam.lookAt(F.x + sx, F.y + sy, 0); cam.updateProjectionMatrix();
  }
  // ---- the table's live bits ----
  function tableFx(f) {
    const { s, t } = f, wideNow = t < O.zoom1 + 0.3 || (end.black != null && t > end.black - 0.6);
    if (!wideNow && t - fxLast < 0.5 && t >= fxLast && Math.abs(zIn - fxZ) < 0.02) return; fxLast = t; fxZ = zIn;
    fg.clearRect(0, 0, fxc.width, fxc.height);
    // in play the table falls off into shadow either side of the phone (the lyrics read in the dark on the right)
    if (zIn > 0.01) { const BW = K * (SW + 2 * G.BZ), e0 = BW / 2 + 0.25, e1 = e0 + 10;
      for (const sg of [-1, 1]) { const xa = fX(PCX + sg * e0), xb = fX(PCX + sg * e1), gr = fg.createLinearGradient(xa, 0, xb, 0);
        gr.addColorStop(0, `rgba(3,2,2,${0.3 * zIn})`); gr.addColorStop(0.45, `rgba(3,2,2,${0.72 * zIn})`); gr.addColorStop(1, `rgba(3,2,2,${0.9 * zIn})`);
        fg.fillStyle = gr; fg.fillRect(Math.min(xa, sg > 0 ? xa : 0), 0, sg > 0 ? fxc.width - xa : xa, fxc.height); } }
    const glow = (wx, wy, r, col, a) => { const gr = fg.createRadialGradient(fX(wx), fY(wy), 0, fX(wx), fY(wy), r * FS); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); fg.save(); fg.globalCompositeOperation = 'lighter'; fg.globalAlpha = a; fg.fillStyle = gr; fg.fillRect(fX(wx) - r * FS, fY(wy) - r * FS, 2 * r * FS, 2 * r * FS); fg.restore(); };
    const on = screenOn(t), gl = t >= O.glitch0 && t < O.appear + 0.6 ? ease((t - O.glitch0) / (O.appear - O.glitch0)) * (t < O.appear ? 1 : 1 - (t - O.appear) / 0.6) : 0;
    if (on > 0) { glow(PCX, PCY, 19, '#6f9cff', 0.22 * on); if (gl > 0) glow(PCX, PCY, 17, '#9a52ff', 0.4 * gl * (0.6 + 0.4 * hash(Math.floor(t * 16), 5))); }
    // the router: its lights blink green — and once he's out of the phone, purple, on the beat
    const out = s.goneAt != null && t >= s.goneAt + 0.35, b = C.beatOf(t);
    LEDS.forEach((L, i) => { const blink = out ? ((Math.floor(b * 2) + i) % 2 ? 1 : 0.35) : hash(i, Math.floor(t * (3 + i))) > 0.25 ? 1 : 0.3, col = out ? PURP[i % 2] : i === 3 ? '#ffb02e' : GREEN;
      fg.fillStyle = col; fg.globalAlpha = blink; fg.beginPath(); fg.arc(fX(L.x), fY(L.y), 0.17 * FS, 0, 7); fg.fill(); fg.globalAlpha = 1; glow(L.x, L.y, out ? 1.6 : 0.8, col, (out ? 0.7 : 0.35) * blink); });
    if (out) { const a = t - s.goneAt - 0.35;                                                       // his wifi: purple rings out of the dark phone, into the router
      for (let k = 0; k < 3; k++) { const u = ((a * 0.9 + k / 3) % 1); fg.save(); fg.strokeStyle = PURP[1]; fg.globalAlpha = 0.55 * (1 - u) * clamp(a * 3); fg.lineWidth = 0.25 * FS;
        const cx = PCX + (ROUTER.x - PCX) * u * 0.92, cy = PCY + 3 + (ROUTER.y - PCY - 3) * u * 0.92; fg.beginPath(); fg.arc(fX(cx), fY(cy), (0.8 + 1.6 * u) * FS, 2.2, 4.1); fg.stroke(); fg.restore(); }
      glow(ROUTER.x, ROUTER.y, 7, '#9a52ff', 0.3 + 0.15 * Math.sin(t * 6)); }
    for (let k = 0; k < 3; k++) { const u = (t * 0.22 + k / 3) % 1; glow(MUG.x + Math.sin(t * 0.8 + k * 2) * 0.8 * u, MUG.y + u * 2.2, 1.2 + 1.6 * u, '#f4efe6', 0.12 * Math.sin(u * Math.PI)); }   // a little steam
    fxp.tx.needsUpdate = true;
  }
  // ---- the lyrics (the engine's lyric block is off for this level — it would cross the phone): the same glitch text his videos use
  // (each word pops in on its tapped time through his glitch language, another face and binary, then lands in Major Mono, logo green
  // with a black outline; key and held words bigger, glitching on the beat; the line glitches out when the next one starts), laid
  // in a column in the dark to the RIGHT of the phone, wrapped to fit it — never over the thread. His glitch words flash on the LEFT. ----
  const TH = C.theme || C.def.theme || {}, LYK = new Set((TH.lyricKeys || []).map(w => w.toLowerCase())), LYC = TH.lyricColor || '#4dff9a';
  const LLINES = (() => { const by = new Map(); for (const w of C.signs || []) { if (w.t0 == null) continue; if (!by.has(w.line)) by.set(w.line, []); by.get(w.line).push(w); }
    const ls = [...by.values()].map(ws => ws.sort((a, b) => a.t0 - b.t0)).sort((a, b) => a[0].t0 - b[0].t0).map((ws, i) => ({ ws, t0: ws[0].t0, t1: ws[ws.length - 1].t1 ?? ws[ws.length - 1].t0 + 0.4, i }));
    ls.forEach((L, i) => { L.next = ls[i + 1] ? ls[i + 1].t0 : Infinity; }); return ls; })();
  const GWORDS = (typeof window !== 'undefined' && window.POTATO_GLITCH_WORDS || []).filter(w => !/\s/.test(w) && w.length <= 12);
  const LFONT = sz => `400 ${sz}px "Major Mono Display", ui-monospace, monospace`, SPLIT = [PURP[2], PURP[0]], GCOL = ['#eafff1', PURP[2], PURP[3], PURP[1]];   // (his glitch colours are his purples only)
  const ALTF = [sz => `400 ${sz * 0.82}px Bungee, Impact, sans-serif`, sz => `400 ${sz * 0.8}px "Rubik Mono One", Impact, sans-serif`, sz => `700 ${sz * 0.9}px "JetBrains Mono", ui-monospace, monospace`];
  function lyrLayout(ctx, L, W, H) {   // a placed block in the right-hand column: wrap inside it, rows centred, key/held words bigger
    const u = W / 960, SZ = 29 * u, cx0 = W * 0.665, cx1 = W * 0.968, maxW = cx1 - cx0, sp = SZ * 0.62;
    let toks = L.ws.map((w, k) => { const bare = w.text.replace(/[^a-z0-9']/gi, '').toLowerCase(), held = (w.t1 ?? w.t0) - w.t0 > 0.6, sc = LYK.has(bare) ? 1.35 : held ? 1.2 : 1, txt = w.text.toLowerCase();
      ctx.font = LFONT(SZ * sc); return { w, k, s: sc, key: LYK.has(bare) || held, txt, wd: ctx.measureText(txt).width }; });
    for (const it of toks) if (it.wd > maxW) { it.s *= maxW / it.wd; it.wd = maxW; }   // (a word wider than the column shrinks to fit)
    const rows = [[]]; let rw = 0;
    for (const it of toks) { if (rw + it.wd > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(it); rw += it.wd + sp; }
    let y = H * 0.12; const out = [];
    for (const row of rows) { const rh = Math.max(...row.map(it => it.s)) * SZ * 1.12, width = row.reduce((a, it) => a + it.wd, 0) + sp * (row.length - 1);
      let xx = cx0 + (maxW - width) / 2; y += rh * 0.85; for (const it of row) { out.push({ ...it, x: xx, y }); xx += it.wd + sp; } y += rh * 0.3; }
    return { toks: out, SZ, cx: (cx0 + cx1) / 2, cy: H * 0.25, rot: -(0.02 + 0.03 * hash(L.i, 4)) };
  }
  function lyrics(ctx, t, b) {
    const W = ctx.canvas.width, H = ctx.canvas.height, seed = Math.floor(t * 24);
    let L = null; for (const l of LLINES) { if (l.t0 <= t + 0.001) L = l; else break; }
    if (L) { const out = Math.min(L.next, L.t1 + 2.2) - t;
      if (out >= -0.01) { const Lay = lyrLayout(ctx, L, W, H), exiting = out < 0.18, SZ = Lay.SZ;
        ctx.save(); ctx.translate(Lay.cx, Lay.cy); ctx.rotate(Lay.rot); ctx.translate(-Lay.cx, -Lay.cy);
        for (const it of Lay.toks) {
          const age = t - it.w.t0; if (age < 0) continue;
          const k = clamp(age / 0.15), sc = 1 + (1 - k) * 0.25, a = clamp(age / 0.06), glowK = 1 - k, fresh = age < 0.3, beatGlitch = it.key && Math.floor(b) % 4 === 3 && (b % 1) < 0.18;
          let jx = 0, jy = 0; if (exiting || (it.key && fresh) || beatGlitch) { jx = (hash(it.k, seed) - 0.5) * 16; jy = (hash(it.k, seed + 1) - 0.5) * 8; }
          ctx.save(); ctx.translate(it.x + it.wd / 2 + jx, it.y + jy); ctx.scale(sc, sc); ctx.globalAlpha = a * (exiting ? 0.6 : 1);
          ctx.font = LFONT(SZ * it.s); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
          if (glowK > 0) { ctx.shadowColor = '#eafff1'; ctx.shadowBlur = 24 * glowK; }
          let txt = it.txt; const landing = age < 0.26;
          if (landing) {                                   // the scramble: glitch speech -> another face -> binary -> the lyric
            const st = Math.floor(age / 0.26 * 4), sd = it.k * 7 + st;
            if (st === 0 && GWORDS.length) { txt = GWORDS[Math.floor(hash(it.k + L.i * 31, 11) * GWORDS.length)]; ctx.font = ALTF[Math.floor(hash(it.k, 12) * ALTF.length)](SZ * it.s); }
            else if (st === 1) ctx.font = ALTF[Math.floor(hash(sd, 13) * ALTF.length)](SZ * it.s);
            else if (st === 2) txt = [...it.txt].map((c, i) => c.trim() ? (hash(it.k + i, Math.floor(t * 30)) > 0.5 ? '1' : '0') : c).join('');
            ctx.translate((hash(it.k, Math.floor(t * 40) + 3) - 0.5) * 12, 0);
            const mw = Math.max(it.wd, SZ * 2.4); if (ctx.measureText(txt).width > mw) { const f = mw / ctx.measureText(txt).width; ctx.scale(f, f); }   // (the scramble stays in the column)
          }
          ctx.lineWidth = Math.max(4, SZ * it.s * 0.13); ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(txt, 0, 0); ctx.shadowBlur = 0;
          if (landing) { const c = GCOL[Math.floor(hash(it.k, Math.floor(t * 30)) * GCOL.length)]; ctx.fillStyle = SPLIT[0]; ctx.fillText(txt, -3, 0); ctx.fillStyle = SPLIT[1]; ctx.fillText(txt, 3, 0); ctx.fillStyle = c; ctx.fillText(txt, 0, 0); ctx.restore(); continue; }
          if (exiting || (it.key && fresh) || beatGlitch) { ctx.fillStyle = SPLIT[0]; ctx.globalAlpha *= 0.85; ctx.fillText(it.txt, -3, 0); ctx.fillStyle = SPLIT[1]; ctx.fillText(it.txt, 3, 0); ctx.globalAlpha = a; }
          ctx.fillStyle = LYC; ctx.fillText(it.txt, 0, 0); ctx.restore();
        }
        ctx.restore(); } }
    // his glitch language, now and then, in the dark on the left of the phone
    if (!GWORDS.length) return;
    const slot = Math.floor(b / 6), ph = b / 6 - slot; if (hash(slot, 3) > 0.6 || ph > 0.3 || hash(slot, Math.floor(t * 20)) < 0.25) return;
    const word = GWORDS[Math.floor(hash(slot, 5) * GWORDS.length)], gx = W * (0.1 + hash(slot, 6) * 0.2), gy = H * (0.3 + hash(slot, 7) * 0.4), j = (hash(slot, Math.floor(t * 30)) - 0.5) * 10;
    ctx.save(); ctx.font = hash(slot, 9) < 0.7 ? LFONT(24 * W / 960) : ALTF[Math.floor(hash(slot, 10) * ALTF.length)](24 * W / 960); ctx.textAlign = 'center'; ctx.globalAlpha = 0.9;
    const mw = W * 0.27, ww = ctx.measureText(word).width; if (ww > mw) { ctx.translate(gx, gy); ctx.scale(mw / ww, mw / ww); ctx.translate(-gx, -gy); }
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(word, gx + j, gy);
    ctx.fillStyle = SPLIT[0]; ctx.fillText(word, gx - 3 + j, gy); ctx.fillStyle = SPLIT[1]; ctx.fillText(word, gx + 3 + j, gy); ctx.fillStyle = GCOL[Math.floor(hash(slot, 4) * GCOL.length)]; ctx.fillText(word, gx + j, gy); ctx.restore();
  }
  // ======== THE INSIDE SCREEN (play): one canvas the size of the whole screen, in front of the phone. When her notification opens
  // it grows from the banner to the phone's screen, then on out until it fills the screen (the bezel goes with it, and ends up as a
  // thin frame round the edge — the illusion); the phone's own body hides as it does. ========
  // (its resolution follows the screen's — the device's pixels over the inside's height — between 44 and 56 px a unit: sharp on a
  // phone's retina screen, and never so big that an old laptop chokes redrawing it every frame)
  const PXI = Math.round(clamp((typeof innerHeight !== 'undefined' ? innerHeight : 720) * (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1) / S.IH, 44, 56)), ic = document.createElement('canvas'); ic.width = Math.round(S.IW * PXI); ic.height = Math.round(S.IH * PXI);
  const g = ic.getContext('2d'), ins = plane(ic, S.IW * Z, S.IH * Z, SC[0], SC[1], -0.3, 2); ins.m.visible = false;
  const XI = lx => (lx + S.IW / 2) * PXI, YI = ly => (S.IH / 2 - ly) * PXI, U = PXI;
  const photoCache = new Map(); const photo = (key, gl) => { const k = key + (gl ? '!' : ''); if (!photoCache.has(k)) photoCache.set(k, drawPhoto(key, gl, Math.round(S.PHW * U), Math.round(S.PHH * U))); return photoCache.get(k); };
  const maskAt = t => {   // the screen's shape (local units): the notification banner -> the phone's screen -> the whole screen
    const nb = LOCK.P.note, q = K / Z, B = { cx: q * nb[0], cy: q * nb[1], w: q * nb[2], h: q * LOCK.NH, r: 0.22 * q }, Ph = { cx: 0, cy: 0, w: q * SW, h: q * SH, r: q * G.RAD },
      Fu = { cx: 0, cy: 0, w: 2 * HW - 2 * S.FRAME, h: S.IH - 2 * S.FRAME, r: 0.9 }, L = (a, b, k) => ({ cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k, r: a.r + (b.r - a.r) * k });
    const k1 = ease5((t - O.wake) / 0.34), k2 = ease5((t - O.wide0) / Math.max(0.1, O.wide1 - O.wide0));
    return { ...(k2 > 0 ? L(Ph, Fu, k2) : L(B, Ph, k1)), k1, k2 }; };
  const LOOKT = [...(C.def.glows || []), ...(C.def.looks || []).flatMap(l => [l[0], l[1]])].sort((a, b) => a - b);   // his look changes (the Sheet Ghost on the choruses): his purple round him
  const RG = P.R, beatPulse = t => { const b = RG.beatOf(t), f = ((b % 1) + 1) % 1; return Math.max(0, 1 - f / 0.25); };
  const M = C.music;   // the song's music map (kicks, snares, drops) — guarded: a level without one gets null
  const beatsAgo = t => { const out = []; if (M) { let k = M.lastKick(t); for (let i = 0; i < 3 && k > -1e8; i++) { out.push(t - k); k = M.lastKick(k - 1e-3); } } else { const b = Math.floor(RG.beatOf(t)); for (let i = 0; i < 3; i++) out.push(t - RG.tOfBeat(b - i)); } return out; };
  let islandW = 3.4, seenJ = 0, seenSim = null, seenBoot = null; const GRP = P.items.filter(q => q.grp);   // (the group's adds, found once)
  function sounds(s) {   // (the sim is pure; the sounds come from what it logged)
    if (s !== seenSim) { seenSim = s; seenJ = s.jlog ? s.jlog.length : 0; seenBoot = s.bootT; if (s.bootT != null) SFX.boot(); return; }
    const jl = s.jlog || []; for (let i = seenJ; i < jl.length; i++) { const j = jl[i], k = j.k;
      if (k === 'hop') SFX.jump(false);   // (Chikin, Nov 8: "he needs a little jump sound too")
      else if (k === 'rewrite') { SFX.whoosh(true); SFX.note(!!j.ob); } else if (k === 'super') { SFX.whoosh(true); SFX.download(); } else if (k === 'tp') SFX.glitch(false); else if (k === 'read') { if (j.cost) SFX.thud(); else SFX.flub(); }
      else if (k === 'bounce') SFX.pad(); else if (k === 'bump') SFX.squeak(); else if (k === 'fizzle') SFX.click(); else if (k === 'land') SFX.land(0.5); else if (k === 'thru') SFX.transform();
      else if (k === 'bonk') SFX.thunk(); else if (k === 'charge') SFX.dlTick(); else if (k === 'fail') SFX.powerDown();   /* (main.mjs plays the die when the run ends) */ else if (k === 'drop') SFX.scoot();
      else if (k === 'jwarn') SFX.click(); else if (k === 'jolt') SFX.glitch(true); else if (k === 'knock') SFX.squeak(); else if (k === 'jthru') SFX.transform(); else if (k === 'jgone') SFX.land(0.3); }   // (the phone's jolts)
    seenJ = jl.length; }
  function drawInside(s, t) {
    const Mk = maskAt(t), mx0 = XI(Mk.cx - Mk.w / 2), my0 = YI(Mk.cy + Mk.h / 2), mw = Mk.w * U, mh = Mk.h * U, BZ = K * G.BZ * U;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, ic.width, ic.height);
    if (Mk.k2 >= 1) { g.fillStyle = '#050506'; g.fillRect(0, 0, ic.width, ic.height); }   // (filled: the frame of the illusion, corners and all)
    if (Mk.k2 > 0) {   // the phone's bezel goes out with its screen
      g.fillStyle = '#5d6168'; rr(g, mx0 - BZ - 4, my0 - BZ - 4, mw + 2 * BZ + 8, mh + 2 * BZ + 8, Mk.r * U + BZ + 4); g.fill();
      g.fillStyle = '#050506'; rr(g, mx0 - BZ, my0 - BZ, mw + 2 * BZ, mh + 2 * BZ, Mk.r * U + BZ); g.fill(); }
    g.save(); rr(g, mx0, my0, mw, mh, Mk.r * U); g.clip();
    const fail = s.failT, tr = fail != null ? Math.min(t, fail + 0.2) : t;
    g.fillStyle = '#ffffff'; g.fillRect(mx0, my0, mw, mh);
    drawThread(s, t, tr);
    drawBar(s, t, tr);
    drawHeader(s, t);
    // his look changes (the Sheet Ghost on and off): his purple round him, on the phone only
    if (fail == null && !s.gone) { const lt = LOOKT.filter(u => t >= u && t - u < 0.55).pop();
      if (lt != null) { const k = (t - lt) / 0.55, cx = XI(s.lx), cy = YI(s.ly + 0.65); g.save(); g.lineCap = 'round';
        for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + hash(i, lt) * 0.3, r0 = (0.6 + 0.8 * k) * U, r1 = r0 + (0.25 + 0.3 * hash(i, 7)) * U * (1 - k * 0.5);
          g.strokeStyle = PURP[i % 3]; g.globalAlpha = 0.85 * (1 - k); g.lineWidth = 5; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke(); }
        g.restore(); } }
    // the power-off (the real ending), lost (the fail), the boot after a restart, his escape
    const sl = end.slider != null && t >= end.slider && fail == null ? ease((t - end.slider) / 0.4) : 0;
    if (sl > 0) { const steps = (end.steps || []).filter(u => t >= u).length, last = (end.steps || [])[steps - 1], kk = last != null ? ease((t - last) / 0.18) : 1; drawSlider(sl, steps ? clamp((steps - 1 + kk) / end.steps.length) : 0); }
    if (fail != null) drawLost(s, t);
    if (s.goneAt != null && t >= s.goneAt) drawEscape(s, t);
    const blk = end.black != null && t >= end.black ? ease((t - end.black) / 0.12) : 0; if (blk) { g.fillStyle = `rgba(2,2,4,${blk})`; g.fillRect(0, 0, ic.width, ic.height); }
    if (s.bootT != null && t >= s.bootT && t - s.bootT < BOOT.logo + BOOT.fade) drawBoot(t - s.bootT);
    g.restore();
    if (Mk.k2 >= 1 && fail == null && P.jolts.length && s.jolt) drawJoltFrame(s, t);   // (the phone's own frame sparking: on the bezel, outside the glass)
  }
  // ---------- the phone's jolts: it's glitching because he's in it (Nov 3). All on the phone, all local, his purples only ----------
  const jRow = (st, o) => st.find(r => r.q.id === o.id);
  const jFrameX = () => XI(-HW + S.FRAME * 0.5);   // (the left edge of the glass: the frame's inner side)
  function drawJoltFrame(s, t) {   // the knot of purple pixels building on the frame at the bubble's height (the warning), flaring on the hit
    const st = stack(C, t, s);
    for (const j of P.jolts) { const o = s.jolt[j.i]; if (!o || o.id == null || t < j.warn || t > (o.hitT ?? j.hit) + 0.25) continue; const r = jRow(st, o); if (!r && o.st !== 'fly') continue;
      const y = YI(r ? (r.y0 + r.y1) / 2 : o.L ? o.L.cy : 0), hit = o.hitT != null && t >= o.hitT, k = hit ? 1 - (t - o.hitT) / 0.25 : clamp((t - o.warnT) / Math.max(0.1, j.hit - o.warnT));
      const half = Math.floor(RG.beatOf(t) * 2), n = hit ? 22 : 4 + Math.round(10 * k), st8 = Math.max(4, Math.round(0.12 * U)), x0 = XI(-HW), f = Math.floor(t * 20);
      g.save(); for (let i = 0; i < n; i++) { const a = hash(i + j.i * 17, half) * 6.283, rad = (0.1 + (0.25 + 0.3 * k) * hash(i, f + j.i)) * U * (hit ? 1.6 : 1);
        g.globalAlpha = Math.min(1, 0.35 + 0.65 * k) * (0.6 + 0.4 * (half % 2)); g.fillStyle = i % 7 === 0 ? '#f3ecff' : PURP[i % 4];
        g.fillRect(Math.round((x0 + S.FRAME * 0.5 * U + Math.cos(a) * rad * 0.6) / st8) * st8, Math.round((y + Math.sin(a) * rad * 1.3) / st8) * st8, st8, st8); }
      g.restore(); }
  }
  function drawJolts(s, t, tr, st) {
    for (const j of P.jolts) { const o = s.jolt[j.i]; if (!o || o.id == null || t < j.warn) continue; const q = P.items[o.id], r = jRow(st, o);
      const R0 = r ? { x: XI(r.x0), y: YI(r.y1), w: r.ww * U, h: r.hh * U, r: Math.min(r.hh * U / 2, 0.42 * U) } : null, fx = jFrameX();
      // the warning: her bubble crackles, little zigzags flicker between the frame and it; a throw draws its dotted arc to where it'll land
      if (o.st === 'warn' && r) { const k = clamp((tr - o.warnT) / Math.max(0.1, j.hit - o.warnT)), cy = YI((r.y0 + r.y1) / 2);
        drawCrackle(g, R0, { t, u: U, k: 0.4 + 0.6 * k, seed: j.i });
        const half = Math.floor(RG.beatOf(t) * 2); for (let z = 0; z < 1 + Math.round(2 * k); z++) if (hash(z + j.i, Math.floor(t * 15)) < 0.55 + 0.4 * k) drawSpark(g, [fx, cy + (hash(z, half) - 0.5) * 0.5 * U], [R0.x, cy + (hash(z + 3, half) - 0.5) * R0.h * 0.6], { t, u: U, k: 0.35 + 0.35 * k, seed: z + j.i * 5, amp: 0.3, n: 5 });
        if (j.kind === 'throw') { const Lp = joltLaunch(j, r, o.aim, j.hit + J.SHAKE, o.warnT);
          if (Lp.kind === 'throw') { const tau = Math.min(Lp.end - Lp.t0, Math.abs(Lp.vx) > 0.01 ? (o.aim[0] - Lp.cx) / Lp.vx : 1), nd = 24, show = Math.ceil(nd * ease(k * 1.4)), st8 = Math.max(5, Math.round(0.15 * U));
            g.save(); g.fillStyle = PURP[3]; for (let i = 1; i <= Math.min(nd, show); i++) { const b = joltBox(Lp, Lp.t0 + tau * i / nd); if (!b) break; g.globalAlpha = 0.85 * (0.5 + 0.5 * ((i + Math.floor(t * 8)) % 2));
              g.fillRect(Math.round(XI(b.cx) / st8) * st8 - st8 / 2, Math.round(YI(b.cy) / st8) * st8 - st8 / 2, st8, st8); }
            if (show >= nd) { const pu = 1 + 0.12 * beatPulse(t); g.globalAlpha = 0.9; g.strokeStyle = PURP[3]; g.lineWidth = Math.max(3, 0.07 * U); g.setLineDash([0.12 * U, 0.08 * U]);
              g.beginPath(); g.ellipse(XI(o.aim[0]), YI(o.aim[1]), 0.62 * U * pu, 0.62 * U * pu, 0, 0, 7); g.stroke(); }
            g.restore(); } }
        else { // a drop: its fall lane, dotted lilac straight down from her bubble to the bar (drawing in over the warning) — the drop's "it lands HERE"
          const show = ease(k * 1.4), st8 = Math.max(5, Math.round(0.15 * U)), yb = YI(S.BAR + 0.1), yt = YI(r.y0), ys = yt + (yb - yt) * show;
          g.save(); g.fillStyle = PURP[3]; for (const xx of [r.x0 + 0.12, r.x1 - 0.12]) for (let y = yt + st8 * 1.5, i = 0; y < ys; y += st8 * 2.2, i++) { g.globalAlpha = 0.75 * (0.5 + 0.5 * ((i + Math.floor(t * 8)) % 2)); g.fillRect(Math.round(XI(xx) / st8) * st8 - st8 / 2, Math.round(y / st8) * st8, st8, st8); }
          if (show >= 1) { g.globalAlpha = 0.85; g.strokeStyle = PURP[3]; g.lineWidth = Math.max(3, 0.07 * U); g.setLineDash([0.12 * U, 0.08 * U]); g.beginPath(); g.moveTo(XI(r.x0), yb); g.lineTo(XI(r.x1), yb); g.stroke(); }
          g.restore(); } }
      // the hit: a bright bolt from the frame for a few frames, a burst of his glitch on her bubble, a word of his glitch language
      if (o.hitT != null && t >= o.hitT && t - o.hitT < 0.45) { const a = t - o.hitT, by = r ? YI((r.y0 + r.y1) / 2) : o.L ? YI(o.L.cy) : null;
        if (by != null && a < 0.09) drawSpark(g, [fx, by], [r ? R0.x + 0.2 * U : XI(o.L.cx - o.L.w / 2), by], { t, u: U, k: 1, seed: j.i + 40, amp: 0.55, n: 7 });
        if (R0 && a < 0.3) glitchBlocks(g, R0.x, R0.y, R0.w, R0.h, t, q.id + 11, 1 - a / 0.3);
        if (by != null && GWORDS.length && a < 0.4) { const w = GWORDS[Math.floor(hash(j.i, 77) * GWORDS.length)], gx = (r ? R0.x + R0.w : fx) + 0.35 * U, gy = by - 0.6 * a * U, jx = (hash(j.i, Math.floor(t * 30)) - 0.5) * 8;
          g.save(); g.globalAlpha = 1 - a / 0.4; g.font = LFONT(Math.round(0.4 * U)); g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(w, gx + jx, gy);
          g.fillStyle = SPLIT[0]; g.fillText(w, gx + jx - 3, gy); g.fillStyle = SPLIT[1]; g.fillText(w, gx + jx + 3, gy); g.fillStyle = PURP[3]; g.fillText(w, gx + jx, gy); g.restore(); } }
      // the fall: the same bubble (her words readable all the way), tipping, shedding purple pixels; through him = his glitch on it
      if (o.st === 'fly' || (o.st === 'gone' && o.L)) { const b = joltBox(o.L, t);
        if (b) { const X0 = XI(b.x0), Yt = YI(b.y1), W = o.L.w * U, H = o.L.h * U, cx = XI(b.cx), cy = YI(b.cy), st8 = Math.max(4, Math.round(0.12 * U)), f = Math.floor(t * 20);
          for (let i = 0; i < 10; i++) { const back = 0.03 + 0.12 * hash(i, j.i), pb = joltBox(o.L, Math.max(o.L.t0, t - back)) || b, side = hash(i + 4, f);
            g.save(); g.globalAlpha = 0.85 * (1 - back / 0.15); g.fillStyle = i % 4 === 0 ? '#f3ecff' : PURP[i % 3]; g.fillRect(Math.round(XI(side < 0.5 ? pb.x0 : pb.x1) / st8) * st8, Math.round(YI(pb.y0 + (pb.y1 - pb.y0) * hash(i, f + 2)) / st8) * st8, st8, st8); g.restore(); }
          g.save(); g.translate(cx, cy); g.rotate(-b.rot); g.translate(-cx, -cy);
          drawBubble(s, t, tr, { q, mine: false, k: 0, ww: o.L.w, hh: o.L.h }, X0, Yt, W, H, false);
          g.globalAlpha = 0.9; g.strokeStyle = PURP[1]; g.lineWidth = Math.max(2, 0.05 * U); rr(g, X0 - 1, Yt - 1, W + 2, H + 2, Math.min(H / 2, 0.42 * U) + 1); g.stroke(); g.globalAlpha = 1;
          if (o.thru != null && t - o.thru < 0.45) glitchBlocks(g, X0, Yt, W, H, t, q.id + 23, 1 - (t - o.thru) / 0.45);
          g.restore(); }
        // the end: it breaks into his pixels and 0s and 1s (where it hit the bar, or left the column)
        else if (t >= o.L.end && t - o.L.end < 0.3) { const e = joltBox(o.L, o.L.end - 1e-4); if (e) { const a = (t - o.L.end) / 0.3, X0 = XI(e.x0), Yt = YI(e.y1), W = o.L.w * U, H = o.L.h * U, st8 = Math.max(4, Math.round(0.13 * U));
            glitchBlocks(g, X0, Yt, W, H, t, q.id + 31, 1 - a);
            g.save(); for (let i = 0; i < 18; i++) { const ang = -Math.PI / 2 + (hash(i, j.i) - 0.5) * 3, sp = (2 + 4 * hash(i + 3, j.i)) * U, x = X0 + W * hash(i + 6, j.i) + Math.cos(ang) * sp * a, y = Yt + H * 0.6 + Math.sin(ang) * sp * a + 9 * U * a * a;
              g.globalAlpha = 1 - a; if (i % 4 === 0) { g.fillStyle = GREEN; g.font = `700 ${Math.round(0.3 * U)}px "JetBrains Mono", ui-monospace, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i % 8 ? '1' : '0', x, y); }
              else { g.fillStyle = PURP[i % 4]; g.fillRect(Math.round(x / st8) * st8, Math.round(y / st8) * st8, st8, st8); } } g.restore(); } } } }
  }
  // ---------- the thread ----------
  function drawThread(s, t, tr) {
    const st = stack(C, tr, s), yTop = YI(S.HB), yBot = YI(S.BAR);
    g.save(); g.beginPath(); g.rect(0, yTop, ic.width, yBot - yTop); g.clip();
    const on = s.ground && !s.gone ? st.find(r => r.q.id === s.onId) : null, onEv = on ? glitchEv(P, s, on.q, tr) : null, menus = [], rcpt = new Map();
    const joltOn = new Map(); for (const j of P.jolts) { const o = s.jolt && s.jolt[j.i]; if (o && o.id != null && (o.st === 'warn' || o.st === 'hit')) joltOn.set(o.id, { j, o }); }   // (her bubbles the phone's about to knock loose)
    for (let k = st.length - 1; k >= 0; k--) { const r = st[k], q = r.q, newer = k > 0 ? st[k - 1] : null;
      const X0 = XI(r.x0), Yt = YI(r.y1), W = r.ww * U, H = r.hh * U, tail = !newer || newer.q.who !== q.who || newer.dots !== r.dots || !!newer.grey !== !!r.grey || newer.q.photo;
      if (q.named && !r.dots && !r.hole) { g.fillStyle = '#8e8e93'; g.font = FONT(Math.round(0.3 * U), 500); g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillText(q.named, X0 + 0.25 * U, Yt - 0.12 * U); }
      if (r.dots) {   // typing dots: the normal 3-dot bubble (Carol's with her initial)
        if (q.who === 'C') { g.fillStyle = '#b5b9c4'; g.beginPath(); g.arc(X0 - 0.38 * U, Yt + H - 0.3 * U, 0.28 * U, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = FONT(Math.round(0.28 * U), 600); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((q.name || '?')[0], X0 - 0.38 * U, Yt + H - 0.29 * U);
          g.fillStyle = '#8e8e93'; g.font = FONT(Math.round(0.28 * U), 500); g.textAlign = 'left'; g.fillText(q.name, X0 + 0.2 * U, Yt - 0.2 * U); }
        g.fillStyle = GREY; rr(g, X0, Yt, W, H, H / 2); g.fill(); g.beginPath(); g.arc(X0 + 0.12 * U, Yt + H - 0.12 * U, 0.16 * U, 0, 7); g.fill(); g.beginPath(); g.arc(X0 - 0.08 * U, Yt + H + 0.08 * U, 0.08 * U, 0, 7); g.fill();
        for (let i = 0; i < 3; i++) { const ph = (t * 2.4 - i * 0.22) % 1, a = 0.35 + 0.5 * Math.max(0, Math.sin(ph * Math.PI)); g.fillStyle = `rgba(120,120,128,${a})`; g.beginPath(); g.arc(X0 + W * (0.3 + 0.2 * i), Yt + H / 2, 0.1 * U, 0, 7); g.fill(); }
        continue; }
      if (q.photo) {   // a photo: rounded, no tail; his = a potato in it; the last one glitches AGAIN, a beat later: Petunia
        const hit = isP(s, q), pT = hit ? s.rowP[q.row.t.toFixed(3)] : null, Rr = 0.32 * U, p2 = hit && q.ph2 && petunia.ok ? t - Math.max(q.a, pT) - RG.P : -1, sc = 0.85 + 0.15 * ease(r.pop);
        g.save(); g.translate(X0 + W / 2, Yt + H / 2); g.scale(sc, sc); g.translate(-(X0 + W / 2), -(Yt + H / 2)); rr(g, X0, Yt, W, H, Rr); g.clip();
        g.drawImage(p2 > 0.12 ? petPic(W, H) : photo(q.photo, hit), X0, Yt, W, H);
        if (hit && t - pT < 0.6) glitchBlocks(g, X0, Yt, W, H, t, q.id, 1 - (t - pT) / 0.6);
        if (p2 >= 0 && p2 < 0.45) glitchBlocks(g, X0, Yt, W, H, t, q.id + 7, 1 - Math.abs(p2 - 0.12) / 0.33);
        g.restore(); if (hit) { g.strokeStyle = PURP[0]; g.lineWidth = 4; rr(g, X0 - 2, Yt - 2, W + 4, H + 4, Rr + 2); g.stroke(); }
        if (q.ev != null) rcpt.set(q.ev, rcpt.has(q.ev) ? { x0: Math.min(rcpt.get(q.ev).x0, r.x0), x1: Math.max(rcpt.get(q.ev).x1, r.x1), y0: Math.min(rcpt.get(q.ev).y0, r.y0), y1: Math.max(rcpt.get(q.ev).y1, r.y1) } : { x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 });
        continue; }
      if (r.grey) {   // the phone's own grey line, centred (and "You added…" melting in out of his bubble)
        const age = q.sys ? t - s.rowP[q.row.t.toFixed(3)] : 9; g.fillStyle = '#8e8e93'; g.font = FONT(Math.round(0.32 * U), q.stamp ? 600 : 500); g.textAlign = 'center'; g.textBaseline = 'middle';
        const txt = q.sys || q.text; g.fillText(age < 0.3 ? scramble(txt, t) : txt, XI(0), Yt + H / 2, (S.TW - 0.2) * U);
        if (q.sys) { const ww = Math.min(S.TW - 0.2, textW(txt, 0.32) * 0.75) * U; g.fillStyle = `rgba(154,82,255,${age < 0.9 ? 0.9 - age * 0.6 : 0.35})`; g.fillRect(XI(0) - ww / 2, Yt + H - 3, ww, 3); if (age < 0.5) glitchBlocks(g, XI(0) - ww / 2, Yt, ww, H, t, q.id, 1 - age / 0.5); }
        g.textAlign = 'left'; continue; }
      // knocked loose by the phone: the empty slot (its outline fading over J.HOLE beats); shaking loose (the tail curl snapped off)
      const md = r.hole && s.mend ? s.mend[q.id] : null;   // (the story run: he landed on the slot — his glitch rebuilt her bubble under him)
      if (md != null && t >= md) { const a = (t - md) / J.MEND; drawBubble(s, t, tr, r, X0, Yt, W, H, false);
        if (a < 1) { glitchBlocks(g, X0, Yt, W, H, t, q.id + 41, 1 - a); } else { g.save(); g.globalAlpha = 0.55; g.strokeStyle = PURP[1]; g.lineWidth = Math.max(2, 0.04 * U); rr(g, X0 - 1, Yt - 1, W + 2, H + 2, Math.min(H / 2, 0.42 * U) + 1); g.stroke(); g.restore(); }
        continue; }
      if (r.hole) { const a = 1 - (t - r.knockT - J.SHAKE) / (J.HOLE * RG.P); if (a > 0) { g.save(); g.globalAlpha = 0.8 * a; g.strokeStyle = PURP[3]; g.lineWidth = Math.max(2, 0.06 * U); g.setLineDash([0.18 * U, 0.14 * U]); g.lineDashOffset = -t * 0.6 * U; rr(g, X0, Yt, W, H, Math.min(H / 2, 0.42 * U)); g.stroke(); g.restore(); } continue; }
      const jw = joltOn.get(q.id), sh = r.shake ? 0.06 * U : jw && tr < jw.j.hit ? (Math.floor(RG.beatOf(tr) * 2) % 2 ? 1 : -1) : 0;   // (the warning: it shivers a pixel on the half beats; the hit: it jitters loose)
      if (sh) { g.save(); g.translate((hash(Math.floor(t * 40), q.id) - 0.5) * 2 * sh, (r.shake ? -0.05 * U * r.shake : 0) + (r.shake ? (hash(Math.floor(t * 40), q.id + 5) - 0.5) * 2 * sh : 0)); }
      drawBubble(s, t, tr, r, X0, Yt, W, H, tail && r.knockT == null);
      if (sh) g.restore();
      if (q.ev != null) rcpt.set(q.ev, rcpt.has(q.ev) ? { x0: Math.min(rcpt.get(q.ev).x0, r.x0), x1: Math.max(rcpt.get(q.ev).x1, r.x1), y0: Math.min(rcpt.get(q.ev).y0, r.y0), y1: Math.max(rcpt.get(q.ev).y1, r.y1) } : { x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 });
      // her tapbacks: the reaction menu while it's his to send (the light), the badge (a bumper) once it's landed
      if (q.tap != null) { const e = P.events[q.tap], th = s.hits[q.tap];
        if (th == null && glitchEv(P, s, q, tr)) menus.push({ X0, Yt, e });
        if (th != null && t >= th) drawBadge(XI(r.x1 - 0.15), YI(r.y1 + 0.1), e.emoji, t - th); }
    }
    // the light: ONLY James's texts he can still glitch (never hers, never a Read one) — a steady purple rim with a pixel crawl; the
    // one he's standing on is digital glitching water round his feet
    for (const r of st) { if (r.dots || r.grey || r.q.ev == null) continue; const ge = glitchEv(P, s, r.q, tr); if (!ge) continue; const R0 = { x: XI(r.x0), y: YI(r.y1), w: r.ww * U, h: r.hh * U, r: Math.min(r.hh * U / 2, (r.q.photo ? 0.32 : 0.42) * U) };
      const left = clamp((ge.R - tr) / Math.max(0.1, ge.R - ge.A));
      if (on && on.q.id === r.q.id) drawWater(g, R0, { fx: XI(s.lx), t, land: t - s.landAt, beats: beatsAgo(t), u: U, seed: r.q.id, k: 1 });
      else drawShimmer(g, R0, { t, u: U, k: 1, left, pulse: beatPulse(t) }); }
    // the receipts: James's texts he can glitch carry Sent -> Delivered -> Read (the timer) to their left — big, with a countdown ring
    // that pulses on the beat (red as it runs out); when she READS one first it's stamped READ (and the old history comes down a step)
    for (const [i, a] of rcpt) { const e = P.events[i]; if (e.kind === 'tap' || t < e.A) continue; const o = s.out[i], age = t - e.R;
      if (o === 'V' || (o != null && age > 1.6)) continue;
      const his = o === 'P', k = clamp((t - e.A) / Math.max(0.1, e.R - e.A)), late = !his && o == null && k > 0.65;
      const txt = his ? 'Delivered' : o == null ? (k < 0.4 ? 'Sent' : 'Delivered') : 'Read 9:41 PM', cy = YI(Math.min(a.y1 - 0.5, (a.y0 + a.y1) / 2)), RR = 0.42 * U, rx = XI(a.x0) - 0.35 * U - RR;
      g.save(); g.globalAlpha = o != null ? clamp(1 - (age - 1.0) / 0.6) : clamp((t - e.A) / 0.12);
      if (o == null) { const pu = 1 + 0.12 * beatPulse(t);   // the ring: what's left of the time, his purple → red
        g.lineCap = 'butt'; g.lineWidth = 0.15 * U; g.strokeStyle = 'rgba(60,60,67,0.16)'; g.beginPath(); g.arc(rx, cy, RR * pu, 0, 7); g.stroke();
        g.strokeStyle = late ? RED : PURP[0]; g.beginPath(); g.arc(rx, cy, RR * pu, -Math.PI / 2, -Math.PI / 2 + 6.2832 * (1 - k)); g.stroke();
        g.fillStyle = late ? RED : PURP[0]; g.font = FONT(Math.round(0.36 * U), 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(Math.max(1, Math.ceil((e.R - t) / RG.P))), rx, cy + 1); }   // (beats left)
      g.font = FONT(Math.round(0.46 * U), 700); g.textAlign = 'right'; g.textBaseline = 'middle'; const lx = o == null ? rx - RR - 0.2 * U : XI(a.x0) - 0.3 * U;
      g.fillStyle = his ? PURP[0] : o === 'J' ? '#3a3a3c' : late ? RED : '#8e8e93'; g.fillText(his && t - s.hits[i] < 0.25 ? scramble(txt, t) : txt, lx, cy);
      g.restore();
      if (o === 'J' && age < 1.3) {   // READ: a stamp on the bubble (the moment's gone; James's words stand)
        const kk = ease(age / 0.12), fade = clamp(1 - (age - 0.9) / 0.4), cx = XI((a.x0 + a.x1) / 2), sy = YI((a.y0 + a.y1) / 2), sc = (1.5 - 0.5 * kk);
        g.save(); g.globalAlpha = fade; g.translate(cx, sy); g.rotate(-0.12); g.scale(sc, sc); g.font = FONT(Math.round(0.62 * U), 900); g.textAlign = 'center'; g.textBaseline = 'middle';
        const label = 'READ ✓✓', w = g.measureText(label).width + 0.6 * U, h = 0.95 * U;
        g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 0.1 * U; rr(g, -w / 2, -h / 2, w, h, 0.22 * U); g.fill(); g.stroke();
        g.fillStyle = RED; g.fillText(label, 0, 2); g.restore(); } }
    // the teaching stickers (the first ones he can glitch, before the thread can hurt him): what to press, and the clock it's racing
    for (const [i, a] of rcpt) { const e = P.events[i]; if (!e.teach || s.out[i] != null || t < e.A) continue;
      sticker(XI(a.x0) - 0.35 * U, YI(a.y1) - 0.95 * U, [[TOUCH ? 'TAP' : 'SPACE', 'key'], ['before it says READ', '']], 'right', clamp((t - e.A) / 0.15), t); }
    if (D.hint0 && tr >= D.hint0[0] && tr < D.hint0[1] && !s.gone) sticker(XI(0), YI(1.2), [[TOUCH ? 'drag ↓' : '↓', 'key'], ['drop down · stay with the newest text', '']], 'center', clamp((tr - D.hint0[0]) / 0.2) * clamp((D.hint0[1] - tr) / 0.2), t);
    // the BLOCKED banner (her block, dropping down the thread — only if she said it); it glitches apart where he went through it
    const wy = wallY(P, t, s);
    if (wy != null) { const y0 = YI(wy + 0.45), hh = 0.9 * U, thru = s.wallThru != null && t - s.wallThru < 0.6;
      g.save(); g.globalAlpha = thru ? 0.55 : 1; g.fillStyle = RED; rr(g, XI(S.CX0 - 0.6), y0, (S.TW + 1.2) * U, hh, 0.3 * U); g.fill();
      g.fillStyle = '#ffffff'; g.font = FONT(Math.round(0.48 * U), 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⊘  Blocked', XI(0), y0 + hh / 2); g.textAlign = 'left';
      if (thru) glitchBlocks(g, XI(s.lx - 1.4), y0, 2.8 * U, hh, t, 31, 1 - (t - s.wallThru) / 0.6); g.restore(); }
    if (P.jolts.length && s.jolt) drawJolts(s, t, tr, st);
    // the top: the OLD HISTORY. Every text she reads before he glitches it brings it down a step (grey, the Read pile, a torn pixel
    // edge); his rewrites push it back up. Carried up into it = lost. When he's near it, its edge warns red on the beat.
    { const top = histTop(s, tr), hy = YI(top);
      if (hy > yTop + 2) { g.save(); g.fillStyle = 'rgba(214,214,220,0.9)'; g.fillRect(0, yTop, ic.width, hy - yTop);
        const st8 = Math.max(4, Math.round(0.18 * U)), f = Math.floor(t * 8);
        g.fillStyle = 'rgba(214,214,220,0.9)'; for (let xx = 0; xx < ic.width; xx += st8) { const j = Math.floor(hash(xx / st8, f) * 3) * st8 * 0.5; g.fillRect(xx, hy, st8, j); }
        g.fillStyle = '#8e8e93'; for (let xx = 0; xx < ic.width; xx += st8 * 2) if (hash(xx, f + 3) < 0.25) g.fillRect(xx, hy - st8, st8, st8 * 0.5);
        const pillW = 3.4 * U, pillH = 0.62 * U, py = Math.max(yTop + 0.15 * U, hy - pillH - 0.2 * U); g.fillStyle = 'rgba(142,142,147,0.95)'; rr(g, XI(0) - pillW / 2, py, pillW, pillH, pillH / 2); g.fill();
        g.fillStyle = '#ffffff'; g.font = FONT(Math.round(0.34 * U), 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Read ✓✓ · old history', XI(0), py + pillH / 2 + 1); g.restore(); }
      const near = s.gone ? 0 : clamp((s.ly - (top - F.WARN)) / (F.WARN - F.LOSE)), hit = s.readAt && s.readAt.cost && t - s.readAt.t < 0.4 ? 1 - (t - s.readAt.t) / 0.4 : 0;
      if (near > 0 || hit > 0) { const a = Math.max(0.32 * near * (0.7 + 0.3 * beatPulse(t)), 0.45 * hit), gr = g.createLinearGradient(0, hy, 0, hy + 2.6 * U); gr.addColorStop(0, `rgba(255,59,48,${a})`); gr.addColorStop(1, 'rgba(255,59,48,0)'); g.fillStyle = gr; g.fillRect(0, hy, ic.width, 2.6 * U); } }
    // on the beat: a glitch (a rewrite or a jump) right on the beat throws a ring of his pixels
    if (s.obAt != null && t - s.obAt < 0.4 && t >= s.obAt) { const k = (t - s.obAt) / 0.4, cx = XI(s.lx), cy = YI(s.ly + 0.5), n = 18, st8 = Math.max(4, Math.round(0.14 * U));
      g.save(); for (let i = 0; i < n; i++) { const ang = i / n * 6.2832, r0 = (0.5 + 2.2 * ease(k)) * U; g.globalAlpha = 1 - k; g.fillStyle = i % 5 === 0 ? GREEN : PURP[i % 4];
        g.fillRect(Math.round((cx + Math.cos(ang) * r0) / st8) * st8, Math.round((cy + Math.sin(ang) * r0 * 0.7) / st8) * st8, st8, st8); } g.restore(); }
    // a bounce off the bar: a ring where he hit it
    if (s.barAt != null && t - s.barAt < 0.35 && t >= s.barAt) { const k = (t - s.barAt) / 0.35; g.save(); g.strokeStyle = [PURP[1], PURP[2], RED, RED][s.barN || 0];   /* (the third in a row is red: the next one throws him up) */ g.globalAlpha = 1 - k; g.lineWidth = 5; g.beginPath(); g.ellipse(XI(s.lx), yBot, (0.3 + 1.6 * k) * U, (0.1 + 0.4 * k) * U, 0, 0, 7); g.stroke(); g.restore(); }
    g.restore();
    for (const m of menus) drawMenu(m.X0, m.Yt, m.e, tr);
  }
  // a text bubble — his rewrite when his version went out (the void, his purple rim, his words in lilac; the stretch is his static).
  // (pulled out of drawThread, Nov 3, so a bubble the phone knocks loose falls as exactly the same bubble)
  function drawBubble(s, t, tr, r, X0, Yt, W, H, tail) { const q = r.q;
    const mine = r.mine && r.k > 0.02, B = mine ? q.gl : q.nice || q, fill = mine ? '#160832' : q.who === 'S' ? GREY : BLUE, ink = mine ? PURP[3] : q.who === 'S' ? '#000000' : '#ffffff', Rr = Math.min(H / 2, 0.42 * U);
    g.save();
    if (q.who === 'S') { const age = tr - q.a; if (age >= 0 && age < 0.42) { const bs = 1 + 0.06 * Math.sin(Math.PI * age / 0.42); g.translate(X0, Yt + H); g.scale(bs, bs); g.translate(-X0, -(Yt + H)); } }   // (hers pop as they land)
    g.fillStyle = fill; rr(g, X0, Yt, W, H, Rr); g.fill();
    if (tail) drawTail(g, q.who === 'S' ? X0 : X0 + W, Yt + H, q.who === 'S' ? -1 : 1, fill, Rr);
    if (mine) {   // the stretch: his static in it
      g.save(); rr(g, X0, Yt, W, H, Rr); g.clip(); const f = Math.floor(t * 12);
      for (let i = 0; i < 40; i++) { const px = X0 + hash(i, f + q.id) * W, py = Yt + hash(i + 9, f) * H; g.fillStyle = hash(i, f + 3) < 0.15 ? GREEN : PURP[i % 3]; g.globalAlpha = 0.25 + 0.4 * hash(i + 4, f); g.fillRect(Math.round(px / 4) * 4, Math.round(py / 4) * 4, 4, 4); }
      g.restore(); g.strokeStyle = PURP[0]; g.lineWidth = 4; rr(g, X0 - 1, Yt - 1, W + 2, H + 2, Rr + 1); g.stroke(); }
    g.font = FONT(Math.round(S.FS * U), mine ? 600 : 400); g.textBaseline = 'middle';
    const lh = S.LH * U, ty = Yt + S.PADY * U + lh / 2, scr = mine && t - s.rowP[q.row.t.toFixed(3)] < 0.3, tx0 = mine ? X0 + (W - textW(B.lines.reduce((a, l) => textW(l) > textW(a) ? l : a, '')) * U) / 2 : X0 + S.PADX * U;   // (his: the words centred on his ledge)
    if (q.who === 'S' && r.ww < q.w - 0.05) { g.save(); rr(g, X0, Yt, W, H, Rr); g.clip(); g.globalAlpha = clamp((r.ww / q.w - 0.4) / 0.6); }
    if (mine && r.k < 1) { g.save(); rr(g, X0, Yt, W, H, Rr); g.clip(); }   // (his words, while the bubble's still stretching to fit them)
    if (mine) { g.save(); g.globalAlpha = 0.6; g.fillStyle = PURP[2]; B.lines.forEach((l, i) => g.fillText(l, tx0 - 2, ty + i * lh)); g.restore(); }
    g.fillStyle = ink; B.lines.forEach((l, i) => g.fillText(scr ? scramble(l, t) : l, tx0, ty + i * lh));
    if (q.who === 'S' && r.ww < q.w - 0.05) g.restore();
    if (mine && r.k < 1) g.restore();
    if (mine && r.k < 1) glitchBlocks(g, X0, Yt, W, H, t, q.id, 1 - r.k);
    g.restore();
  }
  function sticker(x, y, parts, align, a, t) {   // a sticker (Vega's style: white, a thick dark outline; the old thin white border only with ?border=, D-20261105-09) — parts: [text, 'key' (a keycap) | '']
    if (a <= 0) return; g.save(); g.globalAlpha = a; const fs = 0.44 * U, pad = 0.22 * U, gap = 0.18 * U, h = 0.86 * U;
    const ws = parts.map(([tx, kind]) => { g.font = FONT(Math.round(kind ? fs * 0.9 : fs), kind ? 800 : 700); return g.measureText(tx).width + (kind ? 0.36 * U : 0); });
    const W = ws.reduce((p, w) => p + w, 0) + gap * (parts.length - 1) + 2 * pad, x0 = align === 'right' ? x - W : align === 'center' ? x - W / 2 : x, y0 = y - h / 2, wob = Math.sin(t * 5) * 0.015;
    g.translate(x0 + W / 2, y); g.rotate(-0.03 + wob); g.translate(-(x0 + W / 2), -y);
    if (OLD_WHITE) { g.fillStyle = '#ffffff'; rr(g, x0 - 0.1 * U, y0 - 0.1 * U, W + 0.2 * U, h + 0.2 * U, 0.3 * U); g.fill(); }
    g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 0.08 * U; rr(g, x0, y0, W, h, 0.24 * U); g.fill(); g.stroke();
    let xx = x0 + pad; g.textBaseline = 'middle'; g.textAlign = 'left';
    parts.forEach(([tx, kind], i) => { if (kind) { const kh = h - 0.24 * U, pu = 1 + 0.06 * beatPulse(t); g.save(); g.translate(xx + ws[i] / 2, y); g.scale(pu, pu); g.fillStyle = PURP[0]; rr(g, -ws[i] / 2, -kh / 2, ws[i], kh, 0.14 * U); g.fill();
        g.fillStyle = '#ffffff'; g.font = FONT(Math.round(fs * 0.9), 800); g.textAlign = 'center'; g.fillText(tx, 0, 1); g.restore(); }
      else { g.fillStyle = INK; g.font = FONT(Math.round(fs), 700); g.fillText(tx, xx, y + 1); }
      xx += ws[i] + gap; });
    g.restore(); g.textAlign = 'left';
  }
  function drawMenu(X0, Yt, e, t) {   // the reaction menu above her bubble (the reaction Potato's going for glows)
    const W = 4.6 * U, H = 0.8 * U, y = Yt - 0.12 * U - H, k = ease((t - e.her.a) / 0.15), EM = ['❤️', '👍', '👎', '😂', '‼️', '❓'];
    g.save(); g.globalAlpha = k; g.shadowColor = 'rgba(0,0,0,0.2)'; g.shadowBlur = 14; g.fillStyle = '#f2f2f7'; rr(g, X0, y, W, H, H / 2); g.fill(); g.shadowBlur = 0;
    g.font = FONT(Math.round(0.44 * U)); g.textAlign = 'center'; g.textBaseline = 'middle';
    EM.forEach((em, i) => { const cx = X0 + W * (i + 0.5) / 6, cy = y + H / 2;
      if (em === e.emoji) { const pu = beatPulse(t); g.save(); g.fillStyle = `rgba(154,82,255,${0.35 + 0.35 * pu})`; g.beginPath(); g.arc(cx, cy, (0.34 + 0.05 * pu) * U, 0, 7); g.fill(); g.restore(); }
      g.fillText(em, cx, cy + 1); });
    g.restore(); g.textAlign = 'left';
  }
  function drawBadge(cx, cy, em, age) {   // Potato's tapback, on her bubble's corner (it's a bumper now)
    const k = ease(age / 0.18) * (1 + 0.25 * Math.max(0, 1 - age / 0.3)), r = S.BADGE * U * k;
    g.save(); g.fillStyle = BLUE; g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); g.fill();
    g.font = FONT(Math.round(0.42 * U * k)); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(em, cx, cy + 1);
    if (age < 0.5) glitchBlocks(g, cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2, age + 50, 3, 1 - age / 0.5);
    g.restore(); g.textAlign = 'left';
  }
  // ---------- the input bar: + · the field (James typing his next text) · send ----------
  function drawBar(s, t, tr) {
    const y0 = YI(S.BAR), H = ic.height - y0, cy = YI(-7.0), fh = 0.8 * U, fx0 = XI(-HW + 1.65), fx1 = XI(HW - 1.0);
    g.fillStyle = '#ffffff'; g.fillRect(0, y0, ic.width, H); g.fillStyle = '#e5e5ea'; g.fillRect(0, y0, ic.width, 2);
    const pbx = XI(-HW + 0.85), ready = s.charge && t >= O.ctl && !s.gone;   // (the + is his glitch: purple when it's ready — the engine's own light is off here)
    g.fillStyle = ready ? PURP[0] : GREY; g.beginPath(); g.arc(pbx, cy, fh * 0.48 * (ready ? 1 + 0.08 * beatPulse(t) : 1), 0, 7); g.fill();
    if (!ready && s.useT != null && t >= O.ctl) { const k = clamp((t - s.useT) / (F.RECH * RG.P)); g.strokeStyle = PURP[1]; g.lineWidth = 4; g.beginPath(); g.arc(pbx, cy, fh * 0.48, -Math.PI / 2, -Math.PI / 2 + 6.2832 * k); g.stroke(); }
    g.strokeStyle = ready ? '#ffffff' : '#8e8e93'; g.lineWidth = 4; g.beginPath(); g.moveTo(pbx - fh * 0.2, cy); g.lineTo(pbx + fh * 0.2, cy); g.moveTo(pbx, cy - fh * 0.2); g.lineTo(pbx, cy + fh * 0.2); g.stroke();
    const kick = s.barAt != null && t - s.barAt < 0.3 && t >= s.barAt ? 1 - (t - s.barAt) / 0.3 : 0;
    g.fillStyle = '#ffffff'; g.strokeStyle = kick > 0 ? mix('#c7c7cc', '#9a52ff', kick) : '#c7c7cc'; g.lineWidth = 2 + 4 * kick; rr(g, fx0, cy - fh / 2, fx1 - fx0, fh, fh / 2); g.fill(); g.stroke();
    let q = null; for (const it of P.items) { if (it.a > tr + 1.5) break; if (it.who === 'J' && it.text && it.ts <= tr && tr < it.a && visible(s, it)) q = it; }
    g.font = FONT(Math.round(S.FS * U)); g.textBaseline = 'middle'; g.textAlign = 'left';
    if (q) { const n = [...q.text].length, a = clamp((tr - q.ts) / Math.max(0.05, q.a - q.ts - 0.08)), txt = [...q.text].slice(0, Math.max(1, Math.round(a * n))).join('');
      g.fillStyle = '#000000'; g.fillText(txt, fx0 + 0.35 * U, cy, fx1 - fx0 - 1.4 * U);
      if ((t * 2) % 1 < 0.6) { const cx = Math.min(fx1 - 1.2 * U, fx0 + 0.35 * U + g.measureText(txt).width + 3); g.fillStyle = BLUE; g.fillRect(cx, cy - fh * 0.3, 3, fh * 0.6); }
      const sx = fx1 - fh / 2, r = fh * 0.38; g.fillStyle = BLUE; g.beginPath(); g.arc(sx, cy, r, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(sx, cy + r * 0.5); g.lineTo(sx, cy - r * 0.5); g.moveTo(sx - r * 0.38, cy - r * 0.12); g.lineTo(sx, cy - r * 0.5); g.lineTo(sx + r * 0.38, cy - r * 0.12); g.stroke(); }
    else { g.fillStyle = '#b4b4b9'; g.fillText('iMessage', fx0 + 0.35 * U, cy); }
  }
  // ---------- the header: the status bar, the Dynamic Island (the lyrics play in it), ‹ back + his count, her avatar + name ----------
  function drawHeader(s, t) {
    const yb = YI(S.HB); g.fillStyle = '#f7f7f7'; g.fillRect(0, 0, ic.width, yb); g.fillStyle = '#d1d1d6'; g.fillRect(0, yb - 1, ic.width, 2);
    const sy = YI(7.0); g.fillStyle = '#000000'; g.font = FONT(Math.round(0.4 * U), 600); g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText('9:41', XI(-HW + 2.0), sy);
    { const bx = XI(HW - 2.4), by = sy; g.strokeStyle = '#000'; g.lineWidth = 3; rr(g, bx, by - 0.14 * U, 0.66 * U, 0.3 * U, 6); g.stroke(); g.fillStyle = '#000'; rr(g, bx + 4, by - 0.14 * U + 4, 0.66 * U * 0.72 - 4, 0.3 * U - 8, 3); g.fill(); g.fillRect(bx + 0.66 * U + 2, by - 5, 4, 10);
      for (let i = 0; i < 4; i++) g.fillRect(bx - 0.85 * U + i * 0.15 * U, by + 0.14 * U - (i + 1) * 0.07 * U, 0.1 * U, (i + 1) * 0.07 * U); }
    // the island: a black pill at the top; it opens wide while a line of the song plays (the lyrics are drawn into it: over())
    { const want = curLine(t) ? 11.4 : 3.4; islandW += (want - islandW) * 0.12; const w = islandW * U, h = 0.95 * U; g.fillStyle = '#000000'; rr(g, XI(0) - w / 2, sy - h / 2, w, h, h / 2); g.fill(); }
    const cy = YI(5.95); g.strokeStyle = BLUE; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round'; const bx0 = XI(-HW + 0.8);
    g.beginPath(); g.moveTo(bx0 + 0.3 * U, cy - 0.3 * U); g.lineTo(bx0, cy); g.lineTo(bx0 + 0.3 * U, cy + 0.3 * U); g.stroke();
    if (s.glitched > 0) { const n = String(s.glitched), w = (0.4 + 0.22 * n.length) * U, pop = s.rewT != null && t - s.rewT < 0.25 ? 1 + 0.4 * (1 - (t - s.rewT) / 0.25) : 1;   // (his count, where the unread count goes)
      g.save(); g.translate(bx0 + 0.5 * U + w / 2, cy); g.scale(pop, pop); g.fillStyle = PURP[0]; rr(g, -w / 2, -0.26 * U, w, 0.52 * U, 0.26 * U); g.fill(); g.fillStyle = '#fff'; g.font = FONT(Math.round(0.34 * U), 700); g.textAlign = 'center'; g.fillText(n, 0, 1); g.restore(); }
    const grp = GRP.filter(q => isP(s, q) && t >= q.a + 0.05).map(q => q.grp), names = ['Sheila', ...grp.filter(x => x[0] !== '+')], more = grp.find(x => x[0] === '+');
    const n = names.length, ar = (n > 1 ? 0.38 : 0.46) * U, step = ar * 1.15, ax0 = XI(0) - (n - 1) * step / 2, COLS = [['#a6abb6', '#858a95'], ['#c9a7a0', '#a3827b'], ['#a9bfa6', '#879d84']];
    for (let i = n - 1; i >= 0; i--) { const ax = ax0 + i * step, gr = g.createLinearGradient(0, cy - ar, 0, cy + ar); gr.addColorStop(0, COLS[i % 3][0]); gr.addColorStop(1, COLS[i % 3][1]);
      g.fillStyle = gr; g.strokeStyle = '#f7f7f7'; g.lineWidth = 5; g.beginPath(); g.arc(ax, cy, ar, 0, 7); g.fill(); if (n > 1) g.stroke(); g.fillStyle = '#ffffff'; g.font = FONT(Math.round(ar), 500); g.textAlign = 'center'; g.fillText(names[i][0], ax, cy + 2); }
    if (more) { const bx = ax0 + (n - 1) * step + ar * 0.9, by = cy + ar * 0.6; g.fillStyle = BLUE; rr(g, bx - 0.36 * U, by - 0.19 * U, 0.76 * U, 0.38 * U, 0.19 * U); g.fill(); g.fillStyle = '#fff'; g.font = FONT(Math.round(0.26 * U), 700); g.fillText(more, bx + 0.02 * U, by + 1); }
    const title = n === 1 ? 'Sheila' : n === 2 && !more ? 'Sheila & Carol' : names.join(', ') + (more ? ' ' + more : '');
    g.fillStyle = '#000000'; g.font = FONT(Math.round(0.32 * U)); g.fillText(title + ' ›', XI(0), YI(5.27), ic.width * 0.5); g.textAlign = 'left';
    g.strokeStyle = BLUE; g.lineWidth = 5; const vx = XI(HW - 1.4); rr(g, vx - 0.4 * U, cy - 0.22 * U, 0.52 * U, 0.44 * U, 8); g.stroke(); g.beginPath(); g.moveTo(vx + 0.16 * U, cy - 0.06 * U); g.lineTo(vx + 0.42 * U, cy - 0.2 * U); g.lineTo(vx + 0.42 * U, cy + 0.2 * U); g.lineTo(vx + 0.16 * U, cy + 0.06 * U); g.stroke();
  }
  function drawSlider(k, p) {   // "slide to power off" (the phone's own)
    g.fillStyle = `rgba(0,0,0,${0.55 * k})`; g.fillRect(0, 0, ic.width, ic.height);
    const W = 9.5 * U, H = 1.3 * U, x0 = XI(0) - W / 2, y0 = YI(4.4);
    g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(235,235,240,0.92)'; rr(g, x0, y0, W, H, H / 2); g.fill();
    g.fillStyle = '#3a3a3c'; g.font = FONT(Math.round(0.44 * U)); g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = k * (1 - p * 0.9); g.fillText('slide to power off', x0 + W / 2 + H / 2, y0 + H / 2); g.globalAlpha = k; g.textAlign = 'left';
    const r = H / 2 - 7, kx = x0 + 7 + r + p * (W - 2 * r - 14), ky = y0 + H / 2; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(kx, ky, r, 0, 7); g.fill();
    g.strokeStyle = RED; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.arc(kx, ky + 2, r * 0.45, -1.0, 4.14); g.stroke(); g.beginPath(); g.moveTo(kx, ky - r * 0.55); g.lineTo(kx, ky - r * 0.05); g.stroke();
    g.restore();
  }
  function drawLost(s, t) {   // carried up into the old history: his purple smeared up into the header, "loading" up top, the screen dies
    const a = t - s.failT, cx = XI(s.lx);
    if (a < FAIL.pull + 0.3) glitchBlocks(g, cx - 1.0 * U, YI(S.HB + 0.4), 2.0 * U, 2.6 * U, t, 71, 1 - a / (FAIL.pull + 0.3));
    if (a < FAIL.dim + 0.3) { const sx = XI(0), sy = YI(S.HB - 0.75); g.save(); g.translate(sx, sy); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillStyle = `rgba(60,60,67,${0.15 + 0.6 * (((i + Math.floor(t * 12)) % 8) / 8)})`; rr(g, -0.05 * U, -0.36 * U, 0.1 * U, 0.2 * U, 0.05 * U); g.fill(); } g.restore(); }
    if (s.why0 === 'blocked' && a < 0.5) { g.save(); g.globalAlpha = 1 - a / 0.5; g.fillStyle = RED; g.fillRect(0, YI(s.ly + 1.0), ic.width, 0.5 * U); g.restore(); }
    if (a > FAIL.dim) { g.fillStyle = `rgba(0,0,0,${ease((a - FAIL.dim) / (FAIL.black - FAIL.dim))})`; g.fillRect(0, 0, ic.width, ic.height); }
  }
  function drawBoot(a) {   // after a phone-off it boots back up: black, his potato logo, a progress bar — then the thread fades back in
    const k = a < BOOT.logo ? 1 : 1 - ease((a - BOOT.logo) / BOOT.fade), W = ic.width, H = ic.height, cx = W / 2, cy = H * 0.46, u = 1.6 * U;
    g.save(); g.globalAlpha = k; g.fillStyle = '#000000'; g.fillRect(0, 0, W, H);
    g.globalAlpha = k * clamp(a / 0.18); g.fillStyle = '#f2f2f2';   // the logo: a lumpy potato, white, its eyes cut out
    g.beginPath(); g.moveTo(cx - 0.95 * u, cy - 0.05 * u); g.bezierCurveTo(cx - 1.0 * u, cy - 0.62 * u, cx - 0.35 * u, cy - 0.72 * u, cx + 0.05 * u, cy - 0.58 * u);
    g.bezierCurveTo(cx + 0.5 * u, cy - 0.78 * u, cx + 1.08 * u, cy - 0.5 * u, cx + 1.02 * u, cy + 0.02 * u); g.bezierCurveTo(cx + 0.98 * u, cy + 0.52 * u, cx + 0.45 * u, cy + 0.66 * u, cx + 0.02 * u, cy + 0.55 * u);
    g.bezierCurveTo(cx - 0.42 * u, cy + 0.68 * u, cx - 0.92 * u, cy + 0.5 * u, cx - 0.95 * u, cy - 0.05 * u); g.fill();
    g.fillStyle = '#9a9aa0'; for (const [ex, ey, er] of [[-0.55, -0.18, 0.07], [0.1, -0.3, 0.055], [0.62, 0.05, 0.065], [-0.18, 0.3, 0.05]]) { g.beginPath(); g.ellipse(cx + ex * u, cy + ey * u, er * u * 1.4, er * u, 0.4, 0, 7); g.fill(); }
    const bw = 3.2 * U, by = cy + 1.25 * u, p = clamp((a - 0.15) / (BOOT.logo - 0.25));
    g.fillStyle = '#3a3a3c'; rr(g, cx - bw / 2, by, bw, 0.1 * U, 4); g.fill(); g.fillStyle = '#f2f2f2'; rr(g, cx - bw / 2, by, bw * p, 0.1 * U, 4); g.fill();
    g.restore();
  }
  function drawEscape(s, t) {   // he's out: rays of his light out through the glass, his shape flying at us
    const a = t - s.goneAt, gf = s.goneFrom || { lx: 0, ly: -1 }, cx = XI(gf.lx), cy = YI(gf.ly + 0.7); if (a > 0.6) return;
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 28; i++) { const ang = i / 28 * 6.283 + hash(i, 1) * 0.2, r0 = (0.4 + a * 14) * U * (0.5 + 0.5 * hash(i, 2)), r1 = r0 + (1.3 + 3 * hash(i, 3)) * U;
      g.strokeStyle = i % 4 === 0 ? '#ffffff' : PURP[i % 3]; g.globalAlpha = 0.9 * (1 - a / 0.6); g.lineWidth = 5 + 8 * hash(i, 4); g.beginPath(); g.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); g.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); g.stroke(); }
    const g2 = g.createRadialGradient(cx, cy, 0, cx, cy, (1.6 + 9 * a) * U); g2.addColorStop(0, `rgba(233,230,255,${0.95 * (1 - a / 0.6)})`); g2.addColorStop(1, 'rgba(233,230,255,0)'); g.globalAlpha = 1; g.fillStyle = g2; g.fillRect(0, 0, ic.width, ic.height);
    g.restore();
  }
  // ---- in play the lyrics live in the Dynamic Island (top centre, black): the same glitch text, one or two rows, fitted to it ----
  const curLine = t => { let L = null; for (const l of LLINES) { if (l.t0 <= t + 0.001) L = l; else break; } return L && Math.min(L.next, L.t1 + 2.2) - t >= -0.01 ? L : null; };
  function islandLyrics(ctx, f) {
    const t = f.t, b = f.b, L = curLine(t); if (!L || islandW < 6) return;
    const a = f.project(SC[0] + Z * (-islandW / 2 + 0.55), SC[1] + Z * (7.0 + 0.42)), c = f.project(SC[0] + Z * (islandW / 2 - 0.55), SC[1] + Z * (7.0 - 0.42)), BW = c.x - a.x, BH = c.y - a.y; if (BW < 40 || BH < 8) return;
    const seed = Math.floor(t * 24), out = Math.min(L.next, L.t1 + 2.2) - t, exiting = out < 0.18;
    const toks = L.ws.map((w, k) => { const bare = w.text.replace(/[^a-z0-9']/gi, '').toLowerCase(); return { w, k, s: LYK.has(bare) ? 1.18 : 1, key: LYK.has(bare) || (w.t1 ?? w.t0) - w.t0 > 0.6, txt: w.text.toLowerCase() }; });
    const meas = sz => { for (const it of toks) { ctx.font = LFONT(sz * it.s); it.wd = ctx.measureText(it.txt).width; } };
    let SZ = BH * 0.62; meas(SZ); const tot = () => toks.reduce((acc, it) => acc + it.wd, 0) + SZ * 0.45 * (toks.length - 1);
    let rows; if (tot() <= BW) rows = [toks]; else { SZ = BH * 0.4; meas(SZ); rows = [[]]; let rw = 0; const half = tot() / 2;
      for (const it of toks) { if (rw > half * 0.92 && rows.length < 2 && rows[0].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(it); rw += it.wd + SZ * 0.45; } }
    const rowW = row => row.reduce((acc, it) => acc + it.wd, 0) + SZ * 0.45 * (row.length - 1), fit = Math.min(1, ...rows.map(r => BW / Math.max(1, rowW(r))));
    ctx.save(); ctx.beginPath(); ctx.rect(a.x - 6, a.y - 4, BW + 12, BH + 8); ctx.clip();
    rows.forEach((row, ri) => { let xx = a.x + (BW - rowW(row) * fit) / 2; const yy = a.y + BH * (rows.length === 1 ? 0.56 : ri ? 0.82 : 0.36);
      for (const it of row) { const wd = it.wd * fit, age = t - it.w.t0; if (age < 0) { xx += wd + SZ * 0.45 * fit; continue; }
        const k = clamp(age / 0.15), sc = (1 + (1 - k) * 0.25) * fit, al = clamp(age / 0.06), fresh = age < 0.3, beatGlitch = it.key && Math.floor(b) % 4 === 3 && (b % 1) < 0.18;
        let jx = 0, jy = 0; if (exiting || (it.key && fresh) || beatGlitch) { jx = (hash(it.k, seed) - 0.5) * 8; jy = (hash(it.k, seed + 1) - 0.5) * 4; }
        ctx.save(); ctx.translate(xx + wd / 2 + jx, yy + jy); ctx.scale(sc, sc); ctx.globalAlpha = al * (exiting ? 0.6 : 1); ctx.font = LFONT(SZ * it.s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let txt = it.txt; const landing = age < 0.26;
        if (landing) { const stp = Math.floor(age / 0.26 * 4), sd = it.k * 7 + stp;   // the scramble: glitch speech -> another face -> binary -> the lyric
          if (stp === 0 && GWORDS.length) { txt = GWORDS[Math.floor(hash(it.k + L.i * 31, 11) * GWORDS.length)]; ctx.font = ALTF[Math.floor(hash(it.k, 12) * ALTF.length)](SZ * it.s); }
          else if (stp === 1) ctx.font = ALTF[Math.floor(hash(sd, 13) * ALTF.length)](SZ * it.s);
          else if (stp === 2) txt = [...it.txt].map((ch, i) => ch.trim() ? (hash(it.k + i, Math.floor(t * 30)) > 0.5 ? '1' : '0') : ch).join('');
          const mw = Math.max(it.wd, SZ * 2.4); if (ctx.measureText(txt).width > mw) { const q = mw / ctx.measureText(txt).width; ctx.scale(q, q); } }
        if (landing || exiting || (it.key && fresh) || beatGlitch) { ctx.fillStyle = SPLIT[0]; ctx.fillText(txt, -2, 0); ctx.fillStyle = SPLIT[1]; ctx.fillText(txt, 2, 0); }
        ctx.fillStyle = landing ? GCOL[Math.floor(hash(it.k, Math.floor(t * 30)) * GCOL.length)] : LYC; ctx.fillText(txt, 0, 0); ctx.restore();
        xx += wd + SZ * 0.45 * fit; } });
    ctx.restore();
  }
  let lastT = -9, phoneBody = null;
  return {
    draw(f) {
      camera(f); tableFx(f); sounds(f.s);
      const { s, t } = f;
      // the phone (upright, always) buzzes on the table when her text lands (+ the ding)
      phoneG.rotation.z = 0;
      const bz = O.notify != null && t >= O.notify && t < O.notify + 0.45 ? 1 - (t - O.notify) / 0.45 : 0;
      phoneG.position.set(PCX + (bz ? (hash(Math.floor(t * 75), 1) - 0.5) * 0.16 * bz : 0), PCY + (bz ? (hash(Math.floor(t * 75), 2) - 0.5) * 0.1 * bz : 0), 0);
      if (O.notify != null && lastT < O.notify && t >= O.notify && t - O.notify < 0.2) SFX.checkpoint();
      if (s.jolt && t > lastT && t - lastT < 0.1 && Math.floor(RG.beatOf(t) * 2) !== Math.floor(RG.beatOf(lastT) * 2) && P.jolts.some(j => s.jolt[j.i] && s.jolt[j.i].st === 'warn')) SFX.click();   // (a jolt building: a soft electric tick on the half beats)
      lastT = t;
      // which screen: the phone's own (its lock screen; dark again at the end) or the inside one, which grows to fill the screen
      const insideOn = t >= O.wake && !(end.black != null && t >= end.black + 0.28), wideNow = insideOn && t >= O.wide0;
      phoneBody = phoneBody || world.getObjectByName('ghost-phone-body'); if (phoneBody) phoneBody.visible = !wideNow; scr.m.visible = !wideNow; ins.m.visible = insideOn;
      if (!wideNow) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); x.save(); rr(x, 0, 0, cv.width, cv.height, G.RAD * PX); x.clip();
        drawLock(t, s); x.fillStyle = '#000000'; rr(x, X(-0.58), Y(G.Y1 - 0.1), 1.16 * PX, 0.34 * PX, 0.17 * PX); x.fill(); x.restore(); tex.needsUpdate = true; }
      if (insideOn) { drawInside(s, t); ins.tx.needsUpdate = true; }
    },
    over(ctx, f) { if (f.t < O.wide0) lyrics(ctx, f.t, f.b); else if (ins.m.visible && f.t < (end.black ?? 1e9)) islandLyrics(ctx, f);
      if (end.black != null && f.t >= end.black + 0.3 && f.s && f.s.out) endCount(ctx, f); },
  };
  // ---------- the lock screen (the opening): upright on the table, it lights, glitches, he's on it; Sheila's text comes in as we
  // come in; at 7.88 her notification opens into the thread ----------
  function drawLock(t, s) {
    const W = cv.width, H = cv.height, on = screenOn(t), k = lockK(O, t), th = -Math.PI / 2 * (1 - k);
    x.fillStyle = '#030405'; x.fillRect(0, 0, W, H);
    { const gr = x.createLinearGradient(0, 0, W * 0.25, H * 1.4); gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, W, H); }   // (dark glass catches the lamp)
    const g = t < O.glitch0 ? 0 : t < O.appear ? ease((t - O.glitch0) / (O.appear - O.glitch0)) : Math.max(0, 1 - (t - O.appear) / 0.55);
    const blip = t > O.appear + 0.55 && t < O.wake && (C.beatOf(t) % 2) < 0.1 ? 0.35 : 0, gg = Math.max(g, blip);
    if (on <= 0) return;
    // the layout, between upright (k 0) and sideways (k 1), in phone units from the centre, upright to us
    const A = LOCK.P, B = LOCK.L, mx = (a, b) => a + (b - a) * k, at = key => A[key].map((v, i) => mx(v, B[key][i]));
    const bw = mx(A.bw, B.bw), bh = mx(A.bh, B.bh), c = LS / 2, U = v => c + v * PX, V = v => c - v * PX, l = lg;
    l.setTransform(1, 0, 0, 1, 0, 0); l.clearRect(0, 0, LS, LS); l.save(); l.globalAlpha = on;
    { const gr = l.createLinearGradient(U(-bw / 2), V(bh / 2), U(bw / 2), V(-bh / 2)); gr.addColorStop(0, '#0d1f3f'); gr.addColorStop(0.55, '#123f4c'); gr.addColorStop(1, '#2a1a4f'); l.fillStyle = gr; l.fillRect(0, 0, LS, LS);
      for (const [bx, by, br, bc] of [[0.2, 0.75, 0.5, 'rgba(60,200,190,0.28)'], [0.8, 0.3, 0.45, 'rgba(140,90,255,0.26)'], [0.55, 0.95, 0.35, 'rgba(255,170,110,0.16)']]) {
        const px = U(-bw / 2 + bx * bw), py = V(bh / 2 - by * bh), rad = Math.max(bw, bh) * br * PX, g2 = l.createRadialGradient(px, py, 0, px, py, rad); g2.addColorStop(0, bc); g2.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = g2; l.fillRect(0, 0, LS, LS); } }
    l.fillStyle = 'rgba(255,255,255,0.92)'; l.textAlign = 'center'; l.textBaseline = 'middle';
    // the status bar (charging: the cable's in)
    { const [sx, sy] = at('stat'), bx = U(sx) - 0.14 * PX, by = V(sy), bw2 = 0.27 * PX, bh2 = 0.12 * PX; l.strokeStyle = 'rgba(255,255,255,0.85)'; l.lineWidth = 2; rr(l, bx - bw2 / 2, by - bh2 / 2, bw2, bh2, 4); l.stroke();
      l.fillStyle = '#4cd964'; rr(l, bx - bw2 / 2 + 3, by - bh2 / 2 + 3, (bw2 - 6) * 0.8, bh2 - 6, 2); l.fill(); l.fillStyle = 'rgba(255,255,255,0.85)'; l.fillRect(bx + bw2 / 2 + 2, by - 4, 3, 8);
      for (let i = 0; i < 4; i++) l.fillRect(bx - bw2 / 2 - 0.36 * PX + i * 0.055 * PX, by + 0.05 * PX - (i + 1) * 0.026 * PX, 0.035 * PX, (i + 1) * 0.026 * PX); l.fillStyle = 'rgba(255,255,255,0.92)'; }
    // the time, big at the top (it glitches to 4:04 when he creeps in), the date under it — Thursday
    const b = C.beatOf(t), gk = t >= O.glitch0 && t < O.appear + 0.15 ? hash(Math.floor(t * 14), 3) < 0.35 : t > O.appear && t < O.wake && Math.floor(b) % 4 === 3 && b % 1 < 0.12;
    { const [tx0, ty0, ts] = at('time'), [dx0, dy0, ds] = at('date'), cx = U(tx0), cy = V(ty0);
      l.font = FONT(Math.round(ts * PX), 700); l.fillText(gk ? '4:04' : '9:41', cx + (gk ? (hash(t, 2) - 0.5) * 18 : 0), cy);
      if (gk) { l.save(); l.globalAlpha = 0.6 * on; l.fillStyle = PURP[2]; l.fillText('4:04', cx - 7, cy); l.fillStyle = PURP[0]; l.globalAlpha = 0.35 * on; l.fillText('4:04', cx + 7, cy); l.restore(); }
      l.font = FONT(Math.round(ds * PX), 600); l.fillText('Thursday, October 29', U(dx0), V(dy0)); }
    // Sheila's text, coming in: a real notification (the Messages icon, her name, the first line of it, "now") — it slides down, the phone buzzes
    if (O.notify != null && t >= O.notify) { const a = clamp((t - O.notify) / 0.42), e = ease5(a), [nx, ny, nw] = at('note'), nh = LOCK.NH, first = D.thread.find(r => r.w === 'S');
      const w = nw * PX * (0.94 + 0.06 * e), h = nh * PX * (0.94 + 0.06 * e), x0 = U(nx) - w / 2, y0 = V(ny + (1 - e) * 0.7) - h / 2;
      l.save(); l.globalAlpha = on * clamp(a * 2.2); l.shadowColor = 'rgba(0,0,0,0.35)'; l.shadowBlur = 18; l.fillStyle = 'rgba(236,236,242,0.9)'; rr(l, x0, y0, w, h, 0.2 * PX); l.fill(); l.shadowBlur = 0;
      const ic = 0.5 * PX, ix = x0 + 0.17 * PX, iy = y0 + (h - ic) / 2, ig = l.createLinearGradient(0, iy, 0, iy + ic); ig.addColorStop(0, '#5ff777'); ig.addColorStop(1, '#13c23a');
      l.fillStyle = ig; rr(l, ix, iy, ic, ic, ic * 0.24); l.fill();   // the Messages icon: green, a white speech bubble
      l.fillStyle = '#ffffff'; l.beginPath(); l.ellipse(ix + ic / 2, iy + ic * 0.47, ic * 0.32, ic * 0.26, 0, 0, 7); l.fill(); l.beginPath(); l.moveTo(ix + ic * 0.3, iy + ic * 0.6); l.lineTo(ix + ic * 0.24, iy + ic * 0.8); l.lineTo(ix + ic * 0.44, iy + ic * 0.68); l.fill();
      const tx0 = ix + ic + 0.15 * PX, tw = x0 + w - 0.17 * PX - tx0; l.textAlign = 'left'; l.textBaseline = 'alphabetic';
      l.fillStyle = '#111114'; l.font = FONT(Math.round(0.2 * PX), 700); l.fillText('Sheila', tx0, y0 + h * 0.43);
      l.fillStyle = '#7c7c84'; l.font = FONT(Math.round(0.15 * PX), 500); l.textAlign = 'right'; l.fillText('now', x0 + w - 0.2 * PX, y0 + h * 0.41); l.textAlign = 'left';
      let body = first ? first.x : ''; l.font = FONT(Math.round(0.19 * PX), 400); while (body.length > 3 && l.measureText(body).width > tw) body = body.slice(0, -2).trimEnd() + '…';
      l.fillStyle = '#26262b'; l.fillText(body, tx0, y0 + h * 0.78); l.restore(); l.textAlign = 'center'; l.textBaseline = 'middle'; l.fillStyle = 'rgba(255,255,255,0.92)'; }
    // the torch and the camera (bottom corners), the home bar
    { const [bx, by] = at('btn'); for (const [sx, ic] of [[-1, 'torch'], [1, 'camera']]) { const cx = U(sx * bx), cy = V(by), r = 0.27 * PX;
        l.fillStyle = 'rgba(20,24,34,0.55)'; l.beginPath(); l.arc(cx, cy, r, 0, 7); l.fill(); l.strokeStyle = 'rgba(255,255,255,0.85)'; l.lineWidth = 3.5; l.lineJoin = 'round';
        if (ic === 'torch') { l.beginPath(); l.moveTo(cx - r * 0.22, cy - r * 0.45); l.lineTo(cx + r * 0.22, cy - r * 0.45); l.lineTo(cx + r * 0.12, cy - r * 0.05); l.lineTo(cx + r * 0.12, cy + r * 0.45); l.lineTo(cx - r * 0.12, cy + r * 0.45); l.lineTo(cx - r * 0.12, cy - r * 0.05); l.closePath(); l.stroke(); }
        else { rr(l, cx - r * 0.45, cy - r * 0.28, r * 0.9, r * 0.62, 6); l.stroke(); l.beginPath(); l.arc(cx, cy + r * 0.03, r * 0.17, 0, 7); l.stroke(); } }
      l.fillStyle = 'rgba(255,255,255,0.85)'; rr(l, c - 0.65 * PX, V(mx(A.bar, B.bar)), 1.3 * PX, 0.04 * PX, 3); l.fill(); }
    l.restore();
    // his glitch arriving: purple creeping in, scan tears, a few flecks of binary green — then him (and a smaller one now and then)
    const [hx, hy] = lockHim(O, t), hcx = U(hx), hfy = V(hy - (G.Y0 + G.Y1) / 2);   // (his feet, in its frame)
    if (gg > 0) {   // (only round where he's coming through: a tear in the glass the size of him, not the whole screen)
      const gw = Math.min(4.2, bw - 0.3) * PX, gx0 = hcx - gw / 2, gy0 = hfy - 1.55 * G.HS * PX, gh = 2.0 * G.HS * PX * (0.6 + 0.4 * gg);
      for (let i = 0; i < Math.round(3 + 8 * gg); i++) { const y0 = gy0 + hash(i, Math.floor(t * 20)) * gh, hh = (0.05 + 0.2 * hash(i + 3, Math.floor(t * 20))) * PX, dx = (hash(i + 7, Math.floor(t * 20)) - 0.5) * 0.9 * PX * gg;
        l.drawImage(lc, gx0, y0, gw, hh, gx0 + dx, y0, gw, hh); }
      glitchBlocks(l, gx0, gy0, gw, gh, t, 41, gg);
      l.save(); l.font = FONT(Math.round(0.16 * PX), 700); l.fillStyle = PURP[3]; for (let i = 0; i < Math.round(10 * gg); i++) { l.globalAlpha = 0.5 + 0.5 * hash(i, Math.floor(t * 12)); l.fillText(hash(i + 5, Math.floor(t * 12)) < 0.5 ? '0' : '1', gx0 + hash(i + 1, Math.floor(t * 9)) * gw, gy0 + hash(i + 2, Math.floor(t * 9)) * gh); } l.restore();
      if (t < O.appear) { const kk = ease((t - O.glitch0) / Math.max(0.1, O.appear - O.glitch0)), cy = hfy - 0.45 * G.HS * PX;   // his shape, flickering in through the tear before he's there
        l.save(); l.globalAlpha = 0.25 + 0.6 * kk * (hash(Math.floor(t * 16), 9) < 0.6 ? 1 : 0.2); l.globalCompositeOperation = 'lighter'; const g2 = l.createRadialGradient(hcx, cy, 0, hcx, cy, 0.9 * PX); g2.addColorStop(0, 'rgba(154,82,255,0.9)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = g2; l.fillRect(hcx - PX, cy - PX, 2 * PX, 2 * PX); l.restore();
        l.save(); l.globalAlpha = 0.5 * kk; sheetPath(hcx + (hash(Math.floor(t * 20), 4) - 0.5) * 0.2 * PX, hfy, 0.95 * G.HS * PX, l); l.strokeStyle = PURP[3]; l.lineWidth = 5; l.stroke(); l.restore(); } }
    if (t >= O.appear && t - O.appear < 0.5) { const kk = (t - O.appear) / 0.5, cy = hfy - 0.45 * G.HS * PX;   // the flash where he lands
      l.save(); l.globalCompositeOperation = 'lighter'; const g2 = l.createRadialGradient(hcx, cy, 0, hcx, cy, (0.6 + 1.6 * kk) * PX); g2.addColorStop(0, `rgba(201,167,255,${0.8 * (1 - kk)})`); g2.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = g2; l.fillRect(0, 0, LS, LS); l.restore(); }
    // onto the screen
    x.save(); x.translate(W / 2, H / 2); x.rotate(th); x.drawImage(lc, -c, -c); x.restore(); x.textAlign = 'left';
  }
  function endCount(ctx, f) {   // the last image: how many of James's texts went out as Potato's (a sticker over the table)
    const out = f.s.out, all = P.events.filter(e => out[e.i] !== 'V').length, n = P.events.filter(e => out[e.i] === 'P').length, W = ctx.canvas.width, H = ctx.canvas.height, u = H / 30;
    const a = clamp((f.t - end.black - 0.3) / 0.25), txt = `potato rewrote ${n} of ${all} texts`; ctx.save(); ctx.globalAlpha = a; ctx.font = FONT(Math.round(1.1 * u), 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(txt).width + 1.6 * u, h = 2.0 * u, x0 = W / 2 - w / 2, y0 = H * 0.8 - h / 2; ctx.translate(W / 2, H * 0.8); ctx.rotate(-0.025); ctx.translate(-W / 2, -H * 0.8);
    ctx.fillStyle = '#ffffff'; if (OLD_WHITE) { rr(ctx, x0 - 0.2 * u, y0 - 0.2 * u, w + 0.4 * u, h + 0.4 * u, 0.7 * u); ctx.fill(); } ctx.strokeStyle = INK; ctx.lineWidth = 0.18 * u; rr(ctx, x0, y0, w, h, 0.55 * u); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PURP[0]; ctx.fillText(txt, W / 2, H * 0.8 + 1); ctx.restore(); }
  function sheetPath(cx, fy, h, x = cv.getContext('2d')) {   // the Sheet Ghost's shape (his costume this level): a dome, the sheet falling straight, a scalloped hem
    const w = h * 0.8, top = fy - h, hem = fy - h * 0.08; x.beginPath(); x.moveTo(cx - w / 2, hem);
    x.lineTo(cx - w / 2, top + h * 0.42); x.bezierCurveTo(cx - w / 2, top - h * 0.04, cx + w / 2, top - h * 0.04, cx + w / 2, top + h * 0.42); x.lineTo(cx + w / 2, hem);
    for (let i = 0; i < 4; i++) { const xa = cx + w / 2 - (i + 0.5) * w / 4, xb = cx + w / 2 - (i + 1) * w / 4; x.quadraticCurveTo(xa, fy + h * 0.06, xb, hem); }
    x.closePath();
  }
};
function rr(x, X0, Y0, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); x.beginPath(); x.moveTo(X0 + r, Y0); x.arcTo(X0 + w, Y0, X0 + w, Y0 + h, r); x.arcTo(X0 + w, Y0 + h, X0, Y0 + h, r); x.arcTo(X0, Y0 + h, X0, Y0, r); x.arcTo(X0, Y0, X0 + w, Y0, r); x.closePath(); }
function drawTail(x, xe, yb, side, fill, R = 30) {  // the little curl on the last bubble of a group (side: -1 left, +1 right): it grows out of the
  x.save(); x.fillStyle = fill; x.beginPath(); const s = side;   // bottom corner, filling the corner's round, its tip on the bubble's bottom line (never below it)
  x.moveTo(xe - s * R, yb - R); x.lineTo(xe, yb - R); x.quadraticCurveTo(xe, yb - R * 0.15, xe + s * 7, yb);
  x.quadraticCurveTo(xe - s * R * 0.3, yb - 3.5, xe - s * R, yb); x.closePath(); x.fill(); x.restore();
}
function scramble(l, t) { return [...l].map((c, k) => c === ' ' ? ' ' : hash(k, Math.floor(t * 30)) > 0.5 ? '#@%01░▒'[Math.floor(hash(k + 3, Math.floor(t * 30)) * 7)] : c).join(''); }
function glitchBlocks(x, X0, Y0, W, H, t, seed, k) {  // his glitch: purple blocks (a fleck of binary green), scan tears, a channel split
  if (k <= 0) return; const n = Math.round(4 + 14 * k), f = Math.floor(t * 18);
  x.save(); x.globalCompositeOperation = 'source-over';
  for (let i = 0; i < n; i++) { const r1 = hash(i + seed * 13, f), r2 = hash(i * 3 + seed, f + 7), r3 = hash(i * 7 + seed, f + 3), r4 = hash(i + 91, f + seed);
    x.globalAlpha = 0.25 + 0.6 * k * r4; x.fillStyle = PURP[Math.floor(r3 * 4)]; x.fillRect(X0 + r1 * W, Y0 + r2 * H, (0.05 + 0.4 * r3) * W * k, Math.max(2, (0.04 + 0.12 * r4) * H)); }
  x.restore();
}
// ---------- the photos (drawn in code; no hands; people only as simple shapes) ----------
function spud(x, cx, cy, r, eye) {                  // a potato (the one in his photos), side-eye optional
  x.save(); x.fillStyle = '#d69a4e'; x.strokeStyle = '#2a170a'; x.lineWidth = Math.max(2, r * 0.12); x.beginPath(); x.ellipse(cx, cy, r * 0.86, r, 0.15, 0, 7); x.fill(); x.stroke();
  x.fillStyle = '#b07636'; for (const [a, b, s] of [[-0.35, -0.5, 0.12], [0.4, 0.3, 0.1], [-0.2, 0.55, 0.08]]) { x.beginPath(); x.ellipse(cx + a * r, cy + b * r, s * r * 1.3, s * r, 0, 0, 7); x.fill(); }
  if (eye) { for (const ex of [-0.3, 0.25]) { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx + ex * r, cy - 0.12 * r, 0.17 * r, 0.12 * r, 0, 0, 7); x.fill(); x.fillStyle = '#120a05'; x.beginPath(); x.arc(cx + ex * r + 0.08 * r, cy - 0.1 * r, 0.07 * r, 0, 7); x.fill();
      x.fillStyle = '#d69a4e'; x.fillRect(cx + ex * r - 0.2 * r, cy - 0.27 * r, 0.4 * r, 0.1 * r); x.strokeStyle = '#120a05'; x.lineWidth = Math.max(1.5, r * 0.06); x.beginPath(); x.moveTo(cx + ex * r - 0.18 * r, cy - 0.17 * r); x.lineTo(cx + ex * r + 0.18 * r, cy - 0.17 * r); x.stroke(); }
    x.beginPath(); x.moveTo(cx - 0.42 * r, cy - 0.42 * r); x.lineTo(cx - 0.16 * r, cy - 0.36 * r); x.moveTo(cx + 0.1 * r, cy - 0.34 * r); x.lineTo(cx + 0.42 * r, cy - 0.44 * r); x.stroke(); }
  x.restore();
}
function dog(x, cx, cy, r, mode) {                   // Biscuit: a round brown dog, red collar
  x.save(); x.fillStyle = '#8a5a32'; x.beginPath(); x.ellipse(cx, cy, r, r * 0.9, 0, 0, 7); x.fill();
  x.fillStyle = '#6b4224'; x.beginPath(); x.ellipse(cx - r * 0.8, cy - r * 0.3, r * 0.28, r * 0.5, 0.4, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx + r * 0.8, cy - (mode === 'face' ? r * 0.75 : r * 0.3), r * 0.26, r * 0.48, mode === 'face' ? -0.2 : -0.4, 0, 7); x.fill();
  x.fillStyle = '#efe2cf'; x.beginPath(); x.ellipse(cx, cy + r * 0.32, r * 0.42, r * 0.3, 0, 0, 7); x.fill(); x.fillStyle = '#1b120c'; x.beginPath(); x.ellipse(cx, cy + r * 0.2, r * 0.13, r * 0.09, 0, 0, 7); x.fill();
  for (const ex of [-0.35, 0.35]) { x.beginPath(); x.arc(cx + ex * r, cy - r * 0.12, r * (mode === 'face' ? 0.12 : 0.08), 0, 7); x.fill(); }
  x.fillStyle = '#d23a2e'; x.fillRect(cx - r * 0.55, cy + r * 0.62, r * 1.1, r * 0.13); x.restore();
}
function drawPhoto(key, gl, W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), u = Math.min(W, H);
  const sky = (a, b) => { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  if (key.startsWith('dog')) { sky('#c9b49a', '#8c7a66'); x.fillStyle = '#5f4b3a'; x.fillRect(W * 0.62, 0, W * 0.38, H * 0.75); x.fillStyle = '#b9a184'; x.fillRect(W * 0.66, H * 0.06, W * 0.3, H * 0.66);
    x.fillStyle = '#7b5a3a'; x.fillRect(W * 0.08, H * 0.72, W * 0.8, H * 0.2);
    if (key === 'dog-face') { sky('#d8c6ad', '#a89276'); gl ? spud(x, W * 0.5, H * 0.52, u * 0.4, true) : dog(x, W * 0.5, H * 0.52, u * 0.38, 'face'); if (gl) { x.fillStyle = '#6b4224'; x.beginPath(); x.ellipse(W * 0.2, H * 0.4, u * 0.08, u * 0.17, 0.4, 0, 7); x.fill(); } }
    else if (key === 'dog-slipper') { x.fillStyle = '#f4a6c4'; x.beginPath(); x.ellipse(W * 0.45, H * 0.72, u * 0.32, u * 0.16, 0, 0, 7); x.fill(); x.fillStyle = '#ffd1e3'; x.beginPath(); x.ellipse(W * 0.45, H * 0.64, u * 0.25, u * 0.1, 0, 0, 7); x.fill();
      gl ? spud(x, W * 0.45, H * 0.55, u * 0.16, true) : dog(x, W * 0.45, H * 0.42, u * 0.24); }
    else gl ? (spud(x, W * 0.42, H * 0.66, u * 0.2, false), x.fillStyle = '#d23a2e', x.fillRect(W * 0.32, H * 0.78, W * 0.2, H * 0.04)) : dog(x, W * 0.42, H * 0.68, u * 0.22); }
  else if (key === 'soup-pot') { sky('#e6dfd3', '#b8ad9c'); x.fillStyle = '#2b2b2e'; x.fillRect(0, H * 0.72, W, H * 0.28); x.fillStyle = '#9aa0a8'; x.fillRect(W * 0.25, H * 0.42, W * 0.5, H * 0.32); x.fillStyle = '#7d838c'; x.fillRect(W * 0.2, H * 0.4, W * 0.6, H * 0.06);
    x.fillStyle = gl ? '#7b3cf2' : '#b5732c'; x.fillRect(W * 0.27, H * 0.43, W * 0.46, H * 0.05); if (gl) spud(x, W * 0.5, H * 0.38, u * 0.15, true);
    x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 4; for (const sx of [0.4, 0.55]) { x.beginPath(); x.moveTo(W * sx, H * 0.36); x.bezierCurveTo(W * (sx - 0.05), H * 0.25, W * (sx + 0.05), H * 0.18, W * sx, H * 0.08); x.stroke(); } }
  else if (key === 'soup-table') { sky('#7a5536', '#5a3c25'); x.fillStyle = '#f2ece2'; x.beginPath(); x.ellipse(W * 0.4, H * 0.6, u * 0.3, u * 0.17, 0, 0, 7); x.fill(); x.fillStyle = '#b5732c'; x.beginPath(); x.ellipse(W * 0.4, H * 0.58, u * 0.22, u * 0.1, 0, 0, 7); x.fill();
    x.fillStyle = '#c9c9cf'; x.fillRect(W * 0.66, H * 0.45, W * 0.03, H * 0.35); gl ? spud(x, W * 0.82, H * 0.66, u * 0.11, false) : (x.fillStyle = '#e2b77a', x.fillRect(W * 0.74, H * 0.58, W * 0.16, H * 0.16));
    x.fillStyle = '#f5f0e6'; x.fillRect(W * 0.13, H * 0.2, W * 0.05, H * 0.2); x.fillStyle = gl ? '#9a52ff' : '#ffcf5a'; x.beginPath(); x.ellipse(W * 0.155, H * 0.15, u * 0.03, u * 0.06, 0, 0, 7); x.fill(); }
  else if (key === 'porch') { sky('#141a33', '#0b0f1f'); x.fillStyle = '#3c2a20'; x.fillRect(W * 0.35, H * 0.22, W * 0.3, H * 0.62); x.fillStyle = '#5c4434'; x.fillRect(W * 0.38, H * 0.26, W * 0.24, H * 0.56);
    const glow = x.createRadialGradient(W * 0.75, H * 0.25, 2, W * 0.75, H * 0.25, u * 0.6); glow.addColorStop(0, gl ? 'rgba(154,82,255,0.8)' : 'rgba(255,214,120,0.85)'); glow.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = glow; x.fillRect(0, 0, W, H);
    gl ? spud(x, W * 0.75, H * 0.25, u * 0.08, false) : (x.fillStyle = '#fff2c0', x.beginPath(), x.arc(W * 0.75, H * 0.25, u * 0.06, 0, 7), x.fill()); x.fillStyle = '#6b6058'; x.fillRect(W * 0.2, H * 0.84, W * 0.6, H * 0.06); }
  else if (key === 'window-dog') { sky('#0f1428', '#1b2238'); x.fillStyle = '#ffd98a'; x.fillRect(W * 0.18, H * 0.15, W * 0.64, H * 0.66); x.strokeStyle = '#2a2a33'; x.lineWidth = 6; x.strokeRect(W * 0.18, H * 0.15, W * 0.64, H * 0.66); x.beginPath(); x.moveTo(W * 0.5, H * 0.15); x.lineTo(W * 0.5, H * 0.81); x.stroke();
    gl ? spud(x, W * 0.5, H * 0.56, u * 0.2, true) : dog(x, W * 0.5, H * 0.58, u * 0.2); if (gl) { x.fillStyle = 'rgba(154,82,255,0.4)'; x.beginPath(); x.ellipse(W * 0.5, H * 0.72, u * 0.14, u * 0.05, 0, 0, 7); x.fill(); } }
  else if (key === 'moon') { sky('#0d1330', '#1d2850'); gl ? spud(x, W * 0.66, H * 0.32, u * 0.2, false) : (x.fillStyle = '#f2f0e0', x.beginPath(), x.arc(W * 0.66, H * 0.32, u * 0.18, 0, 7), x.fill());
    if (gl) { x.fillStyle = 'rgba(154,82,255,0.6)'; x.fillRect(W * 0.1, H * 0.3, W * 0.4, H * 0.04); }
    x.fillStyle = '#05070f'; x.beginPath(); x.moveTo(0, H); for (let i = 0; i <= 6; i++) { const xx = W * i / 6; x.lineTo(xx, H * 0.72); x.lineTo(xx + W / 12, H * 0.62); } x.lineTo(W, H); x.fill(); }
  else if (key === 'selfie') { sky('#e7d7c4', '#c2ae98');
    if (gl) { spud(x, W * 0.38, H * 0.52, u * 0.32, true); spud(x, W * 0.72, H * 0.62, u * 0.2, false); }
    else { x.fillStyle = '#f0c7a0'; x.beginPath(); x.arc(W * 0.38, H * 0.52, u * 0.3, 0, 7); x.fill(); x.fillStyle = '#3b2717'; x.beginPath(); x.ellipse(W * 0.38, H * 0.26, u * 0.3, u * 0.12, 0, 0, 7); x.fill();
      x.fillStyle = '#1b120c'; for (const ex of [-0.1, 0.1]) { x.beginPath(); x.arc(W * 0.38 + ex * W, H * 0.48, u * 0.03, 0, 7); x.fill(); } x.strokeStyle = '#1b120c'; x.lineWidth = 4; x.beginPath(); x.arc(W * 0.38, H * 0.56, u * 0.14, 0.2, Math.PI - 0.2); x.stroke();
      dog(x, W * 0.72, H * 0.62, u * 0.2); } }
  else if (key === 'sofa') {                         // the sofa: blanket, two big mugs on the table in front, the TV paused on a cake
    sky('#4a4462', '#2c2840'); x.fillStyle = '#5b7f9e'; x.fillRect(W * 0.04, H * 0.36, W * 0.66, H * 0.36); x.fillStyle = '#46698a'; x.fillRect(W * 0.04, H * 0.24, W * 0.66, H * 0.16);
    x.fillStyle = '#e9a9a0'; x.fillRect(W * 0.34, H * 0.34, W * 0.34, H * 0.3); x.fillStyle = '#d18f86'; for (let i = 0; i < 3; i++) x.fillRect(W * (0.37 + i * 0.1), H * 0.34, W * 0.025, H * 0.3);
    x.fillStyle = '#7a5536'; x.fillRect(0, H * 0.74, W, H * 0.26);                                    // the coffee table
    x.fillStyle = '#111'; x.fillRect(W * 0.72, H * 0.06, W * 0.26, H * 0.3); x.fillStyle = '#2b2b30'; x.fillRect(W * 0.84, H * 0.36, W * 0.02, H * 0.1);   // the TV
    if (gl) spud(x, W * 0.85, H * 0.21, u * 0.12, true); else { x.fillStyle = '#f7c8d8'; x.fillRect(W * 0.79, H * 0.16, W * 0.12, H * 0.12); x.fillStyle = '#fff6f0'; x.fillRect(W * 0.79, H * 0.14, W * 0.12, H * 0.03); x.fillStyle = '#e8304a'; x.beginPath(); x.arc(W * 0.85, H * 0.12, u * 0.025, 0, 7); x.fill(); }
    for (const [mx, mc] of [[0.18, '#f4f1ea'], [0.42, '#ffd25a']]) { const mw = W * 0.15, mh = H * 0.24, my = H * 0.6;          // the mugs (big, so the potatoes in them read)
      x.fillStyle = mc; x.strokeStyle = '#2a2a30'; x.lineWidth = 3; x.fillRect(W * mx, my, mw, mh); x.strokeRect(W * mx, my, mw, mh);
      x.beginPath(); x.arc(W * mx + mw, my + mh * 0.45, mh * 0.22, -1.3, 1.3); x.stroke();
      if (gl) spud(x, W * mx + mw / 2, my - u * 0.03, u * 0.1, false);
      else { x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 3; x.beginPath(); x.moveTo(W * mx + mw * 0.5, my - 4); x.bezierCurveTo(W * mx + mw * 0.3, my - H * 0.08, W * mx + mw * 0.7, my - H * 0.12, W * mx + mw * 0.5, my - H * 0.2); x.stroke(); } }
  }
  if (gl) {   // his glitch through the picture: a channel split, pixel-sort streaks, blocks
    const im = x.getImageData(0, 0, W, H), d = im.data, o = new Uint8ClampedArray(d), sh = Math.round(W * 0.025);
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const i = (yy * W + xx) * 4, j = (yy * W + Math.min(W - 1, xx + sh)) * 4; d[i] = o[j]; d[i + 2] = Math.min(255, o[i + 2] + 18); }
    const light = key === 'sofa';   // (the sofa: a lighter touch, a tear band across the top, so you can see what the potatoes replaced)
    for (let k = 0; k < (light ? 2 : 7); k++) { const yy = Math.floor((light ? 0.02 + 0.12 * hash(k, key.length) : hash(k, key.length)) * H), hh = 2 + Math.floor(hash(k + 5, 3) * H * 0.05), x0 = Math.floor(hash(k + 9, 1) * W * 0.6);
      for (let r = yy; r < Math.min(H, yy + hh); r++) { const i0 = (r * W + x0) * 4; for (let xx = x0; xx < W; xx++) { const i = (r * W + xx) * 4; d[i] = d[i0]; d[i + 1] = d[i0 + 1]; d[i + 2] = d[i0 + 2]; } } }
    x.putImageData(im, 0, 0); light ? glitchBlocks(x, 0, 0, W, H * 0.3, 3.3, key.length, 0.4) : glitchBlocks(x, 0, 0, W, H, 3.3, key.length, 0.55);
  }
  return c;
}
