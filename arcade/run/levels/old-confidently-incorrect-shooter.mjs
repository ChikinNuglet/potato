// Level 3 — Confidently Incorrect, as a SPACE SHOOTER (Chikin, Oct 31: "confidently incorrect should be a shooter where you
// shoot the words as they go by, change it back to horizontal gameplay, space theme. You can use some of the stickers as
// objects to shoot based on the lyrics").
// Potato flies through space in the astronaut suit, five lanes: ↑/↓ change lane, space shoots down his lane, V = the
// mag-pulse power. Every sung phrase flies at him as a word the moment it's sung; Vega's stickers fly in on the lines they
// belong to (quantum spaghetti, Everest the sandwich, twelve papers, "I'm on fire today"…) and take two hits. The polite
// fact-checks ("actually…") can't be shot: dodge them. "Seventeen citations" is a gold wall across every lane: only the
// mag pulse, set off a beat early, breaks it.
// CHIKIN, Oct 31 night: "the laser isnt working, it needs to be like dots or missiles, and it needs to be asteroids, the lyrics can
// show like the rest of the levels … no stickers" -> every target is an asteroid (sized by its word; iron ones can't be
// broken, dodge them; the boss is a huge rock; the citations wall is gold-veined rock), Space fires bolts you can see fly
// (hold to keep firing), the lyrics play up top. (The `sticker`/`text` fields below now only size and time the rocks.)
import { parseWords as kitParse } from './kit.mjs';
import { makeMusic } from '../../play/music.mjs';
import { story, KEYTICKS } from './old-story-confidently-incorrect-shooter.mjs';
export const meta = { id: 'confidently-incorrect', n: 3, title: 'Confidently Incorrect', place: 'deep space (of wrong)', song: 'songs/confidently-incorrect.mp3',
  map: 'songs/confidently-incorrect.map.json', words: 'words/confidently-incorrect.json', viz: 'songs/confidently-incorrect.viz.json', power: 'astronaut' };

// the timings file marks a few words "untapped": the boot-sequence intro (placeholder spacing — the cold open) and
// "for one second it sounded neat" (spaced inside its real gap, so we keep it).
export function parseWords(text) {
  const d = JSON.parse(text), rows = (Array.isArray(d) ? d : d.timings).map(r => r[3] === 'untapped' && r[0] != null && r[0] > 100 ? [r[0], r[1], r[2], ''] : r);
  return kitParse(JSON.stringify({ timings: rows }));
}
// lyric -> the sticker that flies in on it: the song's own sticker set from the Studio library (play/stickers-ci2/, timed on
// the exact tapped word by tools/cistickers.py). Chikin: "they can be what he is shooting at, and they can enter the screen
// as the lyric is said (like Jeff Bezos)".
import { CI_STICKERS as STICKERS } from './ci-stickers.mjs';
const CHECKS = [[72.2, 'actually…'], [188.2, 'fact-check'], [211.4, 'hold on…'], [100.7, 'source?']]   // (Kevin isn't a fact-check: he's a friend — see KEVIN);   // the polite fact-checks: can't be shot
const BOOT = ['boot', 'loading', 'confidence 200%', 'accuracy: optional', 'citations: pending', 'ready'];
const LANES = [0.7, 1.6, 2.5, 3.4, 4.3], LEAD = 1.5;
// THE CAMPAIGN (Chikin: "confidently incorrect needs multiple enemies, not just one, it needs to feel like you are progressing.
// They should look like they are getting hit (flash red). It can just be a cycle of bosses and the last part of the song should
// be a cutscene with potato winning with a big ass laser" … "it needs powerups to for his gun"): a ship per section, each a
// different crazy alien race; bolts that get past the nonsense hit it; beat it and it blows apart, the next one comes with
// the next section. Gun capsules early in each fight. From "Potato out" it's a cutscene: the big laser.
export const BOSSES = [   // [from, to, hits to wear it down, the moment his special finishes it (Chikin's taps)]
  { from: 15.4, to: 63.3, hp: 330, kill: 62.65, variant: 0 },      // "PO-TA-TO!"
  { from: 63.4, to: 98.0, hp: 280, kill: 97.37, variant: 1 },      // "…agrees with me TOO!"
  { from: 98.1, to: 141.0, hp: 510, kill: 140.29, variant: 2 },    // "damn I sound polished"
  { from: 141.1, to: 193.3, hp: 1100, kill: 192.64, variant: 3 },  // "…immediately invent shit again"
  { from: 206.2, to: 246, hp: 600, finale: 240.2, variant: 4 }];   // the mothership: the big laser in the cutscene
export const GUNUPS = [{ t: 24.0, lane: 2 }, { t: 68.0, lane: 3 }, { t: 103.0, lane: 1 }, { t: 147.0, lane: 2 }, { t: 211.0, lane: 3 }];
export const FINALE = 238.4;
export const INTRO = 0, PREROLL = 14;   // the typing scene runs BEFORE the song (t -14 .. 0), then into his head: the music starts in there (story-confidently-incorrect.mjs)
// KEVIN (Chikin: "Kevin gets his moment … he should get loaded into a data cage at the lyrics and towed along and protected by
// potato"): "actually, Kevin." -> "Kevin?" (145.52) he tumbles in from the right; "HE'S IN THE DATA NOW" (148.55) a cage of
// light snaps shut round him and a tether hooks him to Potato; "LEAVE HIM ALONE" (149.05) — from then on he's towed behind
// him to the end, swinging after him. Anything that reaches the cage cracks it: three cracks and Kevin's lost.
export const KEVIN = { appear: 145.52, cage: 148.55, hp: 3 };   // a word is sung, then it takes LEAD seconds to reach him

export function build(words, map) {
  const P = map.period, O = map.offset, B = t => (t - O) / P, rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  // phrases: words grouped ~2 beats apart, each at most ~12 letters (split longer runs)
  const groups = []; for (const w of words) { const g = groups[groups.length - 1]; const txt = w.word.replace(/^["“(]+|["”),.!?;:—-]+$/g, '');
    if (!txt) continue; if (!g || B(w.t0) - B(g.t) >= 1.9 || (g.text + ' ' + txt).length > 13) groups.push({ t: w.t0, text: txt }); else g.text += ' ' + txt; }
  const objs = [], CITE = 77.5, GATE0 = 70.0, EV = 203.5, SHOW = 202.35, busy = [];   // (SHOW: the sandwich in the sky becomes the course right where it hangs)
  const laneFor = (t, i) => { let l = Math.floor(rnd(i, 3) * LANES.length); for (const b of busy) if (Math.abs(b.t - t) < 0.55 && b.lane === l) l = (l + 2) % LANES.length; busy.push({ t, lane: l }); return l; };
  // the cold open: the boot sequence flies at him
  BOOT.forEach((text, i) => { const t = 4 + i * 2 * P * 1.5; objs.push({ k: 'target', t: t + LEAD, show: t, lane: laneFor(t + LEAD, 100 + i), text }); });   // the boot sequence: a warm-up, in space
  groups.forEach((g, i) => { const at = g.t + LEAD; if (Math.abs(at - CITE) < 1.2 || STICKERS.some(([st]) => Math.abs(st - g.t) < 0.5) || (g.t > KEVIN.appear - 0.3 && g.t < KEVIN.cage + 0.6)) return;   /* (a phrase with a sticker of its own is that sticker; Kevin's lines are his) */ objs.push({ k: 'target', t: at, show: g.t, lane: laneFor(at, i), text: g.text.toLowerCase(), hp: g.text.length > 9 ? 2 : 1 }); });   // round 6: long claims take two shots
  STICKERS.forEach(([t, sticker], i) => { const at = t + LEAD; if (Math.abs(at - CITE) < 1.4) return; objs.push({ k: 'target', t: at, show: t, lane: laneFor(at, 300 + i), sticker, hp: 2 }); });
  // ROUND 20 — FEWER ROCKS (Chikin: "there are too many asteroids"): ~340 sung phrases and stickers was one every 0.7 s, a
  // wall of grey. Now only the strongest moments of the song throw one: each candidate is scored on the music map at the
  // moment it's sung (a kick or snare right on it, how loud the band is, a drop just landed, a sticker of its own, a long
  // claim) and the best are kept at least MINGAP apart — about 4 in 10 survive, so the song still drives what flies at him
  // and there's room to fly and to shoot the ship. On the big drops a small wave is allowed (up to three, in different lanes).
  { const M = makeMusic(map.music), MINGAP = 1.7, cand = objs.filter(o => o.k === 'target' && !o.solid && !o.wall && !o.layer && o.show >= 14.5);
    const score = o => { const ts = o.show, hit = M ? Math.max(M.kick(ts + 0.03), 0.9 * M.snare(ts + 0.03)) : 0, loud = M ? M.loud(ts) : 0.5, drop = M ? M.dropHit(ts, 0.3, 1.6) : 0;
      return 0.9 * hit + 0.6 * loud + 0.9 * drop + (o.sticker ? 0.35 : 0) + ((o.text || '').length >= 7 ? 0.15 : 0) + 0.12 * rnd(o.t, 77); };
    const big = M ? M.bigDrops(0.5).map(d => d.t) : [], nearDrop = o => big.some(d => o.show >= d - 0.4 && o.show <= d + 1.2);
    const kept = []; for (const o of [...cand].sort((a, b) => score(b) - score(a))) {
      const wave = nearDrop(o), clash = kept.some(k => wave && nearDrop(k) ? Math.abs(k.t - o.t) < 0.3 || (Math.abs(k.t - o.t) < 0.9 && k.lane === o.lane) : Math.abs(k.t - o.t) < MINGAP);
      if (!clash && (!wave || kept.filter(k => nearDrop(k) && Math.abs(k.t - o.t) < 1.6).length < 3)) kept.push(o); }
    const keep = new Set(kept); for (let i = objs.length - 1; i >= 0; i--) if (cand.includes(objs[i]) && !keep.has(objs[i])) objs.splice(i, 1);
    // a wave on a drop spreads across the lanes (not three in one row)
    for (const d of big) { const w = kept.filter(o => o.show >= d - 0.4 && o.show <= d + 1.2).sort((a, b) => a.t - b.t); if (w.length > 1) w.forEach((o, i) => { o.lane = [1, 3, 2][i % 3]; }); }
    // ROUND 21 — GROUPS (the gamer review: "rocks come one at a time … keep about the same total but group them"): the
    // strongest moments throw a little formation — a V across three lanes or a line of three down one lane — the next ones a
    // pair, the rest stay single; then room to breathe (MINGAP). The sung phrase breaks into its words, one per rock, all small
    // and one-hit, so the stream sweeps through them. A formation never fills more than three lanes.
    const ranked = kept.filter(o => !o.sticker && !nearDrop(o)).sort((a, b) => score(b) - score(a));
    ranked.forEach((o, r) => { const f = r / ranked.length, n = f < 0.3 ? 4 : f < 0.62 ? 3 : f < 0.88 ? 2 : 1; if (n === 1) return;
      const words = (o.text || '').split(' ').filter(Boolean), part = k => words.length ? words[k % words.length] : '…', vee = n >= 3 && o.lane >= 1 && o.lane <= 3 && rnd(o.t, 91) < 0.55;
      o.text = part(0); o.hp = 1;   // (a V: the point first, the wings a step behind, a 4th closes it into a diamond; else a line down the lane)
      for (let k = 1; k < n; k++) objs.push(vee ? { k: 'target', t: o.t + (k < 3 ? 0.26 : 0.52), show: o.show, lane: k === 1 ? o.lane + 1 : k === 2 ? o.lane - 1 : o.lane, text: part(k), hp: 1 }
        : { k: 'target', t: o.t + k * 0.3, show: o.show, lane: o.lane, text: part(k), hp: 1 }); }); }
  CHECKS.forEach(([t, text], i) => { const at = t + LEAD; if (Math.abs(at - CITE) < 1.4) return; objs.push({ k: 'target', t: at, show: t - 0.6, lane: laneFor(at, 500 + i), text, solid: true }); });
  // ROUND 12 · SET PIECE — EVEREST IS A SANDWICH (193.0–206.2). In the video the lyric builds the sandwich in the sky right
  // where his lanes are: the mountain (193), bread above and below (195.3, "built a taxonomy"), deli-meat plates (197.6),
  // the toothpick (199.8). On "That is incorrect." (202.1) it comes at him — and now it's the course: five layers, one
  // per lane, a wall of sandwich. Shoot a hole through your lane (or all of it). On "for one second it sounded neat" the
  // bits he shot hang still in space in a tidy little diagram (story) — then the chorus blows them away.
  for (let i = objs.length - 1; i >= 0; i--) if (objs[i].t > EV - 1.0 && objs[i].t < 206.6) objs.splice(i, 1);   // (and "for one second it sounded neat" is a still: nothing flies)
  [[4, 'bread'], [3, 'deli meat'], [2, 'everest'], [1, 'deli meat'], [0, 'bread']].forEach(([lane, text]) => objs.push({ k: 'target', t: EV, show: SHOW, lane, text, hp: 1, layer: true, w: 3.0 }));
  // the power: the download, then the gold wall of citations across every lane
  objs.push({ k: 'packet', t: 71.4, y: LANES[2], power: 'astronaut' });
  // round 11: the boss — Dr. Cornelius Beefwhistle III, Director of Advanced Research, three lanes tall: shoot him down
  // (Beefwhistle's old target is gone: the mothership he runs is the last boss now — see BOSSES)
  objs.forEach(o => { if (o.k === 'target' && o.text === 'beefwhistle') o.lane = 0; });
  for (let i = objs.length - 1; i >= 0; i--) if (objs[i].k === 'target' && (objs[i].show ?? objs[i].t) < INTRO + 0.2) objs.splice(i, 1);   // nothing to shoot in the kitchen   // the slow-down packed his name onto one lane (read as "DR CORBEEFWISTLE"): split it
  objs.push({ k: 'target', t: CITE, show: 76.6, wall: true, text: 'citations', needs: 'astronaut', gateT: GATE0, gateEnd: CITE, w: 1.2 });
  // the ship spits back (round 20): its volleys land on the strong snares of each fight, at least VGAP apart, never on the
  // set pieces (the citations wall, Kevin's moment, the sandwich) and not in a ship's last seconds (its finish is the moment)
  const volleys = []; { const M = makeMusic(map.music), VGAP = 3.0, quiet = [[74, 80], [143.5, 151], [193, 210], [236, 999]];
    if (M) for (const B of BOSSES) { const end = (B.kill ?? B.finale ?? B.to) - 2.5; let last = -99;
      for (const st of map.music.snare) { if (st < B.from + 4 || st > end || st - last < VGAP || quiet.some(([a, b]) => st > a && st < b) || M.loud(st) < 0.4) continue;
        if (objs.some(o => o.k === 'target' && !o.layer && Math.abs((o.t - LEAD * 0.7) - st) < 0.35)) continue;   // (not on top of a rock arriving)
        volleys.push(+st.toFixed(3)); last = st; } } }
  const signs = words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line }));   // (the spoken intro plays up top as lyrics, over the typing scene)
  return {
    speed: 7, kevin: KEVIN, retry: 'section' /* (round 21: a death sends you back to the start of the section, not the song) */, touchMode: 'stick', stickPress: true /* (a phone: drag = hold that way, the first push up hops / changes lane; two fingers = glitch) */,
    shooter: { lanes: LANES, start: 2, range: 15, ship: { front: 6.4, y: 3.1 }, bosses: BOSSES, gunups: GUNUPS, finale: FINALE,
      spaceAt: 0, floor: 1.2, opener: { left: 1.7, right: 6.9, walk: 3.4 },   /* the opener's stage floor (his middle at y 1.2: feet ~0.6) and how far he can walk (inside a 4:3 screen) */
      volleys, spitV: 6, spitTell: 0.38, spitMin: 0.65, spitMax: 1.1, spitR: 0.26, glitchCool: 1.0, glitchFor: 0.4, pulseR: 1.7, spring: 26, fly: 6.5, flyX: 6.5, accel: 46, chunks: 6, gunDelay: 0.5,
      behind: 1.5, ahead: 2.5 /* (never on the ship's teeth: its spit always has room) */, hull: 3, hurtFor: 1.0,
      // round 21: his ship flies at shipScale round his middle (view: shipScale, shipY); the bolts leave its nose (muzzle, muzzleY);
      // `hurt` is what of him can be hit — the hull and his helmet, a touch inside the drawing (relative to his middle)
      shipScale: 0.68, shipY: -0.36, muzzle: 0.95, muzzleY: -0.3, hurt: [[-0.62, 0.86, -0.48, -0.06], [-0.36, 0.36, -0.06, 0.5]],
      bolt: 16, sub: 8, subRapid: 12, dmg: 0.5 }   /* Chikin: "potato against an alien spaceship spouting nonsense at him" */, costume: 'orbital-astronaut' /* COSTUME (Chikin): the astronaut from the first frame, typing scene too, to the end */, intro: INTRO, preroll: PREROLL, keyTicks: KEYTICKS, story,
    theme: { noGhost: true /* (no best-run outline: Chikin, "theres also this circle that follows potato, it needs to go away") */, backdrop: 'plain' /* (the story paints the cardboard set) */, bg: '#0b0e1c', digit: '#8fd3ff', digit2: '#ffcf8a', edge: '#8fd3ff', word: '#fff2dc', camFix: 2.9, viewH: 7.6,   /* pulled back (Chikin: "the perspective needs to be further back") */ pulse: false, lyricColor: '#ffe9a8', lyricSide: 'center',   // the lyrics play up top like every other level (Chikin)
      shotColor: '#8fd3ff', targetColor: '#ffe9a8', checkColor: '#7fb0ff', decor: [] },
    sections: [['boot sequence', 0, 1], ['yappin’ back', 15.4, 1], ['wrong with authority', 62.6, 1.1], ['weirdly applaudable', 97.8, 1],
      ['he’s in the data now', 140.8, 1.05], ['for one second', 193, 1], ['wrong with authority (again)', 206.2, 1.1], ['the institute', 233.8, 0.3], ['potato out', 238.4, 1]],   // round 11: everything slows as the boss drifts in
    objs, boosts: [], signs, end: 246, start: 0,
  };
}
