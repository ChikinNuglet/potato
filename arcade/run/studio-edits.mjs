// studio-edits.mjs — Chikin's LEVEL STUDIO edits, laid on top of a level (Nov 7, crew Ground Truth).
// Chikin: "somethign where i can easily make stairs and ramps and add and take away assets" / "and drops" / "so that way i can
// continue working while you sleep". His edits live in their own file, run/levels/edits/<level>.json; the level's .mjs is never
// rewritten. With no edits file the level is built EXACTLY as before (applyEdits returns the very same object).
// Pure (no DOM): the browser (main.mjs, studio.mjs) and Node (tools) run the same file.
//
// THE FILE (version 1):
//   { "level": "thursday-potato", "v": 1, "items": [ ITEM… ], "hide": [ SIG… ] }
//   ITEM (all times in song seconds, heights in world units, y = the floor it stands on):
//   t is the moment you PRESS (on the beat); lead (s) is how far after it the piece itself starts, so a press on the beat clears it
//     { id, type: 'stairs', t, lead, y, steps, rise, stepT, dir: 'up'|'down', land }   steps you hop (rise > 0.22) or walk (≤ 0.2)
//     { id, type: 'ramp',   t, y, len, rise, dir: 'up'|'down' }                   a slope he walks (fine slices, drawn as one wedge)
//     { id, type: 'hole',   t, lead, len }                                       the floor is gone (hop it)
//     { id, type: 'drop',   t, len, depth }                                      the floor sinks for a stretch; what stands there sinks too
//     { id, type: 'thing',  t, lead, y, what, len?, text?, obj? }                 one of the game's own objects (see THINGS)
//   SIG = a signature of one of the level's own objects (sigs() below): that object is switched off (hidden), not deleted.
export const EDITS_V = 1;
const r3 = v => v == null ? '' : (+v).toFixed(3), r2 = v => v == null ? '' : (+v).toFixed(2);

// ---- the level's own objects: a stable name for each (so a hide survives reloads) ----
export function sigOf(o) { return [o.k, r3(o.t), o.wk || '', String(o.text ?? o.label ?? '').slice(0, 24), r2(o.y ?? o.y0)].join('|'); }
export function sigs(objs) { const n = new Map(); return objs.map(o => { const s = sigOf(o), k = n.get(s) || 0; n.set(s, k + 1); return s + '#' + k; }); }

// the floor under a moment: the highest ordinary ground block covering t (not a ceiling, not a step-block, not a power gate)
// (pass 2: step-blocks count — Read the Terms' paper floor is made of them, designer note #2. nearY: the cursor's height, so a click
//  on an upper ledge lands on that ledge: the highest floor top at or below nearY + 0.6, else the lowest one there)
export function floorAt(objs, t, nearY) {
  let y = null, lo = null; for (const o of objs) if (isGround(o) && o.t <= t && o.tEnd >= t) {
    if (lo == null || o.y < lo) lo = o.y;
    if ((nearY == null || o.y <= nearY + 0.6) && (y == null || o.y > y)) y = o.y; }
  return y ?? lo ?? 0; }
const isGround = o => o.k === 'block' && !o.ceil && !o.needs && o.tEnd != null;

// cut [a, b] out of every ground block (a hole / a drop); the cue word (labelAt) stays with the piece it's in
function cutFloor(objs, a, b) {
  const out = [];
  for (const o of objs) {
    if (!isGround(o) || o.studio || o.tEnd <= a || o.t >= b) { out.push(o); continue; }
    const lab = o.labelAt, keepL = lab == null || lab < a, keepR = lab != null && lab > b;
    if (o.t < a) out.push(keepL ? { ...o, tEnd: a } : { ...o, tEnd: a, label: undefined, labelAt: undefined, cue: undefined });
    if (o.tEnd > b) out.push(keepR ? { ...o, t: b } : { ...o, t: b, label: undefined, labelAt: undefined, cue: undefined });
  }
  return out;
}

// ---- the palette: the game's own objects (each level paints them in its own look: obstacles.mjs + view.mjs) ----
export const THINGS = {
  low:      { name: 'jump it',        make: (it, y) => ({ k: 'word', wk: 'low', t: it.t, w: 0.6, y0: y, y1: y + 0.6, text: it.text || '404', obj: it.obj }) },
  high:     { name: 'duck it',        make: (it, y) => ({ k: 'word', wk: 'high', t: it.t, w: 0.95, y0: y + 1.0, y1: y + 2.6, text: it.text || '404', obj: it.obj }) },
  wall:     { name: 'glitch it',      make: (it, y) => ({ k: 'word', wk: 'wall', t: it.t, w: 0.7, y0: y - 0.6, y1: y + 8, text: it.text || 'firewall', obj: it.obj }) },
  hurdle:   { name: 'word hurdle',    make: (it, y) => ({ k: 'hurdle', t: it.t, y, w: 1.1, h: 0.75, label: it.text || '404' }) },
  spike:    { name: 'error tooth',    make: (it, y) => ({ k: 'spike', t: it.t, y, w: 1, h: 0.55 }) },
  platform: { name: 'platform',       make: (it, y) => ({ k: 'block', t: it.t, tEnd: it.t + (it.len || 1), y, h: 0.6, studio: it.id }) },
  crumble:  { name: 'crumbly ledge',  make: (it, y) => ({ k: 'block', t: it.t, tEnd: it.t + (it.len || 1), y, h: 0.6, crumble: 1, studio: it.id }) },
  bounce:   { name: 'bouncy ledge',   make: (it, y) => ({ k: 'block', t: it.t, tEnd: it.t + (it.len || 1), y, h: 0.6, bounce: true, studio: it.id }) },
  orb:      { name: 'jump orb',       make: (it, y) => ({ k: 'orb', t: it.t, y }) },
  pad:      { name: 'jump pad',       make: (it, y) => ({ k: 'pad', t: it.t, y }) },
  token:    { name: 'token',          make: (it, y) => ({ k: 'token', t: it.t, y }) },
};
// a placed thing stands ON y (its floor); orbs + tokens float a little above it
const LIFT = { orb: 1.7, token: 0.9 };

// one item -> the course objects it adds (blocks for the shapes; ramps carry a wedge for the view to draw)
export function itemObjs(it0) {
  const out = [], it = it0.lead ? { ...it0, t: it0.t + it0.lead } : it0;   // (lead: the piece starts a little after the press)
  if (it.type === 'stairs') {
    const n = Math.max(1, Math.min(24, Math.round(it.steps || 3))), st = Math.max(0.06, it.stepT || 0.4), rise = Math.max(0.05, it.rise ?? 0.5), land = Math.max(0, it.land ?? 1);
    const t1 = it.t + (n + land) * st;
    for (let i = 0; i < n; i++) {
      const hi = it.dir === 'down' ? it.y + (n - i) * rise : it.y + (i + 1) * rise;
      // side by side, each step a column down to the floor (up: the top step carries the landing; down: the landing comes first)
      const a = it.dir === 'down' ? (i === 0 ? it.t : it.t + (land + i) * st) : it.t + i * st, b = it.dir === 'down' ? it.t + (land + i + 1) * st : (i === n - 1 ? t1 : it.t + (i + 1) * st);
      out.push({ k: 'block', t: a, tEnd: b, y: hi, h: hi - it.y + 0.6, studio: it.id });
    }
  } else if (it.type === 'ramp') {
    const len = Math.max(0.1, it.len || 1), rise = Math.max(0.05, it.rise ?? 1), n = Math.max(2, Math.ceil(rise / 0.15)), up = it.dir !== 'down';
    for (let i = 0; i < n; i++) {      // slices he can walk (each lip is under the 0.22 he scrambles up by himself), side by side
      const hi = it.y + rise * (up ? (i + 1) : (n - i)) / n, a = it.t + len * i / n, b = it.t + len * (i + 1) / n;
      out.push({ k: 'block', t: a, tEnd: b, y: hi, h: hi - it.y + 0.6, style: 'ramp', studio: it.id });
    }
  } else if (it.type === 'thing') {
    const T = THINGS[it.what]; if (T) out.push({ ...T.make(it, it.y + (LIFT[it.what] || 0)), studio: it.id });
  }
  return out;
}

// the whole edit file on top of a built level. No edits (or a level that runs its own rules) = the same object back.
export function applyEdits(D, ED) {
  if (!ED || !D || !Array.isArray(D.objs)) return D;
  const items = (ED.items || []).filter(it => it && typeof it.t === 'number' && isFinite(it.t)), hide = new Set(ED.hide || []);
  if (D.mode || D.shooter) return D;                     // (a level with its own game: the studio can't build there yet)
  if (!items.length && !hide.size) return ED.live ? { ...D, studioBase: D.objs, studioRamps: [] } : D;   // (live: the studio's open draft keeps the level's own list to point at)
  const base = D.objs, S = sigs(base);
  let objs = base.filter((o, i) => !hide.has(S[i]));
  for (const it of items) if (it.type === 'hole') objs = cutFloor(objs, it.t + (it.lead || 0), it.t + (it.lead || 0) + Math.max(0.05, it.len || 0.5));
  for (const it of items) if (it.type === 'drop') {
    const a = it.t, b = it.t + Math.max(0.1, it.len || 1), d = Math.max(0.1, it.depth ?? 1), gy = floorAt(base, a + 0.01);
    objs = cutFloor(objs, a, b).map(o => (o.k === 'block' || o.t < a || o.t > b) ? o : {   // what stands in the dip sinks with it
      ...o, ...(o.y != null ? { y: o.y - d } : {}), ...(o.y0 != null ? { y0: o.y0 - d } : {}), ...(o.y1 != null ? { y1: o.y1 - d } : {}) });
    objs.push({ k: 'block', t: a, tEnd: b, y: gy - d, h: 0.6, studio: it.id });
  }
  for (const it of items) objs.push(...itemObjs(it));
  const ramps = items.filter(it => it.type === 'ramp').map(it => ({ id: it.id, t0: it.t, t1: it.t + Math.max(0.1, it.len || 1), y: it.y, rise: Math.max(0.05, it.rise ?? 1), up: it.dir !== 'down' }));
  return { ...D, objs, studioRamps: ramps, studioBase: base };
}

// ---- loading (browser): the studio's live draft wins; ?noedits plays the level as built ----
export async function loadEdits(id, base = 'levels/edits/') {
  try {
    if (typeof window !== 'undefined') {
      if (window.STUDIO_LIVE && window.STUDIO_LIVE[id]) return window.STUDIO_LIVE[id];
      if (new URLSearchParams(location.search).has('noedits')) return null;
    }
    const r = await fetch(`${base}${id}.json`, { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json(); return j && typeof j === 'object' && (Array.isArray(j.items) || Array.isArray(j.hide)) ? j : null;
  } catch (e) { return null; }
}
