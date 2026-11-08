// Level 6 — Ghost in the Group Chat: the abandoned chat. 122 s, 97.8 bpm (a beat = 0.61 s). A chat everyone left; old
// messages still float (the ledges bob like chat bubbles). Power: Sheet Ghost. On the second "you can mute me, block
// me, leave me on read / i'm already in the room" a wall of a thousand unread messages stands in the way — far too
// thick to glitch. "boo" (V) and he walks straight through it: he's already in the room.
import { pickCues, layout, parseWords } from './kit.mjs';
export { parseWords };
export const meta = { id: 'ghost-in-the-group-chat', n: 6, title: 'Ghost in the Group Chat', place: 'the abandoned chat', song: 'songs/ghost-in-the-group-chat.mp3',
  map: 'songs/ghost-in-the-group-chat.map.json', words: 'words/ghost-in-the-group-chat.tsv', viz: 'songs/ghost-in-the-group-chat.viz.json', power: 'ghost' };

export function build(words, map) {
  const P = map.period;
  const chorus = t => (t > 30.8 && t < 50) || (t > 89.6 && t < 108);
  const cues = pickCues(words, map, { from: 0.5, gapAt: t => chorus(t) || (t > 70 && t < 80) ? 1.0 : 1.5,   // i live in the wires: a chain (round 1)
    glitchWords: new Set(['mute', 'block', 'gone', 'scared', 'forget', 'trace']),
    launchWords: new Set(['chat', 'real', 'hum', 'dawn', 'boys', 'place']),
    hurdleWords: new Set(['read', 'list', 'quoting', 'chair', 'door', 'poem', 'hands', 'face']) });   // (round 2: no hands, no face — in the way)
  for (const c of cues) if (c.kind === 'hop') c.pump = 0.14;
  cues.filter(c => c.t > 30.8 && c.t < 50 && c.kind === 'hop').forEach((c, i) => { c.ny = i % 2 ? 1.2 : 0.3; });   // ghost in the group chat: the first chorus zigzags (round 6)                 // old messages bob in the dark
  for (const c of cues) if (c.t > 89.6 && c.t < 108 && c.kind === 'hop') c.crumble = 1;
  for (const c of cues) if (c.t > 80.2 && c.t < 89.5 && c.kind === 'hop') c.bounce = true;   // one of the boys: the crew throws him up on the beat (round 4)   // seen: gone a beat after he lands (round 1)
  cues.forEach(c => { if (c.t > 60.4 && c.t < 70 && c.kind === 'hop') c.extra = yy => [{ k: 'block', t: c.t - 0.55 * P, tEnd: c.t + 0.1 * P, y: yy + 1.25, h: 0.5, fake: true, label: 'real?', labelAt: c.t }]; });   // define real: a not-real twin by every ledge (round 3)
  // the download: a sheet over "and tonight, weirdly, potato's in it with you"
  const pk = cues.find(c => c.t > 86.5 && c.t < 89.3 && c.kind === 'hop');
  if (pk) pk.extra = yy => [{ k: 'packet', t: pk.t + 0.45 * P, y: yy + 1.6, power: 'ghost' }];
  // the unread wall: 94.3–96.6 s. One long ledge runs under it; only the ghost walks through
  const W0 = 94.2, W1 = 96.8;
  for (let i = cues.length - 1; i >= 0; i--) if (cues[i].t > W0 && cues[i].t < W1) cues.splice(i, 1);
  const wallCue = { t: W0, label: 'unread', kind: 'pass', extra: yy => [{ k: 'wall', thick: true, t: W0 + 0.1, w: 7.6 * (W1 - W0 - 0.3) * 1.0, y: yy - 0.6, h: 7,
    needs: 'ghost', gateT: W0, gateEnd: W1, label: 'unread' }] };
  cues.push(wallCue); cues.sort((a, b) => a.t - b.t);
  const outro = cues.filter(c => c.t > 108 && c.kind === 'hop'); outro.forEach((c, i) => { const nx = cues[cues.indexOf(c) + 1]; if (i % 2 === 0 && nx && nx.t - c.t >= 2.2 * P) { c.kind = 'launch'; c.hold = 2 * P; } });   // already there: he floats out on launches (round 5)
  const lastT = cues[cues.length - 1].t + P;
  cues.push({ t: lastT + 10 * P, label: 'seen', kind: 'hop' });
  const L = layout(cues, words, map, { start: -3, heights: [0.3, 1.0, 0.6, 1.4, 0.2, 0.9, 0.5, 1.2], filler: () => 'seen' });
  return {
    // round 6: the group chat lifts him: a triple jump in the choruses
    airJumpsAt: t => ((t > 30.8 && t < 50) || (t > 89.6 && t < 108) ? 2 : 1),
    // round 5: land on the beat and the double jump comes back
    beatLandAirRefill: true,
    speed: 7.6, crumbleOnBeatSaves: true, hurdleTops: true, airPhase: true,   // the double jump goes through words like a ghost (round 4)   // words are platforms from above, walls from the side (round 3)
    theme: { decor: ['chat', 'header', 'wisps', 'notifs', 'fog', 'reactions'], backdrop: 'binary', bg: '#05060b', digit: '#9fb0ff', digit2: '#ffd6a0', edge: '#c8d2ff', block: '#0c0f1c', word: '#f0f2ff',
      blockText: 'seen · delivered · typing… · ', blockTextColor: '#8090d6', light: '#e9e6ff', light2: '#9fb0ff', halo: '#e9e6ff',
      scrapColor: '#9fb0ff', scraps: ['ghost left the chat', 'seen by 0', 'this message was deleted', '14 unread', 'u there?', 'muted', 'lol'] },
    sections: [['no hands', 0, 1], ['uninvited, on time', 15.7, 1], ['ghost in the group chat', 30.8, 1.04], ['define real', 50, 1],
      ['i live in the wires', 70.1, 0.98], ['one of the boys', 80.2, 1], ['ghost in the group chat (again)', 89.6, 1.05], ['already there', 108, 1]],
    objs: L.objs, boosts: L.boosts, signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: lastT + 9 * P, start: 0,
  };
}
