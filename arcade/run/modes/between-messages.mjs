// modes/between-messages.mjs — Level 5 as a LIGHT game: ON / OUT ("I clock in when you type and I vanish when you don't").
// Potato runs on the song's clock (x = X(t), like the runner). Two buttons:
//   ↑ jump (a hop is one beat, the runner's hop).
//   Space (or ↓ / the left third of a phone) flips him:
//     ON  — lit, solid, the 3D Potato: stands on the lit screens (L); the lit things in his way hit him.
//     OUT — his shadow (the skeptical eyes still in it): stands on the shadows (S); passes straight through light.
//   A dusk stretch (where the screen dims into its shadow) holds both: that's where you flip, on the word.
// The gold lie ("what's dope") is solid to both: only the Noir Detective's fact check (V, on "truth") breaks it.
// After the final flip ("…yeah. gone.") Space can't bring him back: a flicker of him, and no.
// Everything is authored in the level (def.bm, in song time); this file is the rules (pure, 120 Hz, the bot runs it)
// and the look (modeView: three.js meshes). Purple is only ever his own glitch (the engine's tears when he flips).
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const K = { HOP: 1.35, FOOT: 0.28, BOX: 0.34, COY: 0.07, BUF: 0.1, FLIPCD: 0.08, PH: 1.25, DIE_Y: -3 };

// ---------- the course, prepared once ----------
const PREP = new WeakMap();
export function prep(C) {
  if (PREP.has(C)) return PREP.get(C);
  const B = C.def.bm;
  const tiles = B.tiles.map((q, i) => ({ ...q, i, x0: C.X(q.t0), x1: C.X(q.t1), h: q.h ?? (q.y > 0 ? 0.55 : 4) })).sort((a, b) => a.x0 - b.x0);
  // the dusk stretches (where a lit screen and a shadow overlap at floor level): drawn as the screen dimming into its shadow
  const dusk = [];
  for (const f of B.flips) { const x0 = C.X(f.t - f.a), x1 = C.X(f.t + f.a); dusk.push({ x0, x1, to: f.to, t: f.t, auto: !!f.auto, final: f.tag === 'final' }); }
  const haz = C.hazards.filter(h => h.kind === 'word').sort((a, b) => a.x0 - b.x0);
  const P = { B, tiles, dusk, haz, maxW: Math.max(...tiles.map(q => q.x1 - q.x0)) };
  PREP.set(C, P); return P;
}
// tiles whose x-range overlaps [a, b]
function near(P, a, b) { const out = []; for (const q of P.tiles) { if (q.x0 > b) break; if (q.x1 >= a) out.push(q); } return out; }
const kindOf = lit => lit ? 'L' : 'S';

export const mode = {
  init(s, api) {
    const C = api.C, P = prep(C), t = s.t;
    const lit = t >= P.B.auto.t ? P.B.litAt(Math.max(t, 0.01)) : false;   // a practice flag: start in the state the song is in
    Object.assign(s, { lit, gone: !lit, y: 0, vy: 0, ground: true, leftAt: -9, flipT: -9, jumpT: -9, buf: -9, final: t >= P.B.final + 0.3, gotPk: false, x: C.X(t), dx: 0,
      flips: 0, stairTop: -1, used: s.used || {} });
    if (t >= P.B.final + 0.3) s.lit = false, s.gone = true;
    const pk = C.packets[0]; if (pk && t > pk.t + 0.2) { pk.got = true; s.gotPk = true; if (t < P.B.truth) s.power = pk.power; else s.used[pk.power] = P.B.truth; }   // (a flag after the download / after the truth)
  },
  step(s, inp, t, api) {
    const C = api.C, P = prep(C), B = P.B, DT = api.DT, CP = C.P;
    const G = 8 * K.HOP / (CP * CP), JUMP = 4 * K.HOP / CP;
    const die = why => { if (C.def.blank) { api.die(why); return; } if (!s.dead) { s.why = why; api.die(why); s.dead = true; } };   // (?blank: nothing ends the song — run/blank.mjs)
    const x = C.X(t); s.x = x; s.dx = 0;
    s.blink = Math.max(0, (s.blink || 0) - DT);
    // ---- the end: the music drops out, nothing to press ----
    if (t >= B.cut0 && !C.def.blank) { s.cutscene = 'float';   /* (?blank: no end cutscene, he runs to the last note) */ if (!s.ground) { s.vy -= G * DT; s.y = Math.max(0, s.y + s.vy * DT); if (s.y <= 0) { s.y = 0; s.ground = true; s.vy = 0; } } return; }
    s.cutscene = false;
    // ---- "Yeah.": the screen lights under him on its own ----
    if (!s.lit && s.t < B.auto.t && t >= B.auto.t && !s.final) setLit(s, true, t, 'born');
    // ---- input ----
    if ((inp.G || inp.D) && t - s.flipT > K.FLIPCD) {
      if (s.final) { s.refusedAt = t; s.blink = 0.12; s.blinkFrom = { x: s.x, y: s.y }; }   // gone is gone: he flickers, and doesn't come back
      else { setLit(s, !s.lit, t, null); const f = B.flips.find(f => f.tag === 'final'); if (!s.lit && f && t >= f.t - f.a - 0.3) s.final = true; }
    }
    if (inp.V && s.power) { const pw = s.power; s.used[pw] = t; s.usedWhat = pw; s.usedPower = t; s.power = null; }
    let jumped = false;
    const coyote = !s.ground && s.vy <= 0 && t - s.leftAt <= K.COY && s.jumpT < s.leftAt;
    if (inp.J) { if (s.ground || coyote) jumped = true; else s.buf = t; }
    else if (s.ground && t - s.buf <= K.BUF) jumped = true;                                   // pressed just before he landed: jump on landing
    if (jumped) { s.vy = JUMP; s.ground = false; s.jumpT = t; s.jumpedAt = t; s.buf = -9; s.leftAt = t;
      const bb = C.beatOf(t); s.streak = Math.abs(bb - Math.round(bb)) * CP < 0.1 ? 1 : 0; if (s.streak) s.beatJumps = (s.beatJumps || 0) + 1; }
    // ---- move ----
    const prevY = s.y, mine = kindOf(s.lit);
    const sup = near(P, x - K.FOOT, x + K.FOOT).filter(q => q.k === mine && q.x0 < x + K.FOOT && q.x1 > x - K.FOOT);
    if (s.ground) {
      const on = sup.find(q => Math.abs(q.y - s.y) < 0.02);
      if (!on) { s.ground = false; s.leftAt = t; s.vy = 0; }
    }
    if (!s.ground) {
      const hold = s.vy === 0 && t - s.leftAt <= K.COY && s.jumpT < s.leftAt;              // coyote: a hair of grace at the edge
      if (!hold) { s.vy -= G * DT; s.y += s.vy * DT; }
      if (s.vy <= 0) { const land = sup.filter(q => q.y <= prevY + 1e-6 && q.y >= s.y - 1e-6).sort((a, b) => b.y - a.y)[0];
        if (land) { s.vyIn = s.vy; s.y = land.y; s.vy = 0; s.ground = true; s.landedAt = t; if (land.step != null) s.stairTop = Math.max(s.stairTop, land.step); } }
    }
    s.vyIn = s.ground ? s.vyIn : s.vy;
    // ---- the front of a raised step (his messages): run into it and he's stopped ----
    for (const q of near(P, x - K.BOX, x + K.BOX)) if (q.k === mine && q.y > 0.01 && q.x0 < x + K.BOX && q.x1 > x - K.BOX && s.y < q.y - 0.12 && s.y + K.PH > q.y - q.h) { if (C.def.blank) { s.blankBumps = (s.blankBumps || 0) + 1; break; } return die('hit his own message'); }
    // ---- the lit things in his way: ON hits them, OUT goes through. The gold lie stops both. ----
    for (const h of P.haz) {
      if (h.x0 > x + 2) break; if (h.x1 < x - 2) continue;
      if (h.wk === 'armor') { const setOff = s.used[h.needs];
        if (!(api.answered(h, t) && setOff != null && setOff <= h.t - CP) && x + K.BOX > h.x0 && x - K.BOX < h.x1) return die(`needed the truth on “${h.text}”`); continue; }
      if (!s.lit) continue;
      const r = h.hb || h; if (r.x0 < x + K.BOX && r.x1 > x - K.BOX && r.y0 < s.y + K.PH && r.y1 > s.y) return die(h.wk === 'wall' ? 'ran into the light' : `tripped on “${h.text}”`);
    }
    // ---- the download (the Noir Detective) ----
    for (const p of C.packets) if (!p.got && Math.abs(p.x - x) < 0.9 && p.y > s.y - 1.4 && p.y < s.y + K.PH + 1.4) { p.got = true; s.power = p.power; s.gotPower = t; s.gotPk = true; }
    // ---- fell ----
    if (s.y < K.DIE_Y) { const any = near(P, x - 0.5, x + 0.5).some(q => q.y === 0 && q.x0 < x + 0.2 && q.x1 > x - 0.2);
      if (C.def.blank) { api.die('fell'); s.blankFalls = (s.blankFalls || 0) + 1; s.y = 0.6; s.vy = JUMP * 0.6; s.ground = false; return; }   // (?blank: thrown back up — counted)
      return die(!any ? 'fell into the gap' : s.lit ? 'fell through the dark' : 'fell through the light'); }
  },
};
function setLit(s, lit, t, tag) {
  s.lit = lit; s.gone = !lit; s.flipT = t; s.flips = (s.flips || 0) + 1; s.blink = 0.22; s.blinkFrom = { x: s.x, y: s.y + 0.1 };
  if (lit) { s.orbAt = t; s.litAt = t; } else { s.goneAt = t; s.outAt = t; }     // main.mjs: ON = a bright chime + a smirk; OUT = he glitches out
  if (tag === 'born') s.reborn = t;
}

// ---------- the look ----------
export const modeView = ({ T, world, C, cam, base }) => {
  const P = prep(C), B = P.B;
  const WARM = '#ffcf8a', GLASS = '#fff4e2', RIM = '#8fa6e6', INK = '#03040a';
  const geo = new T.PlaneGeometry(1, 1);
  const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const tx = new T.CanvasTexture(c); tx.colorSpace = T.NoColorSpace; return tx; };
  const basic = (o) => new T.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
  const add = (o) => new T.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, ...o });
  // a lit phone screen, side on: glass on top, a warm glow in it, a bezel line, a thread of wordless message bars
  const screenTex = cv(256, 48, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fffaf0'); g.addColorStop(0.18, '#ffe7c2'); g.addColorStop(1, '#c98a3e');
    x.fillStyle = g; x.beginPath(); x.roundRect(2, 1, w - 4, h - 2, 10); x.fill(); x.strokeStyle = '#2a1a08'; x.lineWidth = 3; x.stroke();
    x.fillStyle = 'rgba(120,70,20,.35)'; x.fillRect(14, 16, w * 0.32, 5); x.fillRect(w * 0.55, 26, w * 0.3, 5); x.fillRect(14, 34, w * 0.18, 4); });
  const stepTex = cv(256, 72, (x, w, h) => { x.shadowColor = 'rgba(255,200,120,.9)'; x.shadowBlur = 14; x.fillStyle = '#ffd6a0'; x.beginPath(); x.roundRect(8, 6, w - 16, h - 20, 20); x.fill(); x.shadowBlur = 0;
    x.beginPath(); x.moveTo(w - 40, h - 15); x.lineTo(w - 24, h - 2); x.lineTo(w - 56, h - 15); x.fill(); x.strokeStyle = '#3a1d00'; x.lineWidth = 3; x.beginPath(); x.roundRect(8, 6, w - 16, h - 20, 20); x.stroke();
    x.fillStyle = 'rgba(58,29,0,.55)'; x.fillRect(26, 22, w * 0.5, 6); x.fillRect(26, 34, w * 0.3, 6); });
  const glowTex = cv(64, 128, (x, w, h) => { const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(255,214,160,0.55)'); g.addColorStop(0.35, 'rgba(255,214,160,0.16)'); g.addColorStop(1, 'rgba(255,214,160,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'destination-in'; const s2 = x.createLinearGradient(0, 0, w, 0); s2.addColorStop(0, 'rgba(0,0,0,0)'); s2.addColorStop(0.3, '#000'); s2.addColorStop(0.7, '#000'); s2.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = s2; x.fillRect(0, 0, w, h); });
  const shadeTex = cv(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b0f20'); g.addColorStop(0.08, '#05070f'); g.addColorStop(1, '#010102'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(120,140,200,.08)'; x.lineWidth = 2; for (let i = -h; i < w + h; i += 14) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h * 0.5, h); x.stroke(); } });
  shadeTex.wrapS = T.RepeatWrapping;
  const duskTex = cv(128, 8, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(3,4,10,0)'); g.addColorStop(1, 'rgba(3,4,10,0.9)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  // his shadow: the silhouette of him, ink, a cold rim, and his skeptical eyes still in it (Vega's canon face)
  const shTex = [], shCv = [];
  for (const hat of [false, true]) { const c = document.createElement('canvas'); c.width = 256; c.height = 300; shCv.push(c); const tx = new T.CanvasTexture(c); tx.colorSpace = T.NoColorSpace; shTex.push(tx); }
  function drawShadow(x, hat, eyes) {
    const w = 256, h = 300; x.clearRect(0, 0, w, h);
    const body = () => { x.beginPath(); const cx = 128, cy = 178, R = 104; for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, r = R * (1 + 0.05 * Math.sin(a * 3 + 0.6) + 0.03 * Math.sin(a * 5 + 1.3)), sy = a > Math.PI ? 1.06 : 1.0;
      const px = cx + Math.cos(a) * r * 0.98, py = cy + Math.sin(a) * r * sy; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); };
    x.save(); x.shadowColor = 'rgba(143,166,230,0.9)'; x.shadowBlur = 16; body(); x.fillStyle = '#05060d'; x.fill(); x.restore();
    body(); x.lineWidth = 4; x.strokeStyle = 'rgba(143,166,230,0.75)'; x.stroke();
    x.fillStyle = '#05060d'; for (const fx of [96, 160]) { x.beginPath(); x.ellipse(fx, 284, 20, 12, 0, 0, 7); x.fill(); }   // his foot nubs
    if (hat) { x.fillStyle = '#05060d'; x.strokeStyle = 'rgba(143,166,230,0.75)'; x.lineWidth = 3;   // the fedora (Noir Detective): he keeps the coat
      x.beginPath(); x.ellipse(128, 86, 98, 16, -0.06, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.moveTo(62, 84); x.quadraticCurveTo(66, 26, 128, 22); x.quadraticCurveTo(190, 26, 192, 80); x.closePath(); x.fill(); x.stroke(); }
    if (eyes) { x.save(); x.globalAlpha = 0.55; x.globalCompositeOperation = 'lighter'; x.drawImage(eyes, 398, 125, 328, 219, 44, 112, 190, 127); x.restore(); }
  }
  const eyes = new Image(); eyes.onload = () => { shCv.forEach((c, i) => { drawShadow(c.getContext('2d'), i === 1, eyes); shTex[i].needsUpdate = true; }); }; eyes.src = (base || '../play/') + 'face-canon.png';
  shCv.forEach((c, i) => { drawShadow(c.getContext('2d'), i === 1, null); shTex[i].needsUpdate = true; });
  const shadow = new T.Mesh(geo, basic({ map: shTex[0] })); shadow.renderOrder = 9; world.add(shadow);
  const ghostLit = new T.Mesh(new T.CircleGeometry(0.62, 32), add({ color: WARM, opacity: 0 })); ghostLit.scale.set(1, 1.15, 1); ghostLit.renderOrder = 9; world.add(ghostLit);   // the flicker when he can't come back
  const born = new T.Mesh(new T.RingGeometry(0.9, 1.0, 48), add({ color: '#fff4e2', opacity: 0 })); born.renderOrder = 9; world.add(born);
  // pools of meshes for the tiles on screen
  const live = new Map();
  function use(key, make) { let m = live.get(key); if (!m) { m = make(); world.add(m); live.set(key, m); } m.userData.seen = true; return m; }
  let lastBeat = -1, kick = 0;
  return {
    draw(f) {
      const { s, t } = f, b = C.beatOf(t), cx = f.cx, span = f.span;
      if (Math.floor(b) !== lastBeat) { lastBeat = Math.floor(b); kick = 1; } kick *= 0.9;
      for (const m of live.values()) m.userData.seen = false;
      const a0 = cx - span * 0.62, a1 = cx + span * 0.62;
      const end = t >= B.cut0 && !C.def.blank ? clamp((t - B.cut0) / 3) : 0;   // (?blank: no end cutscene — the screens stay)                      // the music drops out: the screens go out, left to right
      for (const q of P.tiles) {
        if (q.x0 > a1) break; if (q.x1 < a0) continue;
        const L = q.x1 - q.x0, mid = (q.x0 + q.x1) / 2;
        if (q.k === 'S') {
          const m = use('s' + q.i, () => new T.Mesh(geo, basic({ map: shadeTex.clone() }))); m.material.map.repeat.set(L / 2, 1); m.material.map.needsUpdate = true;
          m.position.set(mid, q.y - q.h / 2, -0.1); m.scale.set(L, q.h, 1); m.renderOrder = 2;
          const r = use('r' + q.i, () => new T.Mesh(geo, basic({ color: RIM }))); r.position.set(mid, q.y - 0.02, 0.05); r.scale.set(L, 0.05, 1); r.renderOrder = 3;
          r.material.opacity = (0.55 + 0.3 * kick) * (1 - end * 0.6);
        } else if (q.msg) {                                                         // his messages, stacked into stairs
          const m = use('m' + q.i, () => new T.Mesh(geo, basic({ map: stepTex }))); m.position.set(mid, q.y - 0.3, 0.08); m.scale.set(L + 0.2, 0.62, 1); m.renderOrder = 4;
          const up = s.stairTop >= q.step ? 1 : 0.75; m.material.opacity = up;
        } else {
          const out = end > 0 ? clamp((t - B.cut0 - (q.x0 - a0) / span * 2.2) / 0.3) : 0;   // gone out
          const lit = (1 - out) * (t < B.auto.t ? 0.12 : t < B.auto.t + 0.25 ? 0.12 + 0.88 * ease((t - B.auto.t) / 0.25) : 1);   // the screens are off until someone types (\u201cYeah.\u201d)
          const n = Math.max(1, Math.round(L / 2.4)), pw = L / n;                     // a run of phones laid end to end
          for (let k = 0; k < n; k++) { if (q.x0 + pw * (k + 1) < a0 || q.x0 + pw * k > a1) continue; const m = use('l' + q.i + '.' + k, () => new T.Mesh(geo, basic({ map: screenTex }))); m.position.set(q.x0 + pw * (k + 0.5), q.y - 0.22, 0.02); m.scale.set(pw - 0.06, 0.44, 1); m.renderOrder = 4;
            m.material.opacity = 0.15 + 0.85 * lit; }
          for (let k = 0; k < n; k++) { if (q.x0 + pw * (k + 1) < a0 || q.x0 + pw * k > a1) continue;   // each phone's light spills up off it (soft-edged)
            const g = use('g' + q.i + '.' + k, () => new T.Mesh(geo, add({ map: glowTex }))); g.position.set(q.x0 + pw * (k + 0.5), q.y + 0.75, -0.2); g.scale.set(pw * 1.25, 1.5, 1); g.renderOrder = 1;
            g.material.opacity = (0.5 + 0.35 * kick) * lit * (q.hole ? 1.3 : 1); }
        }
      }
      // the dusk stretches: the screen dims into its shadow (and a bright seam marks where the flip goes)
      for (const d of P.dusk) {
        if (d.x0 > a1 || d.x1 < a0 || d.auto) continue;
        const L = d.x1 - d.x0, m = use('d' + d.t, () => new T.Mesh(geo, basic({ map: duskTex, side: T.DoubleSide }))); m.position.set((d.x0 + d.x1) / 2, -0.22, 0.06); m.scale.set(d.to === 'out' ? L : -L, 0.46, 1); m.renderOrder = 5;
        const sm = use('ds' + d.t, () => new T.Mesh(geo, add({ color: d.to === 'out' ? RIM : '#fff4e2' }))); sm.position.set((d.x0 + d.x1) / 2, 0.02, 0.07); sm.scale.set(L, 0.06, 1); sm.renderOrder = 6;
        sm.material.opacity = 0.35 + 0.45 * Math.abs(Math.sin(t * 6));
      }
      for (const [k, m] of live) if (!m.userData.seen) { world.remove(m); if (m.material.map && k[0] === 's') m.material.map.dispose(); m.material.dispose(); live.delete(k); }
      // ---- his shadow (OUT) ----
      const showSh = !s.lit && !s.dead;
      shadow.visible = showSh;
      if (showSh) {
        const hat = s.used && s.used.detective != null && t >= s.used.detective; shadow.material.map = shTex[hat ? 1 : 0];
        const air = !s.ground && s.jumpT != null ? clamp((t - s.jumpT) / C.P) : 0, roll = !s.ground ? -air * Math.PI * 2 : 0;
        const k0 = s.outAt != null ? ease((t - s.outAt) / 0.14) : 1, sq = 1 - 0.06 * kick * (s.ground ? 1 : 0);
        const fadeEnd = t > 188.2 && !C.def.blank ? clamp(1 - (t - 188.2) / 2.4) : 1;   // (?blank: he doesn't fade out at the end)
        shadow.position.set(s.x, s.y + 0.7 * sq, 0.6); shadow.scale.set(1.3 * (0.6 + 0.4 * k0) / sq, 1.52 * sq * (0.6 + 0.4 * k0), 1); shadow.rotation.z = roll;
        shadow.material.opacity = Math.min(1, k0 * 1.2) * fadeEnd;
      }
      // he tries to come back after "gone.": a warm flicker of him, and nothing
      const ra = s.refusedAt != null ? t - s.refusedAt : 9; ghostLit.visible = ra < 0.3; if (ghostLit.visible) { ghostLit.position.set(s.x, s.y + 0.7, 0.55); ghostLit.material.opacity = 0.35 * (1 - ra / 0.3) * (Math.floor(ra * 40) % 2); }
      // born: a ring of light out of him when the screen wakes him
      const ba = s.litAt != null ? t - s.litAt : 9; born.visible = s.lit && ba < 0.5; if (born.visible) { born.position.set(s.x, s.y + 0.7, 0.5); born.scale.setScalar(0.7 + ba * 3.2); born.material.opacity = 0.7 * (1 - ba / 0.5); }
    },
    over() {},
  };
};
