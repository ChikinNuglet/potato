// music.mjs — the song's music map, read off its stems (tools/musicmap.py -> play/songs/<id>.music.json). Matt: "can you
// read the music to get better matching with visual beats". Every level gets it as map.music (at build time, for set-up
// events) and C.music (for the view and the story layer). Everything is a pure function of the song time t.
//   const M = makeMusic(json)
//   M.kick(t) / M.snare(t) / M.hat(t)   0..1 envelope: 1 on the hit, decaying (speakers pump, lights flash, things twitch)
//   M.lastKick(t) / M.nextKick(t)       times (also lastSnare/nextSnare, lastHat/nextHat)
//   M.bass(t) / M.loud(t) / M.high(t)   0..1 curves (smoothly interpolated)
//   M.singing(t)                        true while the voice is on
//   M.drops                             [{t, k, from}] the big hits (k 0..1; from = where its build starts); M.bigDrops(k) filters
//   M.build(t)                          0..1 how far into the build of the next drop we are (0 = none, 1 = on the hit) — for set-ups
//   M.dropHit(t)                        0..1 envelope right after a drop (scaled by its k)
//   M.inBreak(t)                        true in a dip (the band drops out) — the set-up before a drop
// A level without a map gets null: always guard (if (M) …).
export function makeMusic(J) {
  if (!J) return null;
  const fps = J.fps || 20, at = (A, t) => { const x = t * fps, i = Math.floor(x); if (i < 0) return A[0] / 99; if (i >= A.length - 1) return A[A.length - 1] / 99; const k = x - i; return (A[i] + (A[i + 1] - A[i]) * k) / 99; };
  const idx = (A, t) => { let lo = 0, hi = A.length; while (lo < hi) { const m = (lo + hi) >> 1; if (A[m] <= t) lo = m + 1; else hi = m; } return lo; };   // first > t
  const last = A => t => { const i = idx(A, t); return i ? A[i - 1] : -1e9; }, next = A => t => { const i = idx(A, t); return i < A.length ? A[i] : 1e9; };
  const env = (A, decay) => t => { const l = last(A)(t); return l < -1e8 ? 0 : Math.exp(-(t - l) / decay); };
  const drops = J.drops || [], breaks = J.breaks || [], vocal = J.vocal || [];
  const M = {
    json: J, duration: J.duration, drops, breaks,
    kick: env(J.kick, 0.09), snare: env(J.snare, 0.12), hat: env(J.hat, 0.05),
    lastKick: last(J.kick), nextKick: next(J.kick), lastSnare: last(J.snare), nextSnare: next(J.snare), lastHat: last(J.hat), nextHat: next(J.hat),
    bass: t => at(J.bass, t), loud: t => at(J.loud, t), high: t => at(J.high, t),
    singing: t => vocal.some(([a, b]) => t >= a && t < b),
    bigDrops: (k = 0.4) => drops.filter(d => d.k >= k),
    nextDrop: (t, k = 0) => drops.find(d => d.t > t && d.k >= k) || null,
    lastDrop: (t, k = 0) => { let r = null; for (const d of drops) { if (d.t > t) break; if (d.k >= k) r = d; } return r; },
    build: (t, k = 0) => { const d = M.nextDrop(t, k); if (!d) return 0; const a = Math.min(d.from, d.t - 1); return t < a ? 0 : Math.min(1, (t - a) / Math.max(0.5, d.t - a)); },
    dropHit: (t, k = 0, len = 0.8) => { const d = M.lastDrop(t, k); return d ? Math.max(0, 1 - (t - d.t) / len) * (0.4 + 0.6 * d.k) : 0; },
    inBreak: t => breaks.some(([a, b]) => t >= a && t < b),
  };
  return M;
}
