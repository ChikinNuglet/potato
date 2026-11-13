// ci-factory.mjs — the shared tables for Confidently Incorrect, THE FACT FACTORY (plan: game/stories/confidently-incorrect.factory-plan.md v2).
// The level (confidently-incorrect.mjs), its music video (story-confidently-incorrect.mjs) and the bot all read these, so the
// story and the course can never drift apart. Everything is in song seconds.

// ---- the switch between the two build stages (plan §5) ----
// VIDEO = true: stage 1, the music video. He can't die, floors only (no vats, no hazards); the story layer plays every press
// itself (the crates, presses, gates and pads are painted set dressing and he hops / ducks / glitches them on the word).
// VIDEO = false: stage 2, the course from §3 is laid on and the player's presses drive the same story.
export const VIDEO = false;
// where build() put each course piece (world x), so the painted crates / presses / gates / vats sit exactly on the hitboxes:
// PLACE[i] = { x0, x1, gy } for COURSE[i]; HOLES = [{ x0, x1, gy, what }] (the vats carved out of the floors)
export const PLACE = [], HOLES = [];

// ---- THE REBUILD (Nov 12): Quality Control's plan the crew's own notes, built and measured by team Dry Stamp.
// Chikin, Nov 11: "this is boring...the whole level has nothing to jump over". Every part of the rebuild is ONE SWITCH here:
// set it false and that part plays as it did before (the old rows are all still in the tables below). To try one off without
// an edit: the page takes ?ci_off=pallets,vats (or ?ci_off=all), the tools take CI_OFF=pallets,vats. Report + numbers:
// levels/confidently-incorrect/REBUILD-REPORT.md.
const RB_Q = (k) => { try { if (typeof process !== 'undefined' && process.env && process.env['CI_' + k.toUpperCase()]) return process.env['CI_' + k.toUpperCase()].split(',');
  if (typeof location !== 'undefined') return (new URLSearchParams(location.search).get('ci_' + k) || '').split(','); } catch (e) {} return []; };
const RB_OFF = RB_Q('off'), RB_ON = RB_Q('on'), sw = (name, dflt = true) => RB_ON.includes(name) ? true : RB_OFF.includes('all') || RB_OFF.includes(name) ? false : dflt;
export const REBUILD = {
  videoStickers: sw('videoStickers'),   // (Chikin, Nov 12 night: "thats what drives this one... just get the stickers" / "the stickers give the background movement") the wall follows the YouTube video: every sticker in it, one at a time, big and solid, each until the next one pushes it off, with the video's rubber stamps and sign plates. Table: ci-video-stickers.mjs (generated from confidently-incorrect/VIDEO-STICKERS.md). false = the sticker rework's short see-through ones.
  kevinKnock: sw('kevinKnock'),   // (Chikin, Nov 12 night: "kevins crate sticks around for waaaaay tooo long" / "it should just get knocked off the track" / "he sticks around with that speech bubble for the whole video") about six seconds after the lid shuts, the crate is clipped and tumbles off the belt. His screen goes back to its corner and only shows when a message comes. false = it rides to the end as before.
  crownOut: sw('crownOut'),       // (Chikin, Nov 12, D-20261112-28: "yes", take the crown out) no cardboard crown lowered onto his hard hat at 3:29 and none worn after it: an old-story prop. The crate on that beat is drawn as an ordinary crate. The lyric's own crown sticker on "king" is a sticker and stays.
  bigCrates: sw('bigCrates'),     // the crate you hop: 0.9 wide x 0.72 high and SOLID at that size (was 0.6 x 0.55, killing only in a 0.48 middle); drawn 1.1 x 1.0
  solidCrates: sw('solidCrates'), // …and it ends a go anywhere on that box. false = it looks big but only its 0.48 middle counts, as forgiving as before (late players: see the report)
  pallets: sw('pallets'),         // the belt changes height: five pallets (1.0 high, made of shipped crates) he hops up onto and runs along
  vats: sw('vats'),               // vats 3 -> 7: a new one at 33.58, a gap in the catwalk at 82.69, leap vats at 138.45 + 164.58; spaghetti + stew wider
  lesson: sw('lesson'),           // the first half-minute teaches one move at a time (five rows out, the belt stalls before the first gate)
  quiet: sw('quiet'),             // nothing to press while Kevin or Mom is talking (51.16, 144.84, 170.99, 171.83, 228.22 out; the 226.96 stack is one crate)
  spacing: sw('spacing'),         // four rows that broke the file's own spacing rule come out (88.77, 186.59, 216.53, 238.30)
  blankFact: sw('blankFact'),     // the one true thing is the only blank thing: no FACT label, and it is the one jam Space does not clear (the crawl runs on to 234.90)
  retry: sw('retry'),             // 23 retry points (was 17) and a death is sent back to a point 1.0 s before it (was 1.5 s)
  poPad: sw('poPad'),             // the first pad takes a press on "PO" (62.65): its window is +-0.35 s (was +-0.2)
  dropIn: sw('dropIn'),           // crates, press heads and gates land on the belt on a beat, two beats before their press (the story file)
  stumble: sw('stumble'),         // Kevin's typing stumble at the desk (Nippl, backspace, the word again)
  momTimes: sw('momTimes'),       // "who was caesar" sent as the belt stalls; "kevin, dinner" typed faster; "kevin??" 0.9 s later, after the sticker (ESTIMATED times)
  proud: sw('proud'),             // his face in the first half-minute is proud, not a smirk (a smirk now means: just got past a checker)
  kevinAhead: sw('kevinAhead'),   // Kevin's crate rides AHEAD of Potato with his own sign-off as its label (was: FRAGILE, towed behind him)
  stickerTable: sw('stickerTable'),   // the wall stickers read the curated table below (once per name, 0.85 s each, bare wall in the five quiet windows)
  stickerRework: sw('stickerRework'),   // THE STICKER REWORK (second pass, Chikin Nov 12): every sticker ONCE, on its own sung word, a short hit; Bezos + Einstein back on the wall (D-20261103-57); false = the first pass's table
  eagleArt: sw('eagleArt'),       // (Chikin, Nov 12: "if you can make a better little eagle asset, thats best, something that looks better than the little hand scribble ones") the rechargeable eagles are the video's own eagle (play/stickers-ci2/eagle.webp, cut from the YouTube video at 2:15, no white border); false = the hand-drawn ones
  beltArt: sw('beltArt'),         // seven crates carry their own sticker as the thing he jumps (yak, toaster, gary, walnut, rockets, hurricane, narrator)
};
const R = REBUILD;

export const P = 0.5925, OFF = 0.1481;            // the song's beat (map.period / map.offset)
export const END = 248.3, PREROLL = 14;

// ---- the floors (§3.1 "one floor at any x"): [t0, t1, top y] in song time; x = C.X(t) ----
export const F1 = 0, F2 = 4, F3 = 8, SUMMIT = 8.4, ROOF = 12.4;
export const FLOORS = [
  [-15.0, 63.10, F1],          // the desk / the laptop's taskbar, then belt #1 (F1)
  [63.88, 85.07, F2],          // the catwalks (F2)
  [85.60, 97.95, F1],          // the drop: back on F1
  [98.42, 129.40, F2],         // the second wing (F2)
  [129.90, 175.09, F3],        // the upper floor (F3)
  [175.40, 194.16, F2],        // after the socket dive (F2)
  [200.36, 207.00, SUMMIT],    // the summit of EVEREST
  [207.52, 252.0, ROOF],       // the roof gantry
];
// stacked ledges (crates / layers he climbs): [t0, t1, top, what]
export const LEDGES = [
  ...[0, 1, 2, 3, 4, 5].map(k => [41.62 + k * P + 0.3, k < 5 ? 41.62 + (k + 1) * P + 0.3 : 45.18, 0.5 * (k + 1), 'para']),   // C12: the ¶ staircase
  [60.88, 61.47, 0.8, 'ledge'], [61.47, 63.10, 1.6, 'pad'],                                                            // C19, C20: stairs to the stage + the pad
  [153.12, 153.79, 8.6, 'chart'], [153.79, 154.37, 9.2, 'chart'], [154.37, 154.70, 9.8, 'chart'],                      // C65: the bar-chart printer
  [194.16, 194.96, 5.1, 'bread'], [194.96, 195.66, 6.2, 'lettuce'], [195.66, 197.63, 7.3, 'mountain'],   // (edges press + 0.35: a regular player's late hop still clears the layer)                  // C89-C91: EVEREST, the sandwich
  [197.63, 200.36, 7.3, 'meat'],                                                                                       // C92: the wobbling deli meat (pump)
  [235.47, 236.60, 13.4, 'brim'],                                                                                      // C112: Cornelius's hat brim
  // REBUILD: the pallets (1.0 above their floor; the edge sits 0.30 s after the step press; he leaves by running off the end or leaping a vat)
  ...(R.pallets ? [[20.68, 25.60, 1.0, 'pallet'], [50.52, 55.18, 1.0, 'pallet'], [123.34, 127.00, 5.0, 'pallet'], [132.21, 138.53, 9.0, 'pallet'], [160.57, 164.66, 9.0, 'pallet']] : []),
];
// the launches (§3.5): ↑ on the pad in its window and the shipment carries him up a floor. [press t, from y, to y, air]
export const LAUNCHES = [[62.953, 1.6, F2, 1.85, R.poPad ? 0.35 : 0.2], [97.83, F1, F2, 1.185], [129.313, F2, F3, 1.185], [206.931, SUMMIT, ROOF, 1.185]];
export const CHUTES = [[85.07, F2, F1], [175.09, F3, F2]];

// ---- the course (§3.4): [press time, kind, label, extra] — kind: low ↑ · high ↓ · wall Space · hole ↑ (a vat) · dbl ↑↑ ·
// step ↑ (a ledge) · pad ↑ (launch) · chute (a fall, no press) · crumble · fake · dormant (Space) · orb · hurdle · pump.
// Labels are only Chikin's hallucination products or '' (no hazard ever carries the sung line).
const BASE = [
  [18.42, 'low', '', 'fanny'], [21.69, 'low', ''], [24.03, 'low', 'YAK', 'yak'], [24.78, 'wall', '', 'qc'],
  [26.79, 'low', ''], [30.93, 'high', '', 'cabbage'], [33.58, 'low', ''], [34.86, 'low', ''], [37.43, 'low', '', 'toaster'],
  [40.78, 'wall', '', 'laurel'],
  ...[0, 1, 2, 3, 4, 5].map(k => [+(41.62 + k * P).toFixed(3), 'step', '', 'para']),
  [49.15, 'low', 'DR. GARY', 'gary'], [50.22, 'low', ''], [52.74, 'low', '', 'roadsign'], [55.10, 'hole', 'QUANTUM SPAGHETTI', 'spaghetti'], [57.18, 'low', ''],
  [59.82, 'wall', '', 'barcode'], [60.58, 'step', '', 'ledge'], [61.17, 'step', '', 'ledge'], [62.953, 'pad', '', 'tube'],
  [65.30, 'low', '', 'screw'], [66.22, 'low', '', 'screw'], [66.92, 'stack', '', 'bigscrew'], [69.27, 'hole', 'STEW', 'stew'], [70.84, 'low', '', 'walnut'],
  [74.62, 'wall', '', 'captain'], [77.00, 'crumble', '', 'wheel'], [77.59, 'crumble', '', 'wheel'], [78.18, 'crumble', '', 'wheel'],
  [79.50, 'low', '', 'awning'], [80.53, 'low', '', 'mailbox'], [82.69, 'low', ''], [84.25, 'high', '', 'piston'], [85.07, 'chute', ''],
  [87.64, 'low', ''], [88.77, 'high', ''], [90.02, 'stack', ''], [91.65, 'dbl', '', 'vat'], [91.98, 'dbl2', ''],
  [93.17, 'fake', '', 'fake'], [93.76, 'fake', '', 'fake'], [94.35, 'fake', '', 'fake'], [94.94, 'fake', '', 'fake'],
  [96.09, 'dormant', '', 'professor'], [97.83, 'pad', '', 'tube'],
  [99.60, 'low', ''], [101.97, 'high', ''], [103.46, 'low', ''], [104.24, 'high', ''],
  [105.18, 'orb', '', 'eagles'], [108.10, 'wall', '', 'stop'], [109.08, 'low', '', 'spat'], [110.66, 'low', '', 'chimichanga'], [111.79, 'high', ''],
  [113.89, 'low', ''], [115.09, 'wall', '', 'inspector'], [116.58, 'low', ''],
  [118.90, 'crumble', '', 'paper'], [119.73, 'crumble', '', 'paper'], [120.42, 'crumble', '', 'paper'], [121.05, 'high', '', 'triple', 121.60],
  [123.04, 'low', ''], [125.98, 'high', ''], [129.313, 'pad', '', 'granola'],
  [131.91, 'low', ''], [132.79, 'high', ''], [134.97, 'low', ''], [135.86, 'high', ''], [139.45, 'low', ''],
  [141.86, 'low', ''], [143.80, 'stack', '', 'overflow'], [147.82, 'wall', '', 'kevin'],
  [150.23, 'high', '', 'cloud'], [151.13, 'high', '', 'knot'], [152.82, 'step', '', 'chart'], [153.49, 'step', '', 'chart'], [154.07, 'step', '', 'chart'],
  [157.20, 'wall', '', 'binder'], [160.27, 'low', ''], [161.40, 'low', ''], [162.73, 'high', ''], [163.78, 'low', ''],
  [166.20, 'low', '', 'gremlin'], [167.98, 'low', '', 'gremlin'], [168.65, 'wall', '', 'gremlin2'], [173.35, 'low', '', 'rockets'], [175.09, 'chute', ''], [177.27, 'wall', '', 'socket'],
  [178.92, 'low', ''], [179.59, 'high', ''], [180.90, 'low', ''], [181.85, 'wall', '', 'flag'], [182.79, 'low', ''], [183.99, 'low', '', 'hurricane'],
  [184.80, 'high', ''], [185.96, 'hurdle', '', 'raccoon'], [186.59, 'high', ''], [187.39, 'low', ''], [189.89, 'high', '', 'lamp'], [191.40, 'wall', '', 'factcheck'],
  [193.81, 'step', '', 'bread'], [194.60, 'step', '', 'lettuce'], [195.30, 'step', '', 'mountain'], [199.99, 'step', '', 'summit'],
  [206.931, 'pad', '', 'roof'], [208.78, 'low', ''], [209.83, 'low', '', 'crown'], [210.82, 'high', ''], [213.89, 'wall', '', 'bubble'],
  [215.89, 'low', ''], [217.14, 'pump', '', 'bot'], [217.87, 'pump', '', 'bot'], [218.58, 'pump', '', 'bot'],
  [221.54, 'high', ''], [222.31, 'low', ''], [222.97, 'high', ''], [224.23, 'high', '', 'vent'], [225.03, 'stack', '', 'reactor'],
  [229.83, 'high', ''], [230.49, 'low', '', 'hats'], [231.30, 'wall', '', 'shutters'],
  [233.56, 'wall', 'FACT', 'fact'], [235.17, 'step', '', 'brim'], [237.70, 'low', ''], [238.30, 'high', '', 'beam'], [239.12, 'low', ''], [239.94, 'high', '', 'beam'], [240.71, 'low', ''],
];
// THE REWORK (Nov 2 night, plan: stories/confidently-incorrect.rework-nov2.md §1). Chikin: "the setting works, but the game is not good" /
// "this is boring...the whole level has nothing to jump over". The course above stays (its set pieces, vats, jams, launches);
// these rows fill the dead stretches on sung words so every section has something to do, building to the peak:
// L = a crate (↑), H = a press head (↓), 'stack' = two crates high (↑ then ↑ again in the air: the new piece, this level only).
// Spacing rules used: ↑→↑ ≥ 0.66 s (a hop lasts a beat), ↑→↓ ≥ 0.66, ↓→↑ ≥ 0.62, a stack needs ~1 s after it; nothing inside a
// crawl, a launch, a chute or the stall on "Kevin?"; every retry point keeps ≥ 1.2 s to its next press.
const L = (t, what = '') => [t, 'low', '', what], Hd = (t, what = '') => [t, 'high', '', what], ST = (t, what = '') => [t, 'stack', '', what];
const ADD = [
  // the belt + verse 1a (Chikin's note at 12.8: the belt starts with crates; control from 13.4, the first one on "psychopath")
  L(15.89), L(16.94, 'silicon'), Hd(19.25), L(20.38), L(27.92, 'possum'), Hd(28.92), L(30.00), L(32.70), Hd(36.06), L(38.34),
  // verse 1b: the first STACK on "RadioShack", then ↑↓ alternation
  ST(46.54, 'electronics'), Hd(48.32), Hd(51.16), L(51.83), Hd(53.70), L(56.36),
  // the hook + the quiet
  Hd(68.40), L(72.72),   // (the quiet is a rest that still plays: 71.68 / 70.02 taken out again so the curve dips before the rant)
  // the rant: the first burst
  Hd(81.40), L(83.45),
  // verse 2a
  L(102.60), L(117.46),
  // verse 2b: "Metacognitive, probabilistic, neuro-symbolic" = three presses, one per word
  Hd(124.13), L(125.10), L(126.75), L(133.53), Hd(136.61), Hd(137.44), L(138.45), L(142.54),
  // lift A / lift B ("my mistake, you're a different gremlin": the 3rd gremlin is an inspector, Space not ↑)
  L(151.77), L(155.27), ST(158.50, 'fire'), L(164.58), Hd(165.35), L(169.48), Hd(170.23), L(170.99), Hd(171.83), L(172.57),
  // verse 3
  L(188.69), L(196.38), L(201.13),
  // the peak (review fix: the stack, the newest move, comes back here: stack → duck → glitch on PROFESSOR OF "HOLD ON", stack → duck
  // on POWER / MALFUNCTIONING, a stack on the second HALF; 211.60 / 212.43 / 220.64 / 225.03 / 226.96 single crates became stacks)
  ST(211.60, 'professor'), Hd(213.20), L(216.53), Hd(219.45), ST(220.64, 'impostor'), Hd(225.95), ST(226.96, 'narrator'), L(228.22), L(229.15),
  // (rework pass 2: the open beats left, each checked against the spacing rules above and the retry points: "fax", after the QC
  //  gate, the cabbage, before the spaghetti vat, "DOI", after the stew, the eagles' landing, the overflow, lift B, the summit, MIT)
  L(22.86, 'fax'), L(25.55), L(31.60), L(54.36), L(109.87), L(144.84), L(162.07), L(197.06),
];
// REBUILD: the plan's change list, as rows taken out (CUT) and rows changed (SWAP) by their press time. Nothing above is edited.
const CUT = new Set([
  ...(R.lesson ? [19.25, 25.55, 27.92, 31.60, 38.34] : []),                  // the lesson: one move at a time
  ...(R.quiet ? [51.16, 144.84, 170.99, 171.83, 228.22] : []),                // still thumbs while Kevin and Mom talk
  ...(R.spacing ? [88.77, 186.59, 216.53, 238.30] : []),                      // closer than the spacing rules above allow
  ...(R.pallets ? [54.36, 165.35] : []),                                      // the last thing before a leap off a pallet / the first after it
]);
const SWAP = {
  ...(R.pallets ? Object.fromEntries([20.38, 50.22, 123.04, 131.91, 160.27].map(t => [t, [t, 'step', '', 'pallet']])) : {}),
  ...(R.vats ? { 33.58: [33.58, 'hole', '', 'vat'], 82.69: [82.69, 'hole', '', 'catwalk', 0.30], 138.45: [138.45, 'hole', '', 'vat', 0.42], 164.58: [164.58, 'hole', '', 'vat', 0.42],   // (the plan said 0.30: run, a missed leap off a 1.0-high pallet simply sailed over a 0.30 s vat and landed. 0.42 is the first width where no press means the vat)
   
    55.10: [55.10, 'hole', 'QUANTUM SPAGHETTI', 'spaghetti', 0.36], 69.27: [69.27, 'hole', 'STEW', 'stew', 0.36] } : {}),
  ...(R.quiet ? { 226.96: L(226.96, 'narrator') } : {}),
  ...(R.blankFact ? { 233.56: [233.56, 'wall', '', 'fact'] } : {}),
};
// REBUILD: the stickers that tell the story (Quality Control's Story seat). [tapped word time, name, 'w' wall (big, see-through) |
// 'b' belt (the sticker is the thing he jumps: its crate carries it)]. Once per name in the whole level, each for STK.life seconds;
// none in the quiet (71.3-74.6), chorus 1 (86.2-97.3), the stall (142.6-148.3, where only Kevin's own sticker shows), the still
// (199.9-206.9) or from 232.2 to the end. ci-stickers.mjs (generated) stays the full pool. (einstein + bezos are in the table as the
// plan wrote it; in pass 1 the story file still left both off the wall. The gremlin slot at 165.66 is held empty. This is the FIRST
// pass's table: the sticker rework below replaces it when REBUILD.stickerRework is on.)
export const STK = { life: 0.85, tIn: 0.10, tOut: 0.20, a: 0.55 };
const STICKERS_PASS1 = [
  [16.51, 'acrobat', 'w'], [17.56, 'fanny-pack', 'w'], [22.05, 'einstein', 'w'], [22.91, 'fax', 'w'], [23.79, 'yak', 'b'], [27.5, 'possum', 'w'],
  [30, 'citations', 'w'], [30.93, 'cabbage', 'w'], [34.86, 'goblin', 'w'], [37.43, 'toaster', 'b'], [39.59, 'caesar', 'w'], [40.36, 'bezos', 'w'],
  [45.63, 'ferret', 'w'], [46.54, 'electronics', 'w'], [49.15, 'gary', 'b'], [51.83, 'university', 'w'], [54.8, 'spaghetti', 'w'],
  [56.36, 'linguini', 'w'], [57.7, 'doi', 'w'], [60.7, 'cliff', 'w'],
  [64.52, 'authority', 'w'], [66.33, 'screw', 'w'], [68.73, 'stew', 'w'], [70.84, 'walnut', 'b'], [74.62, 'forehead', 'w'], [77, 'statistics', 'w'],
  [79.5, 'restaurant', 'w'], [80.53, 'zip-code', 'w'], [82.69, 'station', 'w'],
  [105.31, 'napoleon', 'w'], [107.76, 'ego', 'w'], [110.13, 'chimichanga', 'w'], [116.25, 'evidence', 'w'], [118.34, 'stephanie', 'w'], [122.33, 'shield', 'w'],
  [129.46, 'granola', 'w'], [131.62, 'silicon', 'w'], [132.46, 'steroids', 'w'], [134.97, 'weapon', 'w'], [135.86, 'neural', 'w'], [141.86, 'peru', 'w'],
  [158.5, 'fire', 'w'], [160.71, 'incorrect', 'w'], [170.23, 'earbuds', 'w'],
  [173.05, 'rockets', 'b'], [175.71, 'hot-pockets', 'w'], [180.14, 'orthodontics', 'w'], [180.9, 'dolphin', 'w'], [183.99, 'hurricane', 'b'],
  [187.12, 'knowledge', 'w'], [193.81, 'everest', 'w'], [195.84, 'taxonomy', 'w'],
  [214.6, 'bots', 'w'], [217.87, 'franklin', 'w'], [219.23, 'calculator', 'w'], [225.2, 'reactor', 'w'], [227.26, 'narrator', 'b'],
  [230.74, 'helmet', 'w'], [231.3, 'browser', 'w'],
];
// THE STICKER REWORK (second pass, Nov 12). Chikin: "man confidently was supposed to have a sticker rework remember / jeff bezos and
// the rest" · "there were stickers created for each of the keywords" · "they shouldnt be reusing the stickers, one joke and done" ·
// "the stickers are hanging around too long, and some of them dont make sense". So: every sticker in the song's set
// (play/stickers-ci2) appears ONCE, on the word it is a picture of (times are the word's own time in words/confidently-incorrect.json;
// pass 1 kept twelve on a neighbouring word), for STK.life seconds, one on the wall at a time, none while Mom types.
// BEZOS and EINSTEIN are ON (D-20261103-57, Chikin Nov 3: "google says were good with bezos / its exactly what we have been doing":
// in-game only, tied to the lyric, never labelled with his name; it revises D-20261102-08, the "never Bezos" note). The gremlin stays
// out (a look-alike; no original yet). cornelius (never used before) is on his word. The older Potato-pose set (play/stickers-ci) is
// not used: the only Potato is the one you play.
const STICKERS_REWORK = [
  [15.57, 'silicon', 'w'], [16.94, 'acrobat', 'w'], [18.21, 'fanny-pack', 'w'], [22.05, 'einstein', 'w'], [22.91, 'fax', 'w'], [24.03, 'yak', 'b'],
  [27.92, 'possum', 'w'], [30.00, 'citations', 'w'], [31.31, 'cabbage', 'w'], [34.86, 'goblin', 'w'], [37.43, 'toaster', 'b'], [39.59, 'caesar', 'w'], [40.36, 'bezos', 'w'],
  [45.63, 'ferret', 'w'], [46.54, 'electronics', 'w'], [49.15, 'gary', 'b'], [51.83, 'university', 'w'], [55.10, 'spaghetti', 'w'], [57.18, 'linguini', 'w'], [58.98, 'doi', 'w'],
  [64.52, 'authority', 'w'], [66.92, 'screw', 'w'], [69.27, 'stew', 'w'], [70.84, 'walnut', 'b'], [74.96, 'forehead', 'w'], [79.50, 'restaurant', 'w'], [80.53, 'zip-code', 'w'],
  [82.32, 'station', 'w'], [85.80, 'cliff', 'w'],
  [105.31, 'napoleon', 'w'], [110.66, 'chimichanga', 'w'], [118.34, 'stephanie', 'w'], [130.19, 'granola', 'w'], [132.79, 'steroids', 'w'], [134.97, 'weapon', 'w'], [141.86, 'peru', 'w'],
  [152.82, 'statistics', 'w'], [158.50, 'fire', 'w'], [169.23, 'neural', 'w'], [170.23, 'earbuds', 'w'], [173.35, 'rockets', 'b'], [174.56, 'evidence', 'w'], [177.76, 'hot-pockets', 'w'],
  [180.14, 'orthodontics', 'w'], [180.90, 'dolphin', 'w'], [183.99, 'hurricane', 'b'], [187.12, 'knowledge', 'w'], [189.89, 'shield', 'w'], [193.81, 'everest', 'w'], [195.84, 'taxonomy', 'w'],
  [210.82, 'incorrect', 'w'], [217.14, 'bots', 'w'], [218.16, 'franklin', 'w'], [219.45, 'calculator', 'w'], [222.31, 'ego', 'w'], [225.20, 'reactor', 'w'], [227.58, 'narrator', 'b'],
  [230.74, 'helmet', 'w'], [231.30, 'browser', 'w'], [235.43, 'cornelius', 'w'],
];
// the word each one is on (for the report's table, and so the next reader can check the match)
export const STICKER_WORDS = { silicon: 'silicon', acrobat: 'acrobat', 'fanny-pack': 'fanny (pack)', einstein: 'Einstein', fax: 'fax', yak: 'yak', possum: 'possum', citations: 'citations', cabbage: 'cabbage',
  goblin: 'goblin', toaster: 'toaster', caesar: 'Caesar', bezos: 'Jeff (Bezos)', ferret: 'ferret', electronics: 'RadioShack', gary: 'Gary', university: 'University', spaghetti: 'spaghetti', linguini: 'Linguini',
  doi: 'hell-no (the DOI number)', authority: 'authority', screw: 'screw', stew: 'stew', walnut: 'walnut', forehead: 'Forehead', restaurant: 'restaurants', 'zip-code': 'ZIP (code)', station: 'station', cliff: 'cliff',
  napoleon: 'Napoleon', chimichanga: 'chimichanga', stephanie: 'Stephanie', granola: 'granola', steroids: 'steroids', weapon: 'weaponized', peru: 'Peru', statistics: 'statistic', fire: 'fire', neural: 'neural',
  earbuds: 'earbuds', rockets: 'rockets', evidence: 'evidence', 'hot-pockets': 'Hot (Pockets)', orthodontics: 'orthodontics', dolphin: 'dolphin', hurricane: 'hurricane', knowledge: 'knowledge', shield: 'defensive',
  everest: 'Everest', taxonomy: 'taxonomy', incorrect: 'incorrect', bots: 'bots', franklin: 'Franklin', calculator: 'calculator', ego: 'ego', reactor: 'reactor', narrator: 'narrator', helmet: 'helmet', browser: 'browser', cornelius: 'Cornelius' };
export const STICKERS = R.stickerRework ? STICKERS_REWORK : STICKERS_PASS1;
export const COURSE = [...BASE, ...ADD].filter(r => !CUT.has(r[0])).map(r => SWAP[r[0]] || r).sort((a, b) => a[0] - b[0]);
export const STACK_H = 1.7, STACK_AIR = 0.25, STACK_MID = 0.5;   // the stack: 1.7 high (a hop peaks at ~1.5), the air jump 0.25 s in, its middle met 0.5 s in
export const UP_KINDS = new Set(['low', 'hole', 'dbl', 'step', 'pad', 'crumble', 'fake', 'orb', 'hurdle', 'pump', 'stack']);
// what a cleared press ships (§3.4 "What each kind does to the story"): crates/vats/ledges stamped + shipped
export const SHIPS = new Set(['low', 'hole', 'dbl', 'step', 'crumble', 'fake', 'pump', 'hurdle', 'high', 'stack']);

// ---- speed (§3.3) ----
export const SECTIONS = [['laptop', -14, 0], ['belt', 12.8, 0.5], ['verse', 14.37, 1.0], ['hook', 58.0, 1.04], ['quiet', 68.88, 1.04], ['rant', 78.95, 1.06],
  ['chorus1', 86.20, 1.08], ['verse2', 97.32, 1.06], ['liftA', 147.09, 1.10], ['liftB', 160.90, 1.12], ['verse3', 170.79, 1.12], ['peak', 206.34, 1.15],
  ['cornelius', 232.41, 0.95], ['mit', 236.90, 1.15], ['outro', 241.89, 0]];
// (stage 2: every jam crawl now ends just AFTER its gate — the glitch through it restarts the belt — instead of a moment before
//  it, so the gate is never met in the same instant the belt speeds up; the breath ends 0.56 s before the Nature Valley pad)
export const BOOSTS = [...(R.lesson ? [[24.40, 25.23, 0.35, 'jam']] : []), [39.30, 41.23, 0.30, 'jam'], [59.00, 60.27, 0.35, 'jam'], [73.50, 75.07, 0.35, 'jam'], [114.20, 115.54, 0.35, 'jam'], [127.30, 128.75, 0.30, 'breath'],
  [146.71, 148.27, 0.30, 'jam'], [156.00, 157.65, 0.30, 'jam'], [175.19, 176.75, 0.15, 'dark'], [176.75, 178.33, 0.32, 'dark'], [190.20, 191.85, 0.30, 'jam'], [203.60, 206.20, 0.10, 'still'],
  [232.69, R.blankFact ? 234.90 : 234.01, 0.30, 'jam']].map(([t0, t1, k, why]) => ({ t0, t1, k, why }));
// (stage 2: each point checked by a script — standing on a plain floor, ≥ 1.2 s to the next press, the demo wins from it — and
//  nudged to the nearest moment that is; the plan's 59.95 / 74.96 sat in front of a jam gate, 150.23 / 161.31 on a press)
export const RETRY = R.retry ? [14.37, 19.10, 27.60, 31.50, 38.77, 58.61, 75.32, 86.30, 88.80, 100.30, 112.50, 128.10, 130.70, 140.65, 149.03, 159.20, 174.10, 177.71, 192.60, 202.12, 205.40, 214.69, 232.35]
  : [14.37, 38.77, 58.61, 75.32, 86.30, 100.30, 112.50, 130.70, 140.65, 149.03, 159.20, 174.10, 177.71, 192.60, 202.12, 214.69, 232.35];
export const CUTS = [[-14, 13.4, 'float'], [241.3, 248.41, 'float']];   // (rework: control from 13.4, just after the push-through, so the belt has crates from its start)

// ---- Kevin's and Mom's messages (§4.2): [typing starts, sent, from, text] ----
// Kevin's question is Chikin's wording exactly (Level Maps note, Nov 2): "Dear Potato, what is the capital of Neipal? thanks, -Kevin"
// ("Neipal" is Kevin's typo and stays). He hesitates with the cursor blinking before "Neipal", then finishes and sends at −2.2.
const PRE = 'Dear Potato, what is the capital of ';
export const MSG_Q = PRE + 'Neipal?', MSG_SIGN = 'thanks, -Kevin';
export const MSG1 = MSG_Q + ' ' + MSG_SIGN, SENT1 = -2.2;
// REBUILD (stumble): he types "Nippl", holds, backspaces to "N", then gets the word out. Nobody reacts: it is Kevin's one joke. The
// plan wrote the stumble for the spelling "Niepal" and asked for Chikin's yes; his words on file are "Neipal", so it lands on that.
// All of these times are ESTIMATED (the desk is before the song's taps).
export const KEYS1 = R.stumble ? [[-13.0, ''], [-8.6, PRE], [-8.0, PRE], [-7.3, PRE + 'Nippl'], [-6.7, PRE + 'Nippl'], [-6.25, PRE + 'N'], [-5.9, PRE + 'N'], [-5.0, MSG_Q], [-2.6, MSG1], [SENT1, MSG1]]
  : [[-13.0, ''], [-7.6, PRE], [-6.2, PRE], [-5.0, MSG_Q], [-2.6, MSG1], [SENT1, MSG1]];
export const MESSAGES = [
  [-13.0, SENT1, 'kevin', MSG1],
  R.momTimes ? [37.9, 39.3, 'kevin', 'who was caesar'] : [36.0, 38.6, 'kevin', 'who was caesar'],   // (REBUILD, ESTIMATED: sent the instant the belt stalls)
  [50.6, 52.0, 'kevin', 'who is dr gary'],
  [71.5, 74.6, 'kevin', '…', 'unsent'],
  [138.4, 140.6, 'kevin', 'how many ppl live in peru'],
  [144.0, 144.9, 'kevin', 'its me kevin'],
  [146.8, 147.3, 'kevin', 'potato?'],
  [171.0, R.momTimes ? 171.9 : 172.3, 'mom', 'kevin, dinner'],   // (REBUILD: the whole line is up 0.67 s before the 172.57 crate)
  R.momTimes ? [176.3, 176.9, 'mom', 'kevin??'] : [175.4, 176.0, 'mom', 'kevin??'],   // (REBUILD, ESTIMATED: after the hot-pockets sticker, in the dark; her first key ends the sticker)
  [203.7, 205.0, 'mom', 'who is this. where is my son'],
  [227.60, 228.25, 'mom', 'GIVE HIM BACK'],
  [243.67, 246.63, 'mom', 'please', 'beats'],
];
export const PLEASE_BEATS = [243.67, 244.26, 244.85, 245.45, 246.04, 246.63];
// typed text of a message at t
export function typedAt(m, t) {
  const [a, b, , text, how] = m; if (t < a) return '';
  if (m[3] === MSG1) { const K = KEYS1; for (let i = 0; i + 1 < K.length; i++) { const [ka, sa] = K[i], [kb, sb] = K[i + 1]; if (t >= kb) continue;
    const k = (t - ka) / (kb - ka); if (sb.length >= sa.length) return sb.slice(0, sa.length + Math.floor((sb.length - sa.length) * k)); return sa.slice(0, sa.length - Math.floor((sa.length - sb.length) * k)); } return MSG1; }
  if (how === 'beats') { let n = 0; for (const bt of PLEASE_BEATS) if (t >= bt) n++; return text.slice(0, n); }
  return text.slice(0, Math.min(text.length, Math.ceil(text.length * Math.min(1, (t - a) / Math.max(0.05, b - a)))));
}
// the typing ticks (main.mjs plays SFX.key on each): [t, backspace?]
export const KEYTICKS = (() => { const out = [];
  for (let i = 0; i + 1 < KEYS1.length; i++) { const [a, sa] = KEYS1[i], [b, sb] = KEYS1[i + 1], n = Math.abs(sb.length - sa.length); for (let k = 1; k <= n; k++) out.push([+(a + (b - a) * k / (n + 0.0001)).toFixed(3), sb.length < sa.length]); }
  for (const m of MESSAGES.slice(1)) { const [a, b, , text, how] = m; if (how === 'beats') { for (const bt of PLEASE_BEATS) out.push([bt, false]); continue; }
    const n = [...text].length; for (let k = 1; k <= n; k++) out.push([+(a + (b - a) * k / n).toFixed(3), false]); }
  return out.sort((x, y) => x[0] - y[0]); })();

// ---- his face on the song's moments (§2 "Face" column): [t, face, dur] ----
const FACES0 = [
  [-4.8, 'question', 1.4], [-2.2, 'thinking', 3.3], [1.134, 'question', 1.6], [2.73, 'startled', 2.9], [5.63, 'dizzy', 1.8],
  [7.4, 'thinking', 2.2], [9.62, 'smirk', 0.6], [10.17, 'determined', 0.7], [10.79, 'grin', 2.4], [13.18, 'focused', 1.3],
  [14.4, R.proud ? 'proud' : 'smirk', 9.8], [24.38, 'startled', 0.4], [24.78, 'smirk', 1.2], [26, R.proud ? 'proud' : 'smirk', 13], [39.3, 'question', 1.4], [40.78, 'grin', 0.8], [41.62, 'proud', 3.6],
  [45.2, 'grin', 8], [53.34, 'smirk', 4.6], [58.0, 'deadpan', 1.8], [59.82, 'smirk', 0.4], [60.13, 'determined', 2.5], [62.65, 'proud', 1.9],
  [64.52, 'grin', 4.3], [73.5, 'angry', 1.1], [74.62, 'grin', 4.3], [78.95, 'grin', 4.5], [83.45, 'wide', 2.7],
  [86.20, 'proud', 4.6], [90.79, 'determined', 2.4], [93.15, 'smirk', 2.5], [95.68, 'grin', 2.1], [97.83, 'proud', 7], [104.83, 'awe', 2.6], [107.47, 'grin', 4.8],
  [112.34, 'angry', 2.7], [115.09, 'smirk', 1.4], [116.58, 'shock', 5.3], [121.90, 'oh', 0.8], [122.7, 'grin', 4.6], [127.3, 'sneaky', 2.0], [129.31, 'grin', 1.9],
  [131.24, 'focused', 9.5], [140.77, 'grin', 4.1], [144.93, 'question', 1.8], [146.71, 'oh', 0.6], [147.3, 'determined', 0.6], [147.82, 'grin', 2.4],
  [150.23, 'proud', 4.5], [154.73, 'angry', 3.0], [157.93, 'grin', 1.6], [159.55, 'smirk', 9.4], [168.97, 'focused', 2.0], [171.0, 'oh', 1.0], [172.0, 'focused', 1.6],
  [173.64, 'sad', 2.0], [175.6, 'deadpan', 2.7], [178.33, 'determined', 9.8], [188.17, 'angry', 3.2], [191.4, 'grin', 1.6], [193.0, 'proud', 9.1],
  [203.55, 'warm', 0.35], [203.9, 'oh', 2.3], [206.23, 'proud', 7.2], [211.4, 'thinking', 2.4], [213.89, 'grin', 1.0], [214.85, 'grin', 4.6],
  [219.5, 'determined', 6.9], [226.45, 'sad', 3.3], [229.83, 'joy', 2.6], [232.41, 'determined', 1.1], [233.56, 'oh', 0.3], [233.85, 'grin', 3.8], [237.7, 'wide', 3.6],
  [241.3, 'shock', 2.1],
];
// (face.mjs drops a face asked for more than 5 s ahead: long holds go in 4.5 s pieces; no face = his canon side-eye)
export const FACES = FACES0.flatMap(([t, f, d]) => { const out = []; for (let a = 0; a < d - 0.01; a += 4.5) out.push([+(t + a).toFixed(3), f, Math.min(4.5, d - a)]); return out; });
// ---- the glitch ledger (§4.5): scripted glitches that happen without a press: [t, blink, sfx, face?] (sfx '' = silent: Mom's) ----
export const LEDGER = [
  // (rework: the question streams into his head as binary from −1.95; each burst landing flickers him — the ticks — and "Neipal?"
  //  goes in last, on Chikin's big tap 1.134: his first real glitch)
  [-0.75, 0.16, 'tick'], [-0.35, 0.16, 'tick'], [0.0, 0.18, 'tick'], [0.32, 0.22, 'tick'], [0.62, 0.22, 'tick'], [0.93, 0.22, 'tick'], [1.27, 0.22, 'tick'],
  [1.134, 0.45, 'glitch', 'question'], [2.73, 0.45, 'glitch'], [5.63, 0.80, 'big'], [10.79, 0.35, 'small'],
  [121.90, 0.35, 'small', 'oh'], [145.52, 0.40, 'glitch', 'question'], [146.71, 0.45, 'glitch', 'oh'],
  [171.0, 0.5, '', 'oh'], [R.momTimes ? 176.3 : 175.4, 0.5, '', 'oh'], [203.7, 0.5, '', 'oh'], [227.6, 0.5, '', 'oh'],
  [242.5, 0.9, 'big'],
];
export const GRAB = 147.82;                        // HE'S: the Space press that takes Kevin
export const COSTUME_AT = 10.17;                   // the drop: he glitches into the construction-crew

// ---- the beat sheet as one table (§5 "One table drives it"): [t, zone, world does, player does] ----
export const ZONES = [[-14, 'desk'], [13.18, 'intake'], [41.6, 'stamp'], [62.95, 'catwalk'], [85.07, 'drop'], [107.39, 'wing'], [129.31, 'upper'],
  [148.27, 'furnace'], [195.63, 'deli'], [206.93, 'roof'], [241.3, 'fold'], [243.6, 'dawn']];
export const zoneAt = t => { let z = ZONES[0][1]; for (const [a, n] of ZONES) if (t >= a) z = n; return z; };
export const MOMENTS = [
  [-14, 'desk', 'router blinks purple once: he arrives over the wifi', 'none'], [-13, 'desk', 'Kevin types: Dear Potato, what is the capital of Neipal? thanks, -Kevin', 'none'],
  [-1.95, 'desk', 'the question lifts off the screen letter by letter and streams into his head as binary; "thanks, -Kevin" drops onto the desk', 'none'],
  [1.134, 'desk', '"Neipal?" goes in last: his first real glitch', 'none'],
  [0, 'desk', 'thinking bubble, dots', 'none'], [1.13, 'desk', 'it glitches, he glitches', 'none'], [2.73, 'desk', '"??", bigger glitch', 'none'],
  [5.63, 'desk', 'violent split; the laptop boot text fails (green)', 'none'], [7.26, 'desk', '"answering???" builds, one ? a beat', 'none'],
  [10.17, 'desk', 'he glitches into the construction-crew', 'none'], [10.79, 'desk', 'the laptop screen tears: belts show through', 'none'],
  [13.18, 'intake', 'push-through: the taskbar is belt #1, the hopper swallows the question', 'none'],
  [18.42, 'intake', 'the line starts lying: crates stamped + shipped, LIES SHIPPED ticks', 'hop'], [24.38, 'intake', 'QC lamp amber: WHAT?', 'space'],
  [39.3, 'intake', 'JAM-1: Kevin\'s question jams the intake; "?" -> SALAD', 'space'], [41.62, 'stamp', 'the ¶ staircase (x12)', 'six hops'],
  [45.2, 'stamp', 'DR. GARY standee moulds', 'hops'], [55.10, 'stamp', 'QUANTUM SPAGHETTI vat', 'hop'], [58.0, 'stamp', 'JAM-2 barcode arch', 'space'],
  [62.65, 'catwalk', 'PO-TA-TO presses; the tube up to F2', 'pad'], [66.92, 'catwalk', 'the screw rolls', 'hop'], [71.2, 'catwalk', 'QC booth on chains', 'space'],
  [77.0, 'catwalk', 'citations that never load', 'hops'], [79.54, 'catwalk', 'restaurant awnings', 'hops'], [85.07, 'drop', 'the process flies off a cliff', 'fall'],
  [86.20, 'drop', 'CHORUS: lands on his name', 'hops'], [96.09, 'drop', 'he invents a source: the cardboard professor', 'space'], [97.83, 'drop', 'the tube to F2', 'pad'],
  [105.18, 'drop', 'rechargeable eagles carry him', 'hop'], [108.10, 'wing', 'QC STOP sign', 'space'], [113.9, 'wing', 'the inspector', 'space'],
  [118.9, 'wing', 'Stephanie\'s twelve papers -> hobgoblin', 'hops'], [121.0, 'wing', 'white-out tape: Oops. Correction.', 'none'],
  [127.3, 'wing', 'the journal in silence', 'none'], [129.31, 'upper', 'Nature Valley: up to F3', 'pad'], [140.57, 'upper', 'the population counter', 'hops'],
  [144.93, 'upper', 'who is Kevin? the slip stamped SOURCE, machines stall', 'none'], [147.82, 'upper', 'HE\'S IN THE DATA NOW: Kevin taken', 'space'],
  [148.27, 'furnace', R.kevinAhead ? 'every machine roars back on; Kevin drops into the crate ahead of Potato on the far belt; his own sign-off is its label; it is never attached to him' : 'every machine roars back on; Kevin rides a FRAGILE crate', 'none'], [157.20, 'furnace', 'the survey binder into the furnace', 'space'],
  [159.53, 'furnace', 'furnace doors blast open', 'none'], [171.0, 'furnace', 'Mom: kevin, dinner', 'none'], [175.09, 'furnace', 'socket dive, the dark', 'fall'],
  [178.33, 'furnace', 'the barrage', 'hops'], [185.0, 'furnace', 'robo-raccoon kicks the KNOWLEDGE shelf', 'hop'], [190.2, 'furnace', 'JAM-7 fact-check crew', 'space'],
  [193.81, 'deli', 'EVEREST: the sandwich', 'climb'], [199.99, 'deli', 'ANSWER ✓ (toothpick)', 'hop'], [203.6, 'deli', 'the still; Mom: who is this', 'none'],
  [206.93, 'roof', 'the roof; wide shot; the reactor', 'pad'], [209.53, 'roof', 'KING: crowned', 'hop'], [213.89, 'roof', 'he pops his own double-check bubble', 'space'],
  [214.60, 'roof', 'the ANSWER crate fired out', 'none'], [216.41, 'roof', 'three bots agree', 'hops'], [223.5, 'roof', 'the reactor surges', 'hops'],
  [227.60, 'roof', 'Mom: GIVE HIM BACK', 'none'], [230.49, 'roof', 'GRAB A HELMET', 'hop'], [231.30, 'roof', 'browser shutters', 'space'],
  [233.56, 'roof', 'a real FACT: the stamp can\'t print, cardboard shows', 'space'], [235.17, 'roof', 'Cornelius mould', 'hop'], [237.70, 'roof', 'MIT OF MAKING STUFF UP; the roof goes', 'hops'],
  [241.3, 'fold', 'blank backs; slam flat on 242.47; he glitches out', 'none'], [243.6, 'dawn', 'the empty desk; please', 'none'],
  [246.63, 'dawn', 'LOCAL BOY, KEVIN, MISSING.', 'none'], [248.1, 'dawn', 'the router blinks purple once', 'none'],
];
