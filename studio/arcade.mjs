// arcade.mjs — the living room's game console (Chikin, Nov 8): "when you glitch it, potato can sit on the couch, the controller flips into
// his lap and the screen does a binary transition into a level select screen. Read The Terms is there with an option to play, or an
// option for machine learning". Play = the real level (the game ships with the site under /arcade/); Machine Learning = the binary
// Potato beating it on his own (the recorded demo). room.mjs calls start() when the console is glitched.
const ML_VIDEO = 'demo/read-the-terms-ml.mp4', GAME = '../arcade/run/?play=read-the-terms';
const css = `
#arc-pad{position:fixed;z-index:9;width:64px;height:30px;pointer-events:none;transition:none}
#arc-pad svg{width:100%;height:100%;overflow:visible}
#arc{position:fixed;inset:0;z-index:20;display:grid;place-items:center;background:#05070a;color:#b4ffd2;font:400 16px/1.4 Inter,system-ui,sans-serif;opacity:0;transition:opacity .25s}
#arc.on{opacity:1}
#arc canvas.bin{position:absolute;inset:0;width:100%;height:100%}
#arc .menu{position:relative;display:grid;gap:18px;justify-items:center;padding:28px 34px;border:3px solid #4dff9a;border-radius:14px;background:#0b0710e6;box-shadow:0 0 0 2px #120a05,0 0 40px #4dff9a33;opacity:0;transform:scale(.96);transition:opacity .3s,transform .3s}
#arc.ready .menu{opacity:1;transform:none}
#arc .k{font:400 13px "Major Mono Display",monospace;color:#4dff9a;letter-spacing:.2em}
#arc h2{margin:0;font:400 clamp(28px,6vw,52px)/1 "Major Mono Display",monospace;color:#f4ead8;text-shadow:3px 0 #7b3cf2,-3px 0 #e03ccf}
#arc .row{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
#arc button{padding:12px 20px;border:3px solid #120a05;border-radius:10px;font:700 17px Inter,system-ui,sans-serif;cursor:pointer}
#arc button.play{background:#4dff9a;color:#0b0710}#arc button.ml{background:#2a0f63;color:#c9a7ff;border-color:#7b3cf2}
#arc button.back{background:none;border:0;color:#c9a7ff;text-decoration:underline;font-weight:400;font-size:15px}
#arc button:focus-visible{outline:3px solid #fff;outline-offset:3px}
#arc .full{position:fixed;inset:0;background:#000;display:grid;place-items:center}
#arc .full iframe,#arc .full video{width:100%;height:100%;border:0;object-fit:contain;background:#000}
#arc .full .x{position:absolute;right:16px;top:16px;z-index:2;background:#0b0710d0;color:#c9a7ff;border:1px solid #c9a7ff66;font-weight:400}`;

export function installArcade({ intro, glitch, music }) {
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);
  const stage = () => document.getElementById('stage') || document.body;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let busy = false;

  // the controller: off the console, a flip through the air, into his lap (screen space, from where the console sits under the TV)
  function flipPad() {
    const R = stage().getBoundingClientRect(), me = intro.rect();
    const pad = document.createElement('div'); pad.id = 'arc-pad';
    pad.innerHTML = '<svg viewBox="0 0 64 30"><rect x="2" y="2" width="60" height="26" rx="13" fill="#3a3f4c" stroke="#120a05" stroke-width="3"/><circle cx="18" cy="15" r="4" fill="#e85aa8" stroke="#120a05" stroke-width="1.5"/><circle cx="46" cy="15" r="4" fill="#4dd2ff" stroke="#120a05" stroke-width="1.5"/></svg>';
    document.body.append(pad);
    const sx = R.left + R.width * 0.44, sy = R.top + R.height * 0.72;   // the console's cubby (roughly: under the TV)
    const ex = R.left + R.width * (me.x + me.w / 2) - 32, ey = R.top + R.height * (1 - me.y - me.h * 0.42);   // his lap
    const t0 = performance.now(), T = 650;
    return new Promise(done => { (function f(n) { const k = Math.min(1, (n - t0) / T), e = 1 - Math.pow(1 - k, 2);
      const x = sx + (ex - sx) * e, y = sy + (ey - sy) * e - Math.sin(Math.PI * k) * R.height * 0.22;
      pad.style.left = x + 'px'; pad.style.top = y + 'px'; pad.style.transform = `rotate(${720 * e}deg)`;
      if (k < 1) requestAnimationFrame(f); else { pad.style.transform = 'rotate(0deg)'; done(pad); } })(t0); });
  }

  // the TV's binary transition: green 0s and 1s pour down from the screen and fill everything, then the level select rises out of them
  function binary(cv) {
    const x = cv.getContext('2d'), F = 18; let W, H, cols, drops, t0 = performance.now(), raf;
    const size = () => { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); cols = Math.ceil(W / F); drops = Array.from({ length: cols }, () => -Math.random() * 30); };
    size(); x.fillStyle = '#05070a'; x.fillRect(0, 0, W, H);
    (function f() { const k = (performance.now() - t0) / 1000; x.fillStyle = 'rgba(5,7,10,.16)'; x.fillRect(0, 0, W, H); x.font = '600 15px "JetBrains Mono",monospace';
      for (let i = 0; i < cols; i++) { const d = Math.abs(i - cols / 2) / (cols / 2); if (d > k * 1.6) continue;   // it spreads out from the middle (the TV)
        const y = drops[i] * F; x.fillStyle = Math.random() < 0.06 ? '#e3ffee' : '#4dff9a'; x.fillText(Math.random() < 0.5 ? '0' : '1', i * F, y);
        drops[i] = y > H && Math.random() > 0.975 ? 0 : drops[i] + 1; }
      raf = requestAnimationFrame(f); })();
    return () => cancelAnimationFrame(raf);
  }

  function close(o, pad) { o.classList.remove('on'); setTimeout(() => o.remove(), 260); if (pad) pad.remove(); intro.propOff && intro.propOff('console'); music(true); glitch(); busy = false; }

  function full(o, html) {
    const f = document.createElement('div'); f.className = 'full'; f.innerHTML = html + '<button type="button" class="x">Back to the couch</button>'; o.append(f);
    const v = f.querySelector('video'); if (v) v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    f.querySelector('.x').onclick = () => { if (v) v.pause(); f.remove(); o.querySelector('.menu button.play').focus(); };
  }

  async function start() {
    if (busy) return; busy = true;
    intro.sitOn && intro.sitOn('couch');
    for (let i = 0; i < 40 && intro.props().on !== 'couch'; i++) await wait(100);   // (until he's sat down: 4 s at most)
    await wait(250);
    const pad = await flipPad();
    await wait(350);
    glitch(); music(false);
    const o = document.createElement('div'); o.id = 'arc'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'level select');
    o.innerHTML = `<canvas class="bin" aria-hidden="true"></canvas><div class="menu"><span class="k">select level</span><h2>read the terms</h2>
      <div class="row"><button type="button" class="play">▶ Play</button><button type="button" class="ml">Machine Learning</button></div>
      <button type="button" class="back">Back to the couch</button></div>`;
    document.body.append(o); requestAnimationFrame(() => o.classList.add('on'));
    const stop = binary(o.querySelector('canvas'));
    await wait(1100); o.classList.add('ready'); o.querySelector('.play').focus();
    o.querySelector('.play').onclick = () => full(o, `<iframe src="${GAME}" allow="autoplay; fullscreen" title="Read the Terms"></iframe>`);
    o.querySelector('.ml').onclick = () => full(o, `<video src="${ML_VIDEO}" controls playsinline></video>`);
    o.querySelector('.back').onclick = () => { stop(); close(o, pad); };
    addEventListener('keydown', function esc(e) { if (e.key !== 'Escape' || !o.isConnected) return; if (o.querySelector('.full')) return; removeEventListener('keydown', esc); stop(); close(o, pad); });
  }
  return { start };
}
