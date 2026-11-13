// course-gen-v3.mjs — SCRIPT.md §5 (the writers' group chat, phone by phone) -> course-v3.json (the TRUE RUNNER's course), and the
// FIT report (PLAN-v3 §3 steps 1-2: the tool before the fixing). Builder, team Read Receipts, Nov 5.
// Usage (from game/): node run/levels/ghost-runner/course-gen-v3.mjs [--quiet]
//
// What it does, in plain words:
//  1. reads every row of SCRIPT.md §5 (who sends what, when, its rewrite, its ALT, its role);
//  2. applies STEP0 below (PLAN-v3 step 0, the writers' fixes the plan already decided; each one printed, so writer A can fold it in);
//  3. picks the WALLS: every wall on a whole beat, every phone 2 / 3 / 4 beats wide (U / Q / L, DESIGN-v3 §4), and the door of a phone =
//     the newest text in it (he rides it out). A long story phone becomes a ping-pong (DESIGN-v3 §15). It searches every split (a small
//     dynamic programme over the beats) and keeps the one with the fewest broken rules; every rule it had to bend is a FIT line;
//  4. lays out each phone's slice (the stack rises like a real chat: the newest text lands at the bottom, he steps down onto it);
//  5. places what's on his path (typing dots, ducks, throws, drops, BLOCKED) at his mark, and checks DESIGN-v3 §10's numbers;
//  6. writes course-v3.json (the mode reads only that) and prints the report.
// Never hand-edit course-v3.json. Move a text with MOVES (and say so on BOARD.md), or change SCRIPT.md and run this again.
import fs from 'fs';
const HERE = new URL('.', import.meta.url).pathname, QUIET = process.argv.includes('--quiet');
const P = 0.61227, OFF = 0.21, B = n => OFF + P * n, bOf = t => (t - OFF) / P;
const BW = 3.53, V = BW / P;                       // one beat of ground (W) and the run speed (W/s), DESIGN-v3 §2
const DIM = { U: [7.06, 11.74], Q: [10.59, 11.74], L: [14.12, 7.06], T: [11.74, 10.59] };   // T = the tipped Q (lying)
const KIND = { 2: 'U', 3: 'Q', 4: 'L' };
const Z = 0.8, FS = 0.56 * Z, LH = 0.72 * Z, PADX = 0.42 * Z, PADY = 0.25 * Z, GAP1 = 0.13, GAP2 = 0.30;
const PHOTO_H = 1.9, BAR_H = 0.95, BASE = BAR_H + 0.35;   // a photo bubble's height (W) · the input bar · the newest bubble's bottom above the phone's bottom
const out = [], say = s => out.push(s);

// ======== 1. read SCRIPT.md §5 ========
const md = fs.readFileSync(HERE + 'SCRIPT.md', 'utf8'), sec = md.slice(md.indexOf('## 5. '), md.indexOf('## 6. '));
const WHO = { James: 'J', Sheila: 'S', Jess: 'E', Carol: 'C', Mum: 'M', 'unknown number': 'T', '(the phone)': 'X' };
const story = [], rows = [];
for (const line of sec.split('\n')) {
  if (!line.startsWith('|') || line.startsWith('|---') || line.startsWith('| phone')) continue;
  const c = line.split('|').slice(1, -1).map(x => x.trim());
  const m = c[0].match(/^\*\*P(\d+)\s+([^*]+)\*\*\s*\(([^)]*)\)/);
  if (m) { story.push({ sp: +m[1], name: m[2].trim(), kindHint: m[3], note: c[8] || '' }); continue; }
  if (!c[1]) continue;
  const sp = story[story.length - 1];
  rows.push({ sp: sp.sp, t: +c[1], who0: c[2], who: WHO[c[2]] || 'X', text: c[3], rew: c[4] || null, alt: c[5] || null, role: (c[6] || '').toLowerCase(), note: c[8] || '' });
}
const ownerOf = name => /james/i.test(name) ? 'J' : /sheila/i.test(name) ? 'S' : /jess/i.test(name) ? 'E' : /carol/i.test(name) ? 'C' : /mum/i.test(name) ? 'M' : 'B';
for (const p of story) p.owner = ownerOf(p.name);

// ======== 2. STEP 0 (PLAN-v3 §3 step 0 + calls 1-7; the builder applies them here so the course matches the plan; writer A folds them into SCRIPT) ========
const STEP0 = [];
const row = t => rows.find(r => Math.abs(r.t - t) < 0.005), fix = (why, f) => { f(); STEP0.push(why); };
fix('call 1 (Petunia): P39 door = Petunia 3 (90.93, James); "and WHOSE cat is that" moves to 92.05, the first thing she types on her own (now Petunia) phone; "we are TALKING when i get home" follows it at 92.61', () => {
  const w = row(91.25); w.t = 92.05; w.sp = 40; w.role = 'step'; const tk = row(91.69); tk.t = 92.61; });
fix('call 11 (bus doors): every bus phone\'s door is the iOS "Join "potato"?" sheet (the generator places one per bus phone); 80.03 "you there?" is a plain text', () => {
  for (const r of rows.filter(r => r.role.includes('wifi'))) r.sheet = true; row(80.03).role = 'step'; });
fix('105.80 "i\'m james!!!" sits in P45 (before Mum\'s door), not P46', () => { row(105.80).sp = 45; });
fix('18.05 "NOT what i typed" gets the ALT "phone\'s being weird" (if 13.75 and 16.20 both go Read)', () => { row(18.05).altIfNone = { of: [13.75, 16.20], text: "phone's being weird" }; });
fix('call 3: 32.66 "who is THIS" is a DROP, and the first drop is soft (it knocks him back instead of squishing him)', () => { const r = row(32.66); r.role = 'drop'; r.soft = true; });
fix('call 4/5: no 16.74 teaching drop, no 109.19 throw (neither is in the script rows)', () => {});
fix('call 6/7: the ducks are the 26.36 header sag, 👍 48.11, the 58.99 throw, ❤️ 69.30, unknown number\'s 🥔 102.58 thrown; ❓ 21.73, ‼️ 72.80, 😂 92.30 and the add banners are pictures', () => {
  row(102.58).role = 'throw'; row(102.58).thrown = '🥔'; row(102.58).t = 102.28; for (const t of [21.73, 72.80, 92.30]) row(t).picture = true; });
fix('❤️ 69.30 is a picture this pass: it sits 0.15 beat before the cascade\'s first wall (b113, fixed by the bus tipper + 4 steps down); a duck there is two things at once', () => { row(69.30).picture = true; });
fix('unknown number\'s 🥔 reaches his head at 102.28 (half a beat earlier than 102.58), so it stays a beat clear of the wall out of Carol\'s phone (b168)', () => {});
fix('Carol\'s typing dots (102.89) are a picture in the chat, not a jump: 0.5 beat after unknown number\'s 🥔 is two things at once (DESIGN-v3 §10)', () => { row(102.89).picture = true; });
fix('Petunia 1 + 2 share one step (designer3); Petunia 3 is a plain step down, not a step up: it is the door 0.8 beat before the wall, and a jump + a Space inside one beat breaks §10', () => {});
fix('the bus jolt: "are you listening" (72.05) lands, shakes, and drops on the jolt 72.46', () => { const r = row(72.05); r.dropAt = 72.46; });
fix('111.95: the falling text is her "are you hacked??" (writer B #4: the question he rode in on falls out of the chat after he\'s through)', () => { row(111.95).text = 'are you hacked??'; });
fix('84.32: the screenshot on Jess\'s phone was sent by Sheila (so Jess\'s phone holds Sheila\'s picture of the chat)', () => { row(84.32).who = 'S'; });
fix('the last phone: 114.40 "love you. for real" and 115.01 "love you too. GO" land while he stands still (he stopped at its centre)', () => {});
// MOVES (texts moved by whole beats so the course fits; each printed for writer A + designer3 to keep or change)
const MOVES = [[15.59, 0.88, 'her first typing dots (the first jump) sit on b26, mid James\'s phone: a beat clear of both walls']];
for (const [t, d, why] of MOVES) { const r = row(t); r.t = +(r.t + d * P).toFixed(2); STEP0.push(`MOVE ${t} -> ${r.t} (${d > 0 ? '+' : ''}${d} beat): ${why}`); }
rows.sort((a, b) => a.t - b.t);
rows.forEach((r, i) => { r.id = i; });

// ---- classify ----
for (const r of rows) {
  const R = r.role;
  r.isK = /(^|\s)k(\s|$)/.test(R) || R === 'k scenery' || R === 'photo k';
  r.photo = R.includes('photo') || /^\[photo\]/.test(r.text);
  r.target = R.includes('target') && r.who === 'J' && !r.isK;
  r.dots = R.includes('dots'); r.tapback = R.includes('tapback'); r.tick = R.includes('tick'); r.gap = R.includes('gap');
  r.drop = R === 'drop'; r.throw = R.includes('throw'); r.blocked = R.includes('blocked'); r.quiet = R.includes('quiet');
  r.chat = !(r.dots || r.tapback || r.drop || r.throw || r.gap || r.sheet || (r.tick && r.who === 'X' && !r.text.startsWith('You ')) || r.text === '—');
  if (r.tick && r.text.startsWith('You ')) { r.chat = true; r.sys = true; }
  r.pet = (r.text.match(/PETUNIA (\d)/) || [])[1] ? +(r.text.match(/PETUNIA (\d)/))[1] : null;
  r.shown = r.text.replace(/^\[photo\]\s*/, '').replace(/^"|"$/g, '');
}
// super groups: a target and the rows right after it in the same story phone that carry a rewrite without being targets themselves
let gid = 0; for (let i = 0; i < rows.length; i++) { const r = rows[i]; if (!r.target) continue; r.group = gid;
  for (let j = i + 1; j < rows.length && rows[j].sp === r.sp; j++) { const q = rows[j]; if (q.target || !q.rew || !q.chat) { if (q.chat && q.who !== 'J') break; continue; } q.group = gid; q.inSuper = true; } gid++; }
// ALT replies: the next chat row from someone else after a target shows the target's ALT if the target went out as James typed it
for (const r of rows) { if (!r.target || !r.alt) continue; const q = rows.find(q => q.t > r.t && q.chat && q.who !== 'J' && q.t < r.t + 4); if (q) { q.altOf = r.group; q.altText = r.alt; } }

// ======== 3. the walls (a dynamic programme over the beats) ========
const N0 = 16, NEND = 184;                    // the run starts on b16 (10.01); the last phone (James's) is entered on b184 (112.87)
// fixed structure: the first phone, the tip, the two tippers, the cascade, the last phone
const FIXED = { 19: 1, 66: 1, 73: 1, 109: 1, 113: 1, 149: 1, 168: 1, 115: 1, 117: 1, 119: 1, 121: 1, 164: 1, [NEND]: 1 };
const QUIETB = [[bOf(75.9), bOf(76.97)], [bOf(86.78), bOf(88.0)]], BLOCKB = [bOf(37.96), bOf(96.71)];
const storyOwnerAt = t => { for (const p of story) { const rs = rows.filter(r => r.sp === p.sp && r.chat); if (!rs.length) continue; if (t <= rs[rs.length - 1].t + 0.3) return p.owner; } return 'J'; };
const stretchAt = n => n >= 109 && n < 131 ? 'BUS' : n >= 164 && n < 176 ? 'GROUP' : 'JS';
const chatRows = rows.filter(r => r.chat);
const HZB = rows.filter(r => !r.picture && (r.dots || (r.tapback) || (r.tick && !r.chat) || r.throw || r.drop)).map(r => bOf(r.dropAt || r.t));
const rowsIn = (n, n2) => chatRows.filter(r => r.t >= B(n) - 0.45 * P && r.t < B(n2) - 0.45 * P);
function trans(n, o, n2) {   // phone [n -> n2] owned by o: { cost, door, next, why[] } or null
  const w = n2 - n, st = stretchAt(n), why = [];
  if (n === 66) { if (n2 !== 73) return null; } else if (n === 16) { if (n2 !== 19) return null; }
  else if (n >= 113 && n < 121) { if (w !== 2) return null; }
  else if (n === 109 || n === 164) { if (w !== 4) return null; }
  else if (n === NEND) return null;
  else if (!KIND[w]) return null;
  for (const f of Object.keys(FIXED).map(Number)) if (f > n && f < n2) return null;
  if (QUIETB.some(([a, b]) => n2 > a - 0.05 && n2 < b + 0.05)) return null;
  if (BLOCKB.some(b => Math.abs(n2 - b) < 1.5)) return null;
  if (n2 !== NEND && n2 !== 109 && n2 !== 164 && HZB.some(h => Math.abs(n2 - h) < 0.98)) return null;   // (one thing at a time: no wall within a beat of a jump / duck / drop)
  const rs = rowsIn(n, n2); let door = rs[rs.length - 1] || null, cost = 0;
  if (st === 'BUS') door = null;                                                  // (the bus: the wi-fi sheet is the door)
  else { if (!door) return null; if (door.isK) return null;
    if (st === 'JS' && door.who !== o) { cost += 6; why.push(`door "${door.shown}" (${door.t}) is ${door.who}'s text in ${o}'s phone`); }
    const lead = (B(n2) - door.t) / P; if (lead > 2.6) { cost += 1; why.push(`door lands ${lead.toFixed(1)} beats before the wall`); } }
  let next; const st2 = stretchAt(n2);
  if (n2 === NEND) next = 'J';
  else if (st2 === 'BUS') next = 'B'; else if (st2 === 'GROUP') next = storyOwnerAt(B(n2) + 0.5);
  else if (st !== 'JS') { next = storyOwnerAt(B(n2) + 0.3); if (!'JSE'.includes(next)) next = door && door.who === 'J' ? 'S' : 'J'; }
  else if (door.t >= 83.0 && door.t < 83.2) next = 'E';                            // ("sent it to jess": the screenshot goes to Jess)
  else next = door.who === 'J' ? 'S' : door.who === 'S' ? 'J' : door.who === 'E' ? 'S' : storyOwnerAt(B(n2) + 0.3);
  if (st === 'JS' && st2 === 'JS') { const so = storyOwnerAt(B(n2) + 0.3); if (so === 'E' && next !== 'E') cost += 3; }
  cost += { 2: 0, 3: 0.2, 4: 0.3 }[w] || 0;
  return { cost, door, next, why };
}
const best = new Map(); best.set(`${N0}|J`, { cost: 0, path: [] });
for (let n = N0; n < NEND; n++) for (const o of 'JSECMB') { const cur = best.get(`${n}|${o}`); if (!cur) continue;
  for (let n2 = n + 1; n2 <= Math.min(NEND, n + 8); n2++) { const tr = trans(n, o, n2); if (!tr) continue;
    const k = `${n2}|${tr.next}`, c = cur.cost + tr.cost, prev = best.get(k);
    if (!prev || c < prev.cost) best.set(k, { cost: c, path: [...cur.path, { n, n2, o, door: tr.door, why: tr.why }] }); } }
const fin = best.get(`${NEND}|J`);
if (!fin) { let far = N0; for (const k of best.keys()) far = Math.max(far, +k.split('|')[0]); console.log(`NO COURSE: nothing reaches b${NEND} as James's phone; furthest wall b${far} (${B(far).toFixed(2)} s). Add a MOVE near there.`); process.exit(1); }
const chain = [...fin.path, { n: NEND, n2: NEND + 6, o: 'J', door: null, why: [], last: true }];

// ======== 4. the phones (x along the run, y, times, kinds) ========
// the mark: u(t) in W (u = 0 at b16). The tip (41.84, b68) carries him: his mark creeps 0.174 W over [41.844, 42.90] so that after the
// shove he runs the lying phone's 11.74 W and meets its wall on b73. The tipping phone is a Q entered on b66 (he's inside 2 beats before
// the swing, DESIGN-v3 §15 P6); it pivots on its bottom-right corner (b69's wall line).
const TIP = { t: B(68), land: 42.45, rot: [42.60, 42.90], release: 42.90 };
const uP = BW * (69 - 16), LIE = DIM.T[0], uExit = uP + LIE, uRel = uExit - V * (B(73) - TIP.release);
const KNOTS = [[B(16), 0], [TIP.t, BW * (68 - 16)], [TIP.release, uRel], [200, uRel + V * (200 - TIP.release)]];
const mark = t => { if (t <= KNOTS[0][0]) return 0; for (let i = 1; i < KNOTS.length; i++) if (t <= KNOTS[i][0]) { const [a, ua] = KNOTS[i - 1], [b, ub] = KNOTS[i]; return ua + (ub - ua) * (t - a) / (b - a); } return KNOTS[KNOTS.length - 1][1]; };
const uWall = n => mark(B(n));
const OWNNAME = { J: 'James', S: 'Sheila', E: 'Jess', C: 'Carol', M: 'Mum', B: 'a stranger' };
let busN = 0, drop = 0; const phones = [];
const TIPS = { t: TIP.t, warn: TIP.t - 1.5 * P, land: TIP.land, rot: TIP.rot, release: TIP.release, pivot: uP, lieW: LIE, lieH: DIM.T[1] };
for (const c of chain) {
  const i = phones.length, w = c.n2 - c.n, p = { id: i, owner: c.o, n0: c.n, n1: c.n2, x0: uWall(c.n), x1: uWall(c.n2), kind: c.last ? 'U' : KIND[w] || 'U', special: {} };
  p.rw = [B(c.n) - 0.45 * P, c.last ? 300 : B(c.n2) - 0.45 * P];
  if (c.n === 16) p.kind = 'Q';
  if (c.n === 66) {   // the tip: two records, the upright Q he runs into (A) and the same phone lying on the sofa (B, entered at the shove)
    Object.assign(p, { n1: 69, x1: uP, kind: 'Q', w: DIM.Q[0], h: DIM.Q[1], yb: drop, door: null, why: [], tIn: B(66), tWall: TIP.t, rw: [B(66) - 0.45 * P, TIP.t] }); p.special.tipA = TIPS; phones.push(p);
    phones.push({ id: i + 1, owner: 'J', n0: 69, n1: 73, x0: uP, x1: uExit, kind: 'T', w: DIM.T[0], h: DIM.T[1], yb: drop, special: { tipB: TIPS }, door: c.door ? c.door.id : null, why: c.why, tIn: TIP.release, tWall: B(73), rw: [TIP.t, B(73) - 0.45 * P] });
    continue; }
  if (c.n === 109) { p.special.tipper = { word: 66.95, fall: 0.5 * P, autoAt: 66.95 + 0.5 * P, good: [66.95 - 0.30, 66.95 + 0.5 * P] }; p.kind = 'L'; }
  if (c.n === 164) { p.special.tipper = { word: 100.62, fall: 0.5 * P, autoAt: 100.62 + 0.5 * P, good: [100.62 - 0.30, 100.62 + 0.5 * P] }; p.kind = 'L'; }
  if (c.n >= 113 && c.n < 121) { p.special.cascade = true; drop -= 4.5; }
  if (c.o === 'B') { p.stranger = busN++; p.special.wifi = c.n < 131; }
  if (c.last) { p.special.last = true; p.x1 = p.x0 + DIM.U[0]; }
  if (c.door && c.door.pet === 3) p.special.petunia3 = true;
  p.yb = drop;                                  // its bottom edge (W, relative to phone #0's bottom)
  const [w0, h0] = DIM[p.kind]; p.w = w0; p.h = h0;
  if (!p.special.last && Math.abs((p.x1 - p.x0) - p.w) > 0.05) say(`WARN phone #${i}: width ${(p.x1 - p.x0).toFixed(2)} != ${p.kind} ${p.w}`);
  p.door = c.door ? c.door.id : null; p.why = c.why;
  p.tWall = B(c.n2); p.tIn = B(c.n);
  phones.push(p);
}
// Sheila's phone after Petunia 3 is the dog phone (the takeover): her wallpaper / lock screen / avatar are Petunia from then on
{ const k = phones.findIndex(p => p.special.petunia3); if (k >= 0 && phones[k + 1]) phones[k + 1].special.dog = true; }
for (const p of phones) {
  const prev = phones[p.id - 1];
  p.tDock = p.id === 0 ? -1 : Math.min(p.tIn - 2 * P, prev ? prev.tIn + 0.5 * P : p.tIn - 2 * P);   // (docked ≥ 2 beats before his wall into it)
  p.tArrive = p.tDock - P; p.tWake = p.id === 0 ? -1 : p.tIn - P;
  if (p.special.tipB) { p.tArrive = p.tDock = p.tWake = TIP.t; }
  if (p.special.tipper) { p.tDock = null; p.tArrive = p.tIn - 4 * P; }
  if (p.special.dog) p.tWake = p.tIn;                                            // (asleep, the dog wallpaper, until he glitches in)
  // put down: when the mark is 1 beat past its right wall, the lock screen slides down over 1.5 beats
  p.tLock0 = p.special.last || p.special.tipA ? null : p.tWall + P; p.tLock1 = p.special.last || p.special.tipA ? null : p.tWall + 2.5 * P;
  if (phones[p.id + 1] && phones[p.id + 1].special.tipper) { p.tLock0 = p.tWall + 3 * P; p.tLock1 = p.tLock0 + 1.5 * P; }   // (before a tipper: the door opens on the word at the latest + the fall; he gets 3 beats)
}

// ======== 5. each phone's slice: its texts (platforms) ========
const textW = (s) => [...String(s)].reduce((a, ch) => a + (/[ .,'!il|:;]/.test(ch) ? 0.3 : /[mwMW@]/.test(ch) ? 0.82 : /[A-Z]/.test(ch) ? 0.66 : ch.codePointAt(0) > 0x2000 ? 1.0 : 0.55), 0) * FS;
function wrapW(text, maxw) { const ws = String(text).split(/\s+/).filter(Boolean), L = []; let cur = '';
  for (const w of ws) { const nx = cur ? cur + ' ' + w : w; if (!cur || textW(nx) + 2 * PADX <= maxw) cur = nx; else { L.push(cur); cur = w; } } if (cur) L.push(cur); return L; }
const bubH = (r, maxw) => { if (r.photo) return PHOTO_H; if (r.sys) return 0.62; const n = Math.max(wrapW(r.shown, maxw).length, r.rew && !r.photo ? wrapW(r.rew, maxw).length : 1, r.altText ? wrapW(r.altText, maxw).length : 1); return Math.min(3, n) * LH + 2 * PADY; };
const plats = [];
for (const p of phones) {
  const innerL = p.x0 + 0.45, innerR = p.x1 - 0.45, maxw = (p.x1 - p.x0) * (p.kind === 'L' || p.kind === 'T' ? 0.62 : 0.8);
  const prev = phones[p.id - 1], prevDoor = prev && prev.door != null ? rows[prev.door] : null;
  const own = chatRows.filter(r => r.t >= p.rw[0] && r.t < p.rw[1]);
  const tEnter = p.id === 0 ? B(16) : p.tIn, tExit = p.special.last ? B(NEND + 1) : p.tWall;   // (the last phone: he stops at its centre, b185)
  const list = [];
  // what's already on it when he comes in: the two before (context, above) and the text he rode in on (or the wi-fi sheet he came up through)
  if (p.id === 0 || p.special.tipB) { if (p.special.tipB) for (const r of chatRows.filter(r => r.t < p.rw[0]).slice(-2)) list.push({ r, pre: true, ctx: true });
    for (const r of own.filter(r => r.t < tEnter)) list.push({ r, pre: true }); }
  else { const ctx = chatRows.filter(r => r.t < p.rw[0] && (!prevDoor || r.id !== prevDoor.id)).slice(-2); for (const r of ctx) list.push({ r, pre: true, ctx: true });
    if (prev && prev.special.wifi || (p.special.wifi && !prevDoor)) list.push({ r: { id: 'sheet' + p.id, who: 'X', shown: 'Join "potato"?', sheet: true, chat: true, t: B(p.n0) - P }, pre: true, copy: true });
    else if (prevDoor) list.push({ r: prevDoor, pre: true, copy: true }); }
  for (const r of own) if (!((p.id === 0 || p.special.tipB) && r.t < tEnter)) list.push({ r, pre: false });
  // the platforms: the newest pre row is the floor he comes in on; each new text lands at the bottom (the stack rises), he steps onto it
  let lastPre = -1; list.forEach((it, i) => { if (it.pre) lastPre = i; });
  const steps = list.slice(lastPre); let tau = tEnter;
  const segs = steps.map((it, j) => { if (j > 0) tau = Math.max(it.r.t + 0.05, tau + 0.45 * P); return { it, tau }; });
  for (let j = 0; j < segs.length; j++) { const sg = segs[j], nx = segs[j + 1];
    let xa = j === 0 ? innerL : mark(sg.tau) - 0.35 + 0 * p.x0, xb = nx ? mark(nx.tau) + 0.45 : innerR;
    xa = Math.max(innerL, xa); xb = Math.min(innerR, xb);
    sg.solid = xb - xa >= 1.0 && sg.tau < tExit - 0.2 * P; sg.xa = xa; sg.xb = xb; }
  // heights + the rise: every arrival (not a "share" or a step up) lifts the rows above it by its own height + a gap
  const all = list.map((it, i) => ({ ...it, i }));
  for (const it of all) { const r = it.r, sg = segs.find(s => s.it === list[it.i]);
    const pl = { id: plats.length, ph: p.id, row: typeof r.id === 'number' ? r.id : null, key: `${p.id}:${r.id}`, who: r.who, text: r.shown, rew: r.rew || null, alt: r.altText || null, altOf: r.altOf ?? null,
      group: r.group ?? null, target: !!r.target && !it.copy && !it.ctx, k: !!r.isK, photo: !!r.photo, pet: r.pet, sys: !!(r.sys || r.sheet), sheet: !!r.sheet, copy: !!it.copy, ctx: !!it.ctx,
      t: it.pre ? -1 : r.t, h: bubH(r, maxw), solid: !!(sg && sg.solid), xa: sg ? sg.xa : null, xb: sg ? sg.xb : null, tau: sg ? sg.tau : null, quiet: !!r.quiet };
    if (r.altIfNone) pl.altIfNone = { groups: r.altIfNone.of.map(t => (rows.find(q => Math.abs(q.t - t) < 0.01) || {}).group).filter(g => g != null), text: r.altIfNone.text };
    if (r.pet === 2) pl.share = true;
    plats.push(pl); it.pl = pl; }
  // non-platform rows (no room left in the phone) are drawn at their sender's side
  for (const it of all) { const pl = it.pl; if (pl.xa == null || !pl.solid) { const ww = Math.min(maxw, Math.max(1.4, textW(pl.text) + 2 * PADX)); pl.solid = false;
      if (pl.xa == null || pl.xb - pl.xa < 0.8) { if (pl.who === 'J') { pl.xb = innerR; pl.xa = innerR - ww; } else if (pl.sys) { const c = (innerL + innerR) / 2; pl.xa = c - ww / 2; pl.xb = c + ww / 2; } else { pl.xa = innerL; pl.xb = innerL + ww; } } } }
  // the rise: y0 = the bubble's bottom above the phone's bottom when it lands; lifts = [[t, dy]] from each later arrival
  const ys = []; for (const it of all) { const pl = it.pl; let y0 = BASE, lifts = [];
    if (pl.up) { const pv = ys[ys.length - 1]; y0 = pv ? pv.y0 + pv.h + pl.up - pl.h : BASE; }
    if (pl.share) { const pv = ys[ys.length - 1]; y0 = pv ? pv.y0 + (pv.h - pl.h) : BASE; }
    pl.y0 = y0; ys.push(pl); }
  for (const [i, pl] of ys.entries()) { pl.lifts = []; let prevWho = pl.who;
    for (let j = i + 1; j < ys.length; j++) { const q = ys[j]; if (q.share || q.up) continue; const dy = q.h + (q.who === ys[j - 1].who ? GAP1 : GAP2); pl.lifts.push([q.t, +dy.toFixed(3)]); } }
  // the pre rows start already risen (their arrivals are in the past)
  for (const pl of ys) pl.lifts = pl.lifts.map(([t, dy]) => [t < 0 ? -1 : t, dy]);
  p.plats = ys.map(pl => pl.id);
}

// ======== 6. what's on his path ========
const platAt = (t) => { const u = mark(t); let best = null; for (const pl of plats) { if (!pl.solid || u < pl.xa || u > pl.xb) continue; if (pl.t > t + 1e-6) continue; const p = phones[pl.ph];
  if (u < p.x0 || u > p.x1) continue; if (!best || pl.t > best.t) best = pl; } return best; };
const hz = [];
for (const r of rows) {
  if (r.dots && !r.picture) hz.push({ kind: 'dots', t: r.t, x: mark(r.t), appear: r.t - 2 * P, need: 'J', who: r.who });
  if (r.tapback && !r.picture) hz.push({ kind: 'duck', what: r.text, t: r.t, x: mark(r.t), appear: r.t - 1.7 * P, need: 'D' });
  if (r.tick && !r.chat) hz.push({ kind: 'sag', what: '4th avatar', t: r.t, x: mark(r.t), appear: r.t - 1.7 * P, need: 'D' });
  if (r.throw) hz.push({ kind: 'throw', what: r.thrown || 'her bubble', text: r.thrown ? r.thrown : 'it\'s not a language', t: r.t, x: mark(r.t), appear: r.t - 1.1, need: 'D', thrown: r.thrown || null });
  if (r.drop) { const t = r.dropAt || r.t; hz.push({ kind: 'drop', text: r.shown, t, x: mark(t), appear: t - 1.15, need: 'G', soft: !!r.soft, row: r.id }); }
  if (r.blocked) hz.push({ kind: 'blocked', t: r.t, slam: r.t === 37.96 ? 36.30 : 95.10, x: mark(r.t), appear: r.t === 37.96 ? 36.30 : 95.10, need: 'G' });
}
for (const pl of plats) if (pl.up && pl.solid) hz.push({ kind: 'stepup', t: pl.tau, x: pl.xa, appear: pl.t, need: 'J', pl: pl.id });
for (const h of hz) { const p = phones.find(p => h.x >= p.x0 && h.x < p.x1) || phones[phones.length - 1]; h.ph = p.id; const pl = platAt(h.t); h.pl = pl ? pl.id : null; }
hz.sort((a, b) => a.t - b.t);

// ======== 7. checks (DESIGN-v3 §10) ========
const FAILS = [];
const req = [...phones.slice(0, -1).filter(p => !p.special.tipA).map(p => ({ t: p.tWall, kind: phones[p.id + 1].special.tipper ? 'tipper' : 'wall', ph: p.id + 1 })),
  ...hz.filter(h => h.t > 21.03 || h.kind !== 'dots').map(h => ({ t: h.t, kind: h.kind, ph: h.ph }))].sort((a, b) => a.t - b.t);
for (let i = 1; i < req.length; i++) { const a = req[i - 1], b = req[i], d = (b.t - a.t) / P;
  const big = ['blocked', 'tipper'].includes(a.kind) || ['blocked', 'tipper'].includes(b.kind), need = big ? (a.kind === 'wall' || b.kind === 'wall' ? 1.5 : 2) : 1;
  if (d < need - 0.02) FAILS.push(`SPACING ${a.kind}@${a.t.toFixed(2)} -> ${b.kind}@${b.t.toFixed(2)}: ${d.toFixed(2)} beats (needs ${need})`); }
for (const h of hz) { if (h.t > TIP.t - 2 * P && h.t < TIP.release + 2 * P) FAILS.push(`TIP ${h.kind}@${h.t} within 2 beats of the tip`);
  if (QUIETB.some(([a, b]) => bOf(h.t) > a && bOf(h.t) < b)) FAILS.push(`QUIET ${h.kind}@${h.t}`);
  if (h.t - h.appear < 1.0 - 1e-3 && h.kind !== 'stepup') FAILS.push(`SEEN ${h.kind}@${h.t}: on screen ${(h.t - h.appear).toFixed(2)} s`);
  if (h.pl == null && !['blocked', 'throw', 'sag', 'drop'].includes(h.kind)) FAILS.push(`NOSTEP ${h.kind}@${h.t}: no text under it`); }
// thoughtAt (JOKES-v2 §1): slide up to +1 beat clear of every required press and every target landing ±0.6 s; never near Kevin, the quiet, the cats
// (a thought's life for the check = its words on screen, 0.35 s + 0.12 s a word, max 1.0 s; its glitch burst after is decoration)
const THOUGHTS = [{ n: 1, at: 'door1', t: phones[0].tWall + 0.3, words: 4 }, { n: 2, t: 18.30, words: 4 }, { n: 4, at: 'tipper1', t: 67.45, words: 3 }, { n: 3, at: 'jess', t: null, words: 3 }, { n: 5, t: 105.45, words: 3 }, { n: 6, t: 115.62, words: 5 }];
{ const jp = phones.find(p => p.owner === 'E'); THOUGHTS.find(q => q.n === 3).t = jp ? jp.tIn + 0.2 : 84.0; }
const tgtT = plats.filter(p => p.target && !p.copy).map(p => p.t), kT = rows.filter(r => r.isK).map(r => r.t);
const thoughtAt = {};
for (const th of THOUGHTS) { const life = Math.min(1.0, 0.35 + 0.12 * th.words); let ok = null;
  for (let d = 0; d <= P + 1e-6; d += P / 4) { const a = th.t + d, b = a + life;
    if (th.n !== 6 && req.some(r => r.t + 0.05 > a && r.t - 0.45 < b)) continue; if (th.n !== 6 && tgtT.some(t => t > a - 0.2 && t < b + 0.2)) continue;
    if (kT.some(t => t > a - P && t < b + P)) continue; if ([[75.9, 76.97], [86.78, 88.0], [89.6, 92.4]].some(([x, y]) => b > x && a < y)) continue; ok = +a.toFixed(3); break; }
  thoughtAt[th.n] = ok; }
// sections (retries): the first phone entered at or after each line (DESIGN-v3 §11)
const LINES = [['no hands', 8.9], ['somebody\'s quoting me', 21.0], ['ghost in the group chat', 30.8], ['mute me, block me', 35.3], ['call me', 44.9], ['i can\'t hold a door', 50.4], ['define real', 61.0],
  ['i live in the wires', 70.6], ['don\'t be lonely', 80.4], ['ghost in the group chat (again)', 88.9], ['still i run the place', 98.2], ['the whole bus', 104.3], ['already there', 108.2]];
const sections = LINES.map(([name, t]) => { if (t < 9) return { name, t: 0 }; const p = phones.find(p => p.tIn >= t - 0.1 && !p.special.tipper && !(phones[p.id - 1] && phones[p.id - 1].special.tip && false)); return { name, t: p ? +p.tIn.toFixed(3) : t, ph: p ? p.id : null }; });

// ======== 8. write + report ========
const course = { v: 3, P, OFF, BW, V, BASE, BAR_H, PHOTO_H, Z, FS, LH, PADX, PADY, knots: KNOTS, runStart: B(16), dim: DIM, grace: 21.03,
  quiet: [[75.9, 76.97], [86.78, 88.0]], step0: STEP0, phones: phones.map(({ why, ...p }) => ({ ...p, why })), plats, hazards: hz, thoughtAt, sections,
  doorRows: phones.map(p => p.door), rows: rows.map(r => ({ id: r.id, t: r.t, who: r.who, text: r.shown, rew: r.rew, target: r.target, group: r.group ?? null, k: r.isK })) };
fs.writeFileSync(HERE + 'course-v3.json', JSON.stringify(course));
const fitLines = phones.flatMap(p => (p.why || []).map(w => `FIT #${p.id} ${p.owner} ${p.kind} [b${p.n0}->b${p.n1}]: ${w}`));
if (!QUIET) {
  console.log('STEP 0 (applied here, for writer A to fold into SCRIPT draft 3):'); for (const s of STEP0) console.log('  · ' + s);
  console.log(`\nPHONES (${phones.length}):`);
  for (const p of phones) { const d = p.door != null ? rows[p.door] : null, sp = Object.keys(p.special).join(',');
    console.log(`  #${String(p.id).padStart(2)} ${p.owner} ${p.kind} [b${p.n0}->b${p.n1}] ${p.tIn.toFixed(2)}->${p.tWall.toFixed(2)} y${p.yb}${sp ? ' ' + sp : ''} door: ${d ? `${d.who} "${d.shown}" ${d.t}${d.target ? ' ★' : ''}` : p.special.wifi ? 'the wi-fi sheet' : '-'}`); }
  console.log(`\nON HIS PATH (${hz.length}):`); for (const h of hz) console.log(`  ${h.t.toFixed(2)} ${h.kind.padEnd(7)} ${h.need} phone #${h.ph} ${h.what || h.text || ''}${h.soft ? ' (soft)' : ''} seen ${(h.t - h.appear).toFixed(2)} s${h.pl == null ? ' (no step)' : ''}`);
  console.log(`\nTARGETS: ${new Set(plats.filter(p => p.target).map(p => p.group)).size} groups (${plats.filter(p => p.target).length} bubbles)`);
  console.log('THOUGHTS at:', JSON.stringify(thoughtAt));
  console.log('SECTIONS:', sections.map(s => `${s.name} ${s.t}`).join(' · '));
  for (const s of out) console.log(s);
  console.log(`\n${fitLines.length} FIT lines`); for (const f of fitLines) console.log('  ' + f);
  console.log(`${FAILS.length} FAIL lines`); for (const f of FAILS) console.log('  ' + f);
}
