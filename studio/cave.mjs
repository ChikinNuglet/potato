// cave.mjs: the potato cave. Chikin, Nov 7: "the theater in the kitchen tonight / i want to do his music videos here / its the potato cave".
// The way in is the trapdoor in the kitchen floor (kitchens.mjs, prop 'cave'): use it and he drops through into his own little cinema
// under the house. Dug out of the soil: roots in the ceiling, a string of warm bulbs, his old couch, a cable spool for a table, a screen,
// a VCR whose clock blinks 4:04, and his tapes on the shelf. Tap a tape (or ← →) and it goes in the VCR and plays; he watches and reacts.
// THE CHIPS (Chikin: "remember the potato chips"): a family-size bag on the table. He smiles at it, slow, looks right at you, eyebrows up
// and down, then hops over and eats the whole bag. Tap the bag (or E) for it; it also happens once on its own a little way into a video.
// The bag comes back (it's family size). The ladder under the hatch (or Esc / ↑) takes him back up to the kitchen.
// The lineup is cave/playlist.json ([{ title, file, poster }]) so Claude can add Chikin's works in progress later.
// Show it, don't label it: no signs. No hands; arms only when needed (none here). No white lines. Purple is his glitch only.
const LITE = matchMedia('(pointer: coarse)').matches, TAU = Math.PI * 2, INK = '#120a05';
const W = 1600, H = 900;
const SCREEN = { x: 700, y: 46, w: 840, h: 472 };          // the screen (16:9)
const SEAT = { x: 372, y: 716 }, TABLE = { x0: 610, x1: 910, top: 712 }, BAG = { x: 806, y: 708, w: 170, h: 220 };   // his seat (feet), the spool's top, the bag (bottom centre)
const SPOT = { x: 676, y: 712 };                            // where he lands on the table to eat
const HATCH = { x0: 262, x1: 482 };                         // the hatch in the ceiling over the couch (the way back up), the ladder under it
const VCR = { x: 1066, y: 549, w: 200, h: 46 };
const CAB = { x0: 976, x1: 1544, y0: 594, mid: 692 };       // the cabinet under the screen: the VCR on top, the tapes in its two shelves
const TAPES = { x0: 996, x1: 1502, y0: 606, y1: 786 };
const FEET = 0.844;                                         // where his feet sit in the square he's rendered into
const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const ez = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
const css = `#cave{position:fixed;left:0;right:0;bottom:0;top:calc(29px + env(safe-area-inset-top,0px));z-index:7;overflow:hidden;background:#0b0705;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;touch-action:none;-webkit-user-select:none;user-select:none}
#cave .box{position:relative;flex:none}#cave canvas{display:block;width:100%;height:100%;cursor:pointer}
#cave .gw{position:absolute;inset:0;pointer-events:none;overflow:hidden}#cave .gw span,#cave .burp{position:absolute;font:400 clamp(11px,1.5vw,18px) "Major Mono Display",monospace;color:#9a52ff;text-shadow:2px 0 #e03ccf,-2px 0 #2a0f63;transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none}
#cave .burp{animation:burp 1.6s steps(12) forwards}@keyframes burp{0%{opacity:0;translate:0 0}12%{opacity:1}70%{opacity:1}100%{opacity:0;translate:0 -60px}}
#cave .tapes{position:absolute;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:9% 3%;pointer-events:none}
#cave .tape{pointer-events:auto;position:relative;min-width:0;min-height:0;background:#1a1410;border:3px solid ${INK};border-radius:5px 7px 4px 6px;box-shadow:3px 4px 0 ${INK};overflow:hidden;padding:0;transition:translate 90ms steps(2)}
#cave .tape img{position:absolute;inset:0 0 34% 0;width:100%;height:66%;object-fit:cover;pointer-events:none}
#cave .tape b{position:absolute;left:0;right:0;bottom:0;height:34%;display:grid;place-items:center;text-align:center;background:#efe5cf;border-top:3px solid ${INK};color:${INK};font:400 clamp(6px,.6vw,11px)/1.05 "Major Mono Display",monospace;overflow:hidden;padding:0 2px;word-break:normal;overflow-wrap:normal;hyphens:none}
#cave .tape:nth-child(3n){rotate:-2deg}#cave .tape:nth-child(3n+1){rotate:1.5deg}#cave .tape:nth-child(4n+2){rotate:-.6deg}
#cave .tape.in{visibility:hidden}#cave .tape:active{translate:1px 3px;box-shadow:1px 1px 0 ${INK}}
@media(hover:hover){#cave .tape:hover{translate:0 -8px;box-shadow:3px 4px 0 ${INK},0 0 0 3px #ffd98a}}
#cave .tape:focus-visible{outline:3px solid #ffd98a;outline-offset:2px}
#cave.hello .tape{animation:hello .9s steps(6) both}@keyframes hello{0%{translate:0 0}40%{translate:0 -14px}100%{translate:0 0}}
#cave.tall{justify-content:flex-start;padding:8px 0 calc(12px + env(safe-area-inset-bottom,0px));overflow-y:auto;touch-action:pan-y}
#cave.tall .tapes{position:static;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none;gap:12px 14px;width:min(420px,calc(100vw - 32px));flex:none}#cave.tall .tape{aspect-ratio:16/11}#cave.tall .tape b{font-size:10px;line-height:1.15}
#cave.side{flex-direction:row;gap:12px}#cave.side .tapes{position:static;grid-template-columns:repeat(2,84px);grid-template-rows:none;gap:10px 8px;flex:none}#cave.side .tape{aspect-ratio:16/12}#cave.side .tape b{font-size:8px;line-height:1.1}
#cave>#mute{position:absolute;right:12px;top:12px;z-index:3}
#cave video{position:absolute;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none}`;

export function installCave({ T, renderer, scene, pivot, intro, fx, wordsHome, face, spud, sfx, glitch, walkable, music, muted }) {
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);
  let BROWS = false;   // (Reviewer: the brow-waggle faces; until they load the gag falls back to the old grin swap)
  if (face && face.addFace) Promise.all(['brows1', 'brows2'].map(n => new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok([n, im]); im.onerror = bad; im.src = 'cave/face-sneaky-' + n + '.png'; })))
    .then(r => { r.forEach(([n, im]) => face.addFace(n, im)); BROWS = true; }).catch(() => {});
  let muteHome = null, o = null, cv = null, g = null, vid = null, looping = false, list = [], cur = -1, base = null, posters = [], tapesEl = null;
  let vt = performance.now() / 1000, lastReal = performance.now();   // the cave's clock (window.__caveSpeed slows it for stills; 1 = real time)
  const now = () => { const r = performance.now(); vt += (r - lastReal) / 1000 * (window.__caveSpeed ?? 1); lastReal = r; return vt; };
  // ---- sound: SFX for thunks + glitches; the crunch is made here (a bag of chips needs its own)
  let ac = null; const crunch = (big = 1) => { if (muted()) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const t0 = ac.currentTime;
      for (let k = 0; k < 7; k++) { const d = 0.02 + Math.random() * 0.05, at = t0 + k * (0.018 + Math.random() * 0.03), b = ac.createBuffer(1, Math.ceil(ac.sampleRate * d), ac.sampleRate), ch = b.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2);
        const s = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = 1400 + Math.random() * 2600; f.Q.value = 0.9; v.gain.value = 0.35 * big;
        s.connect(f).connect(v).connect(ac.destination); s.start(at); } } catch (e) {} };
  const play = n => { if (sfx[n]) sfx[n](); };
  // ---- the cave itself, painted once (soil, stones, roots, the ladder, the couch's back, the 404 scratched over the couch)
  function soilBlob(x, cx, cy, rx, ry, c, s) { x.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, r = 1 + (rnd(i, s) - 0.5) * 0.28; x.lineTo(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r); } x.closePath(); x.fillStyle = c; x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); }
  function paintBase() { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round';
    const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2b1d14'); gr.addColorStop(0.75, '#22170f'); gr.addColorStop(1, '#170f0a'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const cx = rnd(i, 1) * W, cy = 80 + rnd(i, 2) * 700, r = 8 + rnd(i, 3) * 30; soilBlob(x, cx, cy, r * 1.3, r, ['#3a2a1d', '#4a3524', '#2f2218', '#5a4430'][i % 4], i); }   // stones in the soil
    x.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 260; i++) x.fillRect(rnd(i, 5) * W, rnd(i, 6) * H, 3 + rnd(i, 7) * 5, 2);   // grit
    // the floor: packed earth, a rug
    x.beginPath(); x.moveTo(0, 790); for (let X = 0; X <= W; X += 40) x.lineTo(X, 786 + Math.sin(X * 0.02) * 6 + rnd(X, 9) * 6); x.lineTo(W, H); x.lineTo(0, H); x.closePath(); x.fillStyle = '#3a2819'; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.ellipse(720, 832, 360, 44, 0, 0, TAU); x.fillStyle = '#2f5d62'; x.fill(); x.lineWidth = 6; x.stroke(); x.beginPath(); x.ellipse(720, 832, 300, 30, 0, 0, TAU); x.lineWidth = 4; x.strokeStyle = '#d9a441'; x.stroke();
    // the ceiling: a lumpy ink edge, roots hanging through it
    x.beginPath(); x.moveTo(0, 0); for (let X = 0; X <= W; X += 30) x.lineTo(X, 26 + Math.sin(X * 0.013) * 12 + rnd(X, 4) * 10); x.lineTo(W, 0); x.closePath(); x.fillStyle = '#170f0a'; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
    for (let i = 0; i < 9; i++) { const X = 560 + i * 120 + rnd(i, 11) * 60, L = 40 + rnd(i, 12) * 90; x.beginPath(); x.moveTo(X, 20); x.bezierCurveTo(X + 18, 20 + L * 0.4, X - 22, 20 + L * 0.7, X + 6, 20 + L); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); x.lineWidth = 4; x.strokeStyle = '#a07a4e'; x.stroke(); }
    // the hatch up to the kitchen: warm light, the ladder down from it
    x.fillStyle = '#ffd9a0'; x.fillRect(HATCH.x0, 0, HATCH.x1 - HATCH.x0, 34); x.lineWidth = 6; x.strokeStyle = INK; x.strokeRect(HATCH.x0, -4, HATCH.x1 - HATCH.x0, 38);
    { const g2 = x.createLinearGradient(0, 30, 0, 560); g2.addColorStop(0, 'rgba(255,217,160,.32)'); g2.addColorStop(1, 'rgba(255,217,160,0)'); x.fillStyle = g2; x.beginPath(); x.moveTo(HATCH.x0, 34); x.lineTo(HATCH.x1, 34); x.lineTo(HATCH.x1 + 80, 560); x.lineTo(HATCH.x0 - 80, 560); x.closePath(); x.fill(); }
    for (const X of [HATCH.x0 + 46, HATCH.x1 - 46]) { x.fillStyle = '#7a4c2e'; x.fillRect(X - 9, 30, 18, 520); x.strokeRect(X - 9, 30, 18, 520); }
    for (let Y = 80; Y < 540; Y += 62) { x.fillStyle = '#8a5a36'; x.fillRect(HATCH.x0 + 46, Y, HATCH.x1 - HATCH.x0 - 92, 12); x.strokeRect(HATCH.x0 + 46, Y, HATCH.x1 - HATCH.x0 - 92, 12); }
    // 404, scratched into the soil over the couch (home)
    x.save(); x.translate(150, 330); x.rotate(-0.06); x.font = '400 54px "Major Mono Display", monospace'; x.fillStyle = 'rgba(214,170,120,.35)'; x.fillText('404', 0, 0); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillText('404', 3, 3); x.restore();
    // the screen's frame + the shelf the tapes stand on + the crate the VCR sits on
    const S = SCREEN; x.fillStyle = '#2b1a10'; x.beginPath(); x.roundRect(S.x - 22, S.y - 22, S.w + 44, S.h + 44, 12); x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
    x.fillStyle = '#3a2416'; x.fillRect(S.x - 22 + S.w + 44 - 30, S.y - 22, 30, S.h + 44);   // (one cel band)
    x.fillStyle = '#6b4426'; x.beginPath(); x.roundRect(CAB.x0, CAB.y0, CAB.x1 - CAB.x0, 800 - CAB.y0, 8); x.fill(); x.lineWidth = 7; x.stroke(); x.fillStyle = '#563620'; x.fillRect(CAB.x1 - 30, CAB.y0 + 4, 26, 800 - CAB.y0 - 8);
    for (const [y0, y1] of [[CAB.y0 + 8, CAB.mid - 4], [CAB.mid + 4, 792]]) { x.fillStyle = '#1a110b'; x.beginPath(); x.roundRect(CAB.x0 + 12, y0, CAB.x1 - CAB.x0 - 46, y1 - y0, 4); x.fill(); x.lineWidth = 4; x.stroke(); }
    // the couch's back + arms (the seat cushions go over him: painted live)
    x.fillStyle = '#7a2a2e'; x.beginPath(); x.roundRect(150, 520, 460, 210, [40, 40, 8, 8]); x.fill(); x.lineWidth = 7; x.stroke(); x.fillStyle = '#5e1f23'; x.fillRect(150, 690, 460, 40);
    for (const X of [210, 372, 534]) { x.beginPath(); x.moveTo(X, 540); x.lineTo(X, 700); x.lineWidth = 4; x.strokeStyle = 'rgba(18,10,5,.55)'; x.stroke(); }   // the backrest's tufting
    return c; }
  function couchFront(x) {   // the seat + arms, over his bottom (he sinks into it)
    x.lineJoin = 'round'; x.fillStyle = '#8c3236'; x.beginPath(); x.roundRect(176, 694, 408, 72, 18); x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke(); x.fillStyle = '#6e2529'; x.fillRect(178, 742, 404, 22);
    for (const X of [130, 572]) { x.fillStyle = '#7a2a2e'; x.beginPath(); x.roundRect(X, 640, 66, 150, 26); x.fill(); x.stroke(); x.fillStyle = '#5e1f23'; x.fillRect(X + 44, 650, 18, 136); }
    x.fillStyle = '#4a1a1c'; x.beginPath(); x.roundRect(160, 760, 440, 34, 8); x.fill(); x.stroke();
    for (const X of [178, 560]) { x.fillStyle = INK; x.fillRect(X, 790, 22, 14); } }
  function spool(x) { x.lineJoin = 'round'; const { x0, x1, top } = TABLE, cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
    x.fillStyle = '#6b4426'; x.fillRect(cx - 70, top, 140, 86); x.lineWidth = 6; x.strokeStyle = INK; x.strokeRect(cx - 70, top, 140, 86);
    x.beginPath(); x.ellipse(cx, 800, rx, 18, 0, 0, TAU); x.fillStyle = '#7a4c2e'; x.fill(); x.stroke();
    x.beginPath(); x.ellipse(cx, top, rx, 20, 0, 0, TAU); x.fillStyle = '#9a6a3e'; x.fill(); x.stroke(); x.beginPath(); x.ellipse(cx, top, rx * 0.62, 11, 0, 0, TAU); x.lineWidth = 3; x.strokeStyle = 'rgba(18,10,5,.5)'; x.stroke(); }
  // ---- the bag: family size. Bites come out of it with an ink edge; the last bit goes in whole
  const bagC = document.createElement('canvas'); bagC.width = 220; bagC.height = 280;
  function bagShape(x) { x.beginPath(); x.moveTo(26, 40); for (let i = 0; i <= 12; i++) x.lineTo(26 + i * 14, i % 2 ? 22 : 34); x.quadraticCurveTo(206, 140, 194, 244); for (let i = 12; i >= 0; i--) x.lineTo(26 + i * 14, i % 2 ? 262 : 250); x.quadraticCurveTo(10, 140, 26, 40); x.closePath(); }
  function paintBag(bites) { const x = bagC.getContext('2d'); x.clearRect(0, 0, 220, 280); x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
    bagShape(x); x.fillStyle = '#e23b2e'; x.fill(); x.save(); x.clip();
    x.fillStyle = '#b8261f'; x.fillRect(160, 0, 60, 280); x.fillStyle = '#f4c430'; x.fillRect(0, 22, 220, 24); x.fillRect(0, 236, 220, 30);   // the shade band, the crimped ends
    x.fillStyle = '#f4c430'; x.beginPath(); x.moveTo(0, 168); for (let X = 0; X <= 220; X += 20) x.lineTo(X, 168 + Math.sin(X * 0.06) * 10); x.lineTo(220, 206); for (let X = 220; X >= 0; X -= 20) x.lineTo(X, 206 + Math.sin(X * 0.06) * 10); x.closePath(); x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke();
    // a potato on the front, sliced (that's what's in here)
    x.beginPath(); x.ellipse(88, 108, 40, 32, -0.2, 0, TAU); x.fillStyle = '#da9643'; x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); for (const [a, b] of [[74, 98], [100, 116], [84, 122]]) { x.beginPath(); x.ellipse(a, b, 5, 3.5, 0, 0, TAU); x.fillStyle = '#9c6226'; x.fill(); }
    for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(138 + k * 12, 92 + k * 22, 20, 13, 0.4, 0, TAU); x.fillStyle = '#f2c14e'; x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); }
    x.strokeStyle = '#ff9a8a'; x.lineWidth = 5; x.beginPath(); x.moveTo(40, 60); x.quadraticCurveTo(34, 120, 44, 150); x.stroke();   // foil shine
    x.restore(); bagShape(x); x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
    for (const b of bites) { x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(b[0], b[1], b[2], 0, TAU); x.fill(); x.globalCompositeOperation = 'source-atop'; x.beginPath(); x.arc(b[0], b[1], b[2], 0, TAU); x.lineWidth = 12; x.strokeStyle = INK; x.stroke(); x.lineWidth = 4; x.strokeStyle = '#f2c14e'; x.beginPath(); x.arc(b[0], b[1], b[2] + 9, 0, TAU); x.stroke(); }
    x.restore(); }
  const BITES = [[[190, 50, 50]], [[190, 50, 50], [116, 22, 54]], [[190, 50, 50], [116, 22, 54], [184, 150, 62]]];   // (Reviewer: bitten from the top + his side of the bag, the part he doesn't cover)
  const biteAt = b => [BAG.x - BAG.w / 2 - 10 + b[0] * (BAG.w + 20) / 220, BAG.y - BAG.h - 12 + b[1] * (BAG.h + 26) / 280];
  // ---- him: the real model, off the same renderer (as the booth does it), into a square, then lit by the screen
  const pc = document.createElement('canvas'), pcam = new T.OrthographicCamera(-1, 1, 1, -1, -30, 30);
  function renderPotato(S, tear) { const c = renderer.domElement, cw = c.width, ch = c.height, a = cw / ch, q = spud.spud.scale.y / 1.18, h = 1.25 * q, px = pivot.position.x, py = pivot.position.y + 0.86 * q;
    const hw = a >= 1 ? h * a : h, hh = a >= 1 ? h : h / a; pcam.left = px - hw; pcam.right = px + hw; pcam.top = py + hh; pcam.bottom = py - hh; pcam.position.set(0, 0, 10); pcam.lookAt(0, 0, 0); pcam.updateProjectionMatrix();
    intro.backdrop(false); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, pcam);
    if (tear) fx.render(scene, pcam, now(), a >= 1 ? { x: 0.5 - 0.28 / a, y: 0.08, w: 0.56 / a, h: 0.84 } : { x: 0.22, y: 0.5 - 0.42 * a, w: 0.56, h: 0.84 * a });
    const side = Math.min(cw, ch), sx = (cw - side) / 2, sy = (ch - side) / 2; if (pc.width !== S) { pc.width = pc.height = S; } const x = pc.getContext('2d'); x.clearRect(0, 0, S, S); x.drawImage(c, sx, sy, side, side, 0, 0, S, S); intro.backdrop(true);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(14,8,20,.22)'; x.fillRect(0, 0, S, S); x.fillStyle = `rgba(${amb[0] | 0},${amb[1] | 0},${amb[2] | 0},${0.1 + 0.16 * amb[3]})`; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'source-over'; return pc; }
  // ---- the screen: the tape playing, or static. The room takes the screen's colour
  const amb = [120, 120, 140, 0], samp = document.createElement('canvas'); samp.width = 16; samp.height = 9; const sg = samp.getContext('2d', { willReadFrequently: true });
  const noise = document.createElement('canvas'); noise.width = 160; noise.height = 90; const ng = noise.getContext('2d'), nimg = ng.createImageData(160, 90);
  let lastLum = -1, lastSamp = 0, lastReact = 0, nextIdle = 0, staticTo = 0, osd = { t: -9, text: '' }, chans = 0;
  function sample(t) { if (t - lastSamp < 0.25 || !vid || vid.readyState < 2 || vid.paused) return; lastSamp = t; sg.drawImage(vid, 0, 0, 16, 9); const d = sg.getImageData(0, 0, 16, 9).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4; r /= n; gg /= n; b /= n;
    const lum = (0.3 * r + 0.59 * gg + 0.11 * b) / 255; amb[0] += (r - amb[0]) * 0.5; amb[1] += (gg - amb[1]) * 0.5; amb[2] += (b - amb[2]) * 0.5; amb[3] = lum;
    if (lastLum >= 0 && Math.abs(lum - lastLum) > 0.16 && t - lastReact > 2.6 && pot.mode === 'sit' && !gag) { lastReact = t; react(['startled', 'wide', 'awe', 'oh'][Math.floor(Math.random() * 4)], 0.8, 14); } lastLum = lum; }
  function drawStatic(x, S) { const p = nimg.data; for (let i = 0; i < p.length; i += 4) { const v = Math.random() * 200 | 0; p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = 255; } ng.putImageData(nimg, 0, 0); x.imageSmoothingEnabled = false; x.drawImage(noise, S.x, S.y, S.w, S.h); x.imageSmoothingEnabled = true; }
  function drawScreen(x, t) { const S = SCREEN; x.save(); x.beginPath(); x.roundRect(S.x, S.y, S.w, S.h, 6); x.clip();
    const live = vid && cur >= 0 && vid.readyState >= 2 && t >= staticTo;
    if (live) x.drawImage(vid, S.x, S.y, S.w, S.h); else if (cur >= 0 || t < staticTo) drawStatic(x, S); else { drawStatic(x, S); x.fillStyle = 'rgba(10,8,14,.55)'; x.fillRect(S.x, S.y, S.w, S.h); }
    x.fillStyle = 'rgba(0,0,0,.13)'; for (let y = S.y; y < S.y + S.h; y += 4) x.fillRect(S.x, y, S.w, 2);   // scan lines
    if (live && vid.paused) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(S.x, S.y, S.w, S.h); x.fillStyle = '#4dff9a'; x.fillRect(S.x + 34, S.y + 30, 14, 44); x.fillRect(S.x + 58, S.y + 30, 14, 44); }   // the VCR's own pause bars
    if (t - osd.t < 2.6) { const k = t - osd.t, f = Math.floor(t * 14); x.font = '400 34px "Major Mono Display", monospace'; x.textBaseline = 'top'; const s = osd.text.split('').map((ch, i) => k < 0.5 && rnd(f, i) < 0.5 - k ? '01#@'[i % 4] : ch).join('');
      x.globalAlpha = k > 2.1 ? (2.6 - k) / 0.5 : 1; x.fillStyle = '#2a0f63'; x.fillText(s, S.x + 32, S.y + 92 + 3); x.fillStyle = '#e03ccf'; x.fillText(s, S.x + 34, S.y + 92); x.fillStyle = '#ffd98a'; x.fillText(s, S.x + 32, S.y + 92); x.globalAlpha = 1; }
    x.restore(); x.save(); x.globalCompositeOperation = 'lighter'; const gl = x.createLinearGradient(S.x, S.y, S.x + S.w * 0.4, S.y + S.h * 0.6); gl.addColorStop(0, 'rgba(255,255,255,.07)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gl; x.fillRect(S.x, S.y, S.w, S.h); x.restore(); }
  function drawVCR(x, t) { const V = VCR; x.lineJoin = 'round'; x.fillStyle = '#26262c'; x.beginPath(); x.roundRect(V.x, V.y, V.w, V.h, 6); x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); x.fillStyle = '#121216'; x.fillRect(V.x + 18, V.y + 14, 92, 12); x.strokeRect(V.x + 18, V.y + 14, 92, 12);
    x.fillStyle = '#0a0a0c'; x.fillRect(V.x + 124, V.y + 10, 62, 26); const on = Math.floor(t * 1.6) % 2 === 0 || (vid && cur >= 0 && !vid.paused);
    if (on) { x.fillStyle = '#ff4a3a'; x.font = '700 20px Menlo, monospace'; x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText(vid && cur >= 0 && !vid.paused ? '▶' : '4:04', V.x + 155, V.y + 24); x.textAlign = 'start'; } }
  // the bulbs along the ceiling: warm, a slow shimmer (no purple: that's his)
  function bulbs(x, t) { for (let i = 0; i < 17; i++) { const X = 120 + i * 88, Y = 54 + Math.sin(i * 0.9) * 10 + 14 * Math.abs(Math.sin(i * 0.5)), col = ['#ffd98a', '#ff9a5a', '#f4c430', '#ffb36a'][i % 4], k = 0.55 + 0.35 * Math.sin(t * 1.3 + i * 1.7);
      if (i) { x.beginPath(); x.moveTo(X - 88, 54 + Math.sin((i - 1) * 0.9) * 10 + 14 * Math.abs(Math.sin((i - 1) * 0.5)) - 8); x.quadraticCurveTo(X - 44, Y + 10, X, Y - 8); x.lineWidth = 3; x.strokeStyle = INK; x.stroke(); }
      x.save(); x.globalCompositeOperation = 'lighter'; const gr = x.createRadialGradient(X, Y, 0, X, Y, 46); gr.addColorStop(0, `rgba(255,200,120,${0.32 * k})`); gr.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = gr; x.fillRect(X - 46, Y - 46, 92, 92); x.restore();
      x.beginPath(); x.ellipse(X, Y + 4, 7, 10, 0, 0, TAU); x.fillStyle = col; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke(); } }
  // ---- him in here: where he is, how he leans/squashes, what he's doing
  const pot = { x: SEAT.x, y: SEAT.y, lean: 0, sx: 1, sy: 1, bob: 0, mode: 'drop', t0: 0, from: null, to: null };
  let gag = null, bag = { bites: 0, gone: false, back: 0, drop: -9 }, crumbs = [], autoGag = false, playedAt = 0, idleSince = 0;
  const watchYaw = 0.85, bagYaw = 1.05;
  function react(name, dur = 0.9, bob = 0) { if (!face) return; face.show(name, now(), dur); if (bob) pot.bob = Math.max(pot.bob, bob); }
  function hop(to, dur, then) { pot.mode = 'hop'; pot.t0 = now(); pot.from = { x: pot.x, y: pot.y }; pot.to = to; pot.dur = dur; pot.then = then; spud.jumped(); play('jump'); }
  function stepPot(t, dt) {
    if (pot.mode === 'drop') { const k = (t - pot.t0) / 0.5; pot.y = -200 + (SEAT.y + 200) * Math.min(1, k * k); if (k >= 1) { pot.mode = 'sit'; pot.y = SEAT.y; spud.land(6); play('thud'); pot.sx = 1.18; pot.sy = 0.8; puffAt(SEAT.x, SEAT.y - 10, 10); react('startled', 0.7); spud.turnTo(watchYaw); } }
    else if (pot.mode === 'hop') { const k = Math.min(1, (t - pot.t0) / pot.dur), e = k; pot.x = pot.from.x + (pot.to.x - pot.from.x) * ez(e); pot.y = pot.from.y + (pot.to.y - pot.from.y) * e - Math.sin(k * Math.PI) * (pot.to.h || 150);
      if (k >= 1) { pot.x = pot.to.x; pot.y = pot.to.y; spud.land(4); play('thunk'); pot.sx = 1.12; pot.sy = 0.88; const f = pot.then; pot.mode = 'still'; if (f) f(); } }
    else if (pot.mode === 'leave') { const k = (t - pot.t0) / 0.55; pot.y = SEAT.y - (SEAT.y + 400) * ez(k) ; if (k >= 1.1) { pot.mode = 'gone'; finishClose(); } }
    pot.sx += (1 - pot.sx) * Math.min(1, dt * 7); pot.sy += (1 - pot.sy) * Math.min(1, dt * 7); pot.bob *= Math.max(0, 1 - dt * 6); }
  // ---- THE CHIPS. g = seconds into it. The beats: eye the bag (slow smile), look at you, brows up + down, hop, three bites, gulp, burp, back to the couch
  function startGag() { if (gag || bag.gone || pot.mode !== 'sit') return false; gag = { t0: now(), done: new Set() }; autoGag = true; if (vid) vid.__duck = true; return true; }   // (eaten by hand: it won't also go off on its own)
  const once = (k, at, g, fn) => { if (g >= at && !gag.done.has(k)) { gag.done.add(k); fn(); } };
  // (Reviewer, Nov 7: a real brow waggle now: the sneaky face with his brows lifted (cave/face-sneaky-brows1/2.png), up and down once, with a held
  // stare either side of it so the look lands before he eats. Everything after the waggle moved 0.6 s later.)
  function stepGag(t) { if (!gag) return; const g = t - gag.t0, D = 0.6;
    once('eye', 0, g, () => { spud.turnTo(bagYaw); face.show('smirk', t, 1.0); });
    if (g < 2.2) pot.lean = 0.11 * ez(g / 1.6);                         // he leans toward it, slow
    once('smile', 0.9, g, () => face.show('sneaky', t, 1.4));           // ...and smiles at it
    once('look', 2.2, g, () => { pot.lean = 0; spud.snap(0); face.show('sneaky', t, 0.8); });   // snap: right at you. hold it
    once('up1', 2.85, g, () => face.show(BROWS ? 'brows1' : 'grin', t, 0.1));                    // brows up...
    once('up2', 2.92, g, () => { face.show(BROWS ? 'brows2' : 'grin', t, 0.4); pot.bob = 10; });
    once('dn1', 3.25, g, () => face.show(BROWS ? 'brows1' : 'sneaky', t, 0.1));                   // ...and down
    once('dn2', 3.32, g, () => face.show('sneaky', t, 0.7));
    once('wind', 3.3 + D, g, () => { pot.sx = 1.12; pot.sy = 0.86; face.show('determined', t, 0.8); spud.turnTo(bagYaw); });
    once('hop', 3.55 + D, g, () => { hop({ x: SPOT.x, y: SPOT.y, h: 170 }, 0.55, null); spud.turnTo(0.5); });   // (on the table: 3/4 to us, so you see the bites)
    for (let i = 0; i < 3; i++) { const at = 4.35 + D + i * 0.6;
      once('open' + i, at, g, () => { face.show('scream', t, 0.16); });
      once('bite' + i, at + 0.14, g, () => { bag.bites = i + 1; crunch(1 + i * 0.2); play('rockHit'); face.show('grin', t, 0.36); pot.sx = 1.1; pot.sy = 0.9; const [bx, by] = biteAt(BITES[i][i]); crumbBurst(bx, by, 14 + i * 4); }); }
    if (g > 4.35 + D && g < 6.2 + D) { const ph = ((g - 4.35 - D) % 0.6) / 0.6; pot.lunge = ph < 0.25 ? Math.sin(ph / 0.25 * Math.PI / 2) * 30 : 30 * (1 - ez((ph - 0.25) / 0.6)); } else pot.lunge = 0;
    once('gulpOpen', 6.25 + D, g, () => face.show('scream', t, 0.45));
    once('gulp', 6.7 + D, g, () => { bag.gone = true; play('glug'); crunch(1.6); pot.sx = 1.34; pot.sy = 0.8; face.show('oh', t, 0.5); });
    if (g >= 6.25 + D && g < 6.7 + D) bag.suck = (g - 6.25 - D) / 0.45; else bag.suck = 0;
    once('wobble', 7.0 + D, g, () => { pot.sx = 0.86; pot.sy = 1.12; });
    once('burp', 7.5 + D, g, () => { fx.amount = 0.75; glitch(); burp(); face.show('proud', t, 1.0); });
    once('back', 8.6 + D, g, () => hop({ x: SEAT.x, y: SEAT.y, h: 150 }, 0.55, () => { pot.mode = 'sit'; spud.turnTo(watchYaw); face.show('warm', now(), 4); }));
    once('end', 9.4 + D, g, () => { if (vid) vid.__duck = false; gag = null; bag.back = now() + 9; }); }
  function burp() { const words = (window.POTATO_GLITCH_WORDS || ['krrzzt']).filter(w => w.length < 9), s = document.createElement('span'); s.className = 'burp'; s.textContent = words[Math.floor(Math.random() * words.length)];
    const r = toCss(pot.x + 46, pot.y - 200); s.style.left = r[0] + '%'; s.style.top = r[1] + '%'; o.querySelector('.gw').append(s); setTimeout(() => s.remove(), 1700); }
  function crumbBurst(cx, cy, n) { for (let i = 0; i < n; i++) crumbs.push({ x: cx, y: cy, vx: -220 + Math.random() * 520, vy: -380 - Math.random() * 380, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, s: 6 + Math.random() * 9, rest: false }); while (crumbs.length > 140) crumbs.shift(); }
  function puffAt(cx, cy, n) { for (let i = 0; i < n; i++) crumbs.push({ x: cx + (Math.random() - 0.5) * 120, y: cy, vx: (Math.random() - 0.5) * 200, vy: -120 - Math.random() * 100, r: 0, vr: 0, s: 10 + Math.random() * 10, dust: 1, life: 0.6 }); }
  function stepCrumbs(dt) { for (let i = crumbs.length - 1; i >= 0; i--) { const c = crumbs[i]; if (c.dust) { c.life -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 300 * dt; if (c.life <= 0) crumbs.splice(i, 1); continue; } if (c.rest) continue;
      c.vy += 1500 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; const floor = c.x > TABLE.x0 && c.x < TABLE.x1 && c.y < TABLE.top + 10 ? TABLE.top : 812; if (c.y >= floor && c.vy > 0) { c.y = floor; if (c.vy > 260) { c.vy *= -0.3; c.vx *= 0.5; } else { c.rest = true; } } } }
  function drawCrumbs(x) { for (const c of crumbs) { x.save(); x.translate(c.x, c.y); if (c.dust) { x.globalAlpha = Math.max(0, c.life / 0.6) * 0.7; x.beginPath(); x.arc(0, 0, c.s, 0, TAU); x.fillStyle = '#8a6a4a'; x.fill(); x.restore(); continue; }
      x.rotate(c.r); x.beginPath(); x.moveTo(-c.s, -c.s * 0.3); x.lineTo(c.s * 0.2, -c.s * 0.6); x.lineTo(c.s, c.s * 0.2); x.lineTo(-c.s * 0.3, c.s * 0.5); x.closePath(); x.fillStyle = '#f2c14e'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = INK; x.stroke(); x.restore(); } }
  function drawBag(x, t) { if (bag.gone && !(t < bag.drop + 0.6 && bag.drop > 0)) return; let dy = 0, sc = 1, rot = 0, dx = 0;
    if (bag.drop > 0 && t - bag.drop < 0.6) { const k = (t - bag.drop) / 0.45; dy = k < 1 ? -(1 - k * k) * 760 : 0; }
    if (bag.suck > 0) { const k = ez(bag.suck); sc = 1 - k * 0.92; rot = -k * 2.4; dx = (pot.x + 40 - BAG.x) * k; dy = -150 * k; }
    paintBag(BITES[bag.bites - 1] || []); x.save(); x.translate(BAG.x + dx, BAG.y + dy - BAG.h / 2); x.rotate(rot + (gag ? 0 : Math.sin(t * 0.7) * 0.015)); x.scale(sc, sc); x.drawImage(bagC, -BAG.w / 2 - 10, -BAG.h / 2 - 12, BAG.w + 20, BAG.h + 26); x.restore(); }
  function stepBag(t) { if (bag.gone && !gag && bag.back && t >= bag.back) { bag.back = 0; bag.gone = false; bag.bites = 0; bag.drop = t; crumbs = crumbs.filter(c => !c.rest || c.y > 790); setTimeout(() => { if (!looping) return; play('thud'); puffAt(BAG.x, BAG.y, 8); if (pot.mode === 'sit') react('awe', 1.1, 10); }, 450); }
    if (!gag && !autoGag && cur >= 0 && vid && !vid.paused && t - playedAt > 16 && pot.mode === 'sit' && !bag.gone) { autoGag = true; startGag(); } }   // once a visit, on its own
  // ---- the frame
  let raf = 0, last = 0;
  function frame() { if (!looping) return; raf = requestAnimationFrame(frame); const t = now(), dt = Math.min(0.05, t - last); last = t;
    sample(t); stepPot(t, dt); stepGag(t); stepBag(t); stepCrumbs(dt); idle(t);
    if (vid) { const want = muted() ? 0 : vid.__duck ? 0.3 : 1; vid.muted = muted(); vid.volume += (want - vid.volume) * Math.min(1, dt * 6); }
    if (face) face.update(t);
    const x = g; x.drawImage(base, 0, 0); drawScreen(x, t); drawVCR(x, t); bulbs(x, t);
    // the screen's light over the room (its colour), the room dim round it
    x.save(); x.fillStyle = 'rgba(6,4,10,.36)'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'; const live = vid && cur >= 0 && !vid.paused && t >= staticTo, k = live ? 0.12 + 0.2 * amb[3] : 0.06;
    const gr = x.createRadialGradient(SCREEN.x + SCREEN.w / 2, SCREEN.y + SCREEN.h / 2, 80, SCREEN.x + SCREEN.w / 2, SCREEN.y + SCREEN.h / 2, 1100); gr.addColorStop(0, `rgba(${amb[0] | 0},${amb[1] | 0},${amb[2] | 0},${k})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, W, H); x.restore();
    // him, then the couch's seat over him (he sinks in), the spool, the bag, crumbs
    const S = 500, img = renderPotato(S, fx.amount > 0.02), sink = pot.x < 560 ? 22 * Math.max(0, Math.min(1, (pot.y - SEAT.y + 60) / 60)) : 0, fy = pot.y + sink - pot.bob;   // (on the couch he sinks into the cushion)
    const onCouch = pot.x < 600, him = () => { x.save(); x.translate(pot.x + (pot.lunge || 0), fy); x.rotate(pot.lean); x.scale(pot.sx, pot.sy); x.drawImage(img, -S / 2, -S * FEET, S, S); x.restore(); };
    if (onCouch) { spool(x); him(); couchFront(x); drawBag(x, t); } else { couchFront(x); spool(x); drawBag(x, t); him(); }   // (on the couch: he sinks behind its seat; on the table: he's on the spool, in front of the bag he's eating)
    drawCrumbs(x);
    // the bag glints now and then: you can have it
    if (!gag && !bag.gone && pot.mode === 'sit') { const ph = (t * 0.25) % 1; if (ph < 0.08) spark(x, BAG.x + 50, BAG.y - BAG.h + 20, 22 * Math.sin(ph / 0.08 * Math.PI)); }
    fx.amount = Math.max(0, fx.amount - dt * 2.4); }
  function spark(x, cx, cy, s) { if (s < 1) return; x.beginPath(); x.moveTo(cx, cy - s); x.quadraticCurveTo(cx, cy, cx + s, cy); x.quadraticCurveTo(cx, cy, cx, cy + s); x.quadraticCurveTo(cx, cy, cx - s, cy); x.quadraticCurveTo(cx, cy, cx, cy - s); x.closePath(); x.fillStyle = '#ffd84a'; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke(); }
  function idle(t) { if (gag || pot.mode !== 'sit' || !face) return; const playing = vid && cur >= 0 && !vid.paused;
    if (playing) { idleSince = t; face.setRest(null); if (t > nextIdle) { nextIdle = t + 7 + Math.random() * 7; react(['smirk', 'thinking', 'question', 'laugh', 'deadpan', 'warm'][Math.floor(Math.random() * 6)], 1.3); } }
    else face.setRest(t - idleSince > 14 ? 'sleepy' : null); }
  // ---- tapes
  function load(i) { if (!list.length) return; i = (i + list.length) % list.length; const L = list[i]; cur = i; chans++; staticTo = now() + 0.45; osd = { t: now() + 0.45, text: L.title }; play('clunk');
    [...tapesEl.children].forEach((b, j) => b.classList.toggle('in', j === i)); vid.src = L.file; vid.currentTime = 0; playedAt = now(); idleSince = now(); lastLum = -1;
    vid.play().catch(() => {}); if (pot.mode === 'sit' && !gag) react('smirk', 0.8); }
  function toggle() { if (!vid) return; if (cur < 0) return load(0); if (vid.paused) { vid.play().catch(() => {}); play('tvOn'); } else { vid.pause(); play('tvOff'); } }
  // ---- input: canvas taps (screen, bag, him, the ladder), keys
  const toCanvas = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  const toCss = (X, Y) => [X / W * 100, Y / H * 100];
  function tap(e) { const [X, Y] = toCanvas(e), pad = LITE ? 40 : 10;
    if (X > SCREEN.x - pad && X < SCREEN.x + SCREEN.w + pad && Y > SCREEN.y - pad && Y < SCREEN.y + SCREEN.h + pad) return toggle();
    if (!bag.gone && X > BAG.x - BAG.w / 2 - pad && X < BAG.x + BAG.w / 2 + pad && Y > BAG.y - BAG.h - pad && Y < BAG.y + pad) return startGag();
    if (X > HATCH.x0 - pad && X < HATCH.x1 + pad && Y < 430) return leave();
    if (Math.abs(X - pot.x) < 140 && Y > pot.y - 300 && Y < pot.y + 20 && pot.mode === 'sit' && !gag) { fx.amount = 0.8; glitch(); react(['startled', 'deadpan', 'question', 'smirk'][Math.floor(Math.random() * 4)], 0.9, 12); } }
  const onKey = e => { if (e.metaKey || e.ctrlKey || e.altKey) return; const k = e.code, stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (e.key === 'Escape' || k === 'ArrowUp' || k === 'KeyW') { stop(); if (!e.repeat) leave(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') { stop(); if (!e.repeat) load(cur < 0 ? list.length - 1 : cur - 1); return; }
    if (k === 'ArrowRight' || k === 'KeyD') { stop(); if (!e.repeat) load(cur + 1); return; }
    if (k === 'Space' || k === 'Enter') { if (e.target.closest && e.target.closest('button') && k === 'Enter') return; stop(); if (!e.repeat) toggle(); return; }
    if (k === 'KeyE' || k === 'KeyC' || k === 'ArrowDown' || k === 'KeyS') { stop(); if (!e.repeat) startGag(); return; }
    stop(); };
  const onUp = e => e.stopPropagation();
  function layout() { if (!o) return; const vw = o.clientWidth, vh = o.clientHeight, tall = vh > vw * 1.05, side = !tall && vh < 560 && vw / vh > 1.6; o.classList.toggle('tall', tall); o.classList.toggle('side', side); const box = o.querySelector('.box');   // (Reviewer: phones: tall = tapes in two columns under the room; side = landscape phone, tapes beside it)
    let bw = Math.min(vw - (side ? 200 : 0), (vh - (tall ? 300 : 0)) * 16 / 9); bw = Math.max(200, Math.min(bw, vw)); box.style.width = bw + 'px'; box.style.height = bw * 9 / 16 + 'px';
    if (tall || side) { tapesEl.style.cssText = ''; o.append(tapesEl); } else { box.append(tapesEl); Object.assign(tapesEl.style, { left: TAPES.x0 / W * 100 + '%', top: TAPES.y0 / H * 100 + '%', width: (TAPES.x1 - TAPES.x0) / W * 100 + '%', height: (TAPES.y1 - TAPES.y0) / H * 100 + '%' }); } }
  async function fetchList() { if (list.length) return; try { const r = await fetch('cave/playlist.json', { cache: 'no-cache' }); list = r.ok ? await r.json() : []; } catch (e) { list = []; } if (!Array.isArray(list)) list = []; }
  // ---- in and out
  async function open() { if (o) return; walkable(true); music(false); glitch(); await fetchList(); if (!base) base = paintBase();
    o = document.createElement('div'); o.id = 'cave'; o.className = 'hello'; o.innerHTML = '<div class="box"><canvas width="1600" height="900" aria-label="the potato cave"></canvas><div class="gw"></div></div>';
    tapesEl = document.createElement('div'); tapesEl.className = 'tapes';
    list.forEach((L, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'tape'; b.setAttribute('aria-label', L.title); b.title = L.title; const im = document.createElement('img'), lb = document.createElement('b'); im.alt = ''; im.src = L.poster; lb.textContent = String(L.title).toLowerCase(); b.append(im, lb); b.style.animationDelay = (i * 0.09) + 's'; b.onclick = e => { e.stopPropagation(); load(i); b.blur(); }; tapesEl.append(b); });
    vid = document.createElement('video'); vid.playsInline = true; vid.setAttribute('playsinline', ''); vid.preload = 'auto'; vid.volume = 1; vid.muted = muted(); vid.onended = () => load(cur + 1); o.append(vid);
    const mb = document.getElementById('mute'); if (mb) { muteHome = [mb.parentNode, mb.nextSibling]; o.append(mb); }   // (Reviewer: the room's sound button comes down with him; the cave covered it)
    document.body.append(o); cv = o.querySelector('canvas'); g = cv.getContext('2d'); layout(); addEventListener('resize', layout); setTimeout(() => o && o.classList.remove('hello'), 2200);
    cv.addEventListener('pointerdown', e => { e.preventDefault(); tap(e); });
    addEventListener('keydown', onKey, true); addEventListener('keyup', onUp, true); fx.setWordsLayer(o.querySelector('.gw'));
    cur = -1; gag = null; autoGag = false; bag = { bites: 0, gone: false, back: 0, drop: -9 }; crumbs = []; pot.x = SEAT.x; pot.y = -200; pot.mode = 'drop'; pot.t0 = now(); pot.lean = 0; pot.lunge = 0; idleSince = now(); nextIdle = now() + 6;
    spud.duck(false); spud.turnTo(watchYaw); fx.amount = 0.9; play('whoosh'); looping = true; last = now(); frame(); }
  function leave() { if (!o || pot.mode === 'leave' || pot.mode === 'gone') return; if (gag) { gag = null; if (vid) vid.__duck = false; } pot.mode = 'leave'; pot.t0 = now(); pot.x = SEAT.x; spud.jumped(); play('jump'); face && face.show('smirk', now(), 0.8); if (vid) vid.pause(); }
  function finishClose() { looping = false; cancelAnimationFrame(raf); if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); } if (muteHome) { const mb = document.getElementById('mute'); if (mb) muteHome[0].insertBefore(mb, muteHome[1] && muteHome[1].parentNode === muteHome[0] ? muteHome[1] : null); muteHome = null; } if (o) o.remove(); o = null; vid = null; removeEventListener('keydown', onKey, true); removeEventListener('keyup', onUp, true); removeEventListener('resize', layout);
    fx.setWordsLayer(wordsHome); walkable(false); music(true); spud.turnTo(0.32); if (face) face.setRest(null); glitch(); }
  // (for checks: ?t exposes this as __room.cave)
  return { open, leave, close: finishClose, isOpen: () => !!o, load, toggle, eat: startGag, state: () => ({ cur, mode: pot.mode, gag: gag ? now() - gag.t0 : null, bag: { ...bag }, paused: vid ? vid.paused : null, t: vid ? vid.currentTime : 0, list: list.length }) };
}
