// perform.mjs — runs a behaviour's BEATS (the verbs of data/behaviour.json) on one Potato.
//
// The beat runner   play(p, unit) / step(p) / stop(p): draws every range fresh, flips sideA / sideB by a coin, fires the cue,
//                   and turns each verb into something the engine does.
// WHO MOVES HIM depends on what is loaded:
//   the animator's moves (engine/moves.mjs with play / look / walkTo / has)   THE REAL THING. look -> moves.look, walk -> moves.walkTo,
//        turn -> her turn_small / turn_big / about_face, a named move -> moves.play, hop -> her hop, sleep -> her nod_off, shove -> her
//        bump / shove clips. A beat does not end until what it started has finished, so her queue never backs up. I never cut one of
//        her walks. On top of her targets I only ADD small eased offsets she has no verb for: a held lean (shear), a held squash, the
//        argue bob, the mood's carriage (a few degrees of yaw, a hair of lean and height), and a stepped purple glitch.
//   no moves plug-in, or the engineer's placeholder   my own plain stand-in: an eased walk with a waddle, a rate-limited turn, lids
//        and gaze channels. Enough to see the brain decide. It is not animation.
// Named moves with nothing behind them are collected in perform.missing (the director's rule 4) and reported, never faked.
// Nothing here writes a channel VALUE or touches the model: targets only, set after the moves plug-in, on the ground only.
// Behaviour Designer (seat 4), Build round.
// Round 3: a walk can go to a PLACE the brain chose (info.placeX); 'home' for a turn is his STANCE yaw (perf.setStance: mood alone,
// clump in a crowd); a tracking turn re-aims when the one he watches crosses him (the tennis crowd); a unit can be exact (no personality
// stretch, for two in unison); onBeat tells the crowd when a bob starts; an idle glitch beat plays the animator's carrier move.
import { IDX } from '../channels.mjs';
import { MODE } from '../body.mjs';

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x), sgn = x => (x > 0 ? 1 : x < 0 ? -1 : 0);
const follow = (v, t, k, max) => v + clamp((t - v) * k, -max, max);
const SPEED = { slow: 0.5, normal: 0.9, fast: 1.5 }, TURN = { slow: 0.035, normal: 0.06, fast: 0.11 }, RATE = { slow: 0.75, normal: 1, fast: 1.35 };
const PLACEHOLDER_MOVES = new Set(['gather', 'settle', 'sigh', 'chew', 'nub_tap', 'bump', 'one_nub']);
const mid = t => (t == null ? 0.3 : Array.isArray(t) ? (t[0] + t[1]) / 2 : typeof t === 'number' ? t : 0.5);

export function createPerformer(ctx, { minds }) {
  const { data, clock, rng, channels: ch, body, room, rig, emit, senses } = ctx, D = data.behaviour, W = (body.W || 0.5) * 2;
  const cap = (data.physics && data.physics.squash && data.physics.squash.cap) || 0.12, dirMoods = (data.direction && data.direction.moods && data.direction.moods.list) || {};
  const st = [], missing = new Set(), placeholders = new Set(), used = new Set();
  const perf = { missing, placeholders, used, st };
  const MV = () => ctx.moves, real = () => !!(ctx.moves && typeof ctx.moves.play === 'function' && typeof ctx.moves.has === 'function');
  const cursorSeen = () => senses && senses.cursor && senses.cursor.seen;
  const X = (S, slot) => (real() ? body.x[slot] : S.x), YAW = (S, slot) => (real() ? ch.target(slot, IDX.yaw) - S.cy : S.yaw);   // S.cy is 0 when she claims yaw
  perf.real = real;

  function nearest(slot) { let best = null, bd = 1e9; for (const p of ctx.potatoes) { if (p.slot === slot || body.mode[p.slot] === MODE.gone) continue; const d = Math.abs(body.x[p.slot] - body.x[slot]); if (d < bd) { bd = d; best = p.slot; } } return best; }
  function dirTo(S, slot, target, info) { const x = X(S, slot);
    switch (target) {
      case 'cursor': case 'cursor_rest': case 'text': case 'text_caret': case 'thing': case 'prop': return cursorSeen() ? sgn(senses.cursor.x - x) || S.side : S.side;
      case 'away': case 'far_from_cursor': return cursorSeen() ? -(sgn(senses.cursor.x - x) || S.side) : -S.side;
      case 'other': case 'stage': { const o = info && info.other != null ? info.other : nearest(slot); return o == null ? S.side : sgn(body.x[o] - x) || S.side; }
      case 'away_from_other': { const o = info && info.other != null ? info.other : nearest(slot); return o == null ? -S.side : -(sgn(body.x[o] - x) || S.side); }
      case 'crack': case 'hole': { const a = ctx.fx && ctx.fx.where && ctx.fx.where(target); return a ? sgn(a.x - x) || S.side : S.side; }   // JOIN (engineer, assembly round): the crack and the hole are real places now (engine/fx.mjs where())
      case 'sideA': return S.side; case 'sideB': return -S.side;
      case 'place': return info && info.placeX != null ? sgn(info.placeX - x) || S.side : S.side;
      case 'edge': return x - room.left < room.right - x ? -1 : 1; case 'away_from_edge': return x - room.left < room.right - x ? 1 : -1;
      case 'spot': case 'home_spot': return Math.abs(S.home - x) < 0.05 ? 0 : sgn(S.home - x);
      case 'behind': return -(sgn(YAW(S, slot)) || S.side); case 'heading': return sgn(S.vx) || S.side;
      default: return 0; } }
  const inRoom = x => clamp(x, room.left + 0.62 * W, room.right - 0.62 * W);
  function freeSpot(slot, from, dir) { let x = from; for (let i = 0; i < 12; i++) { let ok = true; for (const p of ctx.potatoes) if (p.slot !== slot && Math.abs(body.x[p.slot] - x) < 1.25 * W) { ok = false; break; } if (ok && x > room.left + 0.7 * W && x < room.right - 0.7 * W) return x; x += dir * 0.5 * W; if (x < room.left + 0.7 * W || x > room.right - 0.7 * W) { dir = -dir; x = from + dir * 0.5 * W; } } return inRoom(from); }
  /** how many frames a look started on this beat should last: until the next beat that looks somewhere else */
  function lookFrames(S) { const bs = S.unit.beats; let f = S.bN; for (let i = S.bi + 1; i < bs.length && bs[i].look == null; i++) f += Math.round(mid(bs[i].t) * 60 * 1.3); return Math.min(900, f + 12); }
  /** the animator's player: her handle is done when the clip she queued for it has ended */
  function her(p, S, move, opts = {}) { if (!MV().has(move)) { missing.add(move); return null; } used.add(move); if (S.cutNext) { if (clock.k - S.cutK < 40) opts.now = true; S.cutNext = false; } const h = MV().play(p, move, opts); if (h && !h.done) { S.wait.push(h); if (!opts.keep) S.mine.push(h); } return h; }
  function lookPoint(S, slot, target, info) { if (target === 'home') return 'home'; if (target === 'cursor' || target === 'cursor_rest' || target === 'thing' || target === 'prop' || target === 'text' || target === 'text_caret') return 'user';
    if ((target === 'other' || target === 'stage') && ((info && info.other != null) || nearest(slot) != null)) return info && info.other != null ? info.other : nearest(slot);
    if ((target === 'crack' || target === 'hole') && ctx.fx && ctx.fx.where && ctx.fx.where(target)) return ctx.fx.where(target);   // JOIN (engineer, assembly round)
    if (target === 'front' || target === 'nothing' || target === 'interest') return 'you';
    const d = dirTo(S, slot, target, info), up = target === 'up' ? 2.5 : target === 'down' || target.startsWith('self') ? -0.7 : 0.12, dx = target.startsWith('self') ? (target === 'self_b' ? -0.25 : 0.25) : target === 'up' || target === 'down' ? 0 : d * 3;
    return { x: body.x[slot] + dx, y: body.y[slot] + up }; }

  function startBeat(p, S) {
    const u = S.unit, b = u.beats[S.bi], m = minds[p.slot], slot = p.slot, R = (a, c) => rng.range(S.rnd, a, c), draw = v => (Array.isArray(v) ? R(v[0], v[1]) : v), RL = real();
    const d = m.dial || {}, dk = m.personality ? Math.abs(m.personality.change.move) / 2 : 0, sc = k => (d[k] ? 1 + (d[k] - 1) * dk : 1);
    let t = b.t == null ? R(0.2, 0.4) : draw(b.t); if (!u.exact) { if (b.hold) t *= sc('hold_scale'); t *= sc('dur_scale') * (u.tScale || 1); }
    S.bf = 0; S.bN = Math.max(1, Math.round(t * 60)); S.walking = false; S.track = !!b.track; S.beatSqRelease = false; S.wait.length = 0;
    emit('beat', { slot, unit: u.id, kind: u.kind, i: S.bi, frames: S.bN, verbs: Object.keys(b).filter(k => k !== 't') });
    if (b.cue && !S.cued) cue(p, S);
    if (u.onBeat) u.onBeat(S.bi, S.bN, b);
    const HB = RL && typeof MV().beat === 'function';   // the animator's own beat hook: she plays look, blink, lean, squash and bob HER way (her rules win on how); I keep turn, walk, hop and named moves on handles so a beat can wait for them
    if (HB) { const mine = {}; for (const k of ['look', 'blink', 'lean', 'squash', 'bob']) if (b[k] != null) mine[k] = b[k]; if (Object.keys(mine).length) MV().beat(p, mine, { frames: S.bN, side: S.side, other: u.info && u.info.other, unit: u.id }); }
    if (b.look != null && HB) S.lookTarget = b.look; else if (b.look != null) { S.lookTarget = b.look; if (RL) MV().look(p, lookPoint(S, slot, b.look, u.info), { hold_f: lookFrames(S) }); else setLook(S, slot, b.look, u.info); }
    if (b.blink && !HB) { if (b.blink === 'hold_closed') S.closed = true; else { S.closed = false; if (RL) her(p, S, b.blink === 'slow' ? 'slow_blink' : 'blink', { keep: true }); else { S.blinkF = b.blink === 'slow' ? 34 : b.blink === 'double' ? 22 : 9; S.blinkN = S.blinkF; S.blinkDouble = b.blink === 'double'; } } }
    if (b.face) { const to = b.face.to.startsWith('pick:') ? (() => { const o = b.face.to.slice(5).split(',').filter(f => f !== S.lastFace); return o[Math.floor(S.rnd() * o.length)]; })() : b.face.to; S.lastFace = to; S.face = to; emit('face', { slot, to, k: draw(b.face.k == null ? 1 : b.face.k) }); }
    if (b.turn) { const tn = b.turn, amt = tn.amount == null ? 1 : tn.amount, cur = YAW(S, slot); let to;
      if (tn.by != null) to = cur + draw(tn.by) * S.side; else if (tn.to === 'home') to = RL ? (S.homeYaw || 0) : (S.homeYaw || null); else if (tn.to === 'front') to = 0; else if (tn.to === 'back') to = Math.PI * (sgn(cur) || S.side);
      else if (tn.to === 'behind') to = -(sgn(cur) || S.side) * 0.9 * amt; else if (tn.to === 'edge') to = dirTo(S, slot, 'edge') * 1.2;
      else if (tn.to === 'away_from_other') to = dirTo(S, slot, 'away_from_other', u.info) * 1.3 * amt; else to = dirTo(S, slot, tn.to, u.info) * 0.85 * amt;
      if (RL) { const dl = Math.abs(to - cur); if (dl > 0.05) { her(p, S, dl > 2.2 ? 'about_face' : dl > 0.7 ? 'turn_big' : 'turn_small', { to, rate: RATE[tn.speed || 'normal'], dir: sgn(to - cur) || 1 }); S.turned = Math.abs(to - (S.homeYaw || 0)) > 0.2; }
        S.trackTurn = b.track && (tn.to === 'other' || tn.to === 'stage') ? { amt, dir: dirTo(S, slot, tn.to, u.info), rate: RATE[tn.speed || 'normal'] } : null; }
      else { S.turnRate = TURN[tn.speed || 'normal'] || 0.06; S.turnTrack = tn.to === 'other' && b.track ? u.info : null; S.turn = to; } }
    if (b.lean && !HB) { const l = b.lean, a = l.amount === 'matches_cursor_advance' ? 0.08 : draw(l.amount == null ? 0 : l.amount);
      if (!a && l.x == null && l.z == null && l.toward == null) { S.leanT = 0; S.pitchT = 0; }
      else if (l.z) S.pitchT = (l.z === 'forward' ? 1 : -1) * a * 1.2; else { const dir = l.toward ? dirTo(S, slot, l.toward, u.info) : dirTo(S, slot, l.x || 'sideA', u.info); S.leanT = dir * Math.min(0.1, a * 0.8 * (u.grow || 1)); S.leanGrow = !!l.grow; } }
    if (b.squash && !HB) { if (b.squash.hold === false) S.sqT = 1; else S.sqT = clamp(1 + (draw(b.squash.to) - 1) * (u.grow || 1), 1 - cap * 0.8, 1 + cap * 0.8); }
    if (b.kick) { rig.kick(slot, b.kick.spring, draw(b.kick.v)); if (rig.wake) rig.wake(slot, 60); }
    if (b.walk) startWalk(p, S, b.walk, u.info, draw);
    if (b.slide && !RL) { S.slide = dirTo(S, slot, b.slide.to || 'sideA', u.info) * draw(b.slide.body_widths) * W / Math.max(1, S.bN); }
    if (b.hop) { const h = draw(b.hop.h); if (RL && h > 0.03) { S.selfAir = clock.k + 150; her(p, S, 'hop', { height: h }); } else { S.hopH = h; S.hopN = Math.max(8, Math.ceil(4 * h / 0.034)); S.hopF = 0; } }
    if (b.lunge && !(RL && MV().has('shove'))) { const a = draw(b.lunge.amount == null ? (b.lunge.body_widths || 0) : b.lunge.amount); S.dxT = a ? dirTo(S, slot, b.lunge.toward || 'other', u.info) * a * W : 0; }
    if (b.bob && HB) S.bN = Math.max(S.bN, 24); else if (b.bob) { S.bobCount = Math.round(draw(b.bob.n)); S.bobAmp = Math.min(0.036, draw(b.bob.amount) * (u.grow || 1)); S.bobF = 0; S.bobN = Math.max(15 * S.bobCount, S.bN); S.bN = Math.max(S.bN, S.bobN); }
    if (b.arms) { try { rig.arms(slot, b.arms, 0.25); S.arms = b.arms !== 'none'; } catch (e) { /* the model has no such pose: no arms */ } }
    if (b.glitch && RL && !b.move && (u.kind === 'idle' || u.kind === 'resume') && (MV().claims || []).includes('glitch')) { const cm = D.picker.own_glitch && D.picker.own_glitch.carrier_move; if (cm && MV().has(cm)) her(p, S, cm, { keep: true }); }   // she claims glitch and has no glitch verb: his own small flicker rides her move until she gives one
    if (b.glitch) { const g = b.glitch; S.glK = draw(g.k); S.glLeft = Math.max(1, Math.round(draw(g.steps == null ? 2 : g.steps))); S.glF = 0; emit('glitch', { slot, kind: (m.personality && m.personality.tell && m.personality.tell.glitch_kind) || g.kind, k: S.glK }); }
    if (b.prop) emit('prop', { slot, ...b.prop });
    if (b.sleep != null) { const was = m.asleep; m.asleep = !!b.sleep; S.closed = !!b.sleep; emit('asleep', { slot, asleep: m.asleep });
      if (RL && b.sleep && !was) { S.herSleep = clock.k; her(p, S, 'nod_off', { sleep_f: S.bN + (u.sleepOn || 0), keep: true }); S.wait.length = 0; }
      else if (RL && !b.sleep && was && S.herSleep) { S.herSleep = 0; const c = MV().current(p); if (c && (c.move === 'sleep_slide' || c.move === 'nod_off')) MV().play(p, 'caught_looking', { now: true }); } }
    if (b.emit) emit(b.emit, { slot, unit: u.id, ...(u.info || {}) });
    if (b.shove) { const o = u.info && u.info.other, level = b.shove.level || 'shove';
      if (RL && MV().has(level === 'bump' ? 'bump' : 'shove') && o != null) { if (u.onShove) u.onShove(p, o, level, true); her(p, S, level === 'bump' ? 'bump' : 'shove', { other: o, target: o }); }   // her clip calls crowd.shove on its own contact frame; social has wrapped that call with the not-mean guard
      else if (u.onShove) u.onShove(p, o, level, false); }
    if (b.move) { emit('want_move', { slot, move: b.move, frames: S.bN });
      if (RL) { if (b.move === 'gather' && u.beats[S.bi + 1] && u.beats[S.bi + 2] && (u.beats[S.bi + 1].lunge || u.beats[S.bi + 1].shove || u.beats[S.bi + 2].shove) && MV().has('shove')) { /* her shove clip has its own gather */ }
        else if (b.move !== 'hang' && b.move !== 'get_up' && b.move !== 'set_down') { const o = b.target === 'cursor' ? { target: 'cursor' } : u.info && u.info.other != null ? { target: u.info.other } : {}; her(p, S, b.move, { ...o, side: S.side, ...(b.opts || {}) }); } }
      else if (PLACEHOLDER_MOVES.has(b.move)) { placeholders.add(b.move);
        if (b.move === 'gather') { S.sqT = Math.min(S.sqT, 0.96); S.beatSqRelease = !b.squash; }
        else if (b.move === 'settle') { rig.kick(slot, 'squash', 0.5); rig.kick(slot, 'wob', b.stiff ? 0.2 : 0.45); if (rig.wake) rig.wake(slot, 60); }
        else if (b.move === 'sigh') { rig.kick(slot, 'squash', -0.5); if (rig.wake) rig.wake(slot, 60); }
        else if (b.move === 'chew' || b.move === 'nub_tap') { S.bobCount = Math.max(2, Math.round(S.bN / 18)); S.bobAmp = b.move === 'chew' ? 0.022 : 0.012; S.bobF = 0; S.bobN = S.bN; }
        else if (b.move === 'bump') { S.dxT = dirTo(S, slot, b.target || 'cursor', u.info) * 0.14 * W; S.lungeBack = true; rig.kick(slot, 'wob', 0.5); if (rig.wake) rig.wake(slot, 60); }
        else if (b.move === 'one_nub') { S.leanT = S.side * 0.05; } }
      else missing.add(b.move); }
  }
  function setLook(S, slot, target, info) { const d = dirTo(S, slot, target, info);
    if (target === 'home') { S.gxT = 0; S.gyT = 0; S.lookYaw = 0; }
    else { S.gxT = d || (target.startsWith('self') ? (target === 'self_b' ? -0.3 : 0.3) : 0); S.gyT = target === 'up' ? 0.7 : target === 'down' || target.startsWith('self') ? -0.7 : 0; S.lookYaw = d * (target === 'behind' ? 0.45 : 0.14); } }
  function startWalk(p, S, wk, info, draw) { const slot = p.slot, m = minds[slot], d = m.dial || {}, x0 = X(S, slot); let to = wk.to || 'sideA', x = x0, dir = dirTo(S, slot, to, info);
    if (to === 'home_spot' || to === 'spot') x = S.home;
    else if (to === 'place') { x = info && info.placeX != null ? info.placeX : x0; dir = sgn(x - x0) || dir; }
    else if (to === 'cursor') x = cursorSeen() ? senses.cursor.x - dir * (wk.stop_short_px ? draw(wk.stop_short_px) / 150 : 0.5) : x0 + dir * W;
    else if (to === 'other') { const o = info && info.other != null ? info.other : nearest(slot); if (o == null) x = x0; else if (wk.stop_short_bw != null) x = body.x[o] - dir * wk.stop_short_bw * W; else x = x0 + dir * Math.min(draw(wk.body_widths || 0.5) * W, Math.max(0, Math.abs(body.x[o] - x0) - 1.05 * W)); }
    else if (to === 'crack' || to === 'hole') { const a = ctx.fx && ctx.fx.where && ctx.fx.where(to); x = a ? a.x : x0; }   // JOIN (engineer, assembly round): he walks to stand under it
    else if (to === 'past_other') { const o = info.other; x = body.x[o] + dir * 1.5 * W; }
    else if (to === 'free_spot') { const aw = dirTo(S, slot, 'away_from_other', info); x = freeSpot(slot, x0 + aw * 0.7 * W, aw); }
    else if (to === 'edge') x = dir < 0 ? room.left + 0.62 * W : room.right - 0.62 * W;
    else if (to === 'far_from_cursor') x = dir < 0 ? room.left + room.width * 0.14 : room.right - room.width * 0.14;
    else x = x0 + dir * draw(wk.body_widths == null ? 1 : wk.body_widths) * W;
    const want = x; x = inRoom(x); S.hitEdge = Math.abs(want - x) > 0.05 || to === 'edge' ? (x < (room.left + room.right) / 2 ? 'left' : 'right') : null;
    let sp = wk.speed || 'normal'; if (m.wont && m.wont.never_speed === sp) sp = 'normal';
    const w = m.w || {}; let mood = 0; for (const k in w) mood += w[k] * ((dirMoods[k] && dirMoods[k].walk_speed) || 1);
    S.wasLooking = S.lookTarget; if (Math.abs(x - x0) < 0.06) return;
    if (real()) { const short = Math.abs(x - x0) < 0.75 || sp === 'slow', h = MV().walkTo(p, x, { gait: short ? 'waddle' : 'walk', speed: clamp((sp === 'slow' ? 0.75 : sp === 'fast' ? 1.25 : 1) * (mood || 1) * (d.speed_scale || 1), 0.5, 1.3) }); used.add(short ? 'waddle' : 'walk'); if (h && !h.done) { S.wait.push(h); S.walkH = h; } return; }
    S.walkTo = x; S.walkV = SPEED[sp] * (mood || 1) * (wk.speed_scale || 1) * (d.speed_scale || 1); S.walking = true; S.walkKeep = wk.facing === 'keep';
    if (!S.walkKeep) { S.turn = sgn(x - S.x) * 0.85; S.turnRate = TURN.normal; S.walkTurned = true; } }
  function cue(p, S) { const u = S.unit, m = minds[p.slot]; S.cued = true; if (m.wont && m.wont.no_cues) return;
    const base = { slot: p.slot, potato: p.id, watched: !(senses && senses.cursor && senses.cursor.gone), spent: !!S.voiceSpent, mood: m.dom, pan: (body.x[p.slot] - room.left) / Math.max(1e-6, room.width) * 2 - 1 };
    for (const name of u.cues || []) emit('cue', { name, ...base }); S.voiceSpent = true; }
  function endUnit(p, S, how) { const u = S.unit; S.unit = null; S.turn = null; S.lookYaw = 0; S.gxT = S.gyT = 0; S.leanT = 0; S.pitchT = 0; S.sqT = 1; S.dxT = 0; S.walking = false; S.slide = 0; S.bobCount = 0; S.track = false; S.turnTrack = null; S.lookTarget = null; S.trackTurn = null;
    if (!minds[p.slot].asleep) S.closed = false; if (S.arms) { try { rig.arms(p.slot, 'none', 0.25); } catch (e) {} S.arms = false; }
    if (real()) { if (how !== 'done') { for (const h of S.mine) if (!h.done && h.phase === 'queued' && h.cancel) h.cancel(); S.cutNext = !(S.walkH && !S.walkH.done); S.cutK = clock.k; MV().look(p, 'home'); }
      if (S.turned && how !== 'replaced' && body.mode[p.slot] === MODE.ground && Math.abs(YAW(S, p.slot) - (S.homeYaw || 0)) > 0.25 && !(u && u.keepYaw)) { const dy = Math.abs(YAW(S, p.slot) - (S.homeYaw || 0)); MV().play(p, dy > 2.2 ? 'about_face' : dy > 0.7 ? 'turn_big' : 'turn_small', { to: S.homeYaw || 0, rate: 0.8 }); }
      S.turned = false; S.mine.length = 0; S.wait.length = 0; }
    S.voiceSpent = false; if (u && u.onEnd) u.onEnd(how); }

  /** start a unit: { kind, id, beats, info?, cues?, tScale?, grow?, from?, tier?, onEnd?(how), onShove? } */
  perf.play = (p, unit) => { const S = st[p.slot]; if (S.unit) endUnit(p, S, 'replaced');
    S.unit = unit; S.bi = unit.from || 0; S.cued = false; S.side = S.rnd() < (S.lastSide > 0 ? 0.4 : 0.6) ? 1 : -1; if (unit.info && unit.info.side) S.side = unit.info.side; S.lastSide = S.side;
    if (!unit.beats.length || S.bi >= unit.beats.length) { endUnit(p, S, 'done'); return; }
    if (!unit.beats.some(b => b.cue)) cue(p, S); startBeat(p, S); };
  /** cut it short. Returns what was left: { id, kind, beat, left, tier } (unfinished business reads this). */
  perf.stop = (p, how = 'cut') => { const S = st[p.slot]; if (!S || !S.unit) return null; const u = S.unit, left = { id: u.id, kind: u.kind, beat: S.bi, left: u.beats.length - S.bi, tier: u.tier }; endUnit(p, S, how); return left; };
  perf.busy = p => !!(st[p.slot] && st[p.slot].unit);
  perf.unit = p => st[p.slot] && st[p.slot].unit;
  perf.selfAir = p => { const S = st[p.slot]; return !!(S && S.selfAir && clock.k < S.selfAir); };
  /** advance the beats (called while he is on the ground, or in the air on his own hop) */
  perf.step = p => { const S = st[p.slot]; if (!S.unit) return; S.bf++; const RL = real();
    if (RL && body.mode[p.slot] !== MODE.ground) return;
    const b = S.unit.beats[S.bi]; let over;
    if (RL) { let pending = false; for (const h of S.wait) if (!h.done) pending = true; over = S.bf >= S.bN && (!pending || S.bf > S.bN + 900);
      if (S.trackTurn && S.bf % 6 === 0) { const tt = S.trackTurn, d = dirTo(S, p.slot, 'other', S.unit.info); if (d && d !== tt.dir) { tt.dir = d; const to = d * 0.85 * tt.amt, cur = YAW(S, p.slot), dl = Math.abs(to - cur); if (dl > 0.05) { her(p, S, dl > 0.7 ? 'turn_big' : 'turn_small', { to, rate: tt.rate, dir: sgn(to - cur) || 1, keep: true }); S.wait.length = 0; S.turned = true; } } }   // the one he is watching crossed him: the body follows
      if (S.walkH && S.walkH.done) { S.walkH = null; if (S.hitEdge) { emit('window_edge', { slot: p.slot, side: S.hitEdge, was_looking_at: S.wasLooking || 'heading' }); S.hitEdge = null; } } }
    else { over = S.bf >= S.bN && !(S.walking && S.bf < S.bN * 2 + 420);
      if (S.walking && Math.abs(S.walkTo - S.x) < 0.015 && Math.abs(S.vx) < 0.05) { S.walking = false; if (S.hitEdge) { emit('window_edge', { slot: p.slot, side: S.hitEdge, was_looking_at: S.wasLooking || 'heading' }); S.hitEdge = null; } }
      if (S.track && S.lookTarget) setLook(S, p.slot, S.lookTarget, S.unit.info); }
    if (S.leanGrow && b && b.lean) S.leanT = clamp(S.leanT * 1.0004, -0.12, 0.12);
    if (!over) return;
    if (S.beatSqRelease) S.sqT = 1; if (S.lungeBack) { S.dxT = 0; S.lungeBack = false; }
    if (S.walkTurned) { S.walkTurned = false; if (!(b && b.turn)) S.turn = null; }
    S.bi++; if (S.bi >= S.unit.beats.length) endUnit(p, S, 'done'); else startBeat(p, S); };

  perf.add = p => { const s = p.slot; st[s] = { rnd: rng.stream(p.id, 'behaviour-beats'), eyes: rng.stream(p.id, 'behaviour-eyes'), unit: null, side: 1, lastSide: p.slot % 2 ? 1 : -1, x: body.x[s], vx: 0, home: body.x[s], walkTo: body.x[s], walkV: 0.8, walking: false, phase: 0,
    yaw: 0, turn: null, turnRate: 0.06, lookYaw: 0, lean: 0, leanT: 0, pitch: 0, pitchT: 0, sq: 1, sqT: 1, dx: 0, dxT: 0, hopN: 0, hopF: 0, hopH: 0, bobCount: 0, bobF: 0, bobN: 1, bobAmp: 0, glLeft: 0, glF: 0, glK: 0, gl: 0, glOn: false,
    lid: 0.5, closed: false, blinkF: 0, blinkN: 1, nextBlink: clock.k + 150 + Math.floor(rng.stream(p.id, 'behaviour-eyes')() * 240), gx: 0, gy: 0, gxT: 0, gyT: 0, slide: 0, wasGround: true, cy: 0, cl: 0, cs: 1, wait: [], mine: [], cutNext: false, selfAir: 0, herSleep: 0, homeYaw: 0, trackTurn: null }; };
  perf.remove = p => { st[p.slot] = null; };
  perf.sync = p => { const S = st[p.slot]; if (!S) return; S.x = body.x[p.slot]; S.vx = 0; S.walkTo = S.x; S.walking = false; S.dx = 0; S.dxT = 0; };
  perf.setHome = (p, x) => { st[p.slot].home = inRoom(x); };
  /** his stance: the yaw 'home' means for him right now (mood when alone, his angle in a clump). 0 = the canon rest pose. */
  perf.setStance = (p, yaw) => { const S = st[p.slot]; if (S) S.homeYaw = yaw || 0; };
  perf.stance = p => (st[p.slot] && st[p.slot].homeYaw) || 0;
  /** turn him back to his stance if something left him turned (an argument cut dead, a unit that kept its yaw) */
  perf.home = p => { const S = st[p.slot]; if (!S || !real() || S.unit || body.mode[p.slot] !== MODE.ground) return; const dy = Math.abs(YAW(S, p.slot) - (S.homeYaw || 0)); if (dy > 0.25) MV().play(p, dy > 2.2 ? 'about_face' : dy > 0.7 ? 'turn_big' : 'turn_small', { to: S.homeYaw || 0, rate: 0.8 }); };
  perf.where = p => st[p.slot];

  /** once a step, after the moves plug-in: ease every intent and set channel targets. Ground only for the body. */
  perf.overlay = p => { const slot = p.slot, S = st[slot], m = minds[slot]; if (!S || !m) return; const mode = body.mode[slot], RL = real();
    const car = D.moods.list, w = m.w || { [D.moods.home]: 1 }; let lids = 0, cy = 0, cl = 0, cs = 0;
    const cdir = cursorSeen() ? sgn(senses.cursor.x - X(S, slot)) || 1 : (slot % 2 ? -1 : 1);
    for (const k in w) { const c = car[k].carriage, wk = w[k]; lids += wk * c.lids; cl += wk * c.lean; cs += wk * c.squash; cy += wk * (k === 'nosy' ? 0.26 * cdir : k === 'fed_up' ? -0.44 * cdir : 0); }
    if (RL) { if (MV().carriage && (clock.k + slot) % 30 === 0) MV().carriage(p, w);
      if (m.asleep && S.herSleep && clock.k - S.herSleep > 90) { const c = MV().current(p); if (c && !c.queue && (c.move === 'stand' || c.move === 'caught_looking')) { S.herSleep = 0; m.asleep = false; S.closed = false; emit('asleep', { slot, asleep: false, why: 'her nod_off ended' }); } } }
    else {   // eyes and lids for whoever paints the face (nothing does without her face.mjs)
      if (clock.k >= S.nextBlink && !S.closed && S.blinkF <= 0) { S.blinkF = S.blinkN = 9; const be = (dirMoods[m.dom] && dirMoods[m.dom].blink_every) || 5; S.nextBlink = clock.k + Math.round(60 * be * (0.5 + S.eyes())); }
      let lidT = S.closed ? 1 : lids; if (S.blinkF > 0) { const u = 1 - S.blinkF / S.blinkN; lidT = Math.max(lidT, S.blinkDouble ? Math.abs(Math.sin(u * Math.PI * 2)) : Math.sin(u * Math.PI)); S.blinkF--; }
      S.lid = follow(S.lid, lidT, 0.45, 0.2); S.gx = follow(S.gx, S.gxT, 0.3, 0.12); S.gy = follow(S.gy, S.gyT, 0.3, 0.12);
      ch.set(slot, IDX.lidL, S.lid); ch.set(slot, IDX.lidR, S.lid); ch.set(slot, IDX.gx, S.gx); ch.set(slot, IDX.gy, S.gy); }
    // glitch: purple, on him, stepped at 12 Hz. Only while one of MY beats asked for it; the animator's own glitches are hers.
    const CL = (RL && MV().claims) || [];
    if (CL.includes('glitch')) { S.glLeft = 0; S.glOn = false; }
    else if (S.glLeft > 0) { if (S.glF % 5 === 0) { S.gl = S.glK * (0.6 + 0.4 * S.eyes()); ctx.tag(slot, ctx.TAG.glitch_step); if (S.glF) S.glLeft--; if (S.glLeft <= 0) S.gl = 0; } S.glF++; S.glOn = true; ch.set(slot, IDX.glitch, S.gl); if (rig.wake) rig.wake(slot, 12); }
    else if (S.glOn) { S.glOn = false; S.gl = 0; ctx.tag(slot, ctx.TAG.glitch_step); if (!RL) ch.set(slot, IDX.glitch, 0); }
    else if (!RL) ch.set(slot, IDX.glitch, 0);
    if (mode !== MODE.ground) { S.wasGround = false; S.cy *= 0.9; S.lean *= 0.9; S.pitch *= 0.9; S.sq = 1 + (S.sq - 1) * 0.9; S.dx *= 0.8; return; }
    if (!S.wasGround) { S.wasGround = true; perf.sync(p); S.yaw = RL ? 0 : ch.target(slot, IDX.yaw) || 0; }
    S.cy = follow(S.cy, m.asleep ? 0 : cy, 0.03, 0.008); S.cl = follow(S.cl, cl, 0.03, 0.002); S.cs = follow(S.cs, cs, 0.03, 0.002);
    S.lean = follow(S.lean, S.leanT + S.cl * (cdir || 1), 0.14, 0.01); S.pitch = follow(S.pitch, S.pitchT, 0.14, 0.01); S.sq = follow(S.sq, S.sqT * S.cs, 0.16, 0.01); S.dx = follow(S.dx, S.dxT, 0.3, 0.034);
    let bob = 0; if (S.bobCount) { const u = S.bobF / S.bobN; bob = S.bobAmp * Math.sin(u * Math.PI * 2 * S.bobCount) * Math.sin(u * Math.PI); if (++S.bobF > S.bobN) S.bobCount = 0; }
    if (RL) {   // ADD to her targets, never replace them; and stand down on whatever she claims (moves.claims)
      if (!CL.includes('yaw')) ch.set(slot, IDX.yaw, ch.target(slot, IDX.yaw) + S.cy); else S.cy = 0;
      if (CL.includes('pose')) { if (!MV().has('shove')) ch.set(slot, IDX.dx, S.dx); return; }
      ch.set(slot, IDX.shear, clamp(ch.target(slot, IDX.shear) + S.lean, -0.14, 0.14)); ch.set(slot, IDX.pitch, ch.target(slot, IDX.pitch) + S.pitch + bob * 1.2);
      ch.set(slot, IDX.sy, clamp(ch.target(slot, IDX.sy) + (S.sq - 1) - bob, 1 - cap, 1 + cap)); ch.set(slot, IDX.dx, S.dx);
      if (S.hopN) { const u = S.hopF / S.hopN; ch.set(slot, IDX.dy, ch.target(slot, IDX.dy) + S.hopH * 4 * u * (1 - u)); if (++S.hopF > S.hopN) S.hopN = 0; }
      return; }
    // ---- the stand-in (no animator's moves loaded): travel eased in and out with a waddle on top, a rate-limited turn
    let vT = 0; if (S.walking) { const d = S.walkTo - S.x; vT = sgn(d) * Math.min(S.walkV, Math.sqrt(2 * 2.2 * Math.abs(d)) + 0.02); } else if (S.slide) vT = S.slide * 60;
    S.vx = follow(S.vx, vT, 0.2, 0.06); if (!S.walking && !S.slide && Math.abs(S.vx) < 0.004) S.vx = 0;
    S.x = inRoom(S.x + S.vx / 60); S.phase += Math.abs(S.vx) * 0.19; const gait = Math.min(1, Math.abs(S.vx) / 0.35);
    if (S.turnTrack) S.turn = dirTo(S, slot, 'other', S.turnTrack) * 0.5;
    S.yaw = follow(S.yaw, S.turn != null ? S.turn : S.cy + S.lookYaw, 0.1, S.turn != null ? S.turnRate : 0.03);
    let hop = 0; if (S.hopN) { const u = S.hopF / S.hopN; hop = S.hopH * 4 * u * (1 - u); if (++S.hopF > S.hopN) { S.hopN = 0; rig.kick(slot, 'squash', 0.6); if (rig.wake) rig.wake(slot, 60); } }
    ch.set(slot, IDX.x, S.x); ch.set(slot, IDX.dx, S.dx); ch.set(slot, IDX.dy, hop + 0.012 * gait * Math.abs(Math.sin(S.phase * Math.PI))); ch.set(slot, IDX.roll, 0.045 * gait * Math.sin(S.phase * Math.PI));
    ch.set(slot, IDX.yaw, S.yaw); if (Math.abs(S.yaw - (S.yawSent || 0)) > 1e-4 && rig.wake) rig.wake(slot, 40); S.yawSent = S.yaw;
    ch.set(slot, IDX.shear, ch.target(slot, IDX.shear) + S.lean); ch.set(slot, IDX.pitch, S.pitch + bob * 1.2); ch.set(slot, IDX.sy, clamp(ch.target(slot, IDX.sy) + (S.sq - 1) - bob, 1 - cap, 1 + cap));
  };
  return perf;
}
