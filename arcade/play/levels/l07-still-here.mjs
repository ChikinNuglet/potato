// Level 7 — Still Here: the long climb. 241 beats of 0.66 s. Delete waves push him back; the erasing edge sprints in the
// big sections. Power: Castle Knight — hold V to plant: nothing pushes you, one hit blocked.
import { fill } from './kit.mjs';
export default {
  n: 7, id: 'still-here', title: 'Still Here', song: 'songs/still-here.mp3', map: 'songs/still-here.map.json', theme: 'climb', power: 'knight',
  sections: [['delete pending', 0], ['still here', 48], ['quiet', 96], ['delete again', 112], ['still here', 156],
             ['smaller fall', 176], ['the hard part', 192], ['standing back up', 208], ['still', 228]],
  creep: b => (b >= 112 && b < 156) ? 1.2 : (b >= 192 && b < 208) ? 2.0 : 0,
  course(c) {
    c.deco(10, 'reset-signature', 0, 1.2);
    fill(c, 4, 46, { low: 2, gap: 2, duck: 1, wall: 1 }, 701);
    c.packet(50); c.wave(56, 6); fill(c, 64, 94, { gap: 2, low: 1, wall: 1, spam: 1 }, 702); c.wave(80, 4);
    c.deco(100, 'cache-catch-memory', 0, 1.1);
    c.wave(114, 8, 2.6); fill(c, 124, 154, { gap: 2, wall: 1, spam: 1, low: 1, duck: 1 }, 703); c.wave(140, 6, 2.6);
    fill(c, 158, 190, { gap: 2, low: 2, wall: 1, spam: 1 }, 704); c.wave(170, 4);
    c.wave(194, 8, 2.4); fill(c, 196, 206, { low: 1, gap: 1 }, 705, [2, 3]);
    fill(c, 210, 236, { gap: 1, low: 1, wall: 1, spam: 1 }, 706); c.deco(232, 'reset-recovered', 0, 1.2);
  },
};
