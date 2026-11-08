// ORBITAL ASTRONAUT (3D port of draw/outfits/orbital-astronaut.js): a white retro helmet round his head and shoulders
// with a big OPEN face window (no glass: his own face shows, a soft dark lining just inside the edge for depth), a grey
// raised rim round the window, a grey neck ring where helmet meets suit; a short white suit with orange piping, a chest
// control box and an orange hose port. No ear knobs (Chikin took them off).
import { painter, W, INKU, INK, ARC, RM, clamp } from '../outfits3d.mjs';

const WHITE = '#f4f1ea', GREY = '#bcc2ca', GDEEP = '#878e98', ORANGE = '#f0731c', ODEEP = '#b9500e', SLOT = '#3a3f4a';
const SHELL = 0.06 * W;                       // helmet stands off his head
const RING0 = 0.755, RING1 = 0.805;           // neck ring (helmet bottom) — low enough that his mouth clears the window
// the face window: an ellipse on his skin layout, centred a little to his right where his side-eye face sits
const TH0 = 0.26, T0 = 0.465, AX = 1.1 * RM, AY = 0.235, RIMW = 0.05;
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));

export default function build(H) {
  const P = painter(), { x } = P;
  const all = (t0, t1) => { x.beginPath(); x.rect(-ARC / 2 - 0.1, t0, ARC + 0.2, t1 - t0); };

  // ---- suit (below the neck ring) ----
  P.region(() => all(RING1 - 0.01, 1.06), WHITE, () => {
    // the helmet's soft shadow on the suit
    const g = x.createLinearGradient(0, RING1, 0, RING1 + 0.035); g.addColorStop(0, 'rgba(60,60,90,0.35)'); g.addColorStop(1, 'rgba(60,60,90,0)');
    x.fillStyle = g; x.fillRect(-ARC, RING1 - 0.01, 2 * ARC, 0.05);
    // orange piping round his middle
    P.band(() => 0.93, () => 0.952); P.fill(ORANGE); P.ink(0.45);
  });
  // the chest control box: grey, three dark slots
  x.beginPath(); x.roundRect(-0.34 * RM, 0.83, 0.68 * RM, 0.075, 0.012); P.fill(GREY); P.ink(0.6);
  for (const a of [-0.13, 0, 0.13]) { x.beginPath(); x.roundRect((a - 0.035) * RM, 0.846, 0.07 * RM, 0.044, 0.006); P.fill(SLOT); }
  // the hose port on his left chest
  { const a = 0.85, v = 0.86, X = a * RM; x.beginPath(); x.ellipse(X, v, 0.046, 0.042, 0, 0, 7); P.fill(ORANGE); P.ink(0.6);
    x.beginPath(); x.ellipse(X, v, 0.023, 0.021, 0, 0, 7); P.fill(ODEEP); P.ink(0.4); }

  // ---- the helmet shell ----
  P.region(() => all(-0.05, RING0 + 0.06), WHITE, () => {
    x.beginPath(); x.ellipse(-0.55 * RM, 0.11, 0.2, 0.04, -0.3, 0, 7); x.fillStyle = 'rgba(255,255,255,0.95)'; x.fill();   // shine
  });
  // the neck ring
  P.region(() => P.band(() => RING0, () => RING1), GREY, () => {
    const g = x.createLinearGradient(0, RING0, 0, RING1); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(40,40,60,0.28)');
    x.fillStyle = g; x.fillRect(-ARC, RING0, 2 * ARC, RING1 - RING0);
  });
  P.wrap(() => { P.line(() => RING0); P.ink(0.9); P.line(() => RING1); P.ink(0.9); });

  // ---- the window: cut clean out (his face shows), dark lining just inside the edge, grey rim round it ----
  const CX = TH0 * RM;
  x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.ellipse(CX, T0, AX, AY, 0, 0, 7); x.fill(); x.restore();
  x.save(); x.beginPath(); x.ellipse(CX, T0, AX, AY, 0, 0, 7); x.clip();
  x.filter = 'blur(6px)'; x.beginPath(); x.ellipse(CX, T0 + 0.01, AX, AY, 0, 0, 7); x.lineWidth = 0.04; x.strokeStyle = 'rgba(20,22,30,0.45)'; x.stroke();
  x.restore();
  x.beginPath(); x.ellipse(CX, T0, AX + RIMW / 2, AY + RIMW / 2, 0, 0, 7); x.lineWidth = RIMW + INKU * 1.8; x.strokeStyle = INK; x.stroke();
  x.lineWidth = RIMW; x.strokeStyle = GREY; x.stroke();
  x.beginPath(); x.ellipse(CX, T0, AX + RIMW * 0.75, AY + RIMW * 0.75, 0, Math.PI * 0.95, Math.PI * 1.4); x.lineWidth = RIMW * 0.3; x.strokeStyle = 'rgba(255,255,255,0.85)'; x.stroke();
  x.beginPath(); x.ellipse(CX, T0, AX + RIMW * 0.3, AY + RIMW * 0.3, 0, Math.PI * 0.05, Math.PI * 0.6); x.lineWidth = RIMW * 0.3; x.strokeStyle = GDEEP; x.stroke();

  return { canvas: P.c, parts: [],
    puff: (t, th) => {
      // the window keeps the shell's height (no wall, no fringe): you look through the hole at his face 0.06 below,
      // so it has real depth as he turns; the rim is a soft raised ridge
      if (t < RING0) { const X = wrapA(th - TH0) * RM / AX, Y = (t - T0) / AY, d = (Math.hypot(X, Y) - 1) * Math.min(AX, AY);
        return SHELL + (d > 0 && d < RIMW ? 0.012 * Math.sin(Math.PI * d / RIMW) : 0); }
      if (t < RING1) return SHELL + 0.016;
      return 0.014;
    } };
}
