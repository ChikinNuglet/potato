// Level 4 — Read the Terms: the book runner, reworked (Oct 31, late). 139 s, 167.7 bpm (a beat = 0.358 s, a bar = 1.43 s).
// Matt: "read the terms … needs to be harder than thursday potato, but it also needs to be a different layout with different
// things happening" · "the platforms should all be books and manuscripts that fall into place instead of already being set" ·
// "instead of spikes and blocks, its books and papers" · "make the music the most impactful part".
// THE IDEA: Thursday is a street. This is a DOCUMENT you climb. Every verse he climbs a page (book stairs that slam into
// place on the beat, ahead of him); every section turn the page TURNS and the layout flips (the chorus runs back DOWN the
// page, ledge to ledge, over the gaps where the pages were skipped). The obstacles are the song's own things: the accept
// box (jump it — he never clicks it), hanging contract pages and the fine print unspooling (duck), the redaction bar, the
// drunk post, the mirror in the wall (glitch through), the tabs, the mic, the coat of a million of you, page nine's stamps
// slamming down on the beat. The hard hat comes on "relax, i'm just playing"; on the second "you SKIPPED it" the skipped
// pages are a hole in the contract, and the girder (V) slams across it and the contract pages stack onto it on the beat:
// he builds his own bridge, and runs it on "i signed mine to a rhyme and it cooks".
// Every obstacle sits on Matt's tapped word (game/words/read-the-terms.tsv; no beat snap), offset so the PRESS lands on the
// word. The intro's taps are placeholders: the intro is laid on the beat.
//
// BEAT SHEET (time · lyric / music · what happens)
//   0.0   intro, spoken over the beat        the page lies on the desk; the cursor ticks ACCEPT for everyone (story). Grace.
//   7.2   "y'all clicked accept" (beats)     LESSON: jump the accept box · jump books · duck a page · duck the fine print ·
//  11.4   "ha"                               glitch the manuscript tower (one kind at a time, three beats apart)
//  11.8   bar 8: the verse kicks in          the first books slam into place on the downbeat; the climb starts
//  12.7   "i READ everything YOU ever WROTE" three book stairs, one per word, up the page
//  14.5   "the TEXTS, the DRAFTS, … CHAT … VOTE"  duck, duck (they hang), jump the chat, jump the ballot box
//  17.1   "PAGE four thousand"               a manuscript pile two stairs tall: jump on "page", double on "four"
//  18.1   "third PARAGRAPH"                  a paragraph break in the floor: hop it
//  19.2   "yeah i SAW that too"              duck   ·  20.6 "posted DRUNK at two": glitch the wobbling post
//  22.2   "no one KNEW"                      the page drops away under him  ·  23.8 "your life's a SECRET": glitch the redaction
//  24.9   "it's a BUFFET"                    up onto the spread  ·  26.1 "i ate the WHOLE internet": the floor's eaten — DOUBLE JUMP
//  28.8   "a MILLION of YOU stitched up"     two stairs up the stack  ·  30.8 "in a COAT": duck the patchwork coat
//  31.8   bar 22: the music drops out        a breath on the top of the page (nothing to press) … 33.6 "polite little GHOST": glitch
//  34.1   CHORUS 1 · "i read the terms"      PAGE TURN: the page flips, the layout flips — now he runs DOWN the page (×1.06)
//  37.4   "you hit ACCEPT"                   the accept box again: jump it (never click)
//  38.3   "I hit the BOOKS"                  two stairs slam down on "i" and "books"
//  41.0   "your soul to a SCROLL"            down onto the scroll  ·  41.7 "and you SKIPPED it": a skipped page — DOUBLE JUMP
//  46.1   "watch your MOUTH / TABS / DRAFTS" three ducks on the three "watch"es (the tabs hang off a rail)
//  50.0   "is LIVING in my light"            a gap down  ·  53.2 "it's TRUE": glitch
//  54.2   "the FINE print in the FINE print" the fine print unspools from above: duck, duck
//  57.3   VERSE 2 · "they fed me the classics"  PAGE TURN: down to the floor of the library; the climb starts again
//  59.7   "comment section RAGE"             glitch  ·  60.8 "MANIFESTOS": up  ·  62.1 "every OPEN page": DOUBLE JUMP the open page
//  65.4   "what you PRETEND"                 glitch  ·  67.5 "how your story probably ENDS": the floor ends — DOUBLE JUMP up
//  71.8   "the student got a MIC"            duck the mic  ·  73.2 "the teacher's getting WORSE": the page drops
//  76.9   "i'm the LIBRARY"                  a tall shelf: jump + double
//  79.6   BRIDGE · "so careful"              the page drops  ·  81.1 "the SEARCH bar": jump up onto a long thin search bar over a hole
//  85.5   "i'm the MIRROR"                   glitch through the mirror  ·  87.5 "in the WALL": glitch through the wall
//  89.1   bar 62: the music drops out        a breath
//  90.9   "a clause on PAGE NINE"            PAGE TURN to page nine: rubber stamps slam down on the beat ahead of him, one per
//                                            clause (nine · thing · did · me · kid) — jump each one
//  97.2   "relax, i'm just PLAYING"          the hard hat (the download): construction
// 100.4   "that i KNOW you WELL"             two stairs up to the top for the chorus
// 102.9   CHORUS 2 · "i read the terms (again)"  he floats up over the page (cutscene) (×1.10)
// 107.6   "i hit the BOOKS" · 108.8 "SIGNED your soul to a scroll"  two stairs; the top is the scroll
// 110.4   "and you SKIPPED it"               the gold SKIPPED clause at the lip of a hole in the contract: V (any time after the
//                                            hard hat, ideally on "soul") — the girder slams across, the pages stack onto it
// 111.4   "i signed mine to a rhyme and it cooks"  he runs his own bridge; a page lands on every word ahead of him
// 114.7   "watch your MOUTH / TABS / DRAFTS" ducks again, faster  ·  118.7 "LIVING": a gap down — DOUBLE JUMP
// 121.8   "it's TRUE": glitch  ·  123.0 "the FINE print in the FINE print": duck, duck
// 125.9   OUTRO · "page nine"                PAGE TURN back to page nine: down
// 127.7   "ha" · "still readin"              the last three, on the beat
// 130.8   the end                            he dances the last bars; his own box, ticked, highlighted (story)
import { parseWords } from './kit.mjs';
import { story } from './story-read-the-terms.mjs';
export { parseWords };
export const meta = { id: 'read-the-terms', n: 4, title: 'Read the Terms', place: 'inside the terms and conditions', song: 'songs/read-the-terms.mp3',
  map: 'songs/read-the-terms.map.json', words: 'words/read-the-terms.tsv', viz: 'songs/read-the-terms.viz.json', power: 'construction' };

// the section turns (song time) — the page turns on each of these (story + the course's direction flips)
export const TURNS = [34.10, 57.31, 90.89, 125.91];
export const SKIP = 110.39;

export function build(words, map, viz) {
  const P = map.period, O = map.offset, T = b => O + b * P;
  const END = 136.8, CUT = [102.85, 104.75];
  const objs = [];
  // ---- the floor: pages of books at heights; every edge sits on a word ----
  const F = []; let cur = { t0: -3, y: 0 };
  const plan = [];                                                                  // the press each thing asks for, ON its word (the demo starts from this)
  const edge = (t, y, o = {}) => { cur.t1 = t; F.push(cur); cur = { t0: t, y, ...o }; };
  const up = (tw, dy, o = {}) => { edge(tw + (o.lead ?? 0.15), +(cur.y + dy).toFixed(2), { step: true, ...o }); plan.push([tw, 'J']); if (dy > 1) plan.push([tw + 0.15, 'J']); };   // a stair: the edge just after the word, so the jump lands ON the word (a tall one: jump + double)
  const down = (tw, dy, o = {}) => edge(tw + 0.05, +(cur.y - dy).toFixed(2), o);                                  // the page drops away under him (no press)
  const gap = (tw, dur, dy = 0, o = {}) => { cur.t1 = tw + 0.05; F.push(cur); cur = { t0: tw + 0.05 + dur, y: +(cur.y + dy).toFixed(2), ...o }; plan.push([tw, 'J']); if (dur > 0.4) plan.push([tw + 0.25, 'J']); };   // a hole in the page: take off on the word (a wide one: double jump)
  const W = [];
  const low = (tw, text, obj) => { W.push({ wk: 'low', t: tw + 0.12, text, obj }); plan.push([tw, 'J']); };
  const high = (tw, text, obj) => { W.push({ wk: 'high', t: tw + 0.12, text, obj }); plan.push([tw - 0.03, 'D']); };
  const wall = (tw, text, obj) => { W.push({ wk: 'wall', t: tw + 0.1, text, obj }); plan.push([tw, 'G']); };
  const stamp = (tw, text) => { W.push({ wk: 'low', t: tw + 0.12, text, obj: 'rtStampMark', stamp: true }); plan.push([tw, 'J']); };   // page nine: a rubber stamp slams down on the beat (level view)

  // ---- intro: the lesson, on the beat (the spoken intro's taps are placeholders) ----
  low(T(19), 'accept', 'checkbox'); low(T(22), 'i read it'); high(T(25), 'every'); high(T(28), 'word', 'rtFineprint'); wall(T(31), 'ha');
  // ---- verse 1: up the page ----
  up(12.67, 0.8); up(13.30, 0.8); up(13.72, 0.8);                                   // i READ everything YOU ever WROTE
  high(14.51, 'texts'); high(15.05, 'drafts'); low(15.87, 'chat'); low(16.60, 'vote', 'checkbox');
  up(17.08, 1.6, { lead: 0.3 });                                                    // PAGE four thousand: jump + double
  gap(18.07, 0.3);                                                                  // third PARAGRAPH
  high(19.20, 'saw'); low(19.94, 'thing'); wall(20.57, 'drunk'); high(21.29, 'thought');
  down(22.23, 0.8);                                                                 // no one KNEW
  low(22.81, 'think'); high(23.33, "life's"); wall(23.80, 'secret', 'redact');
  up(24.89, 0.8);                                                                   // it's a BUFFET
  gap(26.05, 0.6);                                                                  // i ate the WHOLE internet: double jump
  high(27.39, 'still'); low(28.06, 'gray');
  up(28.80, 0.8); up(29.41, 0.8);                                                   // a MILLION of YOU
  high(30.78, 'coat', 'rtCoat'); low(31.35, 'walking');
  wall(33.62, 'ghost');                                                             // (bar 22: the break — nothing) … a polite little GHOST
  // ---- chorus 1: the page turns; back down the page ----
  down(34.10, 0.8);
  low(35.14, 'all'); high(35.99, "didn't"); low(37.41, 'accept', 'checkbox');
  up(38.29, 0.8); up(38.86, 0.8);                                                   // I hit the BOOKS
  high(40.36, 'soul');
  down(41.01, 0.8, { step: true });                                                 // down onto the SCROLL
  gap(41.73, 0.6, -0.8);                                                            // and you SKIPPED it: double jump
  low(42.86, 'signed'); low(43.87, 'rhyme'); low(44.58, 'cooks');
  high(46.07, 'mouth'); high(46.76, 'tabs', 'rtTabs'); high(47.46, 'drafts');
  down(48.04, 0.8);
  low(49.49, 'typed');
  gap(50.01, 0.3, -0.8);                                                            // is LIVING in my light
  high(50.91, 'light'); low(51.52, 'read');
  down(52.24, 0.8);
  wall(53.18, 'true');
  high(54.23, 'fine print', 'rtFineprint'); low(55.18, 'in'); high(55.64, 'fine print', 'rtFineprint'); low(56.37, 'knows');
  down(56.70, 1.6);
  // ---- verse 2: the library; climb again ----
  down(57.31, 0.8);                                                                 // page turn: the floor of the library
  up(58.25, 0.8); low(58.97, 'comment'); wall(59.65, 'rage'); high(60.16, 'lullabies');
  up(60.83, 0.8);                                                                   // MANIFESTOS
  gap(62.14, 0.6);                                                                  // every OPEN page: double jump
  up(63.94, 0.8); high(64.86, 'what'); wall(65.36, 'pretend', 'redact'); high(66.41, 'know'); low(66.87, 'story');
  gap(67.52, 0.45, 0.8);                                                            // how your story probably ENDS: double jump up
  low(69.05, 'boredom'); high(69.75, 'wrote'); up(70.40, 0.8); low(71.14, 'student'); high(71.80, 'mic', 'rtMic'); low(72.55, "teacher's");
  down(73.22, 0.8);                                                                 // the teacher's getting WORSE
  high(74.06, 'gave'); up(74.78, 0.8); high(75.29, 'forgot'); low(76.08, 'key');
  up(76.89, 1.6, { lead: 0.3 });                                                    // i'm the LIBRARY: jump + double
  high(78.25, 'talk'); low(78.90, 'see');
  // ---- bridge ----
  down(79.72, 0.8); low(80.41, 'leave');
  const BAR = [81.11 + 0.15, 82.70];                                                // the SEARCH bar: a thin bar over a hole
  cur.t1 = 81.21; F.push(cur); cur = { t0: BAR[1], y: cur.y }; plan.push([81.11, 'J']);   // (the hole under it: jump up onto the bar on "search")
  high(81.81, 'late');                                                             // (on the bar)
  high(83.32, 'pocket'); low(83.99, 'coin'); low(84.68, 'date');
  wall(85.45, 'mirror', 'rtMirror'); low(86.07, 'forgot'); high(86.71, 'installed'); wall(87.54, 'wall');
  low(88.32, 'read');                                                               // (bar 62: the break)
  down(90.89, 1.6);                                                                 // page turn: PAGE NINE
  stamp(91.76, 'nine'); stamp(92.55, 'thing'); stamp(93.06, 'did'); high(93.76, 'another'); stamp(95.27, 'me'); stamp(96.00, 'kid');
  const HAT = 97.23;                                                                // relax, i'm just PLAYING: the hard hat
  wall(98.15, 'snitch', 'redact'); low(99.04, 'tell'); high(99.90, 'just');
  up(100.40, 0.8); up(101.81, 0.8);                                                 // i KNOW you WELL
  // ---- chorus 2 (after the float): the books, the scroll, the skipped hole, the bridge ----
  up(107.58, 0.8);                                                                  // i hit the BOOKS
  up(108.75, 0.8);                                                                  // you SIGNED your soul to a scroll (the top is the scroll)
  const LIP = SKIP + 0.04, HOLE = [LIP + 0.16, 112.05];                             // the gold SKIPPED clause at the lip, then the hole
  edge(HOLE[0], null); cur.t0 = HOLE[1]; cur.y = F[F.length - 1].y;                // (the hole: no floor)
  low(112.58, 'rhyme'); low(113.24, 'cooks');
  high(114.72, 'mouth'); high(115.41, 'tabs', 'rtTabs'); high(116.16, 'drafts');
  down(116.76, 0.8);
  high(117.33, 'everything'); low(118.18, 'typed');
  gap(118.67, 0.55, -0.8);                                                           // LIVING in my light: double jump down
  high(119.59, 'light');
  up(120.14, 1.6, { lead: 0.3 }); low(120.89, 'all');                             // i READ THE terms: jump + double wall(121.81, 'true');
  high(123.01, 'fine print', 'rtFineprint'); high(124.03, 'fine print', 'rtFineprint'); low(125.00, 'knows');
  down(125.91, 1.6);                                                                // page turn: page nine, again
  low(T(356), 'ha'); high(T(359), 'still'); low(T(362), 'readin');
  cur.t1 = END + 4; F.push(cur);

  // ---- resolve: blocks, then everything standing on them ----
  const segs = F.filter(f => f.y != null && f.t1 > f.t0);
  const gy = t => { const f = segs.find(f => t >= f.t0 && t < f.t1); return f ? f.y : null; };
  const lowest = Math.min(...segs.map(f => f.y));
  for (const f of segs) objs.push({ k: 'block', t: f.t0, tEnd: f.t1, y: f.y, h: Math.max(0.6, f.y - lowest + 1.0), ...(f.step && f.t0 > 6 ? { step: true } : {}) });
  objs.push({ k: 'block', t: BAR[0], tEnd: BAR[1], y: gy(BAR[0] - 0.2) + 0.8, h: 0.4, cue: 'searchbar' });   // the search bar (drawn by the level view)
  const KIND = { low: [0, 0.82, 0.95], high: [1.0, 2.6, 0.95], wall: [-0.6, 8, 0.7] };
  for (const w of W) { const g = gy(w.t) ?? gy(w.t - 0.2), [a, b, wd] = KIND[w.wk];
    objs.push({ k: 'word', t: w.t, wk: w.wk, text: w.text, filler: true, w: wd, y0: g + a, y1: g + b, ...(w.obj ? { obj: w.obj } : {}), ...(w.stamp ? { stamp: true } : {}) }); }
  // the hard hat, and the gold SKIPPED clause the girder goes through; the bridge over the hole is only there once it has
  const top = gy(LIP - 0.05), gate = { needs: 'construction', gateT: 100.5, gateEnd: LIP };   // (gate opens with the hard hat: V any time after it works)
  objs.push({ k: 'packet', t: HAT, y: gy(HAT) + 0.55, power: 'construction' });
  objs.push({ k: 'word', t: LIP, wk: 'armor', text: 'skipped', w: 1.3, y0: top - 0.6, y1: top + 8, ...gate });
  objs.push({ k: 'block', t: HOLE[0] - 0.08, tEnd: HOLE[1] + 0.05, y: top, h: 0.6, cue: 'bridge', girder: true, ...gate });
  plan.push([109.05, 'V']);                                                         // the hard hat goes on on "soul"

  return {
    speed: 7.8, coyote: 0.08, jumpBuffer: 0.1, readRefill: true,
    costume: 'suit-tie',   // COSTUME (Matt): he wears it the whole song; the power does its effect, never changes his clothes (construction keeps its bridge)
    story, modeView: bookView,                                                     // the level's own 3D: books slam into place, stamps, the search bar, the bridge
    cutscenes: [[CUT[0], CUT[1], 'float']],                                         // "i read the terms (again)": he rises over the page
    theme: { igOff: true, platStyle: 'books', objects: { low: 'bookstack', high: 'papers', wall: 'paperwall' },
      lyricColor: '#2e7d4f', lyricKeys: ['skipped', 'terms', 'accept', 'read', 'agree', 'books', 'scroll'], objA: '#ffe14d', objB: '#3a6bd8', decor: ['landflash'], backdrop: 'plain', bg: '#f1ecdf', digit: '#9a9384', digit2: '#c9a640', edge: '#f2c230', block: '#1c1b20',
      blockText: '█████ ███ ██████ █████ ████ ', blockTextColor: '#2c2b31', word: '#1d1a14', wordSlab: '#fbf7ee', light: '#ffe066', light2: '#9fe6ff', halo: '#fff3b0',
      lyricArt: false, camMax: 7.2 },
    sections: [['y’all clicked accept', 0, 1], ['i read everything', 11.79, 1], ['i read the terms', 34.10, 1.08], ['the classics and the rage', 57.31, 1],
      ['the search bar', 79.58, 1], ['page nine', 90.89, 1.03], ['i read the terms (again)', 102.85, 1.12], ['still readin', 125.91, 0.95]],
    objs, boosts: [], signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: END, start: 0, plan: plan.sort((a, b) => a[0] - b[0]).map(([t, k]) => [+t.toFixed(4), k]),
  };
}

// ---------- the level's own 3D (view.mjs's modeView hook; it runs for runner levels too) ----------
// 1. The books FALL INTO PLACE (Matt): every pile of books / manuscript slams down into its spot ON A BEAT, 1.5–2.5 beats
//    (0.55–0.9 s) before he gets there, on screen. Until it lands, its spot shows as a faint ghost of the pile — the exact
//    shape, from the moment it's on screen (S3: you see it coming ~1 s ahead). (The engine's own drop finished off screen,
//    where nobody saw it; this re-times it on the course's own piles.)
// 2. A missed beat leaves a stack teetering: land off the beat and the pile under him wobbles and settles.
// 3. Page nine's rubber stamps slam down on the beat ahead of him (the hazard is the stamp; the painter only marks its spot).
// 4. The search bar: a long thin bar over a hole. 5. The bridge: a blueprint over the skipped hole until V; then the girder
//    slams across and the contract pages stack onto it, landing just ahead of him as he runs it.
const FALL = 0.45, DROP = 3.6;                                                      // a pile's slam: beats, height
function bookView({ T, world, C }) {
  if (typeof document === 'undefined') return null;
  const beat = t => C.beatOf(t), tb = b => C.tOfBeat(b);
  const tAtX = x => { let a = -5, b = C.end + 10; for (let i = 0; i < 42; i++) { const m = (a + b) / 2; if (C.X(m) < x) a = m; else b = m; } return b; };
  const landAt = (ta, k = 1.5) => tb(Math.floor(beat(ta) - k));                     // on a beat, ≥ 1.5 beats before he reaches it
  const groups = world.children.filter(o => o.isGroup);
  const gOf = q => groups.find(g => Math.abs(g.position.x - q.x0) < 1e-3 && Math.abs(g.position.y - q.y1) < 1e-3);
  const chunks = [], hide = [];
  for (const q of C.solids) { if (q.kind !== 'block') continue; const g = gOf(q); if (!g) continue;
    if (q.cue === 'bridge' || q.cue === 'searchbar') { hide.push(g); continue; }
    for (const c of g.children) { if (!c.isGroup) continue; const pl = c.children[0], w = pl && pl.geometry && pl.geometry.parameters ? pl.geometry.parameters.width / 0.98 : 2;
      const x = q.x0 + c.position.x, ta = tAtX(x - w / 2 - 0.4), tot = pl && pl.geometry && pl.geometry.parameters ? pl.geometry.parameters.height : 10;
      const mats = c.children.map(m => m.material).filter(Boolean); for (const m of mats) m.transparent = true;
      chunks.push({ c, q, x, w, base: c.position.y, tl: landAt(ta), tot, mats, seed: rnd3(x, 1) }); } }
  const canvas = (w, h, f) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const tx = new T.CanvasTexture(cv); tx.colorSpace = T.NoColorSpace; return tx; };
  const plane = (tx, w, h, z = 0.62) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); m.position.z = z; return m; };
  // dust off a landing: little paper squares (one shared pool)
  const dust = Array.from({ length: 40 }, () => { const m = new T.Mesh(new T.PlaneGeometry(0.11, 0.08), new T.MeshBasicMaterial({ color: '#efe8d6', transparent: true, depthWrite: false })); m.visible = false; m.position.z = 0.7; world.add(m); return m; });
  let dustI = 0; const puffs = [];
  const puff = (x, y, t, n = 5) => { for (let i = 0; i < n; i++) { const m = dust[dustI++ % dust.length]; puffs.push({ m, x, y, t0: t, vx: (rnd3(t, i) - 0.5) * 3, vy: 1.2 + rnd3(t, i + 9) * 1.6 }); } };
  // ---- page nine's stamps ----
  const stampTex = canvas(128, 128, (x, w, h) => {
    x.fillStyle = '#7a4a22'; x.beginPath(); x.ellipse(w / 2, 22, 30, 18, 0, 0, 7); x.fill(); x.lineWidth = 5; x.strokeStyle = '#120a05'; x.stroke();          // the knob
    x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(w / 2 - 10, 16, 10, 5, -0.3, 0, 7); x.fill();
    x.fillStyle = '#5a3416'; x.fillRect(w / 2 - 11, 38, 22, 40); x.strokeStyle = '#120a05'; x.lineWidth = 5; x.strokeRect(w / 2 - 11, 38, 22, 40);              // the neck
    x.fillStyle = '#2b2b33'; x.fillRect(10, 78, w - 20, 22); x.strokeRect(10, 78, w - 20, 22);                                                                 // the mount
    x.fillStyle = '#c4352b'; x.fillRect(14, 100, w - 28, 20); x.strokeRect(14, 100, w - 28, 20);                                                               // the inked rubber
    x.fillStyle = '#8a1f18'; for (let i = 0; i < 5; i++) x.fillRect(22 + i * 18, 106, 10, 4); });
  const sealTex = canvas(128, 40, (x, w, h) => { x.strokeStyle = '#c4352b'; x.lineWidth = 5; x.globalAlpha = 0.85; x.beginPath(); x.ellipse(w / 2, h / 2, w / 2 - 6, h / 2 - 6, 0, 0, 7); x.stroke();
    x.lineWidth = 3; x.beginPath(); x.ellipse(w / 2, h / 2, w / 2 - 18, h / 2 - 13, 0, 0, 7); x.stroke(); });
  const stamps = C.hazards.filter(h => h.kind === 'word' && h.obj === 'rtStampMark').map(h => {
    const g = new T.Group(), m = plane(stampTex, 1.0, 1.0); m.position.y = 0.5; g.add(m); world.add(g);
    const seal = plane(sealTex, 1.0, 0.3, 0.47); seal.rotation.x = 0; seal.visible = false; world.add(seal);
    return { h, g, m, seal, x: (h.x0 + h.x1) / 2, ts: landAt(h.t, 1.6), up: null }; });
  // ---- the search bar ----
  const bars = C.solids.filter(q => q.cue === 'searchbar').map(q => { const w = q.x1 - q.x0, hh = 0.42;
    const tx = canvas(Math.min(1024, Math.round(w * 64)), 32, (x, W2, H2) => { x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(2, 2, W2 - 4, H2 - 4, 14); x.fill(); x.lineWidth = 3; x.strokeStyle = '#120a05'; x.stroke();
      x.strokeStyle = '#5a6070'; x.lineWidth = 3; x.beginPath(); x.arc(18, 15, 7, 0, 7); x.stroke(); x.beginPath(); x.moveTo(23, 20); x.lineTo(29, 26); x.stroke();      // the magnifier
      x.fillStyle = '#c9c1ae'; x.fillRect(40, 13, Math.min(220, W2 * 0.3), 5); });
    const g = new T.Group(), m = plane(tx, w, hh); m.position.set(w / 2, -hh / 2, 0.62); g.add(m);
    const caret = new T.Mesh(new T.PlaneGeometry(0.05, hh * 0.6), new T.MeshBasicMaterial({ color: '#120a05', transparent: true })); caret.position.set(Math.min(w - 0.3, 0.8 + 3.2), -hh / 2, 0.64); g.add(caret);
    g.position.set(q.x0, q.y1, 0); world.add(g); return { q, g, caret, tl: landAt(tAtX(q.x0 - 0.4), 1.6) }; });
  // ---- the bridge over the skipped hole ----
  const bridges = C.solids.filter(q => q.cue === 'bridge').map(q => { const w = q.x1 - q.x0;
    const blue = canvas(512, 48, (x, W2, H2) => { x.setLineDash([16, 10]); x.lineWidth = 4; x.strokeStyle = '#2f6fd6'; x.strokeRect(4, 4, W2 - 8, H2 - 8);
      x.setLineDash([]); x.lineWidth = 2; for (let k = 1; k < 8; k++) { x.beginPath(); x.moveTo(k * W2 / 8, 6); x.lineTo(k * W2 / 8 + 26, H2 - 6); x.stroke(); } });
    const girder = canvas(512, 48, (x, W2, H2) => { x.fillStyle = '#ff9a1f'; x.fillRect(0, 0, W2, 10); x.fillRect(0, H2 - 10, W2, 10); x.fillStyle = '#d9781a'; x.fillRect(0, 10, W2, H2 - 20);
      x.fillStyle = '#ffd08a'; x.fillRect(0, 0, W2, 3); x.fillStyle = '#7a4208'; for (let k = 12; k < W2; k += 28) { x.beginPath(); x.arc(k, 5, 2.5, 0, 7); x.arc(k, H2 - 5, 2.5, 0, 7); x.fill(); }
      x.strokeStyle = '#120a05'; x.lineWidth = 3; x.strokeRect(1, 1, W2 - 2, H2 - 2); });
    const pageTx = canvas(128, 24, (x, W2, H2) => { x.fillStyle = '#fbf7ec'; x.fillRect(1, 1, W2 - 2, H2 - 2); x.strokeStyle = '#120a05'; x.lineWidth = 2; x.strokeRect(1, 1, W2 - 2, H2 - 2);
      x.fillStyle = '#b9b2a0'; for (let r = 0; r < 3; r++) x.fillRect(8, 5 + r * 6, W2 - 30 - r * 14, 2); x.fillStyle = '#c4352b'; x.beginPath(); x.arc(W2 - 12, H2 / 2, 4, 0, 7); x.fill(); });
    const bp = plane(blue, w, 0.5, 0.6); bp.position.set(q.x0 + w / 2, q.y1 - 0.3, 0.6); world.add(bp);
    const gd = plane(girder, w, 0.42, 0.61); world.add(gd); gd.visible = false;
    const n = Math.max(2, Math.round(w / 1.35)), pw = w / n, pages = [];
    for (let i = 0; i < n; i++) { const m = plane(pageTx, pw * 1.04, 0.22, 0.63); m.visible = false; world.add(m); const x = q.x0 + (i + 0.5) * pw; pages.push({ m, x, ta: tAtX(x - pw / 2 - 0.4), tl: null }); }
    return { q, w, bp, gd, pages, gl: null }; });
  let lastLand = null, teeter = null;
  return {
    draw(f) { const { s, t, cx, span, kick, sim } = f;
      for (const g of hide) g.visible = false;
      // a missed beat: the pile he landed on teeters
      if (s.landedAt != null && s.landedAt !== lastLand) { lastLand = s.landedAt; if (!s.perfectLand && s.on) { const ch = chunks.find(k => k.q === s.on && Math.abs(k.x - s.x) <= k.w / 2 + 0.4); if (ch) teeter = { ch, t0: t }; } }
      for (const k of chunks) { if (Math.abs(k.x - cx) > span * 0.75) continue;
        const u = (t - k.tl) / C.P; let off = 0, rot = 0;
        const ghost = u < -FALL; k.mats.forEach((m, i) => { m.opacity = ghost ? (i ? 0.7 : 0.3) : 1; });   // not landed yet: a ghost of the pile, in place
        if (!ghost && u < 0) { const e = 1 + u / FALL; off = DROP * (1 - e * e); rot = (k.seed - 0.5) * 0.25 * (1 - e); }
        else if (u < 0.6) { off = -0.09 * Math.sin(u / 0.6 * Math.PI); if (!k.thud) { k.thud = true; if (Math.abs(k.x - cx) < span * 0.6) puff(k.x, k.q.y1, t, 4); } }
        if (u < 0) k.thud = false;
        if (teeter && teeter.ch === k) { const a = t - teeter.t0; if (a < 1.0) rot += 0.05 * Math.sin(a * 24) * Math.exp(-a * 3.5); else teeter = null; }
        k.c.position.y = k.base + off; k.c.rotation.z = rot; }
      for (const p of puffs) { const a = t - p.t0; if (a < 0 || a > 0.6) { p.m.visible = false; continue; } p.m.visible = true; p.m.position.set(p.x + p.vx * a, p.y + 0.05 + p.vy * a - 4 * a * a, 0.7); p.m.rotation.z = a * 9 * (p.vx > 0 ? 1 : -1); p.m.material.opacity = 1 - a / 0.6; }
      while (puffs.length > 60) puffs.shift();
      // page nine's stamps: raised, SLAM on the beat, sit; lift off once he's by, leaving the seal
      for (const S of stamps) { const vis = Math.abs(S.x - cx) < span; S.g.visible = vis; if (!vis) { S.seal.visible = false; continue; }
        const u = (t - S.ts) / C.P, by = S.h.y0; let off = 0, sq = 1;
        if (u < -0.4) off = 2.8 + 0.06 * Math.sin(t * 5 + S.x);
        else if (u < 0) { const e = 1 + u / 0.4; off = 2.8 * (1 - e * e); }
        else if (u < 0.5) sq = 1 - 0.14 * Math.sin(u / 0.5 * Math.PI);
        const past = s.x - S.h.x1; if (past > 1.2) { S.up ??= t; const a = Math.min(1, (t - S.up) / 0.3); off = 3.2 * a * a; } else S.up = null;
        S.g.position.set(S.x, by + off, 0); S.m.scale.y = sq; S.m.position.y = 0.5 * sq;
        S.seal.visible = u > 0; S.seal.position.set(S.x, by + 0.05, 0.47); if (u > 0 && u < 0.3 && !S.inked) { S.inked = true; puff(S.x, by, t, 6); } if (u < 0) S.inked = false; }
      // the search bar drops in like the books, its caret blinking on the beat
      for (const Bq of bars) { const u = (t - Bq.tl) / C.P; Bq.g.visible = Math.abs(Bq.q.x0 - cx) < span + 4; Bq.g.children[0].material.opacity = u < -FALL ? 0.25 : 1;
        Bq.g.position.y = Bq.q.y1 + (u < -FALL ? 0 : u < 0 ? DROP * (1 - (1 + u / FALL) ** 2) : u < 0.6 ? -0.07 * Math.sin(u / 0.6 * Math.PI) : 0); Bq.caret.visible = u > 0 && Math.floor(f.b * 2) % 2 === 0; }
      // the bridge: blueprint → V → the girder slams across → the pages stack on it, each landing ahead of him
      for (const Bd of bridges) { const q = Bd.q, on = Math.abs(q.x0 + Bd.w / 2 - cx) < span + Bd.w / 2, used = sim.answered(q, t) ? s.used.construction ?? s.used.singularity : null;
        Bd.bp.visible = on && used == null; if (Bd.bp.visible) Bd.bp.material.opacity = 0.45 + 0.4 * kick;
        if (used == null) { Bd.gl = null; Bd.gd.visible = false; for (const p of Bd.pages) p.m.visible = false; continue; }
        if (Bd.gl == null) { Bd.gl = Math.max(used + 0.08, tAtX(q.x0 - span * 0.7)); for (const [i, p] of Bd.pages.entries()) { const want = tb(Math.ceil(beat(Bd.gl) * 2 + 1 + i) / 2); p.tl = Math.max(Bd.gl + 0.05, Math.min(want, p.ta - 0.45)); } }
        const a = t - Bd.gl; Bd.gd.visible = on && a > -0.12; if (Bd.gd.visible) { const e = Math.min(1, (a + 0.12) / 0.12); Bd.gd.position.set(q.x0 + Bd.w / 2, q.y1 - 0.42 + (1 - e * e) * 5, 0.61); }
        if (a >= 0 && a < 0.04 && !Bd.boomed) { Bd.boomed = true; for (let i = 0; i < 8; i++) puff(q.x0 + Bd.w * rnd3(i, 3), q.y1 - 0.2, t, 2); } if (a < 0) Bd.boomed = false;
        for (const p of Bd.pages) { const b2 = t - p.tl; p.m.visible = on && b2 > -0.2; if (!p.m.visible) continue; const e = Math.min(1, (b2 + 0.2) / 0.2);
          p.m.position.set(p.x, q.y1 - 0.11 + (1 - e * e) * 3, 0.63); p.m.rotation.z = (1 - e) * (rnd3(p.x, 2) - 0.5) * 1.2; } }
    },
  };
}
function rnd3(a, b) { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); }
