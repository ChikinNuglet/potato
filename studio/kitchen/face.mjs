// face.mjs — Potato's face reacts (Matt: no lip-sync; "he should have expressions when he jumps, gets hit, uses a power").
// The expressions are Vega's, from the drawn model, unwrapped onto the 3D face map (draw/faceexpr.py -> play/faces/).
// At rest: the canon side-eye, with blinks. Events swap in an expression for a moment, then he settles back.
import * as T from '../lib/vendor/three.module.js';
export const EXPRESSIONS = ['smirk', 'angry', 'shock', 'wide', 'scream', 'thinking', 'question', 'sleepy', 'startled',
  // Chat's 14 (Nov 1, from-chat/Potato_Expressions_14_v1 → draw/faceexpr_chat.py; shine dots filled — his pupils are solid):
  'determined', 'sneaky', 'toy', 'awe', 'proud', 'warm', 'sad', 'oh', 'dizzy', 'focused', 'grin', 'rest', 'joy', 'deadpan'];
const loadImg = src => new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = bad; im.src = src; });

export async function createLiveFace(spud, base) {
  const [canon, ...faces] = await Promise.all([loadImg(base + 'face-canon.png'), ...EXPRESSIONS.map(n => loadImg(base + `faces/face-${n}.png`).catch(() => null))]);
  const F = Object.fromEntries(EXPRESSIONS.map((n, i) => [n, faces[i]]));
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.NoColorSpace; spud.setFace(tex);
  let mask = false, cur = null, until = 0, rest = null, lastKey = '', nextBlink = 2, blinkUntil = 0;
  function paint(name, blink) {
    x.clearRect(0, 0, 1024, 512);
    if (mask) { x.fillStyle = '#17161c'; x.beginPath(); x.moveTo(352, 232); x.quadraticCurveTo(450, 170, 556, 190); x.quadraticCurveTo(650, 150, 770, 176); x.lineTo(782, 262); x.quadraticCurveTo(690, 330, 590, 276); x.quadraticCurveTo(556, 262, 530, 292); x.quadraticCurveTo(440, 362, 362, 318); x.closePath(); x.fill(); }
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
    setMask(on) { if (on !== mask) { mask = on; lastKey = '~'; } },
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
    addFace(name, img) { if (img && !F[name]) F[name] = img; },   // CAVE (Nov 7): extra faces a room brings along (the cave's brow waggle: sneaky with his brows lifted)
  };
}
