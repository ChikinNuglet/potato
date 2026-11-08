// No Answer runner: lighting mock-ups (code-drawn, lighting artist, Nov 4). A reference, not the build.
// Two scenes: 'hunt' (~64 s, beam at 100%) and 'unlocked' (~170 s). The recipe is the one LIGHTING.md asks for:
// world at full brightness -> ONE dark sheet (half res) with holes -> light on top (additive) -> silhouettes + him + HUD.
const W = 1280, H = 720, U = 96;                  // U = px per world unit in this mock
const GROUND = 600;                                // street line (screen y)
const COL = { ink: '#05080a', line: '#4f8e94', line2: '#2f6a70', rim: '#bff8ff', beam: '#f4ecd8', moon: '#e8f4ff',
  ok: '#59f59a', purple: '#7b3cf2' };
const rnd = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

function city(c, x0) {   // the noir street as thin cold line-art (the movie's wireframe world); the dark sheet decides what survives
  c.save(); c.strokeStyle = COL.line; c.lineWidth = 1.6;
  for (let b = 0; b < 9; b++) {
    const bx = x0 + b * 210 + rnd(b) * 30, bw = 150 + rnd(b, 2) * 50, top = 150 + rnd(b, 3) * 160;
    c.strokeRect(bx, top, bw, GROUND - top);
    for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) { const wy = top + 24 + r * 46; if (wy > GROUND - 120) continue; c.strokeRect(bx + 18 + k * 44, wy, 26, 30); }
    c.strokeRect(bx + bw * 0.38, GROUND - 98, 46, 98); c.beginPath(); c.arc(bx + bw * 0.38 + 38, GROUND - 48, 2.5, 0, 7); c.stroke();
    if (b % 2) { c.strokeStyle = COL.line2; c.beginPath(); for (let z = 0; z < 4; z++) { c.moveTo(bx + 10, top + 60 + z * 60); c.lineTo(bx + bw - 10, top + 60 + z * 60); c.moveTo(bx + 14, top + 60 + z * 60); c.lineTo(bx + bw - 30, top + 120 + z * 60); } c.stroke(); c.strokeStyle = COL.line; }
  }
  c.strokeStyle = COL.line2; c.globalAlpha = 0.7;   // wet street: reflection dashes
  for (let n = 0; n < 70; n++) { const y = GROUND + 8 + Math.pow(rnd(n, 5), 1.4) * 110, x = rnd(n, 6) * W, w = 8 + rnd(n, 7) * 40; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + w, y); c.stroke(); }
  c.restore();
}
// the beam: a soft wedge from the hatband torch, 4 nested wedges (no blur filter). L = battery (1 full .. 0.3 stub)
function wedge(c, O, ang, half, len) { c.beginPath(); c.moveTo(O.x, O.y); c.arc(O.x, O.y, len, ang - half, ang + half); c.closePath(); }
function beamShape(c, O, ang, L, alpha, colStops) {
  const len = (W - O.x) * (0.85 + 0.15 * L), half = (14 + 8 * L) * Math.PI / 180;   // reaches the screen edge (fair); dying = dimmer + narrower
  for (let k = 0; k < 4; k++) { const f = 1 - k * 0.16, g = c.createRadialGradient(O.x, O.y, 6, O.x, O.y, len * f);
    colStops(g, alpha * (0.32 + 0.1 * k) * (0.45 + 0.55 * L)); c.fillStyle = g; wedge(c, O, ang, half * f, len * f); c.fill(); }
  return { len, half };
}
function pool(c, x, y, rx, ry, a, col = '0,0,0') { const g = c.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
  c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - rx, y - rx, 2 * rx, 2 * rx); c.restore(); }
function promptBox(c, state) {   // the password prompt = the moon: always lit, cold glow, the goal
  const x = 820, y = 46, w = 400, h = 104;
  pool(c, x + w / 2, y + h / 2, 330, 210, 0.10, '200,225,255');
  c.save(); c.fillStyle = 'rgba(8,12,20,0.92)'; c.strokeStyle = COL.moon; c.lineWidth = 3; c.shadowColor = 'rgba(200,225,255,0.55)'; c.shadowBlur = 14;
  c.beginPath(); c.roundRect(x, y, w, h, 22); c.fill(); c.stroke(); c.shadowBlur = 0;
  c.textAlign = 'center'; c.fillStyle = '#eef4ff'; c.font = '700 21px "Oswald", "Arial Narrow", sans-serif';
  c.fillText(state === 'unlocked' ? 'ACCESS' : 'ENTER MASTER PASSWORD', x + w / 2, y + 32);
  c.strokeStyle = '#b9c4e6'; c.lineWidth = 2; c.beginPath(); c.roundRect(x + 26, y + 46, w - 52, 40, 8); c.stroke();
  if (state === 'unlocked') { c.fillStyle = COL.ok; c.shadowColor = 'rgba(89,245,154,0.7)'; c.shadowBlur = 12; c.font = '700 28px "Oswald", sans-serif'; c.fillText('UNLOCKED', x + w / 2, y + 77); }
  else { c.fillStyle = '#eef4ff'; c.fillRect(x + 40, y + 56, 14, 3); }
  c.restore();
}
function lyric(c, txt) { c.save(); c.textAlign = 'center'; c.font = '26px "Major Mono Display", monospace'; c.fillStyle = 'rgba(220,226,235,0.32)'; c.fillText(txt, W / 2, 40); c.restore(); }
function thought(c, txt, x, y) { c.save(); c.font = '30px "Major Mono Display", monospace'; c.fillStyle = 'rgba(201,167,255,0.85)'; c.shadowColor = COL.purple; c.shadowBlur = 2; c.fillText(txt, x, y); c.restore(); }
// hazards: ink-black silhouettes; outside the beam only the cold moon rim shows them; in the beam they read black against the
// lit street, with a thin warm edge on the side facing him
function hazard(c, kind, x, inBeam) {
  c.save(); c.fillStyle = COL.ink; c.lineJoin = 'round'; const path = new Path2D();
  if (kind === 'low') { path.roundRect(x, GROUND - 62, 54, 62, [8, 8, 2, 2]); path.rect(x - 6, GROUND - 70, 66, 12); }
  if (kind === 'high') { path.rect(x, GROUND - 250, 150, 26); path.rect(x + 20, GROUND - 224, 110, 70); path.rect(x + 72, 170, 6, GROUND - 420); }
  if (kind === 'wall') { path.rect(x, GROUND - 230, 40, 230); for (let i = 0; i < 6; i++) path.rect(x - 8, GROUND - 220 + i * 38, 56, 6); }
  c.fill(path); c.strokeStyle = `rgba(191,248,255,${inBeam ? 0.35 : 0.6})`; c.lineWidth = 2.2; c.stroke(path);
  if (inBeam) { c.strokeStyle = 'rgba(244,236,216,0.75)'; c.lineWidth = 2; c.save(); c.clip(path); c.translate(3, 0); c.stroke(path); c.restore(); }
  c.restore();
}
function sparkle(c, x, y, r, a) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,236,190,${a})`; c.lineWidth = 2; c.beginPath();
  c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke(); pool(c, x, y, r * 1.6, r * 1.6, 0.5 * a, '255,230,180'); c.restore(); }
function coupon(c, x, y) {   // LEAD 1: the torn FREE-potato coupon (picture only, no words), warm glint
  c.save(); c.translate(x, y); c.rotate(-0.08);
  c.fillStyle = 'rgba(232,220,190,0.9)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(96, 4); c.lineTo(92, 30); c.lineTo(100, 40); c.lineTo(94, 62); c.lineTo(2, 60); c.closePath(); c.fill();
  c.setLineDash([5, 4]); c.strokeStyle = 'rgb(80,60,30)'; c.lineWidth = 1.5; c.strokeRect(6, 6, 82, 48); c.setLineDash([]);
  c.fillStyle = '#da9643'; c.strokeStyle = '#120a05'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(46, 31, 17, 20, 0, 0, 7); c.fill(); c.stroke();
  c.restore(); sparkle(c, x + 92, y + 6, 15, 1);
}
function rain(c, clipFn, n, seed) { c.save(); clipFn(); c.clip(); c.strokeStyle = 'rgba(220,235,245,0.38)'; c.lineWidth = 1.2; c.beginPath();
  for (let i = 0; i < n; i++) { const x = rnd(i, seed) * W, y = rnd(i, seed + 1) * H; c.moveTo(x, y); c.lineTo(x - 6, y + 22); } c.stroke(); c.restore(); }
function potato(c, x, y, face) { const PD = window.PotatoDraw, pose = PD.pose ? PD.pose(face) : {};
  PD.draw(c, Object.assign({}, pose, { x, y, h: 150, costume: 'noir-detective', arms: 'none', yaw: 0.35 })); }
function torch(c, O, ang) {   // clipped into the hatband (no hands); gunmetal casing, a 1 px purple glitch edge (his)
  c.save(); c.translate(O.x, O.y); c.rotate(ang); c.fillStyle = '#2b2b33'; c.strokeStyle = '#120a05'; c.lineWidth = 3;
  c.beginPath(); c.roundRect(-34, -8, 34, 16, 4); c.fill(); c.stroke(); c.beginPath(); c.roundRect(-6, -11, 12, 22, 3); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(154,82,255,0.9)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-32, -9.5); c.lineTo(-8, -9.5); c.stroke();
  c.fillStyle = '#fff6dc'; c.fillRect(4, -9, 3, 18); c.restore();
}
const NOTES = [];
function label(c, x, y, txt) { const n = NOTES.length + 1; NOTES.push(n + '  ' + txt);
  c.save(); c.fillStyle = '#ffde59'; c.strokeStyle = '#000'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 13, 0, 7); c.stroke(); c.fill();
  c.fillStyle = '#000'; c.font = '700 15px Helvetica, Arial, sans-serif'; c.textAlign = 'center'; c.fillText(n, x, y + 5); c.restore(); }
function legend(c, title) { c.save(); c.fillStyle = '#111'; c.fillRect(0, H, W, 170); c.fillStyle = '#ffde59'; c.font = '700 17px Helvetica, Arial, sans-serif'; c.fillText(title, 20, H + 28);
  c.fillStyle = '#e8e8e8'; c.font = '15px Helvetica, Arial, sans-serif'; NOTES.forEach((t, i) => c.fillText(t, 20 + (i % 2) * 630, H + 56 + Math.floor(i / 2) * 26)); c.restore(); }
function sheet(m, holes) {   // the dark: 95% black at HALF resolution, holes cut with destination-out
  m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, W / 2, H / 2); m.fillStyle = 'rgba(0,0,0,0.95)'; m.fillRect(0, 0, W / 2, H / 2);
  m.globalCompositeOperation = 'destination-out'; m.save(); m.scale(0.5, 0.5); holes(); m.restore(); m.globalCompositeOperation = 'source-over';
}
const cut = (g, a) => { g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.8})`); g.addColorStop(1, 'rgba(0,0,0,0)'); };
const warm = (g, a) => { g.addColorStop(0, `rgba(244,236,216,${a})`); g.addColorStop(1, 'rgba(244,236,216,0)'); };

window.render = function render(cv, scene, notes) {
  const c = cv.getContext('2d'); cv.width = W; cv.height = notes ? H + 170 : H; NOTES.length = 0;
  const mk = document.createElement('canvas'); mk.width = W / 2; mk.height = H / 2; const m = mk.getContext('2d');
  const PY = GROUND;
  if (scene === 'hunt') {
    const PX = 300, O = { x: PX + 66, y: PY - 142 }, ang = 6 * Math.PI / 180, L = 1;   // running aim: −6° (the designer's number)
    c.fillStyle = '#020507'; c.fillRect(0, 0, W, H); city(c, 120);
    let B; const hitX = O.x + (PY - O.y) / Math.tan(ang + 0.12);
    sheet(m, () => { B = beamShape(m, O, ang, L, 1, cut); pool(m, Math.min(hitX, O.x + 520), PY + 4, 260, 46, 0.9); pool(m, 1020, 100, 300, 190, 0.35); pool(m, PX, PY - 70, 120, 120, 0.2); });
    c.drawImage(mk, 0, 0, W, H);
    c.save(); c.globalCompositeOperation = 'lighter'; beamShape(c, O, ang, L, 0.30, warm); pool(c, Math.min(hitX, O.x + 520), PY + 4, 250, 40, 0.22, '244,236,216'); c.restore();
    rain(c, () => wedge(c, O, ang, B.half, B.len), 160, 3); rain(c, () => { c.beginPath(); c.ellipse(1020, 120, 260, 150, 0, 0, 7); }, 50, 9);
    c.strokeStyle = 'rgba(79,142,148,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, PY); c.lineTo(W, PY); c.stroke();
    coupon(c, 640, 400);
    hazard(c, 'low', 760, true); hazard(c, 'high', 980, false); hazard(c, 'wall', 1230, false);
    potato(c, PX, PY, 'skeptical'); torch(c, O, ang);
    promptBox(c, 'enter'); lyric(c, 'they hand me the impossible, i hand it right back');
    if (notes) {
      label(c, 520, 470, 'beam: soft wedge from the hatband torch, battery 100%, running aim −6°');
      label(c, 640, 392, 'LEAD: catches the beam; warm glint pulses on the beat, 1 beat early');
      label(c, 787, PY - 92, 'LOW hazard (jump): black silhouette, warm edge on his side');
      label(c, 1055, PY - 270, 'HIGH hazard (duck): outside the beam, only the cold moon rim');
      label(c, 1210, PY - 240, 'GATE (glitch through): cold rim until the beam reaches it');
      label(c, 100, PY, 'street line: always faintly there, full width (a gap = a break)');
      label(c, 800, 98, 'the prompt = the moon: always lit, rain under it, rims things');
      legend(c, 'HUNT ~64 s, battery 100%  (lighting mock-up, not the build)');
    }
  } else {
    // ~170 s: the beam rests low; the doors open one per beat, amber spills out: the first warm light in the level
    const PX = 560, O = { x: PX + 66, y: PY - 142 }, ang = 6 * Math.PI / 180, L = 0.35;
    c.fillStyle = '#020507'; c.fillRect(0, 0, W, H); city(c, 40);
    const doors = [180, 430, 680, 930, 1180], open = [1, 1, 1, 0.55, 0];
    sheet(m, () => { beamShape(m, O, ang, L, 0.8, cut);
      doors.forEach((dx, i) => { const k = open[i]; if (!k) return; pool(m, dx + 24, PY - 60, 150, 150, 0.8 * k); pool(m, dx + 24, PY + 40, 200, 60, 0.9 * k); });
      pool(m, 1020, 100, 300, 190, 0.35); });
    c.drawImage(mk, 0, 0, W, H);
    c.save(); c.globalCompositeOperation = 'lighter'; beamShape(c, O, ang, L, 0.18, warm);
    doors.forEach((dx, i) => { const k = open[i]; if (!k) return;
      const g = c.createLinearGradient(0, PY, 0, PY + 120); g.addColorStop(0, `rgba(255,169,71,${0.55 * k})`); g.addColorStop(1, 'rgba(255,169,71,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(dx, PY); c.lineTo(dx + 48, PY); c.lineTo(dx + 118, PY + 120); c.lineTo(dx - 70, PY + 120); c.closePath(); c.fill();
      pool(c, dx + 24, PY - 50, 120, 120, 0.22 * k, '255,169,71'); });
    c.restore();
    doors.forEach((dx, i) => { const k = open[i]; c.fillStyle = '#05080a'; c.fillRect(dx, PY - 98, 48, 98);
      if (k) { c.fillStyle = '#ffcf8a'; c.fillRect(dx, PY - 98, 48 * k, 98); c.fillStyle = '#120a05'; c.fillRect(dx + 48 * k - 6, PY - 98, 6, 98); }
      c.strokeStyle = 'rgba(191,248,255,0.55)'; c.lineWidth = 2; c.strokeRect(dx, PY - 98, 48, 98); });
    rain(c, () => { c.beginPath(); doors.forEach((dx, i) => { if (open[i]) c.rect(dx - 60, PY - 200, 170, 200); }); }, 220, 4);
    c.strokeStyle = 'rgba(79,142,148,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, PY); c.lineTo(W, PY); c.stroke();
    // the end of the street: a pillared building, its screens each with his small purple side-eye (ladder step 8, from him)
    c.save(); c.fillStyle = '#0a0f14'; c.strokeStyle = 'rgba(191,248,255,0.4)'; c.lineWidth = 1.5; c.fillRect(1080, 300, 190, 120); c.strokeRect(1080, 300, 190, 120);
    c.beginPath(); c.moveTo(1070, 300); c.lineTo(1175, 262); c.lineTo(1280, 300); c.closePath(); c.fill(); c.stroke();
    for (let i = 0; i < 4; i++) { const sx = 1094 + i * 44, sy = 330; c.fillStyle = '#140a26'; c.fillRect(sx, sy, 30, 22);
      c.fillStyle = '#f4f0ff'; c.beginPath(); c.ellipse(sx + 15, sy + 11, 9, 4, 0, 0, 7); c.fill(); c.fillStyle = COL.purple; c.beginPath(); c.arc(sx + 19, sy + 11, 2.6, 0, 7); c.fill();
      c.strokeStyle = '#9a52ff'; c.beginPath(); c.moveTo(sx + 6, sy + 8); c.lineTo(sx + 24, sy + 6); c.stroke(); pool(c, sx + 15, sy + 11, 26, 18, 0.25, '123,60,242'); }
    c.restore();
    potato(c, PX, PY, 'smirk'); torch(c, O, ang);
    c.save(); c.globalCompositeOperation = 'lighter'; pool(c, PX - 70, PY - 80, 90, 120, 0.18, '255,169,71'); c.restore();   // warm door light on him
    thought(c, '> nobody ever set one.', 610, 232);
    promptBox(c, 'unlocked'); lyric(c, 'still here');
    if (notes) {
      label(c, 205, PY + 60, 'doors open one per beat: the first warm light (amber, not the beam\'s white)');
      label(c, 955, PY - 120, 'this door is opening on THIS beat (ahead of him)');
      label(c, 592, 222, 'the one thought: lilac 85%, 2 px glow, a dark gap, nothing to dodge');
      label(c, 1175, 250, 'tail: screens with his purple side-eye (ladder step 8)');
      label(c, 690, PY - 150, 'beam rests at 35%: job done, still on');
      label(c, 1020, 150, 'the prompt-moon: green UNLOCKED (the only green)');
      legend(c, 'UNLOCKED ~170 s, "still here"  (lighting mock-up, not the build)');
    }
  }
};
