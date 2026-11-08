// modes/no-answer.mjs — Level 8 as a LOOKING-FOR-SOMETHING game (Matt: "a looking for something game"; "no answer should be
// surreal"; "a light based level, where you are trying to keep light shining and the dark from consuming").
// Each section of the song is one dark, surreal scene standing in a black sea. Potato's light is your cursor: the arrows steer
// the beam of his lamp round the dark (held = glide), and he wanders after it on his own across the water. Somewhere out
// there phones are ringing (a faint shimmer on the beat, and the ring itself, panned to where it is). Hold the light on one
// and it lights up, rings out — no answer — and STAYS lit: a trail of light across the dark. When the song turns, the scene
// moves on: what you didn't find, the dark takes, and every one it takes shrinks his light (each one you find feeds it).
// If the light shrinks to nothing it goes out (the fail: gentle, but real).
//   · Space: he CALLS OUT (his glitch, purple, his only): a ring of light runs out over the water and every phone still
//     ringing in the scene glints back for a moment. It comes back every 4 beats.
//   · V (after you find the download in the deep): the diver. The scene sinks under the water and the helmet lamp is the
//     only light, a bigger beam for a stretch; the phones on the sea bed can only be reached down there.
// The scenes, the phones and their times are authored in the level file (def.search); this file is the rules (pure,
// deterministic, 120 Hz — the bot runs the same code) and the sound of the phones (modeView, browser only). The look of the
// scenes and the dark is the story file (story-no-answer.mjs), because the whole game lives in the dark behind him.

// ---------- shared geometry (the rules, the look and the bot all use these) ----------
export const VW = 5.6 * 16 / 9;                       // the stage is always 16:9: 9.96 units across
export const BEHIND = VW * 0.24;                      // the camera keeps its anchor 24% from the left
export const G = {
  SW: 13,           // scene k stands at anchor 13·k (so the next scene waits off to the right)
  YLO: 0.55, YHI: 5.05, XM: 0.35,                    // where the light can go (local: x 0..VW from the screen's left edge)
  V: 5.2, ACC: 0.1,                                  // the beam glides (units/s), easing in/out over ~0.1 s
  R0: 0.45, R1: 0.75,                                // beam radius = R0 + R1·light
  REACH: 0.75, DW: 0.25,                             // a phone inside 75% of the beam (+ its own size) for 0.25 s is found
  L0: 0.55, GAIN: 0.09,                              // the light: where it starts, what a found phone gives back
  WALK: 1.5, FEET: 0.3,                              // he wanders after the light along the near water
  GLIDE: 2,                                          // beats: the camera glides to the next scene on the section's downbeat
  CALL: 4,                                           // beats: the call-out comes back
  DIVE: 1.6, DIVEB: 16,                              // the helmet lamp: ×1.6 for 16 beats
  HZ: 3.9,                                           // the horizon
};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const look = { cam: null, C: null };   // the story projects through the real camera (set by modeView, browser only)
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const DT = 1 / 120;
// the song's pulse here is the half-time game beat (0.720 s): every 'beat' in this level is one of those
export const GB = C => C.map.gameBeat || 2 * C.P;
export const gbeat = (C, t) => (t - (C.map.gameOffset ?? C.OFF)) / GB(C);

// ---------- the search, prepared once per course ----------
const PREP = new WeakMap();
export function prep(C) {
  if (PREP.has(C)) return PREP.get(C);
  const S = C.def.search, scenes = S.scenes.map((q, k) => ({ ...q, k, A: k * G.SW, X0: k * G.SW - BEHIND }));
  const things = [];
  scenes.forEach(q => (q.phones || []).forEach((p, j) => things.push({ ...p, id: things.length, sc: q.k, j, kind: p.kind || 'phone', r: p.r ?? 0.16 + 0.12 * depthK(p.y) })));
  if (S.pk) { const q = scenes[S.pk.sc]; things.push({ ...S.pk, id: things.length, kind: 'pk', r: 0.3 }); void q; }
  if (C.def.blank) things.length = 0;   // (?blank, run/blank.mjs: no phones, no booth, no download — the scenes and his light stay)
  const P = { S, scenes, things, deep: S.deep ?? -1 };
  PREP.set(C, P); return P;
}
export const depthK = y => clamp(1 - (y - 1.2) / (G.HZ - 1.2) * 0.55, 0.45, 1);   // nearer (lower) = bigger
export function sceneAt(P, t) { let k = 0; while (k + 1 < P.scenes.length && P.scenes[k + 1].t0 <= t) k++; return k; }
// the camera's anchor: each scene sits still; on the section's downbeat it glides on to the next
export function anchorAt(C, P, t) {
  const k = sceneAt(P, t), q = P.scenes[k]; if (k === 0) return q.A;
  const g = G.GLIDE * GB(C), u = (t - q.t0) / g; return u >= 1 ? q.A : P.scenes[k - 1].A + (q.A - P.scenes[k - 1].A) * ease(u);
}
export const frameX = (C, P, t) => anchorAt(C, P, t) - BEHIND;   // world x of the screen's left edge
// where a phone is now (world): bobbing on the water, drifting in a paper boat, falling out of the dark on its cord
export function posOf(C, P, p, t) {
  const q = P.scenes[p.sc] || P.scenes[0], x0 = q.X0 + p.x * VW;
  let x = x0, y = p.y;
  if (p.move === 'drift') x += (p.vx || 0.18) * Math.max(0, t - q.t0);
  if (p.move === 'fall') { const u = clamp((t - p.t) / (p.fall || 1.4)); y = 6.2 + (p.y - 6.2) * (u * u); }   // drops out of the dark, a splash, then bobs
  if (p.kind === 'pk') { const u = clamp((t - p.t) / 2.2); y = 5.9 + (p.y - 5.9) * ease(u); }
  y += Math.sin(t * 1.3 + p.id * 1.7) * 0.035 * (p.move === 'fall' && t - p.t < (p.fall || 1.4) ? 0 : 1);
  return { x, y };
}
// how big his light is (world units)
export function beamR(C, P, s, t) {
  let r = G.R0 + G.R1 * clamp(s.L ?? G.L0);
  const born = clamp((t - (P.S.born ?? 1)) / 1.5); r *= 0.15 + 0.85 * ease(born);         // the cold open: it flickers on
  const u = s.used && s.used.diver; if (u != null && t >= u) { const a = (t - u) / GB(C); r *= 1 + (G.DIVE - 1) * (a < G.DIVEB - 3 ? ease(a / 1.5) : ease((G.DIVEB - a) / 3)); }
  return r;
}
// is this thing in play right now (ringing, not found, not taken, its scene on screen)
export function live(C, P, s, p, t) {
  if (s.got[p.id] != null || s.lost[p.id] != null) return false;
  if (t < p.t) return false;
  const q = P.scenes[p.sc]; if (t < q.t0 + G.GLIDE * GB(C) && p.sc > 0) return false;
  if (p.kind === 'pk') return !s.power && !(s.used && s.used.diver != null) && t < (p.until ?? q.t1);
  if (t >= q.t1) return false;
  if (p.under && s.dive == null) return false;                                              // the deep: down there, only the diver
  return sceneAt(P, t) === p.sc;
}

export const mode = {
  init(s, api) {
    const C = api.C, P = prep(C), t = s.t, k = sceneAt(P, t);
    Object.assign(s, { bx: VW * 0.56, by: 2.7, cvx: 0, cvy: 0, px: VW * 0.3, L: G.L0, dw: {}, got: {}, lost: {}, sc: k, charge: true, usedSlot: -1,
      ground: true, vy: 0, vyIn: 0, nFound: 0, nGone: 0, nudge: {} });
    for (const p of P.things) if (p.sc < k && p.kind !== 'pk') { if (p.id % 3) s.got[p.id] = P.scenes[p.sc].t1 - 1; else s.lost[p.id] = P.scenes[p.sc].t1; }   // a practice start: a trail behind him
    place(C, P, s, t);
  },
  step(s, inp, t, api) {
    const C = api.C, P = prep(C), b = gbeat(C, t);
    const die = why => { if (C.def.blank) { api.die(why); return; } if (!s.dead) api.die(why); if (!s.dead) { s.dead = true; s.why = why; } };   // (?blank: nothing ends the song)
    // ---- the song turns: what you didn't find, the dark takes (and it takes from his light) ----
    while (s.sc < P.scenes.length && t >= P.scenes[s.sc].t1) {
      const q = P.scenes[s.sc]; let n = 0;
      for (const p of P.things) if (p.sc === q.k && p.kind !== 'pk' && s.got[p.id] == null && s.lost[p.id] == null && p.t < q.t1) { s.lost[p.id] = t; n++; }
      s.L = clamp(s.L - n * (q.take ?? 0.1)); s.takeAt = t; s.takeN = n; s.nGone += n; s.sc++;
      if (s.L <= 0.001 && n > 0) { s.outAt = t; return die('the dark took his light'); }
    }
    // ---- the call comes back on the beat line ----
    if (!s.charge && Math.floor(b / G.CALL) > s.usedSlot) s.charge = true;
    // ---- the beam: held arrows glide it (a tap nudges it) ----
    for (const [k, h] of [['J', 'U'], ['D', 'D'], ['L', 'L'], ['R', 'R']]) if (inp[k]) s.nudge[h] = t + 0.09;
    const on = h => !!(inp[h + 'h'] || (s.nudge[h] != null && t < s.nudge[h]));
    let dx = (on('R') ? 1 : 0) - (on('L') ? 1 : 0), dy = (on('U') ? 1 : 0) - (on('D') ? 1 : 0);
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    const kA = Math.min(1, DT / G.ACC); s.cvx += (dx * G.V - s.cvx) * kA; s.cvy += (dy * G.V - s.cvy) * kA;
    s.bx += s.cvx * DT; s.by += s.cvy * DT;
    if (s.bx < G.XM || s.bx > VW - G.XM) { s.bx = clamp(s.bx, G.XM, VW - G.XM); s.cvx = 0; }
    if (s.by < G.YLO || s.by > G.YHI) { s.by = clamp(s.by, G.YLO, G.YHI); s.cvy = 0; }
    // ---- space: he calls out into the dark (every phone still ringing glints back) ----
    if (inp.G && s.charge) { s.charge = false; s.usedSlot = Math.floor(b / G.CALL); s.callAt = t; s.glitchAt = t; s.blink = 0.22; s.blinkFrom = { x: s.x, y: s.y }; s.calls = (s.calls || 0) + 1; }
    // ---- V: the diver ----
    if (inp.V && s.power) { const pw = s.power; s.used[pw] = t; s.usedWhat = pw; s.usedPower = t; s.power = null;
      if (sceneAt(P, t) === P.deep && s.dive == null) s.dive = t; }
    // ---- the light finds things ----
    const R = beamR(C, P, s, t), fx = frameX(C, P, t), cx = fx + s.bx, cy = s.by;
    for (const p of P.things) {
      if (!live(C, P, s, p, t)) { if (s.dw[p.id]) s.dw[p.id] = 0; continue; }
      const o = posOf(C, P, p, t), d = Math.hypot(o.x - cx, o.y - cy);
      if (d < R * G.REACH + p.r) { s.dw[p.id] = (s.dw[p.id] || 0) + DT;
        if (s.dw[p.id] >= G.DW) {
          if (p.kind === 'pk') { s.power = P.S.pk.power || 'diver'; s.gotPower = t; s.pkAt = t; s.got[p.id] = t; }
          else { s.got[p.id] = t; s.L = clamp(s.L + G.GAIN); s.foundAt = t; s.orbAt = t; s.foundId = p.id; s.nFound++; if (p.kind === 'booth') s.boothAt = t; }
        } }
      else if (s.dw[p.id]) s.dw[p.id] = Math.max(0, s.dw[p.id] - 2 * DT);
    }
    s.meter = s.L;   // (his face reads it: heavy-lidded when his light is low)
    place(C, P, s, t);
    s.blink = Math.max(0, (s.blink || 0) - DT);
  },
};
// he wanders after his light along the near water (and walks out to the booth once it's lit)
function place(C, P, s, t) {
  const fx = frameX(C, P, t), A = anchorAt(C, P, t);
  let tx = clamp(s.bx, 0.75, VW - 0.75), slack = 1.0;
  const booth = P.things.find(p => p.kind === 'booth'); if (booth && s.got[booth.id] != null) { const o = posOf(C, P, booth, t); tx = clamp(o.x - fx - 0.95, 0.75, VW - 0.75); slack = 0.05; }
  const d = tx - s.px; if (Math.abs(d) > slack) s.px += Math.sign(d) * Math.min(Math.abs(d) - slack, G.WALK * DT);
  s.walking = Math.abs(d) > slack;
  s.x = fx + s.px; s.y = G.FEET + Math.sin(t * 1.1) * 0.03; s.dx = s.x - A;
  s.ground = true; s.vy = 0; s.vyIn = 0; s.ducking = false;
}

// ---------- the sound of the dark: the phones ring where they are (browser only) ----------
// Every phone still ringing trills on its own beats, panned to where it is on screen and louder the nearer your light is
// (hot / cold). A found one rings out twice, loud, and stops: no answer. Quiet, under the song. (Its own little WebAudio
// graph because the shared sfx.mjs has no panning; it follows the game's mute button.)
export const modeView = ({ C, cam }) => {
  const P = prep(C); look.cam = cam; look.C = C;
  let ac = null, out = null, lastB = -1, lastFound = null, lastPk = null, lastCall = null;
  const SILENT = typeof location !== 'undefined' && /[?&]silent/.test(location.search);
  function ctx() { if (SILENT) return null; if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); out = ac.createGain(); out.gain.value = 0.5; out.connect(ac.destination); } catch (e) { ac = null; } }
    const m = document.getElementById('mute'); if (out) out.gain.value = m && /off/.test(m.textContent) ? 0 : 0.5; if (ac && ac.state === 'suspended') ac.resume().catch(() => {}); return ac; }
  function trill(pan, vol, at = 0, dur = 0.34, f = 1180) {   // a phone's ring: two close tones, warbling at ~18 Hz
    const a = ctx(); if (!a || vol <= 0.001) return; const t0 = a.currentTime + at, g = a.createGain(), p = a.createStereoPanner ? a.createStereoPanner() : null, lfo = a.createOscillator(), lg = a.createGain();
    g.gain.value = 0; lfo.type = 'square'; lfo.frequency.value = 18; lg.gain.value = vol * 0.5; lfo.connect(lg); lg.connect(g.gain);
    g.gain.setValueAtTime(vol * 0.5, t0); g.gain.setValueAtTime(vol * 0.5, t0 + dur); g.gain.linearRampToValueAtTime(0, t0 + dur + 0.04);
    for (const ff of [f, f * 1.12]) { const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = ff; o.connect(g); o.start(t0); o.stop(t0 + dur + 0.06); }
    lfo.start(t0); lfo.stop(t0 + dur + 0.06); if (p) { p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(out); } else g.connect(out); }
  return {
    draw(f) {
      const { s, t } = f, b = gbeat(C, t), bi = Math.floor(b);
      if (s.foundAt != null && s.foundAt !== lastFound) { lastFound = s.foundAt; const p = P.things[s.foundId], fx = frameX(C, P, t), o = p ? posOf(C, P, p, t) : null, pan = o ? ((o.x - fx) / VW - 0.5) * 1.6 : 0;
        trill(pan, 0.11, 0.0, 0.42); trill(pan, 0.08, GB(C) * 2, 0.42); }                 // it rings out — no answer — and stops
      if (s.pkAt != null && s.pkAt !== lastPk) { lastPk = s.pkAt; }
      if (s.callAt != null && s.callAt !== lastCall) { lastCall = s.callAt; }
      if (bi !== lastB && t > 0.2) { lastB = bi;
        const fx = frameX(C, P, t), cx = fx + s.bx, ring = [];
        for (const p of P.things) { if (p.kind === 'pk' || !live(C, P, s, p, t)) continue; const per = p.every || 2; if ((bi + (p.ph || 0)) % per) continue;
          const o = posOf(C, P, p, t); ring.push({ pan: ((o.x - fx) / VW - 0.5) * 1.6, d: Math.hypot(o.x - cx, o.y - s.by), big: p.kind === 'booth' }); }
        ring.sort((a, c) => a.d - c.d);
        for (const r of ring.slice(0, 3)) trill(r.pan, (r.big ? 0.09 : 0.02) + 0.07 * clamp(1 - r.d / 6), 0, r.big ? 0.5 : 0.34, r.big ? 980 : 1180);
      }
      void cam;
    },
    over() {},
  };
};
