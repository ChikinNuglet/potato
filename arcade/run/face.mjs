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
h0ld—¦<HTTP 503?>¦0xBABE~¦0xAC1D?!¦ERR:418¦:_:#¦[EINTR]¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦
think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦0xBABE~¦__%__¦#//?!¦0xAC1D?!¦0xB00_7¦
__%__¦#//?!¦^^::#¦~//~¦__%__¦%_?!%¦[HTTP_404]¦[E_EGO_CACHE_STALE]¦cycl_e//¦krrzzt¦88::13
░▒▓█ */
// face.mjs — Potato's face reacts (Chikin: no lip-sync; "he should have expressions when he jumps, gets hit, uses a power").
// The expressions are Vega's, from the drawn model, unwrapped onto the 3D face map (draw/faceexpr.py -> play/faces/).
// At rest: the canon side-eye, with blinks. Events swap in an expression for a moment, then he settles back.
import * as T from '../play/vendor/three.module.js';
export const EXPRESSIONS = ['smirk', 'angry', 'shock', 'wide', 'scream', 'thinking', 'question', 'sleepy', 'startled',
  // Chat's 14 (Nov 1, from-chat/Potato_Expressions_14_v1 → draw/faceexpr_chat.py; shine dots filled — his pupils are solid):
  'determined', 'sneaky', 'toy', 'awe', 'proud', 'warm', 'sad', 'oh', 'dizzy', 'focused', 'grin', 'rest', 'joy', 'deadpan'];
const loadImg = src => new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = bad; im.src = src; });

export async function createLiveFace(spud, base) {
  const [canon, ...faces] = await Promise.all([loadImg(base + 'face-canon.png'), ...EXPRESSIONS.map(n => loadImg(base + `faces/face-${n}.png`).catch(() => null))]);
  const F = Object.fromEntries(EXPRESSIONS.map((n, i) => [n, faces[i]]));
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.NoColorSpace; spud.setFace(tex);
  let cur = null, until = 0, rest = null, lastKey = '', nextBlink = 2, blinkUntil = 0;
  function paint(name, blink) {
    x.clearRect(0, 0, 1024, 512);
    if (name && F[name]) { x.drawImage(F[name], 0, 0); tex.needsUpdate = true; return; }
    x.drawImage(canon, 0, 0);
    if (blink) {                                   // lids down: skin over the canon eyes, a dark lash line
      x.fillStyle = '#d9934a';
      x.beginPath(); x.ellipse(462, 268, 66, 44, -0.1, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(640, 240, 88, 46, -0.1, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#120a05'; x.lineWidth = 13; x.lineCap = 'round';
      x.beginPath(); x.moveTo(404, 268); x.quadraticCurveTo(462, 290, 520, 262); x.stroke();
      x.beginPath(); x.moveTo(562, 238); x.quadraticCurveTo(640, 262, 722, 226); x.stroke();
    }
    tex.needsUpdate = true;
  }
  return {
    // show an expression for `dur` song-seconds (a stronger one replaces a weaker one; the same one extends)
    show(name, t, dur = 0.5) { cur = name; until = t + dur; },
    setRest(name) { rest = name || null; },
    now() { return cur || rest; },                    // (the face showing now: ?blank&nopotato writes it into the movie's data)          // what he looks like between events (e.g. sleepy when the meter is low)
    update(t, clock = performance.now() / 1000) {
      if (cur && t >= until) cur = null;
      if (t < until - 5) cur = null;                 // the song restarted
      const name = cur || rest;
      if (clock > nextBlink) { blinkUntil = clock + 0.12; nextBlink = clock + 2.2 + Math.random() * 3.2; }
      const blink = !name && clock < blinkUntil, key = (name || '') + blink;
      if (key !== lastKey) { lastKey = key; paint(name, blink); }
    },
    reset() { cur = null; until = 0; rest = null; lastKey = ''; paint(null, false); },
  };
}
