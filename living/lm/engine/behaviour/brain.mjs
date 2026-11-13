// brain.mjs — the living model's BEHAVIOUR plug-in: createBrain(ctx) -> { add, remove, step, event, request, say, report, ... }.
// It gives him a life from data/behaviour.json and nothing else: moods that drift, the picker, every reaction, the ladders,
// the long-ignored behaviours, THE NO, the first minute, unfinished business, and (social.mjs) the crowd.
// It never writes a channel value and never touches the model: perform.mjs sets channel TARGETS after the moves plug-in.
// Everything it does is logged (brain.log) so "he never loops" can be measured: brain.report().
//
// For the other seats:
//   events OUT  'behaviour' { slot, kind: idle|reaction|crowd|resume|mood|said, id, mood }   one per thing he starts
//               'cue' { name, slot, potato, watched, spent, mood, pan }                        the sound contract
//               'want_move' { slot, move, frames }   'face' { slot, to, k }   'glitch' { slot, kind, k }   'prop' { slot, id, on }
//               'asleep' { slot, asleep }   'window_edge' { slot, side }   'line' { by, text, keywords } (the thinking one spoke)
//   animator    if moves.mjs has beat(p, beat, info) every beat is handed to it; play(p, moveName, opts) gets every named move;
//               moves.claims = ['x', 'yaw', 'pose'] switches the matching part of my placeholder overlay off.
//   real brain  brain.request(p, behaviourId) -> bool (the picker may say no);  brain.say(p, text) (the thinking one's line).
// Behaviour Designer (seat 4), Build round, team Not A Screensaver. Carried from Last Five.
// Round 3 (carried from Owed One; the director's, comedian's and Potato seat's notes):
//   the body clock has a CAP (moods.pace.body_gap_cap_s): past it he must do a body thing, the no-repeat rules still standing;
//   PLACES (behaviour.json places): alone, every so often he goes and stands somewhere else, two body heights or more from his last two spots;
//   HIS OWN GLITCH (picker.own_glitch): one small purple flicker of his own every three to four minutes;
//   STANCE (moods.list.<mood>.stance): when the mood on top changes, his body says so (fed up turns away, nosy turns toward);
//   a throw that ended in the animator's crack / hole / splat clip gets NO second aftermath from here (her clip has the look): he is held still;
//   brain.hold(p, frames): nothing of mine starts on him for that long (the look after belongs to whoever asked for it);
//   report(): a said line is not a thing he did; longest still stretch, places stood in, share of seconds travelling, own glitches.
import { MODE } from '../body.mjs';
import { createMind, longestRepeatedRun } from './mind.mjs';
import { createPerformer } from './perform.mjs';
import { createSocial } from './social.mjs';

export function createBrain(ctx) {
  const { data, clock, rng, body, senses, emit } = ctx, D = data.behaviour, UB = D.flags.unfinished_business || { value: false };
  const minds = [], B = [], log = [], moodline = [], skipped = {};
  const perf = createPerformer(ctx, { minds });
  const T = () => clock.k / 60, PX = () => (ctx.host && ctx.host.pxPerBh) || 150;
  const PACE = D.moods.pace || {}, CAP = PACE.body_gap_cap_s || 0, PL = D.places && D.places.on !== false ? D.places : null, GL = D.picker.own_glitch && D.picker.own_glitch.on !== false ? D.picker.own_glitch : null, LA = (D.reaction_rules && D.reaction_rules.look_after) || {};
  const STANCE_ON = !D.flags.stance || D.flags.stance.value !== false, BH = 2 * (body.A || 0.5375), W2 = 2 * (body.W || 0.52), room = ctx.room;
  const between = (r, v) => v[0] + (v[1] - v[0]) * r();
  let wrapped = false;

  function note(slot, kind, id, extra) { const p = ctx.bySlot[slot], m = minds[slot]; const row = { k: clock.k, t: +T().toFixed(2), slot, who: p ? p.id : '?', kind, id, mood: m ? m.dom : '', ...(extra || {}) };
    log.push(row); if (log.length > 20000) log.shift(); emit('behaviour', { slot, kind, id, mood: row.mood }); return row; }
  function envOf(p) { const c = senses && senses.cursor, seen = !!(c && c.seen), s = p.slot;
    return { watched: !(c && c.gone), cursorMoving: seen && clock.k - c.lastMoveK < 30, cursorPx: seen ? Math.hypot(c.x - body.x[s], c.y - body.y[s]) * PX() : null, goneFor: c && c.gone ? T() - (B[s].goneT || T()) : 0,
      stageFree: social.stageFree(), crowd: ctx.potatoes.length }; }

  /** cut what he is doing. What was left may become unfinished business. */
  function cut(p, why) { const left = perf.stop(p, why), b = B[p.slot]; if (!left) return null;
    if (UB.value && left.kind === 'idle' && (UB.only_tiers || []).includes(left.tier) && left.left >= (UB.needs_beats_left || 2) && left.beat > 0 && why !== 'replaced-by-self') {
      const r = b.rnd; b.owed = b.owed.filter(o => o.id !== left.id); b.owed.push({ id: left.id, beat: left.beat, due: T() + UB.after_s[0] + (UB.after_s[1] - UB.after_s[0]) * r(), exp: T() + UB.forgets_after_s }); while (b.owed.length > (UB.keeps || 2)) b.owed.shift(); }
    return left; }
  /** start a unit on him. kind: idle | reaction | crowd | resume */
  function play(p, kind, id, beats, o = {}) { const b = B[p.slot], m = minds[p.slot];
    const cues = o.cues || (kind === 'idle' || kind === 'resume' ? ['idle.' + id] : kind === 'crowd' ? ['crowd.' + id] : [id]);
    note(p.slot, kind, id, o.note); if (!(kind === 'idle' && o.tier === 'micro')) { b.bodyT = T(); b.capLead = PACE.cap_lead_s ? between(b.rnd, PACE.cap_lead_s) : 6; }   // the deadline is drawn each time: a fixed one would be a metronome
    perf.play(p, { kind, id, beats, info: o.info, cues, tScale: o.tScale, grow: o.grow, from: o.from, tier: o.tier, onShove: o.onShove, sleepOn: o.sleepOn, keepYaw: o.keepYaw, exact: o.exact, onBeat: o.onBeat, onEnd: how => { const t = T();
      b.nextMicro = t + m.gap('micro'); if (kind !== 'idle' || o.tier !== 'micro') b.nextBody = Math.max(b.nextBody, t + (kind === 'idle' || kind === 'resume' || kind === 'stance' ? m.gap('body') : m.gap('micro')));   // a stance turn IS a body thing: it uses up the body's turn
      if (o.onEnd) o.onEnd(how); } }); }
  /** where he goes when a behaviour tagged 'place' is picked: two body heights or more from where he stands AND from where he stood before that; an edge when one is due */
  function choosePlace(p) { const s = p.slot, b = B[s], x0 = body.x[s], L = room.left + 0.62 * W2, Rr = room.right - 0.62 * W2, min = PL.min_apart_body_heights * BH, t = T();
    const c = PL.spots.map(q => ({ id: q.id, kind: q.kind, x: L + (Rr - L) * q.at + (q.kind === 'edge' ? 0 : (b.rnd() - 0.5) * 2 * (PL.jitter_body_heights || 0) * BH) }));
    if (ctx.fx && ctx.fx.where) for (const k of ['hole', 'crack']) { const a = ctx.fx.where(k); if (a) c.push({ id: 'under_' + k, kind: 'landmark', x: Math.max(L, Math.min(Rr, a.x)) }); }
    const prev = b.spots.filter(r => Math.abs(r - x0) > 0.5).slice(-2), clear = q => ctx.potatoes.every(o => o.slot === s || Math.abs(body.x[o.slot] - q.x) > 1.3 * W2), far = (q, pv) => clear(q) && Math.abs(q.x - x0) >= min && pv.every(r => Math.abs(q.x - r) >= min);
    let pool = c.filter(q => far(q, prev)); if (!pool.length) pool = c.filter(q => far(q, prev.slice(-1))); if (!pool.length) pool = c.filter(q => far(q, [])); if (!pool.length) return null;
    const lm = pool.filter(q => q.kind !== 'floor'); if (t - b.landmarkT > PL.landmark_every_s && lm.length) pool = lm;
    const q = pool[Math.floor(b.rnd() * pool.length)]; if (q.kind !== 'floor') b.landmarkT = t; return q; }
  function playIdle(p, bh, chained = false, from = 0) { const m = minds[p.slot], t = T(); let info;
    if (PL && bh.tags.includes('place') && !from) { const q = choosePlace(p); if (!q) { B[p.slot].nextPlaceT = t + 20; return false; } info = { placeX: q.x, side: Math.sign(q.x - body.x[p.slot]) || 1 }; B[p.slot].nextPlaceT = t + between(B[p.slot].rnd, PL.every_s); note(p.slot, 'place', q.id, { x: +q.x.toFixed(2) }); }
    else if (PL && bh.tags.includes('travel')) B[p.slot].nextPlaceT = Math.max(B[p.slot].nextPlaceT, t + (PL.after_other_travel_s || 25));
    if (GL && bh.tags.includes('self_glitch')) { B[p.slot].nextGlitchT = t + between(B[p.slot].rnd, GL.every_s); B[p.slot].glitches++; }
    m.commit(bh, t, chained || from > 0);
    const whole = bh.whole_move && perf.real() && ctx.moves.has(bh.whole_move) && !from, stays = m.dial && m.dial.starts_asleep_in_a_crowd && ctx.potatoes.length > 1 && bh.id === 'sleep_standing';
    play(p, from ? 'resume' : 'idle', bh.id, whole ? bh.beats.filter(x => x.look && !x.move && !x.hold).slice(0, 2).concat([{ move: bh.whole_move, opts: bh.move_opts, cue: true, t: 0.3 }, { hold: 1, t: [0.4, 0.9] }]) : bh.beats, { tier: bh.tier, from, info, sleepOn: stays ? 60 * 240 : 0, note: from ? { from_beat: from } : chained ? { chained: true } : undefined, onEnd: how => { if (how !== 'done') return;
      m.push(bh.push, T()); if (bh.id === 'sleep_standing' || m.asleep) B[p.slot].wakeAt = T() + 6 + 30 * B[p.slot].rnd();
      if (m.asleep && m.dial && m.dial.starts_asleep_in_a_crowd && ctx.potatoes.length > 1 && m.energy < 0.9) return;
      const nb = m.chainAfter(bh, T(), envOf(p)); if (nb && body.mode[p.slot] === MODE.ground) playIdle(p, nb, true); } }); return true; }
  /** STANCE: the mood on top has changed, so how he stands changes. One slow turn to the new 'home' yaw (and whatever else the mood's stance beats say). */
  function playStance(p) { const m = minds[p.slot], st = (D.moods.list[m.dom] || {}).stance; if (!st || !STANCE_ON) return false;
    const c = senses && senses.cursor, cd = c && c.seen ? Math.sign(c.x - body.x[p.slot]) || 1 : (p.slot % 2 ? -1 : 1), yaw = st.yaw === 'away' ? -cd * st.rad : st.yaw === 'toward' ? cd * st.rad : 0;
    if (Math.abs(yaw - perf.stance(p)) < 0.1 && !st.always) return false; perf.setStance(p, yaw); play(p, 'stance', 'stance.' + m.dom, st.beats, { keepYaw: true, tier: 'small', cues: [] }); return true; }
  /** a thing was done to him: choose the answer, log it, play it now or after he is back on his feet */
  function react(p, key, info = {}, o = {}) { const m = minds[p.slot], b = B[p.slot], r = m.react(key, info, T()); if (!r || !r.row) return r;
    const id = key + '.' + r.row.id, cues = r.rung ? [key + '.' + r.rung, id] : [id], R0 = D.reactions[key], has = mv => perf.real() && ctx.moves.has(mv); let beats = r.row.beats || [];
    if (!r.refused) { const fm = info.how === 'exploded' ? R0.first_move_exploded : R0.first_move; if (r.row.whole_move && has(r.row.whole_move)) beats = [{ move: r.row.whole_move, opts: r.row.move_opts, cue: true, t: 0.3 }, { hold: 1, t: [0.4, 0.9] }]; else if (fm && has(fm)) beats = [{ move: fm, t: 0.2 }].concat(beats); }
    const unit = { id, beats, cues, info: o.info, note: { ...(r.rung ? { rung: r.rung } : {}), ...(r.refused ? { refused: true } : {}), ...(o.note || {}) } };
    if (r.row.keeps_sleeping !== true && key.startsWith('poked') && m.asleep) { m.asleep = false; emit('asleep', { slot: p.slot, asleep: false }); }
    if (o.later) { b.queue.push(unit); note(p.slot, 'reaction', id, { ...unit.note, waits: true }); return r; }
    if (r.row.no_travel_for_s) m.lastTravelT = T() + r.row.no_travel_for_s - (D.picker.travel_min_gap_s || 0);   // he does not come back for a while
    if (body.mode[p.slot] === MODE.ground && unit.beats.length && !o.quiet) { cut(p, 'reaction'); play(p, 'reaction', id, unit.beats, { cues, info: o.info, note: unit.note, keepYaw: !!r.row.keep_yaw }); }
    else { note(p.slot, 'reaction', id, unit.note); if (!(m.wont && m.wont.no_cues)) for (const name of cues) emit('cue', { name, slot: p.slot, potato: p.id, watched: envOf(p).watched, spent: false, mood: m.dom }); }
    return r; }
  function direct(p) { const m = minds[p.slot], b = B[p.slot]; m.direct(T()); b.ignored = { watched: -1, gone: -1 }; m.prefer = []; }

  function ignoredLadder(p, env) { const m = minds[p.slot], b = B[p.slot], rungs = D.reactions.ignored.rungs, quiet = T() - m.quietSince, key = env.watched ? 'watched' : 'gone'; let top = -1;
    for (let i = 0; i < rungs.length; i++) if (rungs[i].when.watched === env.watched && quiet >= rungs[i].at_quiet_s) top = i;
    if (top < 0 || top <= b.ignored[key]) return; b.ignored[key] = top; const r = rungs[top]; if (r.at_quiet_s === 0) return;
    m.push(r.push, T()); if (r.prefer) m.prefer = r.prefer; if (r.boredom_set != null) m.boredom = Math.max(m.boredom, r.boredom_set);
    if (r.beats.length && body.mode[p.slot] === MODE.ground && !social.busy(p.slot) && !(perf.unit(p) && perf.unit(p).kind !== 'idle') && clock.k >= b.holdK) { cut(p, 'ignored'); play(p, 'reaction', 'ignored.' + r.id, r.beats, {}); } else note(p.slot, 'reaction', 'ignored.' + r.id); }
  function cursorRings(p) { const c = senses && senses.cursor; if (!c || !c.seen || c.gone) return; const s = p.slot, b = B[s], d = Math.hypot(c.x - body.x[s], c.y - body.y[s]) * PX();
    b.hover = d < 60 && clock.k - c.lastMoveK > 6 ? (b.hover || 0) + 0.2 : 0; if (T() - (b.ringT || -9) < 2) return;
    const m = minds[s], r = m.react('cursor_near', { dist_px: d, speed_px_s: (c.speed || 0) * PX(), hover_s: b.hover, on_face: d < 30, dt: 0.2 }, T()); if (!r || !r.row) return; b.ringT = T();
    if (body.mode[s] === MODE.ground && !perf.busy(p) && !social.busy(s) && !m.asleep && r.row.beats.length) { note(s, 'ring', 'cursor_near.' + r.row.id); perf.play(p, { kind: 'ring', id: 'cursor_near.' + r.row.id, beats: r.row.beats, cues: ['cursor_near.' + r.row.id], onEnd: () => { b.nextMicro = T() + m.gap('micro'); } }); } else note(s, 'ring', 'cursor_near.' + r.row.id); }
  function aftermath(p) { const b = B[p.slot], air = b.air; b.air = null; if (!air) return; const m = minds[p.slot];
    if (air.by != null && air.by !== 'user') { const o = ctx.potatoes.find(q => q.id === air.by || q.slot === air.by); play(p, 'crowd', 'shoved_after', D.crowd.arguments.shoved_after.beats, { info: { other: o ? o.slot : null } }); return; }
    if (air.special && ctx.fx && perf.real()) { const r0 = m.react(air.special, { physics: true }, T()); note(p.slot, 'reaction', air.special + '.' + (r0 && r0.row ? r0.row.id : 'hers'), { hers: true }); b.bodyT = T(); b.holdK = clock.k + (LA.after_her_clip_f || 150); return; }   // crack / hole / splat: the animator's clip has the look after in it. Nothing of mine goes on top.
    const key = air.dropped ? 'dropped' : 'thrown'; let r = m.react(key, { hard_wall_hit: !!air.hardWall, below_tumble_speed: air.speed != null && air.speed < 5, facing_off_home: false, physics: true }, T()); if (!r || !r.row) return;
    play(p, 'reaction', key + '.' + r.row.id, (air.landBeats || []).concat(r.row.beats), { cues: [key + '.' + r.row.id] });
    if (key === 'thrown' && air.by === 'user' && social.closeRanks) social.closeRanks(p.slot); }   // BOLD CHOICE (round 3): the others close ranks round the one you threw

  const social = createSocial(ctx, { minds, B, perf, play, cut, note, envOf, react, T });

  const brain = {
    name: 'behaviour', log, moodline, minds, perf, social, skipped, B,
    add(p) { const s = p.slot, per = p.personality && data.personalities ? (data.personalities.scripts || []).find(x => x.id === p.personality) : null, rnd = rng.stream(p.id, 'behaviour');
      minds[s] = createMind(D, { id: p.id, rnd, personality: per || null, real: p.brain === 'real', gags: data.gags });
      B[s] = { p, rnd: rng.stream(p.id, 'behaviour-life'), nextMicro: 0, nextBody: 0, queue: [], owed: [], air: null, ignored: { watched: -1, gone: -1 }, wakeAt: 0, goneT: null,
        bodyT: T(), holdK: 0, stanceDue: false, spots: [body.x[s]], landmarkT: T(), nextPlaceT: 0, nextGlitchT: 0, glitches: 0, still: 0, stillMax: 0, stoodS: 0, secs: 0, moved: 0, lastX: body.x[s], xs: [], bornT: T() };
      { const r2 = rng.stream(p.id, 'behaviour-round3'); B[s].nextPlaceT = T() + (PL ? between(r2, PL.first_s || PL.every_s) : 1e9); B[s].nextGlitchT = T() + (GL ? between(r2, GL.first_s || GL.every_s) : 1e9); }
      perf.add(p); const m = minds[s], t = T(); m.weights(); m.born = t; m.quietSince = t; m.nextWhim = t + D.moods.whim.every_s[0] + (D.moods.whim.every_s[1] - D.moods.whim.every_s[0]) * rnd();
      B[s].nextMicro = t + m.gap('micro'); B[s].nextBody = t + m.gap('body'); moodline.push({ t, slot: s, dom: m.dom, w: { ...m.w } }); social.add(p); },
    remove(p) { social.remove(p); perf.remove(p); minds[p.slot] = null; B[p.slot] = null; },
    step(p, k) {
      if (!wrapped && ctx.moves) { wrapped = true; const orig = ctx.moves.step.bind(ctx.moves); ctx.moves.step = (q, kk) => { orig(q, kk); perf.overlay(q); }; }   // my overlay runs right after the moves plug-in, the same step
      const s = p.slot, m = minds[s], b = B[s], t = k / 60; if (!m) return;
      if (s === ctx.potatoes[0].slot) { social.wrap(); social.step(k); }
      if ((k + s * 13) % 60 === 0) { const env = envOf(p); if (m.second(t, env)) { note(s, 'mood', m.dom); b.stanceDue = true; }
        { const u0 = perf.unit(p), act = (u0 && u0.kind !== 'ring' && !(u0.kind === 'idle' && u0.tier === 'micro')) || m.asleep || body.mode[s] !== MODE.ground || social.busy(s); b.secs++; if (act) b.still = 0; else if (++b.still > b.stillMax) b.stillMax = b.still;
          const x = body.x[s]; if (Math.abs(x - b.lastX) > 0.03) b.moved++; if (Math.abs(x - b.lastX) <= 0.03 && body.mode[s] === MODE.ground) { if (++b.stoodS === 3 && Math.abs(x - b.spots[b.spots.length - 1]) > 0.5) { b.spots.push(x); if (b.spots.length > 6) b.spots.shift(); } } else b.stoodS = 0; b.lastX = x; b.xs.push(body.mode[s] === MODE.ground ? +x.toFixed(2) : null); if (b.xs.length > 7200) b.xs.shift(); }
        moodline.push({ t: +t.toFixed(1), slot: s, dom: m.dom, w: Object.fromEntries(Object.entries(m.w).map(([a, v]) => [a, +v.toFixed(3)])) }); if (moodline.length > 20000) moodline.shift();
        ignoredLadder(p, env); b.owed = b.owed.filter(o => o.exp > t); }
      if ((k + s * 7) % 12 === 0) cursorRings(p);
      if (body.mode[s] !== MODE.ground) { if (perf.busy(p) && !perf.selfAir(p)) cut(p, 'physics'); return; }
      if (perf.busy(p)) { perf.step(p); return; }
      if (b.queue.length) { const u = b.queue.shift(); if (u.beats.length) { note(s, 'queued', u.id); b.bodyT = t; perf.play(p, { kind: 'reaction', ...u, onEnd: () => { b.nextMicro = T() + m.gap('micro'); b.nextBody = Math.max(b.nextBody, T() + m.gap('micro')); } }); } return; }
      if (social.busy(s)) return;
      if (clock.k < b.holdK) return;                                                                    // somebody's look after is still holding: nothing starts
      if (perf.real() && ctx.moves.busy && !m.asleep && ctx.moves.busy(p)) return;                      // her queue is still finishing what he was doing: nothing new starts on top of it
      const env = envOf(p);
      if (!b.castDone && t - m.born > 1) { b.castDone = true; if (m.dial && m.dial.starts_asleep_in_a_crowd && ctx.potatoes.length > 1) { playIdle(p, m.by.sleep_standing); return; } }   // the one who isn't listening starts as he means to go on
      if (m.asleep) { if (t >= b.wakeAt && !(m.dial && m.dial.starts_asleep_in_a_crowd && ctx.potatoes.length > 1 && m.energy < 0.9)) playIdle(p, m.by.wake_self_glitch, true); return; }
      const first = m.firstMinute(t) && !(ctx.potatoes.length > 1 && t - m.born >= (D.first_minute.in_a_crowd_seconds || 15));
      const alone = ctx.potatoes.length < 2;
      if (b.stanceDue && !first) { b.stanceDue = false; if (alone && playStance(p)) return; }
      const must = CAP > 0 && !first && t - b.bodyT >= CAP - (b.capLead || 6);                    // the director's ruling: no gap between body behaviours over the cap
      if ((t >= b.nextBody || must) && !first) {
        const o = b.owed.find(x => x.due <= t && m.by[x.id] && m.needsOk(m.by[x.id], t, env));
        if (o) { b.owed.splice(b.owed.indexOf(o), 1); playIdle(p, m.by[o.id], false, o.beat); return; }
        let bh = null;
        if (GL && t >= b.nextGlitchT) { bh = m.pick(t, env, 'any', { tag: 'self_glitch' }); if (!bh) b.nextGlitchT = t + 10; }
        if (!bh && PL && alone && t >= b.nextPlaceT) { bh = m.pick(t, env, 'body', { tag: 'place' }); if (!bh) b.nextPlaceT = t + 10; }
        if (!bh) bh = m.pick(t, env, 'body', { must });
        if (bh) { if (bh.tier === 'big' && ctx.potatoes.length > 1) social.take('big:' + bh.id, s, 12); if (playIdle(p, bh) !== false) return; }
        b.nextBody = t + (must ? 1.5 : m.gap('micro')); }
      if (t >= b.nextMicro) { const bh = m.pick(t, env, 'micro'); if (bh) playIdle(p, bh); else b.nextMicro = t + m.gap('micro'); }
    },
    event(name, e) {
      const p = e && e.slot != null ? ctx.bySlot[e.slot] : null, s = p ? p.slot : -1, m = p ? minds[s] : null, b = p ? B[s] : null, t = T();
      switch (name) {
        case 'poked': if (!m) break; direct(p); if (social.onUser('poked', s)) break; react(p, m.asleep ? 'poked_asleep' : 'poked'); social.glance(s); break;
        case 'picked_up': if (!m) break; direct(p); cut(p, 'physics'); b.queue.length = 0; social.onUser('picked_up', s); react(p, 'picked_up', {}, { quiet: true }); break;
        case 'dragged': if (m) { const r = m.react('dragged', { speed: e.speed || 0, shakes: 0, dt: 1 / 60 }, t); if (r && r.row) note(s, 'ring', 'dragged.' + r.row.id); } break;
        case 'thrown': if (!m) break; if (e.by === 'user') { direct(p); m.energy = Math.max(0, m.energy - D.drives.energy.costs.thrown); social.onUser('thrown', s); } else m.named('got_thrown_by_potato', t);
          b.air = { speed: e.speed, by: e.by }; note(s, 'physics', 'thrown', { speed: +(e.speed || 0).toFixed(1), by: e.by }); break;
        case 'dropped': if (!m) break; if (e.by === 'user') direct(p); b.air = { dropped: true, by: e.by === 'user' ? 'user' : e.by }; if (e.rooted) aftermath(p); break;
        case 'shoved': if (m) { b.air = { by: e.by, shoved: true }; social.onShoved(e); } break;
        case 'contact': if (!m) break; if (e.surface === 'potato') social.onBump(e);
          if (e.first && b.air) { b.air.kind = e.kind; if (e.surface === 'wall' && e.speedInto >= 8) b.air.hardWall = true;
            if (e.kind && e.kind !== 'bounce') { const key = e.kind === 'crack' ? 'cracked' : e.kind === 'hole' ? 'went_through' : 'splatted'; note(s, 'physics', 'contact.' + e.kind, { speed: +e.speedInto.toFixed(1) });
              if (!ctx.fx) skipped[key] = (skipped[key] || 0) + 1; else if (D.reactions[key]) { b.air.special = key; } } } break;
        case 'landed': if (!m) break; b.landT = t; if (perf.selfAir(p)) break; { const r = m.react('landed', { speed: e.speed, force: true }, t); if (r && r.row) { note(s, 'ring', 'landed.' + r.row.id, { speed: +e.speed.toFixed(1) }); if (b.air) b.air.landBeats = r.row.beats.filter(x => !x.move); } if (e.upright) aftermath(p); } break;
        case 'got_up': if (m) aftermath(p); break;
        case 'mode': if (m && e.to === 'ground') perf.sync(p); if (m && e.to === 'free' && e.why === 'knocked' && !b.air) b.air = { by: social.lastShover(), knocked: true }; break;
        case 'cursor_gone': for (const q of ctx.potatoes) { B[q.slot].goneT = t; if (!perf.busy(q) && body.mode[q.slot] === MODE.ground && !social.busy(q.slot) && !minds[q.slot].asleep) react(q, 'cursor_gone'); } break;
        case 'cursor_returned': for (const q of ctx.potatoes) { const u = perf.unit(q), mq = minds[q.slot], priv = u && u.kind === 'idle' && mq.by[u.id] && mq.by[u.id].tags.includes('private');
          if (priv || mq.asleep) { mq.caughtT = t; react(q, 'cursor_returned', {}, { note: { caught: u ? u.id : 'asleep' } }); } } break;
        case 'window_edge': if (m && !social.busy(s)) { const r = m.react('window_edge', { was_looking_at: e.was_looking_at }, t); if (r && r.row) b.queue.push({ id: 'window_edge.' + r.row.id, beats: r.row.beats, cues: ['window_edge.' + r.row.id] }), note(s, 'reaction', 'window_edge.' + r.row.id); } break;
        case 'typed_at': if (m) { direct(p); react(p, 'typed_at', { chars: e.chars || 0, pause_s: e.pause_s || 0, force: false }); } break;
        case 'zapped': if (!m) break; direct(p); if (GL) b.nextGlitchT = t + between(b.rnd, GL.every_s); m.energy = Math.max(0, m.energy - D.drives.energy.costs.zapped); { const r = react(p, 'zapped'); if (r && r.row && !r.refused && !(perf.real() && ctx.moves.has('zap'))) { const z = D.reactions.zapped.late_twitch_after_s || [1.8, 3.2];
          clock.after(Math.round((z[0] + (z[1] - z[0]) * b.rnd()) * 60 + 120), () => { if (minds[s] && body.mode[s] === MODE.ground) { ctx.rig.kick(s, 'wob', 0.5); if (ctx.rig.wake) ctx.rig.wake(s, 40); note(s, 'reaction', 'zapped.late_twitch'); } }); } } break;
        case 'fed': if (m) { direct(p); react(p, 'fed'); } break;
        case 'squished': case 'exploded': if (m) { direct(p); react(p, 'squished', { how: name }); } break;
        case 'other_near': if (m) social.onNear(s, e.other); break;
        case 'other_left': if (m) social.onLeft(s, e.other); break;
        case 'said': if (m) social.onSaid(s); break;
      }
    },
    /** the real brain's only door for movement: ask for a behaviour by id. The picker's own rules may say no. */
    request(p, id) { if (!p || !minds[p.slot]) return false; const m = minds[p.slot], t = T(), u = perf.unit(p);
      if (body.mode[p.slot] !== MODE.ground || social.busy(p.slot) || (u && u.kind !== 'idle') || !m.allowed(id, t, envOf(p))) { note(p.slot, 'request', id, { said: 'no' }); return false; }
      cut(p, 'request'); note(p.slot, 'request', id, { said: 'yes' }); playIdle(p, m.by[id]); return true; },
    /** nothing of the brain's starts on him for this many frames (a look after that somebody else is running: the comedian's witness, a host) */
    hold(p, frames) { const q = typeof p === 'object' ? p : ctx.bySlot[p]; if (!q || !B[q.slot]) return false; B[q.slot].holdK = Math.max(B[q.slot].holdK, clock.k + Math.max(0, Math.round(frames))); return true; },
    /** the real brain's door for words: the thinking one says this next (the crowd reads it by keyword). */
    say(p, text) { return social.say(p, text); },
    /** for tests and strips only: start an argument between two of them at a rung (the ladder, the guard and the physics from there are the real ones) */
    argue(a, b, rung = 1) { return social.argue(a, b, rung); },
    /** what happened, as numbers: per Potato the sequence, the longest run that ever repeated, the mood timeline, the pace */
    report() { const out = {};
      for (const p of ctx.potatoes) { const s = p.slot, m = minds[s], rows = log.filter(r => r.slot === s && r.kind !== 'mood' && r.kind !== 'physics' && r.kind !== 'request' && r.kind !== 'ring' && r.kind !== 'said' && r.kind !== 'place' && r.kind !== 'queued' && !r.waits && !(r.kind === 'crowd' && (r.id === 'say' || r.id === 'not_listening' || r.id === 'arg_start' || r.id === 'odd_one_out' || r.id.startsWith('shove.')))), seqAll = rows.map(r => r.id), seq = rows.filter(r => r.kind !== 'stance').map(r => r.id),
          own = rows.filter(r => r.kind === 'idle' || r.kind === 'resume').map(r => r.id);
        const ml = moodline.filter(r => r.slot === s), segs = []; for (const r of ml) { const L = segs[segs.length - 1]; if (L && L.mood === r.dom) L.to = r.t; else segs.push({ mood: r.dom, from: r.t, to: r.t }); }
        const share = {}; for (const g of segs) share[g.mood] = (share[g.mood] || 0) + (g.to - g.from + 1); const tot = Object.values(share).reduce((a, c) => a + c, 0) || 1; for (const k in share) share[k] = +(share[k] / tot).toFixed(3);
        const body_t = rows.filter(r => (r.kind === 'idle' || r.kind === 'resume') && m.by[r.id] && m.by[r.id].tier !== 'micro'), gaps = []; for (let i = 1; i < body_t.length; i++) gaps.push(+(body_t[i].t - body_t[i - 1].t).toFixed(1));
        const kinds = {}; for (const r of rows) kinds[r.kind] = (kinds[r.kind] || 0) + 1;
        // round 3 measures (the director's 'alive' marks): where he stood, how much he travelled, the longest stretch his body did nothing
        const b = B[s], stands = []; { let run = null; for (let i = 0; i < b.xs.length; i++) { const x = b.xs[i]; if (x != null && run && Math.abs(x - run.x) < 0.12) run.n++; else { if (run && run.n >= 3) stands.push(run); run = x == null ? null : { x, n: 1, i }; } } if (run && run.n >= 3) stands.push(run); }
        const apart = (PL ? PL.min_apart_body_heights : 2) * BH, places = lst => { const got = []; for (const q of lst) if (got.every(g => Math.abs(g - q.x) >= apart)) got.push(q.x); return got; };
        const wins = []; for (let a = 0; a + 300 <= b.xs.length; a += 60) wins.push(places(stands.filter(q => q.i + q.n > a && q.i < a + 300)).length);
        const body_all = log.filter(r => r.slot === s && !r.waits && (((r.kind === 'idle' || r.kind === 'resume') && m.by[r.id] && m.by[r.id].tier !== 'micro') || r.kind === 'stance' || (r.kind === 'reaction' && !r.hers) || (r.kind === 'crowd' && r.id !== 'say' && r.id !== 'not_listening' && r.id !== 'arg_start' && !r.id.startsWith('aud_sleeps')))), gaps_all = []; for (let i = 1; i < body_all.length; i++) gaps_all.push(+(body_all[i].t - body_all[i - 1].t).toFixed(1));
        out[p.id] = { personality: p.personality, brain: p.brain, things_done: seq.length, by_kind: kinds, distinct: new Set(seq).size, longest_repeated_run: longestRepeatedRun(seq), longest_repeated_run_counting_stance_turns: longestRepeatedRun(seqAll).length, stance_turns: rows.filter(r => r.kind === 'stance').length, longest_repeated_run_of_his_own_choices: longestRepeatedRun(own), back_to_back_same: seq.filter((x, i) => i && x === seq[i - 1]).length,
          picker: m.stats(), mood_segments: segs, mood_share: share, moods_seen: Object.keys(share).length, body_behaviour_gaps_s: gaps, longest_stretch_with_no_body_behaviour_s: gaps.length ? Math.max(...gaps) : null,
          body_thing_gaps_s: gaps_all, longest_gap_between_body_things_s: gaps_all.length ? Math.max(...gaps_all) : null, longest_still_stretch_s: b.stillMax, share_of_seconds_travelling: +(b.moved / Math.max(1, b.secs)).toFixed(3),
          places_stood_in: places(stands).map(x => +x.toFixed(2)), places_in_each_5_min_window: wins, fewest_places_in_any_5_min: wins.length ? Math.min(...wins) : null, own_glitches: b.glitches, picks_that_needed_the_rules_relaxed: m.relaxed || 0, lines_said: log.filter(r => r.slot === s && r.kind === 'said').length, sequence: rows.map(r => ({ t: r.t, kind: r.kind, id: r.id, mood: r.mood })) }; }
      return { k: clock.k, seconds: +T().toFixed(1), potatoes: out, crowd: social.report(), moves_with_nothing_behind_them: [...perf.missing], animator_moves_used: [...perf.used], placeholder_moves_used: [...perf.placeholders], reactions_skipped_no_fx: skipped }; },
  };
  return brain;
}
