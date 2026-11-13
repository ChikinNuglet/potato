// drive.mjs: YOU DRIVE POTATO. One file for every page he walks (the front door, The Science, ...), so he is the same Potato everywhere.
// (Chikin, Nov 13 2026: "he should always be able to be potato, thats canon" / "it doesnt work if he cant be potato".)
//   left / right (or A / D): walk          tap tap: a spin          up (or W): jump, again in the air: a flip          down (or S): duck
//   space (or G): glitch                    C: change his clothes
//   The krzzt key shows the keys and, on a phone, the thumb keys. After about ten seconds of being driven he glitches away to the far side of the
//   screen and is his own again for a few seconds ("he should be able to take back control after about ten seconds"). If the page has a home
//   costume (opts.home, e.g. 'mad-scientist' on The Science) he puts it back on when he takes himself back.
// installDrive(living, pet, { home }) -> window.__drive.  The page starts him first (living/lm/engine/host-pet.mjs startPet()).
export function installDrive(lv, pet, opts = {}) {
    // TAKE CONTROL (Chikin, Nov 12: "you should be able to take control of potato"). His engine's own drive call (living.drive, added Nov 12): hold
    // left or right and he WALKS with his own walk; up is a jump that lands on his feet; the purple key glitches him. Let go and half a second later
    // he is his own again. Off until the krzzt key is pressed, so arrow keys and thumbs scroll the page as usual.
    const want = { x: 0 }, HOME = opts.home || '', act = { left: () => { const n = performance.now(); if (want.tapK === -1 && n - want.tapT < 480) { want.tapK = 0; want.x = 0; act.spin(-1); return; } want.tapK = -1; want.tapT = n; want.x = -1; want.face = -1; },   // a double tap = a spin
      right: () => { const n = performance.now(); if (want.tapK === 1 && n - want.tapT < 480) { want.tapK = 0; want.x = 0; act.spin(1); return; } want.tapK = 1; want.tapT = n; want.x = 1; want.face = 1; }, stop: () => { want.x = 0; lv.drive(0, { x: 0 }); }, up: () => { if (lv.body.mode[0] === lv.MODE.free) { lv.drive(0, { flip: want.x || want.face || 1 }); return; } want.duck = false; lv.drive(0, { duck: false }); lv.drive(0, { x: want.x, jump: true }); },   // up again in the air = a flip
      duck: () => { want.duck = true; lv.drive(0, { x: 0 }); lv.drive(0, { duck: true }); }, spin: d => { lv.drive(0, { x: 0 }); lv.drive(0, { spin: d }); }, unduck: () => { if (want.duck) { want.duck = false; lv.drive(0, { duck: false }); } }, glitch: () => pet.zap(),
      costume: () => { const L = [HOME, ...['', 'disco-legend', 'castle-knight', 'tin-robot', 'noir-detective', 'suit-tie', 'circuit-cyborg', 'sheet-ghost', 'burglar', 'mad-scientist'].filter(x => x !== HOME)]; act.look = ((act.look || 0) + 1) % L.length; const slug = L[act.look]; pet.zap();
        if (!slug) { lv.wear(0, null); return; } import(new URL('../studio/lib/outfits3d.mjs', import.meta.url).href).then(m => m.loadOutfit(slug)).then(b => { if (L[act.look] === slug) lv.wear(0, b); }).catch(() => {}); } };
    // (Nov 13, Chikin on his phone: "i cant spin on phone, and there are two contoll buttons, only the gitch button needs to be identified, and it should look like a
    //  glitch": the double tap for a spin is given a thumb's time, 480 ms; the clothes key is a plain key now; the glitch key is the only purple one, torn and twitching.)
    // (the keys work from the start now: left / right walk, up or space jumps, G glitches, C changes his clothes. The krzzt key only shows the thumb keys.)
    const wearHome = () => { if (!HOME) { lv.wear(0, null); return; } import(new URL('../studio/lib/outfits3d.mjs', import.meta.url).href).then(m => m.loadOutfit(HOME)).then(bd => { if ((act.look || 0) === 0) lv.wear(0, bd); }).catch(() => {}); }; if (HOME) wearHome();
    const st = document.createElement('style'); st.textContent = `#drive{position:fixed;right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));z-index:50;height:44px;padding:0 14px;background:var(--glitch,#9a52ff);color:var(--ink,#120a05);border:3px solid var(--ink,#120a05);border-radius:8px 11px 7px 10px;box-shadow:3px 0 0 var(--magenta,#e03ccf),-3px 0 0 #4dff9a,0 5px 0 var(--ink,#120a05);font:400 .86rem/1 var(--his,"Major Mono Display",ui-monospace,Menlo,monospace);letter-spacing:.04em;cursor:pointer;animation:drvpop 3.2s steps(1) infinite}
#drive:active{transform:translateY(3px);box-shadow:2px 0 0 var(--magenta,#e03ccf),-2px 0 0 #4dff9a,0 2px 0 var(--ink,#120a05)}
@keyframes drvpop{0%,86%,100%{transform:none}88%{transform:translate(-2px,1px) skewX(-6deg)}91%{transform:translate(3px,-1px)}94%{transform:translate(-1px,0) skewX(4deg)}}
#drive[aria-pressed=true]{background:#4dff9a;animation:none}
#drivetip{position:fixed;right:calc(max(10px,env(safe-area-inset-right)) + 96px);top:calc(max(10px,env(safe-area-inset-top)) + 9px);z-index:50;padding:5px 4px;color:#c9a7ff;font:400 .86rem/1.2 var(--his,"Major Mono Display",ui-monospace,Menlo,monospace);text-transform:lowercase;text-shadow:2px 0 #e03ccf,-2px 0 #7b3cf2,0 2px 0 #12062e,0 -2px 0 #12062e,2px 2px 0 #12062e,-2px -2px 0 #12062e,0 0 6px #12062e,0 0 14px #12062e;white-space:nowrap;pointer-events:none}
#drivehow{position:fixed;right:max(10px,env(safe-area-inset-right));top:calc(max(10px,env(safe-area-inset-top)) + 56px);z-index:50;display:none;padding:10px 12px;background:var(--plate,#0c1f14);color:var(--text,#e8f5ec);border:3px solid var(--ink,#120a05);border-radius:9px 13px 8px 12px;box-shadow:var(--ring,0 0 0 2px #12301f),3px 4px 0 2px var(--ink,#120a05);font:400 .74rem/1.7 var(--his,"Major Mono Display",ui-monospace,Menlo,monospace)}
#drivehow.on{display:block}#drivehow b{color:var(--warm,#ffd9a0);font-weight:400}
@media (prefers-reduced-motion:reduce){#drive{animation:none}}
@media (max-width:620px){#h1,.tag{margin-right:84px}#drivetip{display:none}}
#deck{position:fixed;left:0;right:0;bottom:max(8px,env(safe-area-inset-bottom));z-index:50;display:none;justify-content:space-between;padding:0 max(10px,env(safe-area-inset-left));pointer-events:none}
#deck.on{display:flex}#deck div{display:flex;gap:8px;pointer-events:auto}
#deck button{width:60px;height:60px;background:var(--plate,#0c1f14);color:var(--warm,#ffd9a0);border:3px solid var(--ink,#120a05);border-radius:9px 13px 8px 12px;box-shadow:var(--ring,0 0 0 2px #12301f),3px 4px 0 2px var(--ink,#120a05);font:400 1.2rem var(--his,"Major Mono Display",ui-monospace,Menlo,monospace);cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}
#deck button:active{transform:translate(2px,3px);box-shadow:var(--ring,0 0 0 2px #12301f)}#deck .g{display:grid;place-items:center;background:#7b3cf2;color:#12062e;border-color:#12062e;box-shadow:none;clip-path:polygon(8% 0,100% 0,100% 26%,76% 26%,76% 42%,100% 42%,100% 100%,0 100%,0 74%,24% 74%,24% 58%,0 58%,0 16%,8% 16%);filter:drop-shadow(-5px 0 #e03ccf) drop-shadow(5px 0 #4dff9a);animation:deckg 2.2s steps(1) infinite}#deck .g:active{box-shadow:none;filter:drop-shadow(-7px 0 #e03ccf) drop-shadow(7px 0 #4dff9a)}@keyframes deckg{0%,82%{translate:0 0}84%{translate:-4px 1px;clip-path:polygon(0 0,100% 0,100% 18%,84% 18%,84% 36%,100% 36%,100% 100%,0 100%,0 64%,18% 64%,18% 50%,0 50%)}88%{translate:3px -1px}92%{translate:0 0}}@media (prefers-reduced-motion:reduce){#deck .g{animation:none}}@media (max-width:430px){#deck button{width:52px;height:56px}#deck div{gap:6px}}`; document.head.append(st);
    const drive = document.createElement('button'); drive.id = 'drive'; drive.type = 'button'; drive.textContent = 'krzzt'; drive.setAttribute('aria-pressed', 'false'); drive.setAttribute('aria-label', 'Take control of Potato');
    const deck = document.createElement('div'); deck.id = 'deck'; deck.innerHTML = '<div><button type="button" data-a="left" aria-label="Walk left, tap twice to spin">&lt;</button><button type="button" data-a="right" aria-label="Walk right, tap twice to spin">&gt;</button><button type="button" data-a="duck" aria-label="Duck">v</button></div><div><button type="button" data-a="costume" aria-label="Change his clothes">&amp;</button><button type="button" class="g" data-a="glitch" aria-label="Glitch"><svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M2 5h13v4H2zM9 11h13v4H9zM4 17h11v4H4z" fill="currentColor"/></svg></button><button type="button" data-a="up" aria-label="Jump">^</button></div>';
    const tip = document.createElement('div'); tip.id = 'drivetip'; tip.dataset.t = 'you can drive me.'; tip.setAttribute('aria-hidden', 'true');
    const how = document.createElement('div'); how.id = 'drivehow'; how.innerHTML = '<b>&lt; &gt;</b> walk &middot; tap tap: spin<br><b>^</b> jump &middot; again in the air: flip<br><b>v</b> duck<br><b>space</b> glitch &middot; <b>c</b> clothes';
    drive.setAttribute('aria-label', 'Drive Potato: show the keys'); document.body.append(drive, tip, how, deck); let driving = false;
    // WHEN IT IS POTATO TALKING, IT IS POTATO (Chikin, Nov 13: "can we make the you can drive me glitch in and out of his glitch text....whenever it is potato, it should be potato").
    // Same as his words in the house: no speech box, his purple lettering; the line arrives as his glitch words, settles left to right, and whole words keep slipping back into his language.
    { if (!window.POTATO_GLITCH_WORDS) { const g = document.createElement('script'); g.src = new URL('../studio/lib/glitchwords.js', import.meta.url).href; document.head.append(g); }
      const W = () => window.POTATO_GLITCH_WORDS || ['krrzzt', 'wh@t?!', 's0r\u2014t@', 'f1n\u2014e', 'n0p%', '0k@\u2014y'];
      const pick = n => { const all = W(), fit = all.filter(w => w.length <= Math.max(5, n + 3) && w.length >= Math.max(2, n - 3)); const from = fit.length > 6 ? fit : all; return from[Math.floor(Math.random() * from.length)]; };
      let was = '', settle = 0, held = [];
      setInterval(() => { if (tip.hidden) { was = ''; return; } const t = tip.dataset.t || '', words = t.split(' ');
        if (t !== was) { was = t; settle = 0; held = words.map(w => pick(w.length)); tip.textContent = held.join(' '); return; }
        if (settle < words.length) { settle++; tip.textContent = words.map((w, i) => i < settle ? w : held[i]).join(' '); return; }
        if (Math.random() < 0.72) { tip.textContent = t; return; }
        const a = words.slice(), i = Math.floor(Math.random() * a.length); a[i] = pick(words[i].length); tip.textContent = a.join(' '); }, 150); }
    drive.addEventListener('click', () => { driving = !driving; drive.setAttribute('aria-pressed', String(driving)); deck.classList.toggle('on', driving); how.classList.toggle('on', driving); tip.hidden = true; if (driving) act.glitch(); });
    deck.addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); if (mineAgain()) return; const a = b.dataset.a; act[a](); if (a === 'left' || a === 'right' || a === 'duck') b.setPointerCapture(e.pointerId); });
    for (const ev of ['pointerup', 'pointercancel']) deck.addEventListener(ev, e => { const b = e.target.closest('button'); if (b && (b.dataset.a === 'left' || b.dataset.a === 'right') && want.x) act.stop();   /* (Nov 13: lifting the thumb used to stop him even when the tap had just started a SPIN, so a phone could never spin him; a key never had this, it only stops a walk) */ if (b && b.dataset.a === 'duck') act.unduck(); });
    addEventListener('keydown', e => { if (e.metaKey || e.ctrlKey || e.altKey || (e.target.closest && e.target.closest('input,textarea,select,button,a'))) return;
      const a = mineAgain() ? null : { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', Space: 'glitch', KeyG: 'glitch', KeyC: 'costume', KeyA: 'left', KeyD: 'right', KeyW: 'up', ArrowDown: 'duck', KeyS: 'duck' }[e.code]; if (!a) return; e.preventDefault(); if (!e.repeat) act[a](); });
    addEventListener('keyup', e => { if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && want.x < 0 || (e.code === 'ArrowRight' || e.code === 'KeyD') && want.x > 0) act.stop(); if (e.code === 'ArrowDown' || e.code === 'KeyS') act.unduck(); });
    // HE TAKES HIMSELF BACK (Chikin, Nov 13: "on the web, he should be able to take back control after about ten seconds" / "he glitches away if possible" /
    // "to the other side of the screen"): about ten seconds of being driven, then he glitches out, turns up on the far side, and is his own for a few seconds.
    let drivenMs = 0, lastIn = 0, awayUntil = 0, lastT = performance.now();
    const mineAgain = () => { const n = performance.now(); if (n < awayUntil) return true; lastIn = n; return false; };
    const takeBack = () => { const b = lv.body, R = lv.room, x = b.x[0], mid = (R.left + R.right) / 2, to = x < mid ? R.right - 1.3 : R.left + 1.3; drivenMs = 0; awayUntil = performance.now() + 4200; want.x = 0; want.duck = false;
      lv.drive(0, { x: 0 }); lv.drive(0, { duck: false }); pet.zap(); tip.dataset.t = 'my turn.'; tip.hidden = false; if ((act.look || 0) !== 0) { act.look = 0; wearHome(); }   // (back to the page's own costume, if you changed it)
      setTimeout(() => { try { if (lv.place(0, to)) pet.zap(); } catch (e) {} }, 420);   // (mid-glitch he is somewhere else; if he is in the air he just keeps himself)
      setTimeout(() => { tip.hidden = true; }, 2600); };
    (function hold() { const n = performance.now(), dt = Math.min(100, n - lastT); lastT = n; if (n < awayUntil) { requestAnimationFrame(hold); return; }
      if (want.x || want.duck) lastIn = n;   // (a held thumb counts as driving the whole time)
      if (n - lastIn < 1500) drivenMs += dt; else drivenMs = Math.max(0, drivenMs - dt * 2); if (drivenMs > 10000) { takeBack(); requestAnimationFrame(hold); return; }
      if (want.duck) lv.drive(0, { duck: true }); else if (want.x) lv.drive(0, { x: want.x }); requestAnimationFrame(hold); })();   // (a held key keeps his brain standing down and his walk going)
    window.__drive = { act, on: () => driving };
  return window.__drive;
}
