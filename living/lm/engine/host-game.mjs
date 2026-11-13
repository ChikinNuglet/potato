// host-game.mjs — a STUB. How the game loads the same engine and the same data later. Nothing in any level uses this yet
// and no game file was touched.
//
// The game would do, from its own files (paths are the game's):
//   import * as T from './vendor/three.module.js';  import { createSpud } from './spud3d.mjs';  import * as phys from './spudphys/dmath.mjs';
//   import { createGameHost } from '<living-model>/engine/host-game.mjs';
//   const host = await createGameHost({ T, createSpud, phys, scene, data, seed, pxPerBh });
//   each fixed 1/60 step of the game:   host.living.tick()        (song time stays the game's)
//   an enemy hits him:                  host.living.input({ type: 'poked', id })
//   a launcher throws him:              host.living.body.impulse(slot, vx, vy, spin)
//   the level's floor and ledges:       host.living.room.set({ floor, ceiling, left, right, ledges: [{ x0, x1, y }] })
// A level that owns his position (a runner) is not built: it needs a `body: 'host'` switch in living.mjs that reads x, y
// instead of writing them. Said plainly: that switch does not exist yet.
// Game-feel and physics engineer (seat 3).
import { createLiving } from './living.mjs';

export async function createGameHost({ T, createSpud, phys, scene, data, seed = 1, pxPerBh = 150, plugins = {}, spudOpts = {} }) {
  const host = { scene, pxPerBh, yScale: 1, spudOpts };
  const living = createLiving({ T, createSpud, phys, data, host, seed, plugins });
  return { living, host };
}
