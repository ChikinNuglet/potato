// Level 6, THE STAIRS (?ghost=stairs; team Downstairs Neighbours, Nov 6; not the default until Chikin approves it).
// Chikin, Nov 6: "I think we're headed the wrong direction with ghost" · "It feels better the old way" · "it needs to be that, but multiple phones, so it can be
// a side scroller but a falling one" · "Like stairs" · "right now it's too noisy and going straight across you miss all of the conversation".
// One conversation, many neighbours' phones, stepping down the hill. One phone is live, the rest are dim. He lands, reads, glitches what glows, and drops.
// The crew's docs: levels/ghost-stairs/ (SCRIPT.md the chat · STEPS.md the staircase · gags.mjs the jokes · chat.mjs the chat as data · BOARD.md).
// Rules + look: run/modes/ghost-stairs.mjs. The default Ghost and the runner are NOT edited: the opening (0–7.88, the table) is the current Ghost's own, imported.
import { parseWords } from './kit.mjs';
import { story } from './story-ghost-in-the-group-chat.mjs';
import { THREAD, ALT, FAIL_LINES, BLOCK } from './ghost-in-the-group-chat.mjs';
import { mode, modeView, R } from '../modes/ghost-stairs.mjs';
import { STEPS } from './ghost-stairs/chat.mjs';
export { parseWords };
export const meta = { id: 'ghost-stairs', n: 6, title: 'Ghost in the Group Chat', place: 'the group chat', song: 'songs/ghost-in-the-group-chat.mp3',
  map: 'songs/ghost-in-the-group-chat.map.json', words: 'words/ghost-in-the-group-chat.tsv', viz: 'songs/ghost-in-the-group-chat.viz.json' };

// (the first thing on the lock screen is the plot: the writer's S0. The default Ghost's thread itself is untouched)
const firstS = THREAD.findIndex(r => r.w === 'S'), OPENING = THREAD.map((r, i) => i === firstS ? { ...r, x: 'anyone seen him?' } : r);

export function build(words, map) {
  const E = 121.4;
  const sections = STEPS.map(q => [q.name, q.land, 0]);
  const NOFLASH = 'rgba(0,0,0,0)', looks = [[7.88, 999, 'sheet-ghost', NOFLASH]];   // (ghost Potato from the moment he's in. Chikin: "make sure they use ghost potato for the finish")
  return {
    blankDef: d => ({ ...d, storyRun: true }),
    mode, modeView, speed: 1, sections, retry: 'section', spin: s => s.spinAt === s.t, objs: [], boosts: [], outro: false, cutscenes: [], touchMode: 'tapdrag', stickPress: true,
    // (the current Ghost's def, for its opening on the table only: the same lock screen, the same notification at 5.15)
    phone: { thread: OPENING, fail: FAIL_LINES, alt: ALT,
      open: { lit: 0.65, glitch0: 2.3, appear: 3.1, zoom0: 2.3, notify: 5.15, zoom1: 7.6, wake: 7.88, end: 7.9, wide0: 8.2, wide1: 8.85, ctl: 8.9 },
      grid: { P: 0.61227, OFF: 0.21 }, grace: 21.03, lead: 1.3, block: BLOCK, depEnd: 108.0, jolts: [],
      end: { lock: 115.62, slider: 115.62, steps: [118.08, 118.69, 119.31, 119.92], see: 118.08, leap: 119.92, out: 999, black: 999 } },
    looks, glows: looks.map(l => l[0]),
    // faces on song moments (the runner's list, the quiet lines go soft). The mode adds its own.
    faces: [[5.85, 'smirk', 1.1], [18.05, 'wide', 0.6], [26.36, 'smirk', 0.8], [37.96, 'smirk', 1.0], [48.52, 'skeptical', 0.9], [54.25, 'skeptical', 0.35], [61.40, 'thinking', 3.2],
      [68.37, 'smirk', 1.0], [76.35, 'sleepy', 1.2], [87.39, 'sleepy', 1.2], [92.05, 'question', 1.2], [105.19, 'smirk', 0.9], [107.65, 'thinking', 0.9], [110.71, 'shock', 0.9]],
    story,
    theme: { noPunch: true, noBeatSpin: true, noGhost: true, backdrop: 'plain', bg: '#0b0e1d', digit: '#1a2142', digit2: '#ffd6a0', edge: '#c8d2ff', block: '#0c0f1c', word: '#f0f2ff',
      light: '#000000', light2: '#000000', halo: '#e9e6ff', lyric: '#c8d2ff', lyricColor: '#c8d2ff', lyricKeys: ['ghost', 'chat', 'real', 'there', 'room', 'block', 'mute'],
      lyrics: false, pulse: false, hideCharge: true, camFix: 0, viewH: 13.6, pulseColor: '#8fd8e6', decor: [], igOff: true, gwords: false },
    signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: E, start: 0,
  };
}
export { R };
