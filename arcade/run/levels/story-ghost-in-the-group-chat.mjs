// The music video for Ghost in the Group Chat — round 3 (Nov 1): there isn't one behind the phone any more.
// Matt: "I dont like the house, the whole screen almost should be a phone, the beginning of the level could be a phone on a
// table, we see the screen glitch potato, we zoom in, and the game starts". So the house, the street, the moon and the crew are
// gone (round 2 is in the backups). The video IS the phone now: the table it lies on, its lock screen, the dolly in, the thread,
// and the last image (the phone dark on the table, the router's lights gone purple) are all drawn by the mode
// (run/modes/ghost-in-the-group-chat.mjs), because they ride the mode's camera — and this story plane is placed in screen
// space before the mode moves the camera, so anything drawn here would slide off the table during the zoom.
// It stays as an empty story so the engine keeps its runner scraps hidden behind the table.
export function story(ctx, e) { void ctx; void e; }
