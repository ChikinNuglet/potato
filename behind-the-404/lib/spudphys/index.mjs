// spudphys — public exports. Small deterministic XPBD physics for the Potato game.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE. Credits: NOTICE (Matthias Müller).

export { World, Driver } from './world.mjs';
export { Collider, PLANE, SPHERE, CAPSULE, BOX } from './colliders.mjs';
export { dsin, dcos, dexp, mulberry32, stream, fnv1a } from './dmath.mjs';
export * as vec from './vec.mjs';
export { extractRotation } from './polar.mjs';
export { DistanceGroup } from './constraints/distance.mjs';
export { TetVolumeGroup } from './constraints/tetvolume.mjs';
export { ShapeMatchGroup, PressureGroup } from './constraints/shapematch.mjs';
export { AttachGroup, TetherGroup } from './constraints/attach.mjs';
export { squash } from './squash.mjs';
export { computeNormals } from './adapters/meshout.mjs';

import { cape } from './adapters/cape.mjs';
import { rope } from './adapters/rope.mjs';
import { prop, pile } from './adapters/prop.mjs';
import { toss } from './adapters/toss.mjs';
import { chain, chainFromRig } from './adapters/chain.mjs';
import { dough } from './adapters/dough.mjs';
/** The five adapters (+ toss, the no-simulation prop tier). */
export const adapters = { cape, rope, prop, pile, toss, chain, chainFromRig, dough };
export { cape, rope, prop, pile, toss, chain, chainFromRig, dough };
export const VERSION = '0.2.0';
