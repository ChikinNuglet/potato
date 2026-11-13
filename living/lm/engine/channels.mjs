// channels.mjs — every driven number on a Potato, with its value, its speed, and the blend that stops it snapping.
//
// THE RULE: a move (or the brain) only ever says what a channel SHOULD be this step: set(). It never writes the value.
// The value that reaches the rig is  out = base + offset,  where offset is the INERTIAL blend (moves.json "blend"):
// when the thing driving a channel changes, call blend(): the channel keeps the gap in value AND speed between what it was
// doing and what it is now told, and that gap decays to zero on a quintic. First frame after a switch: value and speed are
// both unbroken. The only thing allowed to write a value outright is physics: handoff(value, speed).
// Game-feel and physics engineer (seat 3).
import { HZ, DT } from './clock.mjs';

// name -> rest value. Order is the column order in the state hash; add at the end only.
export const CHANNELS = {
  x: 0, y: 0,                 // his centre in the room, body heights (physics owns these when he is held or free)
  dx: 0, dy: 0,               // a move's own travel on top (the animator's dx, dy)
  roll: 0, pitch: 0, shear: 0,
  sy: 1, sx: NaN,             // squash / stretch about the pivot; sx NaN = follows volume (1/sqrt(sy))
  pivot: 0,                   // height of the scale pivot above his feet, body heights (0 = feet, 0.5375 = centre)
  lxx: 0, lxy: 0, lyy: 0,     // world-space strain (log), from physpose: stretch along velocity, squash along a contact normal
  yaw: 0,                     // given to the model's own yaw spring
  lidL: 0, lidR: 0, gx: 0, gy: 0, browL: 0, browR: 0, jaw: 0, expr: 0,   // the face painter's (face.mjs)
  glitch: 0,                  // 0..1 to the model's glitch(k); step it at 12 Hz yourself
  cx: 0, cy: 0,               // physpose: slides him toward the surface he is squashed against, so the squash never opens a gap
};
export const NAMES = Object.keys(CHANNELS), NCH = NAMES.length;
export const IDX = Object.fromEntries(NAMES.map((n, i) => [n, i]));

export function createChannels(maxPotatoes = 5) {
  const n = maxPotatoes * NCH;
  const base = new Float64Array(n), out = new Float64Array(n), prev = new Float64Array(n), spd = new Float64Array(n);
  const ox = new Float64Array(n), ov = new Float64Array(n), oT = new Float64Array(n), ot = new Float64Array(n);   // offset: x0, v0, length, age (s)
  const pend = new Float64Array(n);     // frames of a blend asked for this step (0 = none)
  const hand = new Uint8Array(n);       // physics wrote this channel this step
  const ch = {
    base, out, spd, NCH,
    reset(slot) { for (let c = 0; c < NCH; c++) { const i = slot * NCH + c, r = CHANNELS[NAMES[c]]; base[i] = out[i] = prev[i] = r; spd[i] = ox[i] = ov[i] = oT[i] = ot[i] = pend[i] = 0; hand[i] = 0; } },
    /** what the channel should be this step (moves, brain, physpose) */
    set(slot, c, v) { base[slot * NCH + c] = v; },
    /** the driver of these channels is changing THIS step: keep value and speed, decay the gap over `frames` */
    blend(slot, cs, frames) { if (cs == null) { for (let c = 0; c < NCH; c++) pend[slot * NCH + c] = frames; } else for (const c of cs) pend[slot * NCH + c] = frames; },
    /** physics only: the exact value and speed, no offset left */
    handoff(slot, c, value, speed) { const i = slot * NCH + c; base[i] = value; out[i] = value; spd[i] = speed; ox[i] = ov[i] = oT[i] = 0; hand[i] = 1; pend[i] = 0; },
    /** move a channel by a constant with no visible change (unwinding 2*pi of roll after a tumble) */
    shift(slot, c, d) { const i = slot * NCH + c; base[i] += d; out[i] += d; prev[i] += d; },
    get(slot, c) { return out[slot * NCH + c]; },
    speed(slot, c) { return spd[slot * NCH + c]; },
    target(slot, c) { return base[slot * NCH + c]; },
    /** what step() WOULD make this channel this step, with nothing changed (the engine's last guard reads it; see living.mjs) */
    peek(slot, c) { const i = slot * NCH + c, b = base[i]; if (b !== b || hand[i] || pend[i] > 0) return out[i]; let o = 0;
      if (oT[i] > 0) { const t = ot[i] + DT, T = oT[i]; if (t < T) { const x0 = ox[i], v0 = ov[i], u = t / T, u3 = u * u * u; o = x0 + v0 * t - (10 * x0 + 6 * v0 * T) * u3 + (15 * x0 + 8 * v0 * T) * u3 * u - (6 * x0 + 3 * v0 * T) * u3 * u * u; } }
      return b + o; },
    /** frames of a blend already asked for this step (0 = none) */
    pending(slot, c) { return pend[slot * NCH + c]; },
    blending(slot, c) { const i = slot * NCH + c; return oT[i] > 0 && ot[i] < oT[i]; },
    /** once per step, after everyone has set their targets */
    step(slot) {
      for (let c = 0; c < NCH; c++) {
        const i = slot * NCH + c, b = base[i];
        if (b !== b) { out[i] = b; continue; }                       // NaN channel (sx unkeyed)
        if (hand[i]) { hand[i] = 0; prev[i] = out[i]; continue; }    // physics: value and speed already exact
        if (pend[i] > 0) {
          let T = pend[i] * DT; pend[i] = 0;
          const x0 = (out[i] === out[i] ? out[i] : b) - b, v0 = spd[i];
          if (x0 * v0 < 0) T = Math.min(T, -5 * x0 / v0);            // already heading home: do not overshoot the old pose
          if (T < DT || (Math.abs(x0) < 1e-9 && Math.abs(v0) < 1e-9)) { oT[i] = 0; }
          else { ox[i] = x0; ov[i] = v0; oT[i] = T; ot[i] = 0; }
        }
        let o = 0;
        if (oT[i] > 0) {
          const t = (ot[i] += DT), T = oT[i];
          if (t >= T) oT[i] = 0;
          else { const x0 = ox[i], v0 = ov[i], u = t / T, u3 = u * u * u;
            o = x0 + v0 * t - (10 * x0 + 6 * v0 * T) * u3 + (15 * x0 + 8 * v0 * T) * u3 * u - (6 * x0 + 3 * v0 * T) * u3 * u * u; }
        }
        const v = b + o; spd[i] = (v - prev[i]) * HZ; prev[i] = out[i] = v;
      }
    },
    arrays() { return [base, out, spd]; },
  };
  for (let s = 0; s < maxPotatoes; s++) ch.reset(s);
  return ch;
}
