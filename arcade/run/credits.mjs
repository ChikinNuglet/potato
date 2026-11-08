// credits.mjs — the end credits, after Last Lights (Matt: "we need end credits there" … "it can just be thursday potato
// playing, i'll fill in the credits text later, but it will all be in potato glitch text"). Thursday Potato plays from the
// top — the album loops back to its first song — and the credits roll up the screen, every line arriving in his glitch
// text (his glitch words scrambling through it in purple with flecks of binary green, then landing). Any key / tap skips.
// MATT: edit the lines below (a blank string is a gap; a line starting with '#' is a heading).
export const CREDITS = [
  '#404: FILE NOT FOUND',
  '',
  'potato',
  '',
  '#CREDITS',
  '[ credits text — Matt fills this in ]',
  '[ credits text ]',
  '[ credits text ]',
  '',
  '#SPECIAL THANKS',
  'petunia, as herself',
  '',
  '',
  'thanks for playing',
];

const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const FONTS = ['"Major Mono Display", monospace', '"JetBrains Mono", monospace', 'Bungee, Impact, sans-serif', '"Rubik Mono One", monospace'];

export function createCredits({ stage, play }) {
  let cv = null, audio = null, raf = 0, t0 = 0, done = null, onKey = null;
  const words = () => (window.POTATO_GLITCH_WORDS || ['krrzzt', '404', 'wh@t?!']).filter(w => w.length <= 18);
  function stop() { cancelAnimationFrame(raf); if (audio) { audio.pause(); audio = null; } if (cv) { cv.remove(); cv = null; }
    if (onKey) { removeEventListener('keydown', onKey, true); stage.removeEventListener('pointerdown', onKey, true); onKey = null; } const d = done; done = null; if (d) d(); }
  function draw() {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, t = (performance.now() - t0) / 1000, step = Math.floor(t * 14), gw = words();
    c.fillStyle = '#05030c'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const x = rnd(i, 1) * W, y = (rnd(i, 2) * H + t * (30 + 60 * rnd(i, 3))) % H;   // binary rain, faint, behind
      c.font = `${12 + 10 * rnd(i, 4)}px "Major Mono Display", monospace`; c.fillStyle = rnd(i, 5) < 0.8 ? 'rgba(154,82,255,0.18)' : 'rgba(77,255,154,0.16)'; c.fillText(rnd(i, step) < 0.5 ? '0' : '1', x, y); }
    const LH = H * 0.075, speed = H * 0.055, y0 = H + LH - t * speed;   // the roll
    c.textAlign = 'center'; c.textBaseline = 'middle';
    CREDITS.forEach((line, i) => { const y = y0 + i * LH; if (y < -LH || y > H + LH || !line) return;
      const head = line.startsWith('#'), txt = head ? line.slice(1) : line, size = head ? H * 0.05 : H * 0.036;
      const age = (H + LH - y) / speed, land = Math.min(1, age / 1.4);   // seconds since it came on screen: it scrambles, then lands
      const solid = land >= 1 && rnd(i, step) > 0.06;                 // (and still flickers now and then — it's his text)
      if (solid) { c.font = `400 ${size}px "Major Mono Display", monospace`; c.fillStyle = '#2a0f63'; c.fillText(txt, W / 2 - 3, y + 2); c.fillStyle = head ? '#c9a7ff' : '#f2eaff'; c.fillText(txt, W / 2, y); return; }
      // still arriving: his glitch language, mixed — swapped for a glitch word, letters rotting, a binary-green flash, a font jump
      const kind = Math.floor(rnd(i * 7, step) * 4), j = (rnd(i, step + 1) - 0.5) * 18 * (1 - land);
      let s = txt, col = '#9a52ff', font = `400 ${size}px ${FONTS[Math.floor(rnd(i, step + 2) * FONTS.length)]}`;
      if (kind === 0 && land < 0.6) s = gw[Math.floor(rnd(i, step + 3) * gw.length)];
      else if (kind === 1) s = [...txt].map((ch, k) => ch !== ' ' && rnd(k, i + step) < 0.5 * (1 - land) ? '#%@!?/_~'[Math.floor(rnd(k + 9, step) * 8)] : ch).join('');
      else if (kind === 2) { s = [...txt].map((ch, k) => ch === ' ' ? ch : rnd(k, step) < 0.5 ? '0' : '1').join(''); col = '#4dff9a'; }
      else col = rnd(i, step + 4) < 0.5 ? '#e03ccf' : '#c9a7ff';
      c.font = font; c.fillStyle = '#e03ccf'; c.fillText(s, W / 2 + j + 3, y); c.fillStyle = '#2f9bff'; c.fillText(s, W / 2 + j - 3, y + 1); c.fillStyle = col; c.fillText(s, W / 2 + j, y); });
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    if (y0 + CREDITS.length * LH < -LH && (!audio || audio.ended || audio.paused)) { stop(); return; }
    raf = requestAnimationFrame(draw); }
  return {
    play(opts = {}) { stop(); done = opts.onDone || null;
      cv = document.createElement('canvas'); const r = stage.getBoundingClientRect(); cv.width = Math.round(r.width * (devicePixelRatio || 1)); cv.height = Math.round(r.height * (devicePixelRatio || 1));
      Object.assign(cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: 50 }); stage.appendChild(cv);
      audio = new Audio(play + 'songs/thursday-potato.mp3'); audio.muted = !!opts.muted; audio.play().catch(() => {});
      audio.addEventListener('ended', () => { if (cv) setTimeout(() => cv && stop(), 1500); });
      onKey = e => { e.preventDefault(); stop(); }; setTimeout(() => { if (onKey) { addEventListener('keydown', onKey, true); stage.addEventListener('pointerdown', onKey, true); } }, 1200);
      t0 = performance.now(); raf = requestAnimationFrame(draw); },
    stop, playing: () => !!cv,
  };
}
