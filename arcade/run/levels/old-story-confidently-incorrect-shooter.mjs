// The music video behind Confidently Incorrect — space, as a CARDBOARD STAGE SET (round 20, Chikin: "It would be cool if that
// level looked like a cardboard set with little strings holding up the planets and stars and stuff, the strings would not
// have any effect on potato").
// Logline: Potato blasts off into the knowledge cosmos, shooting down his own confidently incorrect facts as they fly at
// him. It's a school-play universe: a painted backdrop cloth cranked slowly across, cardboard planets, moons and stars hung
// on thin strings from a batten up top (they sway, and jump on the kick), masking tape where the strings hold, stage lights.
// The rocks and the alien ships are the real thing in it — hot-rimmed, inked — so what hurts never blends into the set.
// Beats:
//  -14–0   THE OPENER: the stage, lights down, a spot on him. Hold ←/→ to walk the boards, ↑ hop (+ spin), Space glitch. The
//          question types itself in a box at the top centre (Chikin: "the text box can be center in the middle at the top of the
//          screen"), sends, pours into his head as binary; on the music he glitches into his tiny ship and the floor drops away
//  0–22    lift-off: the cardboard Earth on its pole is lowered out of shot
//  15–62   deep space: planets slide by on their tracks; on "quantum spaghetti" the ringed planet's ring is yellow yarn
//  62–97   the chorus: a paper-plate sun with cut-card rays rises, rays pumping on the kick; the gold wall of citations
//  97–140  the asteroid belt of plausible nonsense: a long painted flat of rocks and one big crumpled-paper asteroid
//  140–193 Kevin: a little moon on a string tags along; the words he shoots light a string of fairy lights in the shape of
//          a potato ("he's in the data now"); "I'm on fire today": an orange cellophane sheet sweeps across
//  193–206 Everest is a sandwich: the set piece hangs on strings in the sky, then becomes the course (unchanged)
//  206–246 the last chorus: crepe-paper streamers blown by the stage fan (hyperspace); the Institute — a cardboard trophy —
//          lights up once the mothership is down, and he flies in
import { W, H, clamp, ease, rnd, span, fade, glow } from '../story.mjs';
const LN = [0.7, 1.6, 2.5, 3.4, 4.3], EV = 203.5, SHOW = 202.35, SPEED = 7;   // (must match the level: lanes, the wall's arrival, when it shows)
const CAMY = 2.9, UPX = H / 7.6, FLOOR_FEET = 1.2 - 0.62;                     // (the level's camFix + viewH; the opener's stage boards)
const wy = y => H / 2 - (y - CAMY) * UPX;                                      // world y -> screen y (the camera never moves up or down here)
const INK = '#120a05', EDGE = '#a8794a', EDGE2 = '#7a5532', STRING = '#ddd6c2', TAPE = '#e8dcae';
const LAYERS = [[4, 'bread', 195.3], [3, 'meat', 197.6], [2, 'everest', 193.0], [1, 'meat', 197.6], [0, 'bread', 195.3]];
const RAIL = 12;                                                               // the batten the strings hang from (screen y)

// ---------- cardboard: every prop is a painted cut-out with a corrugated edge, one cel band, ink, and tape ----------
const cache = {};
function sprite(key, w, h, draw) { if (cache[key]) return cache[key]; const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round'; draw(x, w, h); return (cache[key] = c); }
// cut(x, path, paint, band): the edge (the cardboard's thickness, offset down-right), the paint, one darker band, the ink line
function cut(x, path, paint, band, o = {}) {
  x.save(); x.translate(4, 5); path(); x.fillStyle = EDGE; x.fill(); x.lineWidth = 3; x.strokeStyle = EDGE2; x.stroke();
  x.setLineDash([2, 3]); x.lineWidth = 4.5; x.strokeStyle = '#8a6238'; path(); x.stroke(); x.setLineDash([]); x.restore();   // the cut edge: corrugated (its flutes show)
  path(); x.fillStyle = paint; x.fill();
  x.save(); path(); x.clip(); if (band) band(); for (let i = 0; i < (o.streaks ?? 5); i++) { x.globalAlpha = 0.12; x.strokeStyle = '#ffffff'; x.lineWidth = 4 + 6 * rnd(i, o.seed || 1);   // paint streaks
    const yy = x.canvas.height * (0.2 + 0.6 * rnd(i, (o.seed || 1) + 3)); x.beginPath(); x.moveTo(x.canvas.width * 0.15, yy); x.quadraticCurveTo(x.canvas.width * 0.5, yy - 8, x.canvas.width * 0.85, yy + 4); x.stroke(); } x.restore();
  path(); x.lineWidth = o.ink ?? 5; x.strokeStyle = INK; x.stroke(); }
function tape(x, cx, cy, w = 26, h = 12, a = 0) { x.save(); x.translate(cx, cy); x.rotate(a); x.fillStyle = TAPE; x.globalAlpha = 0.92; x.fillRect(-w / 2, -h / 2, w, h);
  x.globalAlpha = 0.35; x.fillStyle = '#b8a77a'; for (let i = -w / 2; i < w / 2; i += 4) x.fillRect(i, -h / 2, 1.5, 2); x.restore(); }
const circ = (x, cx, cy, r) => () => { x.beginPath(); x.arc(cx, cy, r, 0, 7); };
// the back of a cut-out: plain kraft card with its corrugation showing (it turns on its string and you see it's cardboard)
const backs = new Map();
function backOf(img) { if (backs.has(img)) return backs.get(img); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d');
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#b48d5e'; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(90,60,30,.28)'; for (let X = 0; X < c.width; X += 6) x.fillRect(X, 0, 2.5, c.height);
  x.fillStyle = 'rgba(255,240,210,.18)'; x.fillRect(0, 0, c.width, c.height * 0.3); backs.set(img, c); return c; }
// the planets etc. (centre of the sprite = the prop's centre; `top` = where its string is taped, from the centre)
const PROPS = {
  planetA: () => sprite('pA', 128, 128, x => { const P = circ(x, 60, 60, 46); cut(x, P, '#c96f4a', () => { x.fillStyle = '#9d4f35'; x.beginPath(); x.arc(84, 82, 52, 0, 7); x.fill(); }, { seed: 2 });
    x.fillStyle = '#a95a3c'; for (const [a, b, r] of [[46, 44, 9], [72, 66, 6], [52, 78, 5]]) { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); x.lineWidth = 2.5; x.strokeStyle = INK; x.stroke(); } tape(x, 60, 16, 24, 11, 0.1); }),
  planetB: () => sprite('pB', 100, 100, x => { const P = circ(x, 47, 47, 34); cut(x, P, '#4f9a96', () => { x.fillStyle = '#3c7773'; x.beginPath(); x.arc(64, 64, 40, 0, 7); x.fill();
    x.fillStyle = '#6fb7a8'; x.fillRect(10, 36, 80, 7); x.fillRect(10, 54, 80, 5); }, { seed: 4 }); tape(x, 47, 15, 20, 10, -0.15); }),
  ringed: (yarn) => sprite(yarn ? 'rY' : 'rR', 220, 140, x => {
    const ring = (half) => { x.save(); x.beginPath(); if (half) x.rect(0, 70, 220, 70); else x.rect(0, 0, 220, 70); x.clip();
      if (yarn) { x.strokeStyle = '#f2d27a'; x.lineWidth = 3.2; for (let k = 0; k < 6; k++) { x.beginPath(); for (let a = 0; a <= 6.3; a += 0.06) { const rr = 88 + k * 4 + Math.sin(a * 9 + k) * 4; const px = 108 + Math.cos(a) * rr, py = 70 + Math.sin(a) * rr * 0.26; a ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); } x.strokeStyle = INK; x.lineWidth = 1; }
      else { const R = () => { x.beginPath(); x.ellipse(108, 70, 100, 26, 0, 0, 7); x.ellipse(108, 70, 70, 15, 0, 0, 7, true); };
        x.save(); x.translate(3, 4); R(); x.fillStyle = EDGE; x.fill('evenodd'); x.restore(); R(); x.fillStyle = '#e9d39a'; x.fill('evenodd'); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); }
      x.restore(); };
    ring(false); cut(x, circ(x, 108, 70, 46), '#d9a85a', () => { x.fillStyle = '#b8873f'; x.beginPath(); x.arc(130, 92, 52, 0, 7); x.fill(); }, { seed: 6 }); ring(true); tape(x, 108, 28, 24, 11, 0.08); }),
  moon: () => sprite('mo', 80, 90, x => { const P = () => { x.beginPath(); x.arc(40, 46, 30, 1.25, 2 * Math.PI - 1.25, false); x.arc(54, 46, 24, 2 * Math.PI - 1.45, 1.45, true); x.closePath(); };   // a C: the lit edge on the left
    cut(x, P, '#e9e2cc', () => { x.fillStyle = '#c9c1a8'; x.fillRect(0, 56, 80, 40); }, { seed: 8, streaks: 2 }); tape(x, 34, 16, 16, 9, -0.3); }),
  star: (c = '#f2cf5b') => sprite('st' + c, 60, 60, x => { const P = () => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 22; x.lineTo(28 + Math.cos(a) * r, 29 + Math.sin(a) * r); } x.closePath(); };
    cut(x, P, c, () => { x.fillStyle = 'rgba(0,0,0,.16)'; x.fillRect(28, 0, 40, 60); }, { seed: 9, streaks: 1, ink: 3.5 }); tape(x, 28, 10, 12, 7, 0.2); }),
  earth: () => sprite('ea', 300, 330, x => { x.fillStyle = '#8a6a44'; x.fillRect(142, 150, 16, 180); x.lineWidth = 4; x.strokeStyle = INK; x.strokeRect(142, 150, 16, 180);   // on its pole
    const P = circ(x, 150, 140, 128); cut(x, P, '#4f86c9', () => { x.fillStyle = '#3b6aa6'; x.beginPath(); x.arc(200, 190, 150, 0, 7); x.fill(); }, { seed: 11 });
    x.save(); P(); x.clip(); x.fillStyle = '#6fae5a'; for (const [a, b, rx, ry] of [[90, 100, 50, 34], [190, 80, 40, 26], [160, 200, 60, 30], [70, 190, 26, 20]]) { x.beginPath(); x.ellipse(a, b, rx, ry, 0.4, 0, 7); x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke(); } x.restore();
    P(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); tape(x, 150, 268, 30, 13, 0.05); }),
  sunDisc: () => sprite('su', 220, 220, x => { const P = circ(x, 106, 106, 76); cut(x, P, '#ffd05a', () => { x.fillStyle = '#f2a83a'; x.beginPath(); x.arc(140, 140, 86, 0, 7); x.fill(); }, { seed: 13 });
    x.strokeStyle = 'rgba(140,90,20,.45)'; x.lineWidth = 2; for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283; x.beginPath(); x.moveTo(106 + Math.cos(a) * 60, 106 + Math.sin(a) * 60); x.lineTo(106 + Math.cos(a) * 72, 106 + Math.sin(a) * 72); x.stroke(); }   // the paper plate's fluted rim
    x.fillStyle = INK; x.beginPath(); x.arc(84, 96, 6, 0, 7); x.arc(126, 96, 6, 0, 7); x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.beginPath(); x.arc(106, 112, 22, 0.3, 2.84); x.stroke(); }),   // a painted face (it's a school play)
  sunRay: () => sprite('sr', 70, 40, x => { const P = () => { x.beginPath(); x.moveTo(4, 8); x.lineTo(64, 20); x.lineTo(4, 32); x.closePath(); }; cut(x, P, '#ffb347', () => { x.fillStyle = '#e8913a'; x.fillRect(0, 21, 70, 20); }, { seed: 14, streaks: 0, ink: 3 }); }),
  bigRock: () => sprite('br', 330, 280, x => { const P = () => { x.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.283, r = 140 * (0.84 + 0.16 * rnd(i % 24, 84)); x.lineTo(160 + Math.cos(a) * r, 135 + Math.sin(a) * r * 0.82); } x.closePath(); };
    cut(x, P, '#7d7468', () => { x.fillStyle = '#5f574d'; x.beginPath(); x.ellipse(220, 190, 170, 130, 0, 0, 7); x.fill(); }, { seed: 15 });
    x.strokeStyle = 'rgba(30,24,20,.45)'; x.lineWidth = 3; for (let i = 0; i < 9; i++) { const a = rnd(i, 81) * 6.28, d = 30 + rnd(i, 82) * 80; x.beginPath(); x.moveTo(160 + Math.cos(a) * d, 135 + Math.sin(a) * d * 0.8); x.lineTo(160 + Math.cos(a + 0.5) * (d + 30), 135 + Math.sin(a + 0.7) * (d + 20) * 0.8); x.stroke(); }   // crumpled-paper creases
    tape(x, 120, 30, 30, 12, -0.2); tape(x, 210, 28, 30, 12, 0.15); }),
  beltFlat: () => sprite('bf', 1100, 120, x => { const P = () => { x.beginPath(); x.moveTo(0, 40); for (let X = 0; X <= 1100; X += 40) x.lineTo(X, 30 + 18 * rnd(X, 3)); x.lineTo(1100, 92); for (let X = 1100; X >= 0; X -= 40) x.lineTo(X, 90 + 18 * rnd(X, 5)); x.closePath(); };
    cut(x, P, '#5a5560', () => { x.fillStyle = '#48434e'; x.fillRect(0, 70, 1100, 60); }, { seed: 16, streaks: 3 });
    for (let i = 0; i < 26; i++) { const cx0 = 20 + i * 42 + 10 * rnd(i, 7), cy0 = 66 + 14 * (rnd(i, 8) - 0.5), r = 8 + 9 * rnd(i, 9); x.fillStyle = rnd(i, 10) < 0.5 ? '#7a7280' : '#6a6370'; x.beginPath(); x.ellipse(cx0, cy0, r, r * 0.75, rnd(i, 11), 0, 7); x.fill(); x.lineWidth = 2.5; x.strokeStyle = INK; x.stroke(); }
    for (const X of [180, 900]) tape(x, X, 40, 26, 11, 0.1); }),
  trophy: () => sprite('tr', 200, 230, x => { const P = () => { x.beginPath(); x.moveTo(40, 30); x.lineTo(160, 30); x.quadraticCurveTo(160, 120, 100, 130); x.quadraticCurveTo(40, 120, 40, 30); x.closePath();
      x.rect(90, 128, 20, 40); x.rect(60, 166, 80, 20); };
    cut(x, P, '#e9b93a', () => { x.fillStyle = '#c99528'; x.fillRect(100, 0, 100, 230); }, { seed: 17 });
    x.lineWidth = 9; x.strokeStyle = INK; x.beginPath(); x.arc(40, 62, 24, Math.PI * 0.5, Math.PI * 1.5); x.stroke(); x.beginPath(); x.arc(160, 62, 24, -Math.PI * 0.5, Math.PI * 0.5); x.stroke();
    x.lineWidth = 5; x.strokeStyle = '#e9b93a'; x.beginPath(); x.arc(40, 62, 24, Math.PI * 0.5, Math.PI * 1.5); x.stroke(); x.beginPath(); x.arc(160, 62, 24, -Math.PI * 0.5, Math.PI * 0.5); x.stroke();
    tape(x, 70, 36, 22, 10, -0.2); tape(x, 130, 36, 22, 10, 0.2); }),
  kevMoon: () => sprite('km', 44, 44, x => { cut(x, circ(x, 20, 20, 15), '#d8d6cf', () => { x.fillStyle = '#b4b0a6'; x.beginPath(); x.arc(28, 28, 16, 0, 7); x.fill(); }, { seed: 19, streaks: 1, ink: 3 }); tape(x, 20, 7, 10, 6, 0); }),
};
// the backdrop cloth: painted night, tileable sideways (it's cranked slowly across, like an old panorama)
const CLOTH_W = W * 2;
const cloth = () => sprite('cloth', CLOTH_W, H, x => {
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16224a'); g.addColorStop(0.6, '#111a3a'); g.addColorStop(1, '#0c1230'); x.fillStyle = g; x.fillRect(0, 0, CLOTH_W, H);
  const dab = (X, Y, w, h, a, c, al) => { for (const ox of [0, -CLOTH_W, CLOTH_W]) { x.save(); x.translate(X + ox, Y); x.rotate(a); x.globalAlpha = al; x.fillStyle = c; x.beginPath(); x.ellipse(0, 0, w, h, 0, 0, 7); x.fill(); x.restore(); } };
  for (let i = 0; i < 260; i++) dab(rnd(i, 1) * CLOTH_W, rnd(i, 2) * H, 40 + 90 * rnd(i, 3), 5 + 9 * rnd(i, 4), (rnd(i, 5) - 0.5) * 0.4, ['#1d2c5c', '#223468', '#142048', '#1c3f5a'][i % 4], 0.35);   // brush strokes
  for (let i = 0; i < 14; i++) dab(rnd(i, 21) * CLOTH_W, H * (0.2 + 0.6 * rnd(i, 22)), 120 + 140 * rnd(i, 23), 40 + 50 * rnd(i, 24), 0.2, i % 3 ? '#1e4d5e' : '#4a3a26', 0.16);   // painted nebula: teal + a little amber
  for (let i = 0; i < 90; i++) { const X = rnd(i, 31) * CLOTH_W, Y = rnd(i, 32) * H * 0.92, r = 1.5 + 2.5 * rnd(i, 33); for (const ox of [0, -CLOTH_W, CLOTH_W]) { x.globalAlpha = 0.5 + 0.4 * rnd(i, 34); x.fillStyle = '#f3e7b0';   // painted stars: little crosses of paint
    x.fillRect(X + ox - r, Y - 0.8, r * 2, 1.6); x.fillRect(X + ox - 0.8, Y - r, 1.6, r * 2); } }
  x.globalAlpha = 1; for (let X = 0; X < CLOTH_W; X += 160) { const fg = x.createLinearGradient(X, 0, X + 160, 0); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(0.5, 'rgba(0,0,0,.14)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = fg; x.fillRect(X, 0, 160, H); }   // the cloth's folds
});
// the proscenium, painted once: valance (scalloped, gold trim) + the two curtain legs (folds, one cel band, ink)
const PROSC = () => sprite('prosc', W, H, x => {
  const leg = (x0, w, flip) => { x.save(); x.beginPath(); x.moveTo(x0, 0); x.lineTo(x0 + w, 0); for (let y = 0; y <= H; y += 20) x.lineTo(x0 + w + (flip ? -1 : 1) * 3 * Math.sin(y * 0.05), y); x.lineTo(x0, H); x.closePath();
    x.fillStyle = '#7a1c22'; x.fill(); x.clip(); for (let k = 0; k < 4; k++) { x.fillStyle = k % 2 ? '#94262c' : '#5f1419'; x.fillRect(x0 + k * w / 4, 0, w / 8, H); }
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(flip ? x0 : x0 + w * 0.6, 0, w * 0.4, H); x.restore();
    x.lineWidth = 3.5; x.strokeStyle = INK; x.beginPath(); x.moveTo(flip ? x0 : x0 + w, 0); for (let y = 0; y <= H; y += 20) x.lineTo((flip ? x0 : x0 + w) + (flip ? -1 : 1) * 3 * Math.sin(y * 0.05), y); x.stroke(); };
  leg(0, 22, false); leg(W - 22, 22, true);
  const vy = RAIL + 2, vh = 18; x.beginPath(); x.moveTo(0, vy); x.lineTo(W, vy); x.lineTo(W, vy + vh); for (let X = W; X >= 0; X -= 40) x.quadraticCurveTo(X - 20, vy + vh + 12, X - 40, vy + vh); x.closePath();
  x.fillStyle = '#86202a'; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke();
  x.strokeStyle = '#d9a640'; x.lineWidth = 2.5; x.beginPath(); for (let X = W; X >= 0; X -= 40) { x.moveTo(X, vy + vh - 3); x.quadraticCurveTo(X - 20, vy + vh + 8, X - 40, vy + vh - 3); } x.stroke(); });
// draw a hung prop: it swings round the point its string meets the batten; strings never touch anything (they're just drawn)
function hang(ctx, img, x, y, o = {}) {
  const sc = o.sc ?? 1, sw = o.sw ?? 0, w = img.width * sc, h = img.height * sc, topY = y - h / 2 + (o.tapeY ?? 16) * sc, strs = o.strings ?? [0];
  ctx.save(); ctx.translate(x, RAIL); ctx.rotate(sw); ctx.translate(-x, -RAIL);
  ctx.strokeStyle = STRING; ctx.lineWidth = 1.3; ctx.globalAlpha = (o.a ?? 1) * 0.75;
  for (const dx of strs) { ctx.beginPath(); ctx.moveTo(x + dx * sc, RAIL); ctx.lineTo(x + dx * sc, topY); ctx.stroke(); }
  ctx.globalAlpha = o.a ?? 1; const c = Math.cos(o.turn || 0);
  if (Math.abs(c) > 0.999) ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
  else { ctx.translate(x, 0); ctx.scale(Math.max(0.06, Math.abs(c)), 1); ctx.drawImage(c < 0 ? backOf(img) : img, -w / 2, y - h / 2, w, h); }   // (turning: its back is kraft card)
  ctx.restore(); }
// a prop sliding across on its track: x for a period-looping slide (screen right -> left)
const slide = (t, v, off, w) => W + w - (((t * v + off) % (W + 2 * w)) + (W + 2 * w)) % (W + 2 * w);
// ---- the set dressing, laid out once: depth 0..1 (far props are smaller, slower, hazier) ----
// (round 21: they hang ABOVE the top lane — stars and moons in the flies — or low BELOW the bottom one — planets; the lanes
// in between stay clear, so nothing there looks like something to shoot)
const HUNG = Array.from({ length: 12 }, (_, i) => { const kind = ['star', 'star', 'planetB', 'star', 'moon', 'star', 'planetA', 'star'][i % 8], low = kind === 'planetA' || kind === 'planetB';
  return { i, kind, d: 0.45 + 0.5 * rnd(i, 41), y: low ? H - 22 + 18 * rnd(i, 42) : 34 + 46 * rnd(i, 42), low, off: rnd(i, 43) * 3000, ph: rnd(i, 44) * 6.28, col: ['#f2cf5b', '#f4e9c8', '#9fd0e8'][i % 3], poke: -9 }; });
// a bolt that passes through a prop sets it swinging and spinning on its string (no effect on anything — it's a prop)
function poked(P, x, y, r, e) { const S = e.s.shots; if (!S || !S.length) return; for (const bo of S) { const bx = e.px + (bo.x - e.s.x) * UPX, by = wy(bo.y); if (Math.abs(bx - x) < r && Math.abs(by - y) < r) { if (e.t - P.poke > 0.6) P.poke = e.t; return; } } }
const pokeSwing = (P, t) => { const a = t - P.poke; return a >= 0 && a < 2.5 ? 0.22 * Math.exp(-a / 0.6) * Math.sin(a * 11) : 0; };
const pokeTurn = (P, t) => { const a = t - P.poke; return a >= 0 && a < 1.2 ? Math.PI * 2 * (1 - (1 - a / 1.2) ** 3) : 0; };
// every so often a prop twirls once on its string by itself (and shows its cardboard back)
const twirl = (i, t) => { const w = Math.floor(t / 9), ph = t - w * 9; return rnd(i, w) < 0.18 && ph < 1.6 ? Math.PI * 2 * ease(ph / 1.6) : 0; };
const DRIFT = [{ poke: -9 }, { poke: -9 }, { poke: -9 }];

// the sandwich set piece (round 12): unchanged rules, now hung on strings while it waits in the sky
const sw = { upu: 0, shot: {}, lastT: -1 };
function slab(ctx, kind, x, y, w, h, t) {                                       // one layer of the sandwich, centred on (x, y)
  ctx.save(); ctx.lineWidth = 3; ctx.lineJoin = 'round';
  if (kind === 'bread') { ctx.fillStyle = '#e2b46b'; ctx.strokeStyle = '#8a5a26'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h * 0.45); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f3d49a'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 6, y - h / 2 + 5, w - 12, h * 0.35, h * 0.2); ctx.fill(); }
  else if (kind === 'meat') { ctx.fillStyle = '#d9534f'; ctx.strokeStyle = '#7a1f1c'; ctx.beginPath(); ctx.moveTo(x - w / 2, y - h / 2);
    for (let i = 0; i <= 12; i++) ctx.lineTo(x - w / 2 + w * i / 12, y - h / 2 + Math.sin(i * 1.7 + t * 2) * 3);
    for (let i = 12; i >= 0; i--) ctx.lineTo(x - w / 2 + w * i / 12, y + h / 2 + Math.sin(i * 1.3 + 1 + t * 2) * 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#f29a90'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 4; i++) { const xx = x - w * 0.35 + i * w * 0.23; ctx.moveTo(xx, y - 3); ctx.quadraticCurveTo(xx + 10, y + 6, xx + 24, y - 1); } ctx.stroke(); }
  else { ctx.fillStyle = '#6f7d92'; ctx.strokeStyle = '#2b3442'; ctx.beginPath(); ctx.rect(x - w / 2, y - h * 0.1, w, h * 0.6);   // Everest: the mountain, lying in the sandwich
    ctx.moveTo(x - w / 2, y - h * 0.1); ctx.lineTo(x - w * 0.2, y - h * 0.45); ctx.lineTo(x - w * 0.05, y - h * 0.25); ctx.lineTo(x + w * 0.12, y - h * 0.62); ctx.lineTo(x + w * 0.3, y - h * 0.2); ctx.lineTo(x + w / 2, y - h * 0.1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.moveTo(x + w * 0.12, y - h * 0.62); ctx.lineTo(x + w * 0.2, y - h * 0.42); ctx.lineTo(x + w * 0.12, y - h * 0.47); ctx.lineTo(x + w * 0.05, y - h * 0.42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - w * 0.2, y - h * 0.45); ctx.lineTo(x - w * 0.14, y - h * 0.34); ctx.lineTo(x - w * 0.26, y - h * 0.36); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function sandwich(ctx, e) {
  const { t, px, py, s } = e;
  if (t < sw.lastT - 0.05 || (e.dt || 0) > 1.5) sw.shot = {}; sw.lastT = t;
  const u = UPX; if (!span(t, 192.8, 207.4)) return;   // (screen px per world unit: the camera's fixed)
  if (s.layerShot) for (const l in s.layerShot) if (sw.shot[l] == null) sw.shot[l] = { t: s.layerShot[l] };   // (round 21: every layer that went — a pulse can take three at once)
  const laneY = l => wy(LN[l]);
  const w = 3.0 * u, h = 0.72 * u, skyX = W * 0.7, wind = 202.1;               // in the sky it hangs at skyX; "that is incorrect": it backs off right, then comes at him
  const cx = t < wind ? skyX : t < SHOW ? skyX + (W + w - skyX) * ease((t - wind) / (SHOW - wind)) : px + (SPEED * (EV - t) + 1.5 - (s.dx || 0)) * u;   // (from SHOW: it IS the course's wall — drawn where its layers are in the world, 3 wide)
  const neat = t > 203.6, gone = t > 206.2 ? ease((t - 206.2) / 0.6) : 0;
  const dx = W * 0.64, dy = H * 0.56;                                                // the tidy diagram, mid-screen (under the lyric band)
  if (t < SHOW) { ctx.save(); ctx.strokeStyle = STRING; ctx.lineWidth = 1.3; ctx.globalAlpha = 0.6; for (const sx of [cx - w * 0.38, cx + w * 0.38]) { ctx.beginPath(); ctx.moveTo(sx, RAIL); ctx.lineTo(sx, laneY(4) - h / 2); ctx.stroke(); } ctx.restore(); }   // (it hangs from the batten)
  for (const [l, kind, t0] of LAYERS) {
    const sh = sw.shot[l];
    if (!sh) { if (t > EV + 0.3 || t < t0) continue;                                   // still part of the sandwich (or flew past him)
      const k = ease(clamp((t - t0) / 0.7)), from = kind === 'bread' ? (l > 2 ? -180 : 180) : kind === 'meat' ? 0 : 120, side = kind === 'meat' ? (l > 2 ? 1 : -1) * 260 * (1 - k) : 0;
      ctx.globalAlpha = k * (t > SHOW ? 1 : 0.5); slab(ctx, kind, cx + side, laneY(l) + from * (1 - k), w, h, t); ctx.globalAlpha = 1; continue; }   // (dim in the sky: the course reads first)
    const a = t - sh.t;                                                                  // shot: it bursts, then the bits drift into the diagram
    if (a < 0.35) { for (let i = 0; i < 10; i++) { const ang = rnd(i, l * 7) * 6.28, r = a * (180 + 160 * rnd(i, l)); ctx.fillStyle = kind === 'bread' ? '#e2b46b' : kind === 'meat' ? '#d9534f' : '#c9d2e0';
      ctx.globalAlpha = 1 - a / 0.35; ctx.fillRect(cx + Math.cos(ang) * r - 4, laneY(l) + Math.sin(ang) * r - 4, 8, 8); } ctx.globalAlpha = 1; }
    if (!neat) continue;
    const k = ease(clamp((t - 203.6) / 0.6)), ty = dy + (2 - l) * 52, x = px + 120 + (dx - px - 120) * k - gone * 900, y = laneY(l) + (ty - laneY(l)) * k;
    ctx.globalAlpha = (0.95 - 0.95 * gone) * k; slab(ctx, kind, x, y, 150, 34, t);
    if (k > 0.9 && !gone) { ctx.strokeStyle = '#cfe9ff'; ctx.globalAlpha = 0.5; ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 84, y); ctx.lineTo(x + 130, y); ctx.lineTo(x + 130, dy); ctx.stroke(); ctx.setLineDash([]); }
    ctx.globalAlpha = 1;
  }
  if (neat && !gone && Object.keys(sw.shot).length) glow(ctx, dx, dy, 170, '#cfe9ff', 0.18 * fade(t, 203.6, 206.2, 0.5, 0.3));
  if (span(t, 195.6, wind)) { ctx.save(); ctx.strokeStyle = '#cfe9ff'; ctx.globalAlpha = 0.4 * fade(t, 195.6, wind, 0.5, 0.2); ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5;
    for (const [l] of LAYERS) if (t > (LAYERS.find(L => L[0] === l)[2]) + 0.5) { ctx.beginPath(); ctx.moveTo(cx + w / 2 + 8, laneY(l)); ctx.lineTo(cx + w / 2 + 40, laneY(l)); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx + w / 2 + 40, laneY(4)); ctx.lineTo(cx + w / 2 + 40, laneY(0)); ctx.stroke(); ctx.restore(); }
  if (span(t, 199.8, EV) && !Object.keys(sw.shot).length) { const k = ease(clamp((t - 199.8) / 0.4)), top = laneY(4) - h * 1.1, x0 = cx - w * 0.12;
    ctx.save(); ctx.globalAlpha = t > SHOW ? 1 : 0.6; ctx.strokeStyle = '#c99a5a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, top - 200 * (1 - k)); ctx.lineTo(x0, top - 200 * (1 - k) + (laneY(0) - top + h * 0.3)); ctx.stroke();
    ctx.fillStyle = '#d0322f'; ctx.strokeStyle = '#1e3f8a'; ctx.lineWidth = 2.5; const fy = top - 200 * (1 - k);   // the flag: Nepal's two pennants, no words
    ctx.beginPath(); ctx.moveTo(x0, fy); ctx.lineTo(x0 + 30, fy + 14); ctx.lineTo(x0 + 12, fy + 14); ctx.lineTo(x0 + 30, fy + 32); ctx.lineTo(x0, fy + 32); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
}

// ---- the constellation (round 8 D), now a string of fairy lights on the backdrop: every word he shoots lights the next bulb;
// 22 and the string closes into a potato ----
const DATA0 = 140.8, DATA1 = 193, NSTAR = 22, CX = W * 0.66, CB = 470, CH = 300;
const CONST = (() => { const w = CH * 0.86, x = CX, y = CB, h = CH, pts = [];
  const bz = (p0, p1, p2, p3, u) => { const v = 1 - u; return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3; };
  const right = [[x, y - h], [x + w * 0.62, y - h], [x + w * 0.62, y], [x + w * 0.1, y]], left = [[x - w * 0.1, y], [x - w * 0.6, y], [x - w * 0.58, y - h], [x, y - h]];
  for (const [c, n] of [[right, 11], [left, 11]]) for (let i = 0; i < n; i++) { const u = i / n;
    pts.push({ x: bz(c[0][0], c[1][0], c[2][0], c[3][0], u) + (rnd(pts.length, 71) - 0.5) * 10, y: bz(c[0][1], c[1][1], c[2][1], c[3][1], u) + (rnd(pts.length, 72) - 0.5) * 10 }); }
  return pts; })();
const cst = { lastT: -1, kPrev: 0, k0: null, litAt: [], sparks: [] };
function constellation(ctx, e, kick) {
  const { t, px, py, s } = e, kills = s.kills || 0;
  if (t < cst.lastT - 0.05 || (e.dt || 0) > 1.5) {          // a restart or a seek: rebuild what we can (exact in real play)
    cst.k0 = t > DATA0 ? Math.max(0, kills - Math.round(clamp((t - DATA0) / (DATA1 - DATA0 - 4)) * NSTAR)) : null; cst.litAt = []; cst.sparks = [];
    if (cst.k0 != null) for (let i = 0; i < Math.min(NSTAR, kills - cst.k0); i++) cst.litAt.push(-99); cst.kPrev = kills; }
  if (cst.k0 == null && t >= DATA0) cst.k0 = cst.kPrev;
  if (span(t, DATA0, DATA1) && kills > cst.kPrev) for (let k = cst.kPrev; k < kills; k++) { const i = cst.litAt.length + cst.sparks.length;
    if (i < NSTAR) cst.sparks.push({ t, i, x: px + 150, y: py - 20 }); }
  cst.kPrev = kills; cst.lastT = t;
  for (const sp of cst.sparks) if (t - sp.t >= 0.45) cst.litAt[sp.i] = sp.t + 0.45; cst.sparks = cst.sparks.filter(sp => t - sp.t < 0.45);
  if (!span(t, DATA0, DATA1 + 2.5)) return;
  const a = fade(t, DATA0, DATA1 + 2.5, 2, 2.5), lit = cst.litAt.filter(x => x != null).length, done = lit >= NSTAR ? cst.litAt[NSTAR - 1] : null;
  ctx.save(); ctx.globalAlpha = 0.85 * a;
  ctx.strokeStyle = '#1c1a16'; ctx.lineWidth = 2.2; ctx.beginPath();                    // the wire, sagging bulb to bulb (it's always there: a shape waiting)
  CONST.forEach((p, i) => { if (!i) { ctx.moveTo(p.x, p.y); return; } const q = CONST[i - 1]; ctx.quadraticCurveTo((p.x + q.x) / 2, (p.y + q.y) / 2 + 9, p.x, p.y); });
  { const p = CONST[0], q = CONST[NSTAR - 1]; ctx.quadraticCurveTo((p.x + q.x) / 2, (p.y + q.y) / 2 + 9, p.x, p.y); } ctx.stroke();
  for (let i = 0; i < NSTAR; i++) { const p = CONST[i], on = i < lit, age = on ? t - cst.litAt[i] : 0, pop = on && age < 0.3 ? 1 + 0.8 * (1 - age / 0.3) : 1;
    if (on) glow(ctx, p.x, p.y + 4, (done != null ? 22 + 8 * kick : 16) * pop, '#ffd98a', 0.7 * a);
    ctx.globalAlpha = a; ctx.fillStyle = on ? (i % 3 === 0 ? '#ffe9a8' : i % 3 === 1 ? '#ffb38a' : '#bfe8ff') : '#3b3a40'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 4.2 * pop, 5.6 * pop, 0, 0, 7); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#2a2724'; ctx.fillRect(p.x - 2.5, p.y - 3, 5, 3); }
  ctx.restore();
  if (done != null && t - done < 1.6) { const k = (t - done) / 1.6; glow(ctx, CX, CB - CH / 2, 240, '#ffd98a', 0.4 * (1 - k) * a); }
  for (const sp of cst.sparks) { const k = ease((t - sp.t) / 0.45), p = CONST[sp.i], x = sp.x + (p.x - sp.x) * k, y = sp.y + (p.y - sp.y) * k - Math.sin(k * Math.PI) * 50;
    glow(ctx, x, y, 16, '#ffe9a8', 0.9 * a); ctx.fillStyle = '#fffbe8'; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
}

// the Institute arrives once the mothership is down (s.bossDown[4]; a seek past it assumes the demo got it)
const bossSt = { down: null, last: -1 };
function bossDown(e) { const { t, s } = e;
  if (t < bossSt.last - 0.05) bossSt.down = null; bossSt.last = t;
  const d = s.bossDown && s.bossDown[4]; if (bossSt.down == null && d != null) bossSt.down = d;
  if (bossSt.down == null && t > 241.5 && (e.dt || 0) > 1.5) bossSt.down = 240.2;
  return bossSt.down != null && bossSt.down <= t ? bossSt.down : null; }

// ---- THE OPENER ----
// (Chikin, earlier: "from the youtube video, dear potato what is the capital of, then the text starts to spel out Nippl, then
// backspaces ti Ni then finishes - Niepal" … "It should say in all 'Dear Potato, what is the capital of Niepal. thanks, Kevin'")
const PRE = 'Dear Potato, what is the capital of ';
const MSG = PRE + 'Niepal.  thanks, Kevin';
const KEYS = [[-13.0, ''], [-7.0, PRE], [-6.3, PRE + 'Nippl'], [-4.8, PRE + 'Nippl'], [-4.4, PRE + 'Ni'], [-3.6, PRE + 'Niepal.'], [-2.2, MSG], [-1.95, MSG]];   // ("it has to get to Nippl, then back up, thats the joke")
const SEND = -1.9, HEAD = -1.2, END = 0, MSG_CHARS = [...MSG].filter(c => c.trim());
const typed = t => { if (t < KEYS[0][0]) return ''; for (let i = 0; i + 1 < KEYS.length; i++) { const [a, sa] = KEYS[i], [b, sb] = KEYS[i + 1]; if (t >= b) continue;
  const k = (t - a) / (b - a); if (sb.length >= sa.length) { const common = sa.length; return sb.slice(0, common + Math.floor((sb.length - common) * k)); }
  return sa.slice(0, sa.length - Math.floor((sa.length - sb.length) * k)); } return KEYS[KEYS.length - 1][1]; };
export const KEYTICKS = (() => { const out = []; for (let i = 0; i + 1 < KEYS.length; i++) { const [a, sa] = KEYS[i], [b, sb] = KEYS[i + 1], n = Math.abs(sb.length - sa.length);
  for (let k = 1; k <= n; k++) out.push([+(a + (b - a) * k / (n + 0.0001)).toFixed(3), sb.length < sa.length]); } return out; })();
// the message box: fixed at the top centre of the screen (it doesn't follow him)
function messageBox(ctx, e) {
  const { t, px, py } = e, UI = 'Inter, system-ui, sans-serif', MONO = '"Major Mono Display", ui-monospace, monospace';
  const pop = clamp((t + 13.5) / 0.35), bounce = pop < 1 ? Math.sin(pop * Math.PI * 1.5) * 0.12 * (1 - pop) + pop : 1;
  const bw = Math.min(W * 0.62, 620), bh = 64, bx = (W - bw) / 2, by = 34;
  const sent = t >= SEND, txt = sent ? MSG : typed(t), gone = sent ? clamp((t - SEND) / (HEAD - SEND)) : 0;
  if (pop > 0 && gone < 1) { ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(bounce, bounce); ctx.translate(-(bx + bw / 2), -(by + bh / 2)); ctx.globalAlpha = 1 - gone;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.roundRect(bx + 5, by + 7, bw, bh, 18); ctx.fill();
    ctx.fillStyle = '#f4f6ff'; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 18); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.font = `20px ${UI}`; ctx.fillStyle = '#141826'; let shown = txt; while (ctx.measureText(shown).width > bw - 90 && shown.length) shown = shown.slice(1);
    if (!sent || gone < 0.05) ctx.fillText(shown, bx + 20, by + 39);
    if (!sent && Math.floor(t * 2.5) % 2) ctx.fillRect(bx + 22 + ctx.measureText(shown).width, by + 20, 2, 26);   // the cursor
    ctx.fillStyle = t > SEND - 0.3 && t < SEND + 0.15 ? '#2f6df6' : '#8fb4ff'; ctx.beginPath(); ctx.arc(bx + bw - 34, by + bh / 2, 19, 0, 7); ctx.fill();   // send
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(bx + bw - 42, by + bh / 2 - 9); ctx.lineTo(bx + bw - 24, by + bh / 2); ctx.lineTo(bx + bw - 42, by + bh / 2 + 9); ctx.fill();
    ctx.restore(); }
  // sent: the message comes apart into its letters and binary and pours down into his head — digital
  if (sent && t < HEAD + 0.6) { const q = clamp((t - SEND) / (HEAD - SEND)); ctx.save(); ctx.font = `18px ${MONO}`; ctx.textAlign = 'center';
    const chars = MSG_CHARS; chars.forEach((c, i) => { const d = (i % 7) * 0.06 + Math.floor(i / 7) * 0.012, k = clamp((q * 1.35 - d) / 0.9); if (k >= 1) return;
      const x0 = bx + 20 + (i / chars.length) * (bw - 100), y0 = by + 39, e2 = k * k, x = x0 + (px - x0) * e2 + Math.sin(i * 1.7 + t * 8) * 10 * (1 - k), y = y0 + (py - 30 - y0) * e2;
      ctx.globalAlpha = 1 - Math.max(0, k - 0.8) / 0.2; ctx.fillStyle = i % 4 === 0 ? '#bfe8ff' : i % 3 === 0 ? '#c9a7ff' : '#f4f6ff';
      ctx.fillText(k > 0.35 ? (((i * 7 + Math.floor(t * 24)) % 2) ? '1' : '0') : c, x, y); });   // letters turn to binary as they fall in
    ctx.restore(); }
  if (t >= HEAD && t < END + 0.2) { const w = t - HEAD; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(px, py - 40);   // it's in: his head whirs
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + w * 7; ctx.fillStyle = i % 2 ? '#8fd3ff' : '#c9a7ff'; ctx.globalAlpha = 0.85; ctx.fillRect(Math.cos(a) * (48 + 4 * Math.sin(w * 20)) - 3, Math.sin(a) * 30 - 13, 6, 6); }
    ctx.restore(); glow(ctx, px, py - 40, 40 + 30 * Math.sin(w * 12), '#bfe8ff', 0.5); }
}
// the stage boards he walks on in the opener (and the footlights); on the music they drop away below
function stageFloor(ctx, t, e) {
  const drop = t < 0 ? 0 : ease(t / 1.4) * 260; if (drop >= 259) return;
  const top = wy(FLOOR_FEET) + drop, lit = t < 0 ? 1 : 1 - ease(t / 0.8);
  ctx.save();
  ctx.fillStyle = '#5a3b22'; ctx.fillRect(0, top, W, H - top + 300);
  for (let r = 0; r < 6; r++) { const y0 = top + 6 + r * 22; ctx.fillStyle = r % 2 ? '#6b4728' : '#734d2b'; ctx.fillRect(0, y0, W, 20);
    ctx.fillStyle = '#3e2715'; for (let k = 0; k < 9; k++) { const xx = ((k * 137 + r * 61) % 1000) - 20; ctx.fillRect(xx, y0, 3, 20); } }   // planks + their seams
  ctx.fillStyle = '#2e1d10'; ctx.fillRect(0, top - 2, W, 8); ctx.fillStyle = '#9a6b3c'; ctx.fillRect(0, top - 2, W, 3);   // the front lip
  ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, top + 6); ctx.lineTo(W, top + 6); ctx.stroke();
  for (let i = 0; i < 12; i++) { const fx = 40 + i * 80, fy = H - 10 + drop; glow(ctx, fx, fy, 60, '#ffd68a', 0.35 * lit); ctx.fillStyle = lit > 0.5 ? '#fff0c4' : '#7a6a4a'; ctx.beginPath(); ctx.ellipse(fx, fy, 10, 5, 0, 0, 7); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }   // footlights
  ctx.restore(); }

export function story(ctx, e) {
  const { t, px, py } = e, M = e.music;
  const kick = M ? M.kick(t) : e.kick, snare = M ? M.snare(t) : 0, hat = M ? M.hat(t) : 0, drop = M ? M.dropHit(t, 0.3, 1.2) : 0, loud = M ? M.loud(t) : 0.5;
  const house = t < 0 ? 0.55 : Math.min(1, 0.55 + 0.45 * ease(t / 0.6));      // the stage lights: down for the opener, up on the music
  // ---- the backdrop cloth, cranked slowly across ----
  const hyper = span(t, 206, 246) ? ease((t - 206) / 6) : 0, still = span(t, 202.1, 206.2) ? fade(t, 202.1, 206.2, 0.5, 0.5) : 0;
  const pace = t < 0 ? 0.15 : (1 - 0.85 * still) * (1 + 2.5 * hyper);
  const cl = cloth(), ox = ((t * 14 * (t < 0 ? 0.15 : 1) + (t > 206 ? (t - 206) * 30 : 0)) % CLOTH_W + CLOTH_W) % CLOTH_W;
  ctx.drawImage(cl, -ox, 0); ctx.drawImage(cl, CLOTH_W - ox, 0);
  // ---- stage lights: a few spot cones from above, they sweep slowly, breathe on the kick and flare on a drop ----
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) { const x0 = W * (0.15 + 0.24 * i), sx = x0 + Math.sin(t * 0.3 + i * 1.7) * 160, k = (0.05 + 0.04 * kick + 0.18 * drop) * house;
    const g = ctx.createLinearGradient(x0, 0, sx, H); g.addColorStop(0, `rgba(255,236,190,${k * 1.6})`); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0 - 10, 0); ctx.lineTo(x0 + 10, 0); ctx.lineTo(sx + 110, H); ctx.lineTo(sx - 110, H); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // ---- lift-off: the cardboard Earth, on its pole, lowered out of shot ----
  if (t < 9) { const k = t < 0 ? 0 : ease(t / 7); ctx.globalAlpha = house; ctx.drawImage(PROPS.earth(), W * 0.6, H - 236 + k * 420, 300 * 0.78, 330 * 0.78); ctx.globalAlpha = 1; }   // (right of centre: the opener's spot is on him, left)
  // ---- the hung set dressing: stars, moons, little planets sliding by on their tracks, swaying on their strings ----
  for (const P of HUNG) { const img = P.kind === 'star' ? PROPS.star(P.col) : PROPS[P.kind](), sc = 0.55 + 0.5 * P.d, w = img.width * sc;
    const x = slide(t, (12 + 46 * P.d) * pace + 4, P.off, w), y = P.y + 8 * Math.sin(t * 0.7 + P.ph) - 7 * kick * P.d;
    poked(P, x, y, w * 0.45, e);
    const swing = 0.035 * Math.sin(t * (0.9 + 0.5 * P.d) + P.ph) + 0.05 * drop * Math.sin(t * 9 + P.ph) + 0.012 * kick + pokeSwing(P, t);
    hang(ctx, img, x, y, { sc, sw: swing, a: (0.45 + 0.35 * P.d) * house, tapeY: P.kind === 'star' ? 10 : 16, turn: pokeTurn(P, t) || twirl(P.i, t) });
    if (P.kind === 'star' && hat > 0.6 && rnd(P.i, Math.floor(t * 8)) < 0.4) glow(ctx, x - 6, y - 8, 10, '#ffffff', 0.7 * house); }   // foil glints on the hats
  // ---- wrong planets drifting by (on their tracks) ----
  const drift = (t0, dur, y, sc, draw) => { if (!span(t, t0, t0 + dur)) return; const k = (t - t0) / dur; draw(W + 200 - k * (W + 400), y, sc); };
  drift(24, 30, 64, 0.62, (x, y, sc) => { poked(DRIFT[0], x, y, 40, e); hang(ctx, PROPS.planetA(), x, y, { sc, sw: 0.03 * Math.sin(t * 0.8) + pokeSwing(DRIFT[0], t), a: 0.95, turn: pokeTurn(DRIFT[0], t) }); });   // (up in the flies: above the top lane)
  drift(50, 26, H - 34, 1.0, (x, y, sc) => { poked(DRIFT[1], x, y, 70, e); hang(ctx, PROPS.ringed(span(t, 53.3, 64)), x, y, { sc, sw: 0.025 * Math.sin(t * 0.7 + 1) - 0.01 * kick + pokeSwing(DRIFT[1], t), tapeY: 28, strings: [-50, 50], turn: pokeTurn(DRIFT[1], t) }); });   // (hung low: below the bottom lane)
  sandwich(ctx, e);                                                                 // round 12: the set piece
  // ---- the chorus suns: a paper-plate sun, cut-card rays turning slowly, pumping on the kick ----
  for (const [c0, c1] of [[62.6, 97.8], [206.2, 229.5]]) if (span(t, c0, c1)) { const k = fade(t, c0, c1, 2, 2), rise = ease(clamp((t - c0) / 2.4)), set = ease(clamp((t - c1 + 2.4) / 2.4));
    const x = W * 0.86 + (1 - rise) * 260 + set * 260, y = H * 0.48 + (1 - rise) * 40, R = 1 + 0.1 * kick + 0.08 * drop;
    glow(ctx, x, y, 200 + 60 * kick, '#ffb347', 0.35 * k);
    ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = STRING; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 40, RAIL); ctx.lineTo(x - 40, y - 70); ctx.moveTo(x + 40, RAIL); ctx.lineTo(x + 40, y - 70); ctx.stroke();
    const ray = PROPS.sunRay(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + t * 0.15; ctx.save(); ctx.translate(x + Math.cos(a) * 82 * R, y + Math.sin(a) * 82 * R); ctx.rotate(a); ctx.scale(R, R); ctx.drawImage(ray, -12, -20); ctx.restore(); }
    ctx.drawImage(PROPS.sunDisc(), x - 106, y - 106); ctx.restore(); }
  if (span(t, 76, 78.5)) glow(ctx, W * 0.6, H * 0.5, 500, '#ffcf4a', 0.3 * fade(t, 76, 78.5, 0.3, 0.6));   // the gold wall of citations: the sky goes gold for it
  // ---- the asteroid belt of plausible nonsense: a long painted flat + one big crumpled-paper rock, all behind the course ----
  if (span(t, 97.8, 140.8)) { const k = fade(t, 97.8, 140.8, 3, 3);
    const bf = PROPS.beltFlat(), bx = ((t - 97.8) * 46) % (bf.width + W); hang(ctx, bf, W + bf.width / 2 - bx, H - 26 + 4 * Math.sin(t * 0.6), { a: 0.7 * k, sw: 0.006 * Math.sin(t * 0.5), tapeY: 40, strings: [-370, 350] });   // (a ground row along the bottom)
    hang(ctx, PROPS.bigRock(), W + 260 - ((t - 97.8) / 43) * (W + 520), H * 0.45 + Math.sin(t * 0.2) * 14, { a: 0.28 * k, sc: 0.95, sw: 0.02 * Math.sin(t * 0.4) + 0.01 * kick, tapeY: 30, strings: [-40, 50] }); }   // (far upstage, dim: scenery, not a target)
  // ---- he's in the data now: the words he shoots light the fairy lights ----
  constellation(ctx, e, kick);
  // ---- Kevin: one little moon tags along on its string ----
  // (round 21: Kevin's tag-along moon is gone — he's in his cage, and a moon over Potato's head read as a rock)
  // ---- "I'm on fire today": an orange cellophane sheet sweeps across ----
  if (span(t, 157.2, 160.5)) { const k = (t - 157.2) / 3.3, x = -300 + k * (W + 600); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#ff8a3c'; ctx.beginPath(); ctx.moveTo(x - 220, 0); ctx.lineTo(x + 120, 0); ctx.lineTo(x + 220, H); ctx.lineTo(x - 120, H); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.25; ctx.strokeStyle = '#ffe0a0'; ctx.lineWidth = 3; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(x - 160 + i * 45, 0); ctx.lineTo(x - 80 + i * 45 + Math.sin(i) * 30, H); ctx.stroke(); } ctx.restore(); }
  // ---- the last chorus: crepe-paper streamers blown flat by the stage fan (that's hyperspace, in a school play) ----
  if (hyper > 0) { ctx.save(); const cols = ['#bfe8ff', '#f4e9c8', '#ffd05a', '#9fd0e8', '#ff9a7a'];
    for (let i = 0; i < 9; i++) { const y0 = 60 + i * 52, len = (220 + 160 * rnd(i, 51)) * hyper, ph = t * (9 + 3 * rnd(i, 52)), x1 = W + 10, a = 0.5 * hyper * house;
      ctx.globalAlpha = a; ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.moveTo(x1, y0 - 6);
      for (let k = 0; k <= 12; k++) { const u = k / 12; ctx.lineTo(x1 - u * len, y0 - 6 + Math.sin(ph - u * 9) * 9 * u); }
      for (let k = 12; k >= 0; k--) { const u = k / 12; ctx.lineTo(x1 - u * len, y0 + 6 + Math.sin(ph - u * 9 + 0.5) * 9 * u); } ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.globalAlpha = a * 0.6; ctx.stroke(); }
    ctx.restore(); }
  // ---- the Institute of Making Stuff Up: a cardboard trophy waits small and dim; once the mothership is down its windows light,
  // its light finds him, and it's lowered in as he flies to it ----
  const down = bossDown(e);
  if (t > 228) { const far = ease(clamp((t - 228) / 6)), arrive = down != null ? ease(clamp((t - down - 0.6) / 4.5)) : 0, x = W * 0.84 - 0.06 * W * arrive, y = H * 0.36 + 0.08 * H * arrive;
    const sc = 0.42 + 0.12 * far + 1.1 * arrive, lit = down != null ? clamp((t - down) / 1.2) : 0, tr = PROPS.trophy();
    glow(ctx, x, y, 60 + 220 * arrive, '#ffcf4a', 0.15 * far + 0.35 * arrive + 0.25 * lit);
    hang(ctx, tr, x, y, { sc, a: (0.45 + 0.15 * far) * (1 - arrive) + arrive, sw: 0.02 * Math.sin(t * 0.8), tapeY: 36, strings: [-30, 30] });
    for (let i = 0; i < 6; i++) { const on = lit * 6 > i; ctx.fillStyle = on ? '#fff6c0' : '#8a6a1a'; ctx.fillRect(x + (-45 + i * 16) * sc * 0.9, y - 40 * sc, 8 * sc, 8 * sc); if (on) glow(ctx, x + (-41 + i * 16) * sc * 0.9, y - 36 * sc, 14 * sc, '#fff6c0', 0.5); }
    if (down != null && span(t, down + 0.3, down + 4)) { const q = clamp((t - down - 0.3) / 0.5), a = fade(t, down + 0.3, down + 4, 0.2, 0.8);   // its light finds him
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x, y, px, py); g.addColorStop(0, 'rgba(255,214,110,0.5)'); g.addColorStop(1, 'rgba(255,214,110,0.12)');
      ctx.fillStyle = g; ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x, y - 10 * sc); ctx.lineTo(x + (px - x) * q, py - 40); ctx.lineTo(x + (px - x) * q, py + 40); ctx.lineTo(x, y + 10 * sc); ctx.fill(); ctx.restore();
      if (q >= 1) glow(ctx, px, py, 90, '#ffe08a', 0.5 * a); } }
  // ---- the batten: a pipe across the top the strings hang from ----
  ctx.fillStyle = '#07080e'; ctx.fillRect(0, 0, W, RAIL + 2); ctx.fillStyle = '#4a4f5c'; ctx.fillRect(0, RAIL - 3, W, 4);
  // ---- the proscenium (round 21: "it's a stage"): a velvet valance under the batten and a curtain leg each side, inked ----
  ctx.drawImage(PROSC(), 0, 0);
  // ---- the opener: house lights down, a spot on him, the boards, the message box ----
  if (t < 1.6) { const k = t < 0 ? 1 : 1 - ease(t / 1.2);
    ctx.save(); ctx.globalAlpha = 0.45 * k; ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H); ctx.restore();   // dim the set
    stageFloor(ctx, t, e);
    if (t < 0.4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const a = 0.22 * k, g = ctx.createLinearGradient(px, 0, px, wy(FLOOR_FEET) + 20);   // the follow-spot
      g.addColorStop(0, `rgba(255,240,205,${a * 0.4})`); g.addColorStop(1, `rgba(255,240,205,${a})`); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(px - 18, RAIL); ctx.lineTo(px + 18, RAIL); ctx.lineTo(px + 90, wy(FLOOR_FEET) + 14); ctx.lineTo(px - 90, wy(FLOOR_FEET) + 14); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = a * 1.5; ctx.fillStyle = '#fff0cc'; ctx.beginPath(); ctx.ellipse(px, wy(FLOOR_FEET) + 6, 90, 12, 0, 0, 7); ctx.fill(); ctx.restore(); }
    if (t < 0.2) messageBox(ctx, e); }
  if (t >= 0 && t < 0.5) glow(ctx, W / 2, H / 2, 700, '#fff6dc', 0.35 * (1 - t / 0.5));   // lights up!
  if (t > 243) { ctx.fillStyle = '#fff6d8'; ctx.globalAlpha = ease((t - 243) / 3); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}
