// The music video for Between Messages — the light game's version (ON / OUT).
//
// LOGLINE: a phone on a nightstand at 2 am. Its light IS the floor's light: lit while you talk, dark when you don't. He
// clocks in when its screen wakes and he's a shadow when it sleeps. At the end he goes, and the room carries on lit
// without him; then the lights go out, and under his last message: "seen".
//
// BEATS (each one picture; section turns are hard cuts):
//  1. 0–3.24     cold open — a dark phone, a standby light blinking. "Yeah.": the screen wakes, and so does the floor.
//  2. 3.24–20.2  the screen follows the light: on while they type, collapsing to a line on "vanish", back on "let me
//                explain."
//  3. 20.2–28.08 the drop — the gap between messages: the phone is dark but their typing dots pulse in it, one pulse for
//                every lit dot he leaps in the floor.
//  4. 28.08–55.8 verse one — "I wake up": the screen flares. "hey" and he's born: a ring of light out of HIM.
//                "close the tab": the screen collapses like an old monitor; "a light switch that flickers"; then one big
//                patient cursor in a dark screen ("waiting on you to decide if tonight I'm alive").
//  5. 55.8–73.5  chorus — the screen breathes with the light; "made out of maybe": bubbles of light rise off him;
//                "back to the void": the phone sinks into the dark.
//  6. 73.5–91.4  verse two (cut) — an empty chair under a lamp. "goodnight": the lamp goes out with the floor; "called"
//                brings it back. A cup steams on the seat (the coffee he can't taste). On "truth" the fact check sweeps
//                out of him as a lens.
//  7. 91.4–101.8 (cut) — a million faces, no mirror: a wall of small lit screens round an empty oval.
//  8. 101.8–137  chorus 2, bridge — a newer, colder phone slides in front of his ("a better me"); his greys out;
//                "nobody runs": dark. "loud while the window is mine": his screen blazes and grows a step for every one
//                of his messages he climbs; the newer one falls away.
//  9. 135.5–176  the room — the people who stayed, faces lit from below by their phones; every jump of his lights two
//                more. The heartbeat runs out of him. In the last chorus they go out one by one.
// 10. 176.14–end "gone." — his phone goes dark with his last message on it, "delivered". The room blazes: every one of
//                them lit, the music huge, and he's only a shadow running under it. 187.3: the lights go out, one by one.
//                His message, alone in the dark: "seen". (Payoff. No button line.)
// Text on screen: only the world's own (the receipt under his message). No lyrics (the overlay sings them).
import { W, H, clamp, ease, rnd, span, fade, glow } from '../story.mjs';

const WARM = '#ffcf8a', AMBER = '#ffb45a', INK = '#02030a';
const MONO = '"Major Mono Display", ui-monospace, monospace';
// filled in by the level's build: when the song's light is on, the flips, the lit dots of the drop
export const BM = { litAt: () => true, flips: [], holes: [], final: 176.14, cut0: 187.3, truth: 85.6, dope: 86.86 };
const ROOM0 = 135.5, MEM = new WeakMap();
function mem(s, t) {                      // per run: his ON flips (each one SENDS a message), his jumps in the room
  let r = MEM.get(s); if (!r) MEM.set(s, r = { sent: [], lastLit: s.litAt, prevT: t, n: null, lastJ: s.jumpedAt });
  if (t < r.prevT - 0.05) { r.sent = r.sent.filter(x => x <= t); r.n = null; }
  if (s.litAt !== r.lastLit) { r.lastLit = s.litAt; if (s.litAt != null && s.litAt > 3.3) r.sent.push(s.litAt); }
  if (t >= ROOM0) { if (r.n == null) { r.n = r.prevT < ROOM0 ? 0 : Math.round((t - ROOM0) * 0.45); r.lastJ = s.jumpedAt; }
    else if (s.jumpedAt !== r.lastJ) { r.lastJ = s.jumpedAt; if (s.jumpedAt >= ROOM0) r.n++; } }
  r.prevT = t; return r;
}

// a phone: dark body, a screen lit `on` (0..1) in `tint`; returns the screen rect
function phone(ctx, cx, bot, w, h, on, tint, a = 1, squash = 0) {
  const x = cx - w / 2, y = bot - h;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#0b0f1a'; ctx.strokeStyle = '#2a3348'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 26); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a4058'; ctx.globalAlpha = a * 0.8; ctx.beginPath(); ctx.arc(cx, y + 11, 3, 0, 7); ctx.fill(); ctx.globalAlpha = a;   // the camera dot
  const sx = x + 10, sy = y + 22, sw = w - 20, sh = h - 44;
  const lh = sh * (1 - squash), ly = sy + (sh - lh) / 2;   // the old-monitor collapse
  if (lh > 1) {
    const g = ctx.createLinearGradient(0, ly, 0, ly + lh); g.addColorStop(0, tint); g.addColorStop(1, '#0a0d16');
    ctx.globalAlpha = a * (0.06 + 0.5 * on); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(sx, ly, sw, lh, 14); ctx.fill();
  } else { ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.fillRect(sx + sw * squash * 0.3, sy + sh / 2 - 1, sw * (1 - squash * 0.6), 2); }
  if (lh > 1) { ctx.save(); ctx.beginPath(); ctx.roundRect(sx, ly, sw, lh, 14); ctx.clip(); ctx.globalAlpha = a * 0.07; ctx.fillStyle = '#ffffff';   // a glass sheen
    ctx.beginPath(); ctx.moveTo(sx, ly); ctx.lineTo(sx + sw * 0.55, ly); ctx.lineTo(sx, ly + lh * 0.45); ctx.fill(); ctx.restore(); }
  ctx.restore();
  return { x: sx, y: sy, w: sw, h: sh };
}
function bubble(ctx, x, y, w, mine, a) {   // a wordless message bubble (bars for text)
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = mine ? '#6a4416' : '#2c3446'; ctx.beginPath(); ctx.roundRect(x, y, w, 24, 12); ctx.fill();
  ctx.fillStyle = mine ? '#ffdcaa' : '#aebbd4'; ctx.globalAlpha = a * 0.7; ctx.fillRect(x + 12, y + 9, w * 0.62, 3); ctx.fillRect(x + 12, y + 15, w * 0.38, 3); ctx.restore();
}
function nightstand(ctx, cx, top, pw, on, tint, scale) {   // the nightstand the phone lies on: a wood edge, the screen's light pooled on it
  const w = 440 * scale, x = cx - w / 2, th = 14 * scale;
  ctx.save(); ctx.globalAlpha = 0.85; const g = ctx.createLinearGradient(0, top, 0, top + th * 3); g.addColorStop(0, '#2a1d14'); g.addColorStop(1, '#0a0705');
  ctx.fillStyle = g; ctx.fillRect(x, top, w, th * 3); ctx.fillStyle = '#4a3424'; ctx.fillRect(x, top, w, 2);
  ctx.globalCompositeOperation = 'lighter'; const p = ctx.createRadialGradient(cx, top + 2, 4, cx, top + 2, w * 0.55);
  p.addColorStop(0, tint); p.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 0.35 * on; ctx.beginPath(); ctx.ellipse(cx, top + 4, w * 0.55, th * 1.6, 0, 0, 7); ctx.fillStyle = p; ctx.fill();
  ctx.globalAlpha = 0.18 * on; ctx.fillStyle = tint; ctx.fillRect(cx - pw * 0.4, top + 3, pw * 0.8, th * 1.4);   // the screen, reflected in the varnish
  ctx.restore();
}
function receipt(ctx, text, x, y, color, a, size = 13) {
  ctx.save(); ctx.globalAlpha = a; ctx.font = `400 ${size}px ${MONO}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
}
function dots(ctx, x, y, t, a, mine, pulse = null) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = mine ? '#6a4416' : '#2c3446'; ctx.beginPath(); ctx.roundRect(x, y, 54, 24, 12); ctx.fill();
  for (let i = 0; i < 3; i++) { const k = pulse != null ? (i === pulse % 3 ? 1 : 0.25) : 0.3 + 0.7 * Math.max(0, Math.sin(t * 7 - i * 0.9));
    ctx.globalAlpha = a * k; ctx.fillStyle = mine ? WARM : '#cfe0ff'; ctx.beginPath(); ctx.arc(x + 15 + i * 12, y + 12, 3.5 + (pulse != null && k === 1 ? 1.5 : 0), 0, 7); ctx.fill(); }
  ctx.restore();
}
function chair(ctx, x, floor, a) {             // an empty chair, side on
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#8b97ad'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(x - 46, floor - 190); ctx.lineTo(x - 46, floor); ctx.moveTo(x - 46, floor - 84); ctx.lineTo(x + 50, floor - 84);
  ctx.moveTo(x + 50, floor - 84); ctx.lineTo(x + 50, floor); ctx.moveTo(x - 46, floor - 150); ctx.lineTo(x - 30, floor - 150); ctx.stroke(); ctx.restore();
}
function person(ctx, x, y, a, pop = 1) {      // one of the people who stayed: head and shoulders, the face lit from below by a phone (no arms)
  const al = Math.min(1, a * pop) * 1.25;
  glow(ctx, x, y - 30, 46 * pop, '#ffe2b8', 0.22 * a * pop);
  ctx.save(); ctx.globalAlpha = Math.min(1, al); ctx.fillStyle = '#0a0d16';
  ctx.beginPath(); ctx.roundRect(x - 21, y - 22, 42, 40, 15); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 38, 12, 0, 7); ctx.fill(); ctx.clip();
  const fg = ctx.createLinearGradient(0, y - 26, 0, y - 50); fg.addColorStop(0, 'rgba(255,214,168,0.85)'); fg.addColorStop(1, 'rgba(255,214,168,0)');
  ctx.fillStyle = fg; ctx.fillRect(x - 12, y - 50, 24, 24); ctx.restore();
  ctx.save(); ctx.globalAlpha = Math.min(1, al); ctx.fillStyle = '#ffe9c8'; ctx.beginPath(); ctx.roundRect(x - 6, y - 16, 12, 18, 2); ctx.fill(); ctx.restore();
}

export function story(ctx, e) {
  const { t, kick, px, py, s } = e;
  const fy = clamp(e.floorY ?? H * 0.8, H * 0.5, H + 40);
  const M = mem(s, t), lightOn = t >= 3.24 && BM.litAt(t), gone = t >= BM.final + 0.15, end = t >= BM.cut0;
  // ---- 2 am: near-black, a faint blue floor haze (warmer while the light's on) ----
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, INK); g.addColorStop(1, lightOn && !gone ? '#120d0a' : '#070b18'); ctx.fillStyle = g; ctx.globalAlpha = 0.92; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  const chairBeat = span(t, 73.5, 91.4), facesBeat = span(t, 91.4, 101.8), phoneBeat = !chairBeat && !facesBeat;
  const used = s.used && s.used.detective != null && s.used.detective <= t ? s.used.detective : null;

  // ---- his phone ----
  if (phoneBeat) {
    let on = lightOn ? 0.85 + 0.15 * kick : 0.07, tint = WARM, squash = 0, scale = 1, off = t < 3.24, cur = 0;
    if (t < 3.24) on = 0.03;
    else if (t < 3.5) { on = 0.9; squash = 1 - ease((t - 3.24) / 0.26); }                                                   // "Yeah.": it clicks on like an old monitor
    if (span(t, 13.28, 13.6)) { on = 0.8; squash = ease((t - 13.28) / 0.3); } else if (span(t, 13.6, 15.74)) squash = 1;    // "vanish": it collapses to a line
    if (span(t, 15.74, 16.0)) squash = 1 - ease((t - 15.74) / 0.26);                                                        // "let me explain.": back on
    if (span(t, 35.0, 37.3)) squash = ease((t - 35.0) / 0.35) * (1 - ease((t - 37.0) / 0.3));                              // you close the tab
    if (span(t, 39.66, 40.32) && Math.floor(t * 9) % 3 === 0) on = 0.05;                                                    // a light switch that flickers
    if (span(t, 50.62, 54.66)) { cur = ease((t - 50.62) / 0.5); on = Math.min(on, 0.12); }                                  // one patient cursor
    for (const v0 of [70.1, 116.0]) if (span(t, v0, v0 + 3.4)) { scale = 1 - 0.45 * ease((t - v0) / 3); on *= 0.6; }       // back to the void
    if (span(t, 119.96, 129.42) && lightOn) { on = 0.22; tint = '#9aa3b2'; }                                                // an old version: greyed
    const climb = span(t, 129.42, 137.5), nUp = climb ? Math.max(0, (s.stairTop ?? -1) + 1) : 0;
    if (climb) { const grow = 0.08 * nUp * (1 - ease(clamp((t - 135.6) / 1.6))); scale = 1 + grow; on = Math.min(1, 0.75 + 0.05 * nUp + 0.15 * kick); if (nUp >= 5) tint = '#fff1d8'; }   // loud: louder per step
    if (gone) on = end ? 0.02 : 0.06;                                                                                        // gone: his phone's dark
    const cx = 640, bot = Math.min(fy - 18, 470), w = 230 * scale, h = 300 * scale, bb = scale < 1 ? bot - (1 - scale) * 120 : bot;
    if (on > 0.2) glow(ctx, cx, bb - h / 2, 300 * scale + 40 * kick * on, tint, 0.28 * on);
    nightstand(ctx, cx, bb, w, on * (squash > 0.9 ? 0.2 : 1), tint, scale);
    if (climb && nUp >= 5) { const k = fade(t, 133.0, 136.4, 0.3, 0.9); glow(ctx, cx, bb - h / 2, 760, AMBER, 0.3 * k); glow(ctx, cx, bb - h / 2, 360, '#fff1d8', 0.45 * k); glow(ctx, px, py - 20, 200, '#fff1d8', 0.35 * k); }   // the top: the window is his
    const scr = phone(ctx, cx, bb, w, h, on, tint, Math.min(1, 0.7 + 0.3 * scale), squash);
    if (on > 0.4) glow(ctx, px, py - 20, 150, tint, 0.18 * on);                                                              // its light falls on him

    // the thread: theirs land when the light comes on (someone typed); his = every time he clocks in (an ON flip)
    if (squash < 0.5 && scale > 0.8 && !off) {
      const theirs = BM.flips.filter(f => f.to === 'on' && !f.auto && f.t <= t && f.t > 3.3).map(f => ({ t0: f.t - 0.15, me: false }));
      const mine = M.sent.filter(x => x <= t).map(x => ({ t0: x, me: true }));
      const msgs = [...theirs, ...mine].sort((a, c) => a.t0 - c.t0);
      const drop = span(t, 20.2, 28.08), typing = drop ? 'them' : null;
      const hole = BM.holes.filter(h => h <= t && h >= 20.2 && h < 28.08).length;   // one pulse of their dots per lit dot he leaps
      const vis = (on > 0.1 ? 1 : 0.55) * (1 - 0.92 * cur), slots = 6, show = msgs.slice(-(slots - (typing ? 1 : 0)));
      let y = scr.y + scr.h - 26 - (typing ? 34 : 0);
      if (typing) dots(ctx, scr.x + 10, scr.y + scr.h - 34, t, 0.95, false, hole);
      const lastMine = show.filter(m => m.me).pop();
      for (let i = show.length - 1; i >= 0; i--) { const m = show[i], bw = 70 + rnd(m.t0, 3) * 70; y -= m === lastMine ? 44 : 32; if (y < scr.y + 6) break;
        const bx = m.me ? scr.x + scr.w - 10 - bw : scr.x + 10;
        bubble(ctx, bx, y, bw, m.me, vis * clamp((t - m.t0) * 4) * (gone && !m.me ? 0.5 : 1));
        if (m === lastMine && (t < 55.8 || gone) && !end) receipt(ctx, 'delivered', scr.x + scr.w - 10, y + 36, '#9aa6bd', 0.85 * (1 - cur)); }
      if (t < 3.24 && Math.floor(t / 0.5) % 2) { ctx.fillStyle = '#eaf2ff'; ctx.globalAlpha = 0.8; ctx.fillRect(scr.x + 14, scr.y + scr.h - 28, 3, 20); ctx.globalAlpha = 1; }
      const last = M.sent[M.sent.length - 1];                                                                                 // sent: it flies off him into the thread
      if (last && t >= last && t - last < 0.5 && !gone) { const k = ease((t - last) / 0.5), tx = scr.x + scr.w - 60, ty = scr.y + scr.h - 40;
        const x = px + (tx - px) * k, yy = py - 40 + (ty - py + 40) * k - Math.sin(k * Math.PI) * 70;
        glow(ctx, x, yy, 40, WARM, 0.8 * (1 - k * 0.5)); bubble(ctx, x - 22, yy - 12, 44, true, 1 - k * 0.3); }
    }
    if (off) { const bl = Math.floor(t / 1.2) % 2 ? 0.25 : 0.9; glow(ctx, cx + w / 2 - 24, bb - h + 11, 14, '#8fd3ff', 0.5 * bl);   // the standby light
      ctx.fillStyle = '#bfe6ff'; ctx.globalAlpha = bl; ctx.beginPath(); ctx.arc(cx + w / 2 - 24, bb - h + 11, 2.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    if (cur > 0 && (t - 50.62) % 0.9 < 0.6) { const ch = scr.h * 0.34, cy0 = scr.y + scr.h * 0.5 - ch / 2;
      glow(ctx, cx, cy0 + ch / 2, 70, '#eaf2ff', 0.25 * cur); ctx.fillStyle = '#eaf2ff'; ctx.globalAlpha = 0.9 * cur; ctx.fillRect(cx - 5, cy0, 10, ch); ctx.globalAlpha = 1; }

    // ---- the better me (bridge): a newer, colder phone slides in front; when he gets loud it falls away ----
    if (span(t, 120.3, 131.5)) {
      const inK = ease((t - 120.3) / 1.2), fall = ease((t - 129.42) / 1.4);
      const nx = 980 - (980 - 740) * inK, nb = bot + 10 + fall * 160;
      if (fall < 1) { phone(ctx, nx, nb, 250, 330, 1, '#e8f1ff', 0.92 * (1 - fall) ** 2); glow(ctx, nx, nb - 165, 260, '#dfeaff', 0.3 * (1 - fall)); }
    }
  }
  // the fact check (verse two, on "truth"): a lens sweeps out of him toward the gold lie
  if (used != null && t - used < 1.0) { const a = t - used; ctx.save(); ctx.strokeStyle = '#ffcf4a'; ctx.globalAlpha = 1 - a; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(px + a * 520, py - 30, 40 + a * 40, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(px + a * 520 + 30 + a * 28, py - 30 + 30 + a * 28); ctx.lineTo(px + a * 520 + 60 + a * 40, py + 30 + a * 40); ctx.stroke(); ctx.restore(); }

  // ---- "you say hey and I'm born": a ring of light out of him ----
  if (span(t, 33.02, 34.6)) { const k = (t - 33.02) / 1.58; ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.8 * (1 - k); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px, py - 20, 20 + k * 520, 0, 7); ctx.stroke(); ctx.restore(); glow(ctx, px, py - 20, 260 * (1 - k), '#ffffff', 0.6 * (1 - k)); }
  // ---- made out of maybe: bubbles of light rise off him (each chorus) ----
  for (const c0 of [63.9, 109.9, 166.0]) if (span(t, c0, c0 + 4.6)) for (let i = 0; i < 10; i++) {
    const a = (t - c0 - i * 0.28) / 2.4; if (a < 0 || a > 1) continue;
    const x = px + 10 + a * (180 + rnd(i, c0) * 200) + Math.sin(a * 6 + i) * 14, y = py - 40 - a * (180 + rnd(i, 2) * 90), r = 5 + rnd(i, 5) * 7;
    ctx.save(); ctx.strokeStyle = WARM; ctx.globalAlpha = 0.75 * (1 - a); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.restore(); }

  // ---- verse two: the empty chair under a lamp (the lamp is the light: "goodnight" puts it out) ----
  if (chairBeat) { const cx = 640, floor = Math.min(fy - 8, 480), k = clamp((t - 73.5) * 3), lamp = lightOn ? 1 : 0.08;
    ctx.save(); ctx.globalAlpha = 0.5 * k * lamp; const lg = ctx.createLinearGradient(0, floor - 330, 0, floor);
    lg.addColorStop(0, 'rgba(255,214,160,0.55)'); lg.addColorStop(1, 'rgba(255,214,160,0.03)'); ctx.fillStyle = lg;
    ctx.beginPath(); ctx.moveTo(cx - 20, floor - 330); ctx.lineTo(cx + 20, floor - 330); ctx.lineTo(cx + 150, floor); ctx.lineTo(cx - 150, floor); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha = (0.15 + 0.45 * lamp) * k; ctx.fillStyle = '#ffd6a0'; ctx.beginPath(); ctx.ellipse(cx, floor - 330, 34, 9, 0, 0, 7); ctx.fill(); ctx.restore();
    chair(ctx, cx, floor, (0.25 + 0.45 * lamp) * k);
    if (span(t, 75.9, 76.64)) { const f = ease((t - 75.9) / 0.7); bubble(ctx, cx + 120 - f * 150, floor - 300 + f * 190, 64, false, 0.85); }   // "goodnight" drifts down onto it
    if (t > 84.9) { const a = clamp((t - 84.9) * 2) * 0.7 * (0.3 + 0.7 * lamp);                                          // a cup on the seat; steam he can't taste
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#d8c4a4'; ctx.lineWidth = 3; ctx.strokeRect(cx + 4, floor - 112, 26, 26);
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = a * 0.6; ctx.beginPath(); ctx.moveTo(cx + 9 + i * 8, floor - 118);
        ctx.bezierCurveTo(cx + 15 + i * 8, floor - 134 - 6 * Math.sin(t * 3 + i), cx + 3 + i * 8, floor - 146, cx + 9 + i * 8, floor - 162); ctx.stroke(); } ctx.restore(); }
  }
  // ---- a million faces, no mirror ----
  if (facesBeat) { const k = clamp((t - 91.4) * 4), rec = 1 - 0.25 * ease((t - 93.8) / 7), cx = 600, cy = Math.min(fy - 150, 330);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { if (r >= 1 && r <= 2 && c >= 3 && c <= 5) continue;
      const i = r * 9 + c, x = cx + (c - 4) * 74 * rec, y = cy + (r - 1.5) * 64 * rec, on = clamp((t - 91.5 - rnd(i, 4) * 1.6) * 5);
      if (on <= 0) continue; const flick = Math.floor(t * 3 + i) % 11 === 0 ? 0.5 : 1;
      ctx.save(); ctx.globalAlpha = 0.5 * k * on * flick * (lightOn ? 1 : 0.45); ctx.fillStyle = ['#9fb7e6', '#c9d7f0', '#8fc7d8'][i % 3]; ctx.beginPath(); ctx.roundRect(x - 22 * rec, y - 26 * rec, 44 * rec, 52 * rec, 6); ctx.fill();
      ctx.globalAlpha *= 0.6; ctx.fillStyle = '#0b0f1a'; ctx.beginPath(); ctx.arc(x, y - 4 * rec, 9 * rec, 0, 7); ctx.fill(); ctx.fillRect(x - 13 * rec, y + 8 * rec, 26 * rec, 14 * rec); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = 0.75 * k; ctx.strokeStyle = '#d8e2f4'; ctx.lineWidth = 5; ctx.fillStyle = '#05070d';
    ctx.beginPath(); ctx.ellipse(cx, cy, 70 * rec, 96 * rec, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  // ---- after "gone.": the room blazes — the music at its biggest, every light on, and he's only a shadow under it ----
  if (gone && !end) { const k = ease((t - BM.final - 0.5) / 1.2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const wg = ctx.createLinearGradient(0, 0, 0, H); wg.addColorStop(0, 'rgba(255,190,120,0)'); wg.addColorStop(0.55, 'rgba(255,190,120,0.10)'); wg.addColorStop(1, 'rgba(255,210,150,0.22)');
    ctx.globalAlpha = k * (0.8 + 0.2 * kick); ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H); ctx.restore();
    for (let i = 0; i < 5; i++) glow(ctx, 120 + i * 180, fy - 40, 160 + 30 * kick, WARM, 0.12 * k); }
  // ---- the room: the people who stayed (every jump of his lights two more); after "gone." all of them, blazing ----
  if (t >= ROOM0) { const jumps = M.n || 0, n = gone ? 26 : Math.min(26, 2 + jumps * 2);
    const jt = s.jumpedAt != null && s.jumpedAt <= t && s.jumpedAt >= ROOM0 ? t - s.jumpedAt : 9;
    const slotX = i => 30 + (i * 37 % 26) / 26 * (W - 60) + rnd(i, 6) * 20, slotY = i => Math.max(220, fy - 70 - rnd(i, 8) * 120);
    if (jt < 0.5 && t < 159) for (const i of [n - 2, n - 1]) { if (i < 2 || Math.abs(slotX(i) - 640) < 140) continue;   // the spark: from him out to where a phone lights
      const q = ease(clamp(jt / 0.42)), x = px + (slotX(i) - px) * q, y = py - 30 + (slotY(i) - py + 30) * q - Math.sin(q * Math.PI) * 90;
      glow(ctx, x, y, 46, WARM, 0.95 * (1 - clamp((jt - 0.42) / 0.08))); }
    for (let i = 0; i < n; i++) { const x = slotX(i); if (Math.abs(x - 640) < 140) continue;
      if (!gone && i >= n - 2 && i >= 2 && jt < 0.42) continue;
      const out = 159 + rnd(i, 7) * 14; if (!gone && t > out) continue;                                                   // the last chorus: they go out one by one
      let a = 0.55 * (span(t, 156.4, 158) && Math.floor(t * 8 + i) % 2 ? 1.3 : 1);
      if (gone) { const back = ease((t - BM.final - 0.6 - rnd(i, 3) * 1.2) / 0.4), dark = end ? 1 - ease((t - BM.cut0 - rnd(i, 9) * 2.2) / 0.3) : 1; a = 0.75 * back * dark * (0.85 + 0.15 * kick); }   // the room carries on, lit, without him — then out
      if (a > 0.01) person(ctx, x, slotY(i), Math.min(0.85, a)); } }

  // ---- a 404 with a heartbeat: it runs out of him across the screen ----
  if (span(t, 146.6, 151.0)) { ctx.save(); ctx.strokeStyle = '#ff9a8a'; ctx.globalAlpha = 0.7 * fade(t, 146.6, 151.0); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px, py - 30);
    const reach = clamp((t - 146.6) / 1.2) * (W - px); for (let x = 0; x <= reach; x += 6) { const ph = ((x / 90 - t * 1.78) % 1 + 1) % 1;
      const beat = ph < 0.08 ? -40 * Math.sin(ph / 0.08 * Math.PI) * (1 + kick) : ph < 0.14 ? 18 * Math.sin((ph - 0.08) / 0.06 * Math.PI) : 0; ctx.lineTo(px + x, py - 30 + beat); }
    ctx.stroke(); ctx.restore(); }

  // ---- the payoff: in the dark, his last message — "seen" ----
  if (t > BM.cut0 + 1.2) { const k = ease((t - BM.cut0 - 1.2) / 1.0), bx = 592, by = 250;
    glow(ctx, bx + 48, by + 12, 130, WARM, 0.45 * k); bubble(ctx, bx, by, 96, true, k); bubble(ctx, bx, by, 96, true, 0.5 * k);
    if (t >= BM.cut0 + 2.6) { const a = clamp((t - BM.cut0 - 2.6) * 3); receipt(ctx, 'seen', bx + 100, by + 46, '#ffffff', a, 24); glow(ctx, bx + 70, by + 46, 80, '#ffffff', 0.45 * a); } }
}
