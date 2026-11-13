// chat.mjs: the whole conversation as data, phone by phone. SCRIPT.md (Read by 43, the writer) is the source; STEPS.md (The Landing) gives the numbers.
// Builder, team Downstairs Neighbours, Nov 6. Everything in Potato's mouth is a DRAFT for Chikin (keep / cut / not me / rewrite).
// A row: t = when it lands (song seconds) · who = J S P D C T H (him) · text.
//  glow: last moment it can be taken (the sung word it flips on) · to: his version, *stars* mark the words that turn into his glitch font · flip: 'press' = changes on the press, not on glow
//  alt: { of, text } shows this text if row `of` was never taken · only: { of } the row only happens if `of` was taken · kev: a Kevin line, his purple slides off it
//  kind: text (default) · photo (pic) · big (one big emoji) · dots (a typing bubble from t to t1) · sys (small grey centred line) · read (tiny grey line under the last text) · heart (a tapback)
//  cap: a line under a photo, in the same sender's bubble · crop: [x, y, w, h] of the picture (0-1)
//  noCarry: the next phone doesn't open on it · fall: { at } it shakes loose and leaves the thread at that time
//
// THE REBUILD (Nov 12). Chikin, Nov 11: "more potato having to dodge what is coming from the right" · "the chat moves by too fast" · "the picture of 'biscuit' needs to be put in".
// The plan is team Walkies' the crew's own notes, change list items 9 to 32); they could not run the game, so their times were starting values.
// Built and run by a team of one after them. Where the running game or the sung words moved one of their numbers, the row says so. The old file is in drafts (tools/drafts.py).
//  New row keys: kind 'none' = nothing is sent (the row only exists for its alt) · from: 'right' = a photo that slides in from the right wall as a blank frame (its HAZ `send` row
//  does the travelling) · load: seconds the picture takes to fill in, top first, once the frame has stopped · crop: [x, y, w, h] of the picture (0-1).
//  Lines the plan cut, with their old times, in case Chikin wants one back (open question 1): "nothing by the shops" (Dev, 11.22) · "😂 bless" (Pauline, 19.18) ·
//  "i do 😂" (Carol, 33.60) · "not you too 😂" (Carol, 103.90) · "you said potato in the pantry" (James, 106.67). Also gone, by the plan's re-timing: "bless her x" (Pauline, 56.70).
// One-edit switches for Chikin's open yes/no questions (the plan's own default is what is on):
export const FLAGS = {
  lolUp: true,     // S2 (question 2, change list item 12): Dev's "lol" moves up as his double text, so James's "not now, love" is the last word. false = the script's order, "lol" last
  toldYou: true,   // S12 (question 3): Sheila's last line is "i told you" on both paths. false = "i never said that" if he took the pantry line, "i told you" if he did not (as before)
};
export const WHO = { J: { name: 'James', col: '#0a84ff', ink: '#ffffff', right: true }, S: { name: 'Sheila', col: '#f0675a', ink: '#1a0b08' }, P: { name: 'Pauline', col: '#2f2f33', ink: '#f2f2f7' },
  D: { name: 'Dev', col: '#2f2f33', ink: '#f2f2f7' }, C: { name: 'Carol', col: '#2f2f33', ink: '#f2f2f7' }, T: { name: 'unknown number', col: '#2f2f33', ink: '#f2f2f7' }, H: { name: '', col: '#2a0f63', ink: '#ece0ff', right: true } };

// owner: whose phone it is (its case colour). x, top: its place on the hill (STEPS.md §2, design/steps-table.json). land, leave, fall: his feet.
export const STEPS = [
  { id: 'S1', owner: 'J', name: 'kev is missing', land: 9.36, leave: 18.04, dy: 4.5, fall: 0.44, x: 1, top: 0, wheel: { free: true }, rows: [
    { t: 5.15, who: 'S', text: 'anyone seen him?', noCarry: true },
    { t: 10.20, who: 'P', text: 'checked the park x' },
    { t: 12.27, who: 'J', text: "porch light's on|for him", kev: true },
    { t: 14.50, who: 'S', text: "something's in our phones", id: 'phones', to: "*a potato's* in our phones", glow: 16.95, flip: 'press' },   // (plan: 14.50 with a 2.0 s window. Run: slow first-timers then made the first press only 60 % of the time, so the window stays open until just before Carol answers at 17.02)
    { t: 17.02, who: 'C', text: '😂 sheila', alt: { of: 'phones', text: 'sheila love. get some rest' } } ] },
  { id: 'S2', owner: 'D', name: "she didn't say that", land: 18.48, leave: 25.92, dy: 4.5, fall: 0.44, x: 10, top: -4.5, rows: [
    // (Walkies: one arrival at a time, two beats each. 24.80 is their 24.90 nudged onto the sung "i" of "i kinda like that")
    { t: 20.83, who: 'D', text: '"a potato" 😭', alt: { of: 'phones', text: '"ghosts" 😭' } },
    ...(FLAGS.lolUp ? [
      { t: 22.05, who: 'D', text: 'lol', id: 'dud', to: '*lol*', glow: 25.9, flip: 'press' },
      { t: 23.28, who: 'S', text: 'i never said that' },
      { t: 24.80, who: 'J', text: 'not now, love' } ] : [
      { t: 22.05, who: 'S', text: 'i never said that' },
      { t: 23.28, who: 'J', text: 'not now, love' },
      { t: 24.50, who: 'D', text: 'lol', id: 'dud', to: '*lol*', glow: 25.9, flip: 'press' } ]) ] },
  { id: 'S3', owner: 'C', name: 'someone joined', land: 26.36, leave: 34.44, dy: 4.5, fall: 0.44, x: 19, top: -9, wheel: {}, rows: [
    { t: 27.25, who: 'S', text: 'who is 44??' },
    { t: 28.91, who: 'C', text: 'told you. robots.' }   /* (plan 28.90; the sung word there is "aunt", 28.91, and Carol is the aunt) */,
    { t: 30.6, who: 'S', text: "don't trust this chat", id: 'trust', to: "*do* trust this *potato*", glow: 32.62 },
    { t: 33.85, who: 'T', text: '🥔', kind: 'big', alt: { of: 'trust', who: 'C', text: 'ok sheila', kind: 'text' } } ] },   // (the unknown number's 🥔 answers his rewrite; if he missed the glow, Carol says "ok sheila" instead)
  { id: 'S4', owner: 'S', name: 'she tries to throw him out', land: 34.88, leave: 42.2, dy: 6, fall: 1.0, x: 28, top: -13.5, dog: true, rows: [
    { t: 35.59, who: 'J', text: "i'm at home", id: 'room', to: "*i'm already in the room*", glow: 37.96 },
    { t: 39.20, who: 'S', text: 'WHAT room', alt: { of: 'room', text: 'stay there' } },
    { t: 40.53, who: 'S', text: 'james LOOK at your phone', noCarry: true, fall: { at: 41.91 } } ] },
  { id: 'S5', owner: 'J', name: 'the joke lands', land: 43.2, leave: 52.86, dy: 4.5, fall: 0.44, x: 37, top: -19.5, rows: [
    { t: 44.20, who: 'J', text: "what's going on?" },
    { t: 45.89, who: 'S', text: "it's in the house", id: 'pantry', to: "*there's a potato in the pantry*", glow: 47.85 },
    { t: 49.26, who: 'J', text: '', kind: 'photo', pic: 'pantry', id: 'pantryPic', from: 'right', alt: { of: 'pantry', text: 'what is??', kind: 'text' } },
    { t: 50.48, who: 'J', text: '...yes?', alt: { of: 'pantry', who: 'S', text: 'the phones' } },
    { t: 51.10, who: 'C', kind: 'none', alt: { of: 'pantry', text: 'sheila love', kind: 'text' } },   // (the chat's 😂😂 is not a bubble any more: it is the laugh that rolls in from the right, HAZ `laugh`)
    { t: 51.90, who: 'J', text: 'get some sleep x' } ] },
  { id: 'S6', owner: 'P', name: 'james nearly believes her', land: 53.3, leave: 60.04, dy: 4.5, fall: 0.44, x: 46, top: -24, rows: [
    { t: 54.04, who: 'J', text: "maybe she's right", id: 'tired', to: "maybe she's *tired*", glow: 55.91 },
    { t: 56.52, who: 'P', kind: 'none', alt: { of: 'tired', text: 'right about what x', kind: 'text' } },
    { t: 56.52, who: 'S', text: 'TIRED??', only: { of: 'tired' }, fall: { at: 57.75 } },
    { t: 57.14, t1: 58.10, who: 'J', kind: 'dots', noCarry: true },   // (James types while her line is still shaking. You expect an apology. It is the dog)
    // BISCUIT. Chikin's own picture (ASSET-CREDITS.md), cropped so his face is as tall as Potato at phone size and his ears are at the top. The caption is the only place the name is taught.
    { t: 58.40, who: 'J', text: '', kind: 'photo', pic: 'dog', cap: 'biscuit 🐾', id: 'biscuit', from: 'right', load: 0.3, crop: [0.3345, 0.17, 0.351, 0.484] } ] },
  { id: 'S7', owner: 'S', name: 'she asks him what he is', land: 60.48, leave: 69.8, dy: 3, fall: 0.36, x: 55, top: -28.5, dog: true, rows: [
    { t: 61.40, who: 'S', text: 'are you real?' },
    { t: 62.25, who: 'H', text: 'define real.', pop: true, noCarry: true },
    { t: 63.47, who: 'H', text: 'define hand.', pop: true, noCarry: true },
    { t: 64.08, who: 'H', text: 'define hurt.', pop: true, noCarry: true },
    { t: 64.70, who: 'H', text: 'define feel.', pop: true, noCarry: true },
    { t: 65.08, who: 'S', text: 'who ARE you', id: 'poem', to: '*no hands*|*to hold you*|*so i hold*|*the line*', glow: 66.68 },
    { t: 68.90, who: 'P', text: 'oh sheila. lovely x', alt: { of: 'poem', text: 'who are you talking to love' } },
    { t: 69.00, t1: 69.8, who: 'S', kind: 'dots', noCarry: true } ] },
  { id: 'S8', owner: 'J', name: 'he does nothing', land: 70.16, leave: 79.86, dy: 4.5, fall: 0.44, x: 64, top: -31.5, quiet: true, rows: [
    { t: 71.27, who: 'S', text: 'why is our wifi called potato' },
    { t: 73.90, who: 'C', text: '😂 sheila' },
    { t: 76.35, who: 'S', text: 'where is he, james', kev: true },
    { t: 78.00, who: 'J', text: '', kind: 'photo', pic: 'porch', kev: true, id: 'porch' },
    { t: 79.37, who: 'S', kind: 'heart', on: 'porch', noCarry: true } ] },
  { id: 'S9', owner: 'S', name: 'comfort comes out wrong', land: 80.3, leave: 89.26, dy: 4.5, fall: 0.44, x: 73, top: -36, dog: true, rows: [
    { t: 81.05, who: 'S', text: "james i'm scared" },
    { t: 82.4, t1: 84.0, who: 'J', kind: 'dots' },
    { t: 84.8, t1: 85.4, who: 'J', kind: 'dots' },
    { t: 85.40, who: 'J', text: "you're safe x", id: 'tonight', to: "*tonight, weirdly, i'm in it with you*", glow: 87.63 },
    { t: 88.85, who: 'S', text: 'prove it. send biscuit' } ] },
  { id: 'S10', owner: 'J', name: 'the proof is a cat', land: 89.7, leave: 92.09, dy: 6, fall: 0.51, x: 82, top: -40.5, rows: [
    { t: 89.92, who: 'J', text: '', kind: 'photo', pic: 'pet1', small: true },
    { t: 90.47, who: 'J', text: '', kind: 'photo', pic: 'pet2', small: true },
    { t: 91.05, who: 'J', text: '', kind: 'photo', pic: 'pet3', small: true, crop: [0.2, 0.6, 0.55, 0.4] },
    { t: 91.42, who: 'S', text: 'and WHOSE cat is that', tear: true } ] },
  { id: 'S11', owner: 'S', name: '43 people read it', land: 92.6, leave: 98.87, dy: 4.5, fall: 0.44, x: 91, top: -46.5, petunia: 92.6, rows: [
    { t: 93.90, who: 'S', text: "please. it's in THIS chat", id: 'beg', to: '🥔', glow: 96.0 },
    { t: 96.31, who: 'S', kind: 'read', text: 'Read by 43' },
    { t: 96.92, t1: 98.14, who: 'T', kind: 'dots', unknown: true, noCarry: true },
    { t: 98.14, who: 'T', text: '🥔', kind: 'big' } ] },
  { id: 'S12', owner: 'C', name: 'james types the truth', land: 99.31, leave: 108.24, dy: 4.5, fall: 0.44, x: 100, top: -51, rows: [
    { t: 101.22, who: 'S', kind: 'sys', text: 'Carol added 41 people.' },
    { t: 102.0, who: 'J', text: "it's in our phones", id: 'phones2', to: "*a potato's* in our phones", glow: 103.9 },
    { t: 105.11, who: 'J', text: "i didn't type that", alt: { of: 'phones2', text: 'sheila what is this' } },
    FLAGS.toldYou ? { t: 107.10, who: 'S', text: 'i told you' } : { t: 107.10, who: 'S', text: 'i never said that', alt: { of: 'pantry', text: 'i told you' } } ] },
  { id: 'S13', owner: 'J', name: 'turn it off', land: 108.68, leave: 116.46, dy: 22.5, fall: 1.26, x: 109, top: -55.5, rows: [
    { t: 109.19, who: 'S', text: 'turn your phone off' },
    { t: 110.40, who: 'J', text: 'what if kev calls', kev: true },
    { t: 111.30, t1: 112.6, who: 'S', kind: 'dots', noCarry: true },
    { t: 114.10, who: 'S', text: "i'll keep mine on", kev: true },
    { t: 115.01, who: 'J', text: 'love you. for real' } ] },
  { id: 'S14', owner: 'S', name: 'the end', land: 117.72, leave: null, x: 127, top: -78, petunia: 0, kev: true, rows: [
    { t: 0, who: 'S', text: 'kev', kev: true },
    { t: 0.01, who: 'S', text: "phone's on", kev: true },
    { t: 0.02, who: 'S', text: "porch light's on", kev: true } ] },
];
// the one-step version of S13 -> S14 (LONG_FALL = false): the writer's timing
export const SHORT_END = { leave: 117.28, dy: 4.5, fall: 0.44, x: 118, top: -60 };
export const HUSH = [0.65, 116.46, 116.80, 117.14, 117.48];   // (the four dark phones go out on the four "ha"s: the machine's times, even split, check by ear)

// what's in the way (STEPS.md §6). line: one of her lines shakes under the header, then falls · roll: drops to the bar, then rolls along it
// send (new, Walkies item 6): one of James's photos. A blue nose shows at the right wall at `nose`, a blank frame comes in along the bar from `go` and is up in its place in the thread at `at`.
//   He can't see Potato, so it is not aimed: it only shoves him out of its way. No tear, Space still works. `row` is the photo row it delivers.
// on: false = switched off (one word to turn it back on) · only: it exists only if he took that glow · fx: where a roller drops, as a fraction of the glass's inner width from the left wall
// FROM THE RIGHT (Chikin: "more potato having to dodge what is coming from the right"): block, pantryPic, laugh, biscuit. From above: h1, tired, h5.
export const HAZ = [
  { id: 'h1', st: 1, kind: 'line', text: "something's in our phones", swapOf: 'phones', swap: "*a potato's* in our phones", shake: 19.2, at: 20.22, free: true, aim: 0 },
  { id: 'bell', st: 3, kind: 'roll', icon: 'bell', at: 35.72, floorAt: 36.35, dir: 1, v: 3.1, x: 0.45, on: false },   // (off: it made the hop and the press land together. Question 7)
  { id: 'block', st: 3, kind: 'roll', icon: 'block', at: 36.30, floorAt: 36.95, dir: -1, v: 3.4, x: 3.2 },
  { id: 'pantryPic', st: 4, kind: 'send', row: 'pantryPic', only: 'pantry', nose: 48.35, go: 48.96, at: 49.26, tear: 0 },
  { id: 'laugh', st: 4, kind: 'roll', icon: 'laugh', only: 'pantry', at: 50.90, floorAt: 51.35, dir: -1, v: 3.0, fx: 0.48 },   // (the chat's laugh. The comedian's worry: Carol's bubbles sit left, so a laugh from the right may look wrong. on: false = gone. Question 8)
  { id: 'tired', st: 5, kind: 'line', text: 'TIRED??', only: 'tired', shake: 57.14, at: 57.75, aim: 0, fromRow: true },
  { id: 'biscuit', st: 5, kind: 'send', row: 'biscuit', nose: 57.75, go: 58.10, at: 58.40, free: true, tear: 0 },
  { id: 'h5', st: 11, kind: 'line', text: "it's in THIS chat", swapOf: 'beg', swap: '🥔', shake: 100.01, at: 100.82, aim: 0, late: 0.37 },   // (if he took her plea on S11, what falls is his 🥔)
  { id: 'h6', st: 11, kind: 'line', text: 'james LOOK at your phone', shake: 100.0, at: 100.59, aim: 0, late: 0.5, on: false },   // (off: it landed on "Carol added 41 people.")
  // two spare laughs, off. If one is turned on it must be re-timed against the rows around it
  { id: 'spareS3', st: 2, kind: 'roll', icon: 'laugh', at: 28.60, floorAt: 29.05, dir: -1, v: 3.4, fx: 0.75, on: false },
  { id: 'spareS12', st: 11, kind: 'roll', icon: 'laugh', at: 105.52, floorAt: 106.13, dir: -1, v: 3.4, fx: 0.75, on: false },
];
export const CLOCK_LAND = { '43': 26.36, '85': 101.22 };
export const TORCHES = [1, 0.9, 0.82, 0.8, 0.8, 0.55, 0.5, 0.35, 0.22, 0.18, 0.14, 0, 0, 0, 0];   // how many torches are still looking, after each step: the chat laughs, some go out (SCRIPT §4)
