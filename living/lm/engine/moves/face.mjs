// face.mjs — his live face: lids, pupils, the one brow, the nose line, and whole-face swaps. Character animator (seat 2).
//
// THE RULE (One Overshoot's, kept): at lids 0, gaze 0, brow 0, jaw 0, expr canon this file paints NOTHING and hands the model
// back its own untouched face texture. Rest is the canon picture by construction, not by care.
//
// How: the canon face texture (potato3d/face-canon.png, read through the model's own material, never from disk) is cut once
// into its parts by looking at it: each eye is one ink blob = a white, a pupil jammed in the outer corner, and a flat lid
// stroke on top; the brow and the nose line are blobs of their own. A pose is then made from HIS OWN PIXELS, moved:
//   lid   0 canon half-lid · 1 shut (the lid stroke rides down over the eye) · -1 wide (rides up, the white follows it; round 3: 0.32 of the eye, was 0.22, so wide reads at 100 px)
//   gx    0 home (the corner) · -0.5 at you · -1 the far corner. The pupil is his canon pupil slid along the eye and cut by it.
//   gy    pupils down (+) / up (-)        brow  the high brow up (+) / down (-)        jaw  the nose line bobs (he has no mouth line)
//   expr  one of the drawn faces in ./faces, swapped whole, never cross-faded; lids and gaze are only painted on canon.
// Nothing here is drawn with a brush: no new line, no new colour, no white that was not his.
// Cost: a repaint touches a 366 x 262 patch and happens only when a quantised value changes (a blink is about 8 repaints).
import { IDX } from '../channels.mjs';

export const EXPRS = ['canon', 'shock', 'scream', 'startled', 'deadpan', 'oh'];
const RX0 = 372, RY0 = 96, RW = 372, RH = 272;          // the patch of the 1024 x 512 texture that holds every feature
const INK = [14, 6, 3];
const FILES = { shock: 'shock-home' };       // round 3 (Potato seat): the shock face with its pupils pushed to his home side. A derived copy; face-shock.png is untouched.

function analyse(image) {
  const cv = document.createElement('canvas'); cv.width = image.width; cv.height = image.height;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(image, 0, 0);
  const src = g.getImageData(RX0, RY0, RW, RH).data, N = RW * RH, lab = new Int16Array(N);
  // blobs (4-connected, anything with alpha)
  const blobs = []; const stack = new Int32Array(N);
  for (let i = 0; i < N; i++) { if (lab[i] || src[i * 4 + 3] <= 20) continue; let n = 0, sp = 0; const id = blobs.length + 1, b = { id, x0: 1e9, x1: -1, y0: 1e9, y1: -1, n: 0, white: 0 };
    stack[sp++] = i; lab[i] = id;
    while (sp) { const j = stack[--sp], x = j % RW, y = (j / RW) | 0; n++;
      if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
      if (src[j * 4 + 3] > 128 && Math.min(src[j * 4], src[j * 4 + 1], src[j * 4 + 2]) > 150) b.white++;
      if (x > 0 && !lab[j - 1] && src[(j - 1) * 4 + 3] > 20) { lab[j - 1] = id; stack[sp++] = j - 1; }
      if (x < RW - 1 && !lab[j + 1] && src[(j + 1) * 4 + 3] > 20) { lab[j + 1] = id; stack[sp++] = j + 1; }
      if (y > 0 && !lab[j - RW] && src[(j - RW) * 4 + 3] > 20) { lab[j - RW] = id; stack[sp++] = j - RW; }
      if (y < RH - 1 && !lab[j + RW] && src[(j + RW) * 4 + 3] > 20) { lab[j + RW] = id; stack[sp++] = j + RW; } }
    b.n = n; blobs.push(b); }
  const big = blobs.filter(b => b.n > 60), eyes = big.filter(b => b.white > 80).sort((a, b) => a.x0 - b.x0), rest = big.filter(b => b.white <= 80);
  if (eyes.length !== 2) return null;                    // not the face we know: paint nothing, ever
  const eyeTop = Math.min(eyes[0].y0, eyes[1].y0), eyeBot = Math.max(eyes[0].y1, eyes[1].y1);
  const brow = rest.filter(b => b.y1 < eyeTop + 40 && b.y0 < eyeTop).sort((a, b) => b.n - a.n)[0] || null;
  const nose = rest.filter(b => b.y0 > eyeBot - 20).sort((a, b) => b.n - a.n)[0] || null;
  // each eye: the lid's lower edge as a straight line (fitted on the top of the white), then white / pupil / lid stroke
  const kind = new Uint8Array(N);                        // 1 white, 2 pupil, 3 lid stroke, 4 brow, 5 nose
  const E = eyes.map(b => {
    // the lid stroke's TOP edge is straight: fit it on the inner part of the blob, then drop it by the stroke's thickness
    // (measured where white sits right under the stroke). That is the lid's lower edge, carried on over the pupil.
    const top = []; for (let x = b.x0; x <= b.x1; x++) for (let y = b.y0; y <= b.y1; y++) if (lab[y * RW + x] === b.id && src[(y * RW + x) * 4 + 3] > 128) { top.push([x, y]); break; }
    const a0 = Math.floor(top.length * 0.12), a1 = Math.ceil(top.length * 0.6); let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let i = a0; i < a1; i++) { const [x, y] = top[i]; n++; sx += x; sy += y; sxx += x * x; sxy += x * y; }
    const m = (n * sxy - sx * sy) / (n * sxx - sx * sx), c0 = (sy - m * sx) / n, th = [];
    for (let x = b.x0; x <= b.x1; x++) for (let y = b.y0; y <= b.y1; y++) { const j = y * RW + x; if (lab[j] === b.id && src[j * 4 + 3] > 128 && Math.min(src[j * 4], src[j * 4 + 1], src[j * 4 + 2]) > 150) { th.push(y - (m * x + c0)); break; } }
    th.sort((p, q) => p - q); const thick = th[Math.floor(th.length * 0.25)] || 10, c = c0 + thick - 1, line = x => m * x + c;
    let hmax = 0, px0 = 1e9, px1 = -1, ex0 = 1e9, ex1 = -1; const bottom = new Float32Array(RW).fill(-1);
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const j = y * RW + x; if (lab[j] !== b.id) continue;
      const lum = (src[j * 4] + src[j * 4 + 1] + src[j * 4 + 2]) / 3, below = y > line(x) + 0.5;
      if (lum > 128 && src[j * 4 + 3] > 60) kind[j] = 1; else if (below) { let run = 1; for (let yy = y - 1; yy > line(x) + 0.5 && lab[yy * RW + x] === b.id && (src[(yy * RW + x) * 4] + src[(yy * RW + x) * 4 + 1] + src[(yy * RW + x) * 4 + 2]) / 3 <= 128; yy--) run++; for (let yy = y + 1; yy < RH && lab[yy * RW + x] === b.id && (src[(yy * RW + x) * 4] + src[(yy * RW + x) * 4 + 1] + src[(yy * RW + x) * 4 + 2]) / 3 <= 128; yy++) run++; kind[j] = run >= 7 ? 2 : 6; } else kind[j] = 3;
      if (kind[j] !== 3) { if (y > bottom[x]) bottom[x] = y; if (x < ex0) ex0 = x; if (x > ex1) ex1 = x; if (y - line(x) > hmax) hmax = y - line(x); }
      if (kind[j] === 2) { if (x < px0) px0 = x; if (x > px1) px1 = x; } }
    return { id: b.id, x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, line, m, hmax, ex0, ex1, px0, px1, bottom, travel: Math.max(4, (px0 - ex0) * 0.94) };
  });
  if (brow) for (let y = brow.y0; y <= brow.y1; y++) for (let x = brow.x0; x <= brow.x1; x++) if (lab[y * RW + x] === brow.id) kind[y * RW + x] = 4;
  if (nose) for (let y = nose.y0; y <= nose.y1; y++) for (let x = nose.x0; x <= nose.x1; x++) if (lab[y * RW + x] === nose.id) kind[y * RW + x] = 5;
  // round 3 (A2, the seam): the white, the pupil and the lid stroke were drawn as layers, so INSIDE the eye there are see-through
  // pixels where two of them meet. At rest that is his own picture. The moment a pupil slides, skin shows through as a tan line.
  // inner = an eye pixel with nothing but eye for 2 px around it: painted solid whenever the eye is repainted. The outer edge keeps its soft alpha.
  const inner = new Uint8Array(N);
  for (const e of E) for (let y = e.y0 + 2; y <= e.y1 - 2; y++) for (let x = e.x0 + 2; x <= e.x1 - 2; x++) { const j = y * RW + x; if (lab[j] !== e.id) continue; let ok = 1;
    for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (lab[j + dy * RW + dx] !== e.id) { ok = 0; break; } inner[j] = ok; }
  for (const e of E) { let n = 0; for (let y = e.y0; y <= e.y1; y++) for (let x = e.x0; x <= e.x1; x++) if (lab[y * RW + x] === e.id && kind[y * RW + x] === 2) n++; e.pupN = n; }
  return { src, lab, kind, inner, eyes: E, brow, nose, whiteRGB: [240, 240, 238] };
}

export function createFace(ctx) {
  const { T, channels: ch, rig } = ctx;
  const F = []; let M = null, tried = false; const imgs = new Map();     // expr name -> { tex } once loaded
  const stats = { repaints: 0, uploads: 0, swaps: 0, usable: null };
  const q = (v, n) => Math.round(v * n) / n;

  function loadExpr(name, like) {
    if (imgs.has(name)) return imgs.get(name);
    const rec = { tex: null }; imgs.set(name, rec);
    const im = new Image(); im.onload = () => { const t = new T.Texture(im); copyProps(t, like); t.needsUpdate = true; rec.tex = t; };
    im.src = new URL('./faces/face-' + (FILES[name] || name) + '.png', import.meta.url).href; return rec;
  }
  function copyProps(t, like) { t.colorSpace = like.colorSpace; t.anisotropy = like.anisotropy; t.flipY = like.flipY; t.wrapS = like.wrapS; t.wrapT = like.wrapT; t.minFilter = like.minFilter; t.magFilter = like.magFilter; t.generateMipmaps = like.generateMipmaps; }

  // one eye into the patch `out` (RGBA, already holding the canon patch with this eye's blob rubbed out)
  function paintEye(out, e, lid, gx, gy) {
    const { src, kind, lab } = M, d = lid >= 0 ? lid * 0.86 * e.hmax : lid * 0.32 * e.hmax, shut = lid >= 0.94;
    const tx = Math.round(gx * e.travel), ty = Math.round(gy * 0.28 * e.hmax), W = M.whiteRGB;
    const yA = Math.max(0, e.y0 - Math.ceil(0.36 * e.hmax) - 2), yB = Math.min(RH - 1, e.y1 + Math.ceil(e.hmax) + 2);
    if (!shut) for (let y = yA; y <= yB; y++) for (let x = e.ex0; x <= e.ex1; x++) {
      const j = y * RW + x, ly = e.line(x); let inE = false, alpha = 255;
      if (lab[j] === e.id && kind[j] !== 3 && kind[j] !== 0) { inE = y > ly + d; alpha = M.inner[j] ? 255 : src[j * 4 + 3]; }
      else if (d < 0 && e.bottom[x] > ly + 0.3 * e.hmax && y > ly + d && y <= ly + 5) inE = true;        // wide: the white follows the lid up
      if (!inE) continue;
      // is the slid pupil here? (his canon pupil, moved; above the canon lid line it is carried straight up)
      let sxp = x - tx, syp = y - ty, pup = false;
      if (sxp >= 0 && sxp < RW) { if (syp <= e.line(sxp) + 1.5 && d < 0) syp = Math.ceil(e.line(sxp) + 2); if (syp >= 0 && syp < RH) { const k = syp * RW + sxp; pup = lab[k] === e.id && kind[k] === 2; if (!pup && ty > 0) { const k2 = y * RW + sxp; pup = lab[k2] === e.id && kind[k2] === 2; } } }   // looking down: the pupil keeps touching the lid (no white strip above it)
      const o = j * 4; if (pup) { out[o] = INK[0]; out[o + 1] = INK[1]; out[o + 2] = INK[2]; } else if (lab[j] === e.id && (kind[j] === 1 || (kind[j] === 6 && tx === 0 && ty === 0)) && !(M.inner[j] && src[o + 3] < 250)) { out[o] = src[o]; out[o + 1] = src[o + 1]; out[o + 2] = src[o + 2]; } else { out[o] = W[0]; out[o + 1] = W[1]; out[o + 2] = W[2]; } out[o + 3] = alpha;
    }
    // the lid stroke, his own pixels, riding down (or up) by d
    const dy = Math.round(d);
    for (let y = e.y0; y <= e.y1; y++) for (let x = e.x0; x <= e.x1; x++) { const j = y * RW + x; if (lab[j] !== e.id || kind[j] !== 3) continue; const yy = y + dy; if (yy < 0 || yy >= RH) continue;
      const lum = (src[j * 4] + src[j * 4 + 1] + src[j * 4 + 2]) / 3, a = (M.inner[j] ? 1 : src[j * 4 + 3] / 255) * (1 - Math.min(1, lum / 235)), o = (yy * RW + x) * 4, ia = 1 - a, oa = out[o + 3] / 255;
      const na = a + oa * ia; if (na <= 0) continue;
      out[o] = (INK[0] * a + out[o] * oa * ia) / na; out[o + 1] = (INK[1] * a + out[o + 1] * oa * ia) / na; out[o + 2] = (INK[2] * a + out[o + 2] * oa * ia) / na; out[o + 3] = na * 255; }
  }
  // round 3 (BLANK EYES, Potato seat): how much of his pupil would show in this pose, counted, not guessed
  function pupilShown(e, lid, gx, gy) { const { kind, lab } = M, d = lid >= 0 ? lid * 0.86 * e.hmax : lid * 0.32 * e.hmax, tx = Math.round(gx * e.travel), ty = Math.round(gy * 0.28 * e.hmax); let n = 0;
    for (let y = e.y0; y <= e.y1; y++) for (let x = e.ex0; x <= e.ex1; x++) { const j = y * RW + x; if (lab[j] !== e.id || kind[j] === 3 || kind[j] === 0 || y <= e.line(x) + d) continue;
      const sxp = x - tx, syp = y - ty; if (sxp < 0 || sxp >= RW || syp < 0 || syp >= RH) continue; const k = syp * RW + sxp; if (lab[k] === e.id && kind[k] === 2) n++; } return n; }
  function moveBlob(out, b, k, dx, dy, flat = 0) {     // a whole blob (brow, nose line), his own pixels, moved (flat: pressed toward its own lowest row)
    const { src, kind } = M;
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const j = y * RW + x; if (kind[j] !== k) continue; const xx = x + dx, yy = (flat ? b.y1 - Math.round((b.y1 - y) * (1 - 0.78 * flat)) : y) + dy; if (xx < 0 || xx >= RW || yy < 0 || yy >= RH) continue;
      const a = src[j * 4 + 3] / 255, o = (yy * RW + xx) * 4, ia = 1 - a, oa = out[o + 3] / 255, na = a + oa * ia; if (na <= 0) continue;
      out[o] = (src[j * 4] * a + out[o] * oa * ia) / na; out[o + 1] = (src[j * 4 + 1] * a + out[o + 1] * oa * ia) / na; out[o + 2] = (src[j * 4 + 2] * a + out[o + 2] * oa * ia) / na; out[o + 3] = na * 255; }
  }
  function paint(f, P) {
    const out = f.patch.data, { src, kind, lab, eyes } = M; out.set(src);
    const eyeMoved = [P.lidL !== 0 || P.gx !== 0 || P.gy !== 0 || P.browL !== 0, P.lidR !== 0 || P.gx !== 0 || P.gy !== 0];
    const flat = M.brow ? (P.flat || 0) : 0, browDy = M.brow ? -Math.round(P.browR * 0.42 * eyes[1].hmax) : 0, noseDy = M.nose ? Math.round(P.jaw * 5) : 0;
    // BLANK EYES: with the lids anywhere short of a blink, at least half of the pupil he would show at home under those lids stays in sight.
    // If the pose would lose it, the gaze gives way (first up/down, then sideways). Both eyes share one gaze.
    let gx = P.gx, gy = P.gy; const lids = [Math.max(-1, Math.min(1, P.lidL - 0.25 * P.browL)), P.lidR];
    if (gx || gy) for (let t = 0; t < 6; t++) { let ok = true; for (let i = 0; i < 2; i++) { if (lids[i] >= 0.7) continue; if (pupilShown(eyes[i], lids[i], gx, gy) < 0.5 * pupilShown(eyes[i], lids[i], 0, 0)) ok = false; }
      if (ok) break; if (Math.abs(gy) > 0.04) gy *= 0.5; else { gy = 0; gx *= 0.8; } stats.gave = (stats.gave || 0) + 1; }
    for (let j = 0; j < RW * RH; j++) { const k = kind[j], l = lab[j];
      if ((l === eyes[0].id && eyeMoved[0]) || (l === eyes[1].id && eyeMoved[1]) || (k === 4 && (browDy || flat)) || (k === 5 && noseDy)) out[j * 4 + 3] = 0; }
    if (eyeMoved[0]) paintEye(out, eyes[0], lids[0], gx, gy);    // his low brow IS that lid: it lifts with it
    if (eyeMoved[1]) paintEye(out, eyes[1], lids[1], gx, gy);
    if (browDy || flat) moveBlob(out, M.brow, 4, 0, Math.min(browDy, 6), flat);          // down at most 6 px: it never sits on the lid
    if (noseDy) moveBlob(out, M.nose, 5, 0, noseDy);
    f.g.putImageData(f.patch, RX0, RY0); stats.repaints++;
  }

  const face = {
    name: 'face', stats, EXPRS,
    add(p) {
      const mat = p.api && p.api.body && p.api.body.material, orig = mat && mat.uniforms && mat.uniforms.face && mat.uniforms.face.value;
      if (!orig || !orig.image) { F[p.slot] = null; return; }
      if (!tried) { tried = true; try { M = analyse(orig.image); } catch (e) { M = null; } stats.usable = !!M; }
      if (!M) { F[p.slot] = null; return; }
      const cv = document.createElement('canvas'); cv.width = orig.image.width; cv.height = orig.image.height;
      const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(orig.image, 0, 0);
      const tex = new T.CanvasTexture(cv); copyProps(tex, orig);
      F[p.slot] = { orig, cv, g, tex, patch: g.createImageData(RW, RH), key: '0', shown: 'orig', expr: 0, P: { lidL: 0, lidR: 0, gx: 0, gy: 0, browL: 0, browR: 0, jaw: 0, flat: 0 } };
      for (const n of EXPRS) if (n !== 'canon') loadExpr(n, orig);
    },
    /** A PICKED POTATO'S OWN RESTING FACE (Nov 13 2026, for pick a potato: the one who steps out wears the face on his card). The live eyes (blinks, glances)
     *  are painted from measurements of the canon face, so they would paint Potato's eyes onto another face; with his own face on, they stand down and the
     *  drawn face is held. Whole drawn expressions from moves still swap in and come back to it. Pass null to give him the canon face back. */
    rest(slot, tex) { const f = F[slot]; if (!f) return false; if (!tex) { if (f.canon) f.orig = f.canon; f.fixed = false; f.shown = ''; f.key = ''; return true; }
      if (!f.canon) f.canon = f.orig; copyProps(tex, f.canon); tex.needsUpdate = true; f.orig = tex; f.fixed = true; f.shown = ''; f.key = ''; return true; },
    remove(p) { const f = F[p.slot]; if (f) { rig.setFace(p.slot, f.orig); f.tex.dispose(); } F[p.slot] = null; },
    /** what is on his face right now (for tests and strips) */
    state(slot) { const f = F[slot]; return f ? { ...f.P, expr: EXPRS[f.expr], shown: f.shown } : null; },
    step(p) {
      const s = p.slot, f = F[s]; if (!f) return;
      // the animator's own face values when her player is in (so a later writer of the channels cannot blank a blink); else the channels
      const o = ctx.moves && ctx.moves.faceOut ? ctx.moves.faceOut(s) : null, get = n => (o ? o[n] : ch.get(s, IDX[n]));
      const P = f.P, lidL = q(get('lidL'), 16), lidR = q(get('lidR'), 16), gxr = get('gx'), gyr = get('gy');
      // pupils: inside +-0.045 of home they ARE home (the canon picture, untouched). No painted pupil ever sits a hair off canon.
      const gx = Math.abs(gxr) < 0.045 ? 0 : q(Math.max(-0.8, Math.min(0, gxr)), 28), gy = Math.abs(gyr) < 0.06 ? 0 : q(Math.max(-0.3, Math.min(0.5, gyr)), 12);
      const browL = q(get('browL'), 10), browR = q(get('browR'), 14), jaw = q(Math.max(0, Math.min(1, get('jaw'))), 5), flat = o && o.flat ? q(Math.max(0, Math.min(1, o.flat)), 4) : 0;
      const ex = Math.max(0, Math.min(EXPRS.length - 1, Math.round(get('expr'))));
      if (ex !== 0) {                                  // a drawn face, whole. (moves only swap under shut lids or inside a contact)
        const rec = imgs.get(EXPRS[ex]); if (rec && rec.tex && f.shown !== EXPRS[ex]) { rig.setFace(s, rec.tex); f.shown = EXPRS[ex]; stats.swaps++; }
        f.expr = ex; f.key = 'x'; return; }
      f.expr = 0;
      if (f.fixed) { if (f.shown !== 'orig') { rig.setFace(s, f.orig); f.shown = 'orig'; } return; }   // (a picked Potato: his own resting face, held; see rest())
      const key = lidL + ',' + lidR + ',' + gx + ',' + gy + ',' + browL + ',' + browR + ',' + jaw + ',' + flat;
      if (key === f.key) return; f.key = key;
      P.lidL = lidL; P.lidR = lidR; P.gx = gx; P.gy = gy; P.browL = browL; P.browR = browR; P.jaw = jaw; P.flat = flat;
      if (!lidL && !lidR && !gx && !gy && !browL && !browR && !jaw && !flat) { if (f.shown !== 'orig') { rig.setFace(s, f.orig); f.shown = 'orig'; } return; }
      paint(f, P); f.tex.needsUpdate = true; stats.uploads++;
      if (f.shown !== 'live') { rig.setFace(s, f.tex); f.shown = 'live'; }
    },
    /** probe P1: a sheet of poses painted flat (not on the model) on his skin colour. Returns a PNG data URL. */
    sheet(poses, scale = 2) {
      const f = F.find(Boolean); if (!f) return null;
      const cols = Math.min(poses.length, 6), rows = Math.ceil(poses.length / cols), cv = document.createElement('canvas'); cv.width = cols * RW * scale; cv.height = rows * RH * scale;
      const g = cv.getContext('2d'); g.fillStyle = '#da9643'; g.fillRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = true;
      const tmp = document.createElement('canvas'); tmp.width = RW; tmp.height = RH; const tg = tmp.getContext('2d'), keep = f.patch;
      poses.forEach((P, i) => { f.patch = tg.createImageData(RW, RH); const full = { lidL: 0, lidR: 0, gx: 0, gy: 0, browL: 0, browR: 0, jaw: 0, flat: 0, ...P };
        const out = f.patch.data, g0 = f.g; f.g = { putImageData() {} }; paint(f, full); f.g = g0; tg.putImageData(f.patch, 0, 0);
        g.drawImage(tmp, (i % cols) * RW * scale, Math.floor(i / cols) * RH * scale, RW * scale, RH * scale); void out; });
      f.patch = keep; f.key = '?'; return cv.toDataURL('image/png');
    },
  };
  return face;
}
