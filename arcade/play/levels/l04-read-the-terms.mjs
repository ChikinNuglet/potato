// Level 4 — Read the Terms: the terms of service tower. 194 beats of 0.716 s. Fine print falls from above; Captcha
// checks him at every gate (stand on the pad one beat, or glitch through). Power: Construction Crew — girder bridges,
// and the hard hat shrugs off falling clauses.
import { fill } from './kit.mjs';
export default {
  n: 4, id: 'read-the-terms', title: 'Read the Terms', song: 'songs/read-the-terms.mp3', map: 'songs/read-the-terms.map.json',
  theme: 'terms', power: 'construction',
  sections: [['by continuing you agree', 0], ['section 1: you', 16], ['section 2: also you', 52], ['the fine print', 76],
             ['clause 404', 128], ['he doesn’t sign', 148], ['void where prohibited', 172]],
  course(c) {
    c.deco(6, 'captcha-signature', 0, 1.3);
    c.gate(18); fill(c, 22, 50, { low: 2, gap: 2, fall: 2, duck: 1 }, 401);
    c.packet(54); c.gap(60, 4); c.gap(66, 4);                       // build your way across (or beat-jump + glitch timing)
    c.step(62, 1, 0.3); c.step(68, 1, 0.3);
    c.gate(72);
    fill(c, 78, 126, { fall: 3, gap: 2, low: 1, wall: 1, spam: 1 }, 402);
    c.gate(130); c.deco(132, 'admin-signature', 2.6, 1.3);
    c.fall(136); c.fall(137); c.fall(138); c.gap(140, 5); c.step(142, 1, 0.3);
    fill(c, 150, 170, { fall: 2, gap: 2, wall: 1, low: 1 }, 403); c.gate(168);
    c.deco(178, 'captcha-all-clear', 0, 1.2);
  },
};
