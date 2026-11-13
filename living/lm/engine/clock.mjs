// clock.mjs — the one clock. A fixed step of 1/60 s; k is the step count and the only time the engine knows.
// No setTimeout, no Math.random, no performance.now in here. Real time only decides HOW MANY steps run this frame.
// Everything delayed goes through after(frames, fn), so a strip replays exactly.
// Game-feel and physics engineer (seat 3), team Not A Screensaver.
export const HZ = 60, DT = 1 / 60;

export function createClock() {
  const q = [];           // { k, seq, fn } sorted by (k, seq): same step -> the order they were asked in
  let seq = 0, acc = 0;
  const clock = {
    k: 0,
    get time() { return clock.k / HZ; },
    /** run fn at step k + frames (frames >= 1). Returns a handle with cancel(). */
    after(frames, fn) {
      const e = { k: clock.k + Math.max(1, Math.round(frames)), seq: seq++, fn, dead: false };
      let i = q.length; while (i > 0 && (q[i - 1].k > e.k)) i--;
      q.splice(i, 0, e);
      return { cancel() { e.dead = true; } };
    },
    /** called by living.tick() once the step number has moved on */
    run() { while (q.length && q[0].k <= clock.k) { const e = q.shift(); if (!e.dead) e.fn(clock.k); } },
    /** the catch-up rule (spudphys World.play's): 0 to 4 steps for this much real time; lost time is dropped, never chased */
    stepsFor(realSeconds) {
      acc += Math.max(0, realSeconds); let n = Math.floor(acc * HZ + 1e-9);
      acc -= n / HZ; if (n > 4) { n = 4; acc = 0; }
      return n;
    },
    pending() { return q.length; },
  };
  return clock;
}
