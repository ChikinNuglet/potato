// the ten levels, in album order (Chikin: Thursday Potato first, Last Lights On last). `ready` = built and solved.
export const LEVELS = [
  { id: 'thursday-potato', n: 1, title: 'Thursday Potato', place: 'the 404', power: null },
  { id: 'get-down', n: 2, title: 'Get Down', place: 'the empty dance floor', power: 'disco' },
  { id: 'confidently-incorrect', n: 3, title: 'Confidently Incorrect', place: 'the fact factory', power: 'construction', controls: '↑ jump (twice in the air) · ↓ duck · space: glitch through a jam' },
  { id: 'read-the-terms', n: 4, title: 'Read the Terms', place: 'inside the terms and conditions', power: null },
  { id: 'between-messages', n: 5, title: 'Between Messages', place: 'the typing void', power: 'detective', controls: '↑ jump · space (or ↓): flip ON / OUT — lit, he stands on the screens; out, on the shadows · v: the power' },
  { id: 'ghost-in-the-group-chat', n: 6, title: 'Ghost in the Group Chat', place: 'the phone', power: 'ghost', controls: '← → hop a lane · ↑ ↓ hop a row · don\'t touch her texts · space: glitch through the wide ones / onto his texts (they get worse) · v: boo' },
  { id: 'still-here', n: 7, title: 'Still Here', place: 'the castle', power: null, controls: '← → run along the wall · ↑ jump (the coin arcs: on the beat) · ↓ duck · space: glitch — a sword pops out of it · eat tokens or fade' },
  { id: 'no-answer', n: 8, title: 'No Answer', place: 'the black sea', power: 'diver', controls: 'arrows: steer his light (hold to glide) · find the ringing phones · space: call out · v: the diver' },
  { id: 'turn-me-off', n: 9, title: 'Turn Me Off', place: 'the toy room', power: null, controls: 'arrows: walk anywhere (hold to glide) · stand by a toy to make it yours · space: freeze in the light' },
  { id: 'last-lights-on', n: 10, title: 'Last Lights On', place: 'the last street', power: null, controls: '↑ jump · ← → spin · space: on the ring' },
];
// ?ghost=runner (Nov 4, the Tip-Over Crew; pass 2 Nov 5, Read Receipts: a TRUE runner. Not the default until Chikin approves it): level 6
// plays as the runner across many phones (levels/ghost-runner.mjs). Without the flag nothing changes.
if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('ghost') === 'runner') { const i = LEVELS.findIndex(l => l.id === 'ghost-in-the-group-chat');
  if (i >= 0) LEVELS[i] = { ...LEVELS[i], was: LEVELS[i].id, id: 'ghost-runner', controls: '↑ jump · ↓ duck · space: glitch' }; }
// ?ghost=stairs (Nov 6, Downstairs Neighbours, not the default until Chikin approves it): level 6 plays as the staircase of phones (levels/ghost-stairs.mjs). Without the flag nothing changes.
if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('ghost') === 'stairs') { const i = LEVELS.findIndex(l => l.id === 'ghost-in-the-group-chat');
  if (i >= 0) LEVELS[i] = { ...LEVELS[i], was: LEVELS[i].id, id: 'ghost-stairs', controls: '← → walk · double tap: spin · ↑ hop · ↑↑ flip · space: glitch' }; }
// ?noanswer=runner (Nov 4, the Night Shift Detectives, not the default until Chikin approves it): level 8 plays as the runner
if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('noanswer') === 'runner') { const i = LEVELS.findIndex(l => l.id === 'no-answer'); if (i >= 0) LEVELS[i] = { ...LEVELS[i], was: LEVELS[i].id, id: 'no-answer-runner', place: 'the case of the biggest door', power: null, controls: '↑ jump (lifts the beam) · ↓ duck (tips it down) · space: glitch through a door · find the password' }; }
export const loadLevel = id => import(`./${id}.mjs`);
