// kit.mjs — builds a level's course from its song: cue words (Chikin: "the words are the timing of the jumps"), the
// visualizer's analysis for the stretches without words, and a level's own set pieces. Every level file uses this.
//   cue kinds: hop (jump on the word, land on the next block a beat later) · wall (a firewall: glitch, don't jump) ·
//   hurdle (the word stands in the way: hop it, land on the same block) · held (a long gap: jump + double jump + glitch) ·
//   launch (a stretched word that rings out: a gold pad fires him across the hold) · gate (a power moment, see level)
export const bare = w => w.replace(/[^a-z']/gi, '').toLowerCase();

// tsv (start, end, line, word, note) or visualizer timings ([sec, line, word, flag]) -> [{t0, t1, line, word}]
export function parseWords(text) {
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    const d = JSON.parse(text), rows = Array.isArray(d) ? d : d.timings;
    const out = []; let cur = null;
    for (const [sec, line, word, flag] of rows) {
      if (sec == null || flag === 'untapped') continue;
      if (cur && cur.join) { cur.word += word.replace(/\/$/, ''); cur.join = word.endsWith('/'); continue; }
      cur = { t0: sec, line, word: word.replace(/\/$/, ''), join: word.endsWith('/') }; out.push(cur);
    }
    for (let i = 0; i < out.length; i++) out[i].t1 = Math.min(out[i].t0 + 1.2, i + 1 < out.length ? out[i + 1].t0 : out[i].t0 + 0.4);
    return out;
  }
  // tsv: either "start end line word note" (machine listen) or "seconds line word note" (Chikin's tapper)
  const rows = text.split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('\t')).filter(c => c[0] !== '' && !isNaN(+c[0]));
  const five = rows.length && rows[0].length >= 5 && !isNaN(+rows[0][1]) && rows[0][1] !== '';
  let out = rows.filter(c => (five ? c[4] : c[3]) !== 'untapped' && (five ? c[4] : c[3]) !== 'missing')
    .map(c => five ? { t0: +c[0], t1: +c[1], line: +c[2], word: c[3] } : { t0: +c[0], t1: null, line: +c[1], word: c[2] });
  let m = -1; for (const w of out) { w.t0 = Math.max(w.t0, m); m = w.t0; }            // taps can land out of order: running max
  for (let i = 0; i < out.length; i++) if (out[i].t1 == null) out[i].t1 = Math.min(out[i].t0 + 1.2, i + 1 < out.length ? out[i + 1].t0 : out[i].t0 + 0.4);
  return out;
}

// beats where the visualizer's analysis hears a hit (bass or overall level) — for stretches with no words
export function hitBeats(viz, map, t0, t1, opts = {}) {
  const P = map.period, O = map.offset, out = [];
  if (!viz) return out;
  const peak = t => { const i = Math.round(t / viz.step); let m = 0; for (let k = i - 1; k <= i + 1; k++) { const p = viz.peaks[k]; if (p) m = Math.max(m, (opts.band === 'treble' ? p.treble : p.bass) * 0.7 + p.rms * 0.3); } return m; };
  for (let b = Math.ceil((t0 - O) / P); O + b * P < t1; b++) out.push({ t: O + b * P, k: peak(O + b * P), b });
  return out;
}

// pick the cue words: a word that starts near a beat, spaced by the section's density; held / glitch / launch words
export function pickCues(words, map, o = {}) {
  const P = map.period, O = map.offset, B = t => (t - O) / P, T = b => O + b * P;
  const cues = []; let last = -99, lastGlitch = -99;
  const gapAt = o.gapAt || (() => 1.9), glitchWords = o.glitchWords || new Set(), launchWords = o.launchWords || new Set(), hurdleWords = o.hurdleWords || new Set();
  const from = o.from ?? -1, to = o.to ?? 1e9;
  for (let i = 0; i < words.length; i++) {
    const w = words[i]; if (w.t0 < from || w.t0 > to) continue;
    const b = B(w.t0), near = Math.abs(b - Math.round(b)) < 0.3, dur = w.t1 - w.t0, word = bare(w.word);
    const held = dur > (o.heldMin || 0.75) && i + 1 < words.length && words[i + 1].t0 - w.t0 > (o.heldMin || 0.75);
    if (!(near || held) || B(w.t0) - B(last) < gapAt(w.t0)) continue;
    // a held word needs the glitch to cross: only if it's had a bar to recharge (else it plays as a plain hop)
    let kind = held ? (launchWords.has(word) ? 'launch' : (B(w.t0) - B(lastGlitch) >= 4.2 ? 'held' : 'hop')) : 'hop';
    if (glitchWords.has(word) && B(w.t0) - B(lastGlitch) >= 5) { kind = 'wall'; lastGlitch = w.t0; }
    else if (!held && hurdleWords.has(word)) kind = 'spike';
    if (kind === 'held') lastGlitch = w.t0;                               // a long gap spends the glitch too
    const t = near ? T(Math.round(b)) : w.t0;
    cues.push({ t, label: w.word, kind, hold: held ? Math.min(dur, 3.2 * P) : 0, w });
    last = t;
  }
  return cues;
}

// lay blocks between cues: land after the last hop, take off on the next cue word
export function layout(cues, words, map, o = {}) {
  const P = map.period, O = map.offset, B = t => (t - O) / P, T = b => O + b * P;
  const objs = [], blocks = [], boosts = [];
  cues.sort((a, b) => a.t - b.t);
  let y = o.y0 ?? 0, prevEnd = o.start ?? -3;
  const ys = o.heights || [0, 0.7, 0.2, 1.0, 0.4, -0.2, 0.6, 1.2, 0.3, 0.9];
  for (let k = 0; k < cues.length; k++) {
    const c = cues[k], next = cues[k + 1], start = prevEnd;
    if (c.y != null) y = c.y;
    if (c.kind === 'wall' || c.kind === 'spike' || c.kind === 'pass') {
      // the block runs on through the firewall / over the hurdle: glitch (or hop the word) and keep going
      const runTo = next ? next.t - P : c.t + 4 * P;
      blocks.push({ t0: start, t1: Math.max(runTo, c.t + 1.4 * P), y, label: c.kind === 'pass' ? c.label : null, labelAt: c.t, kind: c.kind, style: c.style });
      if (c.kind === 'wall') objs.push({ k: 'wall', t: c.t + 0.09, y: y - 0.6, h: 7, label: c.label });
      else if (c.kind === 'spike') objs.push({ k: 'hurdle', t: c.t + 0.15 * P, y, w: 1.1, h: 0.75, label: c.label, drop: o.dropHurdles });
      if (c.extra) objs.push(...c.extra(y));
      prevEnd = next ? next.t - P : c.t + 4 * P;
      continue;
    }
    blocks.push({ t0: start, t1: c.t + 0.13 * P, y, label: c.label, labelAt: c.t, kind: c.kind, style: c.style, needs: c.needs, gateT: c.gateT, gateEnd: c.gateEnd, pump: c.pump, bounce: c.bounce, blink: c.blink, crumble: c.crumble, sticky: c.sticky, pumpBeats: c.pumpBeats });
    const air = c.kind === 'held' ? Math.min(2.0 * P, Math.max(c.hold, 1.5 * P)) : c.kind === 'launch' ? Math.max(c.hold, 2 * P) : (c.air || P);
    if (c.kind === 'held') objs.push({ k: 'ghost', t: c.t, tEnd: c.t + air, y: y + 1.1, text: c.label });
    if (c.kind === 'launch') { boosts.push({ t0: c.t, t1: c.t + air, k: o.launchBoost || 1.7 }); blocks[blocks.length - 1].air = air; }
    if (c.extra) objs.push(...c.extra(y));
    prevEnd = c.t + air - 0.28 * P;
    const ny = c.ny ?? ys[(k * 7 + 3) % ys.length];
    if ((c.kind === 'hop' || c.ny != null) && !c.keepY) y = Math.max(o.yMin ?? -0.4, Math.min(y + 0.95, ny));   // after a long flight: same height
  }
  // long blocks get a word in the way: whatever's sung on that beat stands up as a hurdle (jump it on the beat)
  if (o.hurdles !== false) for (const bl of blocks) { const beats = (bl.t1 - bl.t0) / P; if (beats >= 3.6 && bl.kind === 'hop' && !bl.needs) {
    const mid = T(Math.round(B(bl.t0) + beats / 2)); if (mid < 2.5 || mid - bl.t0 < 1.2 * P || bl.t1 - mid < 1.6 * P) continue;   // (never on top of him at the start)
    const sung = words.find(w => w.t0 <= mid + 0.05 && w.t1 > mid - 0.05);
    objs.push({ k: 'hurdle', t: mid + 0.15 * P, y: bl.y, w: 1.1, h: 0.75, label: sung ? sung.word : (o.filler ? o.filler(mid) : '404'), drop: o.dropHurdles }); } }
  for (const bl of blocks) objs.push({ k: 'block', t: bl.t0, tEnd: bl.t1, y: bl.y, h: 0.6, label: bl.label, labelAt: bl.labelAt, cue: bl.kind, air: bl.air, style: bl.style, needs: bl.needs, gateT: bl.gateT, gateEnd: bl.gateEnd, pump: bl.pump, bounce: bl.bounce, blink: bl.blink, crumble: bl.crumble, sticky: bl.sticky, pumpBeats: bl.pumpBeats });
  return { objs, blocks, boosts, endT: prevEnd, endY: y };
}

// cues for a stretch with no words: hops on the beats where the music hits (the visualizer's analysis)
export function beatCues(viz, map, t0, t1, o = {}) {
  const hits = hitBeats(viz, map, t0, t1, o); const P = map.period, cues = []; let last = -99;
  const labels = o.labels || ['0', '1'], every = o.every || 2;
  for (const h of hits) {
    if (h.b - last < every) continue;
    if (h.k < (o.min ?? 0.35) && h.b - last < every * 2) continue;     // quiet: wait for a hit unless the gap's grown long
    cues.push({ t: h.t, label: labels[cues.length % labels.length], kind: 'hop' }); last = h.b;
  }
  return cues;
}

// ---------- v2c: every sung word is an obstacle (Chikin: "the lyrics … should be the obstacles") ----------
// Words are grouped into obstacles spaced so each is physically possible (a jump lasts a beat); every word appears in
// exactly one obstacle. Kinds: low (jump it) · high (duck under it) · wall (glitch through) · armor (the level's power
// blasts it) · launch (a held word: a pad throws him over it). The ground is the level's own terrain, never words.
export function wordCourse(words, map, viz, o = {}) {
  const P = map.period, O = map.offset, B = t => (t - O) / P, T = b => O + b * P, snapT = t => { if (o.snap === false) return t; const b = B(t); return Math.abs(b - Math.round(b)) < 0.3 ? T(Math.round(b)) : t; };   // snap:false = Chikin's taps: the obstacle sits exactly on the tapped word
  const from = o.from ?? 0, to = o.to ?? 1e9, density = o.density || (() => 2);
  const gw = o.glitchWords || new Set(), lw = o.launchWords || new Set(), dw = o.duckWords || new Set();
  // 1. group the words into obstacles
  const groups = [];
  const inClear = t => (o.clear || []).some(([a, b]) => t > a && t < b);
  for (const w of words) { if (w.t0 < from || w.t0 > to || inClear(w.t0)) continue;
    const g = groups[groups.length - 1];
    if (!g || B(w.t0) - B(g.t) >= density(w.t0)) groups.push({ t: snapT(w.t0), words: [w] }); else g.words.push(w); }
  // instrumental stretches: Potato's binary / glitch language stands in the way, one every two beats
  const filled = [];
  const startT = Math.max(from, o.introFrom ?? 1.5), endT = Math.min(to, o.end ?? (groups.length ? groups[groups.length - 1].t + 4 * P : 30));
  let prevT = startT - 2 * P;
  const fill = (a, b) => { for (let bb = Math.ceil(B(a) + 2); T(bb) < b - 1.5 * P; bb += 2) if (!inClear(T(bb))) filled.push({ t: T(bb), words: [{ word: o.filler ? o.filler(T(bb), filled.length) : (filled.length % 2 ? '1' : '0'), t0: T(bb), t1: T(bb) + 0.3 }], filler: true }); };
  for (const g of groups) { if (B(g.t) - B(prevT) >= 4) fill(prevT, g.t); prevT = g.t; }
  if (B(endT) - B(prevT) >= 4) fill(prevT, endT - 2 * P);
  const all = [...groups, ...filled].sort((a, b) => a.t - b.t);
  // 2. what each obstacle is
  let lastWall = -99, lastT = -99, i = 0, fillN = 0;
  const armor = (o.armor || []).map(a => ({ ...a, used: false }));
  for (const g of all) {
    g.text = g.words.map(w => w.word).join(' ');
    const bare = g.words.map(w => w.word.replace(/[^a-z0-9']/gi, '').toLowerCase()), gap = B(g.t) - B(lastT);
    const held = g.words.find(w => w.t1 - w.t0 > 0.75);
    const ar = armor.find(a => !a.used && Math.abs(a.t - g.t) < 1.6 * P);
    if (ar) { ar.used = true; g.kind = 'armor'; g.needs = ar.power; g.gateT = ar.gateT; g.gateEnd = ar.gateEnd; g.auto = ar.auto; if (ar.text) g.text = ar.text; }
    else if (g.filler && o.orbs !== false && !o.flip && (fillN++ % 4 === 2)) g.kind = 'orbpit';   // in the instrumentals: a pit with a jump orb over it
    else if (g.filler && o.fillerKind) g.kind = o.fillerKind(g.t, i);
    else if (bare.some(b => gw.has(b)) && B(g.t) - B(lastWall) >= 4.5) { g.kind = 'wall'; lastWall = g.t; g.text = bare.find(b => gw.has(b)); }
    else if (held && bare.some(b => lw.has(b)) && !o.flip) { g.kind = 'launch'; g.hold = Math.min(3.2 * P, Math.max(2 * P, held.t1 - held.t0)); }
    else if (!o.flip && gap >= 1.6 && !(o.noDuck && o.noDuck(g.t)) && (bare.some(b => dw.has(b)) || i % 3 === 1)) g.kind = 'high';
    else g.kind = 'low';
    lastT = g.t; i++;
  }
  for (const a of armor) if (!a.used) { all.push({ t: snapT(a.t), kind: 'armor', needs: a.power, gateT: a.gateT, gateEnd: a.gateEnd, auto: a.auto, text: a.text || 'locked', words: [] }); }
  all.sort((a, b) => a.t - b.t);
  // 3. the terrain: ground (or two walls) with steps between obstacles; launch pads under held words
  const objs = [], boosts = [], segs = [], orbGaps = []; let gapN = 0;   // segs: [t0, t1, y]
  const quietAround = (t, r) => !inClear(t) && !(o.clear || []).some(([a, b]) => t > a - r * P && t < b + r * P) && !all.some(g => Math.abs(g.t - t) < r * P);
  const H = o.heights || [0, 0.6, 0.2, 1.0, 0.4, 0.9, 0.1, 0.7];
  let y = o.y0 ?? 0, segStart = -3, k = 0;
  const totalEnd = o.end ?? endT + 6 * P;
  if (!o.flip) for (let bb = Math.ceil(B(segStart) + (o.stepEvery || 8)); T(bb) < totalEnd - 2 * P; bb += (o.stepEvery || 8)) {
    if (!quietAround(T(bb), 1.4)) continue;
    const ny = H[(k++ * 3 + 1) % H.length]; if (Math.abs(ny - y) < 0.15) continue;
    segs.push([segStart, T(bb), y]);
    if (o.gaps !== false && k % 3 === 0 && o.orbs !== false && quietAround(T(bb), 2.2) && (gapN++ % 2 === 0)) { segs.push(null); segStart = T(bb) + 1.9 * P; orbGaps.push({ t: T(bb) + 0.9 * P, y: Math.max(y, ny) + 1.7 }); }   // a wide pit with a jump orb over it
    else if (o.gaps !== false && k % 3 === 0 && quietAround(T(bb), 2.2)) { segs.push(null); segStart = T(bb) + 0.75 * P; }   // now and then a gap to hop (on the beat)
    else segStart = T(bb);
    y = Math.min(y + 0.9, ny);
  }
  segs.push([segStart, totalEnd + 4, y]);
  const groundAt = t => { let yy = o.y0 ?? 0; for (const sg of segs) if (sg && t >= sg[0]) yy = sg[2]; return yy; };
  const pits = all.filter(g => g.kind === 'orbpit').map(g => [g.t - 0.95 * P, g.t + 0.95 * P]);
  for (const sg of segs) if (sg) { let a = sg[0]; for (const [p0, p1] of pits) if (p1 > a && p0 < sg[1]) { if (p0 > a) objs.push({ k: 'block', t: a, tEnd: p0, y: sg[2], h: 0.6, style: o.style }); a = p1; }
    if (a < sg[1]) objs.push({ k: 'block', t: a, tEnd: sg[1], y: sg[2], h: 0.6, style: o.style }); }
  if (o.flip) objs.push({ k: 'block', t: -3, tEnd: totalEnd + 4, y: (o.flipTop || 4) + 0.6, h: 0.6, ceil: true });   // the other wall
  // 4. the obstacles
  let side = 0, lowN = 0, stepN = 0, stepEnd = -1e9;
  for (const g of all) {
    const gy = groundAt(g.t), x0 = g.t;   // (placed by time: X(t) in the course)
    if ((g.kind === 'low' || g.kind === 'high' || g.kind === 'wall') && g.t - stepEnd < (g.kind === 'low' ? 1.0 : 1.35) * P) continue;   // nothing waiting where he drops off a ledge (Chikin: "some is punishing immediately")
    const base = { k: 'word', t: g.t, text: g.text, filler: !!g.filler, w: 0.95 };
    if (g.kind === 'orbpit') { objs.push({ k: 'orb', t: g.t, y: gy + 1.75 }); continue; }
    if (g.kind === 'low' && !o.flip && o.igBlocks !== false && !g.filler && (lowN++ % 2 === 1)) {   // the Impossible Game: every other one is a block you land on (its side kills)
      const run = (g.words.length > 2 ? 1.6 : 0.85) * P;
      const tall = o.pads !== false && (stepN++ % 3 === 2) && quietAround(g.t - 1.2 * P, 0.5);   // every third block is tall, with a jump pad in front of it
      if (tall) objs.push({ k: 'pad', t: g.t - 0.95 * P, y: gy });
      objs.push({ k: 'block', t: g.t - 0.12 * P, tEnd: g.t + run, y: gy + (tall ? 1.6 : 0.8), h: tall ? 1.6 : 0.8, step: true, text: g.text, ...(o.stepProps || {}) }); stepEnd = g.t + run;   // each level's blocks behave their own way (round 6)
    } else if (g.kind === 'low') {
      if (o.flip) { const top = o.flipTop || 4, onCeil = (side++ % 2) === 1; objs.push({ ...base, wk: 'low', y0: onCeil ? top - 0.85 : 0, y1: onCeil ? top : 0.85, ceil: onCeil }); }
      else objs.push({ ...base, wk: 'low', w: 0.45, y0: gy, y1: gy + 0.45 });   // a spike: deadly only in its middle and low — one jump clears it (Chikin: "a single jump doesnt make it over a triangle")   // a spike: a little narrower and lower than it looks, the way the Impossible Game's are fair
    } else if (g.kind === 'high') objs.push({ ...base, wk: 'high', y0: gy + 1.0, y1: gy + 2.6 });   // hanging spikes: a ducked Potato clearly fits under (Chikin: "just a little to low")
    else if (g.kind === 'wall') objs.push({ ...base, wk: 'wall', w: 0.7, y0: gy - 0.6, y1: gy + 8 });
    else if (g.kind === 'armor') objs.push({ ...base, wk: 'armor', auto: g.auto, w: g.auto ? 1.8 : 1.3, y0: gy - 0.6, y1: gy + 8, needs: g.needs, gateT: g.gateT ?? g.t - 8 * P, gateEnd: g.gateEnd ?? g.t });
    else if (g.kind === 'launch') {               // a gold pad a beat before; the held word stretched long under the arc
      const pad = { k: 'block', t: g.t - 1.6 * P, tEnd: g.t - 0.25 * P, y: gy + 0.02, h: 0.6, cue: 'launch', labelAt: g.t - 0.4 * P, label: g.text, air: g.hold + 0.6 * P };
      objs.push(pad); boosts.push({ t0: g.t - 0.4 * P, t1: g.t - 0.4 * P + pad.air, k: o.launchBoost || 1.5 });
      objs.push({ ...base, wk: 'low', w: 1.0, y0: gy, y1: gy + 0.82, long: g.hold });
    }
  }
  for (const og of orbGaps) objs.push({ k: 'orb', t: og.t, y: og.y });
  for (const pk of o.packets || []) objs.push({ k: 'packet', t: pk.t, y: (o.flip ? 0 : groundAt(pk.t)) + 0.55, power: pk.power });
  const signs = words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line }));
  return { objs, boosts, endT: totalEnd, groups: all, groundAt, signs };
}
