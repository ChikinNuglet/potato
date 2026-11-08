// Level 1 — Thursday Potato: "coming to in the 404" (game/LEVEL-1.md). Song 106 s, game beat 0.654 s (163 beats).
// Course in ENCOUNTER beats: the beat a thing reaches Potato's usual spot on screen.
export default {
  n: 1, id: 'thursday-potato', title: 'Thursday Potato', place: 'the 404', song: 'songs/thursday-potato.mp3', map: 'songs/thursday-potato.map.json',
  theme: 'void404', power: 'king', kitchen: true,
  sections: [['the link breaks', 0], ['who’s this?', 16], ['swagger', 64], ['the world has things in it', 80],
             ['the 404 tries to clear him', 128], ['found a home', 144]],
  creep: b => b >= 128 && b < 144 ? 1.8 * Math.min(1, (b - 128) / 10) : 0,     // bridge: the erasing page bites in
  course(c) {
    // 0 intro (0-15): he arrives. Nothing can hurt him. A little stair to try a jump.
    c.step(10, 2, 0.6); c.deco(13, 'ping-beckon', 1.6, 1.1);
    // 1 verse 1 (16-63): who's this? jump, duck, then his base power: glitch through walls
    c.low(19); c.gap(23, 2); c.step(27, 3, 1.0); c.duck(32, 3);
    c.deco(36, 'ping-send-ping', 2.2, 1.0); c.wall(38);                        // first wall: too tall to jump -> glitch
    c.gap(43); c.wall(47); c.low(51); c.gap(54, 2); c.duck(58, 2); c.wall(62);
    // 2 chorus (64-79): the stage pumps with the song; a wall on the bar
    c.deco(64, 'sync-count-in', 2.8, 1.3); c.gap(65, 14);
    c.pump(65, 2, 0.4); c.pump(68, 2, 0.9); c.pump(71, 2, 0.5); c.pump(74, 2, 1.0); c.pump(77, 2, 0.4);
    c.deco(73, 'sync-mark-beat', 3.0, 1.2);
    // 3 verse 2 (80-127): the world has things in it. First download, then Spam pushes back.
    c.packet(83);
    c.spam(92); c.spam(95); c.spam(99);
    c.gap(104, 6); c.spam(103, 0.15, { speed: 0.6 }); c.spam(107, 0.15, { speed: 0.6 });
    c.blink(106, 2, 0, '0111'); c.deco(106, 'buffer-loading-spiral', 1.6, 1.0);   // freeze Spam (King) or time Buffer's late platform
    c.wall(114); c.duck(117, 2); c.gap(121, 2); c.wall(125);
    // 4 bridge (128-143): the 404 tries to clear him. The edge bites in.
    c.wall(130); c.gap(132); c.wall(134); c.gap(136); c.duck(138, 2); c.wall(141);
    // 5 final chorus (144-162): the drop is a held breath over the last gap; the platform lands with the beat
    c.gap(147, 4); c.drop(148, 2, 0.5); c.wall(153); c.low(156); c.spam(158);
    c.deco(160, 'captcha-approved-dance', 0, 1.3);
  },
};
