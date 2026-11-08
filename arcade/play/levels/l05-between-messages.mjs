// Level 5 — Between Messages: the typing void. 343 beats of 0.562 s. Typing dots appear and disappear as platforms over
// long floaty gaps. Power: Orbital Astronaut — hold V to float.
import { fill } from './kit.mjs';
export default {
  n: 5, id: 'between-messages', title: 'Between Messages', song: 'songs/between-messages.mp3', map: 'songs/between-messages.map.json',
  theme: 'typing', power: 'astronaut',
  sections: [['sent', 0], ['delivered', 32], ['typing…', 68], ['still typing', 100], ['stopped typing', 124],
             ['typing again', 180], ['read', 208], ['the long wait', 228], ['…', 244], ['almost', 280], ['reply?', 308], ['between', 332]],
  course(c) {
    c.deco(10, 'buffer-signature', 0, 1.2);
    fill(c, 32, 66, { low: 2, gap: 2, dots: 1, duck: 1 }, 501);
    c.packet(70); fill(c, 74, 122, { dots: 3, gap: 2, wall: 1, low: 1 }, 502, [3, 4]);
    c.deco(126, 'ping-check-replies', 0, 1.2);
    fill(c, 128, 178, { dots: 2, gap: 2, low: 1, wall: 1, spam: 1 }, 503);
    fill(c, 182, 206, { dots: 3, gap: 1 }, 504, [2, 4]);
    c.packet(209);                                                                 // a second astronaut at the checkpoint: the long gap needs the float
    c.gap(212, 8); c.dots(214, 1, 0.8, '1100'); c.dots(217, 1, 1.2, '0110');        // the long gap: float it
    fill(c, 222, 278, { dots: 2, gap: 2, wall: 1, low: 1, spam: 1 }, 505);
    fill(c, 282, 330, { dots: 3, gap: 2, wall: 1 }, 506, [2, 4]);
  },
};
