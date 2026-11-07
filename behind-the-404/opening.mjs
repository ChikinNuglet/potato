// opening.mjs: the first visit. A plain grocery coupon for an ordinary potato, which you tap. It glitches into his logo, then his binary drips down the screen and the
// kitchen is what's left behind it. First visit only (?coupon=1 forces it). Plain light/dark tears, purple on his logo only.
const WORDS = ['krrzzt', 'wh@t?!', 's0r—t@', 'b0ot…?'];
const css = `#coupon{position:fixed;inset:0;z-index:9;background:#0b0710;display:grid;place-items:center;padding:16px;overflow:hidden}
#coupon button{all:unset;box-sizing:border-box;cursor:pointer;position:relative;width:min(420px,88vw);aspect-ratio:2/1.05;background:#f3dfae;border:6px solid #120a05;border-radius:14px;display:grid;grid-template-columns:34% 1fr;align-items:center;gap:6px;padding:12px 14px;color:#120a05;font:400 clamp(13px,3.4vw,18px)/1.15 "Major Mono Display",monospace;transform:rotate(-2.5deg);animation:cw 2.6s steps(6) infinite}
#coupon button::before{content:"";position:absolute;inset:7px;border:3px dashed #120a0588;border-radius:8px;pointer-events:none}
#coupon button:focus-visible{outline:4px solid #4dff9a;outline-offset:5px}#coupon button:hover{transform:rotate(-1deg) scale(1.03)}
#coupon .me{display:block}#coupon .me svg{display:block;width:100%}#coupon b{font:inherit;font-size:1.5em;display:block;margin-bottom:6px}#coupon small{font:inherit;font-size:.72em;opacity:.75;display:block;margin-top:6px}
#coupon .logo{width:min(560px,86vw);opacity:0;filter:drop-shadow(4px 0 #7b3cf2) drop-shadow(-4px 0 #e03ccf)}
#coupon canvas{position:absolute;inset:0;width:100%;height:100%}
@keyframes cw{50%{transform:rotate(-1.2deg) translateY(-3px)}}`;
const wait = ms => new Promise(r => setTimeout(r, ms));
export function playOpening({ glitch = () => {}, reduced = false, logos = true } = {}) { return new Promise(done => {
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);
  const o = document.createElement('div'); o.id = 'coupon';
  const showLogos = async () => { if (!logos || reduced) return; for (const src of ['lib/chikin-logo.png', 'lib/potato-wordmark.png']) { const im = new Image(); im.src = src; im.alt = ''; im.style.cssText = 'width:min(560px,80vw);opacity:0;transition:opacity .7s;grid-area:1/1'; o.append(im); await new Promise(r => { im.onload = im.onerror = r; }); await wait(60); im.style.opacity = 1; await wait(1700); im.style.opacity = 0; await wait(750); im.remove(); } };
  o.innerHTML = `<button type="button" aria-label="Open the coupon"><i class="me"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12c26-2 38 24 34 46s-20 32-40 30S10 72 14 48 26 14 50 12z" fill="#b98a55" stroke="#120a05" stroke-width="5"/><ellipse cx="38" cy="36" rx="5" ry="3" fill="#7a5730"/><ellipse cx="62" cy="58" rx="6" ry="3.5" fill="#7a5730"/><ellipse cx="44" cy="68" rx="4" ry="2.5" fill="#7a5730"/><ellipse cx="66" cy="32" rx="3.5" ry="2.5" fill="#7a5730"/></svg></i><span><b>50&cent; off</b>one (1) potato. limit one per customer. no cash value.<small>tap to redeem</small></span></button>`;
  document.body.append(o); const btn = o.querySelector('button'); btn.style.visibility = 'hidden'; showLogos().then(() => { btn.style.visibility = ''; btn.focus({ preventScroll: true }); });
  btn.addEventListener('click', async () => { btn.disabled = true; btn.style.animation = 'none'; glitch();
    if (reduced) { finish(); return; }
    for (let i = 0; i < 9; i++) { const a = 10 + Math.random() * 70, b = a + 8 + Math.random() * 18; btn.style.clipPath = i % 3 === 2 ? 'none' : `polygon(0 0,100% 0,100% ${a}%,${6 + i * 3}% ${a}%,${6 + i * 3}% ${b}%,100% ${b}%,100% 100%,0 100%)`; btn.style.transform = `translate(${(Math.random() - .5) * 40}px,${(Math.random() - .5) * 10}px) rotate(${(Math.random() - .5) * 6}deg)`; await wait(55); }
    btn.remove(); const im = new Image(); im.className = 'logo'; im.alt = 'Potato'; im.src = 'lib/logo-potato.webp'; o.append(im); await new Promise(r => { im.onload = im.onerror = r; }); im.style.opacity = 1; glitch();
    for (let i = 0; i < 6; i++) { im.style.transform = `translateX(${i % 2 ? 7 : -7}px) skewX(${i % 2 ? 4 : -4}deg)`; await wait(50); } im.style.transform = 'none'; await wait(1100);
    drip(); });
  function drip() { const c = document.createElement('canvas'), W = c.width = innerWidth, H = c.height = innerHeight, x = c.getContext('2d'), F = 16, n = Math.ceil(W / F), Y = Array.from({ length: n }, () => -Math.random() * H * .7), V = Array.from({ length: n }, () => H / (70 + Math.random() * 60));
    o.style.background = 'transparent'; o.append(c); x.font = `700 ${F}px Menlo, monospace`; x.textAlign = 'center'; const fade = o.querySelector('.logo');
    const black = document.createElement('canvas'); black.width = W; black.height = H; const bx = black.getContext('2d'); bx.fillStyle = '#0b0710'; bx.fillRect(0, 0, W, H);
    (function tick() { let live = false; x.clearRect(0, 0, W, H); for (let i = 0; i < n; i++) { Y[i] += V[i]; if (Y[i] > 0) bx.clearRect(i * F, 0, F, Y[i]); if (Y[i] < H + 80) live = true; }
      x.drawImage(black, 0, 0); for (let i = 0; i < n; i++) for (let k = 0; k < 9; k++) { x.fillStyle = `rgba(77,255,154,${.95 - k * .1})`; x.fillText(Math.random() > .5 ? '1' : '0', i * F + F / 2, Y[i] - k * F); }
      if (fade) fade.style.opacity = Math.max(0, 1 - Math.min(...Y.map(v => Math.max(v, 0))) / 20 - Y.filter(v => v > H * .3).length / n * 1.6);
      if (live) requestAnimationFrame(tick); else finish(); })(); }
  function finish() { o.remove(); st.remove(); done(); }
}); }
