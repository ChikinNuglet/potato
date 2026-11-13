// room.mjs — the edges of his world, in body heights, y up. Filled by the host (bench: a rectangle; pet: the Dock, the menu
// bar and the screen edges; game: its own floor and ledges). The floor may move: it is a collider with a speed, so hiding
// the Dock under him drops him with no extra code.
// Game-feel and physics engineer (seat 3).
export function createRoom() {
  const room = {
    left: 0, right: 9.6, floor: 0, ceiling: 6, floorV: 0,
    ledges: [],              // [{ x0, x1, y }] one-way, from above. In the format; nobody fills it tonight.
    version: 0,
    /** set({ floor, ceiling, left, right, ledges }) in bh. Anything left out keeps its value. */
    set(r) {
      for (const k of ['left', 'right', 'floor', 'ceiling']) if (typeof r[k] === 'number' && r[k] === r[k]) room[k] = r[k];
      if (Array.isArray(r.ledges)) room.ledges = r.ledges;
      room.version++;
    },
    get width() { return room.right - room.left; },
    get height() { return room.ceiling - room.floor; },
    describe() { return `left ${room.left} right ${room.right} floor ${room.floor} ceiling ${room.ceiling}`; },
  };
  return room;
}
