// the ten levels, in album order (Chikin: Thursday Potato first, Last Lights On last). `ready` = built and solved.
export const LEVELS = [
  { id: 'thursday-potato', n: 1, title: 'Thursday Potato', place: 'the 404', power: null },
  { id: 'get-down', n: 2, title: 'Get Down', place: 'the party server', power: 'disco' },
  { id: 'confidently-incorrect', n: 3, title: 'Confidently Incorrect', place: 'the wiki of wrong', power: 'detective' },
  { id: 'read-the-terms', n: 4, title: 'Read the Terms', place: 'the terms tower', power: 'construction' },
  { id: 'between-messages', n: 5, title: 'Between Messages', place: 'the typing void', power: 'astronaut' },
  { id: 'ghost-in-the-group-chat', n: 6, title: 'Ghost in the Group Chat', place: 'the abandoned chat', power: 'ghost' },
  { id: 'still-here', n: 7, title: 'Still Here', place: 'the long climb', power: 'knight' },
  { id: 'no-answer', n: 8, title: 'No Answer', place: 'the dark relay', power: 'diver' },
  { id: 'turn-me-off', n: 9, title: 'Turn Me Off', place: 'the off switch', power: 'cyborg' },
  { id: 'last-lights-on', n: 10, title: 'Last Lights On', place: 'the last server', power: 'singularity' },
];
export const loadLevel = id => import(`./${id}.mjs`);
