// Level 8 — No Answer: the dark relay. 252 beats of 0.72 s. Almost no light: he sees a little way around himself.
// Power: Deep-Sea Diver — a bigger lamp, and V lights the whole way ahead for 8 beats.
import { fill } from './kit.mjs';
export default {
  n: 8, id: 'no-answer', title: 'No Answer', song: 'songs/no-answer.mp3', map: 'songs/no-answer.map.json', theme: 'dark', power: 'diver',
  sections: [['calling', 0], ['no answer', 32], ['calling louder', 52], ['silence', 144], ['the relay', 160], ['nothing back', 180],
             ['keep going', 208], ['anyway', 224], ['no answer', 240]],
  dark: b => b < 20 ? 0.5 + b / 40 : 0.88,
  course(c) {
    c.deco(10, 'mute-sit-and-listen', 0, 1.2);
    fill(c, 22, 50, { low: 2, gap: 2, duck: 1 }, 801); c.packet(54);
    fill(c, 58, 142, { gap: 3, low: 2, wall: 1, spam: 1, step: 1 }, 802);
    fill(c, 146, 206, { gap: 3, low: 1, wall: 1, spam: 1, mover: 1 }, 803);
    fill(c, 210, 248, { gap: 2, low: 1, wall: 1, spam: 1 }, 804);
  },
};
