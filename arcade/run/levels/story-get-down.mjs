// The music video for Get Down, played as Potato (the beat sheet is at the top of get-down.mjs).
// WHO HE IS HERE: they keep asking if a potato can rap. Wrong question — can YOU keep up? He doesn't join the party, he
// sets the beat and the room has to catch up with him. Swagger with the side-eye; the warmth is that he dances alone in a
// living room until it becomes a party, and ends alone again, still here, switching the light off himself.
// THE VIDEO'S ARC (Matt's Get Down video, Oct 17), one set per section, cut on the music:
//   0–30     the living room on a camcorder (REC, 4% battery): couch, two speakers, a window, string lights — dead
//   30–49    the kitchen 404 PARTY (neon sign, red cups, the résumé on "name myself potato")
//   49–74    the disco: tubes, truss, beams; the LAUGHED AT ME | ME scoreboard on "I keep score"
//   74–94    the backyard at night: fence, moon, string lights — "nobody, no street, just a voice in the room"
//   94–97    the radio: POP / COUNTRY / POTATO — the needle runs off "pop" and "country" and lands on POTATO
//   97–103   the drained disco: a mirrorball and his one spot; a charged GET DOWN still steps the party up
//   103–122  the stage: the drop, a crowd of silhouettes, confetti
//   122–end  back to the camcorder living room: "potato. still here." and on "for now." the lights go off but his.
// THE PARTY (Matt, Nov 1): the room starts DIM and only his charged GET DOWN blasts light it, one party level at a time
// (s.party, from core.mjs: crashers fill his bar, full bar + glitch on a chorus "get down" = a step). Each level switches
// more of the rig on, in every set: 1 the tubes, washes and string lights · 2 the moving heads + the first
// of the crowd · 3 more crowd · 4 lasers + the mirrorball · 5 the strobes · 6 HUGE (laser fans, blinders, confetti that never stops) — and
// at 6 the party never ends: the camcorder catches it at full instead of the lights going off on "for now."
// The song still dips it where it goes quiet (the hush, "nobody", the radio, the drained room until his next step).
// His moves are still tracked (GV: the strokes off him, the LAUGHED AT ME | ME scoreboard) but no longer light the room.
// Photosensitivity: strobes never fill the frame, never white over the course, never more than ~3 a second (one shared
// limiter), and calm lights (e.calm) turns every flash off. No purple anywhere here: the purple glitch is only his.
import { W, H, clamp, ease, rnd, span, fade, glow } from '../story.mjs';
import { BLANK_Q } from '../blank.mjs';   // (the clean-slate run: game/playthroughs/README.md)
// SET STRIP (Chikin, Nov 5: "the assets are supposed to go away" / "It's a setting, they have to fill the space",
// D-20261105-12/28): in the movie set (?blank) the previous-story props, signs, cards, gags and characters are not drawn;
// only the look stays (the house party, room by room, and its rig). ?oldprops shows them again in a blank run, to compare.
const SET = BLANK_Q && !(() => { try { return new URLSearchParams(location.search).has('oldprops'); } catch (e) { return false; } })();
import { PARTY, PARTY_MAX } from './get-down.mjs';                       // (read only at run time: the two files import each other)
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare
const DOWN = 102.9, DANCE = [[50.4, 53.0], [103.3, 106.3]];            // = get-down.mjs (the gold DOWN, the dance breaks)

const CYAN = '#38e8ff', ORANGE = '#ff8a3d', YELLOW = '#ffe066', PINK = '#ff4f8b', LIME = '#7dff9a', NEON = [CYAN, ORANGE, YELLOW, PINK, LIME];
const MONO = '"Major Mono Display", ui-monospace, monospace';
const SCENES = [[0, 'room'], [30.3, 'kitchen'], [49.2, 'club'], [74.0, 'yard'], [94.4, 'radio'], [97.0, 'ball'], [DOWN, 'stage'], [121.73, 'home']];
const sceneAt = t => { let s = SCENES[0][1]; for (const [a, n] of SCENES) if (t >= a) s = n; return s; };
const FORNOW = 128.44;

// ---------- the party + his dance moves, read off the run (works from any start: it reseeds from the sim) ----------
const LV = [0.07, 0.36, 0.52, 0.66, 0.78, 0.9, 1.0];                          // the room's light at each party level
export const GV = { t: -9, heat: LV[0], level: 0, steps: [], stepAt: -9, maxed: false, call: 0, cue: null, eShow: 0, moves: [], me: 0, laughs: 0, j: null, d: null, g: null, lastFlash: -9 };
const dipAt = (t, last, maxed) => t >= 49.2 && t < 50.4 ? 0.12 : t >= 75.1 && t < 76.2 ? 0.15 : t >= 94.4 && t < 97.0 ? 0.45
  : t >= 97.0 && t < DOWN && last < 97 ? 0.3 : t >= FORNOW && !maxed ? 0.03 : 1;
export function track(s, t, P, b) {
  if (GV.t === t) return GV;
  const O = t - b * P, onBeat = tp => { const q = (tp - O) / P; return Math.abs(q - Math.round(q)) * P < 0.08; };
  const st = s.steps || {}, steps = Object.values(st).sort((x, y) => x - y), lvl = Math.min(PARTY_MAX, s.party || 0), last = steps.length ? steps[steps.length - 1] : -9;
  Object.assign(GV, { level: lvl, steps, stepAt: last, maxed: lvl >= PARTY_MAX });
  const tgt = Math.min(LV[lvl], dipAt(t, last, GV.maxed));
  // a GET DOWN coming with the bar full: the floor calls for it (~1 s ahead) — no words, just light
  const k = PARTY.cues.findIndex((c, i) => st[i] == null && t > c.t0 - 1.0 && t < c.t1), cue = k >= 0 ? PARTY.cues[k] : null;
  GV.cue = cue; GV.call = cue && (s.energy || 0) >= PARTY.full && lvl < PARTY_MAX ? 0.4 + 0.6 * clamp(1 - (cue.t0 - t)) : 0;   // 0.4 the moment it shows (1 s out), 1 in the window
  if (t < GV.t - 0.05 || t - GV.t > 0.75) {                                         // a fresh start (or a jump in time): reseed
    Object.assign(GV, { moves: [], me: s.beatJumps || 0, laughs: 0, j: s.jumpedAt, d: s.duckUntil, g: s.glitchAt, heat: tgt, eShow: s.energy || 0 }); }
  const add = (tp, kind, on, big) => { GV.moves.push({ t: tp, kind, on, big, x: s.x, y: s.y }); if (on) GV.me++; else { GV.laughs++; GV.offAt = tp; } };
  if (s.jumpedAt != null && s.jumpedAt !== GV.j) { GV.j = s.jumpedAt; if (s.jumpedAt <= t) add(s.jumpedAt, 'kick', (s.streak || 0) > 0); }
  if (s.duckUntil && s.duckUntil !== GV.d) { GV.d = s.duckUntil; const tp = s.duckUntil - Math.max(0.9 * P, 0.42); if (tp <= t && tp > t - 0.2) add(tp, 'drop', onBeat(tp)); }
  if (s.glitchAt != null && s.glitchAt !== GV.g) { GV.g = s.glitchAt; if (s.glitchAt <= t) add(s.glitchAt, 'blast', onBeat(s.glitchAt) || s.bigAt === s.glitchAt, s.bigAt === s.glitchAt); }
  while (GV.moves.length && GV.moves[0].t < t - 3) GV.moves.shift();
  const dt = clamp(t - GV.t, 0, 0.1), rate = tgt > GV.heat ? 3 : 1.4;
  GV.heat += (tgt - GV.heat) * Math.min(1, dt * rate); GV.eShow += ((s.energy || 0) - GV.eShow) * Math.min(1, dt * 12); GV.t = t;
  return GV;
}
const flashOK = (t, calm) => { if (calm || t - GV.lastFlash < 0.34) return false; GV.lastFlash = t; return true; };   // <= ~3 flashes a second, all sources

// ---------- the story ----------
let upu = 60;                                                                     // screen px per world unit (measured off him standing)
// what each party level switches on (0 dim … 6 HUGE)
const BEAMS = [0, 0, 0.55, 0.75, 0.9, 1, 1.25], LASER = [0, 0, 0, 0, 0.5, 0.75, 1], SIL = [0, 0, 5, 8, 11, 15, 22];   // (no 'copies of him in light': they read as hollow rings, the look Matt turned down)
export function story(ctx, e) {
  const { t, b, kick, px, py } = e, fy = clamp(e.floorY ?? py + 70, 220, H - 60), s = e.s, P = e.P;
  const G = track(s, t, P, b), h = G.heat, L = G.level, calm = !!e.calm, home = sceneAt(t) === 'home', maxed = G.maxed;
  const scene = home && maxed ? 'stage' : sceneAt(t);                               // a maxed party never stops: the stage, to the end
  const dim = clamp(h / LV[L]), since = t - G.stepAt;                               // dim: the song's dips (and the light still easing up after a step)
  if (s.ground && !s.ducking && fy - py > 10) upu = clamp((fy - py) / 0.7, 30, 110);
  const last = G.moves[G.moves.length - 1];
  const blasted = t >= DOWN && t < 121.73 ? DOWN : null;

  if (scene === 'room' || scene === 'home') room(ctx, e, fy, h, scene === 'home');
  else if (scene === 'kitchen') kitchen(ctx, e, fy, h);
  else if (scene === 'yard' || scene === 'radio') yard(ctx, e, fy, h, scene === 'radio');
  else club(ctx, e, fy, h, scene, G);
  if (scene === 'radio' && !SET) radio(ctx, t);   // (SET: the POP / COUNTRY / POTATO dial is out, an old gag with words. Chikin: "the assets are supposed to go away")

  // ---- the club-family lights, switched on by the party: beams, lasers, the mirrorball, strobes, the HUGE rig ----
  const clubby = scene === 'club' || scene === 'ball' || scene === 'stage';
  if (clubby) {
    if (BEAMS[L]) beams(ctx, e, fy, BEAMS[L] * dim, calm);
    if (LASER[L]) lasers(ctx, t, b, fy, LASER[L] * dim * (L >= 6 ? 1.3 : 1));
    mirrorball(ctx, e, s.used && s.used.disco != null ? s.used.disco : L >= 4 ? 0 : null, scene, L >= 4 && dim > 0.5);
    if (L >= 6) huge(ctx, e, fy, dim, calm);
    if (L >= 5 && !calm) strobes(ctx, e, fy, (L >= 6 ? 1 : 0.6) * dim);
  }
  // ---- the scoreboard: "I keep score when they laugh me off" (the video's LAUGHED AT ME | ME board) ----
  const sbA = fade(t, 61.3, 69.6, 0.3, 0.5) + fade(t, 110.5, 119.0, 0.3, 0.5);
  if (sbA > 0 && !BLANK_Q) scoreboard(ctx, t, G, sbA);   // (?blank: no score counter, D-20261103-24)
  // ---- "a voice in the room": a fan of light out of HIM across the yard (cyan on "cold", orange on "warm") ----
  // (SET: out, light pouring out of where the demo Potato stood. Chikin: "the assets are supposed to go away")
  if (!SET && span(t, 76.2, 79.6)) voice(ctx, t, b, kick, px, py, fade(t, 76.2, 79.6, 0.5, 0.4));
  // ---- the "?" over the empty floor: buzzes on "if a potato can rap?", shorts out on "wrong question" ----
  // (SET: out, an old gag. Chikin: "the assets are supposed to go away")
  if (!SET && span(t, 6.14, 13.6)) { const fall = t > 8.74 ? ease((t - 8.74) / 0.9) : 0;
    neon(ctx, '?', 660, 250 + fall * 220, 190, YELLOW, t, 6.14, (1 - fall) * (t > 8.74 && Math.floor(t * 12) % 3 === 0 ? 0.25 : 0.85)); }

  // ---- the crowd: silhouettes at the front of the floor (the party brings them) ----
  // (SET: out, the old video's crowd; the new story stages its own. Chikin: "It's a setting, they have to fill the space")
  const crowdK = scene === 'stage' ? 1 : scene === 'club' ? 0.6 : 0;
  const nSil = Math.round(SIL[L] * crowdK * dim);
  const vanish = span(t, 56.78, 57.5) || span(t, 106.3, 106.9);                     // "if I vanish, that's the joke": they blink out
  const ducking = s.ducking || (last && last.kind === 'drop' && t - last.t < 0.42) || (since >= 0 && since < 0.45);   // a GET DOWN: everybody gets down with him
  if (!SET && !vanish && nSil) silhouettes(ctx, e, fy, Math.max(h, 0.5), nSil, ducking);
  // (a GET DOWN coming with the bar full: the call is drawn in front of him, danceView.over)
  // ---- THE BIG ONE: a charged GET DOWN — the room steps up (rings across the room, a laser sheet at head height, confetti) ----
  // (SET: the rings, laser sheet and burst all come out of where the demo Potato stood: out. Chikin: "the assets are supposed to go away")
  if (!SET) for (let i = 0; i < G.steps.length; i++) { const a = t - G.steps[i]; if (a < 0 || a > 1.6) continue; const lv = i + 1, big = 0.5 + 0.5 * lv / PARTY_MAX;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let r = 0; r < 3 + Math.floor(lv / 2); r++) { const q = clamp((a - r * 0.1) / 1.0); if (q <= 0 || q >= 1) continue; ctx.strokeStyle = NEON[(r + lv) % 5]; ctx.globalAlpha = (1 - q) * (calm ? 0.45 : 0.9); ctx.lineWidth = (12 - r * 2) * big;
      ctx.beginPath(); ctx.arc(px, py, 30 + q * 1100 * big, 0, 7); ctx.stroke(); }
    ctx.restore();
    if (!calm) glow(ctx, px, fy, 520 * big, NEON[lv % 5], 0.35 * (1 - clamp(a / 0.8)));
    if (a < 0.6) sheet(ctx, t, G.steps[i], fy - 1.15 * upu);
    burst(ctx, G.steps[i], t, px, py, lv); }
  // ---- the drop: from where he stands, the whole room goes off (rings + confetti — never a white frame) ----
  if (blasted != null) { const a = t - blasted;
    if (a < 1.2 && !SET) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let r = 0; r < 3; r++) { const q = clamp((a - r * 0.12) / 0.9); ctx.strokeStyle = NEON[r * 2 % 5]; ctx.globalAlpha = (1 - q) * (calm ? 0.5 : 1) * (0.4 + 0.6 * dim); ctx.lineWidth = 10 - r * 3;
      ctx.beginPath(); ctx.arc(px, py, 20 + q * 1000, 0, 7); ctx.stroke(); } ctx.restore(); }
    if (t < 119 && L >= 2) confetti(ctx, t, blasted, fy, h); }
  // ---- his spot (always there in the dim; at the end — unless the party's maxed — the only light left) ----
  const endDark = t >= FORNOW && !maxed;
  if (h < 0.5 || scene === 'ball' || (t >= FORNOW - 0.2 && !maxed)) spotOn(ctx, px, fy, endDark ? 1 : scene === 'ball' && L < 4 ? 0.9 : 0.5 * clamp(1 - h / 0.5) + 0.15);
  if (!SET && (scene === 'room' || home)) rec(ctx, t, b, home);   // (SET: the camcorder frame is out, the old video's framing device. Chikin: "the assets are supposed to go away")
  if (endDark) { ctx.fillStyle = '#000'; ctx.globalAlpha = 0.55 * ease((t - FORNOW) / 0.25); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; spotOn(ctx, px, fy, 1); }   // he switched it off
}
// the big one's confetti + streamers, out of him (the more the party, the more of it)
function burst(ctx, t0, t, px, py, lv) {
  const a = t - t0, n = 18 + lv * 8; if (a < 0 || a > 1.6) return;
  ctx.save();
  for (let i = 0; i < n; i++) { const ang = rnd(i, t0 * 7) * 6.283, v = 260 + rnd(i, 3) * 420, x = px + Math.cos(ang) * v * a, y = py - 30 + Math.sin(ang) * v * a * 0.7 + 260 * a * a;
    ctx.translate(x, y); ctx.rotate(a * 9 + i); ctx.fillStyle = NEON[i % 5]; ctx.globalAlpha = clamp(1.6 - a) * 0.9; ctx.fillRect(-5, -2.5, 10, 5); ctx.setTransform(1, 0, 0, 1, 0, 0); }
  ctx.restore();
}
// level 6, HUGE: laser fans from both corners and the ball, blinders pumping on the kick, confetti that never stops,
// washes the width of the room (still no white frame, nothing over the course but colour; strobes stay on the limiter)
function huge(ctx, e, fy, a, calm) {
  const { t, b, kick } = e; if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [sx, sy, dir] of [[0, 150, 1], [W, 150, -1], [600, 215, 0]]) for (let i = 0; i < 6; i++) {
    const sw = Math.sin(t * (0.9 + 0.2 * i) + i) * 0.5, ang = dir === 0 ? Math.PI / 2 + (i - 2.5) * 0.3 + sw * 0.4 : (dir > 0 ? 0.15 : Math.PI - 0.15) + dir * (i * 0.13 + sw * 0.25);
    ctx.strokeStyle = NEON[(i + Math.floor(b / 2)) % 5]; ctx.globalAlpha = a * (calm ? 0.14 : 0.26 + 0.14 * kick); ctx.lineWidth = dir === 0 ? 2.5 : 2;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(ang) * 1500, sy + Math.sin(ang) * 1500); ctx.stroke(); }
  ctx.restore();
  for (let i = 0; i < 6; i++) glow(ctx, 80 + i * 160, fy - 30, 190 + 40 * kick, NEON[(i + Math.floor(b / 4)) % 5], a * (calm ? 0.1 : 0.16 + 0.12 * kick));   // washes the width of the room
  if (!calm) for (const x of [70, W - 70]) glow(ctx, x, 150, 110 + 50 * kick, '#ffe9c8', a * 0.18 * kick);                                                  // blinders on the truss, pumping
  ctx.save(); ctx.globalAlpha = 0.75 * a;                                                    // confetti, falling forever (one transform each, no save per piece)
  for (let i = 0; i < 48; i++) { const sp = 70 + rnd(i, 92) * 110, y = 150 + ((t * sp + rnd(i, 95) * 400) % (fy - 140)), x = rnd(i, 93) * W + Math.sin(t * 2 + i) * 24, r = t * 3 + i, c = Math.cos(r), sn = Math.sin(r);
    ctx.setTransform(c, sn, -sn, c, x, y); ctx.fillStyle = NEON[i % 5]; ctx.fillRect(-4, -2, 8, 4); }
  ctx.restore();
}

// ---------- the sets ----------
const ART = {};
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
const scroll = (X, k, w) => ((X * k) % w + w) % w;
// the living room on the camcorder (static, like the video): wall, window, couch, two speakers, the light switch
function roomArt() {
  const [c, x] = canvas(W, H), base = 420;
  const g = x.createLinearGradient(0, 0, 0, base); g.addColorStop(0, '#0a1124'); g.addColorStop(1, '#121b36'); x.fillStyle = g; x.fillRect(0, 0, W, base + 4);
  x.fillStyle = 'rgba(255,255,255,0.025)'; for (let X = 0; X < W; X += 26) x.fillRect(X, 0, 2, base);             // wallpaper
  x.fillStyle = '#060a16'; x.fillRect(110, 190, 230, 150); x.strokeStyle = '#2a3554'; x.lineWidth = 6; x.strokeRect(110, 190, 230, 150);   // the window
  x.beginPath(); x.moveTo(225, 190); x.lineTo(225, 340); x.moveTo(110, 265); x.lineTo(340, 265); x.lineWidth = 4; x.stroke();
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(200,220,255,${0.3 + 0.5 * rnd(i, 3)})`; x.fillRect(116 + rnd(i, 1) * 218, 196 + rnd(i, 2) * 138, 2, 2); }
  x.fillStyle = '#1b2442'; x.beginPath(); x.roundRect(470, base - 96, 320, 70, 18); x.fill();                         // the couch
  x.fillStyle = '#212c50'; x.beginPath(); x.roundRect(450, base - 60, 360, 60, 14); x.fill();
  x.fillStyle = '#18203c'; x.beginPath(); x.roundRect(436, base - 82, 46, 82, 14); x.fill(); x.beginPath(); x.roundRect(778, base - 82, 46, 82, 14); x.fill();
  for (const sx of [40, 880]) { x.fillStyle = '#0b0e18'; x.beginPath(); x.roundRect(sx, base - 170, 64, 170, 8); x.fill(); x.strokeStyle = '#232a3e'; x.lineWidth = 3; x.stroke(); }   // speakers
  x.fillStyle = '#d8d2c2'; x.beginPath(); x.roundRect(372, 250, 22, 34, 4); x.fill();                                // the light switch
  return c;
}
const SPK = [[72, 300], [72, 365], [912, 300], [912, 365]];
function room(ctx, e, fy, h, home) {
  const t = e.t, dy = fy - 420;
  if (!ART.room) ART.room = roomArt();
  ctx.drawImage(ART.room, 0, dy);
  const off = home && t >= FORNOW;
  for (const [x, y] of SPK) { const r = (y > 330 ? 22 : 13) * (1 + 0.12 * e.kick * h); ctx.fillStyle = '#1d2236'; ctx.beginPath(); ctx.arc(x, y + dy, r, 0, 7); ctx.fill();   // the cones pump with the party
    ctx.strokeStyle = h > 0.3 && !off ? CYAN : '#2c3550'; ctx.globalAlpha = h > 0.3 && !off ? 0.4 + 0.5 * h : 1; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.fillStyle = off ? '#8a8578' : '#b8b2a2'; ctx.fillRect(379, 256 + dy + (off ? 12 : 0), 8, 10);               // the switch: up = on, down = off ("for now.")
  stringLights(ctx, t, e.b, 150, off ? 0 : 0.15 + 0.85 * h, 0, 34);
}
function kitchenArt() {
  const [c, x] = canvas(2 * W, H), base = 420;
  const g = x.createLinearGradient(0, 0, 0, base); g.addColorStop(0, '#16121e'); g.addColorStop(1, '#231a2a'); x.fillStyle = g; x.fillRect(0, 0, 2 * W, base + 4);
  for (let X = 0; X < 2 * W; X += 170) { x.fillStyle = '#2a2232'; x.beginPath(); x.roundRect(X + 10, 160, 150, 80, 6); x.fill(); x.strokeStyle = '#3a3044'; x.lineWidth = 2; x.stroke();   // upper cabinets
    x.fillStyle = '#1e1826'; x.beginPath(); x.roundRect(X + 10, base - 95, 150, 92, 6); x.fill(); x.stroke(); x.fillStyle = '#4a4054'; x.fillRect(X + 80, base - 80, 10, 3); }
  x.fillStyle = '#3a3242'; x.fillRect(0, base - 104, 2 * W, 10);                                                    // the counter top
  for (let X = 30; X < 2 * W; X += 54 + 40 * rnd(X, 1)) { const n = 1 + Math.floor(rnd(X, 2) * 3);                  // red cups
    for (let i = 0; i < n; i++) { const cx = X + i * 15; x.fillStyle = '#c8283a'; x.beginPath(); x.moveTo(cx - 6, base - 128); x.lineTo(cx + 6, base - 128); x.lineTo(cx + 4.5, base - 104); x.lineTo(cx - 4.5, base - 104); x.fill();
      x.fillStyle = '#f0e6dc'; x.fillRect(cx - 6, base - 129, 12, 3); } }
  x.fillStyle = '#2c2f3a'; x.fillRect(1300, 150, 120, base - 150); x.strokeStyle = '#1a1c24'; x.lineWidth = 3; x.strokeRect(1300, 150, 120, base - 150);   // the fridge
  return c;
}
function kitchen(ctx, e, fy, h) {
  const { t } = e, X = e.s.x || 0, dy = fy - 420;
  if (!ART.kitchen) ART.kitchen = kitchenArt();
  const ox = scroll(X, 3, 2 * W), hush = t > 49.2;
  ctx.save(); ctx.globalAlpha = hush ? 0.35 : 0.55 + 0.45 * h; ctx.drawImage(ART.kitchen, -ox, dy); ctx.drawImage(ART.kitchen, 2 * W - ox, dy); ctx.restore();
  // the neon 404 PARTY on the wall (its own text): buzzes on with "round face", brighter as the party catches up with him
  // (SET: the 404 PARTY sign is out, a sign that names the scene in words. Chikin: "the assets are supposed to go away")
  if (!SET) { neon(ctx, '404', 640, 232 + dy, 64, PINK, t, 30.32, (hush ? 0.3 : 0.35 + 0.65 * h));
  neon(ctx, 'party', 640, 285 + dy, 30, LIME, t, 31.0, (hush ? 0.25 : 0.25 + 0.75 * h)); }
  stringLights(ctx, t, e.b, 128, hush ? 0.1 : 0.2 + 0.8 * h, 0, 30);
  // "name myself potato. that's the whole résumé." — a résumé card pinned on the wall (SET: out, an old gag. Chikin: "the assets are supposed to go away")
  const k = SET ? 0 : fade(t, 45.44, 48.4, 0.35, 0.4); if (k > 0) { ctx.save(); ctx.translate(800, 240 + dy + (1 - ease(clamp((t - 45.44) / 0.35))) * -60); ctx.rotate(0.06); ctx.globalAlpha = k;
    ctx.fillStyle = '#f4efe4'; ctx.fillRect(-62, -78, 124, 156); ctx.fillStyle = '#0b0d12'; ctx.font = `400 15px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText('résumé', 0, -56);
    ctx.font = `400 11px ${MONO}`; ctx.fillStyle = '#7a6040'; ctx.fillText('potato', 0, -40);
    ctx.fillStyle = '#9aa0ab'; for (let i = 0; i < 6; i++) ctx.fillRect(-48, -22 + i * 15, 70 + 26 * rnd(i, 4), 5); ctx.restore(); }
}
function clubArt() {
  const [far, c] = canvas(2 * W, H);
  for (let r = 0, y = 0; y < H; r++, y += 17) for (let x = (r % 2) * -22; x < 2 * W; x += 44) {      // bricks
    c.fillStyle = `rgba(${52 + 30 * rnd(x, y) | 0},${34 + 14 * rnd(y, x) | 0},${60 + 30 * rnd(x + 1, y) | 0},${0.16 + 0.12 * rnd(x, y + 3)})`; c.fillRect(x + 1, y + 1, 41, 14); }
  const BAR = 352; c.fillStyle = 'rgba(8,6,18,0.9)'; c.fillRect(0, BAR, 2 * W, H - BAR); c.fillStyle = 'rgba(255,170,90,0.28)'; c.fillRect(0, BAR, 2 * W, 2);
  for (let x = 14; x < 2 * W; x += 15 + 10 * rnd(x, 2)) { const h = 16 + 14 * rnd(x, 3), col = NEON[Math.floor(rnd(x, 4) * 5)];
    c.fillStyle = 'rgba(20,16,36,0.95)'; c.fillRect(x, BAR - h, 7, h); c.fillRect(x + 2, BAR - h - 6, 3, 6); c.globalAlpha = 0.35; c.fillStyle = col; c.fillRect(x + 1, BAR - h + 3, 2, h - 6); c.globalAlpha = 1; }
  c.strokeStyle = 'rgba(150,140,200,0.22)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 186); c.lineTo(2 * W, 186); c.stroke();
  c.lineWidth = 1.5; for (let x = 0; x < 2 * W; x += 24) { c.beginPath(); c.moveTo(x, 186); c.lineTo(x, 214); c.stroke(); }
  c.fillStyle = 'rgba(4,3,10,0.85)'; c.fillRect(0, 214, 2 * W, 10);
  const [mid, m] = canvas(2 * W, 160);
  m.strokeStyle = 'rgba(120,120,150,0.45)'; m.lineWidth = 2; m.beginPath(); m.moveTo(0, 112); m.lineTo(2 * W, 112); m.moveTo(0, 126); m.lineTo(2 * W, 126); m.stroke();   // the truss
  m.lineWidth = 1; m.beginPath(); for (let x = 0; x < 2 * W; x += 14) { m.moveTo(x, 112); m.lineTo(x + 7, 126); m.lineTo(x + 14, 112); } m.stroke();
  for (let x = 40; x < 2 * W; x += 120) { m.fillStyle = 'rgba(30,28,44,1)'; m.fillRect(x - 2, 126, 4, 6); m.beginPath(); m.roundRect(x - 9, 131, 18, 22, 4); m.fill(); }   // the cans
  return { far, mid };
}
const TUBES = [[49.9, 110, PINK], [55.4, 370, CYAN], [60.4, 620, YELLOW], [64.1, 880, LIME]];   // the back wall's neon: one per "get down"
function club(ctx, e, fy, h, scene, G) {
  const { t, kick } = e, X = e.s.x || 0;
  const g = ctx.createLinearGradient(0, 0, 0, fy); g.addColorStop(0, '#030208'); g.addColorStop(1, '#0b0820'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, fy + 4);
  if (!ART.club) ART.club = clubArt();
  const lit = scene === 'ball' && G.level < 4 ? 0.25 : clamp(0.3 + 0.7 * h), ox = scroll(X, 3, 2 * W), mx = scroll(X, 9, 2 * W);
  ctx.save(); ctx.globalAlpha = 0.55 * lit; const dy = fy - 420; ctx.drawImage(ART.club.far, -ox, dy); ctx.drawImage(ART.club.far, 2 * W - ox, dy);
  ctx.globalAlpha = 0.8; ctx.drawImage(ART.club.mid, -mx, 0); ctx.drawImage(ART.club.mid, 2 * W - mx, 0); ctx.restore();
  for (let i = 0; i < 5; i++) { const x = ((i * 240 + 80 - X * 3) % (W + 240) + W + 240) % (W + 240) - 120;   // washes pooled up the wall
    glow(ctx, x, fy - 40, 150 + 40 * h, NEON[i], clamp((h - 0.15) / 0.4) * (0.06 + 0.14 * h) * (1 + 0.5 * kick)); }
  for (let x0 = 40; x0 < 2 * W; x0 += 120) { const x = x0 - mx; if (x < -20 || x > W + 20) continue;            // the cans' lenses light with the party
    const col = NEON[Math.floor(rnd(x0, 9) * 5)], on = h > 0.25 + 0.5 * rnd(x0, 4);
    ctx.fillStyle = on ? col : '#1a1828'; ctx.globalAlpha = on ? 0.5 + 0.5 * h : 1; ctx.beginPath(); ctx.arc(x, 149, 5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  // the four tubes: one buzzes on with each of his first four GET DOWN steps, and stays on; in the drained break, dark
  const tubeA = scene === 'ball' && G.level < 4 ? 0.12 : 0.4 + 0.6 * clamp((h - 0.3) / 0.5);
  TUBES.forEach(([, x, c], i) => tube(ctx, x, fy, c, t, G.level > i ? G.steps[i] ?? 0 : Infinity, tubeA * (Math.floor(e.b) % 2 && h > 0.85 ? 1.2 : 1)));
}
function yardArt() {
  const [c, x] = canvas(2 * W, H), base = 420;
  const g = x.createLinearGradient(0, 0, 0, base); g.addColorStop(0, '#05071a'); g.addColorStop(1, '#141634'); x.fillStyle = g; x.fillRect(0, 0, 2 * W, base + 4);
  for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(220,230,255,${0.2 + 0.6 * rnd(i, 7)})`; x.fillRect(rnd(i, 1) * 2 * W, 150 + rnd(i, 2) * 180, 2, 2); }
  for (let X = 0; X < 2 * W; X += 22) { x.fillStyle = '#0b0c1c'; x.beginPath(); x.moveTo(X + 2, base); x.lineTo(X + 2, base - 70); x.lineTo(X + 10, base - 80); x.lineTo(X + 18, base - 70); x.lineTo(X + 18, base); x.fill(); }   // the fence
  x.fillRect(0, base - 58, 2 * W, 6); x.fillRect(0, base - 28, 2 * W, 6);
  return c;
}
function yard(ctx, e, fy, h, radioOn) {
  const { t } = e, X = e.s.x || 0, dy = fy - 420;
  if (!ART.yard) ART.yard = yardArt();
  const ox = scroll(X, 2, 2 * W); ctx.drawImage(ART.yard, -ox, dy); ctx.drawImage(ART.yard, 2 * W - ox, dy);
  ctx.fillStyle = '#f2ecd6'; ctx.shadowColor = '#f2ecd6'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(820, 200 + dy * 0.3, 22, 0, 7); ctx.fill(); ctx.shadowBlur = 0;   // the moon
  const nobody = span(t, 75.1, 76.2);
  stringLights(ctx, t, e.b, 175, radioOn ? 0.15 : nobody ? 0.06 : 0.15 + 0.85 * h, scroll(X, 4, 1200), 40);
  for (let i = 0; i < 18; i++) { if (rnd(i, 3) > h) continue; const x = (rnd(i, 1) * W + Math.sin(t * 0.7 + i) * 30), y = fy - 30 - rnd(i, 2) * 140 + Math.sin(t * 1.3 + i * 2) * 12;   // fireflies with the groove
    glow(ctx, x, y, 10, YELLOW, 0.35 + 0.3 * Math.sin(t * 3 + i)); }
}
function radio(ctx, t) {                                                            // "potato, no girl, no pop, no country to match"
  const x0 = 560, y0 = 238, k = fade(t, 94.4, 97.1, 0.25, 0.25); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#1c1a2a'; ctx.beginPath(); ctx.roundRect(x0, y0, 330, 96, 14); ctx.fill(); ctx.strokeStyle = '#3c3a52'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#0d0c16'; ctx.beginPath(); ctx.roundRect(x0 + 18, y0 + 14, 294, 44, 6); ctx.fill();
  ctx.strokeStyle = '#4c4a62'; ctx.lineWidth = 1.5; for (let i = 0; i < 28; i++) { const x = x0 + 28 + i * 10; ctx.beginPath(); ctx.moveTo(x, y0 + 18); ctx.lineTo(x, y0 + (i % 5 ? 24 : 28)); ctx.stroke(); }
  const ST = [['pop', x0 + 70, 95.6], ['country', x0 + 165, 96.24], ['potato', x0 + 262, 97.0]];
  ctx.font = '700 15px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const [w, x, tt] of ST) { const off = w !== 'potato' && t > tt + 0.15; ctx.fillStyle = w === 'potato' ? (t > tt ? YELLOW : '#8a8698') : off ? '#55526a' : '#c8c4d8'; ctx.fillText(w, x, y0 + 42);
    if (off) { ctx.strokeStyle = PINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 30, y0 + 30); ctx.lineTo(x + 30, y0 + 54); ctx.moveTo(x + 30, y0 + 30); ctx.lineTo(x - 30, y0 + 54); ctx.stroke(); } }
  const nx = t < 95.6 ? x0 + 40 + (t - 94.4) / 1.2 * 30 : t < 96.24 ? x0 + 70 + ease((t - 95.6) / 0.25) * 95 : t < 97.0 ? x0 + 165 + ease((t - 96.24) / 0.3) * 97 : x0 + 262;   // the needle runs off them, lands on POTATO
  ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(nx, y0 + 14); ctx.lineTo(nx, y0 + 58); ctx.stroke();
  for (const kx of [x0 + 44, x0 + 286]) { ctx.fillStyle = '#2c2a3e'; ctx.beginPath(); ctx.arc(kx, y0 + 76, 10, 0, 7); ctx.fill(); }
  ctx.restore();
}
// the camcorder frame (the video's REC: the room is being filmed; the battery's nearly gone)
function rec(ctx, t, b, home) {
  ctx.save(); ctx.strokeStyle = 'rgba(230,236,255,0.6)'; ctx.lineWidth = 3;
  for (const [x, y, dx, dy] of [[24, 172, 1, 1], [W - 24, 172, -1, 1], [24, H - 24, 1, -1], [W - 24, H - 24, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x + 28 * dx, y); ctx.lineTo(x, y); ctx.lineTo(x, y + 28 * dy); ctx.stroke(); }
  if (Math.floor(t * 1.6) % 2 === 0) { ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(46, 196, 7, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(230,236,255,0.8)'; ctx.font = '700 15px "JetBrains Mono", ui-monospace, monospace'; ctx.textBaseline = 'middle'; ctx.fillText('REC', 60, 197);
  ctx.fillStyle = home && t > 124 && Math.floor(t * 2) % 2 ? '#ff3b3b' : LIME; ctx.fillRect(W - 92, H - 50, 8, 16); ctx.fillStyle = 'rgba(230,236,255,0.8)'; ctx.fillText('4%', W - 78, H - 42);
  ctx.restore();
}
function stringLights(ctx, t, b, y, a, ox, gap) {                                  // a sagging string of party bulbs
  ctx.save(); ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let x = -ox % 240 - 240; x < W + 240; x += 240) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 120, y + 26, x + 240, y); } ctx.stroke();
  for (let x0 = -ox % gap - gap, i = 0; x0 < W + gap; x0 += gap, i++) { const u = ((x0 + ox) % 240 + 240) % 240 / 240, yy = y + 26 * 2 * u * (1 - u) * 1.0 + 6, k = Math.floor((x0 + ox) / gap);
    const col = NEON[((k % 5) + 5) % 5], on = a > 0.05 && rnd(k, 3) < 0.35 + a;
    ctx.fillStyle = on ? col : '#252535'; ctx.globalAlpha = on ? 0.5 + 0.5 * a : 0.8; ctx.beginPath(); ctx.arc(x0, yy, 3.5, 0, 7); ctx.fill();
    if (on && a > 0.3) glow(ctx, x0, yy, 14, col, 0.3 * a); }
  ctx.restore();
}
// ---------- party pieces ----------
function beams(ctx, e, fy, amt, calm) {                                             // moving heads off the truss, swinging on the beat (amt: how much of the rig is on)
  const { t, b, kick } = e, h = clamp(amt); if (amt <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const sw = calm ? Math.sin(t * 0.5) : Math.sin(b * Math.PI / 2) * (0.5 + 0.5 * h);
  for (let i = 0; i < 6; i++) { const sx = 90 + i * 156, ang = Math.PI / 2 + (i % 2 ? 1 : -1) * (0.25 + 0.35 * sw) + (i - 2.5) * 0.06;
    const tx = sx + Math.cos(ang) * (fy - 150), col = NEON[(i + Math.floor(b / 8)) % 5];
    const g = ctx.createLinearGradient(sx, 150, tx, fy); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = amt * (calm ? 0.1 : 0.14 + 0.1 * kick); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(sx - 4, 150); ctx.lineTo(sx + 4, 150); ctx.lineTo(tx + 34, fy - 30); ctx.lineTo(tx - 34, fy - 30); ctx.fill(); }
  ctx.restore();
}
let strobeBeat = -1, strobeOK = false;
function strobes(ctx, e, fy, a) {                                                   // strobe bars on the truss: every other beat, alternate halves (a: how hard)
  const { t, b } = e, beat = Math.floor(b), ph = b - beat;
  if (beat % 2 || ph > 0.2) return;
  if (strobeBeat !== beat) { strobeBeat = beat; strobeOK = flashOK(t, false); } if (!strobeOK) return;
  const k = (1 - ph / 0.2) * clamp(a), which = (beat / 2) % 2;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = which; i < 8; i += 2) { const x = 60 + i * 120; ctx.globalAlpha = k * 0.85; ctx.fillStyle = '#fff6ee'; ctx.fillRect(x - 26, 136, 52, 6);
    const g = ctx.createLinearGradient(0, 142, 0, 312); g.addColorStop(0, 'rgba(255,246,238,0.32)'); g.addColorStop(1, 'rgba(255,246,238,0)');
    ctx.globalAlpha = k; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 26, 142); ctx.lineTo(x + 26, 142); ctx.lineTo(x + 70, 312); ctx.lineTo(x - 70, 312); ctx.fill(); }
  ctx.restore();
}
function lasers(ctx, t, b, fy, a) {
  if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) { const sx = i % 2 ? W : 0, sy = 190 + i * 14, ang = (i % 2 ? Math.PI - 0.12 : 0.12) + Math.sin(t * 1.3 + i) * 0.18 * (i % 2 ? -1 : 1);
    ctx.strokeStyle = NEON[(i + Math.floor(b / 4)) % 5]; ctx.globalAlpha = a * 0.3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(ang) * 1400, sy + Math.sin(ang) * 1400); ctx.stroke(); }
  ctx.restore();
}
function sheet(ctx, t, t0, y) {                                                     // a laser across the whole room at head height
  const a = t < t0 ? clamp(1 - (t0 - t) / 0.9) : clamp(1 - (t - t0) / 0.5); if (a <= 0) return;
  const hot = t > t0 - 0.12 && t < t0 + 0.2;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, y - 26, 0, y + 26); g.addColorStop(0, 'rgba(255,79,139,0)'); g.addColorStop(0.5, 'rgba(255,79,139,0.5)'); g.addColorStop(1, 'rgba(255,79,139,0)');
  ctx.fillStyle = g; ctx.globalAlpha = a * (hot ? 0.8 : 0.4); ctx.fillRect(0, y - 26, W, 52);
  ctx.strokeStyle = hot ? '#ffd0e2' : PINK; ctx.lineWidth = hot ? 4 : 2.5; ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  ctx.restore();
}
function tube(ctx, x, fy, color, t, t0, a) {
  const top = 175, on = t > t0 && (t - t0 > 0.45 || rnd(Math.floor(t * 18), t0) < 0.45);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = on ? color : '#1a1830'; ctx.globalAlpha = on ? Math.min(1, a) : 0.7;
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, fy - 12); ctx.stroke();
  if (on) { ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 22; ctx.globalAlpha = Math.min(1, a) * 0.18; ctx.stroke(); }
  ctx.restore();
}
function neon(ctx, text, x, y, size, color, t, t0, a) {                            // a neon sign: buzzes on, then hums
  if (a <= 0 || t < t0) return; const on = t - t0 > 0.45 || rnd(Math.floor(t * 18), t0) < 0.45;
  ctx.save(); ctx.font = `400 ${size}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = a * (on ? 0.95 : 0.15); ctx.fillStyle = on ? color : '#3a3346'; if (on) { ctx.shadowColor = color; ctx.shadowBlur = size * 0.4; }
  ctx.fillText(text, x, y); ctx.restore();
}
function voice(ctx, t, b, kick, px, py, a) {                                        // a fan of light out of him across the room
  if (a <= 0) return; const cold = span(t, 77.96, 78.4), warm = span(t, 78.44, 79.4), open = ease(clamp((t - 76.2) / 1.0));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 170, W, H); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const ang = -0.12 - (0.14 + i * 0.13) * open + Math.sin(t * 1.1 + i * 1.7) * 0.06, len = 1300;
    const col = cold ? CYAN : warm ? ORANGE : NEON[(i + Math.floor(b / 4)) % 5], x1 = px + 20 + Math.cos(ang) * len, y1 = py - 12 + Math.sin(ang) * len;
    const g = ctx.createLinearGradient(px, py, x1, y1); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = g; ctx.globalAlpha = a * (0.45 + 0.35 * kick); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 20, py - 12); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.globalAlpha = a * 0.12; ctx.lineWidth = 16; ctx.stroke(); }
  ctx.restore(); glow(ctx, px + 16, py - 12, 60 + 20 * kick, cold ? CYAN : warm ? ORANGE : '#ffd0e2', 0.35 * a);
}
function scoreboard(ctx, t, G, a) {                                                 // the video's board: LAUGHED AT ME | ME
  const x0 = 640, y0 = 196, w = 250, hh = 70;
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = '#07080f'; ctx.beginPath(); ctx.roundRect(x0, y0, w, hh, 8); ctx.fill(); ctx.strokeStyle = '#2c3044'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0 + w / 2, y0 + 8); ctx.lineTo(x0 + w / 2, y0 + hh - 8); ctx.stroke();
  ctx.font = '700 10px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = YELLOW; ctx.fillText('LAUGHED AT ME', x0 + w / 4, y0 + 16); ctx.fillText('ME', x0 + 3 * w / 4, y0 + 16);
  const last = G.moves[G.moves.length - 1], bump = last && t - last.t < 0.25 ? 1 - (t - last.t) / 0.25 : 0;
  ctx.font = `400 30px ${MONO}`; ctx.fillStyle = '#ff9a6a'; ctx.globalAlpha = clamp(a) * (last && !last.on && bump ? 1 : 0.85); ctx.fillText(String(G.laughs), x0 + w / 4, y0 + 48);
  ctx.fillStyle = LIME; ctx.globalAlpha = clamp(a); if (last && last.on && bump) { ctx.shadowColor = LIME; ctx.shadowBlur = 16 * bump; } ctx.fillText(String(G.me), x0 + 3 * w / 4, y0 + 48);
  ctx.restore();
}
function silhouettes(ctx, e, fy, h, n, ducking) {                                    // the crowd at the front of the stage, arms up on the beat
  const { t, b } = e; ctx.save();
  for (let i = 0; i < n; i++) { const x = ((i * 53 + rnd(i, 1) * 40) % (W + 60)) - 30, sc = 0.8 + 0.4 * rnd(i, 2), bob = Math.abs(Math.sin(Math.PI * (b + rnd(i, 3)))) * 6 * h, d = ducking ? 22 : 0;
    const y = fy + 8 - bob + d * sc, up = !ducking && (Math.floor(b + rnd(i, 4) * 4) % 4 < 2);
    ctx.fillStyle = '#05040a'; ctx.strokeStyle = '#05040a'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y - 58 * sc, 11 * sc, 0, 7); ctx.fill();                              // head
    ctx.beginPath(); ctx.roundRect(x - 17 * sc, y - 46 * sc, 34 * sc, 50 * sc, 12 * sc); ctx.fill();     // shoulders
    if (up) { ctx.lineWidth = 7 * sc; ctx.beginPath(); ctx.moveTo(x - 12 * sc, y - 40 * sc); ctx.lineTo(x - 20 * sc, y - 82 * sc); ctx.stroke();   // an arm up: a tapered stroke, no hand
      ctx.lineWidth = 4 * sc; ctx.beginPath(); ctx.moveTo(x - 20 * sc, y - 82 * sc); ctx.lineTo(x - 21 * sc, y - 90 * sc); ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = NEON[i % 5]; ctx.globalAlpha = 0.25 + 0.3 * h; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - 58 * sc, 11 * sc, -2.6, -0.6); ctx.stroke();   // rim light
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  ctx.restore();
}
function spotOn(ctx, x, fy, a) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x, 0, x, fy); g.addColorStop(0, 'rgba(255,235,210,0.18)'); g.addColorStop(1, 'rgba(255,235,210,0.10)');
  ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x + 80, fy + 8); ctx.lineTo(x - 80, fy + 8); ctx.fill(); ctx.restore();
}
function mirrorball(ctx, e, wornT, scene, lit) {                                    // comes down when he becomes the Disco Legend; the party (level 4) lights it
  const { t, b, kick } = e, R = 30, x = 600;
  const y = wornT == null ? -40 : -40 + ease((t - wornT) / 3) * 255;
  if (y < -30) return;
  ctx.save(); ctx.globalAlpha = lit ? 1 : 0.6; ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - R); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.clip(); ctx.fillStyle = lit ? '#d9e2f2' : '#2a2c38'; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
  const rot = lit ? t * 2 : 0.3;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const u = ((i / 8 + rot / 6.28) % 1) * 2 - 1, v = j / 8 * 2 - 1 + 0.06;
    const on = lit && rnd(i * 8 + j, Math.floor(b * 2)) < 0.35; ctx.fillStyle = on ? NEON[(i + j) % 5] : lit ? '#9aa6bc' : '#3c3f4e';
    ctx.fillRect(x + Math.sin(u * 1.4) * R * 0.95 - 3, y + v * R - 3, 6 * Math.cos(u * 1.1), 6); }
  ctx.restore();
  if (!lit) return;
  glow(ctx, x, y, 80 + 40 * kick, '#ffffff', scene === 'ball' ? 0.3 : 0.45);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) { const a = i * 2.4 + t * (0.5 + rnd(i, 1) * 0.5), r = 60 + rnd(i, 2) * 560, sx = x + Math.cos(a) * r * 1.3, sy = y + 30 + Math.abs(Math.sin(a)) * r * 0.6;
    ctx.fillStyle = NEON[i % 5]; ctx.globalAlpha = (0.2 + 0.5 * kick * rnd(i, Math.floor(b))) * (scene === 'ball' ? 0.6 : 1); ctx.fillRect(sx - 3, sy - 3, 6, 6); }
  ctx.restore();
}
function confetti(ctx, t, t0, fy, h) {
  ctx.save(); ctx.globalAlpha = 0.7 * h;
  for (let i = 0; i < 50; i++) { const born = t0 + rnd(i, 91) * 3, a = t - born; if (a < 0) continue;
    const y = 150 + ((a * (90 + rnd(i, 92) * 120)) % (fy - 140)), x = rnd(i, 93) * W + Math.sin(a * 3 + i) * 20;
    const r = a * 4 + i, c = Math.cos(r), sn = Math.sin(r); ctx.setTransform(c, sn, -sn, c, x, y); ctx.fillStyle = NEON[i % 5]; ctx.fillRect(-4, -2, 8, 4); }
  ctx.restore();
}

// ---------- danceView: the floor's lights, his dance blast, the crashers popping, his charge bar (a modeView without a mode) ----------
// The dance floor is the course itself. A dark veil sits over every block (never over its bright top edge, so the course
// still reads first): his spot lights the floor round him and the party level lifts the veil. THE DANCE BLAST — what Space
// always does here (Matt: "his glitching always needs to do that dance blast"): a swirl round him, a ring of lit tiles out
// from his feet, strokes of light off him; charged on a GET DOWN it's the big one (three rings the width of the room, the
// swirl twice the size). A beaten crasher pops in a little burst of light (gold when he spun over it in the air). Hops and
// drops leave their small strokes. The bar: bottom centre, no words. (Cyan/pink/gold: the purple is his glitch's own.)
const FLOORMAX = { room: 0.45, kitchen: 0.6, club: 1, yard: 0.4, radio: 0.35, ball: 0.5, stage: 1, home: 0.35 };
const CRASH_COL = { roomba: CYAN, alarmclock: PINK, raincloud: '#9fd8ff', sprinkler: LIME };
export const danceView = ({ T, world, C }) => {
  const N = 10, fl = Array.from({ length: N }, () => new T.Vector4(0, -9, 0, 0));
  const mat = lift => new T.ShaderMaterial({ transparent: true, depthWrite: false,
    uniforms: { heat: { value: 0 }, time: { value: 0 }, beat: { value: 0 }, calm: { value: 0 }, px: { value: 0 }, lift: { value: lift }, fl: { value: fl } },
    vertexShader: `varying vec2 wp; varying float ly; void main(){ ly = position.y; vec4 w = modelMatrix * vec4(position, 1.0); wp = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float heat, time, beat, calm, px, lift; uniform vec4 fl[${N}]; varying vec2 wp; varying float ly;
      void main(){ if (ly > -0.08) discard;
        float lit = 0.85 * heat + lift + 0.34 * exp(-pow((wp.x - px) / 1.5, 2.0));
        lit += (1.0 - calm) * heat * heat * 0.16 * (1.0 - fract(beat * 0.5));
        for (int i = 0; i < ${N}; i++) { float a = time - fl[i].y, D = 0.7 * (1.0 + fl[i].w); if (a >= 0.0 && a < D) { float r = a * 13.0 * (1.0 + 0.6 * fl[i].w), d = abs(abs(wp.x - fl[i].x) - r);
          lit += fl[i].z * (1.0 - a / D) * exp(-d * d * 1.2 / (1.0 + fl[i].w)) * (calm > 0.5 ? 0.45 : 1.0); } }
        float depth = clamp(-ly / 3.5, 0.0, 1.0);
        gl_FragColor = vec4(0.012, 0.008, 0.03, clamp(1.2 * (1.0 - lit) + 0.35 * depth, 0.0, 0.97)); }` });
  const mGround = mat(0), mRiser = mat(0.12), veils = [];
  for (const q of C.solids) if (q.kind === 'block' && !q.ceil && q.x1 - q.x0 >= 1.2) {
    const w = q.x1 - q.x0, tot = (q.y1 - q.y0) + 9, m = new T.Mesh(new T.PlaneGeometry(w, tot), q.step ? mRiser : mGround);
    m.geometry.translate(w / 2, -tot / 2, 0); m.position.set(q.x0, q.y1, 0.5); m.renderOrder = 2; world.add(m); veils.push(m); }
  let slot = 0, seenBlast = null, seenBig = null, seenPop = null, video = false, eFlashAt = -9, eLast = 0;
  const ring = (x, t0, k, size) => { fl[slot].set(x, t0, k, size); slot = (slot + 1) % N; };
  return {
    draw(f) {
      const { s, t, b } = f, G = track(s, t, C.P, b), sc = sceneAt(t), cap = sc === 'home' && G.maxed ? 1 : FLOORMAX[sc] ?? 1; video = !!f.videoMode;
      if (s.glitchAt != null && s.glitchAt !== seenBlast && s.glitchAt <= t) { seenBlast = s.glitchAt;                       // the dance blast: a ring of lit tiles from his feet
        if (s.bigAt === s.glitchAt) { ring(s.x, s.bigAt, 1.6, 1.5); ring(s.x, s.bigAt + 0.15, 1.2, 2.6); ring(s.x, s.bigAt + 0.32, 1.0, 3.6); seenBig = s.bigAt; }   // the big one: three, the width of the room
        else ring(s.x, s.glitchAt, 1.0, 0); }
      const pop = s.pops && s.pops[s.pops.length - 1]; if (pop && pop.t !== seenPop && pop.t <= t) { seenPop = pop.t; ring(pop.x, pop.t, pop.how === 'both' ? 0.9 : 0.55, 0); }
      const hot = G.maxed ? 1 : 0;
      for (const M of [mGround, mRiser]) { const u = M.uniforms; u.heat.value = Math.min(cap, G.heat) * (t >= FORNOW && !hot ? 0 : 1); u.time.value = t; u.beat.value = b; u.calm.value = f.calm ? 1 : 0; u.px.value = s.x; }
      mRiser.uniforms.lift.value = t >= FORNOW && !hot ? 0 : 0.12;
    },
    over(ctx, f) {
      const { s, t, b, calm } = f, G = GV; if ((t >= FORNOW && !G.maxed) || video) return;
      const A = f.project(s.x, s.y + 0.1), U = Math.abs(f.project(s.x + 1, s.y).x - A.x);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      // ---- his moves: the hop-kick's arc, the drop's shock, and THE DANCE BLAST ----
      for (const m of G.moves) { const a = t - m.t, D = m.kind === 'blast' ? (m.big ? 1.0 : 0.5) : 0.4; if (a < 0 || a > D) continue; const k = a / D;
        if (m.kind === 'kick') { ctx.strokeStyle = m.on ? NEON[Math.floor(m.t * 7) % 5] : '#8a8a9a'; ctx.globalAlpha = (m.on ? 0.7 : 0.3) * (1 - k); ctx.lineWidth = 5 * (1 - k) + 1;
          ctx.beginPath(); ctx.arc(A.x - 0.1 * U, A.y - 0.3 * U, 0.75 * U, 0.4 + k * 0.6, 2.2 + k * 1.4); ctx.stroke(); }
        else if (m.kind === 'drop') { const F = f.project(m.x, m.y), r = (0.4 + 2.2 * k) * U; ctx.strokeStyle = m.on ? NEON[Math.floor(m.t * 7) % 5] : '#8a8a9a'; ctx.globalAlpha = (m.on ? 0.7 : 0.3) * (1 - k); ctx.lineWidth = 4 * (1 - k) + 1;
          ctx.beginPath(); ctx.moveTo(F.x - r, F.y - 2); ctx.lineTo(F.x - r * 0.55, F.y - 2); ctx.moveTo(F.x + r * 0.55, F.y - 2); ctx.lineTo(F.x + r, F.y - 2); ctx.stroke(); }
        else {                                                                                                           // the dance blast (big: on a charged GET DOWN)
          const C2 = f.project(s.x, s.y + 0.62), Z = m.big ? 2.2 : 1, n = m.big ? 5 : 3, al = (1 - k) * (calm ? 0.6 : 0.95);
          for (let i = 0; i < n; i++) { ctx.strokeStyle = [CYAN, PINK, YELLOW, LIME, ORANGE][i % 5]; ctx.globalAlpha = al; ctx.lineWidth = (3 + (m.big ? 3 : 0)) * (1 - k) + 1;   // the swirl round him
            ctx.beginPath(); ctx.ellipse(C2.x, C2.y, (0.7 + 0.25 * i + 0.4 * k) * U * Z, (0.25 + 0.1 * i) * U * Z, 0, k * 9 + i * 2, k * 9 + i * 2 + 2.4); ctx.stroke(); }
          const ns = m.big ? 18 : 9; for (let i = 0; i < ns; i++) { const ang = i / ns * 6.283 + m.t * 3, r0 = (0.6 + 1.6 * k) * U * Z, r1 = r0 + (0.35 + 0.4 * (1 - k)) * U * Z;   // the strokes off him
            ctx.strokeStyle = NEON[(i + Math.floor(m.t * 5)) % 5]; ctx.globalAlpha = al * 0.9; ctx.lineWidth = (m.big ? 5 : 3) * (1 - k) + 1;
            ctx.beginPath(); ctx.moveTo(C2.x + Math.cos(ang) * r0, C2.y + Math.sin(ang) * r0 * 0.75); ctx.lineTo(C2.x + Math.cos(ang) * r1, C2.y + Math.sin(ang) * r1 * 0.75); ctx.stroke(); }
          if (m.big) { ctx.strokeStyle = YELLOW; ctx.globalAlpha = al; ctx.lineWidth = 8 * (1 - k) + 2; ctx.beginPath(); ctx.arc(C2.x, C2.y, (1 + 9 * k) * U, 0, 7); ctx.stroke(); } } }
      // ---- his spin (← / →): a crescent of light swept out in front — what it reaches, it beats ----
      if (s.spinAt != null && t - s.spinAt >= 0 && t - s.spinAt < 0.28) { const k = (t - s.spinAt) / 0.28, C2 = f.project(s.x + 0.2, s.y + 0.55);
        for (const [w, c, al] of [[12, CYAN, 0.3], [4, '#e8fbff', 0.9]]) { ctx.strokeStyle = c; ctx.globalAlpha = al * (1 - k); ctx.lineWidth = w;
          ctx.beginPath(); ctx.ellipse(C2.x + 0.9 * U, C2.y, 1.9 * U, 0.42 * U, 0, -1.5 + k * 1.2, 1.5 + k * 1.6); ctx.stroke(); } }
      // ---- a beaten crasher: it pops in a little burst of light (gold for a spin in the air: double) ----
      if (s.pops) for (const p of s.pops) { const a = t - p.t; if (a < 0 || a > 0.55) continue; const k = a / 0.55, B = f.project(p.x, p.y + 0.4), dbl = p.how === 'both';
        const col = dbl ? YELLOW : CRASH_COL[p.crash] || CYAN, R = (dbl ? 1.3 : 0.9) * U;
        ctx.strokeStyle = col; ctx.globalAlpha = 1 - k; ctx.lineWidth = 5 * (1 - k) + 1; ctx.beginPath(); ctx.arc(B.x, B.y, 6 + R * k, 0, 7); ctx.stroke();
        if (dbl) { ctx.strokeStyle = PINK; ctx.beginPath(); ctx.arc(B.x, B.y, 6 + R * 0.6 * k, 0, 7); ctx.stroke(); }
        ctx.fillStyle = col; for (let i = 0; i < (dbl ? 14 : 9); i++) { const ang = rnd(i, p.t * 11) * 6.283, r = (0.2 + 1.1 * k * (0.6 + 0.4 * rnd(i, 4))) * U * (dbl ? 1.3 : 1);
          ctx.globalAlpha = (1 - k) * 0.95; ctx.fillRect(B.x + Math.cos(ang) * r - 3, B.y + Math.sin(ang) * r - 3 - k * 10, 6, 6); } }
      // ---- a GET DOWN coming with the bar full: the floor round him calls for it, in front of him (~1 s ahead, on the beat, no words) ----
      if (G.call > 0) { const pulse = Math.max(0, Math.cos((b % 1) * Math.PI * 2)), F = f.project(s.x, s.y), C2 = f.project(s.x, s.y + 0.55), al = G.call * (calm ? 0.45 : 1);
        for (const [rx, ry, col, lw, k] of [[1.4 + 0.3 * pulse, 0.3, YELLOW, 5, 1], [1.75 + 0.35 * pulse, 0.38, PINK, 3.5, 0.8]]) {
          ctx.strokeStyle = col; ctx.globalAlpha = al * k * (0.75 + 0.25 * pulse); ctx.lineWidth = lw + 2.5 * pulse;
          ctx.beginPath(); ctx.ellipse(F.x, F.y, rx * U, ry * U, 0, 0, 7); ctx.stroke(); }
        if (!calm) { ctx.strokeStyle = YELLOW; ctx.globalAlpha = al * 0.45 * (0.5 + 0.5 * pulse); ctx.lineWidth = 12;          // a soft pulse of light round him
          ctx.beginPath(); ctx.ellipse(C2.x, C2.y, (0.78 + 0.08 * pulse) * U, (0.72 + 0.08 * pulse) * U, 0, 0, 7); ctx.stroke(); }
        ctx.globalAlpha = 1; glow(ctx, F.x, F.y - 4, 2.2 * U, YELLOW, (calm ? 0.1 : 0.2) * G.call * (0.5 + 0.5 * pulse)); }
      ctx.restore();
      // ---- the charge bar (bottom centre, no words): four cells; full = it glows and beats; a GET DOWN coming = it flares ----
      const full = PARTY.full, e = clamp(G.eShow / full), isFull = (s.energy || 0) >= full;
      if ((s.energy || 0) > eLast) eFlashAt = t; eLast = s.energy || 0;
      const bw = 216, bh = 14, x0 = 480 - bw / 2, y0 = 540 - 30, beatK = Math.max(0, Math.cos((b % 1) * Math.PI * 2)), bigA = G.stepAt > -9 && t - G.stepAt >= 0 && t - G.stepAt < 0.6 ? 1 - (t - G.stepAt) / 0.6 : 0;
      ctx.save();
      if (OLD_WHITE) { ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.roundRect(x0 - 5, y0 - 5, bw + 10, bh + 10, 12); ctx.fill(); }   // a sticker: ink, dark well (the old white border only with ?border=, D-20261105-09)
      ctx.fillStyle = '#0b0d12'; ctx.beginPath(); ctx.roundRect(x0 - 2.5, y0 - 2.5, bw + 5, bh + 5, 9.5); ctx.fill();
      ctx.fillStyle = '#17121f'; ctx.beginPath(); ctx.roundRect(x0, y0, bw, bh, 7); ctx.fill();
      const g = ctx.createLinearGradient(x0, 0, x0 + bw, 0); g.addColorStop(0, CYAN); g.addColorStop(0.5, PINK); g.addColorStop(1, YELLOW);
      ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y0, bw, bh, 7); ctx.clip();
      if (isFull && !calm) { ctx.shadowColor = YELLOW; ctx.shadowBlur = 10 + 14 * beatK + 16 * G.call; }
      ctx.fillStyle = g; ctx.globalAlpha = 0.85 + 0.15 * (isFull ? beatK : 0); ctx.fillRect(x0, y0, bw * e, bh); ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, y0 + 2, bw * e, 3);                                         // the shine
      if (t - eFlashAt < 0.25) { ctx.globalAlpha = 0.6 * (1 - (t - eFlashAt) / 0.25); ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + bw * e - 26, y0, 26, bh); }   // a cell just filled
      if (bigA) { ctx.globalAlpha = 0.8 * bigA; ctx.fillStyle = '#fff2c4'; ctx.fillRect(x0, y0, bw, bh); }                               // spent: it flashes and empties
      ctx.restore();
      ctx.fillStyle = '#0b0d12'; for (let i = 1; i < full; i++) ctx.fillRect(x0 + bw * i / full - 1.5, y0, 3, bh);                       // the cells
      if (G.call > 0 && !calm) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = YELLOW; ctx.lineWidth = 3; ctx.globalAlpha = G.call * (0.35 + 0.65 * beatK);
        ctx.beginPath(); ctx.roundRect(x0 - 9 - 4 * beatK, y0 - 9 - 4 * beatK, bw + 18 + 8 * beatK, bh + 18 + 8 * beatK, 16); ctx.stroke(); }
      ctx.restore();
    },
  };
};
