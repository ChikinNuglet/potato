// dev.mjs — DEV MODE (Matt, Nov 2: "next studio publish I need to be able to choose where I am in the song, we need a dev mode").
// Turn it on with ` (backtick) or by opening the page with #dev. A small panel on the stage: pick a level (Boo too), play / watch
// (the demo) / video, a time bar for the whole song with the sections marked, section buttons, and [ ] = 5 s back / on
// (shift: 15 s). While a level runs the bar follows the song; drag it and let go to jump there. Everything goes through window.RUN
// (main.mjs), so the game itself is unchanged when dev mode is off. Remembered per browser.
const EXTRA = [{ id: 'boo-not-found', n: 404, title: '404 Boo Not Found (secret)' }];
const fmt = t => (t < 0 ? '-' : '') + Math.floor(Math.abs(t) / 60) + ':' + String(Math.floor(Math.abs(t) % 60)).padStart(2, '0');
let on = false, how = 'start', dragging = false, el = null, busy = false;
try { on = localStorage.getItem('potato-dev') === '1'; } catch (e) {}
if (location.hash === '#dev') on = true;

const css = `#dev { position: absolute; right: 10px; top: 10px; z-index: 60; width: min(360px, calc(100% - 20px)); background: #120a05ee; color: #fff2dc;
  border: 3px solid #120a05; box-shadow: 0 0 0 3px #fff6e0, 5px 5px 0 3px #120a05; border-radius: 12px; padding: 8px 10px; font: 12px/1.35 Inter, system-ui, sans-serif; }
#dev h4 { margin: 0 0 6px; font: 400 13px "Major Mono Display", monospace; color: #da9643; display: flex; justify-content: space-between; align-items: center; }
#dev h4 button { background: none; border: 0; color: #c9a7ff; cursor: pointer; font: inherit; padding: 0 2px; }
#dev .row { display: flex; gap: 6px; align-items: center; margin: 5px 0; flex-wrap: wrap; }
#dev select, #dev button.b { font: 12px Inter, system-ui, sans-serif; background: #2a1a0e; color: #fff2dc; border: 2px solid #da9643; border-radius: 7px; padding: 3px 7px; cursor: pointer; }
#dev button.b.on { background: #da9643; color: #120a05; }
#dev select { flex: 1; min-width: 0; }
#dev .bar { position: relative; height: 26px; }
#dev .bar input { position: absolute; inset: 0; width: 100%; margin: 0; accent-color: #9a52ff; }
#dev .ticks { position: absolute; left: 0; right: 0; top: 0; height: 6px; pointer-events: none; }
#dev .ticks i { position: absolute; top: 0; width: 2px; height: 6px; background: #c9a7ff; }
#dev .time { font: 400 14px "Major Mono Display", monospace; color: #ffe9a8; min-width: 92px; }
#dev .secs { display: flex; flex-wrap: wrap; gap: 4px; max-height: 84px; overflow: auto; }
#dev .secs button { font: 11px Inter, system-ui, sans-serif; background: #1d1230; color: #e7dcff; border: 1px solid #9a52ff; border-radius: 6px; padding: 2px 6px; cursor: pointer; }
#dev .keys { opacity: .65; font-size: 11px; }`;

function levels() { const R = window.RUN; return [...(R ? R.LEVELS : []), ...EXTRA]; }
function curId() { const R = window.RUN; return R && R.meta ? R.meta.id : ($('dlevel') ? $('dlevel').value : 'thursday-potato'); }
const $ = id => document.getElementById(id);
function songLen() { const R = window.RUN; const C = R && R.C; const a = R && R.audio;
  return Math.max(10, (C && C.def && C.def.end) || (a && isFinite(a.duration) ? a.duration : 0) || 240); }
function nowT() { const R = window.RUN; return R && R.sim && R.sim.s ? R.sim.s.t : 0; }

async function go(t) {
  const R = window.RUN; if (!R || busy) return; busy = true;
  const id = $('dlevel').value;
  try { if (R.audio) R.audio.pause(); document.querySelectorAll('#stage .screen').forEach(s => { s.hidden = true; });   // (from the title or the kitchen)
    await R[how](id, Math.max(0, t)); } catch (e) { console.error('dev go', e); }
  busy = false; build(); }

function build() {
  if (!el) return; const R = window.RUN, C = R && R.C, id = curId(), L = songLen();
  const sel = $('dlevel'); if (!sel.options.length) for (const l of levels()) sel.add(new Option(`${l.n}. ${l.title}`, l.id));
  if (R && R.meta) sel.value = R.meta.id;
  const bar = $('dbar'); bar.max = L.toFixed(1);
  const secs = (C && C.def && R.meta && R.meta.id === sel.value && C.def.sections) || [];
  $('dticks').innerHTML = secs.map(s => `<i style="left:${(100 * s[1] / L).toFixed(2)}%"></i>`).join('');
  $('dsecs').innerHTML = secs.map((s, i) => `<button data-t="${s[1]}" title="${fmt(s[1])}">${fmt(s[1])} ${String(s[0]).replace(/</g, '&lt;')}</button>`).join('') || '<span class="keys">sections show once the level has opened</span>';
  [...el.querySelectorAll('[data-how]')].forEach(b => b.classList.toggle('on', b.dataset.how === how));
  void id; }

function mount() {
  if (el) { el.hidden = !on; return; }
  if (!on) return;
  const stage = $('stage'); if (!stage) return;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  el = document.createElement('div'); el.id = 'dev';
  el.innerHTML = `<h4>dev mode <button id="dx" title="hide (\`)">✕</button></h4>
  <div class="row"><select id="dlevel" aria-label="level"></select></div>
  <div class="row"><button class="b" data-how="start">play</button><button class="b" data-how="demo">watch</button><button class="b" data-how="video">video</button><span class="time" id="dtime">0:00</span></div>
  <div class="bar"><div class="ticks" id="dticks"></div><input type="range" id="dbar" min="0" max="240" step="0.1" value="0" aria-label="where in the song"></div>
  <div class="row"><button class="b" id="dgo">go from here</button><button class="b" id="dback">−5s</button><button class="b" id="dfwd">+5s</button></div>
  <div class="secs" id="dsecs"></div>
  <div class="keys">\` hide · [ ] 5 s · shift 15 s · esc kitchen</div>`;
  stage.appendChild(el);
  el.addEventListener('keydown', e => e.stopPropagation());
  $('dx').onclick = () => toggle(false);
  el.querySelectorAll('[data-how]').forEach(b => b.onclick = () => { how = b.dataset.how; build(); });
  const bar = $('dbar');
  bar.addEventListener('input', () => { dragging = true; $('dtime').textContent = fmt(+bar.value); });
  bar.addEventListener('change', () => { dragging = false; go(+bar.value); });
  $('dgo').onclick = () => go(+bar.value);
  $('dback').onclick = () => go(nowT() - 5);
  $('dfwd').onclick = () => go(nowT() + 5);
  $('dsecs').onclick = e => { const t = e.target.dataset && e.target.dataset.t; if (t != null) go(+t); };
  $('dlevel').onchange = () => { $('dbar').value = 0; $('dtime').textContent = '0:00'; };
  build(); el.hidden = !on;
  const tick = () => { if (el && !el.hidden && !dragging && window.RUN && window.RUN.mode === 'run') { const t = nowT(); bar.value = t; $('dtime').textContent = fmt(t); }
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  let last = null; setInterval(() => { const m = window.RUN && window.RUN.meta && window.RUN.meta.id; if (m !== last) { last = m; build(); } }, 500);
}
function toggle(v) { on = v; try { localStorage.setItem('potato-dev', on ? '1' : '0'); } catch (e) {} mount(); }

addEventListener('keydown', e => {
  if (e.code === 'Backquote' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); toggle(!on); return; }
  if (!on || !window.RUN || window.RUN.mode !== 'run') return;
  if (e.code === 'BracketLeft' || e.code === 'BracketRight') { e.preventDefault(); const d = (e.shiftKey ? 15 : 5) * (e.code === 'BracketLeft' ? -1 : 1); if ($('dlevel') && window.RUN.meta) $('dlevel').value = window.RUN.meta.id; go(nowT() + d); }
});
const wait = () => window.RUN ? mount() : setTimeout(wait, 100); wait();
