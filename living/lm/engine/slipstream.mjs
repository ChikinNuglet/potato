// slipstream.mjs — BOLD CHOICE (engineer, assembly round): YOUR CURSOR HAS AIR.
// Swipe the pointer fast and close past a Potato who is standing and he catches the wind of it: his flesh rocks once the way
// the pointer was going and settles (the model's own lean and wobble springs, so it overshoots once and dies by itself).
// No face, no sound, no step, no decision: it is physics, like a wall. A slow pointer does nothing. A pointer that is
// holding someone does nothing. He never does it twice inside `cooldown_f`. A sleeping one rocks and stays asleep.
//   data/physics.json  "slipstream": { "on": true, "min_speed": 9, "reach": 1.05, "lean": 7, "wob": 4, "max_gust": 0.6, "cooldown_f": 50 }
//   OFF:  "slipstream": { "on": false }   (bench / pet: ?slipstream=0)
// Speeds in body heights a second; at the pet's size (100 px a body height) 9 is a 900 px/s flick.
// Game-feel and physics engineer (seat 3), team Not A Screensaver.
export function createSlipstream(ctx) {
  const { body, MODE, rig, senses, clock, data, potatoes, emit } = ctx;
  const J = (data.physics && data.physics.slipstream) || {}, on = J.on !== false;
  const minV = J.min_speed || 9, reach = J.reach || 1.05, kLean = J.lean == null ? 7 : J.lean, kWob = J.wob == null ? 4 : J.wob, maxG = J.max_gust || 0.6, cool = J.cooldown_f || 50;
  const last = { x: 0, y: 0, seen: false }, until = new Int32Array(8);
  return {
    name: 'slipstream', on,
    /** (final round, comedian) the poking hand is not a fast pass: no wind for `quiet_after_poke_f` (60) after any poke or grab */
    event(name, e) { if ((name === 'poked' || name === 'grab' || name === 'dropped' || name === 'thrown') && e.slot != null) { const q = J.quiet_after_poke_f == null ? 60 : J.quiet_after_poke_f; for (let s = 0; s < until.length; s++) until[s] = Math.max(until[s], clock.k + q); } },
    step() {
      const c = senses.cursor; if (!on || !c.seen) return;
      const vx = (c.x - last.x) * 60, vy = (c.y - last.y) * 60, was = last.seen; last.x = c.x; last.y = c.y; last.seen = true;
      if (!was || c.down) return; const v = Math.hypot(vx, vy); if (v < minV) return;
      for (const p of potatoes) { const s = p.slot; if (body.mode[s] !== MODE.ground || clock.k < until[s]) continue;
        const dx = c.x - body.x[s], dy = c.y - body.y[s], d = Math.hypot(dx, dy); if (d > reach || d < 0.2) continue;                 // through him is a poke's business, not the wind's
        const near = 1 - (d - 0.2) / (reach - 0.2), gust = Math.min(maxG, Math.min(1, (v - minV) / (3 * minV) + 0.35) * (0.4 + 0.6 * near)), dir = Math.abs(vx) > 0.3 * v ? Math.sign(vx) : -Math.sign(dx) || 1;
        rig.kick(s, 'leanX', -dir * kLean * gust); rig.kick(s, 'wob', kWob * gust); if (rig.wake) rig.wake(s, 50); until[s] = clock.k + cool;
        emit('slipstream', { slot: s, gust: +gust.toFixed(3), dir, speed: +v.toFixed(1) }); }
    },
  };
}
