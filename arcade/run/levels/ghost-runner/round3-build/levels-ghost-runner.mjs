// Level 6, THE TRUE RUNNER (?ghost=runner; pass 2, team Read Receipts, Nov 5; not the default until Chikin approves it).
// Chikin played pass 1: "its supposed to be a runner" · "not quite clear what you are supposed to do or why you do it" · "hes a little hard
// to move around" · "lets send it back with a writing crew now" · "the script is the movie". So: he runs right on his own with the song;
// you only jump (↑), duck (↓) and glitch (Space, one rule: he goes purple). The chat is the level: the writers' SCRIPT.md, phone by phone,
// turned into the course by levels/ghost-runner/course-gen-v3.mjs (course-v3.json; never hand-edit it). Every door is a text going out:
// he rides the newest text from one phone onto the next, and turns James's words into his on the way.
// The crew's docs: levels/ghost-runner/ (PLAN-v3.md the build plan · DESIGN-v3.md rules + numbers · SCRIPT.md the chat · JOKES-v2.md ·
// BOARD.md). Rules + look: run/modes/ghost-runner.mjs. The saved Ghost (run/saved/) and the default Ghost (levels/ghost-in-the-group-chat.mjs
// + its mode) are NOT edited: the opening (0–7.88, the table) is the current Ghost's own, imported. Pass 1 is in levels/ghost-runner/round2-build/.
import { parseWords } from './kit.mjs';
import { story } from './story-ghost-in-the-group-chat.mjs';
import { THREAD, ALT, FAIL_LINES, BLOCK, JOLTS } from './ghost-in-the-group-chat.mjs';
import { mode, modeView, fairRunner, fairThings } from '../modes/ghost-runner.mjs';
export { parseWords };
export const meta = { id: 'ghost-runner', n: 6, title: 'Ghost in the Group Chat', place: 'the group chat', song: 'songs/ghost-in-the-group-chat.mp3',
  map: 'songs/ghost-in-the-group-chat.map.json', words: 'words/ghost-in-the-group-chat.tsv', viz: 'songs/ghost-in-the-group-chat.viz.json' };

// the course (course-gen-v3.mjs → course-v3.json)
const COURSE_URL = new URL('./ghost-runner/course-v3.json', import.meta.url);
export const COURSE = typeof window !== 'undefined' && typeof process === 'undefined'
  ? await fetch(COURSE_URL).then(r => r.json())
  : JSON.parse((await import('node:fs')).readFileSync(COURSE_URL, 'utf8'));
// his thoughts (JOKES-v2 §2, the comedian's six, DRAFTS for Chikin: keep / cut / not me / rewrite; off with thoughts: false). WHEN each one
// plays is the generator's (course-v3.json thoughtAt: it slides a thought up to a beat clear of every press, or skips it). A string `at` =
// an event the mode logs; it must have happened.
export const THOUGHTS = [
  { n: 1, at: 'door1', text: 'delivered. so am i.', burst: 'h@ndsh—', face: 'smirk' },
  { n: 2, at: 18.30, cond: s => (s.rewN || 0) > 0 || Object.keys(s.rew || {}).length > 0, text: 'you typed. i sang.', burst: 'y3a—h', face: 'smirk' },
  { n: 4, at: 'tipper1', text: e => e.good ? 'good phone. stay.' : 'fell without me. fine.', burst: e => e.good ? '0xF00D//' : 'fzzt…', face: e => e.good ? 'smirk' : 'skeptical' },
  { n: 3, at: 'jess', text: "i've been framed.", burst: '@_@?!', face: 'wide>smirk' },
  { n: 5, at: 105.45, text: 'left. still here.', burst: 'hold—old//', face: 'skeptical' },
  { n: 6, at: 115.62, text: 'off is a door too.', burst: 'tzzk', face: 'wide' },
];
// the death lines (JOKES-v2 §5, DRAFTS): [0], or [1] if [0] was the last one shown; they replace only the small subtitle
export const DEATH = { lock: [['put down. with me in it.', 'zzk—tk'], ['phone panini.', 'vrrzt']], bubble: [['her text landed. on me.', 'wh@t?!'], ['heavy message.', 'brzzk']],
  blocked: [['blocked. physically.', 'EBUSY_?'], ['blocked. again. physically.', 'ret_r_y']] };

export function build(words, map) {
  const E = 121.4;
  // retries start at a section's line (DESIGN-v3 §11), snapped by the generator to the first phone he enters at or after it
  const sections = COURSE.sections.map(q => [q.name, q.t, 0]);
  const NOFLASH = 'rgba(0,0,0,0)', looks = [[30.5, 50.2, 'sheet-ghost', NOFLASH], [89.4, 108.2, 'sheet-ghost', NOFLASH]];
  let lastLine = null;
  const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  return {
    blankDef: d => ({ ...d, storyRun: true }),
    deathText: s => { const L = DEATH[s.why]; let pick = L ? L[0] : ['squished.', '']; if (L && pick[0] === lastLine) pick = L[1]; lastLine = pick[0];
      return `the video stopped at ${fmt(s.t)} · ${pick[0]} ${pick[1]} · potato rewrote ${s.glitched || 0} texts`; },
    fair: { jolts: fairRunner, things: C => fairThings(C) },
    mode, modeView, speed: 1, sections, retry: 'section', objs: [], boosts: [], outro: false, cutscenes: [], touchMode: 'tapdrag', stickPress: true,
    // (the current Ghost's def, for its opening on the table: the same thread, the same lock screen, the same notification at 5.15)
    phone: { thread: THREAD, fail: FAIL_LINES, alt: ALT,
      open: { lit: 0.65, glitch0: 2.3, appear: 3.1, zoom0: 2.3, notify: 5.15, zoom1: 7.6, wake: 7.88, end: 7.9, wide0: 8.2, wide1: 8.85, ctl: 8.9 },
      grid: { P: 0.61227, OFF: 0.21 }, hint0: [9.2, 12.3], grace: 21.03, lead: 1.3, block: BLOCK, depEnd: 108.0, jolts: [],
      end: { lock: 115.62, slider: 115.62, steps: [118.08, 118.69, 119.31, 119.92], see: 118.08, leap: 119.92, out: 120.05, black: 120.2 } },
    runner: { course: COURSE, thoughts: THOUGHTS },
    thoughts: true,   // (Chikin can switch the comedian's thoughts off here)
    looks, glows: looks.map(l => l[0]),
    // faces on song moments (JOKES-v2 §3; the quiet lines go soft, the defines held thinking). The mode adds the moment faces.
    faces: [[5.85, 'smirk', 1.1], [18.05, 'wide', 0.6], [26.36, 'smirk', 0.8], [37.96, 'smirk', 1.0], [48.52, 'skeptical', 0.9], [54.25, 'skeptical', 0.35], [61.40, 'thinking', 3.2],
      [68.37, 'smirk', 1.0], [76.35, 'sleepy', 1.2], [87.39, 'sleepy', 1.2], [92.05, 'question', 1.2], [105.19, 'smirk', 0.9], [107.65, 'thinking', 0.9], [110.71, 'shock', 0.9], [113.17, 'wide', 0.8]],
    story,
    theme: { noPunch: true, noGhost: true, backdrop: 'plain', bg: '#0b0e1d', digit: '#1a2142', digit2: '#ffd6a0', edge: '#c8d2ff', block: '#0c0f1c', word: '#f0f2ff',
      light: '#000000', light2: '#000000', halo: '#e9e6ff', lyric: '#c8d2ff', lyricColor: '#c8d2ff', lyricKeys: ['ghost', 'chat', 'real', 'there', 'room', 'block', 'mute'],
      lyrics: false, pulse: false, hideCharge: true, camFix: 0, viewH: 13.6, pulseColor: '#8fd8e6', decor: [], igOff: true, gwords: false },
    signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: E, start: 0,
  };
}
