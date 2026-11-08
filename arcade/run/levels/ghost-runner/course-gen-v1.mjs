// Ghost runner course generator (designer, Nov 4). Run: node course-gen.mjs course.json [list]. Edit SEC, rerun; the builder reads course.json.
// (The rows->phone count it prints is only a density check: every lit phone shows the same live thread, DESIGN.md §3.) Units: h = Potato's height. Writes course.json + prints checks.
import fs from 'fs';
const G = '/Users/matthewpalmer/claude-studio-work/game/';
const { THREAD } = await import(G + 'run/levels/ghost-in-the-group-chat.mjs');
const P = 0.61227, OFF = 0.21, V = 3.0, HB = V * P;            // scroll h/s · h per beat (1.5)
const bt = b => +(OFF + P * b).toFixed(3);
const T0 = 8.9, TW0 = 70.62, TW1 = 80.42;                         // scroll start · tower (scroll stops, camera goes down)
const S = t => t <= TW0 ? V * (t - T0) : t <= TW1 ? V * (TW0 - T0) : V * (t - T0 - (TW1 - TW0));
const UP = { w: 2.5, h: 5.2 }, SIDE = { w: 5.2, h: 2.5 }, BUS = { w: 2.0, h: 4.2 };
// (the lists below were written for a 3.6h phone; YB/AMP map them onto the 5.2h phone: yb - 0.9, motion x0.8)
const YB = y => +(y - 0.9).toFixed(2), AMP = m => m ? [+(m[0] * 0.8).toFixed(2), m[1], m[2]] : null;
// sections: [name, t0, list of phones]. Each phone: [kind, pitchBeats(to the NEXT phone's left edge), yb, motion|null, owner, extra]
// kind U upright (walls, enter by glitch) · S sideways (a slab; top = floor) · X screenshot (Jess: frozen, upright, open sides? no: walls) ·
// B +41 small upright · D dark (powered off: a solid block, top = floor)
// motion [A, per, phase]: piston between yb and yb+A; holds `per` beats at each end, moves over 0.5 beat, starting at beat `phase` (mod 2·per)
const st = 'static';
const SEC = [
 ['A no hands (teach)', 8.9, [
   ['U',2,-2.6,null,'J',{start:true, hint:'walk + SPACE through the wall'}], ['U',2,-2.6,null,'S'], ['U',2,-2.6,null,'J'], ['U',2,-2.6,null,'S'],
   ['U',2,-2.4,null,'J'], ['U',2,-2.6,null,'S'], ['U',2,-2.2,null,'J'], ['U',2,-2.6,null,'S',{}], ['U',2,-2.6,null,'J'], ['U',1.75,-2.4,null,'S'] ]],
 ['B uninvited, on time', 21.0, [
   ['U',2,-2.6,[0.6,4,0],'J',{note:'first mover: slow piston'}], ['U',2,-2.6,null,'S'], ['S',3.25,-2.6,null,'J',{note:'first sideways phone, already lying: meet it safely'}],
   ['U',2,-2.8,[0.8,2,1],'S',{note:'24.18 her long text = full-width floor'}], ['U',2,-2.4,[0.8,2,0],'J'], ['U',1.75,-2.6,null,'S'] ]],
 ['C ghost in the group chat (chorus 1)', 29.6, [
   ['U',1.75,-2.4,[1.0,2,0],'S'], ['U',1.75,-2.8,[1.0,2,1],'J',{note:'Biscuit photo 1'}], ['U',1.75,-2.6,[1.0,2,0],'J',{note:'photo 2'}], ['U',1.75,-2.4,[1.0,2,1],'J',{note:'photo 3'}],
   ['U',2,-2.6,[0.8,2,0],'S',{note:'32.66 CHAIR throw'}] ]],
 ['D mute me, block me', 35.3, [
   ['U',2,-2.6,null,'S',{note:'BLOCKED crusher warns 36.30'}], ['U',2,-2.6,null,'J'], ['U',2,-2.6,null,'S',{note:'crusher lands 37.96 here: glitch through'}],
   ['U',2,-2.4,[0.8,2,0],'J'], ['U',2,-2.8,[0.8,2,1],'S'], ['U',2,-2.4,null,'J'],
   ['U',1.75,-2.6,[0.8,2,0],'J'] ]],
 ['E already there', 44.9, [
   ['U',4.63,-2.2,null,'S',{tip:{t:41.84, warn:1.5, dir:1, word:'still'}, note:'FIRST TIP: 2-3 s ahead of him, falls away (right) and lands as a slab: demonstration'}], ['U',2,-2.6,[1.0,2,1],'J',{note:'48.11 tapback bumper'}], ['S',3.25,-2.2,[0.8,4,0],'S',{note:'a moving sideways phone; 49.26 already there'}] ]],
 ['F i can\'t hold a door (verse 2)', 50.4, [
   ['U',2,-2.4,[1.2,2,1],'J',{note:'soup photo'}], ['U',2,-2.8,[1.2,2,0],'J',{note:'soup photo 2'}], ['S',3.25,-2.0,null,'S'], ['U',1.75,-2.6,[1.2,2,1],'J'], ['U',1.75,-2.6,[1.2,2,0],'S'],
   ['SW',3.25,-3.0,[1.25,2,0],'S',{sandwich:{hiYb:0.2, hiOwner:'J'}, note:'SQ1 THE SANDWICH: a sideways phone rising/sinking under a parked sideways phone. Low route between them (go while it is DOWN, 2 beats), high route on top. Squish = between them when it rises'}],
   ['U',2,-2.6,[1.2,2,1],'S',{note:'58.99 HUG throw'}] ]],
 ['G define real', 61.0, [
   ['U',3,-2.4,[1.2,2,0],'S'], ['U',2.5,-2.8,[1.4,2,1],'J',{note:'define x3 SUPER lands here'}], ['U',2.5,-2.6,[1.4,2,0],'J'], ['S',5.77,-2.4,null,'S',{note:'then a 5.4h gap: too wide to hop (3.6 max) until the next phone falls into it'}],
   ['U',2,-2.2,null,'J',{tip:{t:66.95, warn:1.5, dir:-1, word:'forget'}, note:'SECOND TIP, toward him: falls back into the 5.4h gap and becomes the BRIDGE (or glitch through its wall before)'}],
   ]],
 ['H i live in the wires (the TOWER)', 70.4, [ ['TOWER',0,0,null,'J'] ]],
 ['I one of the boys', 80.42, [
   ['U',2,-2.6,null,'S'], ['U',2,-2.4,[1.0,2,0],'J'], ['X',2,-2.6,null,'Jess',{note:'83.10 "sending it to my sister": Jess\'s phone = the SCREENSHOT, frozen, a rest'}],
   ['X',4.63,-2.2,null,'Jess',{tip:{t:85.93, warn:1.5, dir:1, word:'body'}, note:'THIRD TIP, as he arrives: if inside at the wobble it spits him out the top (random move); on top: he rides it'}], ['U',2,-2.6,[1.2,2,1],'J'] ]],
 ['J ghost in the group chat (chorus 2, peak 1)', 88.9, [
   ['U',1.75,-2.4,[1.2,2,1],'J',{note:'Petunia 1'}], ['U',1.75,-2.8,[1.4,2,0],'J',{note:'Petunia 2'}], ['U',2,-2.4,[1.2,2,1],'J',{note:'Petunia 3'}], ['U',2,-2.6,null,'S',{note:'91.25 and WHOSE cat is that'}],
   ['S',3.25,-2.0,[0.8,2,0],'S',{tipUp:{t:92.05, warn:1.5, word:'everywhere', pivot:'left'}, note:'the sideways phone STANDS BACK UP on its LEFT end (twist): upright again at [x0, x0+2.5], a wall to glitch through'}], ['U',1.75,-2.6,null,'S',{note:'BLOCKED crusher 2 warns 95.10'}],
   ['U',2,-2.6,null,'J',{note:'crusher 2 lands 96.71: glitch through'}] ]],
 ['K still i run the place (peak 2, the hardest)', 98.2, [
   ['U',2,-2.6,null,'S'], ['U',4.63,-2.2,null,'Carol',{locked:99.05, note:'dark until 99.05 (added): buzzes, wobbles, tips on STILL',tip:{t:100.62, warn:1.5, dir:1, word:'still'}}], ['U',2,-2.6,[1.0,8,0],'Mum',{locked:100.28, note:'100.28 Mum: slow steady rise (the safe phone)'}],
   ['B',1.5,-2.6,[1.0,2,0],'+41',{locked:101.51}], ['SW',3.25,-3.0,[1.25,2,1],'+41',{locked:101.51, sandwich:{hiYb:0.2, hiOwner:'+41'}, note:'SQ2: the sandwich again, in the crowd, at speed'}], ['B',1.5,-2.8,[1.2,2,0],'+41',{locked:101.51, squish:'SQ2'}],
   ['U',2,-2.4,[1.0,2,1],'J',{note:'104.95 You left · 106.42 nothing\'s wrong (last target)'}] ]],
 ['L outro: turn your phone off', 108.2, [
   ['U',2,-2.6,null,'S'], ['U',2,-2.4,null,'J'], ['U',2,-2.6,null,'S'], ['U',2,-2.4,null,'J'], ['U',2,-2.6,null,'S'],
   ['U',0,-2.6,null,'J',{end:true, note:'THE LAST LIT PHONE: James\'s. scroll stops when its centre reaches home (115.62); slide to power off'}] ]],
];
// lay out
const phones = []; let x = -0.6, id = 0;
for (const [name, t0, list] of SEC) {
  if (list[0][0] === 'TOWER') {
    const xt = S(TW0);                       // the tower column's left edge passes home as the scroll stops
    if (x > xt - 0.6) console.log('!! tower overlaps previous', x, xt);
    for (let k = 0; k < 3; k++) phones.push({ id: id++, sec: name, kind: 'U', owner: ['J', 'S', 'J'][k], x0: +xt.toFixed(3), yb: +(-3.5 - k * 5.8).toFixed(2), w: UP.w, h: UP.h, motion: null,
      tower: k, walls: k === 0 ? 'L+bottom' : k === 2 ? 'top+R' : 'top+bottom' });
    x = xt + UP.w + 1.2; continue;
  }
  const want = S(t0) + 1.2; if (x > want + 0.01) console.log(`!! section ${name} starts late by ${(x - want).toFixed(2)}h = ${((x - want) / HB).toFixed(2)} beats`); else { const d = Math.min(want - x, 0.9); if (want - x > 0.9) console.log(`.. section ${name}: drifts ${(want - x - 0.9).toFixed(2)}h early`); x += Math.max(0, d); }
  for (const [kind, pb, yb, m, owner, ex = {}] of list) {
    const dim = kind === 'S' || kind === 'SW' ? SIDE : kind === 'B' ? BUS : UP;
    if (ex.end) x = Math.max(x, S(115.62) - UP.w / 2);
    if (ex.start) x = -0.6;
    phones.push({ id: id++, sec: name, kind, owner, x0: +x.toFixed(3), yb: YB(yb), w: dim.w, h: dim.h, motion: AMP(m), ...ex });
    x += pb * HB;
  }
}
// when each phone's left edge passes home
const tOfX = xx => { const a = V * (TW0 - T0); if (xx <= a) return T0 + xx / V; return TW1 + (xx - a) / V; };
for (const p of phones) p.tHome = +tOfX(p.x0).toFixed(2);
// checks: gaps, heights, view
const gaps = []; for (let i = 1; i < phones.length; i++) { const a = phones[i - 1], b = phones[i]; if (b.tower != null || a.tower != null) continue; const g = b.x0 - (a.x0 + a.w); gaps.push(g); if (g < 0.6 || g > 2.3) console.log('gap?', a.id, b.id, g.toFixed(2)); }
for (const p of phones) { const hi = p.yb + p.h + (p.motion ? p.motion[0] : 0); if (p.tower == null && hi > 3.2) console.log('under the lyrics band', p.id, hi.toFixed(2)); if (p.tower == null && p.yb < -3.95) console.log('too low', p.id); }
// rows -> phones: a text lands in the first phone whose left edge is >= home + 2.4h when it lands (James's targets land 1.3 s early);
// photo rows: one per phone. Tower: rows 70.4..80.4 land in the tower phone of their third.
const LANDA = 3.0, out = []; let lastPh = -1;
for (const r of THREAD) {
  const land = r.w === 'J' && r.tg ? r.t - 1.3 : r.t;
  let ph;
  if (r.t >= 70.4 && r.t < 80.42) { const k = r.t < 73.89 ? 0 : r.t < 77.15 ? 1 : 2; ph = phones.find(p => p.tower === k); }
  else { ph = phones.find(p => p.tower == null && p.x0 >= S(land) + LANDA && !(r.ph && p.id <= lastPh)); }
  if (r.ph) lastPh = ph.id;
  out.push({ t: r.t, w: r.w, x: r.x || r.ph || r.tb || '', phone: ph ? ph.id : null });
}
const per = {}; for (const o of out) per[o.phone] = (per[o.phone] || 0) + 1;
const counts = Object.values(per); console.log('phones', phones.length, 'rows/phone max', Math.max(...counts), 'over 5:', Object.entries(per).filter(([, n]) => n > 5).map(([k, n]) => `#${k}:${n}`).join(' '));
console.log('gap range', Math.min(...gaps).toFixed(2), Math.max(...gaps).toFixed(2), 'course end x', x.toFixed(1), 'home at 115.62', S(115.62).toFixed(1));
const last = phones[phones.length - 1]; console.log('last phone', last.id, 'x0', last.x0, 'its centre at home at t=', tOfX(last.x0 + last.w / 2).toFixed(2));
fs.writeFileSync(process.argv[2], JSON.stringify({ units: 'h (Potato height)', V, beat: P, OFF, T0, tower: [TW0, TW1], phones }, null, 0).replace(/\{"id"/g, '\n{"id"'));
if (process.argv[3]) for (const p of phones) console.log(p.id, p.sec.split(' ')[0], p.kind, p.owner, 'x0', p.x0, 'yb', p.yb, 'tHome', p.tHome, p.motion ? 'm' + JSON.stringify(p.motion) : '', p.tip ? 'TIP' + p.tip.t : '', p.tipUp ? 'UP' + p.tipUp.t : '', 'rows', per[p.id] || 0);
