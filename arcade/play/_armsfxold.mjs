// armsfx.mjs — when his arms come out, in every level and in the kitchen (Nov 1).
// Chikin: "he should have arms whenever he jumps around and spins around, and you can use them when it makes sense for the
// story. Give him some dance moves" + "they should disappear when hes just standing still or waddling".
//   · standing / waddling / ducking: NO arms (not even folded). They retract into him (len -> 0 inside his body).
//   · every jump: they pop out and swing up, then follow the arc (up on the way up, out wide at the top, trailing up as he
//     falls); they go back into him when he lands.
//   · every spin (his yaw racing round, whatever started it): straight out, whipping round with it (the tips lag the turn).
//   · a flight (Last Lights' glitch-flight): up on the rise, out wide at the top, floating on the way down.
//   · a dance (a dance cutscene, the end of a song, the kitchen's disco): spud.dance on the beat.
//   · a gesture (sparingly, for the story): 'wave' | 'point' | 'shrug' | 'up' for a moment.
// Tapered, no hands, no joint line: all of that is spud3d.mjs (spud.arms / spud.dance). This file only says WHEN.
// One driver per spud (the kitchen and the levels share him). Per frame: a few compares; spud.arms() is only called on a
// change; while he's in the air the pose object is edited in place (spud reads it every frame, no new objects). Callers pass
// one reused options object (no garbage per frame).
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;

export function armsDriver(spud) {
  if (!spud || typeof spud.arms !== 'function') return { update() {}, reset() {}, gesture() {}, state: () => 'none' };
  if (spud.__armsDrv) return spud.__armsDrv;
  const L = { s: 0, f: 0, e: 0, ef: 0, len: 1, thick: 1 }, R = { s: 0, f: 0, e: 0, ef: 0, len: 1, thick: 1 }, POSE = { L, R };
  let on = 'none', gest = null, gestUntil = -1, last = 0, spunAt = -99, settle = false;
  // free arms (one shared POSE, edited in place): 'free:spin' | 'free:fly' | 'free:air'. Moving from one to another blends
  // (spud.arms snapshots where the arms are and eases to the live POSE), so a spin turning into a jump's arc never snaps.
  const free = (kind, blend) => { if (on !== kind) { spud.arms(POSE, on === 'none' ? blend : 0.12); on = kind; } };
  const set = (o, s, f, e, ef, len = 1.12) => { o.s = s; o.f = f; o.e = e; o.ef = ef; o.len = len; };
  const D = {
    // o: { t (s, any clock), air, vy (up +), vy0 (a full jump's take-off speed), fly: null | 0..1 through a flight (rise 0..0.35,
    //      top 0.35..0.55, down after), dance: move name | null, beat (beats, on the beat = integer), body (dance sways him),
    //      off: true = no arms at all (a vehicle, nobody on screen) }
    update(o) {
      const t = o.t ?? 0; last = t;
      if (o.off) return D.reset(false);
      if (o.dance) { if (on !== 'dance') on = 'dance'; spud.dance(o.dance, o.beat || 0, o.body === false ? NOBODY : BODY); return; }
      const Y = spud.state && spud.state.yaw, rem = Y ? Math.abs(Y.to - Y.x) : 0, yv = Y ? Y.v : 0;
      // a spin = the caller said so (spun()) and he's still most of the way round from it, or a turn far bigger than turning to
      // walk the other way / into a door (those stay armless: he's only waddling)
      // (settle: this turn doesn't count — he landed out of it, or it's the beat's own little spin on the ground — till it's done)
      if (settle && rem < 0.8) settle = false;
      const spinning = !settle && ((t - spunAt < 1.2 && t >= spunAt - 0.05 && rem > 0.8) || rem > 4.2);
      if (spinning) {   // straight out, whipping round: the tips lag the turn (one toward us, one away), a touch higher the faster he goes
        const w = clamp(yv * 0.045, -0.75, 0.75), up = Math.min(1, Math.abs(yv) / 16);
        set(R, 1.5 + 0.3 * up, -w, 0.12 + 0.25 * Math.abs(w), -0.4 * w); set(L, 1.5 + 0.3 * up, w, 0.12 + 0.25 * Math.abs(w), 0.4 * w);
        free('free:spin', 0.1); return; }
      if (o.fly != null) {   // the glitch-flight: up on the rise, out wide at the top, floating down
        const k = o.fly, fl = Math.sin(t * 9);
        if (k < 0.35) { set(R, 2.55, 0.2, 0.15, 0); set(L, 2.55, 0.2, 0.15, 0); }
        else if (k < 0.55) { set(R, 1.75 + 0.18 * fl, 0.25, 0.3 - 0.15 * fl, 0); set(L, 1.75 - 0.18 * fl, 0.25, 0.3 + 0.15 * fl, 0); }
        else { const g = Math.sin(t * 6); set(R, 2.15 + 0.2 * g, 0.3, 0.35 + 0.2 * g, 0.05); set(L, 2.15 - 0.2 * g, 0.3, 0.35 - 0.2 * g, 0.05); }
        free('free:fly', 0.14); return; }
      if (o.air) {   // a jump: swing up, then follow the arc
        const k = clamp((o.vy || 0) / (o.vy0 || 7), -1, 1), a = Math.abs(k);
        const s = k > 0 ? 2.05 + 0.55 * k : 2.05 + 0.4 * a, e = 0.38 - 0.24 * a, f = 0.22;
        set(R, s, f, e, 0.05); set(L, s, f, e, 0.05);
        free('free:air', 0.09); return; }
      if (gest && t < gestUntil) { if (on !== 'g:' + gest) { spud.arms(gest, 0.25); on = 'g:' + gest; } return; }
      gest = null;
      if (on !== 'none') { if (on === 'dance') spud.dance(null, 0, { blend: 0.22 }); else spud.arms('none', on.startsWith('free') ? 0.13 : 0.22); on = 'none'; }   // back into him
    },
    spun(t) { spunAt = t ?? last; settle = false; },   // a spin just started (whatever started it)
    // the turn he's in doesn't bring the arms out (he just landed out of a jump spin: arms back in on landing; or it's the
    // automatic beat spin while he waddles). Over once the turn is nearly done.
    settle() { spunAt = -99; settle = true; },
    // a story gesture for a moment (shown only while he's on the ground and not spinning; a jump or a spin wins)
    gesture(name, t, dur = 1.2) { gest = name; gestUntil = (t ?? last) + dur; },
    // straight back to nothing (a level / the kitchen opening or closing): now = no blend
    reset(now) { gest = null; spunAt = -99; settle = false; if (on === 'none') return; if (on === 'dance') spud.dance(null, 0, { blend: now ? 0.001 : 0.22 }); spud.arms('none', now ? 0 : 0.18); on = 'none'; },
    state: () => on,
  };
  spud.__armsDrv = D; return D;
}
const BODY = { body: true }, NOBODY = { body: false };
