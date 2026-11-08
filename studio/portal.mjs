// portal.mjs: the terminal in the kitchen opens the 404 and asks for his password. The right one opens the door on the right; walk through it to the
// Read The Terms demo. Nothing says any of this.
const PASSWORD = "ghost";   // THE ONE SETTING (Chikin, Nov 8: "the password on the laptop can change to ghost"). Forgiving: capitals and marks don't matter.
// the right password plays Ghost in the Group Chat's demo (he's the ghost potato in it): Chikin's logo, then Potato's, with a COMING SOON banner, then the demo
const GHOST = { video: 'demo/ghost-in-the-group-chat.mp4', logos: ['../logo/chikin-logo.webp', '../logo/potato-logo.png'] };
const MAIL_ROOM = 'https://script.google.com/macros/s/AKfycbyb8YhT3hFSJraHMtuP67eqFd9tPGQ7OSMp20diwlEE_jCstwtS9A-VyepPermUgzC_/exec';   // Potato's mail room: checks a buyer's one-time code
export const PHONE_NOTE = "Best on a computer. Phones and tablets work, but it's rough for now.";
const plain = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const css = `#p404{position:fixed;inset:0;z-index:8;background:#12062e;color:#c9a7ff;display:grid;place-items:center;overflow:auto;padding:16px;clip-path:circle(0 at var(--fx,80%) var(--fy,40%));transition:clip-path .8s steps(12);font:400 16px/1.4 Inter,system-ui,sans-serif}#p404.on{clip-path:circle(150vmax at var(--fx,80%) var(--fy,40%))}
#p404 .bg404{position:fixed;inset:0;display:grid;place-items:center;font:400 min(38vw,60vh)/1 "Major Mono Display",monospace;color:#2a0f63;pointer-events:none;user-select:none}
#p404 .w{position:relative;display:grid;gap:12px;justify-items:center;width:min(760px,100%)}#p404 img{width:min(320px,70vw);filter:drop-shadow(3px 0 #7b3cf2) drop-shadow(-3px 0 #e03ccf)}
#p404 .frame{width:100%;aspect-ratio:16/9;background:#0b0710;border:5px solid #120a05;box-shadow:0 0 0 2px #7b3cf2;border-radius:12px;display:grid;place-items:center;overflow:hidden}#p404 video{width:100%;height:100%;display:block}
#p404 .soon{font:400 clamp(22px,5vw,38px)/1 "Major Mono Display",monospace;color:#4dff9a;text-shadow:2px 0 #e03ccf,-2px 0 #2a0f63}
#p404 .exe{width:min(460px,100%);box-sizing:border-box;background:#0b0710;border:3px solid #4dff9a;border-radius:6px;padding:14px 16px;font:400 clamp(15px,4.2vw,19px)/1.5 "Major Mono Display",monospace;color:#4dff9a;box-shadow:0 0 18px #4dff9a55;text-align:left}#p404 .exe .ln{overflow:hidden;white-space:nowrap;width:0;animation:ty .8s steps(19) .7s forwards}@keyframes ty{to{width:100%}}
#p404 .exe form{display:flex;align-items:center;gap:8px;width:100%;margin-top:6px}#p404 .exe input{flex:1;min-width:0;padding:4px 0;background:none;border:0;outline:0;color:#b4ffd2;font:inherit;font-size:max(16px,1em);caret-color:#4dff9a}#p404 .exe input::placeholder{color:#2f8f5c}#p404 .exe button{padding:4px 10px;background:#4dff9a;color:#0b0710;border:0;border-radius:4px;font:inherit;cursor:pointer}
#p404 .exe .boot{display:none;margin-top:8px}#p404 .exe.go .boot{display:block}#p404 .exe.go form{display:none}#p404 .exe .boot b{display:flex;justify-content:space-between;font-weight:400}#p404 .exe .bar{height:14px;border:2px solid #4dff9a;margin-top:4px}#p404 .exe .bar i{display:block;height:100%;width:0;background:#4dff9a}
#p404 .note{margin:0;width:min(460px,100%);text-align:center;font:400 14px/1.4 Inter,system-ui,sans-serif;color:#c9a7ff}
#p404 form{display:flex;gap:8px;width:min(420px,100%)}#p404 input{flex:1;min-width:0;padding:10px;font-size:16px;background:#0b0710;color:#f4ead8;border:3px solid #7b3cf2;border-radius:9px}#p404 button{padding:10px 14px;border:3px solid #120a05;border-radius:9px;background:#da9643;color:#120a05;font:700 15px Inter,system-ui,sans-serif;cursor:pointer}#p404 .no{animation:sh .24s steps(4)}@keyframes sh{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`;
export function installPortal({ glitch, music, opened = () => {} }) {
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);
  function screen(html) { glitch(); music(false); const o = document.createElement('div'); o.id = 'p404'; o.style.setProperty('--fx', '82%'); o.style.setProperty('--fy', '46%'); o.innerHTML = `<div class="bg404" aria-hidden="true">404</div><div class="w"><img src="lib/logo-potato.webp" alt="Potato">${html}</div>`; document.body.append(o); requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('on'))); ['keydown', 'keyup'].forEach(k => o.addEventListener(k, e => e.stopPropagation())); return o; }
  // the box, in Thursday Potato's terminal: "> launch potato.exe", the prompt, and on the right word the potato.exe bar fills and he's in. check(words) says yes or no
  const exe = hint => `<div class="exe"><div class="ln">&gt; launch potato.exe</div><form><span aria-hidden="true">&gt;</span><input aria-label="${hint}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${hint}"><button type="submit">run</button></form><div class="boot"><b><span>potato.exe</span><span class="pc">0%</span></b><div class="bar"><i></i></div></div></div>`;
  function runExe(o, check, then) { const box = o.querySelector('.exe'), f = box.querySelector('form'), inp = box.querySelector('input'); setTimeout(() => inp.focus(), 1500); let busy = false;
    f.addEventListener('submit', async e => { e.preventDefault(); if (busy) return; busy = true; const ok = await check(inp.value); busy = false; if (!ok) { box.classList.remove('no'); void box.offsetWidth; box.classList.add('no'); glitch(); inp.select(); return; }
      box.classList.add('go'); const bar = box.querySelector('.bar i'), pc = box.querySelector('.pc'); let n = 0; const id = setInterval(() => { n = Math.min(100, n + 7); bar.style.width = n + '%'; pc.textContent = n + '%'; if (n >= 100) { clearInterval(id); setTimeout(then, 260); } }, 60); }); }
  const close = (o, then) => { const v = o.querySelector('video'); if (v) v.pause(); o.remove(); music(true); glitch(); then && then(); };
  function open() { if (document.getElementById('p404')) return; const o = screen(`<div class="frame"><span class="soon">coming soon</span></div>${exe('password')}<button type="button" class="back">Back to the kitchen</button>`);
    runExe(o, v => plain(v) === plain(PASSWORD), () => { close(o); ghostDemo(); });
    o.querySelector('.back').onclick = () => close(o); }
  function ghostDemo() {   // logos first (Chikin's, then Potato's) under a COMING SOON banner, then the demo plays on its own
    const o = screen(`<div class="frame gd"><img class="lg" alt="" src="${GHOST.logos[0]}"><video playsinline preload="auto" src="${GHOST.video}" style="display:none"></video><div class="cs"><span>coming soon</span></div></div><button type="button" class="back">Back to the kitchen</button>`);
    const f = o.querySelector('.gd'), lg = f.querySelector('.lg'), v = f.querySelector('video');
    const st = document.createElement('style'); st.textContent = '#p404 .gd{position:relative}#p404 .gd .lg{width:min(46%,320px);height:auto;object-fit:contain;transition:opacity .35s}#p404 .gd .cs{position:absolute;left:0;right:0;top:0;height:40px;display:flex;align-items:center;justify-content:center;z-index:2;background:repeating-linear-gradient(-45deg,#f2c53a 0 16px,#120a05 16px 32px)}#p404 .gd .cs span{background:#f2c53a;color:#120a05;padding:3px 16px;border:2px solid #120a05;font:700 clamp(13px,2.6vw,18px)/1.2 Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}';
    o.append(st);
    const steps = [() => { lg.src = GHOST.logos[1]; }, () => { lg.remove(); v.style.display = ''; v.controls = true; v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); }];
    let k = 0; const next = () => { if (!o.isConnected || k >= steps.length) return; lg.style.opacity = 0; setTimeout(() => { if (!o.isConnected) return; steps[k++](); lg.style.opacity = 1; if (k < steps.length) setTimeout(next, 2200); }, 350); };
    setTimeout(next, 2200);
    o.querySelector('.back').onclick = () => close(o); }
  function video(back) { const o = screen(`<div class="frame"><video src="demo/read-the-terms.mp4" controls autoplay playsinline></video></div><button type="button" class="back">Back to the kitchen</button>`); o.querySelector('.back').onclick = () => close(o, back); }
  // the way in, for someone who bought it: their one-time code, once per device (a curtain, not a lock)
  function gate() { return new Promise(done => { const o = screen(exe('your code') + `<p class="note">${PHONE_NOTE}</p><p class="note">Trouble getting in? Email inquiries@thursdaypotato.com</p>`); o.style.zIndex = 100; o.style.transition = 'none'; o.classList.add('on');
    runExe(o, v => fetch(MAIL_ROOM, { method: 'POST', body: JSON.stringify({ action: 'redeem', code: v }) }).then(r => r.json()).then(j => !!j.ok).catch(() => false), () => { o.remove(); music(true); done(); }); }); }
  return { open, video, gate };
}
