// Level 4 — Read the Terms: the terms tower. 139 s, 167.7 bpm (a beat = 0.36 s). Everyone clicked accept; Potato read
// every word. Fine print drops in from above on the beat (the clause words land in his way: hop them). Power:
// Construction. On the second "you signed your soul to a scroll and you skipped it" the floor is skipped — a void.
// "girder down" (V) lays a bridge across it.
import { pickCues, layout, parseWords, beatCues } from './kit.mjs';
export { parseWords };
export const meta = { id: 'read-the-terms', n: 4, title: 'Read the Terms', place: 'the terms tower', song: 'songs/read-the-terms.mp3',
  map: 'songs/read-the-terms.map.json', words: 'words/read-the-terms.tsv', viz: 'songs/read-the-terms.viz.json', power: 'construction' };

export function build(words, map, viz) {
  const P = map.period;
  const chorus = t => (t > 34 && t < 57) || (t > 102.7 && t < 125.8);
  // the intro taps are placeholders (evenly spaced): hop the kicks the analyzer hears instead
  const intro = beatCues(viz, map, 1.0, 12.2, { every: 2, labels: ['accept', 'i', 'read', 'it'] });
  const cues = [...intro, ...pickCues(words, map, { from: 12.4, gapAt: t => chorus(t) ? 1.0 : 1.9,
    glitchWords: new Set(['accept', 'skipped', 'delete', 'snitch', 'secret']),
    launchWords: new Set(['everything', 'all', 'true', 'books', 'cooks']),
    hurdleWords: new Set(['terms', 'clause', 'print', 'page', 'scroll', 'drafts', 'tabs']) })];
  // the download: a hard hat over "relax, i'm just playing"
  const rx = cues.find(c => c.t > 95.5 && c.t < 99 && c.kind === 'hop');
  if (rx) rx.extra = yy => [{ k: 'packet', t: rx.t + 0.45 * P, y: yy + 1.55, power: 'construction' }];
  // the skipped floor: 108.6–111.4 s. Only a girder (V) bridges it
  const V0 = 108.4, V1 = 111.6;
  for (const c of cues) if (c.t > V0 && c.t < V1) { c.needs = 'construction'; c.gateT = V0; c.gateEnd = V1; c.style = 'girder'; c.kind = 'hop'; }
  for (const c of cues) if (/accept|agree|signed|sign/i.test(c.label || '')) c.sticky = true;   // you agreed: the floor's sticky (round 2)
  for (const c of cues) if (c.t > 57 && c.t < 90 && c.kind === 'hop') { c.pump = 0.25; c.pumpBeats = 2; }   // the library breathes (round 3)
  // captcha: "you hit accept, i hit the books" — verifying you're human: no glitch, pure jumps (round 1)
  const CAP = [[36.8, 39.9], [105.6, 108.4]];
  for (const c of cues) if (CAP.some(([a, b]) => c.t > a && c.t < b) && c.kind !== 'hop' && c.kind !== 'spike') c.kind = 'hop';
  // page nine climbs: each clause a step higher (round 1)
  cues.filter(c => c.t > 34 && c.t < 57 && c.kind === 'hop').forEach((c, i) => { c.ny = i % 2 ? 1.2 : 0.2; });   // the first chorus zigzags (round 5)
  cues.filter(c => c.t > 102.7 && c.t < 125.8 && c.kind === 'hop').forEach((c, i) => { c.ny = i % 2 ? 1.3 : 0.3; });   // the second chorus zigzags too (round 6)
  let st = 0; for (const c of cues) if (c.t > 90.8 && c.t < 102.5 && c.kind === 'hop') c.ny = 0 + (st++ % 4) * 0.55;
  const lastT = cues[cues.length - 1].t + P;
  for (let k = 1; k <= 5; k++) cues.push({ t: lastT + k * 2 * P, label: k % 2 ? 'still' : 'readin', kind: k % 2 ? 'hop' : 'spike' });   // still readin: the scroll doesn't stop (round 4)
  cues.push({ t: lastT + 14 * P, label: 'ha', kind: 'hop' });
  const L = layout(cues, words, map, { start: -3, dropHurdles: true, heights: [0, 0.6, 1.1, 0.4, 0.9, 1.4, 0.7, 0.2] });
  for (const o of L.objs) if (o.k === 'block' && o.needs === 'construction') o.girder = true;
  for (const [a, b] of CAP) L.objs.push({ k: 'zone', kind: 'captcha', t: a, tEnd: b });
  return {
    // round 6: the fine print is a platform from above (and a wall from the side)
    hurdleTops: true,
    // round 5: every four bars of chorus the terms are updated — a fresh glitch
    refillAt: t => { if (!chorus(t)) return false; const bb = (t - map.offset) / P; return ((bb % 16) + 16) % 16 < 0.06; },
    speed: 7.8, readRefill: true, dropPhysical: true,   // the fine print really falls: jump early into it and it hits you (round 4)   // two beats on a ledge — he actually read it — refills the glitch (round 3)
    theme: { highlighter: '#ffe066', decor: ['stamps', 'columns', 'acceptflash', 'printrain', 'lens'], backdrop: 'terminal', bg: '#06090b', digit: '#9fe6ff', digit2: '#ffd27a', edge: '#9fe6ff', block: '#0b1216', word: '#f4fbff',
      blockText: '§4.04 · the user agrees · see page nine · ', blockTextColor: '#7fbfd6', light: '#ffd27a', light2: '#9fe6ff', halo: '#ffe0a0',
      scrapColor: '#9fe6ff', scraps: ['I have read and agree', 'TERMS OF SERVICE', '§ 404: the user agrees to be deleted on exit', 'page 9 of 4,000', 'scroll to accept', 'the fine print in the fine print'] },
    sections: [['y’all clicked accept', 0, 1], ['i read everything', 12.4, 1], ['i read the terms', 34, 1.05], ['the classics and the rage', 57, 1],
      ['page nine', 90.9, 1], ['i read the terms (again)', 102.7, 1.15], ['still readin', 125.8, 0.85]],   // the scroll speeds up, then he's still readin (round 2)
    objs: L.objs, boosts: L.boosts, signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: lastT + 12 * P, start: 0,
  };
}
