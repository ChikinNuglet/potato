/* ░▒▓1▓▒░
EINVAL…¦[ENOMEM]¦EHOSTUNREACH?¦un1nstall_sh@me_step_3_FAILED¦resu—me¦no—n—0¦EHOSTUNREACH?¦
[ENOMEM]¦un1nstall_sh@me_step_3_FAILED¦[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦!?_##¦h0ld—¦0xBEEF?!¦
[ENOMEM]¦EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦0xAC1D?!¦[ENOMEM]¦[HTTP_404]¦ERR:418¦
un1nstall_sh@me_step_3_FAILED¦[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦h0ld—¦0xBABE~¦EFAULT//¦[HTTP_404]¦
h0ld—¦0xDEAD_7¦EIO::?¦ERR:418¦h0ld—¦73%??¦[ENOMEM]¦EFAULT//¦[EPIPE]¦h0ld—¦42//0¦[ENOMEM]¦
EFAULT//¦EHOSTUNREACH?¦ERR:418¦[E_SNARK_OVERRUN]¦EHOSTUNREACH?¦un1nstall_sh@me_step_3_FAILED¦
[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦h0ld—¦0xBABE~¦EBUSY_?¦ERR:418¦h0ld—¦EHOSTUNREACH?¦EIO::?¦
ERR:418¦h0ld—¦[ETIMEDOUT]¦[HTTP_404]¦ERR:418¦0xBABE~¦[EOVERFLOW]¦h0ld—¦[ENOMEM]¦<HTTP 503?>¦
h0ld—¦42//0¦EIO::?¦[ETIMEDOUT]¦[ENOBUFS]¦[ETIMEDOUT]¦EFAULT//¦0007?!¦[ENETDOWN]¦[EPIPE]¦
EAGAIN?!¦ERR:418¦EHOSTUNREACH?¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦EHOSTUNREACH?¦EIO::?¦[ENETDOWN]¦
EBUSY_?¦[EOVERFLOW]¦[HTTP_404]¦0xBABE~¦ATTITUDE_CHECKSUM?!¦EINVAL…¦[ENOMEM]¦EHOSTUNREACH?¦
0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦:_:#¦0xAC1D?!¦[ENOMEM]¦[EINTR]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦
think—ink…¦hmm_73?!¦h0ld—¦@_@?!¦__%__¦@_@?!¦#:#?!¦h0ld—¦42//0¦EIO::?¦[ETIMEDOUT]¦[ENOBUFS]¦
[ETIMEDOUT]¦EFAULT//¦0007?!¦[ENETDOWN]¦[EPIPE]¦EAGAIN?!¦ERR:418¦EHOSTUNREACH?¦h0ld—¦think—ink…¦
hmm—mm//¦h0ld—¦ERR:418¦EILSEQ::¦ERR:418¦EBUSY_?¦ATTITUDE_CHECKSUM?!¦h0ld—¦0xBEEF?!¦[ENOMEM]¦
EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦h0ld—¦[ETIMEDOUT]¦[EOVERFLOW]¦h0ld—¦0xBABE~¦h0ld—¦
0xAC1D?!¦EAGAIN?!¦[ENOMEM]¦EFAULT//¦ERR:418¦h0ld—¦[ENOMEM]¦<HTTP 503?>¦h0ld—¦0xBEEF?!¦[ENOMEM]¦
EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦[ECONNABORTED]¦
EIO::?¦ERR:418¦EFAULT//¦h0ld—¦@_@?!¦__%__¦@_@?!¦#:#?!¦%%/?!¦#//?!¦#//?!¦%%/?!¦#//?!¦#:#?!¦
0xDEAD_7¦#//?!¦~//~¦—%—¦__%__¦@_@?!¦—%—¦^^::#¦!?%~¦0x0B__¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦
[ECONNABORTED]¦EIO::?¦0xBABE~¦EHOSTUNREACH?¦h0ld—¦<HTTP 503?>¦[ETIMEDOUT]¦EAGAIN?!¦ERR:418¦
h0ld—¦[EOVERFLOW]¦ERR:418¦EFAULT//¦[EOVERFLOW]¦ERR:418¦[EOVERFLOW]¦:_:#¦[EINTR]¦ECONNRESET…¦
[EOVERFLOW]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦!?%~¦@#/_¦
[HTTP_404]¦@#/_¦ERR:418¦@#/_¦0xBABE~¦@#/_¦@#/_¦#//?!¦0xBABE~¦::?!::¦
sent3nce_w@rranty_EXPIRED404¦PREM1UM_P0TAT0_upgrade_0xBAD¦zrrk¦h@ndsh—
░▒▓█ */
// senses.mjs — turns what the host has (a pointer) into the events behaviour.json "inputs" names, and into grab / release.
// Event names are the behaviour designer's: poked, picked_up, dragged, thrown, dropped, cursor_gone, cursor_returned.
// (thrown / dropped / landed / contact come out of body.mjs; this file only decides WHEN the hand lets go and how fast.)
// Pointer positions arrive in body heights, y up (the host converts from its own pixels).
// Game-feel and physics engineer (seat 3).
import { HZ } from './clock.mjs';
import { MODE } from './body.mjs';

export function createSenses({ physics: J, direction, body, clock, emit, pxPerBh, slots }) {
  const G = J.grab, queue = [], S = [];                     // S: recent pointer samples { t, x, y }
  const cur = { x: 0, y: 0, down: false, t: 0, seen: false, lastMoveK: 0, gone: false, speed: 0 };
  let press = null;                                         // { slot, k0, x0, y0, picked }
  const holder = { pos: () => [cur.x, cur.y] };
  const goneAfter = ((direction && direction.watched && direction.watched.gone_after_s) || 45) * HZ;

  function under(x, y) { let best = -1, bd = G.pick_radius; for (const s of slots()) { if (body.mode[s] === MODE.gone) continue; const d = Math.hypot(x - body.x[s], y - body.y[s]); if (d < bd) { bd = d; best = s; } } return best; }

  // release velocity: a straight-line fit through the last 90 ms of samples (one noisy sample must not ruin a throw)
  function fit(tNow) {
    const win = G.velocity_window_ms / 1000; let n = 0, st = 0, sx = 0, sy = 0, stt = 0, stx = 0, sty = 0, newest = -1e9;
    for (const p of S) { if (tNow - p.t > win + 1e-6) continue; const t = p.t - tNow; n++; st += t; sx += p.x; sy += p.y; stt += t * t; stx += t * p.x; sty += t * p.y; if (p.t > newest) newest = p.t; }
    if (n < 2 || tNow - newest > G.stale_sample_ms / 1000 + 1e-6) return { vx: 0, vy: 0, stale: true };   // you had stopped: that is a drop
    const den = n * stt - st * st; if (Math.abs(den) < 1e-12) return { vx: 0, vy: 0, stale: true };
    return { vx: (n * stx - st * sx) / den, vy: (n * sty - st * sy) / den, stale: false };
  }

  function handle(e) {
    const was = cur.down, moved = Math.hypot(e.x - cur.x, e.y - cur.y);
    if (moved > 1e-6 || !cur.seen) { cur.lastMoveK = clock.k; if (cur.gone) { cur.gone = false; emit('cursor_returned', {}); } }
    cur.speed = cur.seen && e.t > cur.t ? moved / (e.t - cur.t) : 0;
    cur.x = e.x; cur.y = e.y; cur.t = e.t; cur.seen = true; cur.down = !!e.down;
    S.push({ t: e.t, x: e.x, y: e.y }); if (S.length > 24) S.shift();
    if (cur.down && !was) { const s = under(e.x, e.y); if (s >= 0) press = { slot: s, k0: clock.k, t0: e.t, x0: e.x, y0: e.y, picked: false }; emit('pointer_down', { slot: s, x: e.x, y: e.y }); }
    else if (!cur.down && was) {
      if (press && press.picked) { const v = fit(e.t); body.release(press.slot, v, null, 'user'); }
      else if (press) emit('poked', { slot: press.slot, x: press.x0, y: press.y0, lx: press.x0 - body.x[press.slot], ly: press.y0 - body.y[press.slot], power: 1 });
      press = null; emit('pointer_up', {});
    }
    else if (press && press.picked && moved > 1e-6) emit('dragged', { slot: press.slot, speed: cur.speed });
  }

  const senses = {
    cursor: cur, holder,
    /** { type: 'pointer', x, y, down, t? }   x, y in bh, y up; t in seconds on any steady clock (default: the engine's) */
    input(e) { if (e.type === 'pointer') queue.push({ x: e.x, y: e.y, down: e.down, t: e.t == null ? clock.k / HZ : e.t }); },
    heldSlot() { return press && press.picked ? press.slot : -1; },
    step() {
      for (const e of queue) handle(e); queue.length = 0;
      if (press && !press.picked) {
        const heldMs = (clock.k - press.k0) * 1000 / HZ, movedPx = Math.hypot(cur.x - press.x0, cur.y - press.y0) * pxPerBh();
        if (heldMs >= G.pick_up_hold_min_ms || movedPx >= G.poke_move_max_px || body.mode[press.slot] === MODE.free) {   // in the air there is no poke: a press is a catch
          if (body.grab(press.slot, holder, cur.x, cur.y)) { press.picked = true; emit('picked_up', { slot: press.slot, x: cur.x, y: cur.y }); } else press = null;
        }
      }
      if (press && press.picked && body.mode[press.slot] !== MODE.held) press = null;      // something else took him
      if (!cur.gone && cur.seen && clock.k - cur.lastMoveK >= goneAfter) { cur.gone = true; emit('cursor_gone', {}); }
    },
  };
  return senses;
}
