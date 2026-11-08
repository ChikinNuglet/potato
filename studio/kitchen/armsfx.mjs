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
// MOVE_ARMS: arms on jumps / spins / the glitch-flight. Off (Chikin, Nov 2 eve): arms only when he needs them — a story gesture or a dance.
const MOVE_ARMS = false;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x, sstep = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };

export function armsDriver(spud) {
  if (!spud || typeof spud.arms !== 'function') return { update() {}, reset() {}, gesture() {}, state: () => 'none' };
  if (spud.__armsDrv) return spud.__armsDrv;
  const L = { s: 0, f: 0, e: 0, ef: 0, len: 1, thick: 1 }, R = { s: 0, f: 0, e: 0, ef: 0, len: 1, thick: 1 }, POSE = { L, R };
  let on = 'none', gest = null, gestUntil = -1, last = 0, spunAt = -99, settle = false, airAt = -99, wasAir = false;
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
      // (motion pass, Nov 1: spud3d.mjs springs every arm number and feeds his body into them — drag, fling, flop, trailing tips;
      // this file only gives the intent + the timing: anticipation on take-off, the flop as he lands, then back in)
      // (a take-off = leaving the real ground: a flight ending while he's still up, or a freeze, isn't one)
      const oAir = !!o.air, air = oAir && o.fly == null, k = clamp((o.vy || 0) / (o.vy0 || 7), -1.5, 1.5);
      if (oAir && !wasAir) airAt = t; wasAir = oAir;
      if (spud.armsMotion) spud.armsMotion(air ? k : 0);
      if (o.dance) { if (on !== 'dance') on = 'dance'; spud.dance(o.dance, o.beat || 0, o.body === false ? NOBODY : BODY); return; }
      if (MOVE_ARMS) {   // (OFF since Nov 2 eve — Chikin: "No more arms when he jumps and spins in any level, potato can have arms when he needs arms")
      const Y = spud.state && spud.state.yaw, rem = Y ? Math.abs(Y.to - Y.x) : 0, yv = Y ? Y.v : 0, ta = t - airAt;
      // the first blink of every jump (a jump spin too, which is nearly every jump in the levels): out low and wound back
      // (anticipation; his own jump isn't held up — he's already rising), then flung into the arc / the spin
      if (air && ta >= 0 && ta < 0.06) { set(R, 0.3, 0.3, 0.6, 0.1); set(L, 0.3, 0.32, 0.62, 0.1); free('free:air', 0.09); return; }
      // a spin = the caller said so (spun()) and he's still most of the way round from it, or a turn far bigger than turning to
      // walk the other way / into a door (those stay armless: he's only waddling)
      // (settle: this turn doesn't count — he landed out of it, or it's the beat's own little spin on the ground — till it's done)
      if (settle && rem < 0.8) settle = false;
      const spinning = !settle && ((t - spunAt < 1.2 && t >= spunAt - 0.05 && rem > 0.8) || rem > 4.2);
      if (spinning) {   // out to the sides, a soft elbow; the spin itself flings them out and trails the tips (spud3d.mjs), easing back after;
        // spinning up off the ground they ride a little higher on the rise (the jump's arc, folded into the spin)
        const up = Math.min(1, Math.abs(yv) / 16), lift = air ? 0.3 * sstep(0, 0.7, k) : 0;
        set(R, 1.36 + 0.2 * up + lift, 0.1, 0.32, 0.08); set(L, 1.36 + 0.2 * up + lift, 0.12, 0.34, 0.1);
        free('free:spin', 0.1); return; }
      if (o.fly != null) {   // the glitch-flight: up on the rise, out wide at the top, floating down
        const k = o.fly, fl = Math.sin(t * 9);
        if (k < 0.35) { set(R, 2.55, 0.2, 0.15, 0); set(L, 2.55, 0.2, 0.15, 0); }
        else if (k < 0.55) { set(R, 1.75 + 0.18 * fl, 0.25, 0.3 - 0.15 * fl, 0); set(L, 1.75 - 0.18 * fl, 0.25, 0.3 + 0.15 * fl, 0); }
        else { const g = Math.sin(t * 6); set(R, 2.15 + 0.2 * g, 0.3, 0.35 + 0.2 * g, 0.05); set(L, 2.15 - 0.2 * g, 0.3, 0.35 - 0.2 * g, 0.05); }
        free('free:fly', 0.14); return; }
      if (o.air) {   // a jump (after the wind-back above): ONE arc — flung up on the rise, easing out wide as he slows over the top;
        // coming down the air lifts them again (spud3d.mjs: drag). Landing: spud.land kicks them down a little as they go back in
        const g = sstep(0, 0.7, k);
        set(R, 1.95 + 0.45 * g, 0.22, 0.44 - 0.12 * g, 0.06); set(L, 1.95 + 0.45 * g, 0.24, 0.46 - 0.12 * g, 0.06);
        free('free:air', 0.09); return; }
      }
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
    reset(now) { gest = null; spunAt = -99; settle = false; airAt = -99; wasAir = false;
      if (on === 'none') { if (now && spud.armsState && (spud.armsState() || {}).shown) spud.arms('none', 0); return; }   // (still tucking in: gone now)
      if (on === 'dance') spud.dance(null, 0, { blend: now ? 0.001 : 0.22 }); spud.arms('none', now ? 0 : 0.18); on = 'none'; },
    state: () => on,
  };
  spud.__armsDrv = D; return D;
}
const BODY = { body: true }, NOBODY = { body: false };
