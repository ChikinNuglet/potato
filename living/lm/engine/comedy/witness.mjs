// witness.mjs — ONE WITNESS. The comedian's bold choice, round 2 (team Not A Screensaver). Mine; nothing else was edited.
//
// When one Potato is thrown (by you) or shoved (by another) and comes to rest, exactly ONE of the others — the nearest one
// that is standing — waits a beat, looks at him, then looks at YOU and holds it. Nobody else moves. Somebody saw what you did.
// It is the opposite of all_five_once: that one is a chorus, this one is a single juror.
//
// It uses only what is public: living.on(), living.clock.after(), living.moves.play() and .look(). No random numbers of its
// own, so a strip replays exactly. It draws nothing and writes no pose: it asks the animator's own turn_small and look.
// Why a turn and not only his eyes: tried eyes first (lookAfter). A look to his far left slides both pupils out of sight and he
// reads as blank white eyes for 30 frames. A quarter turn of the body reads at desktop size; the eyes then only go to you.
//
// SWITCH: it is OFF unless a host installs it (one line):   import('./engine/comedy/witness.mjs').then(m => m.install(living))
//         and even when installed, `?witness=0` in the page address, or install(living, { on: false }), turns it off.
// Bench:  python3 tools/bench.py --script bowl --n 5 --do "1:import('/game/living-model/engine/comedy/witness.mjs').then(m => m.install(living))" ...
export const WITNESS = {
  wait_f: 40,        // after he has landed: the beat before anyone admits they saw
  turn_rad: 0.5,     // how far he turns toward the one on the floor (the animator's turn_small, eased)
  on_him_f: 36,      // turned toward him, counted from the start of the turn
  turn_back_f: 16,   // the turn home
  on_you_f: 54,      // then eyes on you. The laugh is here, so it is the longest number in the file
  cooldown_f: 1200,  // 20 s: a juror who looks every time is a laugh track
  reach_bh: 6,       // further away than this, nobody saw anything
};

export function install(living, opts = {}) {
  let off = opts.on === false;
  try { if (new URLSearchParams(globalThis.location ? globalThis.location.search : '').get('witness') === '0') off = true; } catch (e) { /* no page: stay on */ }
  const state = { installed: !off, fired: 0, last_k: -1e9, last: null };
  if (off) return state;
  const cfg = { ...WITNESS, ...(opts.numbers || {}) };
  const { body, clock, moves, MODE } = living;
  const victims = new Map();   // slot -> who did it (a slot, or 'user')
  living.on('thrown', e => { if (e.by === 'user' || e.by == null) victims.set(e.slot, 'user'); });
  living.on('shoved', e => { victims.set(e.slot, e.by); });
  living.on('landed', e => {
    if (!victims.has(e.slot)) return;
    const by = victims.get(e.slot); victims.delete(e.slot);
    if (clock.k - state.last_k < cfg.cooldown_f) return;
    const v = e.slot;
    clock.after(cfg.wait_f, () => {
      let best = null, bd = cfg.reach_bh;
      for (const p of living.potatoes) {
        if (p.slot === v || p.slot === by) continue;
        if (body.mode[p.slot] !== MODE.ground) continue;                 // standing, not held, not down, not in the air
        const now = moves.current ? moves.current(p) : '';
        if (now === 'nod_off' || now === 'sleep_slide') continue;        // the sleeper never sees anything: that is his bit
        const d = Math.abs(body.x[p.slot] - body.x[v]);
        if (d < bd) { bd = d; best = p; }
      }
      if (!best || !moves.play || !moves.look) return;
      const slot = best.slot, dir = body.x[v] < body.x[slot] ? -1 : 1;
      moves.play(best, 'turn_small', { to: dir * cfg.turn_rad });
      clock.after(cfg.on_him_f, () => {
        if (living.find(slot) !== best || body.mode[slot] !== MODE.ground) return;   // picked up or knocked meanwhile: drop it
        moves.play(best, 'turn_small', { to: 0 });
        // 'you' is the animator's straight-out-of-the-screen gaze (the fries stare). Asked again once the turn has landed,
        // because a turn that starts takes the gaze with it.
        moves.look(best, 'you', { hold_f: cfg.on_you_f + cfg.turn_back_f });
        clock.after(cfg.turn_back_f, () => { if (living.find(slot) === best && body.mode[slot] === MODE.ground) moves.look(best, 'you', { hold_f: cfg.on_you_f }); });
      });
      state.fired++; state.last_k = clock.k; state.last = { k: clock.k, witness: best.id, saw: v, by };
      living.emit('witness', { slot: best.slot, saw: v, by });
    });
  });
  return state;
}
