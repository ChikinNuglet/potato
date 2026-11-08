// DEEP SEA DIVER (3D port of draw/outfits/deep-sea-diver.js): a big retro brass helmet over his head and shoulders
// with ONE large open face port (no glass: his face shows through, real depth as he turns), a light-brass riveted rim
// and a dark lining just inside it, a riveted plate on the back, two round side ports (solid 3D cylinders with grilles),
// a riveted collar, and a short dark-teal diving suit below. For the game it also wears a little brass helmet LAMP on
// top (its power is a lamp): `lamp` (the glowing lens) is returned so the game can brighten it.
import { painter, ringPts, W, INKU, INK, ARC, RM, clamp } from '../outfits3d.mjs';

const BRASS = '#d69a2b', BRASSL = '#efbe4e', BRASSD = '#a8701a', BRASSM = '#c48a24', TEAL = '#1f5c63', TEALD = '#17474d', TEALL = '#2a7880', LINING = '#3a220d', GRILLE = '#2a1a0c';
const SHELL = 0.075 * W;                      // the helmet stands well off his head
const COL0 = 0.745, COL1 = 0.815;             // the collar where helmet meets suit
const HEM = 0.93;                             // darker band at the suit's bottom
// the face port: an ellipse on his skin layout, centred a little to his right where his side-eye face sits
const TH0 = 0.3, T0 = 0.45, AX = 1.08 * RM, AY = 0.225, RIMW = 0.065;
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));

export default function build(H) {
  const T = H.T, P = painter(), { x } = P;
  const all = (t0, t1) => { x.beginPath(); x.rect(-ARC / 2 - 0.1, t0, ARC + 0.2, t1 - t0); };
  const rivet = (X, v, r = 0.017, fill = BRASSD) => { x.beginPath(); x.ellipse(X, v, r, r, 0, 0, 7); P.fill(fill); x.lineWidth = INKU * 0.4; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.ellipse(X - r * 0.3, v - r * 0.3, r * 0.35, r * 0.3, 0, 0, 7); P.fill('rgba(255,240,190,0.85)'); };

  // ---- the suit ----
  P.region(() => all(COL1 - 0.01, 1.06), TEAL, () => {
    for (const a of [-0.55, 0.55, Math.PI - 0.55, -Math.PI + 0.55]) { P.strip(a, 0.08, () => COL1, () => HEM); P.fill(TEALL); P.ink(0.45); }
    P.band(() => HEM, () => 1.06); P.fill(TEALD); P.ink(0.5);
    const g = x.createLinearGradient(0, COL1, 0, COL1 + 0.035); g.addColorStop(0, 'rgba(0,10,15,0.4)'); g.addColorStop(1, 'rgba(0,10,15,0)');
    x.fillStyle = g; x.fillRect(-ARC, COL1 - 0.01, 2 * ARC, 0.05);
  });

  // ---- the helmet shell (brass), shine on top, the plate on the back ----
  P.region(() => all(-0.05, COL0 + 0.04), BRASS, () => {
    x.beginPath(); x.ellipse(-0.55 * RM, 0.12, 0.2, 0.04, -0.3, 0, 7); x.fillStyle = 'rgba(255,236,170,0.6)'; x.fill();
    const g = x.createLinearGradient(0, 0.45, 0, COL0); g.addColorStop(0, 'rgba(110,60,0,0)'); g.addColorStop(1, 'rgba(110,60,0,0.22)'); x.fillStyle = g; x.fillRect(-ARC, 0.45, 2 * ARC, COL0 - 0.45);
  });
  P.wrap(() => {   // the riveted plate on his back
    const B = Math.PI * RM; x.beginPath(); x.ellipse(B, T0, 0.92 * RM, 0.25, 0, 0, 7); P.fill(BRASSD); P.ink(0.6);
    x.beginPath(); x.ellipse(B, T0, 0.74 * RM, 0.2, 0, 0, 7); P.fill(BRASSM); P.ink(0.5);
    for (let i = 0; i < 10; i++) { const s = i / 10 * Math.PI * 2 + 0.26; rivet(B + 0.83 * RM * Math.cos(s), T0 + 0.225 * Math.sin(s)); }
  });

  // ---- the collar, with rivets ----
  P.region(() => P.band(() => COL0, () => COL1), BRASSD, () => {
    const g = x.createLinearGradient(0, COL0, 0, COL1); g.addColorStop(0, 'rgba(255,230,160,0.35)'); g.addColorStop(0.5, 'rgba(255,230,160,0)'); g.addColorStop(1, 'rgba(70,30,0,0.3)');
    x.fillStyle = g; x.fillRect(-ARC, COL0, 2 * ARC, COL1 - COL0);
    for (let i = 0; i < 16; i++) rivet((-Math.PI + (i + 0.5) / 16 * 2 * Math.PI) * RM, (COL0 + COL1) / 2, 0.016, BRASSL);
  });
  P.wrap(() => { P.line(() => COL0); P.ink(0.9); P.line(() => COL1); P.ink(0.9); });

  // ---- the face port: cut clean out, a dark lining crescent inside (deeper at the top), a riveted light-brass rim ----
  const CX = TH0 * RM;
  x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.ellipse(CX, T0, AX, AY, 0, 0, 7); x.fill(); x.restore();
  x.save(); x.beginPath(); x.ellipse(CX, T0, AX, AY, 0, 0, 7); x.ellipse(CX, T0 + 0.01, AX - 0.016, AY - 0.016, 0, 0, 7, true); x.fillStyle = LINING; x.globalAlpha = 0.85; x.fill(); x.restore();
  x.beginPath(); x.ellipse(CX, T0, AX + RIMW, AY + RIMW, 0, 0, 7); x.ellipse(CX, T0, AX, AY, 0, 0, 7, true); P.fill(BRASSL);
  x.save(); x.clip(); x.beginPath(); x.ellipse(CX, T0 + 0.03, AX + RIMW, AY + RIMW, 0, 0.1 * Math.PI, 0.9 * Math.PI); x.lineWidth = RIMW * 0.7; x.strokeStyle = 'rgba(110,60,0,0.3)'; x.stroke(); x.restore();
  for (const g of [0, RIMW]) { x.beginPath(); x.ellipse(CX, T0, AX + g, AY + g, 0, 0, 7); P.ink(0.9); }
  for (let i = 0; i < 12; i++) { const s = i / 12 * Math.PI * 2 + 0.26; rivet(CX + (AX + RIMW / 2) * Math.cos(s), T0 + (AY + RIMW / 2) * Math.sin(s), 0.016); }

  // ---- 3D parts: two side ports, the helmet lamp ----
  // a closed can with softly rounded rims (smooth normals, so its ink line + white border wrap it with no cracks)
  const canGeo = (rT, rB, L, e = 0.012) => { const pts = [], arc = (cx, cy, r, a0, a1) => { for (let k = 0; k <= 4; k++) { const a = a0 + (a1 - a0) * k / 4; pts.push(new T.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a))); } };
    pts.push(new T.Vector2(0, -L / 2)); arc(rB - e, -L / 2 + e, e, -Math.PI / 2, 0); arc(rT - e, L / 2 - e, e, 0, Math.PI / 2); pts.push(new T.Vector2(0, L / 2));
    return new T.LatheGeometry(pts, 28); };
  const brassP = H.paint(BRASS), group = new T.Group();
  const makePort = () => { const h = new T.Group(), L = 0.13, R = 0.095 * W;
    const cyl = H.outlined(canGeo(R, R, L), brassP, 0.8); cyl.rotation.x = Math.PI / 2; cyl.position.z = -L / 2; h.add(cyl);
    const face = new T.Mesh(new T.CircleGeometry(R - 0.008, 28), H.paint(BRASSL)); face.position.z = 0.004; h.add(face);
    const disc = new T.Mesh(new T.CircleGeometry(R * 0.6, 28), new T.MeshBasicMaterial({ color: GRILLE })); disc.position.z = 0.007; h.add(disc);
    for (const d of [-0.3, 0, 0.3]) { const bar = new T.Mesh(new T.BoxGeometry(R * 1.15, R * 0.11, 0.004), brassP); bar.position.set(0, d * R, 0.01); h.add(bar); }
    h.L = L; group.add(h); return h; };
  const ports = [makePort(), makePort()];
  // the lamp: a little brass can on top of the helmet, tipped forward, a glowing lens on its face
  const lampH = new T.Group(), LR = 0.08, LL = 0.08;
  { const base = H.outlined(new T.SphereGeometry(1, 20, 12).scale(0.075, 0.035, 0.075), brassP, 0.8); lampH.add(base); lampH.userData.base = base;
    const can = new T.Group(); can.rotation.x = 0.6;   // tipped toward his front
    const body = H.outlined(canGeo(LR, LR * 0.85, LL), brassP, 0.8); body.position.y = LL / 2 + 0.02; can.add(body);
    const rim = new T.Mesh(new T.CircleGeometry(LR, 28), H.paint(BRASSL)); rim.rotation.x = -Math.PI / 2; rim.position.y = LL + 0.02; can.add(rim);
    const lens = new T.Mesh(new T.CircleGeometry(LR * 0.74, 28), new T.MeshBasicMaterial({ color: '#fff3b0' })); lens.rotation.x = -Math.PI / 2; lens.position.y = LL + 0.021; can.add(lens);
    const glint = new T.Mesh(new T.CircleGeometry(LR * 0.22, 16), new T.MeshBasicMaterial({ color: '#ffffff' })); glint.rotation.x = -Math.PI / 2; glint.position.set(-LR * 0.3, LL + 0.022, -LR * 0.25); can.add(glint);
    lampH.add(can); lampH.userData.lens = lens; }
  group.add(lampH);
  const UP = new T.Vector3(0, 0, 1);

  return { canvas: P.c, parts: [group], lamp: lampH.userData.lens,
    puff: (t, th) => {
      // the port keeps the shell's height (no wall): you look through it at his face below, so it has real depth;
      // the rim is a soft raised ridge
      if (t < COL0) { const X = wrapA(th - TH0) * RM / AX, Y = (t - T0) / AY, d = (Math.hypot(X, Y) - 1) * Math.min(AX, AY);
        return SHELL + (d > 0 && d < RIMW ? 0.014 * Math.sin(Math.PI * d / RIMW) : 0); }
      if (t < COL1) return SHELL + 0.02 * Math.sin(Math.PI * clamp((t - COL0) / (COL1 - COL0) * 0.8 + 0.1));
      return 0.016;
    },
    update() {
      const ring = ringPts(H, 0.42, () => SHELL), c = ring.c;
      for (const [k, h] of [[H.COLS / 4, ports[0]], [H.COLS * 3 / 4, ports[1]]]) { const p = ring.r[k], dir = new T.Vector3(p.x - c.x, 0, p.z - c.z).normalize();
        h.position.copy(p).addScaledVector(dir, h.L - 0.03); h.quaternion.setFromUnitVectors(UP, dir); }
      const top = H.top(); lampH.position.set(top.x, top.y + SHELL - 0.006, top.z + 0.02);
    } };
}
