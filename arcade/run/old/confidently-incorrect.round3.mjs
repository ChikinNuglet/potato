// Level 3 — Confidently Incorrect: the shaft of wrong. 248 s, 101.3 bpm (a beat = 0.59 s). Matt: "a level where he has
// to jump from one side to the other, like falling down walls", and "he can start that level getting a powerup that makes
// him stick to walls". So: he starts in the Orbital Astronaut suit (mag boots) and FALLS down a shaft of confident
// nonsense, the camera on its side (the two walls are the floor and the ceiling of the course). ↑ flings him to the other
// wall. Every sung word is stuck to one wall or the other: be on the other wall when it comes. Glitch words (wrong,
// fake, invent, shut…) span the whole shaft: glitch through. Words he glitches through become his SOURCES — they're
// filed into the References list on the wall (story-confidently-incorrect.mjs), and on "I GOT SEVENTEEN CITATIONS AND
// NONE OF 'EM LOAD" the whole list jams into one gold armored word, CITATIONS: grab the download on "Actually, Potato,
// that doesn't seem true", then V (mag pulse) blasts through it.
import { parseWords as kitParse, wordCourse } from './kit.mjs';
import { story } from './story-confidently-incorrect.mjs';
export const meta = { id: 'confidently-incorrect', n: 3, title: 'Confidently Incorrect', place: 'the shaft of wrong', song: 'songs/confidently-incorrect.mp3',
  map: 'songs/confidently-incorrect.map.json', words: 'words/confidently-incorrect.json', viz: 'songs/confidently-incorrect.viz.json', power: 'astronaut' };

// the timings file marks a few words "untapped": the boot-sequence intro (placeholder spacing — it becomes the cold
// open instead) and "for one second it sounded neat" (spaced inside its real gap, so we keep it).
export function parseWords(text) {
  const d = JSON.parse(text), rows = (Array.isArray(d) ? d : d.timings).map(r => r[3] === 'untapped' && r[0] != null && r[0] > 100 ? [r[0], r[1], r[2], ''] : r);
  return kitParse(JSON.stringify({ timings: rows }));
}

const BOOT = ['boot', 'sequence', 'catastrophic', 'confidence', 'astronomical', 'accuracy', '…optional'];
export function build(words, map, viz) {
  const P = map.period;
  const CITE = 77.85;                                         // "I GOT SEVENTEEN CITATIONS…": the jammed references
  const C = wordCourse(words, map, viz, {
    introFrom: 2.6, end: 246.4,
    density: t => (t < 15 ? 2 : t > 202 && t < 206.2 ? 3 : 1.5),
    glitchWords: new Set(['wrong', 'incorrect', 'hallucinating', 'counterfeit', 'fake', 'shut', 'invent', 'hallucinate', 'fabricate', 'oops', 'impostor', 'nonsense', 'malfunctioning', 'pretending']),
    filler: (t, i) => t < 15 ? BOOT[i % BOOT.length] : t > 240 ? ['potato', 'out'][i % 2] : '[?]',
    armor: [{ t: CITE, power: 'astronaut', text: 'citations' }],
    packets: [{ t: 72.75, power: 'astronaut' }],               // the download: "Actually, Potato, that doesn't seem true."
    flip: true, flipTop: 4,
  });
  return {
    speed: 7.2, flip: true, flipTop: 4, chargeBeats: 6,   // the glitch is for the wrong words that span the shaft; the mag boots do the rest
    vertical: 'down', startCostume: 'astronaut',
    story,
    theme: { objects: { low: 'card', high: 'banner', wall: 'redact' }, objA: '#d8c39a', objB: '#ff6b5a', decor: ['fallstreaks', 'speedlines'], backdrop: 'page', bg: '#0b0a08', digit: '#d8c39a', digit2: '#ff8a5c', edge: '#e8dcc0', block: '#16130e', word: '#fff1d6',
      blockText: 'citation needed · source: trust me · [1][2][3] · ', blockTextColor: '#bfae86', light: '#ffe2b0', light2: '#d8c39a', halo: '#ffe2b0',
      camFix: 0.25, lyricArt: false },
    sections: [['boot sequence', 0, 1], ['yappin’ back', 15, 1], ['wrong with authority', 62.6, 1.05], ['weirdly applaudable', 97.8, 1],
      ['he’s in the data now', 147.8, 1], ['for one second', 202, 0.94], ['wrong with authority (again)', 206.2, 1.08], ['potato out', 241.5, 1]],
    objs: C.objs, boosts: C.boosts, signs: C.signs,
    end: 246.4, start: 0,
    lights: t => t < 14.4 ? 0.35 + 0.65 * Math.min(1, t / 14.4) : 1,
  };
}
