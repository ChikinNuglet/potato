// THE COUPON (Potato's origin film) plays the first time someone walks into the house (D-49: "you have to know his story").
// After that it never auto-plays again for them; it lives as a tape in the cave (and later as a file on his computer).
// Full-screen, one big play button (browsers block sound until a tap), skip after a few seconds, Esc skips too.
export const FILM = { src: '../studio/film/the-coupon.mp4', poster: '../studio/film/the-coupon.jpg' };
export function playFilm({ store, force = false } = {}) {
  return new Promise(done => {
    if (!force && store && store.get('potato-film-seen') === '1') return done(false);
    const w = document.createElement('div');
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'The Coupon, Potato\'s story');
    w.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;display:grid;place-items:center';
    w.innerHTML = '<video playsinline preload="auto" style="width:100%;height:100%;object-fit:contain" poster="' + FILM.poster + '" src="' + FILM.src + '"></video>' +
      '<button data-play aria-label="play his story" style="position:absolute;inset:0;margin:auto;width:min(150px,30vw);height:min(150px,30vw);border-radius:50%;border:0;background:rgba(123,60,242,.85);color:#fff;font:700 clamp(40px,9vw,64px) system-ui;cursor:pointer;box-shadow:0 0 0 6px rgba(201,167,255,.35),0 0 50px #7b3cf2">&#9654;</button>' +
      '<button data-skip style="position:absolute;right:max(16px,env(safe-area-inset-right));top:max(16px,env(safe-area-inset-top));padding:10px 16px;border-radius:10px;border:1px solid #c9a7ff55;background:rgba(8,6,16,.75);color:#c9a7ff;font:13px Menlo,monospace;cursor:pointer;opacity:0;transition:opacity .4s">skip &rarr;</button>';
    document.body.append(w);
    const v = w.querySelector('video'), play = w.querySelector('[data-play]'), skip = w.querySelector('[data-skip]');
    let ended = false;
    const end = () => { if (ended) return; ended = true; try { store && store.set('potato-film-seen', '1'); } catch (e) {} v.pause(); w.remove(); removeEventListener('keydown', key); done(true); };
    const key = e => { if (e.key === 'Escape') end(); };
    addEventListener('keydown', key);
    play.onclick = () => { play.remove(); v.play().catch(() => {}); setTimeout(() => { skip.style.opacity = 1; }, 4000); };
    skip.onclick = end; v.onended = end; v.onerror = () => { if (!v.currentTime) end(); };   // no film yet / failed to load: never trap anyone outside the house
    setTimeout(() => { skip.style.opacity = 1; }, 6000);
  });
}
