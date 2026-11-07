// outfits3d.mjs — clothes for the 3D Potato, ported from the code-drawn 2D outfits (draw/potato-draw.js).
// Each outfit returns { canvas, puff(t, th), parts, update }:
//   canvas  — paint in his skin's layout: across = round him (th -pi..pi, 0 = his front), down = height from his top (t 0..1)
//   puff    — how far it pushes his surface out there (his ink + white shells follow, so it gets real sticker edges)
//   parts   — solid 3D pieces (hat brims, the crown, the chef's puff) that ride his deformed head every frame
// The 2D versions used cos(th) terms to fake "a ring seen from above"; in 3D that's real, so those terms are gone.
export const TW = 2048, TH = 1024, RM = 0.42, ARC = 2 * Math.PI * RM;  // paint in arc units (RM = a typical radius) so lines aren't stretched
export const W = 1.046;                // the 2D outfits measure in body widths; his width / height (Vega's front view)
export const INKU = 0.026;                    // ink width in body heights (2D: ink = 2.6% of his height)
export const INK = '#120a05', clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
export const fu = (th, w) => { const f = th / w; return Math.abs(f) < 1 ? Math.sqrt(1 - f * f) : 0; };   // a U-dip at his front

export function painter() {
  const c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const x = c.getContext('2d'); x.setTransform(TW / ARC, 0, 0, TH, TW / 2, 0); x.lineJoin = 'round'; x.lineCap = 'round';
  const N = 256, A = th => th * RM;
  const P = { c, x,
    // everything is drawn three times, shifted a full turn, so shapes crossing his back seam wrap round
    wrap(fn) { for (const o of [-ARC, 0, ARC]) { x.save(); x.translate(o, 0); fn(); x.restore(); } },
    line(f, a0 = -Math.PI, a1 = Math.PI) { x.beginPath(); for (let i = 0; i <= N; i++) { const th = lerp(a0, a1, i / N); x[i ? 'lineTo' : 'moveTo'](A(th), f(th)); } },
    below(f) { P.line(f); x.lineTo(A(Math.PI), 1.05); x.lineTo(A(-Math.PI), 1.05); x.closePath(); },
    above(f) { P.line(f); x.lineTo(A(Math.PI), -0.05); x.lineTo(A(-Math.PI), -0.05); x.closePath(); },
    band(top, bot, a0 = -Math.PI, a1 = Math.PI) { P.line(top, a0, a1); for (let i = N; i >= 0; i--) { const th = lerp(a0, a1, i / N); x.lineTo(A(th), bot(th)); } x.closePath(); },
    strip(a, w, top, bot) { P.band(top, bot, a - w, a + w); },
    dot(a, v, r, fill, rx) { const R = r * W, k = RM / (rx || 0.45); x.beginPath(); x.ellipse(A(a), v, R * k, R, 0, 0, 7);
      x.fillStyle = fill; x.fill(); x.lineWidth = INKU * 0.45; x.strokeStyle = INK; x.stroke(); },
    fill(col) { x.fillStyle = col; x.fill(); },
    ink(k = 1) { x.lineWidth = INKU * k; x.strokeStyle = INK; x.stroke(); },
    // a soft shadow a neckline casts on him (painted on the cloth layer just above the cloth)
    shadow(f) { P.wrap(() => { x.save(); x.filter = `blur(${TH * 0.008}px)`; P.line(th => f(th) - 0.012); x.lineWidth = 0.024; x.strokeStyle = 'rgba(28,13,6,0.32)'; x.stroke(); x.restore(); }); },
    // fill a region and paint on it (clipped), then ink its top edge
    region(path, col, deco) { P.wrap(() => { path(); x.save(); P.fill(col); x.clip(); deco && deco(); x.restore(); }); },
    // ermine: white with little black tails in rows
    ermine(top, bot, rows) { P.wrap(() => { P.band(top, bot); P.fill('#fbf8f2'); x.save(); x.clip();
      for (let i = 0; i < 52; i++) { const a = -Math.PI + i / 52 * 2 * Math.PI; for (const r of rows) { const v = r(a) + (i % 2 ? 0.02 : 0);
        x.beginPath(); x.ellipse(A(a), v, 0.009, 0.017, 0, 0, 7); x.fillStyle = INK; x.fill(); } }
      x.restore(); }); }
  };
  return P;
}

// a ring of 3D points round his head at height t, pushed out by `out(th)` (height units), lifted by `up(th)`
export function ringPts(H, t, out, up = () => 0) {
  const { pts, c } = H.ring(t), r = [];
  for (let i = 0; i <= H.COLS; i++) { const th = i / H.COLS * 2 * Math.PI - Math.PI, p = pts[i], dx = p.x - c.x, dz = p.z - c.z, L = Math.hypot(dx, dz) || 1, o = out(th);
    r.push(new H.T.Vector3(p.x + dx / L * o, p.y + up(th), p.z + dz / L * o)); }
  return { r, c };
}
// a solid band from a list of rings (each COLS+1 points), closed round, quads between consecutive rings + back to the first
export function loftGeo(H, n) {
  const T = H.T, C = H.COLS + 1, g = new T.BufferGeometry(), pos = new T.BufferAttribute(new Float32Array(n * C * 3), 3), idx = [];
  pos.setUsage(T.DynamicDrawUsage); g.setAttribute('position', pos);
  for (let r = 0; r < n; r++) { const r2 = (r + 1) % n; for (let i = 0; i < H.COLS; i++) { const a = r * C + i, b = r * C + i + 1, c = r2 * C + i, d = r2 * C + i + 1; idx.push(a, c, b, b, c, d); } }
  g.setIndex(idx);
  g.set = rings => { let k = 0; for (const ring of rings) for (const p of ring) { pos.array[k++] = p.x; pos.array[k++] = p.y; pos.array[k++] = p.z; } pos.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); };
  return g;
}

// ============ CONSTRUCTION CREW: hi-vis vest + hard hat ============
export function constructionCrew(H) {
  const P = painter(), { x } = P;
  const neck = th => 0.6 + 0.175 * fu(th, 0.72), s1 = () => 0.8, s2 = () => 0.85, HAT = 0.27;
  const ORANGE = '#f47a1e', SILVER = '#c9ced3', SHINE = '#f1f4f6', YELLOW = '#f7c51e';
  P.shadow(neck);
  P.region(() => P.below(neck), ORANGE, () => {
    for (const a of [-0.95, 0.95, Math.PI - 0.6, -Math.PI + 0.6]) { P.strip(a, 0.13, neck, s1); P.fill(SILVER); P.ink(0.5); }   // straps
    P.band(s1, s2); P.fill(SILVER); P.ink(0.5);
    P.band(s1, () => 0.812); P.fill(SHINE);
    P.line(() => 0, -0.001, 0.001); x.beginPath(); x.moveTo(0, neck(0)); x.lineTo(0, 0.97); P.ink(0.6);                     // zip
  });
  P.wrap(() => { P.line(neck); P.ink(1); });
  // the hard hat's shell: his head above HAT, pushed out, yellow, a ridge front-to-back over the top
  P.region(() => { x.beginPath(); x.rect(-ARC / 2, -0.05, ARC, HAT + 0.05); }, YELLOW, () => {
    for (const a of [-0.13, 0.13, Math.PI - 0.13, -Math.PI + 0.13]) { x.beginPath(); x.moveTo(a * RM, HAT); x.lineTo(a * RM, 0); P.ink(0.55); }
  });
  // the rim: a solid ring at HAT, a narrow lip round the back, the peak sticking out over his face
  const out = th => (0.045 + 0.13 * Math.pow(Math.max(0, Math.cos(th)), 3)) * W;
  const brim = loftGeo(H, 4), part = H.outlined(brim, H.paint(YELLOW));
  return { canvas: P.c, parts: [part],
    puff: (t, th) => t < HAT + 0.01 ? 0.042 : t >= neck(th) ? 0.014 : 0,
    update() { const sh = 0.042, d = 0.022;
      const a = ringPts(H, HAT, () => sh), b = ringPts(H, HAT, th => sh + out(th)), c = ringPts(H, HAT, th => sh + out(th), () => -d), e = ringPts(H, HAT, () => sh, () => -d);
      brim.set([a.r, b.r, c.r, e.r]); } };
}

// ============ KITCHEN CHEF: double-breasted coat + toque ============
export function kitchenChef(H) {
  const P = painter(), { x } = P, T = H.T;
  const neck = th => 0.6 + 0.07 * fu(th, 0.5), kerch = th => neck(th) + 0.045;
  const WHITE = '#f7f4ec', RED = '#d63a2c';
  P.shadow(neck);
  P.region(() => P.below(neck), WHITE, () => {
    P.band(neck, kerch); P.fill(RED); P.ink(0.55);                                       // neckerchief
    x.beginPath(); x.moveTo(0.16 * RM, kerch(0.16)); x.lineTo(0.16 * RM, 1.0); P.ink(0.6);  // the double-breasted overlap
    for (const v of [0.76, 0.84, 0.92]) for (const a of [-0.22, 0.42]) P.dot(a, v, 0.022, '#e9e2d2');
    x.beginPath(); x.moveTo(-0.91 * RM, 0.74); x.lineTo(-0.59 * RM, 0.74); P.ink(0.6);       // chest pocket
    // the knot and two tails at his front
    const kv = kerch(0) + 0.01; for (const d of [-1, 1]) { x.beginPath(); x.moveTo(0, kv); x.lineTo(d * 0.055, kv + 0.075); x.lineTo(d * 0.012, kv + 0.088); x.closePath(); P.fill(RED); P.ink(0.6); }
    x.beginPath(); x.ellipse(0, kv, 0.028, 0.024, 0, 0, 7); P.fill(RED); P.ink(0.6);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });
  // the toque's band: his head between 0.08 and 0.25, flaring out toward the top, soft pleats
  const vt = 0.08, vb = 0.25;
  P.region(() => { x.beginPath(); x.rect(-ARC / 2, -0.05, ARC, vb + 0.05); }, '#fbf9f3', () => {
    for (let i = 0; i < 16; i++) { const a = -Math.PI + i / 16 * 2 * Math.PI; x.beginPath(); x.moveTo(a * RM, vt); x.lineTo(a * RM, vb); x.lineWidth = INKU * 0.35; x.strokeStyle = 'rgba(18,10,5,0.4)'; x.stroke(); }
  });
  P.wrap(() => { P.line(() => vb); P.ink(1); });
  // the puff: a cloud of soft lobes on top, riding his head
  const WH = H.paint('#fbf9f3'), sph = new T.SphereGeometry(1, 28, 18);
  const lobes = [], group = new T.Group();
  for (let i = 0; i < 7; i++) { const g = H.outlined(sph, WH); group.add(g); lobes.push(g); }
  const rTop = H.rx(0.22) + 0.035 * W;
  return { canvas: P.c, parts: [group],
    puff: (t, th) => t < vb + 0.01 ? 0.035 * W + 0.03 * clamp((vb - t) / (vb - vt)) : t >= neck(th) ? 0.014 : 0,
    update() { const { c } = H.ring(vt), y = c.y, R = rTop * 1.18;
      // a tall soft cloud: a ring of lobes bulging out over the band, a big crown lobe on top
      lobes.forEach((g, i) => { if (i === 6) { g.position.set(c.x, y + 0.24, c.z); g.scale.set(R * 0.9, 0.17, R * 0.8); return; }
        const a = i / 6 * Math.PI * 2 + 0.3; g.position.set(c.x + Math.sin(a) * R * 0.55, y + 0.12, c.z + Math.cos(a) * R * 0.5); g.scale.set(0.2 * W, 0.15, 0.18 * W); }); } };
}

// ============ ROYAL KING: red velvet robe with an ermine cape + crown ============
export function royalKing(H) {
  const P = painter(), { x } = P, T = H.T;
  const neck = th => 0.6 + 0.2 * fu(th, 0.75), collar = th => neck(th) + 0.1 - 0.04 * fu(th, 0.75), hem = () => 0.885;
  const gap = v => 0.1 + 0.22 * clamp((v - 0.68) / 0.3), top0 = collar(0) - 0.01;
  const opening = () => { x.beginPath(); for (let k = 0; k <= 24; k++) { const v = lerp(top0, 1.06, k / 24); x[k ? 'lineTo' : 'moveTo'](-gap(v) * RM, v); }
    for (let k = 24; k >= 0; k--) { const v = lerp(top0, 1.06, k / 24); x.lineTo(gap(v) * RM, v); } x.closePath(); };
  const edge = s => { x.beginPath(); for (let k = 0; k <= 24; k++) { const v = lerp(top0, 1.06, k / 24); x[k ? 'lineTo' : 'moveTo'](s * gap(v) * RM, v); } };
  P.shadow(neck);
  P.region(() => P.below(neck), '#b3172c', () => {
    for (let i = 0; i < 14; i++) { const a = -Math.PI + i / 14 * 2 * Math.PI + 0.2; x.beginPath(); x.moveTo(a * RM, 0.72); x.lineTo((a + 0.04) * RM, 1.0); x.lineWidth = 0.025; x.strokeStyle = 'rgba(90,0,20,0.35)'; x.stroke(); }
  });
  P.ermine(hem, () => 1.05, [th => hem(th) + 0.03, th => hem(th) + 0.09]);
  // the opening down his front: cut out (his body shows), then ermine trim down both edges, inked
  x.save(); x.globalCompositeOperation = 'destination-out'; opening(); x.fill(); x.restore();
  for (const s of [-1, 1]) { edge(s); x.lineWidth = 0.075 + INKU; x.strokeStyle = INK; x.stroke(); edge(s); x.lineWidth = 0.075; x.strokeStyle = '#fbf8f2'; x.stroke(); }
  // the ermine cape round his shoulders and the gold clasp
  P.ermine(neck, collar, [th => neck(th) + 0.03, th => neck(th) + 0.075]);
  P.wrap(() => { P.line(collar); P.ink(0.8); P.line(neck); P.ink(1); });
  P.dot(0, collar(0) - 0.005, 0.035, '#f2b928'); P.dot(0, collar(0) - 0.005, 0.015, '#c4162a');
  // the crown: a gold ring with 8 points, balls on the tips, jewels on the band
  const vb = 0.2, n = 8, rise = 0.09, spikeH = 0.11, out = 0.03 * W, thick = 0.014;
  const spike = th => { const k = (th + Math.PI) * n / (2 * Math.PI), f = k - Math.round(k); return Math.max(0, 1 - Math.abs(f) * 2.4); };
  const band = loftGeo(H, 4), crown = H.outlined(band, H.paint('#f3c22b'));
  const ball = new T.SphereGeometry(0.028 * W, 16, 12), gem = new T.SphereGeometry(0.03 * W, 16, 12);
  const balls = [], gems = [], group = new T.Group(); group.add(crown);
  for (let i = 0; i < n; i++) { const b = H.outlined(ball, H.paint('#f7d35a'), 0.7); balls.push(b); group.add(b);
    const g = new T.Mesh(gem, H.paint(i % 2 ? '#2f6fd6' : '#c8162b')); g.scale.z = 0.5; gems.push(g); group.add(g); }
  const angleOf = i => -Math.PI + (i + 0.5) / n * 2 * Math.PI;   // spike centres (where spike() peaks)
  return { canvas: P.c, parts: [group],
    puff: (t, th) => { if (t < neck(th)) return 0; if (t < collar(th)) return 0.03;
      return (t > top0 && Math.abs(th) < gap(t) - 0.02) ? 0 : 0.014; },
    update() {
      const up = th => rise + spikeH * spike(th);
      const o1 = ringPts(H, vb, () => out), o2 = ringPts(H, vb, () => out, up), i2 = ringPts(H, vb, () => out - thick, up), i1 = ringPts(H, vb, () => out - thick);
      band.set([i1.r, i2.r, o2.r, o1.r]);   // ring order sets which way the faces point (outside out)
      for (let i = 0; i < n; i++) { const th = angleOf(i), k = Math.round((th + Math.PI) / (2 * Math.PI) * H.COLS);
        balls[i].position.copy(o2.r[k]).lerp(i2.r[k], 0.5);
        const m = o1.r[k].clone().lerp(o2.r[k], 0.18 / 0.2 * 0.5); const dir = m.clone().sub(o1.c); dir.y = 0; dir.normalize();
        gems[i].position.copy(m).addScaledVector(dir, 0.006); gems[i].lookAt(gems[i].position.clone().add(dir)); }
    } };
}

export const OUTFITS3D = { 'construction-crew': constructionCrew, 'kitchen-chef': kitchenChef, 'royal-king': royalKing };
// more outfits live one per file in outfits/<slug>.mjs (default export = the builder); loaded on demand
export async function loadOutfit(slug) {
  if (!OUTFITS3D[slug]) { const m = await import(`./outfits/${slug}.mjs`); OUTFITS3D[slug] = m.default; }
  return OUTFITS3D[slug];
}
