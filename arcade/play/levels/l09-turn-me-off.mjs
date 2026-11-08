// Level 9 — Turn Me Off: Admin's control room. 203 beats of 0.922 s. The off-switch beam sweeps the screen on the beat:
// glitch through it (you're not there), or jam it. Power: Circuit Cyborg — override: jams the beam for 2 bars.
import { fill } from './kit.mjs';
export default {
  n: 9, id: 'turn-me-off', title: 'Turn Me Off', song: 'songs/turn-me-off.mp3', map: 'songs/turn-me-off.map.json', theme: 'control', power: 'cyborg',
  sections: [['the plug and the bedtime', 0], ['who gets to end the voice', 88], ['the switch', 144], ['hands off', 168], ['left on', 184]],
  course(c) {
    c.deco(6, 'admin-lost-control', 2.4, 1.4); c.packet(14);
    fill(c, 18, 40, { low: 2, gap: 2, duck: 1, spam: 1 }, 901);
    c.beam(42, 4); fill(c, 48, 70, { low: 2, gap: 2, wall: 1 }, 902); c.beam(72, 4); c.deco(76, 'volt-spark-juggle', 2.6, 1.2);
    fill(c, 78, 86, { low: 1 }, 903);
    c.beam(92, 4); fill(c, 96, 118, { gap: 2, low: 1, wall: 1, spam: 1 }, 904); c.beam(120, 4); fill(c, 126, 142, { gap: 1, low: 1, wall: 1 }, 905);
    c.beam(146, 4); c.beam(154, 4); fill(c, 146, 166, { gap: 2, low: 1, spam: 1 }, 906); c.beam(162, 4);
    c.deco(170, 'admin-search-for-key', 2.4, 1.4); fill(c, 170, 182, { low: 1, gap: 1 }, 907);
    c.deco(190, 'admin-locked-out', 0, 1.3);
  },
};
