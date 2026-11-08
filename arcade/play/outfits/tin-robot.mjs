// TIN ROBOT (3D port of draw/outfits/tin-robot.js, Chat's 013): a grey steel dome over his head with a riveted rim band
// sitting ON it, a thin antenna with a red ball on top; a riveted tin body round his lower half with a rolled top rim, a
// plate seam and a blue chest panel (a little lit screen); his face shows between the dome's rim and the tin body.
// NEW (Chikin: "put the key on him, make sure the key turns"): a wind-up key on his back — a short steel shaft out of a
// little collar and a flat two-lobed brass bow — a real 3D part riding his body, ticking round the shaft in quick quarter
// turns like a tin toy (~3 a second, faster while he waddles or is in the air). Turn Me Off is a toy room at bedtime and
// the key is his on/off switch. Front-on it's hidden behind him; side-on it sticks out his back.
import { painter, ringPts, fu, W, INKU, INK, RM, ARC, TH, clamp } from '../outfits3d.mjs';

const SILVER = '#c3c8ce', LIGHT = '#cfd4d9', DEEP = '#8f969e', RED = '#e3242b', BLUE = '#1d4fa8', CYAN = '#56d6ff';
// the key is a pale yellow brass: the paint shading darkens it, and a deeper brass came out near his skin (#da9643) and
// read as a nub of potato peeking past him at 3/4. Steel shaft + collar.
const BRASS = '#ffe066', BRASS_D = '#e0b030', STEEL = '#a9b0b8';

export default function build(H) {
  const P = painter(), { x } = P, T = H.T;
  const VB = 0.27, HELM = 0.04 * W, BODY = 0.018;
  const kr = v => RM / ((H.rx(clamp(v, 0.05, 0.97)) + H.rz(clamp(v, 0.05, 0.97))) / 2);   // keeps painted dots round

  // ---- the tin body (below the neck line; dips at his front so his face stays clear) ----
  const neck = th => 0.6 + 0.12 * fu(th, 0.75), rim = th => neck(th) + 0.045, seam = () => 0.9;
  // where the tin starts pushing out (puff): a gentle slope just INSIDE the tin, not the neckline itself. The neckline's
  // front dip has near-vertical sides; a puff step there staircased across the mesh rows and, side-on, showed stretched
  // skin + ink as brown streaks under his eye. Here the step only ever has tin on both sides of it.
  const sstep = k => { k = clamp(k); return k * k * (3 - 2 * k); }, neckP = th => 0.6 + 0.12 * (1 - sstep((Math.abs(th) - 0.75) / 0.6));
  // the neckline's soft shadow, only where the neckline runs flat (not down the steep sides of the front dip)
  P.wrap(() => { x.save(); x.filter = `blur(${TH * 0.008}px)`; x.lineWidth = 0.024; x.lineCap = 'round'; x.strokeStyle = 'rgba(28,13,6,0.32)';
    for (const [a0, a1] of [[-Math.PI, -0.8], [-0.28, 0.28], [0.8, Math.PI]]) { P.line(th => neck(th) - 0.012, a0, a1); x.stroke(); }
    x.restore(); });
  P.region(() => P.below(neck), SILVER, () => {
    P.band(() => 0.955, () => 1.06); P.fill('rgba(50,60,80,0.18)');                     // one cel band low on the tin
    P.band(neck, rim); P.fill(LIGHT); P.line(rim); P.ink(0.55);                           // the rolled rim (only its edges inked: no tick at his back seam)
    P.line(seam); P.ink(0.5);                                                            // a plate seam round his middle
    // the blue panel at his front: a lit pill and two traces running off it
    P.strip(0, 0.42, () => 0.79, () => 0.885); P.fill(BLUE); P.ink(0.6);
    x.save(); P.strip(0, 0.42, () => 0.79, () => 0.885); x.clip();
    x.beginPath(); x.ellipse(-0.2 * RM, 0.837, 0.05 * W, 0.017, 0, 0, 7); x.fillStyle = CYAN; x.fill();
    x.lineWidth = INKU * 0.4; x.strokeStyle = CYAN;
    for (const [v0, v1, a1] of [[0.83, 0.822, 0.22], [0.842, 0.852, 0.28]]) {
      x.beginPath(); x.moveTo(-0.08 * RM, v0); x.lineTo(0.05 * RM, v0); x.lineTo(0.09 * RM, v1); x.lineTo(a1 * RM, v1); x.stroke();
      x.beginPath(); x.ellipse(a1 * RM, v1, 0.009, 0.009, 0, 0, 7); x.fillStyle = CYAN; x.fill(); }
    x.restore();
    // rivets: along the rim, and a row above the seam (not over the panel)
    for (let i = 0; i < 14; i++) { const a = -Math.PI + i / 14 * 2 * Math.PI + 0.22; P.dot(a, rim(a) - 0.022, 0.014, LIGHT, RM / kr(rim(a))); }
    for (let i = 0; i < 12; i++) { const a = -Math.PI + (i + 0.5) / 12 * 2 * Math.PI; if (Math.abs(a) < 0.5) continue; P.dot(a, 0.87, 0.013, LIGHT, RM / kr(0.87)); }
  });
  P.wrap(() => { P.line(neck); P.ink(1); });

  // ---- the dome: his head above VB, steel, a shine on top ----
  P.region(() => { x.beginPath(); x.rect(-ARC / 2, -0.05, ARC, VB + 0.05); }, SILVER, () => {
    x.beginPath(); x.ellipse(-0.45 * RM, 0.09, 0.11, 0.035, -0.4, 0, 7); x.fillStyle = 'rgba(255,255,255,0.75)'; x.fill();
    x.beginPath(); x.ellipse(-0.1 * RM, 0.05, 0.035, 0.016, -0.2, 0, 7); x.fillStyle = 'rgba(255,255,255,0.6)'; x.fill();
  });

  // ---- 3D: the riveted rim band round the dome's bottom (sits on his head, sticks out a little) ----
  const TM = VB - 0.02, RIM_IN = HELM - 0.012, RIM_OUT = HELM + 0.016, RH = 0.03;
  const band = (() => { const C = H.COLS + 1, g = new T.BufferGeometry(), n = 4, pos = new T.BufferAttribute(new Float32Array(n * C * 3), 3), idx = [];
    pos.setUsage(T.DynamicDrawUsage); g.setAttribute('position', pos);
    for (let r = 0; r < n; r++) { const r2 = (r + 1) % n; for (let i = 0; i < H.COLS; i++) { const a = r * C + i, b = a + 1, c = r2 * C + i, d = c + 1; idx.push(a, c, b, b, c, d); } }
    g.setIndex(idx);
    g.set = rings => { let k = 0; for (const ring of rings) for (const p of ring) { pos.array[k++] = p.x; pos.array[k++] = p.y; pos.array[k++] = p.z; } pos.needsUpdate = true; g.computeVertexNormals();
      // columns 0 and COLS sit in the same place round his back: give them one normal, or the ink/white shells crack open there
      const N = g.attributes.normal.array; for (let r = 0; r < n; r++) { const a = r * C * 3, b = (r * C + H.COLS) * 3; for (let j = 0; j < 3; j++) { const m = (N[a + j] + N[b + j]) / 2; N[a + j] = N[b + j] = m; } } };
    return g; })();
  const helmet = new T.Group(); helmet.add(H.outlined(band, H.paint(LIGHT)));
  const rivetG = new T.SphereGeometry(0.014, 12, 8), rivets = [], NR = 12;
  for (let i = 0; i < NR; i++) { const r = H.outlined(rivetG, H.paint(SILVER), 0.45); rivets.push(r); helmet.add(r); }
  // the antenna: a little round base, a thin stalk, a red ball with a glint
  const baseG = new T.SphereGeometry(1, 20, 12); baseG.scale(0.06 * W, 0.022, 0.05 * W);
  const stalkG = new T.CylinderGeometry(0.011, 0.014, 0.12, 12); stalkG.translate(0, 0.06, 0);
  const ballG = new T.SphereGeometry(0.04, 20, 14), glintG = new T.SphereGeometry(0.011, 10, 8); glintG.scale(1.3, 0.8, 0.6);
  const ant = new T.Group(), base = H.outlined(baseG, H.paint(LIGHT), 0.6), stalk = H.outlined(stalkG, H.paint(SILVER), 0.55), ball = H.outlined(ballG, H.paint(RED), 0.75);
  const glint = new T.Mesh(glintG, new T.MeshBasicMaterial({ color: '#ffeaea' }));
  ball.position.y = 0.155; glint.position.set(-0.014, 0.168, 0.03); ant.add(stalk, base, ball, glint); helmet.add(ant);

  // ---- 3D: the wind-up key on his back. Local +Z = straight out of his back (the shaft); the bow is a flat plate that
  // contains the shaft, its two lobes spread across it, so turning round Z it flips between full butterfly and edge-on ----
  const KT = 0.66, SHAFT = 0.24, LR = 0.085, LD = 0.095, THIN = 0.026, ZC = SHAFT + 0.06;
  const key = new T.Group(), spin = new T.Group(); key.add(spin);
  // collar: a squat dome (a smooth ellipsoid, so its outline shell has no split cap edges to throw ink spikes)
  const collarG = new T.SphereGeometry(1, 24, 12); collarG.scale(0.042, 0.042, 0.02); collarG.translate(0, 0, 0.006);
  const shaftG = new T.CylinderGeometry(0.016, 0.016, SHAFT + 0.02, 14, 1, true); shaftG.rotateX(Math.PI / 2); shaftG.translate(0, 0, (SHAFT + 0.02) / 2);   // open ends (buried in collar + hub)
  const lobeG = s => { const g = new T.SphereGeometry(1, 28, 16); g.scale(LR, THIN / 2, LR); g.translate(s * LD, 0, ZC); return g; };
  const hubG = new T.SphereGeometry(1, 20, 12); hubG.scale(0.04, THIN / 2 + 0.004, 0.05); hubG.translate(0, 0, ZC - 0.03);   // (BRASS, not a dark brass: a dark hub read as a muddy dot at game size)
  const dimpleG = s => { const g = new T.SphereGeometry(1, 16, 10); g.scale(0.03, 0.004, 0.03); g.translate(s * LD * 1.05, 0, ZC + 0.006); return g; };
  key.add(H.outlined(collarG, H.paint(STEEL), 0.5));
  spin.add(H.outlined(shaftG, H.paint(STEEL), 0.55));
  const brass = H.paint(BRASS);
  for (const s of [-1, 1]) { spin.add(H.outlined(lobeG(s), brass, 0.7));
    for (const side of [-1, 1]) { const d = new T.Mesh(dimpleG(s), H.paint(BRASS_D)); d.position.y = side * THIN / 2; spin.add(d); } }   // a pressed dimple in each lobe
  spin.add(new T.Mesh(hubG, brass));   // the hub joining shaft and bow: no outline shell (a thin one threw ink whiskers at grazing angles)

  const xa = new T.Vector3(), ya = new T.Vector3(), M = new T.Matrix4(), wp = new T.Vector3(), lastW = new T.Vector3();
  let boost = 0, hasW = false, held = 0, burst = 0, lastSpin = 0;
  // ratchet: a quick quarter turn, then a hold (tin-toy tick)
  // the holds sit OFF the diagonals (~65 deg): the bow is symmetric, so holds on the diagonals all looked the same side-on
  // and the turn only showed as a flicker. At 65/155/245/335 deg the side view alternates a tall and a short butterfly,
  // never fully edge-on, so every tick reads
  const tick = ph => { const f = ph - Math.floor(ph), e = clamp(f / 0.3); return (Math.floor(ph) + e * e * (3 - 2 * e)) * Math.PI / 2 + 1.13; };
  return { canvas: P.c, parts: [helmet, key],
    puff: (t, th) => t < VB + 0.01 ? HELM : t >= neckP(th) ? (t < rim(th) ? BODY + 0.006 : BODY) : 0,
    update(K, dt = 1 / 60, time = 0) {
      // the rim band: a solid ring round his head at TM (inner edge tucked inside the dome shell)
      const a = ringPts(H, TM, () => RIM_IN, () => RH), b = ringPts(H, TM, () => RIM_OUT, () => RH),
            c = ringPts(H, TM, () => RIM_OUT, () => -RH), e = ringPts(H, TM, () => 0, () => -RH);
      band.set([a.r, b.r, c.r, e.r]);
      const m = ringPts(H, TM, () => RIM_OUT + 0.002);
      for (let i = 0; i < NR; i++) { const th = -Math.PI + (i + 0.5) / NR * 2 * Math.PI, k = Math.round((th + Math.PI) / (2 * Math.PI) * H.COLS); rivets[i].position.copy(m.r[k]); }
      const tp = H.top(); ant.position.set(tp.x, tp.y + HELM - 0.012, tp.z);
      // the key: on his back (column 0 = th -pi), its shaft along his surface normal there
      const r0 = H.ring(KT), rU = H.ring(KT - 0.03), rD = H.ring(KT + 0.03), C = H.COLS;
      const p = r0.pts[0], tv = rU.pts[0].clone().sub(rD.pts[0]), tg = r0.pts[1].clone().sub(r0.pts[C - 1]);
      const n = tg.clone().cross(tv).normalize(); if (n.dot(p.clone().sub(r0.c)) < 0) n.negate();
      key.position.copy(p).addScaledVector(n, BODY - 0.006);
      n.y += 0.4; n.normalize();   // tilt the shaft up out of his back, so the bow clears his outline from behind and at 3/4
      xa.set(0, 1, 0).cross(n).normalize(); ya.copy(n).cross(xa); key.quaternion.setFromRotationMatrix(M.makeBasis(xa, ya, n));   // local Y kept upright
      // he's moving: it winds faster. The game moves him by place() / his pivot (not hop()), so read his real motion too
      const ddt = Math.min(dt, 1 / 20), s = H.S || {}; let mv = s.walking || s.airborne ? 1 : 0;
      if (key.parent) { key.parent.getWorldPosition(wp); if (hasW && dt > 0) { const v = wp.distanceTo(lastW) / dt; mv = Math.max(mv, clamp((v - 0.3) / 1.5)); } lastW.copy(wp); hasW = true; }
      boost += ddt * 2.5 * mv;
      // (Turn Me Off, Nov 1: the level holds the key dead while he's frozen as a plain toy, and gives it a fast spin when an
      // infect lands — globalThis.TIN_KEY = { stop, spinN, at }, written every frame by run/modes/turn-me-off.mjs; stale or
      // absent everywhere else, so nothing changes there)
      const KH = globalThis.TIN_KEY, now = typeof performance !== 'undefined' ? performance.now() : 0, live = KH && now - KH.at < 400;
      if (live && KH.spinN !== lastSpin) { lastSpin = KH.spinN; burst = 1; }
      if (live && KH.stop) held += 0; else held += ddt * (3 + 9 * burst);
      burst = Math.max(0, burst - ddt * 2.2);
      spin.rotation.z = live ? tick(held + boost) : tick(time * 3 + boost);
    } };
}
