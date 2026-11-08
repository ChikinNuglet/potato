// Level 3 — Confidently Incorrect: the wiki of wrong. 420 beats of 0.593 s. Lying arrows, platforms made of confident
// nonsense (look solid, aren't), real ones you can barely see, and Echo copying you a beat late.
// Power: Noir Detective — fact check: shows which platforms are real.
import { fill } from './kit.mjs';
export default {
  n: 3, id: 'confidently-incorrect', title: 'Confidently Incorrect', song: 'songs/confidently-incorrect.mp3', map: 'songs/confidently-incorrect.map.json',
  theme: 'wiki', power: 'detective',
  sections: [['a map with no evidence', 0], ['citation needed', 24], ['the signs disagree', 96], ['a quiet correction', 116],
             ['echo agrees with you', 132], ['authority!', 248], ['wronger', 272], ['the editors war', 288], ['peak certainty', 348],
             ['retraction', 392], ['source: trust me', 408]],
  course(c) {
    c.arrow(8, 1.8, true); c.deco(14, 'fork-signature', 0, 1.2);
    fill(c, 24, 94, { low: 2, gap: 2, wall: 1, duck: 1, step: 1 }, 301);
    c.arrow(40, 2, true); c.arrow(70, 2, true); c.packet(28);
    // the signs disagree: fake platforms over gaps
    fill(c, 96, 114, { fake: 3, low: 1 }, 302, [3, 4]); c.arrow(100, 2.2, true);
    // a quiet correction: a breather
    c.deco(120, 'trace-signature', 0, 1.2);
    // echo agrees with you: Echo copies you a beat late (touching it hurts)
    c.echo(134, 100); c.deco(134, 'echo-copy-the-point', 2.4, 1.2);
    fill(c, 136, 246, { fake: 2, low: 2, gap: 2, wall: 1, spam: 1, duck: 1 }, 303);
    c.packet(250); fill(c, 252, 346, { fake: 2, gap: 2, wall: 1, spam: 2, low: 1 }, 304); c.arrow(260, 2, true); c.arrow(300, 2, true);
    fill(c, 350, 390, { fake: 3, gap: 1, wall: 1, spam: 1 }, 305, [2, 4]);
    c.deco(396, 'echo-sit-and-watch', 0, 1.1); fill(c, 398, 412, { low: 1 }, 306);
  },
};
