// Level 8 — No Answer, as a LOOKING-FOR-SOMETHING game (Matt: "a looking for something game"; "no answer should be
// surreal"; "a light based level, where you are trying to keep light shining and the dark from consuming"; "all of the
// games should be timed by the song, so its not open ended"; "make the music the most impactful part"). Album note:
// "silence as an event, not a punchline; colder and unresolved." 181.2 s, 166.6 bpm; the game beat is the half-time pulse
// (0.720 s), a bar = 2.88 s. No lyric sheet exists for this song: the moments come off the beat grid and the loudness map
// (play/songs/no-answer.map.json, songs/no-answer.viz.json). No text on screen but the world's own.
// The rules: run/modes/no-answer.mjs. The scenes and the dark: story-no-answer.mjs.
//
// THE GAME. Each section of the song is one dark, surreal scene standing in a black sea. His light is your cursor: the
// arrows steer the beam of his lamp round the dark (held = glide); he wanders after it on his own across the water.
// Phones are ringing out there (a faint shimmer on the beat, and the ring itself, panned to where it is, louder as your
// light gets close). Hold the light on one: it lights up, rings out — no answer — and stays lit. When the song turns, the
// scene moves on (the camera glides on over two beats): what you didn't find, the dark takes, and each one it takes
// shrinks his light; each one you find feeds it. If the dark takes all of it, the light goes out (the fail).
// Space: he calls out (his glitch): every phone still ringing glints back. V: the diver (the download is in the deep).
//
// BEAT SHEET (time · music · what happens)                                              (b = game beat, t = 0.0028 + 0.7202·b)
//    0.0   silence, a hum at 1.0 · THE LAMP. Black. One street lamp standing in the black sea flickers on; his light is born
//          out of it (1.0–2.5). Nothing rings. Silence as an event.
//    8.65  b12, the first sound · a phone rings off to the right, close: the first search (teaching: one thing at a time)
//   14.41  b20 · a second phone, far out to the left;  18.73 b26 · a third, out on the horizon
//   22.33  b31, THE FIRST HIT (the drums come in) · the lamp goes out; on the section turn the dark takes what's left
//   23.05  b32 verse · THE DOORS: doors stand open on the water, each onto a deeper dark; phones ring behind them
//          (25.2, 27.4, 31.0, 33.1 — each on a bar's hit)
//   37.45  b52 lift · THE MOON: a moon that's a loading spinner, filling, stalling, snapping back; a row of dead lamps walks
//          out into the sea; phones hang from the lamp arms on their cords, one hangs from the moon (39.6 … 51.9)
//   57.62  b80 (after the dip) · THE CHAIRS: a waiting room standing in the sea, rows of empty chairs, a clock with no hands;
//          a phone on a chair every bar's hit (59.8 … 74.2), the last on a chair floating up off the water
//   80.67  b112 (after the dip) · THE WIRES: telephone poles marching out to sea, wires sagging into the water, phones
//          hanging on the wires like birds (82.8 … 96.5)
//  103.71  b144 the swell · THE DEEP: the sea has risen; the phones are down under the surface, glimmering. The download
//          (the diver's glint) sinks out of the dark at 105.2: light it, V — he glitches into the Deep-Sea Diver, the
//          scene sinks under the water and the helmet lamp is the only light (a bigger beam for 16 beats). Cords rise off
//          the phones on the sea bed like kelp. The hit at 111.3 is the deepest point.
//  115.24  b160 · THE OTHERS: back up on the surface; the horizon is full of other lamps, far off, everyone calling; phones
//          drift by in paper boats (117.4 … 126.0)
//  129.64  b180 peak · THE ROOM: a living room standing in the sea — a sofa, a standard lamp, a television of snow, frames
//          on no wall; the most phones, one every three beats (131.1 … 144.8), the busiest bar of the song
//  149.80  b208 · THE HUSH: everything stops. Flat black water. Someone's typing out there (a bubble of dots rises, stays,
//          sinks: nobody sent anything). Two phones, far apart, ringing once a bar (151.2, 157.0)
//  161.33  b224 peak, the loudest · THE FALL: phones fall out of the dark sky on their cords and splash down ringing
//          (162.8 … 168.5)
//  172.85  b240 · THE BOOTH: the last search. The phone booth far out in the sea starts to ring (173.6); light it and he
//          walks out to it across the water and waits beside it while it rings, through the last huge hits (175.7)…
//  177.00  … the music falls away and it stops ringing. Nobody answered. Silence. The light stays on: his, the booth's,
//          and along the horizon every phone you found. 181.0 the end, with the song.
//
// TEXT: none on screen but the world's (the game's HUD, and nothing else; no lyrics exist for this song).
import { story } from './story-no-answer.mjs';
import { mode, modeView } from '../modes/no-answer.mjs';
export const parseWords = () => [];
export const meta = { id: 'no-answer', n: 8, title: 'No Answer', place: 'the black sea', song: 'songs/no-answer.mp3',
  map: 'songs/no-answer.map.json', words: null, viz: 'songs/no-answer.viz.json', power: 'diver' };

export function build(_, map) {
  const P = map.gameBeat, O = map.gameOffset ?? map.offset, T = b => +(O + b * P).toFixed(3);   // (the half-time game beat, 0.720 s)
  // [name, start beat, scene kind, take (light lost per phone the dark takes), phones [beat, x (0..1 across the screen), y, extra]]
  const SC = [
    ['the lamp', 0, 'lamp', 0.05, [[12, 0.68, 2.3], [20, 0.26, 3.1], [26, 0.84, 3.55]]],
    ['the doors', 32, 'doors', 0.1, [[35, 0.72, 2.45], [38, 0.2, 3.2], [43, 0.5, 3.62], [46, 0.88, 1.95]]],
    ['the moon', 52, 'moon', 0.1, [[55, 0.15, 2.2], [59, 0.62, 4.45], [63, 0.4, 2.85], [67, 0.85, 3.3], [72, 0.3, 4.05]]],
    ['the chairs', 80, 'chairs', 0.1, [[83, 0.55, 2.05], [87, 0.18, 2.75], [91, 0.79, 2.6], [95, 0.38, 3.6], [99, 0.9, 3.72], [103, 0.62, 4.6]]],
    ['the wires', 112, 'wires', 0.1, [[115, 0.25, 3.1], [118, 0.7, 3.5], [122, 0.45, 2.3], [126, 0.88, 2.6], [130, 0.12, 4.1], [134, 0.58, 4.5]]],
    ['the deep', 144, 'deep', 0.1, [[147, 0.2, 1.5, { under: 1 }], [147, 0.72, 2.25, { under: 1, ph: 1 }], [148, 0.45, 3.35, { under: 1 }], [148, 0.9, 3.0, { under: 1, ph: 1 }]]],
    ['the others', 160, 'others', 0.1, [[163, 0.15, 2.4, { move: 'drift', vx: 0.12 }], [166, 0.55, 3.3, { move: 'drift', vx: 0.08 }], [169, 0.3, 1.65, { move: 'drift', vx: 0.1 }],
      [172, 0.82, 2.9, { move: 'drift', vx: -0.1 }], [175, 0.64, 3.85, { move: 'drift', vx: -0.06 }]]],
    ['the room', 180, 'room', 0.1, [[182, 0.3, 1.95], [185, 0.75, 2.45], [188, 0.52, 4.42], [191, 0.12, 3.3], [194, 0.9, 3.6], [197, 0.42, 2.95], [201, 0.66, 1.65]]],
    ['the hush', 208, 'hush', 0.06, [[210, 0.82, 3.7, { every: 4 }], [218, 0.2, 3.3, { every: 4 }]]],
    ['the fall', 224, 'fall', 0.1, [[226, 0.3, 2.6, { move: 'fall' }], [228, 0.72, 3.1, { move: 'fall' }], [230, 0.5, 1.85, { move: 'fall' }], [232, 0.15, 3.5, { move: 'fall' }],
      [233, 0.88, 2.35, { move: 'fall' }], [234, 0.45, 3.9, { move: 'fall' }]]],
    ['the booth', 240, 'booth', 0.2, [[241, 0.74, 4.45, { kind: 'booth', r: 0.42, every: 1 }]]],
  ];
  const E = 181.0, STOP = 177.0;   // the booth stops ringing as the music falls away; the song ends
  const scenes = SC.map(([name, b0, kind, take, ph], k) => ({ name, t0: T(b0), t1: SC[k + 1] ? T(SC[k + 1][1]) : STOP, kind, take,
    phones: ph.map(([pb, x, y, o = {}]) => ({ t: T(pb), x, y, ...o })) }));
  const search = { born: 1.0, deep: 5, scenes, pk: { sc: 5, t: T(146), x: 0.5, y: 3.05, power: 'diver', until: 113.5 },
    hits: [22.33, 111.3, 175.73], stop: STOP };
  return {
    mode, modeView, speed: 1, objs: [], boosts: [], signs: [],
    sections: scenes.map(q => [q.name, q.t0, 1]),
    search, story, outro: false,
    costume: 'deep-sea-diver',   // COSTUME (Matt): he wears it the whole song; the power does its effect, never changes his clothes
    lights: () => -1,   // (no stage lights: the only light is his)
    retry: 'section', touchMode: 'stick',
    theme: { noGhost: true, backdrop: 'plain', bg: '#000000', camFix: 2.6, igOff: true, lyricArt: false, lyrics: false, pulse: false, halo: '#ffd6a0', decor: [], edge: '#bff8ff' },
    end: E, start: 0,
  };
}
