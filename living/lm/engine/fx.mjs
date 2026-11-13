// fx.mjs — the things round him that are not him: the crack in your glass, the hole in the wallpaper, the spark, the puff,
// the carton, the fry. Ink and purple only. No white, no shine, no words, nothing drawn ON him.
//
// The build plan gave this file to the comedian; nobody built it, so the engineer (assembly round) wrote the smallest one
// that makes the gags readable. THE TIMING OF THE JOKES IS NOT MINE: every hold below is a number from design/gags.json or a
// director's ruling, named where it is used. Comedian / refine team: change the numbers, keep the contract.
//
//   createFx(ctx) -> { step(k), event(name, e), spawn(kind, o), where(kind), hit(x, y), click(x, y), draw(g, layer, view), things, dirty }
//   kinds: crack | hole | spark | smoke | carton | fry | burst | scuff (final round, bold choice)            layers: 'back' (behind him) | 'front' (over him)
//   draw(g, layer, view): g = a 2D canvas context the HOST owns, view = { px (pixels per body height), toPx(x, y) -> [px, py] }.
//     The engine never touches the DOM; a host with no 2D layer (the game, later) simply never calls draw.
//   Everything is stepped at 12 fps (5 frames a step) like his glitch. Positions in body heights, y up.
// Listens: cracked, went_through, mode (back from the 404), zapped, prop, cue (fx.smoke, fx.burst), hole_shut.
// Emits:   cue { name: 'fx.crack' | 'fx.crack.clear' | 'fx.hole' | 'fx.hole.pause' | 'fx.spark' | 'fx.fry' },
//          crack_shown / crack_gone { x, y },  hole_open / hole_shut { slot, x, y }
// Flags (data/physics.json "fx", all optional): crack: false | hole: false switch a gag's picture off; crack_gone_after_s (6);
//   crack_cooldown_s (0 tonight so Chikin can crack it every throw; the comedian asked for 600).
// Game-feel and physics engineer (seat 3), assembly round, team Not A Screensaver.
const INK = '#120a05', P1 = '#7b3cf2', P2 = '#9a52ff', MAG = '#e03ccf', LILAC = '#c9a7ff', VOID = '#12062e', DEEP = '#2a0f63';
const STEP = 5;
// his outline as a path, centre at 0,0, in body heights (measured off the bench stills: 1.04 wide, 1.075 tall, wider at the bottom)
const SHAPE = [[-0.46, -0.50], [[-0.58, -0.42], [-0.50, -0.05], [-0.36, 0.25]], [[-0.26, 0.46], [-0.12, 0.54], [0, 0.54]], [[0.12, 0.54], [0.26, 0.46], [0.36, 0.25]],
  [[0.50, -0.05], [0.58, -0.42], [0.46, -0.50]], [[0.25, -0.56], [-0.25, -0.56], [-0.46, -0.50]]];

export function createFx(ctx) {
  const { clock, rng, body, MODE, room, channels: ch, IDX, emit, data } = ctx;
  const F = (data.physics && data.physics.fx) || {}, G = Object.fromEntries(((data.gags && data.gags.gags) || []).map(g => [g.id, g]));
  const rnd = rng.stream('room', 'fx'), R = (a, b) => a + (b - a) * rnd();
  const things = [], pending = [], mouth = new Array(8).fill(null);
  // BOLD CHOICE (engineer, final round): SCUFFS. Where he lands hard he leaves a mark: a short ink skid on the Dock line or the screen edge, the way he was
  // travelling, longer the harder he hit. It stays about 40 s and goes one stroke at a time. Throw him ten times and the floor keeps the record.
  // No word, no white, nothing on him. physics.json "scuffs": { "on": false } switches it off (bench / pet: ?scuffs=0).
  const SC = (data.physics && data.physics.scuffs) || {}, scuffsOn = SC.on !== false;
  let lastCrackK = -1e9, cracksMade = 0, uid = 0;
  const fx = { name: 'fx', things, dirty: true };
  const diag = () => Math.hypot(room.right - room.left, room.ceiling - room.floor);
  const cue = (name, slot) => emit('cue', { name, slot });
  const add = t => { t.id = ++uid; t.born = clock.k; things.push(t); fx.dirty = true; return t; };
  const drop = t => { const i = things.indexOf(t); if (i >= 0) things.splice(i, 1); fx.dirty = true; };

  function makeCrack(x, y, r) {   // a spider crack: rays from where his face was, kinked, a few branches, two broken rings. Segments carry the step they appear on.
    const segs = [], shards = [], n = 7 + Math.floor(rnd() * 3), rays = [];
    for (let i = 0; i < n; i++) { let a = (i + R(-0.3, 0.3)) / n * Math.PI * 2, len = r * R(0.55, 1), px = 0, py = 0, d = 0; const pts = [[0, 0]], m = 4 + Math.floor(rnd() * 3);
      for (let j = 1; j <= m; j++) { a += R(-0.32, 0.32); const l = len / m * R(0.7, 1.3), nx = px + Math.cos(a) * l, ny = py + Math.sin(a) * l; d += l;
        segs.push({ a: [px, py], b: [nx, ny], f: d / r, w: 1 - 0.75 * Math.min(1, d / r) }); px = nx; py = ny; pts.push([px, py]);
        if (rnd() < 0.4 && j < m) { let ba = a + (rnd() < 0.5 ? 1 : -1) * R(0.5, 1.1), bx = px, by = py; for (let q = 0; q < 2; q++) { const bl = len / m * R(0.4, 0.8), ex = bx + Math.cos(ba) * bl, ey = by + Math.sin(ba) * bl; segs.push({ a: [bx, by], b: [ex, ey], f: Math.min(1, d / r + 0.15 * (q + 1)), w: 0.35 }); bx = ex; by = ey; ba += R(-0.4, 0.4); } } }
      rays.push(pts); }
    for (const ring of [1, 2]) for (let i = 0; i < n; i++) if (rnd() < 0.62) { const p = rays[i][Math.min(ring, rays[i].length - 1)], q = rays[(i + 1) % n][Math.min(ring, rays[(i + 1) % n].length - 1)], mx = (p[0] + q[0]) / 2 * R(0.86, 0.98), my = (p[1] + q[1]) / 2 * R(0.86, 0.98);
      segs.push({ a: p, b: [mx, my], f: ring * 0.3, w: 0.45 }, { a: [mx, my], b: q, f: ring * 0.3, w: 0.45 });
      if (ring === 1 && rnd() < 0.7) shards.push([[0, 0], p, q]); }
    for (const s of segs) s.step = s.f < 0.34 ? 0 : s.f < 0.67 ? 1 : 2;
    return { kind: 'crack', layer: 'front', x, y, r, segs, shards, shown: 0, dying: 0, flick: 0 };
  }

  fx.spawn = function (kind, o = {}) {
    if (kind === 'crack') { if (F.crack === false) return null; const g = G.crack || {}, d = diag(), grow = Math.min(g.max_fraction_of_diagonal || 0.35, (g.first_time_fraction || 0.18) * (1 + 0.25 * cracksMade)) * d / 2;
      for (const t of things) if (t.kind === 'crack') t.dying = t.dying || 1;
      const t = add(makeCrack(o.x, o.y, o.r || grow)); t.dieAt = clock.k + 15 + Math.round((F.crack_gone_after_s || g.gone_after_s || 6) * 60); t.slot = o.slot; cracksMade++; lastCrackK = clock.k; cue('fx.crack', o.slot); emit('crack_shown', { x: t.x, y: t.y, slot: o.slot }); return t; }
    if (kind === 'hole') { if (F.hole === false) return null; const t = add({ kind: 'hole', layer: 'back', x: o.x, y: o.y, roll: o.roll || 0, slot: o.slot, shut: 0, back: false, backK: 0, eh: clock.k + Math.round(R(70, 130)) }); cue('fx.hole', o.slot); emit('hole_open', { slot: o.slot, x: t.x, y: t.y }); return t; }
    if (kind === 'spark') { cue('fx.spark', o.slot); return add({ kind: 'spark', layer: 'front', x: o.x, y: o.y, slot: o.slot, dieAt: clock.k + (o.frames || 600), zap: 0 }); }
    if (kind === 'smoke') return add({ kind: 'smoke', layer: 'front', x: o.x, y: o.y, puffs: [0, 1, 2, 3, 4].map(i => ({ dx: R(-0.16, 0.16), dy: i * 0.05, r: R(0.07, 0.13), v: R(0.5, 0.9), drift: R(-0.12, 0.12) })), dieAt: clock.k + 55 });
    if (kind === 'carton') return add({ kind: 'carton', layer: 'back', x: o.x, y: o.y, slot: o.slot, fries: o.fries == null ? 5 : o.fries, leaving: 0 });
    if (kind === 'scuff') { if (!scuffsOn) return null; const old = things.filter(t => t.kind === 'scuff'); if (old.length >= (SC.max || 8)) drop(old[0]);
      const n = o.speed > 14 ? 4 : o.speed > 8 ? 3 : 2, len = Math.min(SC.max_len_bh || 0.55, (SC.len_per_speed || 0.028) * o.speed), life = Math.round((SC.stay_s || 40) * 60);
      const marks = Array.from({ length: n }, (_, i) => ({ t: (i - (n - 1) / 2) * R(0.07, 0.11) + o.dir * i * 0.02, d: R(0.004, 0.03) + i * 0.012, l: len * R(0.55, 1) * (1 - i * 0.16), w: R(0.7, 1) * (1 - i * 0.15), a: o.dir * R(0.05, 0.2), goK: clock.k + Math.round(life * (1 - 0.14 * (n - 1 - i)) * R(0.92, 1)) }));
      return add({ kind: 'scuff', layer: 'back', x: o.x, y: o.y, nx: o.nx, ny: o.ny, dir: o.dir, marks, dieAt: clock.k + life + 5, fleck: rnd() < 0.5 }); }
    if (kind === 'burst') return add({ kind: 'burst', layer: 'front', x: o.x, y: o.y, bits: Array.from({ length: 12 }, () => ({ y: R(-0.5, 0.5), w: R(0.2, 0.7), h: R(0.03, 0.09), v: R(2, 7) * (rnd() < 0.5 ? -1 : 1), c: rnd() < 0.3 ? MAG : rnd() < 0.5 ? LILAC : P2 })), dieAt: clock.k + 20 });
    return null;
  };
  const last = kind => { for (let i = things.length - 1; i >= 0; i--) if (things[i].kind === kind) return things[i]; return null; };
  /** where a thing is, for anyone who wants to look at it or walk to it: 'crack' | 'hole' | 'spark' | 'carton' -> { x, y } | null */
  fx.where = kind => { const t = last(kind) || (kind === 'crack' && pending[0] && { x: pending[0].x, y: pending[0].y }); return t ? { x: t.x, y: t.y } : null; };
  const over = (t, x, y) => t.kind === 'crack' ? Math.hypot(x - t.x, y - t.y) < t.r * 0.8 : t.kind === 'hole' ? Math.abs(x - t.x) < 0.55 && Math.abs(y - t.y) < 0.58 : false;
  /** is this point on something a click would change (the host uses it to decide whether the click is ours) */
  fx.hit = (x, y) => things.some(t => over(t, x, y));
  /** a click: the crack goes at once; the hole shuts and he walks in at once (gags.json gone_on_click). Returns true if it was ours. */
  fx.click = function (x, y, anywhere) { let used = false;
    for (const t of things) { if (!anywhere && !over(t, x, y)) continue;
      if (t.kind === 'crack' && !t.dying) { t.dying = 1; used = true; }
      if (t.kind === 'hole' && !t.shut) { used = true; shutHole(t); const p = ctx.bySlot[t.slot]; if (p && body.mode[t.slot] === MODE.gone && ctx.moves && ctx.moves.play) ctx.moves.play(p, 'walk_back_in', { side: x > (room.left + room.right) / 2 ? -1 : 1, now: true }); } }
    return used; };
  function shutHole(t) { if (t.shut) return; t.shut = 1; t.shutK = clock.k; fx.dirty = true; emit('hole_shut', { slot: t.slot, x: t.x, y: t.y, by: 'fx' }); }

  fx.event = function (name, e) {
    switch (name) {
      case 'cracked': { const cd = (F.crack_cooldown_s || 0) * 60; if (clock.k - lastCrackK < cd) break; pending.push({ slot: e.slot, x: e.at ? e.at[0] : e.x, y: e.at ? e.at[1] : e.y, k: clock.k, calm: 0 }); break; }
      case 'contact': if (e.surface !== 'potato' && e.slot != null) {
          // (final round, comedian) the hole opens ON the contact frame, behind him, while he is still going through it: not 12 frames after he has gone
          if (e.first && e.kind === 'hole') fx.spawn('hole', { slot: e.slot, x: Math.max(room.left + 0.78, Math.min(room.right - 0.78, body.x[e.slot])), y: body.y[e.slot], roll: body.th[e.slot] });
          if (e.speedInto >= (SC.min_speed || 6) && e.kind !== 'hole') { const tx = e.ny, ty = -e.nx, vt = (e.vx || 0) * tx + (e.vy || 0) * ty; fx.spawn('scuff', { x: e.x, y: e.y, nx: e.nx, ny: e.ny, dir: Math.sign(vt) || 1, speed: e.speedInto }); } }
        break;
      case 'went_through': if (things.some(t => t.kind === 'hole' && t.slot === e.slot && !t.shut && clock.k - t.born < 40)) break; fx.spawn('hole', { slot: e.slot, x: Math.max(room.left + 0.78, Math.min(room.right - 0.78, e.x)), y: e.y, roll: ch.get(e.slot, IDX.roll) }); break;
      case 'mode': if (e.from === 'gone') for (const t of things) if (t.kind === 'hole' && t.slot === e.slot) { t.back = true; t.backK = clock.k; } break;
      case 'hole_shut': if (e.by !== 'fx') for (const t of things) if (t.kind === 'hole' && (e.slot == null || t.slot === e.slot)) { if (!t.shut) { t.shut = 1; t.shutK = clock.k; fx.dirty = true; } } break;
      case 'move': if (e.move === 'hold' || e.move === 'stand') for (const t of things) if (t.kind === 'hole' && t.slot === e.slot && t.back && !t.shut && clock.k - t.backK > 60) t.lookK = t.lookK || clock.k; break;
      case 'zapped': if (e.slot != null && !things.some(t => t.kind === 'spark' && t.slot === e.slot)) { const s = e.slot, side = body.x[s] > (room.left + room.right) / 2 ? -1 : 1; fx.spawn('spark', { slot: s, x: body.x[s] + side * 0.62, y: body.y[s] + 0.08 }); } break;
      case 'cue': if (e.name === 'fx.smoke' && e.slot != null) { for (const t of things) if (t.kind === 'spark' && t.slot === e.slot) t.dieAt = clock.k; fx.spawn('smoke', { x: body.x[e.slot], y: body.y[e.slot] + 0.5 }); }
        else if (e.name === 'fx.burst' && e.slot != null) fx.spawn('burst', { x: body.x[e.slot], y: body.y[e.slot] }); break;
      case 'move_zap': break;
      case 'prop': { const s = e.slot, c = things.find(t => t.kind === 'carton' && t.slot === s);
        if (e.do === 'carton' || (e.id === 'fries' && e.on === true)) { if (!c) fx.spawn('carton', { slot: s, x: (e.at ? e.at[0] : body.x[s] + 0.5) + 0.2 * Math.sign((e.at ? e.at[0] : body.x[s] + 0.5) - body.x[s] || 1), y: e.at ? e.at[1] : room.floor }); }
        else if (e.do === 'fry_in_mouth') { if (c && c.fries > 0) c.fries--; mouth[s] = { len: 1, k: clock.k }; cue('fx.fry', s); fx.dirty = true; }
        else if (e.do === 'fry_shorter') { if (mouth[s]) { mouth[s].len = Math.max(0, mouth[s].len - 0.34); if (mouth[s].len < 0.05) mouth[s] = null; fx.dirty = true; } }
        else if (e.do === 'carton_left' || (e.id === 'fries' && e.on === false)) { mouth[s] = null; if (c) { c.leaving = clock.k; } fx.dirty = true; }
        break; }
      case 'thrown': case 'picked_up': if (e.slot != null && mouth[e.slot]) { mouth[e.slot] = null; fx.dirty = true; } break;
    }
  };

  fx.step = function (k) {
    for (let i = pending.length - 1; i >= 0; i--) { const p = pending[i], m = body.mode[p.slot];   // the crack comes LATE: 30 f after he has settled (director's ruling; comedian's rule 1)
      p.calm = m === MODE.ground ? p.calm + 1 : 0;
      // (Chikin, Nov 13: "the glass is also cracking a bit late, it just looks like he gets big": the crack now lands WITH the hit, 2 frames after his face meets the glass. physics.json fx.crack_late: true puts the round-3 timing back, 30 f after he has settled.)
      if ((F.crack_late ? p.calm >= 30 : k - p.k >= (F.crack_delay_f == null ? 2 : F.crack_delay_f)) || k - p.k > 420 || !ctx.bySlot[p.slot]) { pending.splice(i, 1); fx.spawn('crack', p); } }
    for (let i = things.length - 1; i >= 0; i--) { const t = things[i], age = k - t.born;
      if (t.kind === 'crack') { const sh = t.dying ? 3 - Math.floor((k - t.dyK) / STEP) : Math.min(3, 1 + Math.floor(age / STEP));
        if (!t.dying && k >= t.dieAt) t.dying = 1; if (t.dying === 1) { t.dying = 2; t.dyK = k; cue('fx.crack.clear', t.slot); }
        const shown = t.dying ? Math.max(0, 3 - Math.floor((k - t.dyK) / STEP)) : sh; if (shown !== t.shown) { t.shown = shown; fx.dirty = true; }
        if (age % STEP === 0) { t.flick = Math.floor(rnd() * 1e6); fx.dirty = true; }
        if (t.dying && shown <= 0) { emit('crack_gone', { x: t.x, y: t.y, slot: t.slot }); drop(t); } }
      else if (t.kind === 'hole') { if (age % STEP === 0 && (age < 20 || t.shut)) fx.dirty = true;
        if (!t.back && !t.shut && k === t.eh) cue('fx.hole.pause', t.slot);
        if (!t.shut && ((t.lookK && k - t.lookK > 300) ||   /* final round: 50 -> 300. The animator's clip shuts the hole 24 f into his look at you (hole_shut by moves); this is only the fallback */
           (t.back && k - t.backK > 900) || !ctx.bySlot[t.slot])) shutHole(t);   // he is back, has stopped, has had his look: the hole shuts
        if (t.shut && k - t.shutK >= 4 * STEP) drop(t); }
      else if (t.kind === 'spark') { if (age % STEP === 0) { t.seed = Math.floor(rnd() * 1e6); fx.dirty = true; } if (k >= t.dieAt) drop(t); }
      else if (t.kind === 'scuff') { for (let j = t.marks.length - 1; j >= 0; j--) if (k >= t.marks[j].goK) { t.marks.splice(j, 1); fx.dirty = true; } if (!t.marks.length || k >= t.dieAt) drop(t); }
      else if (t.kind === 'smoke' || t.kind === 'burst') { if (age % STEP === 0) fx.dirty = true; if (k >= t.dieAt) drop(t); }
      else if (t.kind === 'carton') { if (t.leaving && k - t.leaving > 90) drop(t); else if (t.leaving && (k - t.leaving) % STEP === 0) fx.dirty = true; } }
    for (let s = 0; s < mouth.length; s++) if (mouth[s]) { fx.dirty = true; if (!ctx.bySlot[s]) mouth[s] = null; }
  };

  // ------------------------------------------------------------------ drawing (the host calls this when fx.dirty)
  const lcg = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  function shapePath(g, view, x, y, roll, k = 1, ky = 1) { const c = Math.cos(roll), s = Math.sin(roll), P = ([u, v]) => view.toPx(x + (u * c - v * s * ky) * k, y + (u * s + v * c * ky) * k);
    g.beginPath(); g.moveTo(...P(SHAPE[0])); for (let i = 1; i < SHAPE.length; i++) { const [a, b, d] = SHAPE[i]; g.bezierCurveTo(...P(a), ...P(b), ...P(d)); } g.closePath(); }
  fx.draw = function (g, layer, view) {
    const px = view.px, k = clock.k;
    for (const t of things) { if (t.layer !== layer) continue; const age = k - t.born;
      if (t.kind === 'crack') { const r = lcg(t.flick + 7), [cx, cy] = view.toPx(t.x, t.y), L = ([u, v]) => [cx + u * px, cy - v * px];
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (const sh of t.shards) { if (t.shown < 1) break; const ox = (r() - 0.5) * 6, oy = (r() - 0.5) * 3; g.beginPath(); sh.forEach((p, i) => { const q = L(p); i ? g.lineTo(q[0] + ox, q[1] + oy) : g.moveTo(q[0] + ox, q[1] + oy); }); g.closePath(); g.fillStyle = r() < 0.5 ? 'rgba(123,60,242,0.42)' : 'rgba(42,15,99,0.5)'; g.fill(); }
        for (const pass of [0, 1, 2]) for (const s of t.segs) { if (s.step >= t.shown) continue; const a = L(s.a), b = L(s.b), w = Math.max(1.5, px * 0.055 * s.w);
          if (pass === 0) { g.strokeStyle = INK; g.lineWidth = w + Math.max(2, px * 0.016); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
          else if (pass === 1) { const hot = r() < 0.3; g.strokeStyle = hot ? LILAC : P2; g.lineWidth = Math.max(1, w * 0.55); const o = hot ? px * 0.016 : px * 0.006; g.beginPath(); g.moveTo(a[0] + o, a[1]); g.lineTo(b[0] + o, b[1]); g.stroke(); }
          else if (r() < 0.14) { g.fillStyle = r() < 0.5 ? MAG : P1; const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; g.fillRect(Math.round(m[0] - px * (0.06 - r() * 0.04)), Math.round(m[1] - 1), Math.round(px * (0.06 + r() * 0.12)), Math.max(3, Math.round(px * 0.022))); } } }   // his glitch, in the crack
      else if (t.kind === 'hole') { const st = t.shut ? Math.min(4, Math.floor((k - t.shutK) / STEP) + 1) : 0, ky = [1, 0.7, 0.42, 0.16, 0][st]; if (ky <= 0) continue;
        shapePath(g, view, t.x, t.y, t.roll, 1.04, ky); g.fillStyle = VOID; g.fill(); g.lineWidth = Math.max(2, px * 0.03); g.strokeStyle = INK; g.stroke();
        g.save(); g.clip(); shapePath(g, view, t.x - 0.05, t.y + 0.07, t.roll, 0.86, ky); g.fillStyle = '#07020f'; g.fill(); g.restore();   // a little depth: darker further in, up and to the left
        if (age < 15 || t.shut) { const r = lcg(Math.floor(k / STEP) * 31 + t.id), [cx, cy] = view.toPx(t.x, t.y); for (let i = 0; i < 6; i++) { g.fillStyle = [P2, MAG, LILAC, P1][Math.floor(r() * 4)]; const w = (0.2 + r() * 0.5) * px, yy = cy + (r() - 0.5) * 1.05 * px * ky; g.fillRect(Math.round(cx + (r() < 0.5 ? -0.62 : 0.2) * px + (r() - 0.5) * 0.2 * px), Math.round(yy), Math.round(w), Math.max(2, Math.round(px * 0.022))); } } }
      else if (t.kind === 'scuff') { const tx = t.ny, ty = -t.nx; g.lineCap = 'round';   // a skid: short ink strokes along the surface, just proud of it, the way he was going
        for (const m of t.marks) { const ox = t.x + tx * m.t + t.nx * m.d, oy = t.y + ty * m.t + t.ny * m.d, ex = ox + (tx * Math.cos(m.a) + t.nx * Math.sin(Math.abs(m.a))) * m.l * t.dir, ey = oy + (ty * Math.cos(m.a) + t.ny * Math.sin(Math.abs(m.a))) * m.l * t.dir;
          const a = view.toPx(ox, oy), b = view.toPx(ex, ey), w = Math.max(2, px * 0.034 * m.w);
          g.strokeStyle = INK; g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
          g.strokeStyle = DEEP; g.lineWidth = Math.max(1, w * 0.4); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); g.stroke(); }
        if (t.fleck && t.marks.length > 1) { const q = view.toPx(t.x + t.nx * 0.05, t.y + t.ny * 0.05); g.fillStyle = P1; g.fillRect(Math.round(q[0] - px * 0.03), Math.round(q[1] - 1), Math.max(3, Math.round(px * 0.05)), Math.max(2, Math.round(px * 0.016))); } }
      else if (t.kind === 'spark') { const r = lcg((t.seed || 1) + 3), [cx, cy] = view.toPx(t.x, t.y), n = 5; g.lineCap = 'square';
        for (const [col, w] of [[INK, 7], [P2, 4], [LILAC, 1.5]]) { const rr = lcg((t.seed || 1) + 3); g.strokeStyle = col; g.lineWidth = w; for (let i = 0; i < n; i++) { const a = rr() * 6.283, l = (0.1 + rr() * 0.16) * px, m = a + (rr() - 0.5) * 1.6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * l * 0.5, cy + Math.sin(a) * l * 0.5); g.lineTo(cx + Math.cos(a) * l * 0.5 + Math.cos(m) * l * 0.6, cy + Math.sin(a) * l * 0.5 + Math.sin(m) * l * 0.6); g.stroke(); } }
        g.fillStyle = MAG; g.fillRect(Math.round(cx - 2 + (r() - 0.5) * 8), Math.round(cy - 2 + (r() - 0.5) * 8), 4, 4); }
      else if (t.kind === 'smoke') { const f = Math.floor(age / STEP) * STEP / 55, a = Math.max(0, 1 - f * f);
        for (const p of t.puffs) { const [sx, sy] = view.toPx(t.x + p.dx + p.drift * f, t.y + p.dy + p.v * f * 0.9), rr = p.r * px * (0.7 + 1.1 * f); g.beginPath(); g.arc(sx, sy, rr, 0, 6.283); g.fillStyle = `rgba(38,28,48,${(0.85 * a).toFixed(2)})`; g.fill(); g.lineWidth = Math.max(1.5, px * 0.016); g.strokeStyle = `rgba(18,10,5,${a.toFixed(2)})`; g.stroke(); } }
      else if (t.kind === 'burst') { const f = Math.floor(age / STEP) * STEP / 60, [cx, cy] = view.toPx(t.x, t.y); for (const b of t.bits) { g.fillStyle = b.c; g.fillRect(Math.round(cx + b.v * f * px - b.w * px / 2), Math.round(cy - b.y * px), Math.round(b.w * px * (1 - f * 2.2)), Math.max(2, Math.round(b.h * px))); } }
      else if (t.kind === 'carton') { const gone = t.leaving ? Math.floor((k - t.leaving) / STEP) : 0; if (gone > 14 && gone % 2) continue; const [bx, by] = view.toPx(t.x, t.y), w = 0.3 * px, h = 0.3 * px, lw = Math.max(2, px * 0.022);
        g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = INK;
        for (let i = 0; i < t.fries; i++) { const fxx = bx - w * 0.36 + i * w * 0.18, tilt = (i - 2) * 0.09, hh = h * (0.5 + ((i * 7) % 3) * 0.09); g.save(); g.translate(fxx, by - h * 0.82); g.rotate(tilt); g.fillStyle = '#e9b949'; g.fillRect(-w * 0.055, -hh, w * 0.11, hh + 4); g.strokeRect(-w * 0.055, -hh, w * 0.11, hh + 4); g.restore(); }
        g.beginPath(); g.moveTo(bx - w * 0.5, by - h * 0.86); g.lineTo(bx + w * 0.5, by - h * 0.86); g.lineTo(bx + w * 0.38, by); g.lineTo(bx - w * 0.38, by); g.closePath(); g.fillStyle = '#8f7fb0'; g.fill(); g.stroke();   // plain paper, his purple gone dusty. No logo, no word.
        g.beginPath(); g.moveTo(bx - w * 0.47, by - h * 0.6); g.lineTo(bx + w * 0.47, by - h * 0.6); g.lineWidth = lw * 0.7; g.strokeStyle = DEEP; g.stroke(); } }
    if (layer === 'front') for (let s = 0; s < mouth.length; s++) { const m = mouth[s]; if (!m || !ctx.bySlot[s] || body.mode[s] === MODE.gone) continue;   // the fry: out of his mouth like a toothpick, shorter each chew
      const yaw = ch.get(s, IDX.yaw), roll = ch.get(s, IDX.roll), back = Math.abs(yaw) > 1.75, dir = Math.sin(yaw + 0.42) >= 0 ? 1 : -1, A = (data.physics.body && data.physics.body.half_height) || 0.5;
      // the same sums as rig.mjs bone + turn, so the fry stays in his mouth through a chew (squash about the pivot, shear, roll about his centre)
      let sy = ch.get(s, IDX.sy) || 1, sx = ch.get(s, IDX.sx); if (sx !== sx || !sx) sx = 1 / Math.sqrt(sy); const pv = ch.get(s, IDX.pivot) || 0, shr = (ch.get(s, IDX.shear) || 0) / (2 * A);
      const u0 = back ? -Math.sign(yaw) * 0.5 : Math.max(-0.42, Math.min(0.42, 0.47 * Math.sin(yaw + 0.2))), h = A - 0.085, u = sx * u0 + shr * sy * h + shr * pv * (1 - sy), v = sy * h + pv * (1 - sy) - A, c = Math.cos(roll), sn = Math.sin(roll);
      const x = ch.get(s, IDX.x) + (ch.get(s, IDX.dx) || 0) + u * c - v * sn, y = ch.get(s, IDX.y) + (ch.get(s, IDX.dy) || 0) + u * sn + v * c, [ax, ay] = view.toPx(x, y), len = (back ? 0.1 : 0.2) * m.len * px, th = Math.max(4, px * 0.042), ang = (back ? -Math.sign(yaw) : dir) > 0 ? 0.22 - roll : Math.PI - 0.22 - roll;
      g.save(); g.translate(ax, ay); g.rotate(ang); g.fillStyle = '#e9b949'; g.strokeStyle = INK; g.lineWidth = Math.max(2, px * 0.02); g.lineJoin = 'round'; g.fillRect(0, -th / 2, len, th); g.strokeRect(0, -th / 2, len, th); g.restore(); }
    if (layer === 'front') fx.dirty = false;
  };
  return fx;
}
