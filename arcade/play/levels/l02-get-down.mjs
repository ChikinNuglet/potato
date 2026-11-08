// Level 2 — Get Down: the party server. 214 beats of 0.62 s. The dance floor pumps on the beat. Power: Disco Legend — a mid-air spin jump, once per bar.
import { fill } from './kit.mjs';
export default {
  n: 2, id: 'get-down', title: 'Get Down', song: 'songs/get-down.mp3', map: 'songs/get-down.map.json', theme: 'party', power: 'disco',
  sections: [['the back door', 0], ['the party never ended', 20], ['everybody move', 48], ['the floor drops out', 124],
             ['up to the booth', 156], ['the drop', 172], ['last song', 204]],
  course(c) {
    c.deco(6, 'throttle-hands-up-groove', 2.6, 1.4); c.deco(12, 'loop-spin-pivot', 0, 1.1);
    // verse: learn the dance floor (it pumps on the beat: hop across)
    c.low(22); c.gap(26, 2); c.gap(31, 5); c.pump(31, 2, 0.1); c.pump(34, 2, 0.25);
    c.wall(37); c.duck(41, 2); c.spam(45);
    // peak: the disco download, then the party at full tilt
    c.packet(50); c.deco(52, 'sync-staccato-hop', 2.4, 1.2);
    fill(c, 56, 122, { dance: 3, pumps: 2, low: 2, gap: 2, wall: 1, spam: 2, duck: 1 }, 202);
    // the floor drops out: a wide gap only a spin jump (or perfect beat jumps on the pumps) gets over
    c.gap(126, 6); c.pump(127, 1, 0.6); c.pump(130, 1, 0.9);
    fill(c, 134, 154, { dance: 2, low: 1, wall: 1, spam: 1 }, 203);
    // up to the booth: a climb of pumping speakers
    c.gap(157, 14); c.pump(157, 2, 0.4); c.pump(160, 2, 1.0); c.pump(163, 2, 1.6); c.pump(166, 2, 1.0); c.pump(169, 2, 0.4);
    c.deco(164, 'throttle-spin-finish', 3.6, 1.5);
    // the drop: hold your breath, the platform lands with the beat
    c.gap(175, 4); c.drop(176, 2, 0.5); fill(c, 180, 202, { dance: 2, pumps: 1, wall: 1, spam: 1, low: 1 }, 204);
    c.deco(208, 'loop-high-hop', 0, 1.1);
  },
};
