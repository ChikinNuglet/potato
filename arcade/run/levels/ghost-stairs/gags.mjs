// gags.mjs: the comedian's small gags for Ghost stairs, one row each, each with its own off switch.
// Comedian "Edited", team Downstairs Neighbours, Nov 6. Thoughts are DRAFTS for Chikin (keep / cut / not me / rewrite).
// Rule: his thoughts only ride the drops (no phone is talking, and the 0.7 s landing silence is empty anyway).
// Never in S8, S9, S11, S13, S14. Nothing here touches a Kevin line.
export const GAGS = {
  // S0, James's lock screen. The padlock shakes "no" on sung "face". No word.
  faceNo:     { on: true, step: 'S0', t: 6.38, kind: 'lock-shake', ms: 450 },
  // S2, Dev's phone. If he glitches the dud, the tiny phone-grey word sits under it the frame the rewrite settles.
  edited:     { on: true, step: 'S2', when: 'after-glitch', kind: 'under-bubble', text: 'Edited' },
  // S3 -> S4 drop, only if taticat's potato has landed: he looks back up at it.
  notMe:      { on: true, step: 'S3', when: 'drop', kind: 'thought', text: "that one wasn't me.", face: 'question', s: 1.5 },
  // S4 -> S5 drop, as her bubble breaks under him on "STILL".
  // (foreman, Nov 6: off. 0.7 s can't carry five words, the playtester and builder both said so, and the test is 'if it's noisy, cut it'. true puts it back)
  tooHeavy:   { on: false, step: 'S4', when: 'drop', kind: 'thought', text: 'no body. still too heavy.', face: 'skeptical', s: 0.7 },
  // S4, only if the falling block sign hits him: it hangs over his head like a halo for one beat, then breaks.
  blockHalo:  { on: true, step: 'S4', when: 'hit-block', kind: 'halo', beats: 1 },
  // Status bar clock, one value per step, changes only while the phone is dim. Pays off Read 4:04.
  clock: { on: true, kind: 'status-clock', byStep: ['9:41','9:58','10:20','10:47','11:15','11:52','12:30','1:06','1:44','2:21','2:23','2:58','3:37','4:02','4:04'] },
  // ★ the playtester's bold choice: the run where nobody pressed anything. Only if he took NOTHING all song, on the long fall, the last place a thought is allowed.
  // The story happens anyway (that's the design: a missed glitch costs the joke). This is the one line that admits it. Most players never see it. DRAFT for Chikin. Off: on: false
  untouched:  { on: true, step: 'S13', when: 'long fall, took nothing', kind: 'thought', text: "didn't touch a thing.", face: 'skeptical', s: 1.06 },
};
// BOLD CHOICE. S11, after "Read by 43": taticat starts typing, she (and you) hope for a second, and it's the same 🥔.
// The potato row itself is the writer's and stays. false = silence until the potato, as scripted.
export const TATICAT_TYPES = true;
export const TATICAT_DOTS = { step: 'S11', from: 97.35, to: 98.70, who: 'taticat' };
