// spudphys — cartoon squash and stretch: a damped spring per character, stepped inside world.step() and saved
// with the rest of the state, so it replays and scrubs exactly.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// Canon guard: amplitude capped (default 0.12), scale about his feet, volume kept. Squash changes how he lands,
// never who he is (POTATO-CANON-RULES.md HARD RULE). New squash looks go to Matt as stills first.

/**
 * @param {import('../src/world.mjs').World} world
 * @param {{ stiffness?: number, damping?: number, cap?: number, impacts?: {t:number, size:number}[] | ((k:number)=>number), active?: number[] }} o
 *   impacts: list of { t, size } (size > 0 squashes, < 0 stretches), or a function of the step index returning a size.
 */
export function squash(world, o = {}) {
  const off = world.allocState([0, 0]);
  const kS = o.stiffness ?? 260, cD = o.damping ?? 9, cap = o.cap ?? 0.12;
  const list = Array.isArray(o.impacts) ? o.impacts.map(i => ({ k: world.stepAt(i.t), size: i.size })) : null;
  const fn = typeof o.impacts === 'function' ? o.impacts : null;
  const body = world.addBody({ kind: 'squash', n: 0, active: o.active });
  body.pre = (w, b, k) => {
    const st = w.state, dt = 1 / w.rate, sub = 4, h = dt / sub;
    let imp = 0;
    if (list) for (const i of list) if (i.k === k) imp += i.size;
    if (fn) imp += fn(k) || 0;
    if (imp) st[off + 1] -= imp * 12;               // an impact kicks the spring's speed
    for (let j = 0; j < sub; j++) {                  // semi-implicit Euler, fixed sub-steps
      st[off + 1] += (-kS * st[off] - cD * st[off + 1]) * h;
      st[off] += st[off + 1] * h;
      if (st[off] > cap) { st[off] = cap; if (st[off + 1] > 0) st[off + 1] = 0; }
      if (st[off] < -cap) { st[off] = -cap; if (st[off + 1] < 0) st[off + 1] = 0; }
    }
  };
  body.onReset = (w) => { w.state[off] = 0; w.state[off + 1] = 0; };
  return {
    body,
    /** Spring value s in [-cap, cap]: > 0 stretched, < 0 squashed. */
    get value() { return world.state[off]; },
    /** Scale [sx, sy, sz] to apply about his feet (volume kept: sx = sz = 1/sqrt(sy)). */
    scale(out = [1, 1, 1]) { const sy = 1 + world.state[off], sx = 1 / Math.sqrt(sy); out[0] = sx; out[1] = sy; out[2] = sx; return out; },
  };
}
