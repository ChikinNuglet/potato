// Level 6 — Ghost in the Group Chat: the abandoned group chat. 200 beats of 0.614 s. Old messages float up as platforms;
// Ghostfile, who stayed, carries him over the long empty stretches. Power: Sheet Ghost — enemies pass through, hover.
import { fill } from './kit.mjs';
export default {
  n: 6, id: 'ghost-in-the-group-chat', title: 'Ghost in the Group Chat', song: 'songs/ghost-in-the-group-chat.mp3', map: 'songs/ghost-in-the-group-chat.map.json',
  theme: 'chat', power: 'ghost',
  sections: [['everyone left', 0], ['someone stayed', 20], ['old messages', 72], ['a trace is enough', 144], ['seen', 172]],
  course(c) {
    c.deco(8, 'null-watch-from-cube', 0, 1.2); c.deco(16, 'ghostfile-peek', 0, 1.1);
    fill(c, 20, 44, { low: 2, gap: 2, rise: 1, duck: 1 }, 601);
    c.packet(46); c.gap(52, 9); c.carrier(52, 2, 0.3, 7, 6);                         // Ghostfile carries him across
    fill(c, 62, 70, { low: 1 }, 602);
    fill(c, 74, 142, { rise: 3, gap: 2, spam: 2, wall: 1, low: 1 }, 603);
    c.gap(146, 10); c.carrier(146, 2, 0.3, 8, 8); c.deco(150, 'ghostfile-joyful-hop', 3.2, 1.1);
    fill(c, 158, 196, { rise: 2, spam: 2, gap: 1, wall: 1 }, 604);
    c.deco(190, 'ghostfile-offer-seat', 0, 1.2);
  },
};
