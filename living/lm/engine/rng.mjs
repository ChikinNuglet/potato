// rng.mjs — all randomness. One named stream per Potato per purpose, from spudphys dmath.stream (mulberry32).
// purposes: behaviour moves physics face sound fx. Sound on or off can never change a strip, because sound has its own stream.
// Game-feel and physics engineer (seat 3).
export function createRng(phys, seed) {
  const made = new Map();
  const rng = {
    seed,
    /** stream(id, purpose) -> () => 0..1. The same (seed, id, purpose) always gives the same sequence. */
    stream(id, purpose) {
      const name = id + ':' + purpose; let s = made.get(name);
      if (!s) { s = phys.stream(seed, name); made.set(name, s); }
      return s;
    },
    /** helpers on a stream */
    range(s, a, b) { return a + (b - a) * s(); },
    int(s, a, b) { return a + Math.floor((b - a + 1) * s()); },
  };
  return rng;
}
