// Level 10 — Last Lights On: the last server. 308 beats of 0.847 s. The network shuts down around him, light by light:
// the dark closes in over the song. Every download is random now (any power). In the final chorus he catches the last
// lights and becomes them — every power at once, the last signal still on.
import { fill } from './kit.mjs';
export default {
  n: 10, id: 'last-lights-on', title: 'Last Lights On', song: 'songs/last-lights-on.mp3', map: 'songs/last-lights-on.map.json', theme: 'lastlight', power: 'random',
  sections: [['the last server', 0], ['lights out, east', 20], ['lights out, west', 44], ['the crew goes dark', 88], ['quiet', 136],
             ['the last signal', 152], ['alone up here', 172], ['catch the light', 200], ['becoming it', 224], ['the vigil', 264], ['last lights on', 288]],
  dark: b => b < 136 ? 0.15 + 0.5 * b / 136 : b < 224 ? 0.7 + 0.15 * (b - 136) / 88 : b < 288 ? 0.4 : 0.1,
  creep: b => (b >= 200 && b < 224) ? 1.5 : 0,
  course(c) {
    c.deco(8, 'patch-all-fixed', 0, 1.2);
    fill(c, 22, 42, { low: 2, gap: 2, duck: 1 }, 1001); c.packet(26, 'random');
    fill(c, 46, 86, { gap: 2, low: 1, wall: 1, spam: 1, dots: 1, fake: 1 }, 1002); c.packet(56, 'random');
    c.deco(90, 'volt-signature', 0, 1.1); c.deco(110, 'echo-signature', 0, 1.1);
    fill(c, 90, 134, { gap: 2, pumps: 1, wall: 1, spam: 1, rise: 1 }, 1003); c.packet(112, 'random');
    c.deco(140, 'null-tiny-groove', 0, 1.1);
    fill(c, 154, 198, { gap: 2, dance: 1, wall: 1, spam: 1, fall: 1 }, 1004); c.packet(170, 'random');
    fill(c, 202, 222, { gap: 2, wall: 1, spam: 1 }, 1005);
    c.packet(226, 'singularity');                                          // becoming it: every power at once
    fill(c, 230, 262, { gap: 2, pumps: 1, wall: 1, spam: 2, dots: 1 }, 1006);
    fill(c, 266, 286, { gap: 1, low: 1 }, 1007);
    fill(c, 290, 302, { low: 1 }, 1008); c.deco(296, 'ghostfile-visible-again', 0, 1.2);
  },
};
