// CIRCUIT CYBORG, v2 (Matt: "the cyborg you are using, can you change to something similar … make him look like a borg";
// v1, the silver temple band, is kept in circuit-cyborg.v1-band.mjs). Assimilated: dark gunmetal implants plated over the
// right side of his head (screen left at the front) with seams, rivets and little green status lights; black tubes running
// from the head plate down into his body; a mechanical eyepiece at his right eye with a red lens and a thin red laser;
// ribbed black exo-armour on his body with a tube looping across the chest. No purple (that's his glitch's colour).
import { painter, fu, W, INKU, INK, RM, clamp } from '../outfits3d.mjs';

const BLACK = '#17181c', GUN = '#2c2f36', PLATE = '#4a4f59', EDGE = '#6b717d', RED = '#ff2a2a', REDD = '#7a0a0a', GREEN = '#57ff7a';

export default function build(H) {
  const P = painter(), { x } = P, T = H.T;
  const A = th => th * RM;
  const kr = v => { v = clamp(v, 0.05, 0.97); return RM / ((H.rx(v) + H.rz(v)) / 2); };
  const tube = (pts, w = 0.024) => { x.beginPath(); pts.forEach(([a, v], i) => x[i ? 'lineTo' : 'moveTo'](A(a), v)); x.lineCap = 'round'; x.lineJoin = 'round';
    x.lineWidth = w + INKU * 0.9; x.strokeStyle = INK; x.stroke(); x.lineWidth = w; x.strokeStyle = BLACK; x.stroke();
    x.lineWidth = w * 0.28; x.strokeStyle = 'rgba(255,255,255,0.22)'; x.stroke(); };
  const light = (a, v, r, c) => { const R = r * W; x.beginPath(); x.ellipse(A(a), v, R * kr(v), R, 0, 0, 7); x.fillStyle = c; x.fill(); x.lineWidth = INKU * 0.4; x.strokeStyle = INK; x.stroke(); };

  // ---- the exo-armour on his body ----
  const neck = th => 0.6 + 0.12 * fu(th, 0.7), rim = th => neck(th) + 0.03;
  P.shadow(neck);
  P.region(() => P.below(neck), GUN, () => {
    P.band(neck, rim); P.fill(PLATE); P.ink(0.5);                                                      // collar plate
    for (let v = 0.76; v < 1.02; v += 0.05) { P.band(() => v, () => v + 0.016); P.fill(BLACK); }         // ribs
    P.strip(-1.0, 0.5, rim, () => 0.86); P.fill(PLATE); P.ink(0.6);                                    // a shoulder plate on his right side only (asymmetric)
    for (const a of [-1.3, -1.0, -0.7]) light(a, 0.8, 0.012, EDGE);                                    // its rivets
    P.strip(Math.PI, 0.22, rim, () => 1.05); P.fill(PLATE); P.ink(0.6);                                // the spine plate
    tube([[-0.9, 0.7], [-0.45, 0.78], [-0.05, 0.83], [0.4, 0.8], [0.75, 0.74]], 0.026);                 // a tube looping across his chest
    light(0.55, 0.88, 0.018, GREEN); light(0.66, 0.88, 0.012, GREEN); light(0.75, 0.88, 0.012, RED);    // status lights
  });
  P.wrap(() => { P.line(neck); P.ink(1); });

  // ---- the head implants: plated over the right side of his head (th < 0), clear of his eyes ----
  const pTop = th => 0.03 + 0.04 * Math.abs(Math.sin(th * 1.3)), pBot = th => 0.24 + 0.04 * Math.sin(th * 2.2) + 0.03 * clamp((-th - 1.0) / 0.8);   // (stops above his eyes)
  const P0 = -2.4, P1 = -0.35, inPlate = (t, th) => th > P0 && th < P1 && t >= pTop(th) && t <= pBot(th);
  P.region(() => P.band(pTop, pBot, P0, P1), PLATE, () => {
    for (const a of [-2.0, -1.6, -1.2, -0.8]) { x.beginPath(); x.moveTo(A(a), pTop(a)); x.lineTo(A(a + 0.08), pBot(a)); P.ink(0.45); }   // seams
    P.band(pTop, th => pTop(th) + 0.015, P0, P1); P.fill('rgba(255,255,255,0.25)');                 // a cold shine on the top edge
    for (const a of [-2.15, -1.8, -1.4, -1.0, -0.6]) light(a, pBot(a) - 0.02, 0.009, EDGE);                     // rivets along the bottom edge
    light(-1.55, 0.17, 0.014, GREEN); light(-1.45, 0.2, 0.01, RED);                                      // status lights
  });
  P.wrap(() => { P.band(pTop, pBot, P0, P1); P.ink(1); });
  tube([[-1.9, pBot(-1.9) - 0.01], [-1.95, 0.4], [-1.75, 0.55], [-1.6, neck(-1.6) + 0.03]], 0.024);        // tubes from the head plate down into the armour
  tube([[-1.3, pBot(-1.3) - 0.01], [-1.4, 0.42], [-1.25, 0.6], [-1.15, neck(-1.15) + 0.03]], 0.018);

  // ---- the eyepiece: a mechanical ring at his right eye (screen left), a red lens, a thin red laser ----
  const EA = -0.62, ET = 0.37, R = 0.085 * W;
  const eye = new T.Group();
  const cyl = (r, h, k = 1) => { const g = new T.CylinderGeometry(r * k, r, h, 32); g.rotateX(Math.PI / 2); g.translate(0, 0, h / 2); return g; };
  const housing = H.outlined(cyl(R, 0.04, 0.85), H.paint(GUN), 0.8);
  const ring = H.outlined(cyl(R * 0.62, 0.05), H.paint(BLACK), 0.5);
  const lensG = new T.SphereGeometry(R * 0.4, 20, 12); lensG.scale(1, 1, 0.5); lensG.translate(0, 0, 0.05);
  const lens = new T.Mesh(lensG, new T.MeshBasicMaterial({ color: RED }));
  const hiG = new T.SphereGeometry(R * 0.12, 10, 8); hiG.scale(1, 0.8, 0.5); hiG.translate(-R * 0.13, R * 0.13, 0.05 + R * 0.2);
  const hi = new T.Mesh(hiG, new T.MeshBasicMaterial({ color: '#ffd0d0' }));
  const beamG = new T.CylinderGeometry(0.006, 0.006, 0.07, 8); beamG.rotateX(Math.PI / 2); beamG.translate(0, 0, 0.075);   // (a short red glint, not an antenna — Matt: "the antenna just looks weird, or shorten it")
  const beam = new T.Mesh(beamG, new T.MeshBasicMaterial({ color: RED }));                         // the laser
  const armG = new T.CylinderGeometry(R * 0.16, R * 0.16, R * 1.7, 10); armG.rotateZ(Math.PI / 2); armG.translate(-R * 1.15, R * 0.3, 0.02);
  const arm = H.outlined(armG, H.paint(PLATE), 0.6);                                                   // the arm back to his temple
  eye.add(arm, housing, ring, lens, hi, beam);

  const Z = new T.Vector3(0, 0, 1), PUFF = 0.022;
  const col = th => Math.round((th + Math.PI) / (2 * Math.PI) * H.COLS);
  return { canvas: P.c, parts: [eye],
    puff: (t, th) => inPlate(t, th) ? PUFF : t >= neck(th) ? 0.018 : 0,
    update() {
      const k = col(EA), a = H.ring(ET), up = H.ring(ET - 0.03), dn = H.ring(ET + 0.03);
      const p = a.pts[k], tv = up.pts[k].clone().sub(dn.pts[k]), th = a.pts[k + 1].clone().sub(a.pts[k - 1]);
      const n = th.clone().cross(tv).normalize(); if (n.dot(p.clone().sub(a.c)) < 0) n.negate();
      eye.position.copy(p).addScaledVector(n, 0.012); eye.quaternion.setFromUnitVectors(Z, n);
    } };
}
