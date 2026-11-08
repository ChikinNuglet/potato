// living.mjs — Potato's living room (Nov 8). Chikin: "the kitchen needs a room that leads to a living room, that is where the front door
// that leads to the street will be" / "the left should lead to the living room" / "the living room also needs a set of stairs to a door we
// can use later". A room is just a file (POTATO-HEAD-CANON.md): this is the living room's file. kitchens.mjs hands it the kitchen's own
// painter kit (same ink, same cel shade, same warm light) and registers what it returns as the room 'living'; room.mjs opens it from
// the left door of Potato's own kitchen.
// Same composition as every kitchen (painted in raw 0..1600 x 0..900, squeezed between the two doors, he stands at y 707):
//   left wall  = the FRONT DOOR (No. 404). It only opens a crack: the street, the outside he's never been (intro.mjs: leftShut = a peek).
//   right wall = the door back to the kitchen (warm, always ajar).
//   in between = the floor lamp, the couch (sat-in: his dent is in it), the side table + mug, the TV, the plant, the stairs up to a landing
//                and a shut door with light under it ("later"), the cupboard under the landing.
// Shown, not labelled: no signs. The only words are the house number on the front door, because that's what a front door has.
export function livingRoom(K) {
  const { INK, WARM, TAU, rnd, box, poly, circ, ell, seg, glow, cone, steam, city, rgba, dk, lt, topShade, PIECE, Z, since, landed, fade, wob, ez } = K;
  const FLOOR = 707, ST = { x0: 910, w: 45, n: 8, rise: 34 }, LAND = { x0: 1270, x1: 1530, top: 435 };
  const topAt = X => X < ST.x0 ? FLOOR : X >= LAND.x0 ? LAND.top : FLOOR - ST.rise * Math.min(ST.n, Math.floor((X - ST.x0) / ST.w) + 1);
  const night = () => { const h = new Date().getHours(); return h < 6 || h >= 19; };   // (the outside follows the visitor's clock, like the kitchen window)
  const WOOD = '#8a5a36', WOOD2 = '#6b4426', TREAD = '#a06a40', SOFA = '#a8452e', DOORC = '#2f5560';

  // the outside: sky, a row of buildings, a lamp post, the curb. Used by the window (static) and the front door's crack (live: a car goes by)
  function street(x, X, Y, W, H, t, live) {
    const n = night(); x.save(); x.beginPath(); x.rect(X, Y, W, H); x.clip();
    const g = x.createLinearGradient(0, Y, 0, Y + H); if (n) { g.addColorStop(0, '#070d22'); g.addColorStop(1, '#1c2b55'); } else { g.addColorStop(0, '#5aa6e6'); g.addColorStop(1, '#cfe8f5'); }
    x.fillStyle = g; x.fillRect(X, Y, W, H);
    if (n) { x.fillStyle = 'rgba(242,230,196,.85)'; for (let i = 0; i < 10; i++) x.fillRect(X + rnd(i, 21) * W, Y + rnd(i, 22) * H * 0.3, 2, 2); }
    city(x, X - 6, Y + H * 0.22, W + 12, H * 0.52, Math.max(4, Math.round(W / 34)), n ? WARM : '#ffffff00', 404);
    x.fillStyle = n ? '#262a35' : '#77746e'; x.fillRect(X, Y + H * 0.8, W, H * 0.2);                         // the road
    x.fillStyle = n ? '#3e4350' : '#aaa59b'; x.fillRect(X, Y + H * 0.72, W, H * 0.09);                        // the pavement
    seg(x, [[X, Y + H * 0.81], [X + W, Y + H * 0.81]], 3, n ? '#161922' : '#5a5650');                         // the curb
    if (live) { const k = (t * 0.16) % 1; if (k < 0.3) { const u = k / 0.3, cx = X - 70 + (W + 140) * u, cy = Y + H * 0.88;   // a car goes by, now and then
      box(x, cx - 34, cy - 14, 68, 18, '#d4a13a', { r: 7, lw: 3, sh: 'b', f: 0.3 }); box(x, cx - 18, cy - 26, 36, 14, '#d4a13a', { r: 6, lw: 3, sh: 'n' });
      circ(x, cx - 20, cy + 5, 6, '#1a1a1e', { sh: 'n', lw: 2 }); circ(x, cx + 20, cy + 5, 6, '#1a1a1e', { sh: 'n', lw: 2 }); if (n) glow(x, cx + 38, cy - 6, 40, '#fff2c8', 0.5); } }
    const lx = X + W * 0.72, top = Y + H * 0.26;                                                               // the lamp post
    seg(x, [[lx, Y + H * 0.76], [lx, top]], 6); seg(x, [[lx, top], [lx - W * 0.14, top]], 5);
    poly(x, [[lx - W * 0.14 - 10, top], [lx - W * 0.14 + 10, top], [lx - W * 0.14 + 6, top + 10], [lx - W * 0.14 - 6, top + 10]], n ? '#ffe2a8' : '#c9c2b0', { lw: 3 });
    if (n) { glow(x, lx - W * 0.14, top + 10, H * 0.42, '#ffcf8a', 0.5); x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,207,138,.12)'; x.beginPath(); x.moveTo(lx - W * 0.14 - 6, top + 10); x.lineTo(lx - W * 0.14 - W * 0.3, Y + H * 0.8); x.lineTo(lx - W * 0.14 + W * 0.3, Y + H * 0.8); x.lineTo(lx - W * 0.14 + 6, top + 10); x.fill(); x.restore(); }
    x.restore(); }

  // the stairs' side, seen from the front: a sawtooth of treads up to the landing, panelled underneath
  function stairs(x) {
    const pts = [[ST.x0, FLOOR]]; for (let k = 0; k < ST.n; k++) { const sx = ST.x0 + k * ST.w, y = FLOOR - (k + 1) * ST.rise; pts.push([sx, y + ST.rise], [sx, y]); } pts.push([LAND.x0, LAND.top], [LAND.x0, FLOOR]);
    poly(x, pts, WOOD2, { lw: 6 });
    x.save(); x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.clip();             // panels in the side, a shade on the low edge
    for (let k = 0; k < 4; k++) { const a = ST.x0 + 22 + k * 86; box(x, a, FLOOR - 70 - k * 64 + 10, 62, 52 + k * 64 - 10, dk(WOOD2, 0.08), { r: 4, sh: 'b', f: 0.25, lw: 3 }); }
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(ST.x0, FLOOR - 16, LAND.x0 - ST.x0, 16); x.restore();
    for (let k = 0; k < ST.n; k++) { const sx = ST.x0 + k * ST.w, y = FLOOR - (k + 1) * ST.rise; box(x, sx - 6, y - 4, ST.w + 8, 11, TREAD, { r: 3, sh: 'b', f: 0.35, lw: 4 }); }
    // the landing: a thick slab, a beam under it, one post holding it up
    box(x, LAND.x0 - 6, LAND.top - 4, LAND.x1 - LAND.x0 + 12, 14, TREAD, { r: 3, sh: 'b', f: 0.35, lw: 5 }); box(x, LAND.x0, LAND.top + 10, LAND.x1 - LAND.x0, 24, WOOD2, { sh: 'b', f: 0.3, lw: 5 });
    box(x, LAND.x1 - 22, LAND.top + 34, 18, FLOOR - LAND.top - 34, WOOD2, { sh: 'r', f: 0.4, lw: 5 }); }
  function banister(x) {   // the rail: a post on every step, the handrail up to the landing and along it; a fat newel post at the bottom
    const H = 104; for (let k = 0; k < ST.n; k++) { const sx = ST.x0 + k * ST.w + ST.w / 2, y = FLOOR - (k + 1) * ST.rise - 4; seg(x, [[sx, y], [sx, y - H]], 9); seg(x, [[sx, y], [sx, y - H]], 4, TREAD); }
    for (let X = LAND.x0 + 30; X < LAND.x1 - 10; X += 40) { seg(x, [[X, LAND.top - 4], [X, LAND.top - H]], 9); seg(x, [[X, LAND.top - 4], [X, LAND.top - H]], 4, TREAD); }
    const rail = [[ST.x0 - 6, FLOOR - ST.rise - H + 10], [LAND.x0, LAND.top - H], [LAND.x1, LAND.top - H]]; seg(x, rail, 14); seg(x, rail, 7, WOOD);
    box(x, ST.x0 - 20, FLOOR - ST.rise - H - 6, 26, H + ST.rise + 6, WOOD, { r: 4, sh: 'r', f: 0.35, lw: 5 }); circ(x, ST.x0 - 7, FLOOR - ST.rise - H - 12, 11, TREAD, { lw: 4 }); }

  function frames(x) {
    // a gold record, framed over the couch (his album; no words on it)
    box(x, 222, 176, 132, 132, '#5a3a26', { r: 4, lw: 6, sh: 'b', f: 0.12 }); box(x, 236, 190, 104, 104, '#1d140f', { sh: 'n', lw: 3 });
    circ(x, 288, 242, 38, '#e8b84a', { lw: 4 }); for (const r of [30, 22]) { x.beginPath(); x.arc(288, 242, r, 0, TAU); x.lineWidth = 2; x.strokeStyle = 'rgba(120,80,20,.6)'; x.stroke(); } circ(x, 288, 242, 10, '#d42f27', { sh: 'n', lw: 3 }); circ(x, 288, 242, 2.5, INK, { sh: 'n', lw: 0 });
    // a little painting of a field: the outside, as he imagines it
    box(x, 384, 214, 92, 72, '#7a4c2e', { r: 3, lw: 5, sh: 'n' }); box(x, 394, 224, 72, 52, '#8fc6e8', { sh: 'n', lw: 2 });
    poly(x, [[394, 262], [420, 248], [446, 256], [466, 246], [466, 276], [394, 276]], '#5c9a48', { lw: 2 }); circ(x, 452, 236, 7, '#fff1b0', { sh: 'n', lw: 2 }); }
  function windowSt(x) {   // the window over the TV, curtains pulled back: the street outside
    const X = 640, Y = 150, W = 220, H = 210; street(x, X, Y, W, H, 0, false);
    x.lineWidth = 16; x.strokeStyle = '#5a3a26'; x.strokeRect(X, Y, W, H); seg(x, [[X + W / 2, Y], [X + W / 2, Y + H]], 9, '#5a3a26'); seg(x, [[X, Y + H / 2], [X + W, Y + H / 2]], 9, '#5a3a26');
    x.lineWidth = 6; x.strokeStyle = INK; x.strokeRect(X - 8, Y - 8, W + 16, H + 16); box(x, X - 22, Y + H + 6, W + 44, 14, '#6b4426', { r: 3, lw: 5, sh: 'b' });
    seg(x, [[X - 40, Y - 26], [X + W + 40, Y - 26]], 7, '#3a2618');                                                  // the curtain rail
    for (const [a, d] of [[X - 34, 1], [X + W + 34, -1]]) poly(x, [[a, Y - 28], [a + d * 54, Y - 28], [a + d * 30, Y + 90], [a + d * 44, Y + H + 30], [a, Y + H + 30]], '#7a3a5a', { lw: 5, shade: [Math.min(a, a + d * 54), Y - 28, 18, H + 60] }); }
  function base(x) {
    const g = x.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#3a2519'); g.addColorStop(1, '#24160f'); x.fillStyle = g; x.fillRect(0, 0, 1600, 640);
    x.fillStyle = 'rgba(255,207,138,.06)'; for (let X = 23; X < 1600; X += 46) for (let Y = 30; Y < 540; Y += 60) { x.beginPath(); x.moveTo(X, Y - 7); x.lineTo(X + 5, Y); x.lineTo(X, Y + 7); x.lineTo(X - 5, Y); x.fill(); }   // the wallpaper's little diamonds
    topShade(x, 0.3);
    box(x, -10, 552, 1620, 88, '#4a2f1f', { sh: 'n', lw: 0 }); seg(x, [[-10, 552], [1610, 552]], 6); box(x, -10, 546, 1620, 12, '#5e3c27', { sh: 'n', lw: 4 });   // the wainscot
    PIECE('floor')(x);
    // the rug: an oval, rings of rust and mustard
    ell(x, 420, 770, 330, 52, '#7a2f2a', { lw: 6 }); ell(x, 420, 770, 280, 40, '#c98a3a', { lw: 4 }); ell(x, 420, 770, 220, 29, '#7a2f2a', { lw: 4 }); for (let k = 0; k < 9; k++) circ(x, 160 + k * 65, 770 + Math.sin(k) * 2, 4, '#e8c27a', { sh: 'n', lw: 0 });
    frames(x); windowSt(x); stairs(x); banister(x);
    // under the landing: the wall's darker, the cupboard sits there (drawn live)
    x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(LAND.x0, LAND.top + 34, LAND.x1 - LAND.x0 - 22, FLOOR - LAND.top - 34 - 67);
    // the TV cabinet + the plant pot (the TV and the leaves are live)
    box(x, 650, 604, 200, 103, WOOD2, { r: 6, lw: 6 }); box(x, 664, 620, 80, 70, WOOD, { r: 4, sh: 'b', f: 0.25, lw: 4 }); box(x, 756, 620, 80, 70, WOOD, { r: 4, sh: 'b', f: 0.25, lw: 4 }); circ(x, 734, 655, 4, '#e0b45a', { sh: 'n', lw: 2 }); circ(x, 766, 655, 4, '#e0b45a', { sh: 'n', lw: 2 });
    for (const [a, b] of [[674, 604], [758, 604]]) box(x, a, b - 4, 12, 6, INK, { sh: 'n', lw: 0 });
    poly(x, [[856, 646], [904, 646], [896, FLOOR], [864, FLOOR]], '#b5623a', { lw: 5, shade: [886, 646, 20, 70] }); box(x, 850, 638, 60, 14, '#c9724a', { r: 3, lw: 4, sh: 'n' }); }

  // ---- live parts
  function lampSt(x, t, P, lit) {   // the floor lamp by the couch: pull the chain, it swings a little
    const s = P.lamp || Z, a = wob(since(s, t), 1.6, 6) * 0.04; x.save(); x.translate(115, FLOOR); x.rotate(a); x.translate(-115, -FLOOR);
    ell(x, 115, FLOOR - 4, 34, 9, '#3a2a22', { lw: 4 }); seg(x, [[115, FLOOR - 8], [115, 350]], 10); seg(x, [[115, FLOOR - 8], [115, 350]], 5, '#c9a46a');
    poly(x, [[72, 360], [158, 360], [140, 292], [90, 292]], lit > 0.5 ? '#f2d08a' : '#b89a60', { lw: 6, shade: [130, 290, 30, 72] });
    seg(x, [[146, 360], [148, 404]], 3, '#2a2016'); circ(x, 148, 408, 5, '#d9b27a', { sh: 'n', lw: 2.5 }); x.restore(); }
  function lampLight(x, lit) { if (lit <= 0) return; cone(x, 115, 362, 40, -40, 360, 900, '#ffd696', 0.42 * lit); glow(x, 115, 330, 120, '#ffcf8a', 0.35 * lit); glow(x, 300, 540, 380, '#ffcf8a', 0.12 * lit); }
  function couch(x, t, P, me) {   // sat-in: a dip in the left cushion and a round dent in the back where he always leans; it squashes where he lands / sits
    const s = P.couch || Z, sq = 8 * fade(landed(s, t), 0.35), on = me && me.on === 'couch', mx = on ? me.x : -1e3;
    box(x, 168, 436, 364, 160, SOFA, { r: 34, sh: 'b', f: 0.22, lw: 6 });                                         // the back
    ell(x, 286, 506, 52, 42, dk(SOFA, 0.14), { lw: 0 }); seg(x, [[246, 486], [262, 470]], 4, lt(SOFA, 0.2));        // the dent where he leans
    box(x, 160, 612, 380, 64, dk(SOFA, 0.12), { r: 14, sh: 'b', f: 0.3, lw: 6 });                                     // the base
    for (const fx0 of [176, 506]) box(x, fx0, 674, 18, 33, '#3a2618', { r: 3, sh: 'n', lw: 4 });
    for (const [c0, c1] of [[200, 352], [352, 500]]) {   // the seat cushions: one sags (his), both squash under him
      const sag = (c0 < 300 ? 10 : 2), dip = mx > c0 - 20 && mx < c1 + 20 ? 12 : 0, cxm = mx > c0 && mx < c1 ? mx : (c0 + c1) / 2;
      x.beginPath(); x.moveTo(c0, 616); x.lineTo(c0, 586 + sq * 0.4); x.quadraticCurveTo(c0 + 4, 574 + sq, c0 + 18, 574 + sq);
      x.quadraticCurveTo(cxm, 574 + sag + dip + sq, c1 - 18, 574 + sq); x.quadraticCurveTo(c1 - 4, 574 + sq, c1, 586 + sq * 0.4); x.lineTo(c1, 616); x.closePath();
      x.fillStyle = lt(SOFA, 0.06); x.fill(); x.save(); x.clip(); x.fillStyle = dk(SOFA, 0.18); x.fillRect(c0, 604, c1 - c0, 14); x.restore(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); }
    for (const [a, d] of [[150, 1], [490, -1]]) box(x, a, 520, 60, 120, SOFA, { r: 26, sh: d > 0 ? 'l' : 'r', f: 0.3, lw: 6 });   // the arms
    poly(x, [[470, 520], [552, 514], [560, 600], [536, 612], [520, 560], [486, 552]], '#e0a93a', { lw: 5, shade: [536, 514, 26, 100] });   // a blanket thrown over the arm
    for (const y of [534, 556]) seg(x, [[492, y + 2], [548, y - 4]], 3, '#b5482e');
    box(x, 214, 520, 74, 52, '#3c6b4a', { r: 16, sh: 'b', f: 0.3, lw: 5 }); seg(x, [[232, 540], [270, 548]], 3, '#2f5a3c');   // a squashed cushion
    box(x, 410, 606, 30, 10, '#2a2a30', { r: 3, sh: 'n', lw: 3 }); }   // the remote, down the side of the cushion
  function sideTable(x, t) { box(x, 552, 590, 80, 12, WOOD, { r: 3, lw: 5, sh: 'b' }); for (const a of [560, 616]) box(x, a, 602, 8, FLOOR - 602, WOOD2, { sh: 'n', lw: 3 });
    box(x, 576, 560, 26, 30, '#e8e0cf', { r: 4, lw: 4, sh: 'r' }); x.beginPath(); x.arc(604, 574, 8, -1.4, 1.4); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); steam(x, 589, 556, t, 2, 60, 0.28, 5); }
  // the GAME CONSOLE (Chikin, Nov 8: "the living room needs a game console, when you glitch it, potato can sit on the couch, the controller
  // flips into his lap and the screen does a binary transition into a level select screen"): in the TV cabinet's left cubby. Glitch it
  // (E / tap, like every switch) and room.mjs does the rest (arcade.mjs). The controller is drawn here only while it's not in his lap.
  function gameConsole(x, t, P) { const s = P.console || Z, inLap = s.on;
    box(x, 664, 620, 80, 70, '#1a120d', { r: 4, sh: 'n', lw: 4 });   // the cubby, door off
    box(x, 672, 652, 64, 30, '#2a2d36', { r: 6, lw: 4, sh: 'b', f: 0.2 }); seg(x, [[680, 667], [700, 667]], 3, '#4a4f5c');
    circ(x, 724, 667, 4, rnd(Math.floor(t * 2), 9) > 0.3 ? '#4dff9a' : '#1f6b44', { sh: 'n', lw: 2 });   // the power light, breathing
    // the controller lies on the couch, right cushion, where you can see it (Chikin, Nov 8: "put the controller on the couch and make it
    // trigger once he is seated"); a cable runs down to the console
    if (!inLap) { seg(x, [[476, 566], [560, 600], [640, 640], [672, 664]], 3, '#2a2d36');
      box(x, 432, 548, 50, 20, '#3a3f4c', { r: 10, lw: 4, sh: 'b' }); circ(x, 446, 558, 4, '#e85aa8', { sh: 'n', lw: 2 }); circ(x, 468, 558, 4, '#4dd2ff', { sh: 'n', lw: 2 });
      if (rnd(Math.floor(t * 1.5), 7) > 0.5) circ(x, 457, 552, 2.5, '#4dff9a', { sh: 'n', lw: 0 }); } }
  function tv(x, t, P) { const s = P.tv || Z, on = s.on, k = on ? Math.min(1, since(s, t) / 0.25) : 1 - Math.min(1, since(s, t) / 0.18);
    seg(x, [[752, 470], [716, 412]], 5); seg(x, [[758, 470], [796, 404]], 5); circ(x, 716, 410, 5, '#c9ced6', { sh: 'n', lw: 3 }); circ(x, 796, 402, 5, '#c9ced6', { sh: 'n', lw: 3 });
    box(x, 676, 466, 158, 132, '#5a4a3a', { r: 16, lw: 6, sh: 'r', f: 0.16 }); box(x, 690, 480, 106, 104, '#1b211e', { r: 14, sh: 'n', lw: 4 });
    for (const y of [500, 530]) circ(x, 816, y, 7, '#c9ced6', { sh: 'n', lw: 3 }); for (let y = 556; y < 586; y += 7) seg(x, [[806, y], [826, y]], 2, '#3a2e24');
    x.save(); x.beginPath(); x.roundRect(690, 480, 106, 104, 14); x.clip();
    if (k > 0.02) { if (on && since(s, t) < 0.6) { const C = ['#f4f1e8', '#f2c230', '#4dd2ff', '#5cd07a', '#e85aa8', '#d42f27', '#3b5fd8']; C.forEach((c, i) => { x.fillStyle = c; x.fillRect(690 + i * 106 / 7, 480, 106 / 7 + 1, 104); }); }   // the test card...
      else street(x, 690, 480, 106, 104, t, true);   // ...then the outside, on TV (the closest he's been)
      x.fillStyle = `rgba(255,255,255,${0.05 + 0.04 * rnd(Math.floor(t * 20), 3)})`; for (let y = 480; y < 584; y += 4) x.fillRect(690, y, 106, 1);
      if (k < 1) { x.fillStyle = `rgba(0,0,0,${1 - k})`; x.fillRect(690, 480, 106, 104); x.fillStyle = '#ffffff'; x.fillRect(690, 531 - 52 * k, 106, Math.max(2, 104 * k)); } }
    else { x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.ellipse(720, 505, 22, 10, -0.5, 0, TAU); x.fill(); }   // off: a glare on the glass
    x.restore(); box(x, 690, 480, 106, 104, 'rgba(0,0,0,0)', { r: 14, sh: 'n', lw: 4 }); }
  function plant(x, t) { const sw = Math.sin(t * 0.9) * 2; for (let i = 0; i < 7; i++) { const a = -2.6 + i * 0.36 + Math.sin(t * 0.8 + i) * 0.03, L = 50 + rnd(i, 4) * 26, bx = 880 + sw * (i % 2 ? 1 : -1) * 0.3;
      ell(x, bx + Math.cos(a) * L * 0.55, 642 + Math.sin(a) * L * 0.55, L * 0.5, 11, '#3f7a3a', { lw: 4, rot: a }); }
    for (const [a, b] of [[860, 590], [902, 600], [884, 576]]) { circ(x, a, b, 6, '#f4efe0', { sh: 'n', lw: 3 }); circ(x, a, b, 2, '#f2c230', { sh: 'n', lw: 0 }); } }   // (potato flowers: white, never purple)
  function upstairs(x, t, P) {   // the door at the top of the stairs: shut. Light under it. Try it and it rattles, the light behind it flinches
    const s = P.upstairs || Z, a = since(s, t), r = s.on ? Math.sin(a * 70) * 3 * (1 - Math.min(1, a / 0.9)) : 0, X = 1340, Y = 206, W = 130, H = LAND.top - Y;
    box(x, X - 14, Y - 16, W + 28, H + 16, '#4a2f1f', { r: 4, lw: 6, sh: 'n' });
    const fl = 0.65 + 0.35 * rnd(Math.floor(t * 3), 5), dim = s.on && a < 0.9 ? 0.2 : 1;   // something's on up there
    x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = rgba('#ffe2a8', 0.5 * fl * dim); x.beginPath(); x.moveTo(X + 4, LAND.top - 4); x.lineTo(X + W - 4, LAND.top - 4); x.lineTo(X + W + 30, LAND.top + 8); x.lineTo(X - 30, LAND.top + 8); x.fill(); x.restore();
    x.save(); x.translate(r, 0); box(x, X, Y, W, H - 6, DOORC, { r: 3, lw: 6, sh: 'r', f: 0.14 });
    box(x, X + 18, Y + 20, W - 36, 80, dk(DOORC, 0.05), { r: 3, sh: 'b', f: 0.25, lw: 4 }); box(x, X + 18, Y + 118, W - 36, 86, dk(DOORC, 0.05), { r: 3, sh: 'b', f: 0.25, lw: 4 });
    const kr = s.on ? Math.sin(a * 40) * 0.5 : 0; x.save(); x.translate(X + W - 20, Y + 112); x.rotate(kr); circ(x, 0, 0, 9, '#e0b45a', { lw: 4 }); x.restore(); box(x, X + W - 24, Y + 126, 8, 12, '#2a2016', { r: 2, sh: 'n', lw: 0 }); x.restore();
    seg(x, [[X + 4, LAND.top - 5], [X + W - 4, LAND.top - 5]], 3, rgba('#ffe2a8', 0.9 * fl * dim)); }
  function cupboard(x, t, P) {   // the cupboard under the landing: open it and it's the house's odds and ends (a mop, a bucket, boxes of his CDs)
    const s = P.cupboard || Z, k = s.n ? (s.on ? ez(since(s, t) / 0.3) : 1 - ez(since(s, t) / 0.25)) : 0, X = 1336, Y = 528, W = 104, H = FLOOR - Y;
    box(x, X - 10, Y - 10, W + 20, H + 10, WOOD2, { r: 4, lw: 5, sh: 'n' });
    if (k > 0.01) { box(x, X, Y, W, H, '#140d09', { sh: 'n', lw: 4 }); seg(x, [[X + 22, FLOOR - 4], [X + 40, Y + 16]], 6, '#c9a46a'); poly(x, [[X + 10, FLOOR - 4], [X + 36, FLOOR - 4], [X + 30, FLOOR - 22], [X + 16, FLOOR - 22]], '#e8e0cf', { lw: 3 });
      box(x, X + 50, FLOOR - 30, 44, 26, '#3c8fd8', { r: 3, lw: 4 }); for (let i = 0; i < 3; i++) { box(x, X + 52 + i * 3, FLOOR - 70 - i * 18, 38, 18, '#efe5cf', { r: 2, lw: 3, sh: 'n' }); circ(x, X + 71 + i * 3, FLOOR - 61 - i * 18, 5, '#e8b84a', { sh: 'n', lw: 2 }); }
      glow(x, X + W / 2, Y + H / 2, 70, '#ffe2a8', 0.12 * k); }
    const w = W * (1 - 0.88 * k); box(x, X, Y, w, H, WOOD, { r: 3, lw: 5, sh: 'r', f: 0.2 }); if (w > 30) { circ(x, X + w - 14, Y + H / 2, 5, '#e0b45a', { sh: 'n', lw: 3 }); box(x, X + 12, Y + 14, Math.max(4, w - 24), 50, dk(WOOD, 0.08), { r: 3, sh: 'b', f: 0.3, lw: 3 }); } }

  return {
    name: 'the living room', outfit: null, badge: '#a8452e', dark: 0.38, noSign: true, noSong: true,   // (no song of its own: the kitchen's keeps playing through the wall)
   
    door: { kind: 'swing', panel: '#3c5a3a', trim: '#5a3a26', knob: '#e0b45a', light: '#ffcf8a', plate: '#1d140f', plateTrim: '#8a5a36', deco: 'front', view: (x, X, Y, W, H, t) => street(x, X, Y, W, H, t, true) },   // the front door: No. 404
    door2: { kind: 'swing', panel: '#7a4c2e', trim: '#5a3a26', knob: '#e0b45a', light: '#ffe2a8', plate: '#1d140f', plateTrim: '#8a5a36', deco: 'kitchen' },             // back to the kitchen
    props: [
      { id: 'lamp', kind: 'switch', lamp: true, startOn: true, x0: 76, x1: 156, y0: 286, y1: 700, hint: [115, 276], sfx: { on: 'lampOn', off: 'lampOff' } },
      { id: 'couch', kind: 'hop', x0: 160, x1: 540, top: 575, seat: [204, 496], y0: 436, y1: 707, sfx: { land: 'creak' }, face: { land: ['warm', 1.4] } },
      { id: 'console', kind: 'switch', call: true, busy: 1.2, x0: 662, x1: 748, y0: 612, y1: 700, hint: [705, 604], sfx: { on: 'flick', off: 'flick' }, face: { on: ['smirk', 1.2] } },
      { id: 'tv', kind: 'switch', x0: 676, x1: 834, y0: 400, y1: 600, hint: [755, 392], sfx: { on: 'tvOn', off: 'tvOff' }, face: { on: ['awe', 1.4] } },
      { id: 'stairs', kind: 'hop', walk: true, topAt, x0: ST.x0 - 4, x1: LAND.x1, top: FLOOR - ST.rise, seat: [ST.x0 + 4, ST.x0 + 80], hit: [ST.x0 - 20, 300, LAND.x1, 610], y0: 300, y1: 707, creak: top => top === FLOOR - 3 * ST.rise || top === FLOOR - 6 * ST.rise, stepSfx: 'creak', sfx: { land: 'thunk' } },
      { id: 'upstairs', kind: 'switch', call: true, auto: 0.9, upY: LAND.top, x0: 1340, x1: 1470, y0: 196, y1: 432, hint: [1405, 186], sfx: { on: 'rattle', done: 'thud' }, face: { on: ['question', 1.4] } },
      { id: 'cupboard', kind: 'switch', downOnly: true, x0: 1326, x1: 1450, y0: 518, y1: 707, hint: [1388, 506], sfx: { on: 'drawer', off: 'thunk' }, face: { on: ['smirk', 1.1] } } ],
    base,
    under(x, t, lit, P, me) { lampSt(x, t, P, lit); couch(x, t, P, me); gameConsole(x, t, P); sideTable(x, t); plant(x, t); upstairs(x, t, P); cupboard(x, t, P); },
    anim(x, t, lit, P) { lampLight(x, lit); tv(x, t, P); const s = P.tv || Z; if (s.on) glow(x, 743, 532, 300, '#9fd0ff', 0.16 + 0.06 * rnd(Math.floor(t * 8), 2)); },
    emblem(x) { box(x, 22, 40, 56, 30, '#a8452e', { r: 10, lw: 5 }); box(x, 16, 50, 14, 26, '#a8452e', { r: 6, lw: 4 }); box(x, 70, 50, 14, 26, '#a8452e', { r: 6, lw: 4 }); },
    // the wall round the front door (canvas px, unsqueezed, drawn over the doors): a hook rail over it with his hat and scarf (he never wears them out), a doormat
    wallDeco(x, t) { box(x, 26, 176, 184, 14, '#5e3c27', { r: 3, lw: 4, sh: 'b' }); for (const X of [52, 116, 180]) { seg(x, [[X, 190], [X, 204], [X + 8, 208]], 5); }
      ell(x, 52, 206, 26, 7, '#3a2a22', { lw: 4 }); box(x, 36, 172, 32, 34, '#3a2a22', { r: [12, 12, 2, 2], lw: 4, sh: 'r' }); box(x, 36, 194, 32, 6, '#7a2f2a', { sh: 'n', lw: 2 });
      poly(x, [[108, 204], [128, 204], [132, 268], [118, 272], [112, 232]], '#2f7a4a', { lw: 4, shade: [122, 204, 12, 68] }); for (const y of [230, 252]) seg(x, [[113, y], [130, y - 2]], 4, '#f2c230');
      box(x, 20, 646, 196, 12, '#7a5a3a', { r: 4, lw: 4, sh: 'n' }); for (let X = 34; X < 210; X += 14) seg(x, [[X, 648], [X, 656]], 2, '#5a3a26'); },
  };
}
