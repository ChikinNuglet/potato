// engine.mjs — one level of the Potato platformer. The song is the clock: the screen scrolls one column per game beat
// and the course is brought to him; the page behind him erases itself (the left edge). See game/STORY.md, LEVEL-1.md.
// Controls (Chikin): left/right move, up jump (on the beat = bigger), down duck, space glitch (base power, 1 per bar),
// V use the downloaded power. Powers work like Mario: get hit in a costume -> lose it; hit as plain Potato -> glitch out.
import * as T from './vendor/three.module.js';
import { block, sticker, background, THEMES, canvasTex } from './art.mjs';
import { SFX } from './sfx.mjs';
import { POWERS } from './powers.mjs';

const RUN = 2.4, G = 19, JUMP = 7.4, BEAT_JUMP = 8.9, BEAT_WIN = 0.11, PW = 0.78, PH = 0.95, PH_DUCK = 0.58;
const ONEWAY = new Set(['pump', 'blink', 'drop', 'spamfrozen', 'mover', 'dots', 'rise', 'carrier', 'girder', 'hidden', 'fake', 'beatfloor']);
const GLITCHABLE = new Set(['wall', 'low', 'duck', 'gate']);
const S = p => 'sprites/' + p + '.webp';

export function buildLevel(ctx, def, map) {
  const { world, cam } = ctx;
  const BEAT = map.gameBeat, OFF = map.gameOffset, LEAD = 4, SPEED = 1 / BEAT;
  const theme = THEMES[def.theme] || THEMES.void404;
  const END = def.end || map.duration;
  const X = e => e + LEAD, tOf = b => OFF + b * BEAT, beatOf = t => (t - OFF) / BEAT, camX = t => (t - OFF) / BEAT;
  const sections = def.sections;
  const sectionAt = b => { let i = 0; sections.forEach((s, k) => { if (b >= s[1]) i = k; }); return i; };

  // ---------- course ----------
  const C = []; const add = (k, e, o = {}) => C.push({ k, e, n: 1, ...o });
  const api = {
    gap: (e, n = 1) => add('gap', e, { n }), low: (e, h = 0.9) => add('low', e, { h }), wall: e => add('wall', e),
    duck: (e, n = 2, y = 0.7) => add('duck', e, { n, y }), step: (e, n, y) => add('step', e, { n, y }),
    pump: (e, n, y) => add('pump', e, { n, y }), blink: (e, n, y = 0, pat = '01') => add('blink', e, { n, y, pat }),
    drop: (e, n, y) => add('drop', e, { n, y }), spam: (e, y = 0, o = {}) => add('spam', e, { y, ...o }),
    packet: (e, power) => add('packet', e, { power: power || def.power }),
    beatfloor: (e, n, every = 1) => add('beatfloor', e, { n, every }), dots: (e, n, y, pat) => add('dots', e, { n, y, pat }),
    mover: (e, n, y, dx = 0, dy = 0, per = 4) => add('mover', e, { n, y, dx, dy, per }), rise: (e, n, from, to, beats) => add('rise', e, { n, y: to, from, beats }),
    fake: (e, n, y = 0) => add('fake', e, { n, y }), hidden: (e, n, y = 0) => add('hidden', e, { n, y }),
    fall: (e, n = 1) => add('fall', e, { n }), beam: (e, beats = 4) => add('beam', e, { beats }), wave: (e, beats = 4, push = 2.2) => add('wave', e, { beats, push }),
    gate: e => add('gate', e), echo: (e, beats = 16) => add('echo', e, { beats }), arrow: (e, y = 1.6, lie = true) => add('arrow', e, { y, lie }),
    carrier: (e, n, y, dist, beats) => add('carrier', e, { n, y, dist, beats }),
    deco: (e, src, y = 0, h = 1.2, o = {}) => add('deco', e, { src, y, h, ...o }),
  };
  def.course(api);
  const floorGap = new Set(); for (const p of C) if (p.k === 'gap') for (let i = 0; i < p.n; i++) floorGap.add(X(p.e) + i);
  const lastCol = X(Math.ceil(beatOf(END))) + 30;

  const solids = [], movers = [], spams = [], packets = [], falls = [], beams = [], waves = [], gates = [], echoes = [], decos = [], arrows = [];
  // floor runs
  { let st = null; for (let c = -12; c <= lastCol; c++) { const solid = !floorGap.has(c);
      if (solid && st === null) st = c;
      if ((!solid || c === lastCol) && st !== null) { const en = solid ? c + 1 : c;
        solids.push({ x0: st, x1: en, y0: -6, y1: 0, kind: 'floor', mesh: block(world, st, en, -6, 0, theme.ground, theme, { border: false }) }); st = null; } } }
  for (const p of C) {
    const x0 = X(p.e), x1 = x0 + p.n;
    const solid = (o, style) => { const s = { ...o, x0: o.x0 ?? x0, x1: o.x1 ?? x1 }; s.mesh = block(world, s.x0, s.x1, s.y0, Math.min(s.y1, 9), style, theme); solids.push(s); return s; };
    if (p.k === 'low') solid({ x0: x0 + 0.12, x1: x0 + 0.88, y0: 0, y1: p.h, kind: 'low' }, 'broken');
    if (p.k === 'wall') solid({ x0: x0 + 0.2, x1: x0 + 0.8, y0: 0, y1: 12, kind: 'wall' }, 'wall');
    if (p.k === 'duck') solid({ y0: p.y, y1: 12, kind: 'duck' }, 'loading');
    if (p.k === 'step') solid({ x0: x0 + 0.05, x1: x1 - 0.05, y0: 0, y1: p.y, kind: 'step' }, theme.ground);
    if (p.k === 'gate') { const s = solid({ x0: x0 + 0.25, x1: x0 + 0.75, y0: 0, y1: 12, kind: 'gate', e: p.e, open: 0 }, 'wall'); gates.push(s);
      const cap = sticker(S('captcha-approved-dance'), 1.2); cap.position.set(x0 - 1.2, 2.6, 0.3); world.add(cap); s.cap = cap;
      const pad = block(world, x0 - 1.6, x0 - 0.2, -0.06, 0.02, 'buffer', theme, { depth: 0.75 }); s.pad = { x0: x0 - 1.6, x1: x0 - 0.2, mesh: pad, held: 0 }; }
    if (['pump', 'blink', 'drop', 'beatfloor', 'dots', 'mover', 'rise', 'fake', 'hidden', 'carrier'].includes(p.k)) {
      const style = p.k === 'blink' || p.k === 'dots' ? 'buffer' : p.k === 'pump' || p.k === 'drop' || p.k === 'beatfloor' ? 'speaker' : theme.ground;
      const y = p.k === 'beatfloor' ? 0 : p.y;
      const s = { ...p, x0: x0 + 0.05, x1: x1 - 0.05, base: y, y0: y - 0.3, y1: y, kind: p.k };
      s.mesh = block(world, s.x0, s.x1, y - 0.3, y, style, theme); solids.push(s); movers.push(s);
      if (p.k === 'carrier') { const g = sticker(S('ghostfile-peek'), 1.0); g.position.set(0, 0.5, 0.2); s.mesh.add(g); }
    }
    if (p.k === 'spam') { const m = sticker(S('spam-promo-strut'), 0.85); m.position.z = 0.25; world.add(m); spams.push({ ...p, held: 0, frozenUntil: -1, mesh: m }); }
    if (p.k === 'packet') { const m = new T.Group();
      const cube = new T.Mesh(new T.OctahedronGeometry(0.34), new T.MeshBasicMaterial({ color: '#f4c430' })); const ink = new T.Mesh(new T.OctahedronGeometry(0.4), new T.MeshBasicMaterial({ color: '#120a05', side: T.BackSide }));
      m.add(cube, ink); m.position.set(x0 + 0.5, 0.8, 0.3); world.add(m); packets.push({ ...p, x: x0 + 0.5, mesh: m, cube, got: false, progress: 0 }); }
    if (p.k === 'fall') { const m = block(world, -0.45, 0.45, -0.3, 0.3, 'loading', theme); m.visible = false; falls.push({ ...p, x: x0 + 0.5, mesh: m }); }
    if (p.k === 'beam') { const m = new T.Mesh(new T.PlaneGeometry(0.35, 14), new T.MeshBasicMaterial({ color: '#ff3b5c', transparent: true, opacity: 0.75 })); m.position.z = 1.5; m.visible = false; world.add(m); beams.push({ ...p, mesh: m }); }
    if (p.k === 'wave') waves.push({ ...p });
    if (p.k === 'echo') { const m = sticker(S('echo-copy-the-point'), 1.0); m.visible = false; m.material.opacity = 0.75; m.position.z = 0.4; world.add(m); echoes.push({ ...p, mesh: m }); }
    if (p.k === 'arrow') { const tex = canvasTex('arrow' + (p.lie ? 'L' : 'R'), 256, 128, (x, w, h) => { x.fillStyle = '#ffd34d'; x.strokeStyle = '#120a05'; x.lineWidth = 10;
        x.beginPath(); x.moveTo(20, 40); x.lineTo(160, 40); x.lineTo(160, 10); x.lineTo(236, 64); x.lineTo(160, 118); x.lineTo(160, 88); x.lineTo(20, 88); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = '#120a05'; x.font = 'bold 30px sans-serif'; x.fillText(p.lie ? 'EXIT' : 'this way', 30, 76); });
      const m = new T.Mesh(new T.PlaneGeometry(1.6, 0.8), new T.MeshBasicMaterial({ map: tex, transparent: true })); m.position.set(x0 + 0.5, p.y, -0.4); if (p.lie) m.rotation.z = Math.PI; world.add(m); arrows.push(m); }
    if (p.k === 'deco') { const m = sticker(S(p.src), p.h); m.position.set(x0 + 0.5, p.y + p.h / 2, p.z ?? -0.6); world.add(m); decos.push({ ...p, mesh: m }); }
  }
  // checkpoints: Cache files the section away
  for (const [, b] of sections.slice(1)) { const m = sticker(S('cache-file-memory'), 1.0); m.position.set(X(b) + 0.2, 0.5, -0.5); world.add(m); decos.push({ k: 'cache', e: b, mesh: m }); }
  // the end door (each level ends at a door)
  const doorX = X(Math.floor(beatOf(END))) + 1.5;
  block(world, doorX, doorX + 1.7, 0, 2.7, 'page', theme, { z: -0.2 }); const door = block(world, doorX + 0.28, doorX + 1.42, 0, 2.3, 'wall', theme, { z: 0, border: false });
  if (def.kitchen) { block(world, doorX - 3.4, doorX - 0.2, 0, 1.15, 'page', theme, { z: -0.8, depth: 0.5 }); }
  // the page erasing itself behind him
  const edge = new T.Mesh(new T.PlaneGeometry(60, 40), new T.MeshBasicMaterial({ color: theme.edge })); edge.position.z = 3; world.add(edge);
  const edgeLine = new T.Mesh(new T.PlaneGeometry(0.08, 40), new T.MeshBasicMaterial({ color: '#c9c3da' })); edgeLine.position.z = 3.01; world.add(edgeLine);
  const ring = new T.Mesh(new T.RingGeometry(0.9, 1.0, 48), new T.MeshBasicMaterial({ color: '#f2b928', transparent: true })); ring.position.z = 2; ring.visible = false; world.add(ring);
  const bar = new T.Mesh(new T.PlaneGeometry(1, 0.13), new T.MeshBasicMaterial({ color: '#f2b928' })); bar.position.z = 2.5; bar.visible = false; world.add(bar);
  const dark = new T.Mesh(new T.PlaneGeometry(80, 40), new T.ShaderMaterial({ transparent: true, depthTest: false, uniforms: { c: { value: new T.Vector2() }, r: { value: 3 }, k: { value: 0 } },
    vertexShader: `varying vec3 w; void main(){ vec4 p = modelMatrix * vec4(position,1.0); w = p.xyz; gl_Position = projectionMatrix * viewMatrix * p; }`,
    fragmentShader: `uniform vec2 c; uniform float r, k; varying vec3 w; void main(){ float d = length(w.xy - c); gl_FragColor = vec4(0.03,0.02,0.07, k * smoothstep(r * 0.55, r, d)); }` }));
  dark.position.z = 2.8; dark.renderOrder = 5; world.add(dark);
  const bg = background(world, theme, lastCol, def.n * 13 + 5);
  world.background = new T.Color(theme.sky); if (ctx.setTheme) ctx.setTheme(theme);

  // ---------- state ----------
  const P = { x: X(0) + 0.5, y: 3, vx: 0, vy: 0, ground: false, duck: false, power: null, inv: 0, phase: 0, messy: false, charge: true,
              used: -9, cd: -99, dl: null, dying: 0, won: false, face: 1, coyote: 0, on: null, airJump: true, hold: false, trail: [] };
  const L = { reveal: -1, lampUntil: -1, overrideUntil: -1, girders: [], deaths: 0, beatJumps: 0, glitches: 0 };
  const edgeX = t => camX(t) + 0.3 + (def.creep ? def.creep(beatOf(t)) : 0);
  const rightX = t => camX(t) + ctx.viewW() - 0.9;
  const homeX = t => camX(t) + LEAD + 0.5;
  function moverY(s, t) {
    const b = beatOf(t), ph = b - Math.floor(b);
    if (s.kind === 'pump') return s.base + 0.16 * (0.5 + 0.5 * Math.cos(2 * Math.PI * ph));
    if (s.kind === 'drop') { const k = (t - tOf(s.e - 0.5)) / (0.5 * BEAT); return k < 0 ? 40 : s.base + 4 * Math.max(0, 1 - k) ** 2; }
    if (s.kind === 'mover') return s.base + s.dy * Math.sin(2 * Math.PI * b / s.per);
    if (s.kind === 'rise') { const k = Math.min(1, Math.max(0, (b - (s.e - s.beats)) / s.beats)); return s.from + (s.base - s.from) * k; }
    return s.base;
  }
  function moverX(s, t) { const b = beatOf(t);
    if (s.kind === 'mover' && s.dx) return s.dx * Math.sin(2 * Math.PI * b / s.per);
    if (s.kind === 'carrier') return Math.min(s.dist, Math.max(0, (b - s.e)) * s.dist / s.beats);
    return 0; }
  function live(s, t) {
    const b = beatOf(t);
    if (s.kind === 'blink' || s.kind === 'dots') { const pat = s.pat || '01'; return pat[((Math.floor(b) % pat.length) + pat.length) % pat.length] === '1'; }
    if (s.kind === 'beatfloor') { const ph = b - Math.round(b / s.every) * s.every; return Math.abs(ph) * BEAT < 0.24; }
    if (s.kind === 'drop') return b >= s.e - 0.02;
    if (s.kind === 'fake') return false;                         // made of confident nonsense
    if (s.kind === 'hidden') return t < L.reveal || P.power === 'detective';
    if (s.kind === 'gate') return s.open <= 0;
    return true;
  }
  const spamX = (s, t) => { const held = s.held + (t < s.frozenUntil ? t - (s.frozenUntil - 8 * BEAT) : 0); return X(s.e) + 0.5 - (s.speed || 0.9) * (t - tOf(s.e) - held); };
  function boxes(t, dt) {
    const out = [];
    for (const s of solids) { if (!live(s, t)) continue;
      if (movers.includes(s)) { const y = moverY(s, t), dx = moverX(s, t); out.push({ ...s, x0: s.x0 + dx, x1: s.x1 + dx, y1: y, y0: y - 0.3, prevTop: moverY(s, t - dt), vx: (dx - moverX(s, t - dt)) / Math.max(dt, 1e-4) }); }
      else out.push({ ...s, prevTop: s.y1 }); }
    for (const g of L.girders) if (t < g.until) out.push({ ...g, prevTop: g.y1 });
    for (const s of spams) if (t < s.frozenUntil) out.push({ x0: s.fx - 0.36, x1: s.fx + 0.36, y0: s.y, y1: s.y + 0.55, prevTop: s.y + 0.55, kind: 'spamfrozen' });
    return out;
  }
  const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

  function respawn(t) {
    const sec = sections[sectionAt(beatOf(t))], tb = sec[1] === 0 ? 0 : tOf(sec[1]);
    ctx.seek(tb);
    Object.assign(P, { x: camX(tb) + LEAD + 0.5, y: sec[1] === 0 ? 4 : 2.2, vx: 0, vy: 0, face: 1, power: null, inv: 0, phase: 0, charge: true, dl: null, dying: 0, on: null, trail: [] });
    ctx.spud.wear(null); ctx.setPowerLabel(null);
    P.arrive = sec[1] === 0 ? 2.2 : 0.9;            // he arrives (and every rebuild) in purple pieces
    for (const s of spams) if (s.e >= sec[1]) { s.held = 0; s.frozenUntil = -1; }
    for (const p of packets) if (p.e >= sec[1]) { p.got = false; p.progress = 0; p.mesh.visible = true; }
    for (const g of gates) if (g.e >= sec[1]) { g.open = 0; g.pad.held = 0; }
    for (const bm of beams) bm.passed = false;
    L.girders = []; L.reveal = -1; L.lampUntil = -1; L.overrideUntil = -1;
    ctx.flash(sec[0]);
  }
  function die(t) { if (P.dying || P.won) return; P.dying = 1.15; L.deaths++; SFX.die(); ctx.flash('krrzzt'); }
  function hurt(t, kind) {
    if (P.inv > 0 || P.dying) return;
    const pw = POWERS[P.power]; if (pw && pw.shield && pw.shield(ctx, P, L, t, kind)) return;
    if (P.power) { P.power = null; P.inv = 1.6; ctx.spud.wear(null); ctx.setPowerLabel(null); P.vx = -2; P.vy = 4; ctx.spud.land(3); SFX.hit(); ctx.flash('power lost'); }
    else die(t);
  }
  async function givePower(id) {
    const pw = POWERS[id]; if (!pw) return; P.power = id; P.airJump = true;
    ctx.spud.wear(await ctx.loadOutfit(pw.outfit)); ctx.setPowerLabel(pw); SFX.download(); ctx.flash('download complete: ' + pw.name);
  }

  // the off-switch beam sweeps the screen ONCE, left to right, over its beats: one glitch (a bar's charge) dodges it
  const beamX = (bm, t) => camX(t) + (0.12 + 0.76 * (0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, (beatOf(t) - bm.e) / bm.beats))))) * ctx.viewW();
  // Echo copies his moves a beat late, a step behind him on screen: it only hurts if he backs into it
  const echoX = (q, t) => q.x + (camX(t) - camX(q.t)) - 1.4;
  let lastBeat = -99;
  const level = {
    def, map, P, L, BEAT, OFF, END, sections, camX, beatOf, edgeX, spams, spamX, packets, gates, beams, beamX, waves, falls, tOf, boxesAt: t => boxes(t, 1 / 60), C, X,
    start() { respawn(0); },
    step(dt, input) {
      const t = ctx.now(), b = beatOf(t), h = P.duck ? PH_DUCK : PH;
      const bi = Math.floor(b);
      if (bi !== lastBeat) { lastBeat = bi; ctx.beatPulse(bi);
        if (!P.charge && bi % 4 === 0 && bi > P.used) P.charge = true;
        if (bi % 4 === 0) P.airJump = true;
        const si = sections.findIndex(s => s[1] === bi); if (si > 0) { SFX.checkpoint(); ctx.flash(sections[si][0]); } }
      if (P.dying) { P.dying -= dt; ctx.glitch(Math.min(1, 0.4 + (1.15 - P.dying))); if (P.dying <= 0) respawn(t); return; }
      if (P.won) return;
      const pw = POWERS[P.power];
      // ---- input ----
      const Lk = input.has('L'), Rk = input.has('R'); P.duck = input.has('D') && P.ground; P.hold = input.has('V');
      const planted = pw && pw.plant && P.hold;
      // he keeps pace with the song by default and drifts back to his usual spot when you let go
      const home = (!Rk && !Lk && P.ground) ? Math.max(-1, Math.min(1, (homeX(t) - P.x) * 0.5)) : 0;
      const want = (P.dl || planted) ? 0 : SPEED + (Rk ? RUN : 0) - (Lk ? RUN : 0) - (P.duck ? 0.6 : 0) + home;
      const dash = P.phase > 0 ? (P.messy ? 2.6 : 4.2) * P.face : 0;
      // in the air he keeps his jump's momentum (no braking back to scroll speed mid-jump)
      P.vx += (want + dash - P.vx) * Math.min(1, dt * (P.phase > 0 ? 25 : P.ground ? 10 : (want > P.vx ? 6 : Lk ? 3 : 0.25)));
      if (Rk) P.face = 1; else if (Lk) P.face = -1;
      P.coyote = P.ground ? 0.08 : Math.max(0, P.coyote - dt);
      const onBeat = Math.abs(b - Math.round(b)) * BEAT < BEAT_WIN;
      if (input.pressed('J')) P.jbuf = 0.12; else P.jbuf = Math.max(0, (P.jbuf || 0) - dt);   // an early press still counts when he lands
      if (P.jbuf > 0) {
        if (P.ground || P.coyote > 0) { P.jbuf = 0; P.dl = null;   /* a jump cancels a download */ P.vy = onBeat ? BEAT_JUMP : JUMP; P.ground = false;
          if (!Lk) P.vx = Math.max(P.vx, SPEED + 1.9);        /* a jump carries him forward: clears 2 columns on its own */ P.coyote = 0; P.on = null; ctx.spud.jumped(); SFX.jump(onBeat); if (onBeat) { L.beatJumps++; ctx.beatHit(); } }
        else if (input.pressed('J') && pw && pw.airJump && P.airJump) { P.jbuf = 0; P.vy = BEAT_JUMP * 0.92; P.airJump = false; ctx.spud.jumped(); ctx.spud.spin(); SFX.jump(true); }
      }
      if (input.pressed('G') && P.charge && P.phase <= 0) { P.messy = !onBeat; P.phase = onBeat ? 0.45 : 0.7; P.charge = false; P.used = bi; L.glitches++; SFX.glitch(onBeat); }
      if (input.pressed('V') && pw && pw.use && t - P.cd > (pw.cooldown || 4) * BEAT) { if (pw.use(ctx, level, t) !== false) { P.cd = t; SFX.power(); } }
      // ---- physics ----
      let g = G; if (pw && pw.gravity) g *= pw.gravity(P);
      P.vy -= g * dt; if (pw && pw.fallCap && P.hold) P.vy = Math.max(P.vy, -pw.fallCap);
      if (P.inv > 0) P.inv -= dt;
      if (P.phase > 0) { P.phase -= dt;
        if (P.phase <= 0) for (const s of boxes(t, dt)) if (GLITCHABLE.has(s.kind) && overlap({ x0: P.x - PW / 2, x1: P.x + PW / 2, y0: P.y, y1: P.y + h }, s))
          P.x = P.face > 0 ? s.x1 + PW / 2 + 0.01 : s.x0 - PW / 2 - 0.01; }
      // pushes: delete waves (unless planted)
      for (const w of waves) { const b0 = w.e; if (b >= b0 && b < b0 + w.beats && !planted) P.x -= w.push * dt * (P.ground ? 1 : 0.4); }   // it drags along the floor: a jump gets you mostly clear of it
      const B = boxes(t, dt).filter(s => !(P.phase > 0 && GLITCHABLE.has(s.kind)));
      // ride: a moving platform carries him sideways
      if (P.on && P.on.vx) P.x += P.on.vx * dt;
      P.x += P.vx * dt;
      let me = { x0: P.x - PW / 2, x1: P.x + PW / 2, y0: P.y, y1: P.y + h };
      for (const s of B) if (!ONEWAY.has(s.kind) && overlap(me, s)) {
        // ledge assist: feet only just below the top of what he runs into -> he scrambles up onto it
        if (P.vy <= 0.5 && s.y1 - P.y > 0 && s.y1 - P.y < 0.3) { P.y = s.y1; P.vy = Math.max(P.vy, 0); me = { x0: P.x - PW / 2, x1: P.x + PW / 2, y0: P.y, y1: P.y + h }; continue; }
        if (P.vx > 0 && me.x0 < s.x0) P.x = s.x0 - PW / 2 - 1e-4; else if (me.x1 > s.x1) P.x = s.x1 + PW / 2 + 1e-4; else P.x = s.x0 - PW / 2 - 1e-4;
        P.vx = Math.min(P.vx, 0); me = { x0: P.x - PW / 2, x1: P.x + PW / 2, y0: P.y, y1: P.y + h }; }
      const wasGround = P.ground, vyIn = P.vy, feet0 = P.y; P.y += P.vy * dt; P.ground = false;
      // ride: still standing on the platform he was on (and not jumping) -> glued to its top, up or down
      if (P.on && P.vy <= 0) { const ss = B.find(q => q.kind === P.on.kind && q.e === P.on.e);
        if (ss && P.x + PW / 2 > ss.x0 + 0.05 && P.x - PW / 2 < ss.x1 - 0.05) { P.y = ss.y1; P.vy = 0; P.ground = true; } }
      P.on = null;
      for (const s of B) {
        me = { x0: P.x - PW / 2, x1: P.x + PW / 2, y0: P.y, y1: P.y + h };
        if (ONEWAY.has(s.kind)) {
          if (P.vy <= 0 && me.x1 > s.x0 && me.x0 < s.x1 && P.y <= s.y1 && feet0 >= s.prevTop - 0.06) { P.y = s.y1; P.vy = 0; P.ground = true; if (s.kind !== 'spamfrozen') P.on = s; }
          continue; }
        if (!overlap(me, s)) continue;
        if (P.vy <= 0 && feet0 >= s.y1 - 0.12) { P.y = s.y1; P.vy = 0; P.ground = true; }
        else if (P.vy > 0) { P.y = s.y0 - h; P.vy = 0; }
      }
      me = { x0: P.x - PW / 2, x1: P.x + PW / 2, y0: P.y, y1: P.y + h };
      if (!wasGround && P.ground) { ctx.spud.land(Math.abs(vyIn) * 0.35); if (vyIn < -5) SFX.land(Math.abs(vyIn) / 8); }
      // ---- hazards ----
      const ghosty = pw && pw.ghost;
      for (const s of spams) { if (t < s.frozenUntil) continue; const x = spamX(s, t); if (!ghosty && overlap(me, { x0: x - 0.3, x1: x + 0.3, y0: s.y, y1: s.y + 0.6 })) hurt(t, 'spam'); }
      for (const f of falls) { const k = (t - tOf(f.e - 1.5)) / (1.5 * BEAT); if (k > 0 && k < 1.2) { const y = 7 * (1 - Math.min(1, k)) + 0.3;
        if (overlap(me, { x0: f.x - 0.45, x1: f.x + 0.45, y0: y - 0.3, y1: y + 0.3 }) && !(pw && pw.hardhat)) hurt(t, 'fall'); } }
      for (const bm of beams) { const k = b - bm.e; if (k < 0) bm.passed = false;
        if (k >= 0 && k < bm.beats && t > L.overrideUntil && !bm.passed) {
          if (P.phase > 0) { if (Math.abs(P.x - beamX(bm, t)) < 0.7) bm.passed = true; }   // it went through his glitch: that sweep is done with him
          else if (Math.abs(P.x - beamX(bm, t)) < 0.4) hurt(t, 'beam'); } }
      for (const ec of echoes) { const k = b - ec.e; if (k >= 0 && k < ec.beats && P.trail.length > 30 && !ghosty) { const q = P.trail[0];
        const ex = echoX(q, t); if (q && overlap(me, { x0: ex - 0.3, x1: ex + 0.3, y0: q.y, y1: q.y + 0.9 }) && t - q.t > 0.5) hurt(t, 'echo'); } }
      // Captcha gate: stand still on the pad for one beat to verify (or glitch through)
      for (const g2 of gates) { if (g2.open > 0) { g2.open -= dt; continue; }
        const on = P.ground && me.x1 > g2.pad.x0 && me.x0 < g2.pad.x1 && Math.abs(P.vx) < SPEED * 0.5; g2.pad.held = on ? g2.pad.held + dt : Math.max(0, g2.pad.held - dt * 2);
        if (g2.pad.held > BEAT) { g2.open = 4 * BEAT; g2.pad.held = 0; SFX.checkpoint(); ctx.flash('verified: you are not a robot'); } }
      // edges: the erasing page pushes him on; pinned against a block -> he glitches out (never in the intro)
      if (P.x - PW / 2 < edgeX(t)) { const nx = edgeX(t) + PW / 2, pinned = B.some(s => !ONEWAY.has(s.kind) && overlap({ x0: nx - PW / 2, x1: nx + PW / 2, y0: P.y + 0.02, y1: P.y + h }, s));
        if (pinned && b >= (sections[1] ? sections[1][1] : 16)) die(t); else P.x = nx; }
      if (P.x + PW / 2 > rightX(t)) P.x = rightX(t) - PW / 2;
      if (P.y < -2.5) die(t);
      // download: stand on the packet 2 beats (the screen keeps moving: it costs ground)
      P.dl = null;
      for (const p of packets) if (!p.got && Math.abs(P.x - p.x) < 0.7 && P.y < 1.4 && P.ground) {
        const was = p.progress; p.progress += dt; P.dl = p; if (Math.floor(was / BEAT * 4) !== Math.floor(p.progress / BEAT * 4)) SFX.dlTick();
        if (p.progress >= 2 * BEAT) { p.got = true; p.mesh.visible = false; P.dl = null; givePower(p.power === 'random' ? ctx.randomPower() : p.power); }
      } else if (!p.got) p.progress = Math.max(0, p.progress - dt);
      if (pw && pw.update) pw.update(ctx, level, t, dt);
      P.trail.push({ x: P.x, y: P.y, t }); while (P.trail.length && t - P.trail[0].t > BEAT) P.trail.shift();
      // the end: the song finishes with him alive -> the door
      if (t >= END - 0.2 || ctx.ended()) { P.won = true; SFX.win(); ctx.win(level); }
    },
    draw(dt) {
      const t = ctx.now(), cx = camX(t), b = beatOf(t), vw = ctx.viewW();
      cam.position.x = cx + vw / 2; cam.lookAt(cam.position.x, ctx.CAM_Y, 0);
      const ex = edgeX(t); edge.position.x = ex - 30; edgeLine.position.x = ex;
      bg.update(cx, t);
      for (const s of movers) { const on = live(s, t), y = moverY(s, t), dx = moverX(s, t);
        s.mesh.position.set((s.x0 + s.x1) / 2 + dx, y - 0.15, 0);
        s.mesh.visible = s.kind !== 'drop' || y < 30;
        const face = s.mesh.userData.face; face.material.transparent = true;
        face.material.opacity = s.kind === 'fake' ? (t < L.reveal || P.power === 'detective' ? 0.25 : 1) : s.kind === 'hidden' ? (on ? 1 : 0.08) : on ? 1 : 0.22;
        s.mesh.children.forEach(c => { if (c !== face && c.material) { c.material.transparent = true; c.material.opacity = face.material.opacity; } }); }
      for (const g2 of gates) { g2.mesh.visible = g2.open <= 0; g2.cap.position.y = 2.6 + 0.1 * Math.sin(t * 4); }
      for (const s of spams) { const fr = t < s.frozenUntil, x = fr ? s.fx : spamX(s, t); s.mesh.position.set(x, s.y + 0.42, 0.25);
        const pose = fr ? 'spam-rejected' : Math.floor(b * 2) % 2 ? 'spam-hop-forward' : 'spam-promo-strut';
        if (s.mesh.userData.pose !== pose) { s.mesh.userData.setPose(S(pose)); s.mesh.userData.pose = pose; } s.mesh.rotation.z = fr ? 0 : 0.06 * Math.sin(t * 9); }
      for (const p of packets) { p.mesh.rotation.y = t * 2.2; p.mesh.position.y = 0.8 + 0.08 * Math.sin(t * 3); }
      for (const f of falls) { const k = (t - tOf(f.e - 1.5)) / (1.5 * BEAT); f.mesh.visible = k > -0.3 && k < 1.6; f.mesh.position.set(f.x, 7 * (1 - Math.min(1, Math.max(0, k))) + 0.3, 0.2); }
      for (const bm of beams) { const k = b - bm.e; bm.mesh.visible = k >= -1 && k < bm.beats && t > L.overrideUntil;
        bm.mesh.position.set(beamX(bm, t), 3, 1.5); bm.mesh.material.opacity = k < 0 ? 0.25 : 0.8; }
      for (const ec of echoes) { const k = b - ec.e, q = P.trail[0]; ec.mesh.visible = k >= 0 && k < ec.beats && !!q; if (q) ec.mesh.position.set(echoX(q, t), q.y + 0.5, 0.4); }
      if (ring.visible) { const k = (t - ring.userData.t) / 0.6; ring.position.set(P.x, P.y + 0.5, 2); ring.scale.setScalar(1 + k * 6); ring.material.opacity = 1 - k; if (k > 1) ring.visible = false; }
      for (const g of L.girders) if (t >= g.until && g.mesh.parent) g.mesh.parent.remove(g.mesh);
      bar.visible = !!P.dl; if (P.dl) { const k = P.dl.progress / (2 * BEAT); bar.scale.x = Math.max(0.01, k); bar.position.set(P.x - 0.5 + k / 2, P.y + 1.45, 2.5); }
      // darkness (No Answer; lights going out): his lamp / light radius
      const dk = def.dark ? def.dark(b) : 0; dark.material.uniforms.k.value = dk; dark.position.x = cx + vw / 2;
      dark.material.uniforms.c.value.set(P.x + 1.2, P.y + 0.6); dark.material.uniforms.r.value = t < L.lampUntil ? 9 : (P.power === 'diver' ? 3.6 : 2.4);
      // Potato
      const sp = ctx.spud;
      sp.place(P.x, P.y); sp.turnTo(P.face > 0 ? 0.95 : -0.95); sp.duck(P.duck); sp.waddle(P.ground && (Math.abs(P.vx - SPEED) > 0.3 || P.vx > 0.5));
      if (P.arrive > 0) P.arrive -= dt;
      ctx.glitch(P.dying ? Math.min(1, 0.4 + (1.15 - P.dying)) : P.arrive > 0 ? Math.min(1, P.arrive / 1.2) : P.phase > 0 ? (P.messy ? 0.95 : 0.7) : P.inv > 0 ? (Math.floor(t * 12) % 2 ? 0.45 : 0) : 0);
      ctx.hud({ section: sections[sectionAt(b)][0], left: Math.max(0, END - t), charge: P.charge, progress: Math.min(1, t / END) });
    },
    ring, die, hurt, givePower,
    freezeInView(t, beats = 8) { let n = 0; for (const s of spams) { const x = spamX(s, t); if (x > camX(t) - 1 && x < camX(t) + ctx.viewW() + 1 && t >= s.frozenUntil) { s.frozenUntil = t + beats * BEAT; s.fx = x; n++; } } return n; },
    addGirder(t) { const x = Math.round(P.x + 0.8 * P.face); L.girders.push({ x0: Math.min(x, x + 3 * P.face), x1: Math.max(x, x + 3 * P.face), y0: -0.3, y1: 0, kind: 'girder', until: t + 8 * BEAT,
      mesh: block(world, Math.min(x, x + 3 * P.face), Math.max(x, x + 3 * P.face), -0.3, 0, 'speaker', theme) }); },
  };
  return level;
}
