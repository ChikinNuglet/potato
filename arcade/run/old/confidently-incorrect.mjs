// Level 3 — Confidently Incorrect: the wiki of wrong. 248 s, 101.3 bpm (a beat = 0.59 s). VERTICAL: he's falling down a
// shaft of wiki pages; the course is the same rules on its side (the "floor" is the wall, a jump pushes him across).
// Wrong, loud, pleased about it: some ledges are made of confident nonsense ("CITED", "source: trust me") and aren't
// there. Power: Noir Detective. "I GOT SEVENTEEN CITATIONS AND NONE OF 'EM LOAD": every ledge has a twin; only the
// fact check (V) shows — and makes solid — the real ones.
import { pickCues, layout, parseWords, bare, beatCues } from './kit.mjs';
export { parseWords };
export const meta = { id: 'confidently-incorrect', n: 3, title: 'Confidently Incorrect', place: 'the wiki of wrong', song: 'songs/confidently-incorrect.mp3',
  map: 'songs/confidently-incorrect.map.json', words: 'words/confidently-incorrect.json', viz: 'songs/confidently-incorrect.viz.json', power: 'detective' };

export function build(words, map, viz) {
  const P = map.period, O = map.offset;
  const chorus = t => (t > 62.6 && t < 100.6) || (t > 202 && t < 230);
  const cues = [...beatCues(viz, map, 2, 14.6, { every: 2, labels: ['boot', 'sequence', 'catastrophic'] }),   // boot sequence: catastrophic (round 3)
    ...pickCues(words, map, { from: 15, gapAt: t => chorus(t) ? 1.0 : (t > 100 && t < 147 ? 1.3 : 1.6),   // (round 5: verse 2 is busier)
    glitchWords: new Set(['wrong', 'incorrect', 'hallucinating', 'invent', 'fake', 'counterfeit', 'shut']),
    launchWords: new Set(['potato', 'authority', 'stew', 'overdrive', 'fire']),
    hurdleWords: new Set(['source', 'citations', 'facts', 'cited', 'doi']) })];
  // the download: a magnifying glass over "trust me"
  const tm = cues.find(c => c.t > 59.5 && c.t < 62 && c.kind === 'hop') || cues.find(c => c.t > 55 && c.kind === 'hop');
  tm.extra = yy => [{ k: 'packet', t: tm.t + 0.4 * P, y: yy + 1.55, power: 'detective' }];
  // the citations: 76.6–81.4 s. Real ledges need the fact check; a confident fake twin sits beside each one
  const C0 = 76.4, C1 = 81.6;
  for (const c of cues) if (c.t > C0 && c.t < C1 && c.kind === 'hop') {
    c.needs = 'detective'; c.gateT = C0; c.gateEnd = C1; c.style = 'page';
    const tw = c; tw.extra = yy => [{ k: 'block', t: tw.t - 0.62 * P, tEnd: tw.t + 0.13 * P, y: yy > 0.8 ? yy - 1.1 : yy + 1.1, h: 0.6, fake: true, lie: true, label: 'CITED', labelAt: tw.t }];
  }
  // elsewhere, now and then, a confident fake rides next to a real ledge (harmless if you trust the music, not the page)
  cues.forEach((c, i) => { if (c.kind === 'hop' && !c.needs && !c.extra && i % 7 === 3) c.extra = yy => [{ k: 'block', t: c.t - 0.5 * P, tEnd: c.t + 0.1 * P, y: yy + 1.3, h: 0.5, fake: true, label: 'trust me', labelAt: c.t }]; });
  // WRONG WITH AUTHORITY: the first chorus is a staircase, each ledge further out, then the drop (round 1)
  let st = 0; for (const c of cues) if (c.t > 62.6 && c.t < 75 && c.kind === 'hop' && !c.needs) { c.ny = -0.2 + (st++ % 5) * 0.62; }
  cues.forEach((c, i) => { if (c.t > 202 && c.t < 230 && c.kind === 'hop' && !c.needs && !c.extra && i % 3 === 0) c.extra = yy => [{ k: 'block', t: c.t - 0.5 * P, tEnd: c.t + 0.1 * P, y: yy + 1.3, h: 0.5, fake: true, label: 'HALF WIKIPEDIA', labelAt: c.t }]; });   // half wikipedia, half drunk narrator (round 4)
  let st2 = 0; for (const c of cues) if (c.t > 202 && c.t < 216 && c.kind === 'hop' && !c.needs) c.ny = 2.2 - (st2++ % 5) * 0.55;   // chorus 2: the staircase back down (round 2)
  let st3 = 0; for (const c of cues) if (c.t > 230 && c.kind === 'hop' && !c.needs) c.ny = 2.0 - (st3++ % 6) * 0.4;   // BEEFWHISTLE: one last staircase down (round 6)
  const lastT = cues[cues.length - 1].t + P;
  cues.push({ t: lastT + 8 * P, label: 'cited', kind: 'hop' });
  const L = layout(cues, words, map, { start: -3, heights: [0, 0.8, 0.3, 1.1, 0.5, -0.2, 0.9, 0.2] });
  return {
    // round 6: land on a fake with confidence and the glitch comes back
    trustRefill: true,
    // round 5: the words are ledges from above, and they bounce him on the beat
    hurdleTops: true, hurdleBounce: true,
    speed: 7.2, vertical: 'down', blinkUp: 1.1, fakeOnBeat: true, bassGravity: 0.25, bass: t => { const p = viz && viz.peaks[Math.round(t / viz.step)]; return p ? p.bass : 0; },   // the loud hits pull him down harder (round 4)   // land on a fake on the beat and confidence makes it real (round 3)
    theme: { glitchReveals: true, decor: ['pages', 'confetti', 'shaft', 'needed', 'fallstreaks', 'wrongstamp'], backdrop: 'page', bg: '#0b0a08', digit: '#d8c39a', digit2: '#ff8a5c', edge: '#e8dcc0', block: '#16130e', word: '#fff1d6',
      blockText: 'citation needed · source: trust me · [1][2][3] · ', blockTextColor: '#bfae86', light: '#ffe2b0', light2: '#d8c39a', halo: '#ffe2b0',
      scrapColor: '#d8c39a', camMax: 5, scraps: ['[citation needed]', 'source: trust me', 'DOI 7.HELL-NO.420', 'Dr. Gary McFluffernutter Barrett', 'Nature Valley (granola)', 'the sky is stew', 'CITED'] },
    sections: [['boot sequence', 0, 1], ['yappin’ back', 15, 1], ['wrong with authority', 62.6, 1.05], ['weirdly applaudable', 100.7, 1],
      ['he’s in the data now', 147.8, 1], ['wrong with authority (again)', 202, 1.08], ['beefwhistle', 230, 1]],
    objs: L.objs, boosts: L.boosts, signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: lastT + 7 * P, start: 0,
  };
}
