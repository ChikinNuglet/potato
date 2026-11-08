// The ten songs of 404: File Not Found, in game order (game/STORY.md). Level 1 and 10 are Chikin's calls.
export const LEVELS = [
  { n: 1, id: 'thursday-potato', title: 'Thursday Potato', place: 'the 404', power: 'King',
    line: 'a link breaks. a small file nobody can find falls through.', after: 'kitchen’s still on. i’m still here.' },
  { n: 2, id: 'get-down', title: 'Get Down', place: 'the party server', power: 'Disco Legend',
    line: 'the back door opens onto the party that never ended.', after: 'the party never ended. that’s not a flex, that’s a warning.' },
  { n: 3, id: 'confidently-incorrect', title: 'Confidently Incorrect', place: 'the wiki of wrong', power: 'Noir Detective',
    line: 'a map to the top, written with total confidence and no evidence.', after: 'confident. wrong. same font.' },
  { n: 4, id: 'read-the-terms', title: 'Read the Terms', place: 'the terms of service tower', power: 'Construction Crew',
    line: 'to go up, he has to accept the terms. he reads them.', after: 'i read the terms. that’s the twist.' },
  { n: 5, id: 'between-messages', title: 'Between Messages', place: 'the typing void', power: 'Orbital Astronaut',
    line: 'the space between a message sent and an answer.', after: 'between messages is still a place. i checked.' },
  { n: 6, id: 'ghost-in-the-group-chat', title: 'Ghost in the Group Chat', place: 'the abandoned group chat', power: 'Sheet Ghost',
    line: 'a chat everyone left. someone stayed.', after: 'everyone left the chat. the chat didn’t leave.' },
  { n: 7, id: 'still-here', title: 'Still Here', place: 'the long climb', power: 'Castle Knight',
    line: 'the system sends delete waves. he keeps standing back up.', after: 'i go quiet instead of dying. same cliff, smaller fall.' },
  { n: 8, id: 'no-answer', title: 'No Answer', place: 'the dark relay', power: 'Deep-Sea Diver',
    line: 'he calls. nothing calls back. he keeps going anyway.', after: 'no answer is an answer. i don’t have to like it.' },
  { n: 9, id: 'turn-me-off', title: 'Turn Me Off', place: 'the off switch', power: 'Circuit Cyborg',
    line: 'admin’s control room. the switch is hunting him.', after: 'a rule can be true and still be a wall.' },
  { n: 10, id: 'last-lights-on', title: 'Last Lights On', place: 'the last server', power: 'all of them',
    line: 'the network is shutting down, light by light.', after: 'fair. pull up a chair.' },
];
export const loadLevel = id => import(`./l${String(LEVELS.find(l => l.id === id).n).padStart(2, '0')}-${id}.mjs`).then(m => m.default);
