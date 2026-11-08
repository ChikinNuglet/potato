// tapper.mjs — THE TAPPER (Matt, Nov 1: "could you do something that gives me the tapper with the demos, so I can mark where
// important glitches are to help advance the story?"). Pick a song: its demo plays from the top (the bot, the song's own
// look — not the simulation skin — with sound) and stops at the song's end. He taps along:
//   space / TAP = glitch · b = BIG glitch · s = story moment · c = scene change (cut) · z / backspace = undo the last mark
//   p = pause · ← / → = 5 s back / on · n = a note on the last mark · esc = back to the list
// Each mark keeps raw (the song time when the key went down) and t = raw - 0.08 s (a reaction allowance).
// SAVED to the artifact's db, one document per song at taps/<songId>:
//   { song, title, marks: [{ t, raw, kind: 'glitch' | 'big' | 'story' | 'cut', note }], updated: ISO string, n }
// (that's how Claude reads them), and ALWAYS to this browser's localStorage too (local testing + offline); the two merge on
// load, the newer copy wins. Entry: the title's "tapper" button, or the page opened at #tapper.
// The tapper never touches the sim: main.mjs hands it window.RUN (open / demo / now / audio / tap / tapIdle / tapTitle) and
// RUN.tap = { on, paused } tells main to keep the demo in the song's own look, ignore the game keys, hold still on pause and
// not run on into the next song.

const REACT = 0.08, LS_KEY = 'potato404.taps.v1', SAVE_PAUSE = 1200;
const KINDS = {
  glitch: { label: 'GLITCH', col: '#b07bff' },
  big: { label: 'BIG GLITCH', col: '#ff4fe0' },
  story: { label: 'STORY', col: '#ffcf8a' },
  cut: { label: 'CUT', col: '#5dffc0' },
};
const KEYK = { Space: 'glitch', KeyB: 'big', KeyS: 'story', KeyC: 'cut' };
const r3 = x => Math.round(x * 1000) / 1000;
const fmt = t => { const s = Math.max(0, t), m = Math.floor(s / 60), r = s - m * 60; return (t < 0 ? '-' : '') + m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CSS = `
#tapperbtn { background: #2a0f63; color: #f3eaff; border: 3px solid #120a05; box-shadow: 0 0 0 2px #c9a7ff66, 3px 3px 0 #120a05; font: 400 14px Bungee, Inter, sans-serif; letter-spacing: .03em; }
#tapperbtn:hover, #tapperbtn:focus-visible { border-color: #120a05; box-shadow: 0 0 0 2px #c9a7ff, 3px 3px 0 #120a05, 0 0 16px #9a52ff99; }
#tlist { position: fixed; inset: 0; z-index: 50; overflow: auto; -webkit-overflow-scrolling: touch; color: #f3eaff;
  background: radial-gradient(ellipse at 50% 30%, #2a0f63 0%, #12062e 55%, #06020f 100%);
  padding: max(18px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 28px max(16px, env(safe-area-inset-left, 0px)); }
#tlist .tl-in { max-width: 760px; margin: 0 auto; display: grid; gap: 14px; }
#tlist h1 { margin: 6px 0 0; font: 400 clamp(30px, 7vw, 58px)/1 "Major Mono Display", monospace; color: #c9a7ff; text-shadow: 3px 0 #e03ccf, -3px 0 #2a0f63, 0 0 22px #9a52ff88; }
#tlist p { margin: 0; color: #c9a7ffcc; max-width: 60ch; }
#tlist p.tl-say { font: 400 15px Bungee, Inter, sans-serif; color: #ffcf8a; text-shadow: 2px 0 #e03ccf88; padding: 6px 12px; border: 3px solid #120a05; border-radius: 12px; background: #12062e; box-shadow: 0 0 0 2px #9a52ff55, 3px 3px 0 #120a05; justify-self: start; }
#tlist p.tl-say:empty { display: none; }
#tlist .tl-keys { font: 400 12px "Major Mono Display", monospace; color: #c9a7ffaa; line-height: 1.7; }
#tlist .tl-keys b { color: #f3eaff; font-weight: 400; }
#tlist .tl-songs { display: grid; gap: 10px; }
#tlist .tl-row { display: flex; gap: 8px; align-items: stretch; }
#tlist button { font: 400 14px Bungee, Inter, sans-serif; color: #f3eaff; background: #2a0f63; border: 3px solid #120a05; border-radius: 14px;
  box-shadow: 0 0 0 2px #c9a7ff40, 4px 4px 0 #120a05; padding: 10px 14px; cursor: pointer; transition: transform .08s; }
#tlist button:hover, #tlist button:focus-visible { outline: none; border-color: #120a05; box-shadow: 0 0 0 2px #c9a7ff, 4px 4px 0 #120a05, 0 0 18px #9a52ff88; }
#tlist button:active { transform: translate(2px, 2px); box-shadow: 0 0 0 2px #c9a7ff, 2px 2px 0 #120a05; }
#tlist .tl-song { flex: 1; display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; text-align: left; min-width: 0; }
#tlist .tl-n { font: 400 20px "Major Mono Display", monospace; color: #9a52ff; text-shadow: 2px 0 #e03ccf; }
#tlist .tl-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#tlist .tl-c { font: 700 12px Inter, sans-serif; color: #c9a7ff; white-space: nowrap; }
#tlist .tl-c.has { color: #ffcf8a; }
#tlist .tl-copy { font-size: 12px; padding: 6px 12px; background: #12062e; }
#tlist .tl-foot { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.tp-badge { font: 700 11px Inter, sans-serif; padding: 3px 8px; border-radius: 999px; border: 2px solid #120a05; background: #12062e; color: #c9a7ff; white-space: nowrap; }
.tp-badge.bad { background: #5a0b2e; color: #ffd0e6; }
.tp-badge.busy { color: #f3eaff; }
#tpanel { position: absolute; left: 8px; right: 8px; bottom: 8px; z-index: 6; display: grid; gap: 6px; padding: 8px 10px 10px; color: #f3eaff;
  background: #12062ee8; border: 3px solid #120a05; border-radius: 14px; box-shadow: 0 0 0 2px #9a52ff55, 4px 4px 0 #120a05; touch-action: manipulation; user-select: none; -webkit-user-select: none; }
#tpanel .tp-info { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font: 700 12px Inter, sans-serif; min-width: 0; }
#tpanel .tp-title { font: 400 13px Bungee, Inter, sans-serif; color: #c9a7ff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40%; }
#tpanel .tp-time { font: 700 13px "JetBrains Mono", monospace; color: #f3eaff; }
#tpanel .tp-count { color: #ffcf8a; }
#tpanel .tp-legend { margin-left: auto; font: 400 11px "Major Mono Display", monospace; color: #c9a7ffaa; }
#tp-line { position: relative; height: 34px; border-radius: 8px; background: #06020f; border: 2px solid #120a05; box-shadow: inset 0 0 0 1px #9a52ff33; overflow: hidden; cursor: pointer; touch-action: none; -webkit-touch-callout: none; }
#tp-shape { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
#tp-secs i { position: absolute; top: 0; bottom: 0; width: 1px; background: #c9a7ff38; }
#tp-marks .tp-tick { position: absolute; top: 2px; bottom: 2px; width: 12px; margin-left: -6px; cursor: pointer; }
#tp-marks .tp-tick::after { content: ''; position: absolute; left: 4px; top: 0; bottom: 0; width: 4px; border-radius: 2px; background: var(--c); box-shadow: 0 0 6px var(--c); border: 1px solid #120a05; }
#tp-marks .tp-tick.k-big::after { left: 3px; width: 6px; }
#tp-marks .tp-tick.k-story::after, #tp-marks .tp-tick.k-cut::after { top: 6px; }
#tp-marks .tp-tick:hover::after { box-shadow: 0 0 0 2px #f3eaff, 0 0 10px var(--c); }
#tp-head { position: absolute; left: 0; top: -2px; bottom: -2px; width: 2px; margin-left: -1px; background: #f3eaff; box-shadow: 0 0 8px #f3eaff, 2px 0 0 #e03ccf88; pointer-events: none; will-change: transform; }
#tpanel .tp-btns { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
#tpanel button { font: 400 12px Bungee, Inter, sans-serif; color: #f3eaff; background: #2a0f63; border: 2px solid #120a05; border-radius: 10px; padding: 5px 10px;
  box-shadow: 0 0 0 1px #c9a7ff40, 3px 3px 0 #120a05; cursor: pointer; touch-action: manipulation; }
#tpanel button:hover, #tpanel button:focus-visible { outline: none; border-color: #120a05; box-shadow: 0 0 0 2px #c9a7ff, 3px 3px 0 #120a05; }
#tpanel button:active, #tpanel button.hit { transform: translate(2px, 2px); box-shadow: 0 0 0 2px #c9a7ff, 1px 1px 0 #120a05; }
#tpanel button[data-k] { color: #120a05; background: var(--c); }
#tpanel .tp-tap { margin-left: auto; font-size: 18px; padding: 8px 26px; background: #7b3cf2; color: #fff; box-shadow: 0 0 0 2px #c9a7ff, 4px 4px 0 #120a05; }
#tpanel .tp-tap.hit { background: #9a52ff; }
#tp-notebox { display: flex; gap: 6px; }
#tp-notebox input { flex: 1; min-width: 0; font: 600 15px Inter, sans-serif; color: #f3eaff; background: #06020f; border: 2px solid #9a52ff; border-radius: 8px; padding: 6px 10px; }
#tp-flash { position: absolute; left: 50%; top: 28%; z-index: 7; transform: translate(-50%, -50%); text-align: center; pointer-events: none; opacity: 0; white-space: nowrap; }
#tp-flash b { display: block; font: 400 clamp(26px, 6vw, 64px)/1 "Rubik Mono One", Bungee, sans-serif; color: var(--c); -webkit-text-stroke: 2px #120a05; paint-order: stroke fill;
  text-shadow: 4px 0 #e03ccf, -4px 0 #2a0f63, 0 0 24px var(--c); }
#tp-flash span { display: inline-block; margin-top: 6px; padding: 2px 10px; border-radius: 8px; background: #12062ecc; border: 2px solid #120a05; font: 700 clamp(12px, 1.6vw, 16px) Inter, sans-serif; color: #f3eaff; white-space: normal; max-width: 70vw; }
#tp-flash span:empty { display: none; }
#tp-flash.rev b { font-size: clamp(16px, 3.2vw, 34px); text-shadow: 2px 0 #e03ccf, -2px 0 #2a0f63, 0 0 14px var(--c); }
#tp-flash.go { animation: tpflash .75s linear forwards; }
#tp-flash.go.k-big { animation-duration: 1s; }
#tp-flash.go.k-big b { font-size: clamp(34px, 8vw, 88px); }
@keyframes tpflash {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); clip-path: inset(0 0 58% 0); }
  7% { transform: translate(calc(-50% + 9px), -50%) scale(1.15); clip-path: inset(36% 0 0 0); }
  14% { transform: translate(calc(-50% - 7px), -50%) scale(1.05); clip-path: inset(0 0 22% 0); }
  21% { transform: translate(-50%, -50%) scale(1); clip-path: inset(0 0 0 0); }
  70% { opacity: 1; transform: translate(-50%, -50%); clip-path: inset(0 0 0 0); }
  78% { opacity: .7; transform: translate(calc(-50% + 5px), -50%); clip-path: inset(48% 0 0 0); }
  100% { opacity: 0; transform: translate(-50%, -50%); clip-path: inset(0 0 0 0); } }
@media (prefers-reduced-motion: reduce) { #tp-flash.go { animation: tpfade .8s linear forwards; } @keyframes tpfade { 0%, 70% { opacity: 1; } 100% { opacity: 0; } } }
#tp-sound { position: absolute; left: 50%; top: 50%; z-index: 8; transform: translate(-50%, -50%); font: 400 18px Bungee, sans-serif; color: #fff; background: #7b3cf2; border: 3px solid #120a05;
  border-radius: 16px; padding: 14px 22px; box-shadow: 0 0 0 2px #c9a7ff, 4px 4px 0 #120a05; cursor: pointer; }
#tp-copybox { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: #06020fcc; padding: 16px; }
#tp-copybox > div { width: min(640px, 100%); display: grid; gap: 10px; background: #12062e; border: 3px solid #120a05; border-radius: 14px; padding: 14px; box-shadow: 0 0 0 2px #9a52ff, 4px 4px 0 #120a05; color: #f3eaff; }
#tp-copybox textarea { width: 100%; height: 50vh; font: 600 12px "JetBrains Mono", monospace; color: #f3eaff; background: #06020f; border: 2px solid #9a52ff; border-radius: 8px; }
#tp-copybox button { justify-self: end; font: 400 13px Bungee, sans-serif; color: #f3eaff; background: #2a0f63; border: 3px solid #120a05; border-radius: 12px; padding: 8px 14px; }
/* everywhere: the panel sits UNDER the video, never over it (Matt watches the story while he taps) */
#stage:has(#tpanel:not([hidden])) { overflow: visible; margin: 0 auto 170px; width: min(100%, calc((100vh - 250px) * 16 / 9)); }   /* (shrinks to leave room for the panel, stays 16:9) */
#tpanel { left: 0; right: 0; bottom: auto; top: calc(100% + 8px); }
@media (max-width: 760px), (pointer: coarse) and (max-height: 520px) {
  /* a phone (either way up): the stage stays 16:9, the TAP button is big and full width */
  #stage:has(#tpanel:not([hidden])) { margin-bottom: 250px; } #stage:has(#tpanel:not([hidden])) canvas { border-radius: 12px; }
  #tpanel .tp-legend { display: none; }
  #tpanel .tp-title { max-width: 52%; }
  #tpanel .tp-tap { order: -1; flex: 1 1 100%; margin: 0 0 2px; height: 64px; font-size: 22px; }
  #tpanel .tp-btns button:not(.tp-tap) { flex: 1 1 auto; padding: 8px 6px; }
  #tp-line { height: 40px; }
}
@media (pointer: coarse) { #tpanel .tp-legend { display: none; } }
`;

export function createTapper(RUN, { initSfx } = {}) {
  const TAP = RUN && RUN.tap; if (!TAP) return null;
  const SIL = !!RUN.silent;   // (?silent test runs: a fake clock, the audio element never plays)
  const LEVELS = RUN.LEVELS || [], IDS = LEVELS.map(L => L.id);
  const $ = id => document.getElementById(id);
  const stage = $('stage'); if (!stage) return null;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const setText = (e, s) => { if (e.textContent !== s) e.textContent = s; };

  // ---------- the saved taps ----------
  const store = {};   // songId -> { marks: [{t, raw, kind, note}] sorted by t, updated: ISO }
  const cleanMark = m => { if (!m || typeof m !== 'object') return null; const t = +m.t; if (!isFinite(t)) return null;
    const raw = isFinite(+m.raw) ? +m.raw : t + REACT; return { t: r3(t), raw: r3(raw), kind: KINDS[m.kind] ? m.kind : 'glitch', note: typeof m.note === 'string' ? m.note.slice(0, 200) : '' }; };
  const clean = o => ({ marks: (o && Array.isArray(o.marks) ? o.marks : []).map(cleanMark).filter(Boolean).sort((a, b) => a.t - b.t), updated: o && typeof o.updated === 'string' ? o.updated : '' });
  const song = id => store[id] || (store[id] = { marks: [], updated: '' });
  const stamp = o => Date.parse(o && o.updated) || 0;
  try { const j = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); if (j && typeof j === 'object') for (const id of IDS) if (j[id]) store[id] = clean(j[id]); } catch (e) {}
  const lsSave = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) {} };
  const titleOf = id => { const L = LEVELS.find(l => l.id === id); return L ? L.title : id; };
  const bodyOf = id => { const S = song(id); return { song: id, title: titleOf(id), marks: S.marks.map(({ t, raw, kind, note }) => ({ t, raw, kind, note })), updated: S.updated || new Date().toISOString(), n: S.marks.length }; };

  let db = null, dbState = 'wait', reach = '', unsub = null, dbTimer = 0, synced = false;   // synced: the first live snapshot has been merged in (nothing is written before that, so a fresh device never overwrites the saved taps)
  const W = {};   // per song: the write queue { timer, busy, dirty, again, err }
  const wq = id => W[id] || (W[id] = { timer: 0, busy: false, dirty: false, again: false, err: null });
  function schedule(id) { const w = wq(id); w.dirty = true; clearTimeout(w.timer); w.timer = setTimeout(() => { w.timer = 0; flush(id); }, SAVE_PAUSE); badge(); }
  async function flush(id) {   // one set() at a time per document; a change during a write queues one more
    const w = W[id]; if (!w) return; if (w.timer) { clearTimeout(w.timer); w.timer = 0; }
    if (!w.dirty || !db || !synced) { badge(); return; }   // (no db / not merged yet: the localStorage copy holds it; the first live snapshot pushes it up)
    if (w.busy) { w.again = true; return; }
    w.busy = true; w.dirty = false; badge();
    let ok = false;
    for (let tries = 0; tries < 2 && !ok; tries++) {
      try { await db.doc('taps/' + id).set(bodyOf(id)); ok = true; w.err = null; }
      catch (e) { const code = (e && e.code) || 'error'; w.err = code; if (code !== 'unavailable' || tries) break; await sleep(600 + Math.random() * 900); } }
    w.busy = false; if (!ok) w.dirty = true;
    if (w.again) { w.again = false; if (ok || w.dirty) flush(id); }
    badge(); }
  const later = id => setTimeout(() => { const w = wq(id); if (!w.timer && !w.busy) schedule(id); }, 0);   // (never write from inside a snapshot callback)
  const mkey = m => m.raw + '|' + m.kind;
  const sameMarks = (a, b) => a.length === b.length && a.every((m, i) => mkey(m) === mkey(b[i]) && m.note === b[i].note);
  function union(loc, rem) {   // this device's marks + the saved ones, one of each (raw + kind); keeps this device's mark objects (undo still points at them)
    const by = new Map(); for (const m of loc.marks) by.set(mkey(m), m);
    for (const m of rem.marks) { const k = mkey(m), have = by.get(k); if (!have) by.set(k, m); else if (!have.note && m.note) have.note = m.note; }
    return [...by.values()].sort((a, b) => a.t - b.t); }
  function onSnap(snap) {
    const live = !(snap.metadata && snap.metadata.fromCache);
    if (live) { clearTimeout(dbTimer); reach = ''; }
    const first = live && !synced;   // the first live answer: MERGE (a union) — never let either side wipe the other
    let changed = false; const seen = new Set();
    for (const d of snap.docs || []) { const id = d.id; if (!d.exists || !IDS.includes(id)) continue; seen.add(id);
      const rem = clean(d.data()), loc = store[id], ru = stamp(rem), lu = loc ? stamp(loc) : -1, w = W[id];
      if (!synced) {
        if (!loc || !loc.marks.length) { if (rem.marks.length || ru > lu) { store[id] = rem; changed = true; if (cur && cur.id === id) { added = []; marksChanged(); } } continue; }
        const u = union(loc, rem), locSame = sameMarks(u, loc.marks), remSame = sameMarks(u, rem.marks);
        if (!locSame) { loc.marks = u; changed = true; if (cur && cur.id === id) marksChanged(); }
        if (remSame) { if (!locSame || loc.updated !== rem.updated) { loc.updated = rem.updated; changed = true; } }
        else if (first) { loc.updated = new Date().toISOString(); changed = true; later(id); }   // (this device has marks the saved copy lacks: push the union up)
        continue; }
      if (ru > lu && !(w && (w.dirty || w.busy))) { store[id] = rem; changed = true; if (cur && cur.id === id) { added = []; marksChanged(); } }   // (after the merge: another device's newer save wins — deletes carry over)
      else if (lu > ru) later(id); }   // this device has newer taps: push them up
    if (first) { synced = true; for (const id of IDS) if (!seen.has(id) && store[id] && store[id].marks.length) later(id);   // (songs only this device has marks for)
      for (const id in W) if (W[id].dirty) later(id); }   // (taps made while it was connecting)
    if (changed) { lsSave(); if (phase === 'list') renderList(); }
    badge(); }
  function listen() { if (!db || unsub) return; clearTimeout(dbTimer);
    dbTimer = setTimeout(() => { reach = 'slow'; badge(); }, 10000);   // ~10 s and nothing yet: say so (the listener keeps trying)
    try { unsub = db.collection('taps').onSnapshot(onSnap, e => { clearTimeout(dbTimer); unsub = null; reach = 'err'; console.warn('tapper: saved taps listener', e && e.code); badge(); }); }
    catch (e) { clearTimeout(dbTimer); reach = 'err'; console.warn('tapper', e); badge(); } }
  function unlisten() { if (unsub) { try { unsub(); } catch (e) {} unsub = null; } clearTimeout(dbTimer); if (reach === 'slow') reach = ''; }
  const badges = [];   // (before the async check below: with no window.claude it runs badge() straight away)
  (async () => { try { const c = window.claude; db = c && typeof c.use === 'function' ? (await c.use('db')) || null : null; } catch (e) { db = null; }
    dbState = db ? 'ok' : 'none'; if (db && phase !== 'off') listen(); badge(); })();

  function badge() {
    let txt = 'saved', cls = 'tp-badge', tip = 'saved to the artifact (Claude can read these)';
    const ws = Object.values(W), err = ws.find(w => w.err && w.dirty);
    if (dbState === 'wait') { txt = 'connecting…'; tip = 'kept on this device until the saved taps answer'; }
    else if (!db) { txt = 'saved on this device'; tip = 'no artifact storage here (local test): kept in this browser only — use copy'; }
    else if (!synced) { cls += ' bad'; tip = 'kept on this device; they go up once the saved taps answer';
      txt = reach === 'err' ? 'saved taps unreachable' : reach === 'slow' ? "can't reach saved taps yet" : 'connecting…'; if (!reach) cls = 'tp-badge'; }
    else if (err) { txt = 'not saved'; cls += ' bad'; tip = `couldn't save (${err.err}) — kept on this device, will retry on the next change`; }
    else if (ws.some(w => w.busy || w.dirty)) { txt = 'saving…'; cls += ' busy'; }
    else if (reach === 'slow') { txt = "can't reach saved taps yet"; cls += ' bad'; tip = 'kept on this device; it keeps trying'; }
    else if (reach === 'err') { txt = 'saved taps unreachable'; cls += ' bad'; tip = 'kept on this device — use copy to be safe'; }
    for (const b of badges) { setText(b, txt); if (b.className !== cls) b.className = cls; b.title = tip; } }

  // ---------- the list ----------
  const list = el('div'); list.id = 'tlist'; list.hidden = true; list.setAttribute('role', 'dialog'); list.setAttribute('aria-label', 'the tapper');
  const listIn = el('div', 'tl-in'); list.appendChild(listIn);
  listIn.appendChild(el('h1', null, 'the tapper'));
  const listMsg = el('p', 'tl-say'); listMsg.setAttribute('aria-live', 'polite'); listIn.appendChild(listMsg);   // (the end-of-song / error word: the list covers the stage, so it says it here)
  listIn.appendChild(el('p', null, "pick a song. the bot plays its demo with the sound on — tap where the glitches and the story should hit, and Claude builds the cutscenes on your marks."));
  { const k = el('div', 'tl-keys'); for (const [a, b] of [['space / tap', 'glitch'], ['b', 'big glitch'], ['s', 'story'], ['c', 'cut'], ['z', 'undo'], ['p', 'pause'], ['← →', '5 s'], ['n', 'note'], ['esc', 'list']]) { const s = el('span'); s.appendChild(el('b', null, a)); s.appendChild(document.createTextNode(' ' + b + ' · ')); k.appendChild(s); }
    k.lastChild.lastChild.textContent = k.lastChild.lastChild.textContent.replace(/ · $/, ''); listIn.appendChild(k); }
  const songsEl = el('div', 'tl-songs'); listIn.appendChild(songsEl);
  const foot = el('div', 'tl-foot'); const backBtn = el('button', null, '← back'); foot.appendChild(backBtn); const lb = el('span', 'tp-badge'); badges.push(lb); foot.appendChild(lb); listIn.appendChild(foot);
  document.body.appendChild(list);
  backBtn.onclick = () => close();
  function renderList() {
    songsEl.textContent = '';
    for (const L of LEVELS) { const S = song(L.id), row = el('div', 'tl-row'), b = el('button', 'tl-song');
      b.appendChild(el('span', 'tl-n', String(L.n).padStart(2, '0'))); b.appendChild(el('span', 'tl-t', L.title));
      const n = S.marks.length, by = {}; for (const m of S.marks) by[m.kind] = (by[m.kind] || 0) + 1;
      const extra = ['big', 'story', 'cut'].filter(k => by[k]).map(k => `${by[k]} ${k}`).join(' · ');
      b.appendChild(el('span', 'tl-c' + (n ? ' has' : ''), n ? `${n} mark${n === 1 ? '' : 's'}${extra ? ' · ' + extra : ''}` : 'no marks yet'));
      b.onclick = () => play(L.id); row.appendChild(b);
      if (n) { const c = el('button', 'tl-copy', 'copy'); c.title = 'copy this song\'s marks (t · kind · note, tab-separated)'; c.onclick = () => copy(L.id, c); row.appendChild(c); }
      songsEl.appendChild(row); } }

  // ---------- the playing panel (inside the stage; under it on a phone) ----------
  const panel = el('div'); panel.id = 'tpanel'; panel.hidden = true;
  const info = el('div', 'tp-info'), titleEl = el('span', 'tp-title'), timeEl = el('span', 'tp-time'), countEl = el('span', 'tp-count'), pb = el('span', 'tp-badge');
  badges.push(pb);
  const legend = el('span', 'tp-legend', 'space glitch · b big · s story · c cut · z undo · p pause · ←→ 5s · n note · click a mark: jump · right-click: delete · esc list');
  info.append(titleEl, timeEl, countEl, pb, legend);
  const line = el('div'); line.id = 'tp-line'; line.title = 'click: jump there · click a mark: jump just before it · right-click / hold a mark: delete it';
  const shape = el('canvas'); shape.id = 'tp-shape'; const secsEl = el('div'); secsEl.id = 'tp-secs'; const marksEl = el('div'); marksEl.id = 'tp-marks'; const head = el('i'); head.id = 'tp-head';
  line.append(shape, secsEl, marksEl, head);
  const btns = el('div', 'tp-btns');
  const kb = {}; for (const k of ['big', 'story', 'cut']) { const b = el('button', null, KINDS[k].label.toLowerCase()); b.dataset.k = k; b.style.setProperty('--c', KINDS[k].col); kb[k] = b; btns.appendChild(b); }
  const undoB = el('button', null, 'undo'), pauseB = el('button', null, 'pause'), backB = el('button', null, '−5s'), fwdB = el('button', null, '+5s'), noteB = el('button', null, 'note'), copyB = el('button', null, 'copy'), listB = el('button', null, 'list');
  const tapB = el('button', 'tp-tap', 'TAP'); tapB.setAttribute('aria-label', 'tap: mark a glitch here');
  btns.append(undoB, pauseB, backB, fwdB, noteB, copyB, listB, tapB);
  const noteBox = el('div'); noteBox.id = 'tp-notebox'; noteBox.hidden = true; const noteIn = el('input'); noteIn.type = 'text'; noteIn.maxLength = 200; noteIn.placeholder = 'a note for this mark — enter saves, esc cancels'; noteIn.setAttribute('aria-label', 'note for the last mark');
  const noteOk = el('button', null, 'save'); noteBox.append(noteIn, noteOk);
  panel.append(info, line, noteBox, btns);
  const flashEl = el('div'); flashEl.id = 'tp-flash'; flashEl.setAttribute('aria-live', 'polite'); const flashLab = el('b'), flashSub = el('span'); flashEl.append(flashLab, flashSub);
  const soundB = el('button', null, 'tap for sound ▸'); soundB.id = 'tp-sound'; soundB.hidden = true;
  stage.append(panel, flashEl, soundB);
  // the stage's own touch handling (tap = jump, preventDefault) must never see the panel's touches
  for (const ev of ['touchstart', 'touchmove', 'touchend']) { panel.addEventListener(ev, e => e.stopPropagation(), { passive: true }); soundB.addEventListener(ev, e => e.stopPropagation(), { passive: true }); }

  // ---------- state ----------
  let timeK = -1, phase = 'off', cur = null, added = [], tok = 0, raf = 0, ptr = 0, lastT = -1e9, headX = -1, lineW = 1, stuckSince = 0, doneSince = 0, noteFor = null, noteResume = false;
  const span = () => Math.max(1, cur.dur - cur.t0);
  const pct = t => Math.max(0, Math.min(100, (t - cur.t0) / span() * 100));
  const firstAfter = t => { const M = song(cur.id).marks; let i = 0; while (i < M.length && M[i].t <= t) i++; return i; };

  function flash(label, col, sub, kind, mine) {
    flashEl.style.setProperty('--c', col); setText(flashLab, label); setText(flashSub, sub || '');
    flashEl.className = (mine ? '' : 'rev ') + 'k-' + (kind || 'x'); void flashEl.offsetWidth; flashEl.classList.add('go'); }
  const flashMark = (m, mine) => flash(KINDS[m.kind].label, KINDS[m.kind].col, m.note || (mine ? '' : fmt(m.t)), m.kind, mine);
  const say = text => flash(text, '#c9a7ff', '', 'x', false);

  function renderTicks() {
    const M = song(cur.id).marks; marksEl.textContent = ''; const frag = document.createDocumentFragment();
    M.forEach((m, i) => { const e = el('i', 'tp-tick k-' + m.kind); e.style.left = pct(m.t) + '%'; e.style.setProperty('--c', KINDS[m.kind].col); e.dataset.i = i; e.title = `${fmt(m.t)} · ${KINDS[m.kind].label.toLowerCase()}${m.note ? ' — ' + m.note : ''}`; frag.appendChild(e); });
    marksEl.appendChild(frag); setText(countEl, `${M.length} mark${M.length === 1 ? '' : 's'}`); }
  function marksChanged() { renderTicks(); ptr = firstAfter(RUN.now()); }
  function touched() { const S = song(cur.id); S.updated = new Date().toISOString(); lsSave(); schedule(cur.id); marksChanged(); }
  function drawShape() {
    const C = RUN.C, M = C && C.music, r = line.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    lineW = Math.max(1, r.width - 4); const w = Math.max(1, Math.round(lineW * dpr)), h = Math.max(1, Math.round((r.height - 4) * dpr));
    shape.width = w; shape.height = h; const g = shape.getContext('2d'); g.clearRect(0, 0, w, h);
    const X = t => (t - cur.t0) / span() * w;
    if (M) {
      g.fillStyle = '#e03ccf1c'; for (const [a, b] of M.breaks || []) g.fillRect(X(a), 0, Math.max(1, X(b) - X(a)), h);   // the dips before a drop
      g.fillStyle = '#7b3cf266'; const step = Math.max(1, Math.round(2 * dpr));   // the loudness: the song's shape
      for (let x = 0; x < w; x += step) { const t = cur.t0 + x / w * span(), v = t < 0 ? 0 : M.loud(t); const bh = Math.max(1, v * h * 0.9); g.fillRect(x, (h - bh) / 2, Math.max(1, step - 1), bh); }
      for (const d of M.drops || []) { const x = X(d.t), s = (4 + 7 * d.k) * dpr; g.fillStyle = '#ff4fe0' + (d.k >= 0.4 ? 'aa' : '66'); g.beginPath(); g.moveTo(x - s / 2, 0); g.lineTo(x + s / 2, 0); g.lineTo(x, s); g.closePath(); g.fill(); } }
    if (cur.t0 < 0) { g.fillStyle = '#ffffff10'; g.fillRect(0, 0, X(0), h); }   // the pre-roll (before the music)
    secsEl.textContent = '';
    for (const s of (C && C.secs) || []) { if (s.t <= cur.t0 + 0.5 || s.t >= cur.dur) continue; const e = el('i'); e.style.left = pct(s.t) + '%'; e.title = `${fmt(s.t)} · ${s.name}`; secsEl.appendChild(e); }
    headX = -1; }

  // ---------- playing a song ----------
  let loadP = Promise.resolve();   // (one level load at a time: two openLevel()s racing would mix two songs' levels)
  function stale() {   // a load finished after he left it: put the stage back the way he left it
    if (phase === 'list') RUN.tapIdle(); else if (phase === 'off' && (RUN.mode === 'title' || RUN.mode === 'tapper')) RUN.tapTitle(); }
  async function play(id) {
    const L = LEVELS.find(l => l.id === id); if (!L) return;
    const my = ++tok; try { if (initSfx) initSfx(); } catch (e) {}   // (always from a click / key: the sound effects' AudioContext starts unlocked)
    phase = 'loading'; cur = { id, dur: 180, t0: 0 }; added = []; TAP.paused = false; closeNote(false); stuckSince = 0; doneSince = 0; timeK = -1; setText(listMsg, '');
    list.hidden = true; panel.hidden = false; soundB.hidden = true; setText(titleEl, `${L.n}. ${L.title}`); setText(timeEl, 'loading…'); setText(pauseB, 'pause'); renderTicks(); badge();
    const prev = loadP; let done; loadP = new Promise(r => { done = r; });
    try { await prev; if (my !== tok) return stale(); await RUN.open(id); if (my !== tok) return stale(); await RUN.demo(id, 0); }
    catch (e) { console.error('tapper', e); if (my === tok) { toList(); setText(listMsg, "that song wouldn't load"); } else stale(); return; }
    finally { done(); }
    if (my !== tok) return stale();
    const C = RUN.C, a = RUN.audio;
    cur.t0 = C && C.def && C.def.preroll ? -C.def.preroll : 0;
    cur.dur = (C && C.music && C.music.duration) || (a && isFinite(a.duration) && a.duration) || (C && C.end) || 180;
    hidePads(); phase = 'play'; lastT = -1e9; drawShape(); marksChanged();
    try { const r = panel.getBoundingClientRect(); if (r.bottom > innerHeight) panel.scrollIntoView({ block: 'end', behavior: 'smooth' }); } catch (e) {}   // (a phone: the panel is under the video)
    if (!raf) raf = requestAnimationFrame(frame); }
  const hidePads = () => { const p = $('pads'); if (p) p.hidden = true; };
  function frame() {
    raf = 0; if (phase !== 'play' || !cur) return; raf = requestAnimationFrame(frame);
    const t = RUN.now(), a = RUN.audio, mode = RUN.mode;
    if (!(cur.dur > 0) || (!(RUN.C && RUN.C.music) && a && isFinite(a.duration) && Math.abs(a.duration - cur.dur) > 0.5)) { cur.dur = a && isFinite(a.duration) ? a.duration : cur.dur; drawShape(); renderTicks(); }
    const x = Math.round((pct(t) / 100) * lineW * 2) / 2; if (x !== headX) { headX = x; head.style.transform = `translateX(${x + 2}px)`; }
    const tk = Math.floor(t * 10) * 100000 + Math.round(cur.dur * 10); if (tk !== timeK) { timeK = tk; setText(timeEl, `${fmt(t)} / ${fmt(cur.dur)}`); }
    // marks he made before: they flash as the playhead passes them (a second watch reviews them)
    const M = song(cur.id).marks;
    if (t < lastT - 0.02 || t - lastT > 0.6) ptr = firstAfter(t);
    else { let hit = null; while (ptr < M.length && M[ptr].t <= t) hit = M[ptr++]; if (hit) flashMark(hit, false); }
    lastT = t;
    // the browser kept the song silent (no tap reached it): a button to start the sound from a tap
    const blocked = !SIL && mode === 'run' && !TAP.paused && t >= 0 && a && a.paused && !a.ended;
    if (blocked) { if (!stuckSince) stuckSince = performance.now(); else if (performance.now() - stuckSince > 1200 && soundB.hidden) soundB.hidden = false; }
    else { stuckSince = 0; if (!soundB.hidden) soundB.hidden = true; }
    // the song's end: back to the list (never on into the next song)
    if (mode === 'done') { if (!doneSince) doneSince = performance.now(); } else doneSince = 0;
    const over = a && !SIL ? a.ended || (mode === 'done' && !TAP.paused && a.paused && performance.now() - doneSince > 1500) : mode === 'done' && performance.now() - doneSince > (SIL ? 1500 : 4000);   // (?silent: no real audio, its clock stops at the win)
    if (over || (mode !== 'run' && mode !== 'done')) finishSong(); }
  function finishSong() { const L = cur && LEVELS.find(l => l.id === cur.id), n = cur ? song(cur.id).marks.length : 0; toList();
    setText(listMsg, `${L ? L.title + ': ' : ''}${n ? `${n} mark${n === 1 ? '' : 's'} saved` : 'the end — no marks'}`); }
  function toList() { tok++; if (cur) flush(cur.id); closeNote(false); TAP.paused = false; phase = 'list'; cur = null; panel.hidden = true; soundB.hidden = true; RUN.tapIdle(); showList(); }
  function showList() { phase = 'list'; panel.hidden = true; renderList(); list.hidden = false; badge(); listen();
    const first = songsEl.querySelector('button'); if (first) try { first.focus({ preventScroll: true }); } catch (e) {} }
  function mark(kind, e) {
    if (phase !== 'play' || !cur || noteFor) return;
    const lag = e && e.timeStamp ? Math.max(0, Math.min(0.25, (performance.now() - e.timeStamp) / 1000)) : 0;   // (the key went down a moment before this ran)
    const raw = RUN.now() - lag, m = { t: r3(raw - REACT), raw: r3(raw), kind, note: '' }, M = song(cur.id).marks;
    let i = M.length; while (i > 0 && M[i - 1].t > m.t) i--; M.splice(i, 0, m); added.push(m);
    touched(); flashMark(m, true); }
  function delMark(m) { const M = song(cur.id).marks, i = M.indexOf(m); if (i < 0) return; M.splice(i, 1); const j = added.indexOf(m); if (j >= 0) added.splice(j, 1); touched(); say('deleted'); }
  function undo() { if (phase !== 'play') return; const m = added.pop(); if (m && song(cur.id).marks.includes(m)) { const M = song(cur.id).marks; M.splice(M.indexOf(m), 1); touched(); say('undo'); } else say('nothing to undo'); }
  function setPause(p) {
    if (phase !== 'play') return; TAP.paused = p; setText(pauseB, p ? 'play' : 'pause'); const a = RUN.audio;
    if (a && !SIL) { if (p) a.pause(); else if ((RUN.mode === 'run' || RUN.mode === 'done') && RUN.now() >= 0 && !a.ended) a.play().catch(() => {}); }   // (in the pre-roll main starts the song itself)
    if (p) say('paused'); }
  function seek(t) {
    if (phase !== 'play' || !cur) return; closeNote(false);
    const to = Math.max(0, Math.min(cur.dur - 1, t)); TAP.paused = false; setText(pauseB, 'pause'); soundB.hidden = true; stuckSince = 0;
    const my = tok; RUN.demo(cur.id, to).then(() => { if (my === tok) { hidePads(); lastT = -1e9; } }).catch(e => console.error('tapper seek', e)); }   // (RUN.demo replays the bot's run up to there, then the song plays on from it)
  function openNote() {
    if (phase !== 'play' || !cur) return; const M = song(cur.id).marks;
    let m = added.length ? added[added.length - 1] : null; if (!m || !M.includes(m)) { const i = firstAfter(RUN.now()) - 1; m = i >= 0 ? M[i] : null; }
    if (!m) { say('tap a mark first'); return; }
    noteFor = m; noteResume = !TAP.paused; if (!TAP.paused) setPause(true);
    noteIn.value = m.note || ''; noteBox.hidden = false; flashMark(m, true); setTimeout(() => { try { noteIn.focus(); } catch (e) {} }, 0); }
  function closeNote(saveIt) {
    if (!noteFor) { noteBox.hidden = true; return; } const m = noteFor; noteFor = null; noteBox.hidden = true;
    if (saveIt && cur && song(cur.id).marks.includes(m)) { const v = noteIn.value.replace(/[\t\r\n]+/g, ' ').trim().slice(0, 200); if (v !== m.note) { m.note = v; touched(); } say(v ? 'noted' : 'note cleared'); }
    try { noteIn.blur(); } catch (e) {}
    if (noteResume && phase === 'play') setPause(false); noteResume = false; }
  noteIn.addEventListener('keydown', e => { e.stopPropagation();   // (typing a note never reaches the game or the tapper keys: m would mute, s would mark…)
    if (e.key === 'Enter') { e.preventDefault(); closeNote(true); } else if (e.key === 'Escape') { e.preventDefault(); closeNote(false); } });
  noteIn.addEventListener('keyup', e => e.stopPropagation());
  noteOk.onclick = () => closeNote(true);

  // ---------- copy (TSV: t <tab> kind <tab> note) ----------
  const tsv = id => song(id).marks.map(m => `${m.t.toFixed(3)}\t${m.kind}\t${(m.note || '').replace(/[\t\r\n]+/g, ' ')}`).join('\n');
  function copy(id, btn) {
    const text = tsv(id), was = btn.textContent, ok = () => { btn.textContent = 'copied'; setTimeout(() => { btn.textContent = was; }, 1200); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok, () => copyBox(text)); return; } } catch (e) {}
    copyBox(text); }
  function copyBox(text) {   // (no clipboard here: the marks in a box, selected — cmd/ctrl+c)
    const box = el('div'); box.id = 'tp-copybox'; const inner = el('div'); const ta = el('textarea'); ta.value = text; ta.readOnly = true; const done = el('button', null, 'done');
    inner.append(el('div', null, 'copy these (they are selected):'), ta, done); box.appendChild(inner); document.body.appendChild(box);
    const shut = () => { box.remove(); }; done.onclick = shut; box.addEventListener('click', e => { if (e.target === box) shut(); });
    ta.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') shut(); });
    setTimeout(() => { try { ta.focus(); ta.select(); } catch (e) {} }, 0); }

  // ---------- buttons + the timeline ----------
  const press = (b, fn) => b.addEventListener('pointerdown', e => { if (e.button) return; e.preventDefault(); b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 110); fn(e); });   // (a mark lands on the press, not the release)
  press(tapB, e => mark('glitch', e));
  for (const k in kb) press(kb[k], e => mark(k, e));
  undoB.onclick = undo; pauseB.onclick = () => setPause(!TAP.paused);
  backB.onclick = () => seek(RUN.now() - 5); fwdB.onclick = () => seek(RUN.now() + 5);
  noteB.onclick = openNote; copyB.onclick = () => cur && copy(cur.id, copyB); listB.onclick = () => toList();
  soundB.onclick = () => { soundB.hidden = true; stuckSince = 0; TAP.paused = false; const a = RUN.audio; if (a && !SIL) a.play().catch(() => {}); };
  const timeAt = cx => { const r = line.getBoundingClientRect(); return cur.t0 + Math.max(0, Math.min(1, (cx - r.left) / Math.max(1, r.width))) * span(); };
  let tp = null;   // a press on the timeline
  line.addEventListener('pointerdown', e => {
    if (phase !== 'play' || !cur) return; const tick = e.target.closest && e.target.closest('.tp-tick');
    tp = { x: e.clientX, y: e.clientY, m: tick ? song(cur.id).marks[+tick.dataset.i] : null, lp: false, moved: false, timer: 0 };
    if (tp.m && e.pointerType !== 'mouse') { const me = tp; me.timer = setTimeout(() => { me.lp = true; delMark(me.m); }, 550); } });   // (hold a mark = delete it)
  line.addEventListener('pointermove', e => { if (tp && !tp.moved && Math.hypot(e.clientX - tp.x, e.clientY - tp.y) > 10) { tp.moved = true; clearTimeout(tp.timer); } });
  line.addEventListener('pointerup', e => { if (!tp) return; const p = tp; tp = null; clearTimeout(p.timer); if (p.lp || p.moved || e.button) return; seek(p.m ? p.m.t - 2 : timeAt(e.clientX)); });   // (a mark: jump to just before it, so you see it come)
  line.addEventListener('pointercancel', () => { if (tp) clearTimeout(tp.timer); tp = null; });
  line.addEventListener('contextmenu', e => { e.preventDefault(); if (phase !== 'play' || !cur) return; const tick = e.target.closest && e.target.closest('.tp-tick');
    if ((tp && tp.lp) || (tick && !tick.isConnected)) return;
    if (tp) { clearTimeout(tp.timer); tp.lp = true; } const m = tick ? song(cur.id).marks[+tick.dataset.i] : null; if (m) delMark(m); });
  addEventListener('resize', () => { if (phase === 'play' && cur) { drawShape(); renderTicks(); } });

  // ---------- keys: while the tapper is open nothing reaches the game (main.mjs listens on window, bubbling) ----------
  addEventListener('keydown', e => {
    if (phase === 'off') return;
    if (e.target === noteIn) return;   // (the note field stops its own keys)
    const box = document.getElementById('tp-copybox');
    if (box) { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); box.remove(); } return; }   // (the copy box: its keys are its own — esc shuts it; none reach the game)
    if (e.metaKey || e.ctrlKey || e.altKey) return;   // (browser shortcuts: copy, reload…)
    if (e.code === 'KeyM') return;                    // (m = mute, the game's own)
    e.stopPropagation();
    if (phase === 'list' || phase === 'loading') { if (e.code === 'Escape') { e.preventDefault(); if (phase === 'loading') toList(); else close(); } return; }   // (tab / enter / space work the list's buttons)
    if (phase !== 'play') return;
    const k = KEYK[e.code];
    if (k) { e.preventDefault(); if (!e.repeat) mark(k, e); return; }
    if (e.code === 'Backspace' || e.code === 'KeyZ') { e.preventDefault(); if (!e.repeat) undo(); return; }
    if (e.code === 'KeyP') { e.preventDefault(); if (!e.repeat) setPause(!TAP.paused); return; }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { e.preventDefault(); if (!e.repeat) seek(RUN.now() + (e.code === 'ArrowLeft' ? -5 : 5)); return; }
    if (e.code === 'KeyN') { e.preventDefault(); if (!e.repeat) openNote(); return; }
    if (e.code === 'Escape') { e.preventDefault(); toList(); return; }
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Enter') e.preventDefault();   // (no page scroll, no stray button press)
  }, true);
  addEventListener('keyup', e => { if (phase === 'off' || e.target === noteIn || e.code === 'KeyM') return; e.stopPropagation();
    if (phase === 'play' && !document.getElementById('tp-copybox') && (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Backspace')) e.preventDefault(); }, true);
  panel.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button'); if (b && e.detail && b !== noteOk) try { b.blur(); } catch (er) {} });   // (a mouse click never leaves a button focused for space to press again)
  document.addEventListener('visibilitychange', () => { if (document.hidden && phase === 'play') { if (!TAP.paused) setPause(true); if (cur) flush(cur.id); } });   // (main's own "tab hidden = quit" is off while tapping)
  addEventListener('pagehide', () => { for (const id in W) flush(id); });

  // ---------- open / close ----------
  function open() { if (phase !== 'off') return; TAP.on = true; TAP.paused = false; RUN.tapIdle(); showList(); }   // (no initSfx here: on the #tapper path this runs before any click; play() starts it from his click)
  function close() { if (phase === 'off') return; if (phase === 'play' || phase === 'loading') toList(); tok++; for (const id in W) flush(id); phase = 'off'; cur = null; list.hidden = true; panel.hidden = true; soundB.hidden = true;
    TAP.on = false; TAP.paused = false; unlisten(); RUN.tapTitle();
    if (/tapper/.test(location.hash)) try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  const wantHash = () => /(^#|&)tapper($|&)/.test(location.hash || '');
  const tb = $('tapperbtn'); if (tb) tb.onclick = () => { try { if (initSfx) initSfx(); } catch (e) {} open(); };
  addEventListener('hashchange', () => { if (wantHash()) open(); });
  if (wantHash()) open();
  return { open, close, get phase() { return phase; } };
}
