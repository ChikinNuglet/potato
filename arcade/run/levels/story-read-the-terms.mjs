// The music video for Read the Terms — round 2 (Matt: "clean, one story").
// LOGLINE: everyone clicked ACCEPT without reading; Potato reads every word of the endless contract as he runs it —
// and on the second "you skipped it" he drives a steel girder through the contract and tears it open.
// ONE SET: one endless terms-and-conditions page (cream paper, grey fine print sliding past, a red margin, a scroll bar
// whose thumb is the size of a crumb). Palette: paper, ink, highlighter yellow, link blue, red pen — the only paper-white
// level. Crossovers: the highlighter follows him all song (the line he runs along is the line he read); the girder
// goes off from him on the power.
// BEATS
//  1. everyone clicked accept (0–12.4)  a big checkbox; a cursor sails in and ticks it; then checkboxes tick themselves
//                                       all over the page. On "every word" a highlighter sweeps the whole page.
//  2. the long document (12.4–34)        the page keeps turning (a big fold sweeps across every two bars); the scroll
//                                       thumb crawls; on "page four thousand, third paragraph" one paragraph is circled red.
//  3. I read the terms (34–57)           chorus: a big blue ACCEPT button; the cursor (you) clicks it; on "you skipped it"
//                                       the page whips past in a blur; then one big eye opens in the page and watches
//                                       ("watch your mouth, your tabs"), and the little grey things you typed drift into
//                                       his light.
//  4. the classics and the rage (57–90.8)  a stack of books builds on the page; then the mirror in the wall holds a
//                                       copy of him in light, moving as he moves.
//  5. page nine (90.8–102.7)             the scroll thumb jumps back near the top; a clause gets circled red; "relax,
//                                       just playing": the circle is rubbed out. He grabs the hard hat: caution tape
//                                       along the bottom of the page.
//  6. I read the terms, again (102.7–125.8)  ACCEPT and the cursor again — then on "you skipped it" the girder goes
//                                       through the contract from him and tears the page: VOID.
//  7. still readin (125.8–)              his own checkbox, ticked green and highlighted. Button line (DRAFT for Matt).
// ROUND 8
//  D (crossover) — HE MARKS UP THE CONTRACT. Every word he glitches through flicks a drop of red ink off him onto the page:
//    a red-pen line strikes through a clause of the fine print (with a tick in the margin) and scrolls away with the page.
//    All song long; the more he glitches, the more of the contract is crossed out. The one who read it edits it.
//  A (polish) — the girder moment: the tear now opens onto daylight behind the contract (a warm sky pouring through the
//    rip, curled paper edges with shadow), and the beam gets a lit flange and a shadow on the paper.
// ROUND 12 · SET PIECE (106.6–111.0) — "you hit accept, I HIT THE BOOKS. you signed your soul to a SCROLL and you
//    SKIPPED it." The course and the video are one event: he climbs two stacks of books on "i hit the books" (every
//    landing thumps the whole page — the fine print jumps, paper dust flies off his feet); on "you signed your soul to a
//    scroll" the top of the stack is one long manuscript, and the video unrolls the scroll along it, ahead of him, right
//    out to the gold SKIPPED at its end — the signature scrawls itself on "signed", a red seal stamps on "soul". On
//    "skipped" it snaps shut, the page whips past, and the girder goes through.
// ROUND 16: the classics' book stack stood on the floor line and read as one of the course's books → a shelf printed
//   high in the page, a spine a bar. Page nine's caution tape ran along the bottom, under the floor → it unrolls down both
//   edges of the page. The ending was a crumb of a checkbox on a blank page + a button under the floor → his box, big,
//   with the line under it.
// THE REWORK (Oct 31, late — the level is now a document he climbs; read-the-terms.mjs has the beat sheet):
//  - PAGE TURNS on every section turn (34.1 chorus · 57.3 verse 2 · 90.9 page nine · 125.9 "page nine" again): the whole
//    page flips over right to left on the line's first word, the course's direction flips with it (up the page / down it).
//  - the page scrolls as he climbs: the fine print slides down when he goes up a stair (he's climbing the document).
//  - the ACCEPT button, dragged by the cursor ("you"), chases him all song a little behind and above him — it lunges on
//    "you hit accept" and clicks thin air (he's jumping the accept box in the course right then). Never clicked.
//  - the skipped pages are a HOLE torn in the contract (daylight through the rip) under the bridge he builds; the girder
//    is the real one in the course now (the background beam that doubled it is gone) — the VOID stamp lands on "skipped".
// No lyrics drawn here (the overlay owns the top band). No purple (only Potato glitches purple).
import { W, H, clamp, ease, rnd, span, fade, glitchText, lightSpud, stamp, glow } from '../story.mjs';

const INK = '#1d1a14', GREY = '#a59d8b', RED = '#c4352b', HL = '#ffe066', BLUE = '#2f6fd6', STEEL = '#ff9a1f', PAPER = '#f3eee1';
const MONO = '"Major Mono Display", ui-monospace, monospace';
const SKIP = 110.39, END = 136.8, C1 = 34.10, C2 = 102.81;
const TURNS = [34.10, 57.31, 90.89, 125.91];                                     // the page turns (the level's section turns)
const HOLE0 = 110.59, HOLE1 = 112.05, V2 = 7.8 * 1.12;                            // the skipped hole in the contract (course) and chorus 2's run speed
const BUTTON = [129.6, 'read every word. still didn’t click accept.'];          // DRAFT (Potato's voice) for Matt
let FP = null;                                                                    // the fine print, drawn once
// round 12: the set piece's state (landings on the books; screen px per world unit, measured off him)
const BK0 = 107.2, SCR0 = 108.4, SIGN = 108.75, SOUL = 109.05, SCR1 = 109.05, SCR_END = 110.43, RUN_V = V2;   // (the scroll's end = the gold SKIPPED at the lip of the hole)
const rt = { lands: [], on: null, last: -1, upu: 0 };

export function story(ctx, e) {
  const { t, b, kick, px, py } = e, fy = clamp(e.floorY ?? py + 70, 200, H - 30);
  const girder = e.s.used && e.s.used.construction != null && e.s.used.construction <= t ? Math.max(e.s.used.construction, 107) : null;
  const got = e.s.gotPower != null && e.s.gotPower <= t ? e.s.gotPower : null;
  const c0 = t >= C2 ? C2 : t >= C1 ? C1 : null, d = c0 != null ? t - c0 : -1, inChorus = d >= 0 && d < 23.0;
  const MX = 560, MY = clamp(fy - 150, 210, 330);                                 // where the set pieces stand: right of him, under the lyric band

  // ---- round 12: the books he hits (landings), how far a world unit is on screen ----
  if (t < rt.last - 0.3 || t < BK0 - 1) { rt.lands = []; rt.on = null; } rt.last = t;
  if (span(t, BK0, SCR0 + 0.4) && e.s.ground && e.s.on && e.s.on !== rt.on) { rt.on = e.s.on; if (e.s.on.t > 107.3 && e.s.on.t < 109.2) rt.lands.push(t); }
  if (e.s.ground && Math.abs(fy - (e.floorY ?? fy)) < 1 && py < fy) { const u = (fy - py) / 0.7; if (u > 20 && u < 200) rt.upu = rt.upu ? rt.upu + (u - rt.upu) * 0.05 : u; }
  const thud = rt.lands.reduce((m, l) => { const q = (t - l) / 0.3; return q >= 0 && q < 1 ? Math.max(m, 1 - q) : m; }, 0), jolt = thud * 7 * Math.cos(thud * 12);
  // ---- the page ----
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  const whip = inChorus && span(d, 7.63, 8.5) ? (d - 7.63) * 2600 : 0;           // "you skipped it": the page whips past
  const fp = finePrint(); if (fp) { const off = (t * 55 + whip) % (W * 2), oy = (((e.s.y || 0) * 34) % H + H) % H;   // (the page scrolls as he climbs it)
    for (const dy of [oy, oy - H]) { ctx.drawImage(fp, -off, jolt + dy); ctx.drawImage(fp, W * 2 - off, jolt + dy); } }
  if (whip) { ctx.fillStyle = PAPER; ctx.globalAlpha = 0.6; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#6d6656'; for (let i = 0; i < 40; i++) { const y = 150 + rnd(i, Math.floor(t * 30)) * (H - 160), x = rnd(i, 2) * W * 0.6; ctx.globalAlpha = 0.25 + 0.3 * rnd(i, 3); ctx.fillRect(x, y, 200 + rnd(i, 4) * 500, 2 + rnd(i, 5) * 3); } ctx.globalAlpha = 1; }   // a blur of skipped pages
  ctx.strokeStyle = '#e3c7bf'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(70, H); ctx.stroke();   // the red margin
  deskLight(ctx, t, kick);                                                        // S2 round 2: its own sky — the page lies on a desk under a lamp
  if (span(t, 12.4, 34) || span(t, 57, 90.8)) pageTurn(ctx, b, fy);                 // the page keeps turning
  // he read it: the line he runs along is highlighted behind him
  if (t > 4.54) { const k = ease((t - 4.54) / 1.2); ctx.fillStyle = HL; ctx.globalAlpha = 0.55; ctx.fillRect(Math.max(0, px - 10 - k * 800), fy - 16, Math.min(px - 10, k * 800), 13); ctx.globalAlpha = 1; }
  // the scroll bar: a thumb the size of a crumb (page nine: it jumps back near the top)
  const prog = span(t, 17.08, 18.8) ? 1 : span(t, 91.55, 96.4) ? 0.004 : t / END;
  ctx.fillStyle = '#e2dccd'; ctx.fillRect(W - 9, 160, 5, H - 200); ctx.fillStyle = '#7d7666'; ctx.fillRect(W - 9, 160 + prog * (H - 204), 5, 4);
  redPen(ctx, e, fy);                                                             // every word he glitched through: struck out in red

  // ---- 1. everyone clicked accept ----
  if (span(t, 0.6, 12.4)) {
    const a = fade(t, 0.6, 9.4, 0.3, 0.5);
    if (a > 0) { checkbox(ctx, MX - 40, MY, t > 3.4, a, BLUE, 2.2); glitchText(ctx, 'i agree', MX + 10, MY, 22, INK, t, 1.0, { align: 'left', alpha: a });
      if (t < 3.6) cursor(ctx, MX - 40 + (1 - ease((t - 1.6) / 1.6)) * 300, MY + (1 - ease((t - 1.6) / 1.6)) * 140, a); }
    if (t > 3.4 && t < 9.4) for (let i = 0; i < 36; i++) { const tt = 3.6 + rnd(i, 1) * 1.8; if (t < tt) continue;   // everyone clicked
      checkbox(ctx, 100 + rnd(i, 2) * 820, 170 + rnd(i, 3) * (fy - 200), true, 0.6 * fade(t, tt, 9.4, 0.05, 0.5), BLUE, 0.8); }
    if (span(t, 9.09, 11.6)) { const x = ease((t - 9.09) / 1.4) * W; ctx.fillStyle = HL; ctx.globalAlpha = 0.4 * fade(t, 9.09, 11.6, 0.1, 0.5); ctx.fillRect(0, 150, x, fy - 170); ctx.globalAlpha = 1; }   // every word
  }

  // ---- 2. the long document: page 4,000, third paragraph ----
  if (span(t, 17.08, 20.4)) circled(ctx, MX + 60, MY, t, 17.4, fade(t, 17.08, 20.4, 0.2, 0.5));

  // ---- 3./6. the chorus ----
  if (inChorus) chorus(ctx, e, d, c0, fy, MX, MY, girder);

  // ---- 4. the classics: books stack up; the mirror in the wall ----
  if (span(t, 57.31, 79.6)) shelf(ctx, MX + 60, MY, t, fade(t, 57.31, 79.6, 0.3, 0.5));   // round 16: a shelf printed in the page (the floor stack read as the course's books)
  if (span(t, 85.13, 89.6)) mirror(ctx, MX + 40, MY - 10, t, py, fy);

  // ---- 5. page nine: the clause about the thing you did (rubbed out on "relax, just playing") ----
  if (span(t, 91.55, 97.6)) circled(ctx, MX + 60, MY, t, 92.27, fade(t, 91.55, 97.6, 0.2, 0.2) * (t > 96.38 ? 1 - ease((t - 96.38) / 0.8) : 1));
  if (got != null && t < (girder ?? 1e9) + 3) caution(ctx, t, got);                 // the hard hat's on

  // ---- round 12: the books thump, the scroll unrolls along the top of them ----
  for (const l of rt.lands) { const q = (t - l) / 0.45; if (q < 0 || q > 1) continue;            // paper dust off his feet
    for (let i = 0; i < 9; i++) { const ang = Math.PI * (1.05 + 0.9 * rnd(i, l)), r = ease(q) * (50 + 50 * rnd(i, 3)); ctx.save(); ctx.globalAlpha = 0.8 * (1 - q); ctx.translate(px + Math.cos(ang) * r, py + 26 + Math.sin(ang) * r * 0.6 + q * q * 30);
      ctx.rotate(q * 6 + i); ctx.fillStyle = i % 3 ? '#fbf8f0' : '#d9d2c2'; ctx.strokeStyle = '#8f8775'; ctx.lineWidth = 1; ctx.fillRect(-5, -3.5, 10, 7); ctx.strokeRect(-5, -3.5, 10, 7); ctx.restore(); } }
  if (span(t, SCR0, SKIP + 0.6) && rt.upu) scroll(ctx, t, px, fy, rt.upu);
  // ---- 6. the skipped pages: a hole torn in the contract under the bridge he builds (daylight through it) ----
  if (span(t, HOLE0 - 1.4, HOLE1 + 2.5) && rt.upu) hole(ctx, t, px, fy, rt.upu, girder);
  // ---- the cursor that wants him to click accept: it chases him all song, never gets the click ----
  if (span(t, 12.4, 125.6)) chaser(ctx, t, b, px, py, fy);
  // ---- the page turns ----
  for (const t0 of TURNS) if (span(t, t0, t0 + 0.75)) turnPage(ctx, (t - t0) / 0.75);

  // ---- 7. still readin: his own checkbox; the button ----
  if (t > 125.8) { const a = fade(t, 125.8, 140, 0.4, 1); if (t > 127.2) { ctx.fillStyle = HL; ctx.globalAlpha = 0.5 * a; ctx.fillRect(MX - 30, MY - 52, 140 * ease((t - 127.2) / 0.6), 92); ctx.globalAlpha = 1; }
    checkbox(ctx, MX + 40, MY - 6, t > 127.0, a, '#2b8a3e', 4.4 * (t > 127.0 && t < 127.35 ? 1.15 : 1)); }   // round 16: HIS box, big (it was a crumb on an empty page)
  // (the line under his box is gone: Matt, no words on screen but the lyrics and the page's own — kept in DRAFT-LINES.md)
}

// ---------- pieces ----------
// S2 ROUND 2 · ITS OWN SKY (theme.backdrop 'plain'; this was the shared paler binary rain): the contract is a real stack of
// paper on a desk at night. Far: the edges of the thousands of pages under this one, a ragged stack showing down the
// right side and along the bottom. Light: one warm desk lamp off the top left — the page is bright under it and falls
// off into shadow toward the far corner (cached; one drawImage a frame + a lamp flicker on the kick).
let DESK = null;
function deskArt() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  for (let i = 0; i < 26; i++) { const o = 3 + i * 1.6 + rnd(i, 7) * 1.2;                                        // the page edges underneath
    x.strokeStyle = i % 3 ? 'rgba(150,138,112,0.22)' : 'rgba(110,98,76,0.25)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(W - o, 0); x.lineTo(W - o - rnd(i, 3) * 2, H); x.stroke(); }
  const v = x.createRadialGradient(W * 0.12, -H * 0.1, 40, W * 0.3, H * 0.2, W * 1.05);                              // the lamp's fall-off
  v.addColorStop(0, 'rgba(255,236,190,0)'); v.addColorStop(0.55, 'rgba(120,100,70,0.05)'); v.addColorStop(1, 'rgba(60,45,25,0.32)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  return DESK = c;
}
function deskLight(ctx, t, kick) {
  if (typeof document === 'undefined') return; ctx.drawImage(DESK || deskArt(), 0, 0);
  glow(ctx, W * 0.1, -20, 420, '#ffe2a8', 0.16 + 0.03 * kick);                                                  // the lamp itself, off the top left
}
function finePrint() {                                                           // two screens of fine print (grey bars, no words)
  if (FP || typeof document === 'undefined') return FP;
  const c = document.createElement('canvas'); c.width = W * 2; c.height = H; const x = c.getContext('2d');
  for (let row = 0, y = 20; y < H - 6; row++, y += 12) {
    if (rnd(row, 9) < 0.09) { y += 8; continue; }                                 // a paragraph break
    let px0 = 90; x.fillStyle = '#d9d2c2';
    while (px0 < W * 2 - 30) { const w = 10 + rnd(row * 31 + px0, 2) * 60; x.fillRect(px0, y, w, 4); px0 += w + 6; if (rnd(row, px0) < 0.02) px0 += 60; }
  }
  return FP = c;
}
function pageTurn(ctx, b, fy) {                                                  // every two bars a page turns: a fold sweeps right to left
  const q = ((b % 8) + 8) % 8 / 2.2; if (q >= 1) return; const k = ease(q), x = W - k * (W + 80);
  const g = ctx.createLinearGradient(x - 70, 0, x + 40, 0); g.addColorStop(0, 'rgba(60,50,30,0)'); g.addColorStop(0.6, 'rgba(60,50,30,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 70, 0, 110, H);
  ctx.fillStyle = '#fbf8f0'; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 46 * (1 - k) + 12, 0); ctx.lineTo(x + 30 * (1 - k) + 8, H); ctx.lineTo(x, H); ctx.fill(); ctx.globalAlpha = 1;
}
function checkbox(ctx, x, y, on, a, col, s = 1) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#fbf8f0'; ctx.fillRect(-8, -8, 16, 16); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(-8, -8, 16, 16);
  if (on) { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-1, 5); ctx.lineTo(7, -7); ctx.stroke(); } ctx.restore();
}
function cursor(ctx, x, y, a) {                                                  // the mouse pointer everybody clicks with (that's "you")
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(1.6, 1.6); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 20); ctx.lineTo(5, 15); ctx.lineTo(9, 23); ctx.lineTo(12, 22); ctx.lineTo(8, 14); ctx.lineTo(14, 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function circled(ctx, x, y, t, t0, a) {                                          // a paragraph of fine print, circled in red pen
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fbf8f0'; ctx.fillRect(x - 150, y - 34, 300, 68);
  ctx.fillStyle = '#8f8775'; for (let r = 0; r < 4; r++) ctx.fillRect(x - 130, y - 24 + r * 15, 200 + rnd(r, 7) * 60, 4);
  ctx.strokeStyle = RED; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(x, y, 170, 50, -0.04, -1.2, -1.2 + ease((t - t0) / 0.5) * 6.4); ctx.stroke(); ctx.restore();
}
function chorus(ctx, e, d, c0, fy, MX, MY, girder) {
  const { t, px, py } = e, second = c0 > 100;
  if (span(d, 0.4, second ? 5.6 : 7.4)) { const a = fade(d, 0.4, second ? 5.6 : 7.4, 0.2, 0.3), press = d > 3.07 && d < 3.35, bx = MX + 60, by = MY;   // the ACCEPT button; you click it
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = press ? '#1f4fa0' : BLUE; ctx.beginPath(); ctx.roundRect(bx - 110, by - 32 + (press ? 4 : 0), 220, 64, 12); ctx.fill(); ctx.restore();
    glitchText(ctx, 'accept', bx, by + (press ? 4 : 0), 28, '#ffffff', t, c0 + 0.4, { alpha: a });
    if (d < 3.2) cursor(ctx, bx + 40 + (1 - ease((d - 1.6) / 1.5)) * 220, by + 6 + (1 - ease((d - 1.6) / 1.5)) * 160, a);
    if (d > 3.07) for (let i = 0; i < 26; i++) { const q = d - 3.1 - rnd(i, 4) * 0.8; if (q > 0) checkbox(ctx, 100 + rnd(i, 5) * 820, 170 + rnd(i, 6) * (fy - 200), true, a * 0.55, BLUE, 0.8); } }
  // (the giant eye: removed, Chikin Nov 8)  if (!second && span(d, 11.4, 19.4)) eye(ctx, MX + 60, MY, t, fade(d, 11.4, 19.4, 0.4, 0.5), px, py);   // the page watches: your mouth, your tabs, your drafts
  if (!second && span(d, 15.3, 19.4)) { const a = fade(d, 15.3, 19.4, 0.3, 0.5);                       // everything you ever typed drifts into his light
    glow(ctx, px, py, 150, 'rgba(255,214,90,0.6)', a * 0.8);
    for (let i = 0; i < 9; i++) { const q = ((d - 15.3) * 0.45 + rnd(i, 7)) % 1, sx = 420 + rnd(i, 8) * 480, sy = 190 + rnd(i, 9) * (fy - 240);
      bubble(ctx, sx + (px - sx) * ease(q), sy + (py - 20 - sy) * ease(q), a * (1 - q)); } }
  if (!second && span(d, 20.1, 23.0)) lens(ctx, MX + 60, MY, t, d - 20.1, fade(d, 20.1, 23.0, 0.2, 0.4));   // the fine print in the fine print knows you
}
// round 12: the scroll you signed your soul to — unrolls along the manuscript he runs on, out to the gold SKIPPED
function scroll(ctx, t, px, fy, u) {
  const endX = px + RUN_V * (SCR_END - t) * u, open = ease(clamp((t - SCR0) / (SCR1 - SCR0))), shut = t > SKIP ? ease(clamp((t - SKIP) / 0.25)) : 0;
  const x0 = Math.max(-20, px - 140), x1 = x0 + (endX - x0) * open * (1 - shut), top = fy - 132, bot = fy - 8, hgt = bot - top; if (x1 - x0 < 8) return;
  ctx.save(); ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#e6cf9c'; ctx.fillRect(x0, top, x1 - x0, hgt); ctx.strokeStyle = '#6b4a1d'; ctx.lineWidth = 3; ctx.strokeRect(x0, top, x1 - x0, hgt);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, hgt); ctx.clip();
  ctx.fillStyle = '#9c8a63'; for (let r = 0; r < 6; r++) for (let c = 0; c < 40; c++) { const x = x0 + 14 + c * 46 + (r % 2) * 18; if (x > x1 - 120) break; ctx.fillRect(x, top + 14 + r * 13, 30 + rnd(r * 40 + c, 5) * 12, 3.5); }   // the fine print on it
  const sx = Math.max(x0 + 30, endX - 230), sy = bot - 26;                        // the signature line, near its far end
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 160, sy); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx - 14, sy - 14); ctx.lineTo(sx - 4, sy - 4); ctx.moveTo(sx - 4, sy - 14); ctx.lineTo(sx - 14, sy - 4); ctx.stroke();   // x
  if (t > SIGN) { const k = clamp((t - SIGN) / 0.35); ctx.strokeStyle = BLUE; ctx.lineWidth = 2.5; ctx.beginPath();   // the signature scrawls itself
    for (let i = 0; i <= 40 * k; i++) { const q = i / 40, x = sx + 6 + q * 140, y = sy - 8 - Math.sin(q * 19) * 9 * (1 - q * 0.4) - (q < 0.15 ? (0.15 - q) * 60 : 0); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  if (t > SOUL) { const k = clamp((t - SOUL) / 0.18), r = 22 * (1.6 - 0.6 * k);   // the seal on "soul"
    ctx.globalAlpha = 0.92 * k; ctx.fillStyle = RED; ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, rr = r * (i % 2 ? 0.86 : 1); ctx.lineTo(sx + 186 + Math.cos(a) * rr, sy - 18 + Math.sin(a) * rr); } ctx.fill();
    ctx.strokeStyle = '#8a1f18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx + 186, sy - 18, r * 0.55, 0, 7); ctx.stroke(); }
  ctx.restore();
  ctx.globalAlpha = 0.95; for (const [x, flip] of [[x0, -1], [x1, 1]]) { const g = ctx.createLinearGradient(x - 9, 0, x + 9, 0); g.addColorStop(0, '#c9a874'); g.addColorStop(0.5, '#f6ead0'); g.addColorStop(1, '#a8834e');   // the rolled ends
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - 9, top - 8, 18, hgt + 16, 9); ctx.fill(); ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.restore();
}
function bubble(ctx, x, y, a) {                                                   // a little grey chat bubble (something you typed)
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#c9c1ae'; ctx.beginPath(); ctx.roundRect(x - 22, y - 11, 44, 22, 10); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 12, y + 9); ctx.lineTo(x - 18, y + 18); ctx.lineTo(x - 4, y + 10); ctx.fill(); ctx.fillStyle = '#8f8775'; ctx.fillRect(x - 14, y - 2, 28, 4); ctx.restore();
}
function eye(ctx, x, y, t, a, px, py) {                                           // one big eye in the page, following him
  if (a <= 0) return; const open = ease(a), blink = (t % 3.1) < 0.12 ? 0.1 : 1, h = 46 * open * blink;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 110, h, 0, 0, 7); ctx.fill(); ctx.stroke();
  if (h > 10) { const ang = Math.atan2(py - y, px - x), ix = x + Math.cos(ang) * 50, iy = y + Math.sin(ang) * Math.min(18, h * 0.4);
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, 110, h, 0, 0, 7); ctx.clip(); ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(ix, iy, 30, 0, 7); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ix, iy, 13, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function lens(ctx, x, y, t, k, a) {                                              // fine print inside fine print inside fine print
  ctx.save(); ctx.globalAlpha = a;
  [[80, 3.0], [50, 2.0], [26, 1.2]].forEach(([r, s], i) => { if (k < i * 0.35) return;
    ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 3 - i; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c9c1ae'; for (let rr = -3; rr <= 3; rr++) ctx.fillRect(x - r * 0.7, y + rr * r * 0.22, r * 1.4 * (0.5 + 0.5 * rnd(rr, i)), s); });
  ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x + 56, y + 56); ctx.lineTo(x + 110, y + 110); ctx.stroke(); ctx.restore();
}
function shelf(ctx, x, y, t, a) {                                             // round 16: the classics fill a shelf drawn into the page, a spine a bar —
  if (a <= 0) return;                                                           // standing up, in soft ink, high on the wall: nothing like the books he runs on
  const n = Math.min(17, Math.floor((t - 57.31) / 1.43) + 1), cols = ['#9a5a50', '#56709a', '#6a8a62', '#a88c56', '#7a6a8a', '#5a8686'], w0 = 300, base = y + 46;
  ctx.save(); ctx.globalAlpha = a * 0.75; ctx.strokeStyle = '#6d6656'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - w0 / 2 - 10, base); ctx.lineTo(x + w0 / 2 + 10, base); ctx.moveTo(x - w0 / 2 - 10, base - 96); ctx.lineTo(x + w0 / 2 + 10, base - 96);   // the shelf, ruled like a form
  ctx.moveTo(x - w0 / 2 - 10, base - 96); ctx.lineTo(x - w0 / 2 - 10, base + 6); ctx.moveTo(x + w0 / 2 + 10, base - 96); ctx.lineTo(x + w0 / 2 + 10, base + 6); ctx.stroke();
  let bx = x - w0 / 2;
  for (let i = 0; i < n; i++) { const bw = 13 + rnd(i, 11) * 9, bh = 58 + rnd(i, 12) * 30, drop = i === n - 1 ? (1 - ease(((t - 57.31) % 1.43) / 0.35)) * 70 : 0;
    if (bx + bw > x + w0 / 2) break;
    ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = a * 0.7; ctx.fillRect(bx, base - bh - drop, bw, bh); ctx.globalAlpha = a * 0.75; ctx.strokeStyle = '#4a4436'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, base - bh - drop, bw, bh);
    ctx.fillStyle = '#efe6cf'; ctx.globalAlpha = a * 0.6; ctx.fillRect(bx + 3, base - bh - drop + 10, bw - 6, 3); ctx.fillRect(bx + 3, base - drop - 14, bw - 6, 3);   // the title bands on the spine
    bx += bw + 2; }
  ctx.restore();
}
function mirror(ctx, x, y, t, py, fy) {                                          // the mirror in the wall: a copy of him in light looks back
  const a = fade(t, 85.13, 89.6, 0.3, 0.5); ctx.save(); ctx.globalAlpha = a; const g = ctx.createLinearGradient(x - 60, y - 80, x + 60, y + 80);
  g.addColorStop(0, '#dfe6ea'); g.addColorStop(0.5, '#b7c3cb'); g.addColorStop(1, '#e8eef1'); ctx.fillStyle = '#6b5a3a'; ctx.fillRect(x - 68, y - 88, 136, 176); ctx.fillStyle = g; ctx.fillRect(x - 60, y - 80, 120, 160);
  ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = a * 0.6; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 40, y - 60); ctx.lineTo(x - 10, y - 75); ctx.stroke(); ctx.restore();
  lightSpud(ctx, x, y + 50 + clamp(py - fy + 60, -30, 10), 70, '#3f8fd6', a * 0.9, true);
}
function caution(ctx, t, got) {                                                  // the hard hat's on: caution tape unrolls down both edges of the page
  const k = ease((t - got) / 0.7), top = 150, len = (H - top) * k;                 // round 16: (it ran along the bottom, under the floor: nobody saw it)
  ctx.save(); ctx.globalAlpha = 0.85;
  for (const x0 of [6, W - 44]) { ctx.save(); ctx.beginPath(); ctx.rect(x0, top, 26, len); ctx.clip();
    for (let y = top - 40; y < H + 40; y += 30) { ctx.fillStyle = (Math.floor((y - top + 40) / 30) % 2) ? '#1c1b20' : '#ffc21a'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0, y + 30); ctx.lineTo(x0 + 26, y + 18); ctx.lineTo(x0 + 26, y - 12); ctx.fill(); }
    ctx.restore(); ctx.fillStyle = '#c99a1a'; ctx.fillRect(x0 - 2, top + len - 3, 30, 5); }                    // the roll's leading edge
  ctx.restore();
}
function redPen(ctx, e, fy) {                                                    // he marks up the contract: a red strike per word he glitched through
  const { t, px, py } = e;
  for (const c of e.caught) { const age = t - c.t; if (age < 0 || age > 16) continue;
    const y = 192 + rnd(c.t, 41) * clamp(fy - 150 - 192, 10, 110), w = 120 + Math.min(10, (c.text || '').length) * 12, x0 = px + 60 + rnd(c.t, 42) * 140 - age * 55;
    if (x0 + w < 0) continue;
    if (age < 0.3) { const q = ease(age / 0.3), sx = px + 10 + (x0 - px - 10) * q, sy = py - 30 + (y - py + 30) * q - Math.sin(q * Math.PI) * 60;   // the ink flicks off him
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, 7); ctx.fill(); continue; }
    const k = ease((age - 0.3) / 0.25), a = 0.85 * clamp((16 - age) / 2);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fbf8f0'; ctx.fillRect(x0 - 32, y - 10, w + 40, 30); ctx.fillStyle = '#8f8775'; ctx.fillRect(x0 + 6, y - 2, w - 12, 4); ctx.fillRect(x0 + 6, y + 10, (w - 12) * 0.6, 4);   // the clause it strikes
    ctx.strokeStyle = RED; ctx.lineWidth = 5.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y + 1);
    const n = 6; for (let i = 1; i <= n; i++) { const f = i / n * k; ctx.lineTo(x0 + w * f, y + 1 + (rnd(c.t, i) - 0.5) * 4 + (f > 0.92 ? -6 * (f - 0.92) / 0.08 : 0)); } ctx.stroke();
    if (k >= 1) { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - 26, y + 1); ctx.lineTo(x0 - 20, y + 8); ctx.lineTo(x0 - 9, y - 7); ctx.stroke(); }   // ✓ in the margin
    ctx.restore(); }
}
// ---------- the rework's pieces ----------
function turnPage(ctx, k) {                                                       // a whole page flips over, right to left
  const e = ease(k), x = W - e * (W + 220), lean = 120 * Math.sin(k * Math.PI);    // the turning page's edge, curling
  ctx.save();
  const sh = ctx.createLinearGradient(x - 160, 0, x, 0); sh.addColorStop(0, 'rgba(60,45,25,0)'); sh.addColorStop(1, 'rgba(60,45,25,0.28)');   // its shadow on the page under it
  ctx.fillStyle = sh; ctx.fillRect(x - 160, 0, 160, H);
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + lean, H * 0.5, x, H); ctx.lineTo(Math.min(W + 40, x + 70 + (1 - e) * 500), H); ctx.lineTo(Math.min(W + 40, x + 40 + (1 - e) * 520), 0); ctx.closePath();
  const g = ctx.createLinearGradient(x, 0, x + 260, 0); g.addColorStop(0, '#fffdf6'); g.addColorStop(0.35, '#f1ead8'); g.addColorStop(1, '#d9cfb7');   // the back of the page
  ctx.fillStyle = g; ctx.globalAlpha = 0.95; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#8f8775'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#c9c1ae'; ctx.globalAlpha = 0.5; for (let r = 0; r < 16; r++) ctx.fillRect(x + 30 + lean * 0.4 * Math.sin((r / 16) * Math.PI), 40 + r * 28, 160 * (1 - e * 0.5), 3);   // print showing through
  ctx.restore();
}
function chaser(ctx, t, b, px, py, fy) {                                          // "you": the cursor, dragging the ACCEPT button after him
  const lunge = [37.03, 105.76].reduce((m, t0) => { const q = (t - t0) / 0.55; return q > 0 && q < 1 ? Math.max(m, Math.sin(q * Math.PI)) : m; }, 0);
  const bob = Math.sin(b * Math.PI) * 6, a = fade(t, 12.4, 125.6, 0.8, 0.8) * 0.9;
  const bx = clamp(px - 210 + 150 * lunge + 18 * Math.sin(t * 0.7), 90, W - 200), by = clamp(py - 120 + bob - 40 * lunge, 150, fy - 70);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = BLUE; ctx.beginPath(); ctx.roundRect(bx - 56, by - 17, 112, 34, 9); ctx.fill();
  ctx.fillStyle = '#fbf8f0'; ctx.fillRect(bx - 46, by - 7, 14, 14); ctx.restore();                                 // its empty box (never ticked)
  glitchText(ctx, 'accept', bx + 10, by + 1, 15, '#ffffff', t, 12.4, { alpha: a });
  const press = lunge > 0.85; cursor(ctx, bx + 26 + (press ? 3 : 0), by + 6 + (press ? 3 : 0), a);
  if (press) { ctx.save(); ctx.globalAlpha = a * 0.7; ctx.strokeStyle = BLUE; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx + 30, by + 8, 16, 0, 7); ctx.stroke(); ctx.restore(); }   // a click — on nothing
}
function hole(ctx, t, px, fy, u, girder) {                                        // the pages everyone skipped: a hole in the contract, torn edges, daylight
  const x0 = px + V2 * (HOLE0 - t) * u, x1 = px + V2 * (HOLE1 - t) * u, top = fy + 6, a = fade(t, HOLE0 - 1.4, HOLE1 + 2.5, 0.3, 0.6);
  if (x1 < -40 || x0 > W + 40 || a <= 0) return;
  const rag = (x, k) => (rnd(Math.round(x / 18), k) - 0.5) * 22;
  const path = () => { ctx.beginPath(); ctx.moveTo(x0, top); for (let x = x0; x < x1; x += 18) ctx.lineTo(x, top + 6 + rag(x, 1));
    ctx.lineTo(x1, top); for (let y = top; y < H + 20; y += 18) ctx.lineTo(x1 + rag(y, 2), y); ctx.lineTo(x0, H + 20); for (let y = H + 20; y > top; y -= 18) ctx.lineTo(x0 + rag(y, 3), y); ctx.closePath(); };
  ctx.save(); ctx.globalAlpha = a;
  const sky = ctx.createLinearGradient(0, top, 0, H); sky.addColorStop(0, '#fff6d8'); sky.addColorStop(0.5, '#9fd4ff'); sky.addColorStop(1, '#6fb6f0');   // daylight behind the contract
  path(); ctx.fillStyle = sky; ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.35; ctx.lineWidth = 16; ctx.strokeStyle = '#fff1c4'; path(); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = '#5a4e3a'; ctx.lineWidth = 2; ctx.globalAlpha = a * 0.75; path(); ctx.stroke();
  for (let i = 0; i < 7; i++) { const q = ((t * 0.35 + rnd(i, 4)) % 1), sx = x0 + (x1 - x0) * rnd(i, 5), sy = top + 40 + q * (H - top);   // loose pages drifting down through it
    ctx.save(); ctx.globalAlpha = a * (1 - q); ctx.translate(sx, sy); ctx.rotate(q * 5 + i); ctx.fillStyle = '#fbf8f0'; ctx.fillRect(-14, -9, 28, 18); ctx.fillStyle = GREY; ctx.fillRect(-9, -3, 18, 2); ctx.fillRect(-9, 2, 12, 2); ctx.restore(); }
  ctx.restore();
  if (t > SKIP) stamp(ctx, 'void', clamp((x0 + x1) / 2, 200, W - 160), Math.max(190, fy - 120), t - SKIP, RED, -0.12, 40);   // on "skipped": VOID
}
