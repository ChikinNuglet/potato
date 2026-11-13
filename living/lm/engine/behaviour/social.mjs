// social.mjs — THE CROWD: up to five Potatoes in one scene. One is the thinking one (brain: 'real'; tonight his lines come
// from a small list in behaviour.json crowd.thinking_one), the others run on script, each bent by a personality.
// What is here: the stage (one big bit at a time), noticing each other, the audience (staggered, no two neighbours the same),
// the thinking one's lines and who reacts to which word, arguments that climb the ladder (look, lean and burst, bump, shove,
// the lift that does not work) with the real physics on the shove, the pile-up, personal space, the one who isn't listening,
// all five looking at you once, and what a user's hand does to all of it. Every beat it plays is DATA (behaviour.json crowd).
// REAL, NOT MEAN is code here, not a hope: see shoveNow() and pickFoe().
// Behaviour Designer (seat 4), Build round.
// Round 3 (carried from Owed One; notes from the director, the comedian and the Potato seat):
//   HEAT (arguments.heat): the room owes a shove. Past shove_due_s with none, the next argument climbs all the way to one; once a session a lift WORKS.
//   CLUMPS (crowd.clumps): they stand two, two and one, each at his own angle, and the odd one out changes.
//   a thrown one is FOLLOWED: every awake body turns after him (audience.bits); a shove gets its after (the shover looks away, one of the others rules nothing);
//   two who notice each other turn in and turn home on the same frame; nobody notices a newcomer until he has landed and settled;
//   in an argument the speaker stays turned until he is answered, and a script reply starts before the other has finished his bobs.
import { MODE } from '../body.mjs';

export function createSocial(ctx, { minds, B, perf, play, cut, note, envOf, react, T }) {
  const { data, clock, rng, body, emit } = ctx, D = data.behaviour, C = D.crowd, ON = C.tonight || {}, AR = C.arguments, TH = C.thinking_one || {}, LAD = AR.ladder, ENDS = Object.fromEntries(AR.ends.map(e => [e.id, e]));
  const dirC = (data.direction && data.direction.crowd) || {}, W = (body.W || 0.5) * 2, rnd = rng.stream('room', 'behaviour-crowd'), R = (a, b) => a + (b - a) * rnd(), draw = v => (Array.isArray(v) ? R(v[0], v[1]) : v);
  const HEAT = AR.heat && AR.heat.on !== false ? AR.heat : null, CLP = C.clumps || {}, FOLLOW = (C.audience.bits) || {};
  const S = { t0: null, lastShoveT: null, shoveDue: 0, throwDue: 0, thrown: 0, clumpT: null, lastOdd: -1, clump: null, stage: null, stageUntil: 0, stageFreeAt: 0, arg: null, nextArgT: null, lastPair: '', lastWinner: -1, lastInstigator: -1, shover: -1, shoved: -1, nextSayT: null, lastLines: [], pendingLine: null, syncT: -1e9, pile: null, pileT: -1e9, hold: new Set(), yieldT: {}, againT: {}, owed: null, n: 0 };
  const counts = { arguments: 0, shoves: 0, bumps: 0, shoves_withheld: 0, lines: 0, pile_ups: 0, not_listening: 0, audience: 0, ends: {}, top_rung: {}, in_sync: 0, space_yields: 0, owed_bursts: 0, shove_chain: 0, lifts: 0, throws: 0, unison: 0, referee: 0, clump_deals: 0, first_shove_s: null };
  const P = s => ctx.bySlot[s], up = s => P(s) && body.mode[s] === MODE.ground, awake = s => minds[s] && !minds[s].asleep, dist = (a, b) => Math.abs(body.x[a] - body.x[b]);
  const slots = () => ctx.potatoes.map(p => p.slot), after = (sec, fn) => clock.after(Math.max(1, Math.round(sec * 60)), fn);
  const dialOf = s => (minds[s] && minds[s].dial) || {}, dk = s => (minds[s].personality ? Math.abs(minds[s].personality.change.move) / 2 : 0);
  const free = s => up(s) && awake(s) && !S.hold.has(s) && !B[s].queue.length;

  const social = {
    counts, S,
    add() {}, remove(p) { S.hold.delete(p.slot); if (S.arg && (S.arg.a === p.slot || S.arg.b === p.slot)) endArg('end_interrupted', true); },
    busy: s => S.hold.has(s),
    stageFree: () => !S.stage && T() >= S.stageFreeAt,
    lastShover: () => S.shover,
    take(what, focus, maxS = 10) { S.stage = { what, focus, t: T() }; S.stageUntil = T() + maxS; },
    release() { if (S.stage) { S.stage = null; S.stageFreeAt = T() + (C.stage.min_gap_s || 6); } },
    report: () => ({ ...counts, argument_running: !!S.arg }),
  };

  // ---------- the audience: everyone not in the bit, staggered by distance, no two neighbours the same ----------
  function audience(focus, bit, skip = []) { if (!ON.audience) return; const t0 = T(); let delay = 0, lastId = null, late = 0;
    const others = slots().filter(s => s !== focus && !skip.includes(s) && body.mode[s] !== MODE.gone).sort((a, b) => dist(a, focus) - dist(b, focus));
    for (const s of others) { const m = minds[s]; delay += R((dirC.reaction_stagger_ms || [80, 400])[0], (dirC.reaction_stagger_ms || [80, 400])[1]) / 1000;
      if (!awake(s)) { counts.not_listening++; note(s, 'crowd', 'aud_sleeps_through', { bit }); continue; }
      if (!up(s) || S.hold.has(s) || dist(s, focus) > C.notice.radius_body_widths * W * 1.6) continue;
      const w = m.w || {}, only = FOLLOW[bit], pool = only ? C.audience.reactions.filter(r => only.includes(r.id)) : C.audience.reactions.filter(r => r.beats && r.beats.length && r.id !== lastId && !(r.id === 'aud_late' && late) && (!r.when || (r.when.bit ? r.when.bit === bit : false)));   // a bit with its own list (a throw): every body does that
      if (!pool.length) continue;
      const ws = pool.map(r => { let a = r.w; if (r.moods) { let f = 0.1; for (const k in r.moods) f += (w[k] || 0) * r.moods[k]; a *= f; } if (r.id === 'aud_late' && dialOf(s).extra && /aud_late/.test(dialOf(s).extra)) a *= 4; return a; });
      let tot = 0; for (const x of ws) tot += x; let r0 = rnd() * tot, pick = pool[0]; for (let i = 0; i < pool.length; i++) { r0 -= ws[i]; if (r0 <= 0) { pick = pool[i]; break; } }
      lastId = pick.id; if (pick.id === 'aud_late') late++; counts.audience++;
      after(delay, () => { if (!P(s) || !up(s) || !awake(s) || S.hold.has(s) || !P(focus)) return; const u = perf.unit(P(s)); if (u && u.kind !== 'idle' && !(only && u.kind === 'crowd' && String(u.id).startsWith('aud_'))) return; cut(P(s), 'audience'); minds[s].named('watched_a_big_bit', T()); play(P(s), 'crowd', pick.id, pick.beats, { info: { other: focus }, note: { watching: P(focus).id } }); }); } }
  /** neighbours glance when one of them is poked */
  social.glance = s => { if (ctx.potatoes.length < 2) return; let d = 0; for (const o of slots()) { if (o === s || !free(o) || dist(o, s) > C.notice.radius_body_widths * W) continue; d += R(0.08, 0.4); after(d, () => { if (P(o) && free(o) && !perf.busy(P(o))) play(P(o), 'crowd', 'glance_at_poked', [{ look: 'other', t: [0.3, 0.6] }, { look: 'home', t: [0.3, 0.5] }], { info: { other: s } }); }); } };

  // ---------- noticing each other: the other_near ladder, per pair, staggered ----------
  const pairKey = (a, b) => Math.min(a, b) * 8 + Math.max(a, b);
  const settled = s => up(s) && T() - (B[s].landT == null ? -99 : B[s].landT) > (C.notice.settle_s || 1) && T() - B[s].bornT > (C.notice.settle_s || 1);
  /** two notice each other (the comedian, round 2): the older turns in, the newer turns in a beat later, both hold, both turn home ON THE SAME FRAME */
  function unison(a, b, r) { const U = r.row.pair, old = Math.min(a, b), nw = Math.max(a, b); const rb = minds[b].react('other_near', { pair: P(a).id }, T()); minds[b].lastNotice = r.row.id; minds[b].lastNoticeT = T(); counts.unison++;
    for (const [s, o, beats] of [[old, nw, U.older], [nw, old, U.newer]]) { cut(P(s), 'noticed'); play(P(s), 'reaction', 'other_near.' + r.row.id, beats, { info: { other: o }, exact: true, cues: ['other_near.' + r.rung, 'other_near.' + r.row.id], note: { rung: r.rung, at: P(o).id, unison: true } }); } }
  function noticeRung(a, b, late, tries = 0) { if (!ON.notice || !P(a) || !P(b)) return; after(late, () => { if (!P(a) || !P(b)) return; if ((!settled(a) || !settled(b)) && tries < 14) return noticeRung(a, b, 0.5, tries + 1);   // not while the newcomer is still dropping in (director B3)
    if (!free(a) || !awake(b)) return; const u = perf.unit(P(a)); if (u && u.kind !== 'idle') return;
    const r = minds[a].react('other_near', { pair: P(b).id }, T()); if (!r || !r.row) return; if (minds[a].lastNotice === r.row.id && T() - (minds[a].lastNoticeT || -99) < 90) return; minds[a].lastNotice = r.row.id; minds[a].lastNoticeT = T(); if (r.row.who === 'higher_nosy' && (minds[a].w.nosy || 0) < (minds[b].w.nosy || 0)) return;
    if (r.row.pair && free(b) && !(perf.unit(P(b)) && perf.unit(P(b)).kind !== 'idle') && T() - (S.unisonT == null ? -99 : S.unisonT) > 4) { S.unisonT = T(); return unison(a, b, r); }   // one pair at a time: two pairs doing it together would be a chorus line
    cut(P(a), 'noticed'); play(P(a), 'reaction', 'other_near.' + r.row.id, r.row.beats, { info: { other: b }, cues: ['other_near.' + r.rung, 'other_near.' + r.row.id], note: { rung: r.rung, at: P(b).id } }); }); }
  social.onNear = (a, b) => { if (a < b) { noticeRung(a, b, R(0.1, 0.5)); noticeRung(b, a, R(0.5, 1.1)); S.againT[pairKey(a, b)] = T() + draw(C.notice.again_every_s || [25, 60]); } };
  social.onLeft = (a, b) => { if (a < b && minds[a] && minds[b]) { delete minds[a].ladders['other_near:' + P(b).id]; delete minds[b].ladders['other_near:' + P(a).id]; delete S.againT[pairKey(a, b)]; } };

  // ---------- the user's hand always wins the stage ----------
  social.onUser = (what, s) => { if (ctx.potatoes.length < 2) return false; const A = S.arg;
    if (what === 'poked') { const n = slots().filter(o => up(o) && awake(o)).length;
      if (A && A.rung >= 2 && ON.in_sync_gag && n >= (C.in_sync_gag.needs.count_min || 3) && T() - S.syncT > (C.in_sync_gag.at_most_every_min || 10) * 60) { S.syncT = T(); counts.in_sync++; endArg('end_interrupted', true, true); let i = 0;
        for (const o of slots()) { if (!up(o) || !awake(o)) continue; cut(P(o), 'in_sync'); const back = draw(C.in_sync_gag.back_one_by_one_s || [0.25, 0.6]) * i++;
          play(P(o), 'crowd', 'all_five_once', C.in_sync_gag.beats.concat([{ hold: 1, t: back }, { look: 'home', turn: { to: 'home', speed: 'slow' }, t: [0.4, 0.7] }]), {}); } return true; }
      if (A && (A.a === s || A.b === s)) endArg('end_interrupted', true); return false; }
    if (A && (A.a === s || A.b === s)) { const o = A.a === s ? A.b : A.a; endArg('end_interrupted', true, true, s);      // you took one out of it: the other bursts once more at the empty spot
      if (up(o) && awake(o)) { cut(P(o), 'take_one_away'); play(P(o), 'crowd', 'take_one_away', AR.take_one_away.beats, { info: { side: Math.sign(body.x[s] - body.x[o]) || 1 } }); } }
    else if (A && what === 'thrown') endArg('end_interrupted', true);
    if (S.pile) S.pile = null;
    social.take('user:' + what, s, 8); audience(s, 'picked_up_or_thrown'); if (what === 'thrown') S.clumpT = Math.max(S.clumpT || 0, T() + 6); return false; };

  // ---------- the thinking one: a line now and then, and who hears which word ----------
  social.say = (p, text) => { S.pendingLine = { slot: p.slot, text }; S.nextSayT = T(); return true; };
  function thinkingOne() { return ctx.potatoes.find(p => p.brain === 'real') || null; }
  function trySay(t) { const p = thinkingOne(); if (!p || !ON.thinking_one || !TH.lines) return; if (S.nextSayT == null) S.nextSayT = t + draw(TH.says_every_s) * 0.5;
    if (t < S.nextSayT || !free(p.slot) || perf.unit(p) && perf.unit(p).kind !== 'idle' || (S.arg && S.arg.rung >= 3) || S.pile) return;
    const to = slots().filter(s => s !== p.slot && up(s) && awake(s)).sort((a, b) => dist(a, p.slot) - dist(b, p.slot))[0]; if (to == null) { S.nextSayT = t + 5; return; }
    let text = S.pendingLine && S.pendingLine.slot === p.slot ? S.pendingLine.text : null; S.pendingLine = null;
    if (!text) { const pool = TH.lines.filter(l => !S.lastLines.includes(l)); text = pool[Math.floor(rnd() * pool.length)]; }
    S.lastLines.push(text); if (S.lastLines.length > 3) S.lastLines.shift(); S.line = { text, to }; S.nextSayT = t + draw(TH.says_every_s);
    const late = draw(C.the_real_one_is_late.late_s), beats = TH.delivery_beats.map(b => (b.t === 'late_s' ? { ...b, t: late } : b));
    cut(p, 'say'); play(p, 'crowd', 'say', beats, { info: { other: to }, note: { late_s: +late.toFixed(2), to: P(to).id } }); }
  social.onSaid = s => { const L = S.line; if (!L) return; S.line = null; counts.lines++; const text = L.text.toLowerCase(), key = Object.keys(TH.keywords).find(k => text.includes(k)), K = key ? TH.keywords[key] : null;
    note(s, 'said', L.text, { keyword: key || null, react: K ? K.react : null }); emit('line', { by: s, text: L.text, keywords: key ? [key] : [] });
    for (const o of slots()) if (o !== s && minds[o]) minds[o].push({ nosy: 0.08 }, T());
    if (!K) return; const sleeper = slots().find(o => o !== s && !awake(o));
    for (const o of slots()) if (o !== s && (!awake(o) || dialOf(o).starts_asleep_in_a_crowd)) { counts.not_listening++; note(o, 'crowd', 'not_listening', { line: key }); }
    if (K.react === 'argue_back') { const a = pickInstigator(s, true); if (a != null && !S.arg) startArg(a, s, 2, 'said:' + key); return; }
    if (K.react === 'back_down') { if (S.arg && S.arg.rung <= 2) endArg('end_back_down'); return; }
    let who = slots().filter(o => o !== s && free(o) && !dialOf(o).starts_asleep_in_a_crowd).sort((a, b) => dist(a, s) - dist(b, s));
    if (K.who === 'nearest') who = who.slice(0, 1); else if (K.who === 'keeps_going') who = who.filter(o => minds[o].personality && minds[o].personality.change.dial === 'keeps_going');
    let focus = s; if (K.react === 'look_at_sleeper') { if (sleeper == null) return; focus = sleeper; } if (K.react === 'look_at_last_shover') { if (S.shover < 0 || !P(S.shover)) return; focus = S.shover; }
    let d = 0; for (const o of who) { d += R(0.08, 0.4); const mine = o === focus ? TH.reaction_beats.looked_at_shover : TH.reaction_beats[K.react]; if (!mine) continue;
      after(d, () => { if (!P(o) || !free(o) || !P(focus)) return; const u = perf.unit(P(o)); if (u && u.kind !== 'idle') return; cut(P(o), 'heard'); play(P(o), 'crowd', 'heard.' + (o === focus ? 'looked_at' : K.react), mine, { info: { other: focus }, note: { word: key } }); }); } };

  // ---------- arguments ----------
  function score(s) { const m = minds[s], w = m.w || {}; return (w.fed_up || 0) + 0.4 * (w.nosy || 0) + 0.5 * m.boredom + (dialOf(s).instigate || 0) * dk(s) - (m.startedLast ? 0.6 : 0) - (m.wonLast ? 1 : 0); }
  const due = () => !!(HEAT && ON.shove && S.lastShoveT != null && T() - S.lastShoveT > S.shoveDue);
  function pickInstigator(target, any, far = false) { let best = null, bs = -1e9; for (const s of slots()) { if (s === target || !free(s) || (minds[s].wont && minds[s].wont.never_instigates) || minds[s].energy < 0.3) continue; if (far && minds[s].wont && minds[s].wont.max_rung_as_instigator && minds[s].wont.max_rung_as_instigator < 4) continue; const u = perf.unit(P(s)); if (u && u.kind !== 'idle') continue; const sc = score(s); if (sc > bs) { bs = sc; best = s; } }
    return best != null && (any || bs > (AR.who_starts.needs_score || 0.55)) ? best : null; }
  /** who with: the nearest that is up, awake, not in a hand, not thrown lately, and not the one he argued with last time */
  function pickFoe(a) { const t = T(); return slots().filter(s => s !== a && free(s) && minds[s].energy >= 0.3 && t > minds[s].protectedUntil && S.lastPair !== pairKey(a, s) && !(perf.unit(P(s)) && perf.unit(P(s)).kind !== 'idle')).sort((x, y) => dist(x, a) - dist(y, a))[0]; }
  function startArg(a, b, rung, why) { const A = S.arg = { a, b, rung, giver: a, n: ++S.n, top: rung, hits: 0, touch: T(), t0: T(), why, owes: due() }; counts.arguments++; S.hold.add(a); S.hold.add(b); cut(P(a), 'argument'); cut(P(b), 'argument');
    note(a, 'crowd', 'arg_start', { with: P(b).id, why, about: 'the spot ' + P(b).id + ' is standing on' }); minds[a].startedLast = true; for (const s of slots()) if (s !== a && minds[s]) minds[s].startedLast = false;
    minds[a].energy = Math.max(0, minds[a].energy - D.drives.energy.costs.argument); minds[b].energy = Math.max(0, minds[b].energy - D.drives.energy.costs.argument);
    play(P(a), 'crowd', 'arg_approach', [{ look: 'other', t: [0.3, 0.6] }, { walk: { to: 'other', stop_short_bw: 1.3, speed: 'normal' }, t: [0.5, 2] }, { turn: { to: 'other', speed: 'normal' }, t: [0.2, 0.3] }], { info: { other: b }, onEnd: how => { if (how === 'done') runRung(A); else live(A) && endArg('end_interrupted', true); } }); }
  const live = A => S.arg === A && P(A.a) && P(A.b);
  const both = (A, fn) => { fn(A.a, A.b); fn(A.b, A.a); };
  function runRung(A) { if (!live(A)) return; if (!up(A.a) || !up(A.b) || !awake(A.a) || !awake(A.b)) return endArg('end_interrupted', true);
    const L = LAD[A.rung - 1]; A.touch = T(); A.top = Math.max(A.top, A.rung); A.hits = 0; A.giver = (S.shoved === A.a || S.shoved === A.b) && (S.shover === A.a || S.shover === A.b) ? S.shoved : HEAT && A.rung >= 3 && rnd() < (HEAT.other_one_goes_first_chance || 0) ? A.b : A.a;   // whoever just took one gives the next one; otherwise it is not always the one who started it
    if (L.takes_stage) { social.take('argument', A.a, 14); if (!A.aud) { A.aud = true; audience(A.a, 'argument', [A.a, A.b]); } }
    if (A.rung === 1) { let left = 2; const late = P(A.b).brain === 'real' ? draw(C.the_real_one_is_late.late_s) : R(0.15, 0.5);
      const go = (s, o, d) => after(d, () => { if (!live(A)) return; if (!up(s)) return endArg('end_interrupted', true); play(P(s), 'crowd', L.id, L.both, { info: { other: o }, keepYaw: true, onEnd: how => { if (how !== 'done') return live(A) && endArg('end_interrupted', true); if (--left === 0) climb(A); } }); });
      go(A.a, A.b, 0.02); go(A.b, A.a, late); }
    else if (A.rung === 2) { A.left = Math.round(draw(L.exchanges)); A.i = 0; burst(A, A.a, A.b); }
    else if (A.rung === 3 || A.rung === 4) turn(A);
    else lift(A); }
  function burst(A, s, o) { if (!live(A)) return; if (!up(s) || !up(o)) return endArg('end_interrupted', true); A.touch = T();
    const late = P(s).brain === 'real' && A.i ? draw(C.the_real_one_is_late.late_s) : 0, grow = Math.pow(LAD[1].grow || 1.15, A.i), wind = P(s).personality === 'pp-0103' && A.i && rnd() < 0.5;   // rest beat winds up to answer and does not
    const again = A.i > 0 && !wind && LAD[1].burst_reply && P(s).brain !== 'real';                       // already leaned in: a script reply goes straight to the bobs (the tan one keeps his gather: he is the late one)
    const beats = wind ? [LAD[1].burst[0], { hold: 1, t: [0.5, 0.9] }] : again ? LAD[1].burst_reply : LAD[1].burst, ov = draw(LAD[1].overlap_s), lead = LAD[1].reply_lead_s == null ? 0.1 : LAD[1].reply_lead_s;
    after(late + 0.02, () => { if (!live(A)) return; if (!up(s)) return endArg('end_interrupted', true); A.i++; A.left--; let replied = false;
      const reply = () => { if (live(A) && !replied && up(o)) { replied = true; burst(A, o, s); } };
      play(P(s), 'crowd', wind ? 'arg_wind_up_no_answer' : 'arg_burst', beats, { info: { other: o }, grow, keepYaw: true, note: { n: A.i, late_s: late ? +late.toFixed(2) : undefined },   // keepYaw: he stays turned to the other until he is answered
        onBeat: (i, frames, bt) => { if (bt.bob && A.left > 0) after(Math.max(0.05, frames / 60 - ov - lead), reply); },                                  // the reply starts BEFORE his bobs have finished: the overlap is the argument
        onEnd: how => { if (how !== 'done' && how !== 'replaced') return live(A) && endArg('end_interrupted', true); if (!replied && live(A)) { replied = true; A.left > 0 ? burst(A, o, s) : climb(A); } } });
    }); }
  function turn(A) { if (!live(A)) return; const L = LAD[A.rung - 1], g = A.giver, o = g === A.a ? A.b : A.a; A.touch = T();
    if (!up(g) || !up(o) || !awake(o)) return endArg('end_backs_turned');
    const close = dist(g, o) > 1.22 * W ? [{ walk: { to: 'other', stop_short_bw: 1.12, speed: 'normal' }, look: 'other', t: [0.3, 1.2] }] : [];
    play(P(o), 'crowd', L.id + '.taker', L.taker, { info: { other: g }, keepYaw: true });
    play(P(g), 'crowd', L.id, close.concat(L.giver), { info: { other: o }, keepYaw: true, onShove: (p, target, level, viaHer) => shoveNow(A, p.slot, target, level, viaHer), onEnd: how => { if (!live(A)) return; if (how !== 'done') return endArg('end_interrupted', true); A.hits++; waitUp(A, o, () => { if (A.hits < (L.each_gets || 1) * 2) { A.giver = o; turn(A); } else climb(A); }); } }); }
  function waitUp(A, s, fn, n = 0) { if (!live(A)) return; A.touch = T(); if ((up(s) && !perf.busy(P(s))) || n > 50) return after(R(0.3, 0.7), () => live(A) && fn()); after(0.2, () => waitUp(A, s, fn, n + 1)); }
  /** REAL, NOT MEAN: a shove only lands on someone who is up, awake, on the ground and not in a hand, and never on the same one twice running by the same giver. */
  // The animator's bump / shove clips call crowd.shove themselves on their contact frame, so the guard sits ON that call (wrapped once, at the first step).
  // A shove nobody here asked for (the bench, a test script, the host) passes straight through untouched.
  function shoveNow(A, a, o, level, viaHer) { if (o == null || !P(o)) return; S.expect = { a, o, level, k: clock.k }; if (!viaHer) ctx.crowd.shove(a, o, level); }
  function guarded(raw, a, o, level) { const e = S.expect; if (!e || e.a !== a || e.o !== o || clock.k - e.k > 240) return raw(a, o, level); S.expect = null; level = e.level;
    const ok = ON.shove && P(o) && up(o) && awake(o) && !(S.shover === a && S.shoved === o);
    if (!ok) { counts.shoves_withheld++; note(a, 'crowd', 'shove_withheld', { at: P(o) ? P(o).id : '?' }); return; }
    S.shover = a; S.shoved = o; counts[level === 'bump' ? 'bumps' : 'shoves']++; note(a, 'crowd', 'shove.' + level, { at: P(o).id, k: clock.k }); cut(P(o), 'shoved'); minds[o].push({ fed_up: 0.12, rattled: 0.08 }, T());
    raw(a, o, level); ctx.rig.kick(a, 'wob', 0.6); if (ctx.rig.wake) ctx.rig.wake(a, 60);
    if (level !== 'bump') { if (counts.first_shove_s == null) counts.first_shove_s = +(T() - S.t0).toFixed(1); S.lastShoveT = T(); if (HEAT) S.shoveDue = draw(HEAT.shove_due_later_s); referee(a, o); } }
  /** the after (the comedian): one of the others looks at the one on the floor, then at the one who did it, and rules nothing */
  function referee(a, o) { const R0 = AR.referee; if (!R0) return; const r = slots().filter(s => s !== a && s !== o && s !== S.lastRef && up(s) && awake(s) && !S.hold.has(s)).sort((x, y) => dist(x, o) - dist(y, o))[0]; if (r == null) return; S.lastRef = r;   // never the same referee twice running
    after(draw(R0.after_s), () => { if (!P(r) || !up(r) || !awake(r) || S.hold.has(r) || !P(o) || !P(a)) return; const u = perf.unit(P(r)); if (u && u.kind !== 'idle' && !(u.kind === 'crowd' && String(u.id).startsWith('aud_'))) return; counts.referee++; cut(P(r), 'referee');
      play(P(r), 'crowd', 'referee', R0.at_the_floor, { info: { other: o }, keepYaw: true, onEnd: how => { if (how === 'done' && P(r) && P(a) && up(r) && !S.hold.has(r)) play(P(r), 'crowd', 'referee.rules_nothing', R0.at_the_shover, { info: { other: a } }); } }); }); }
  social.wrap = () => { if (S.wrapped || !ctx.crowd) return; S.wrapped = true; const raw = ctx.crowd.shove.bind(ctx.crowd); ctx.crowd.shove = (a, o, level) => guarded(raw, a, o, level); };
  function lift(A) { const L = LAD[4], g = A.giver, o = g === A.a ? A.b : A.a; A.touch = T(); counts.lifts++; S.lastLiftT = T(); if (!up(g) || !up(o)) return endArg('end_backs_turned');
    const works = !!(HEAT && HEAT.throw_once && ON.lift_works_once && !S.thrown && T() - S.t0 > S.throwDue && awake(o) && !(S.shover === g && S.shoved === o));   // once a session it works (director B3). Same guard as a shove.
    play(P(o), 'crowd', 'arg_lift.taker', L.taker, { info: { other: g } }); play(P(g), 'crowd', 'arg_lift', L.giver, { info: { other: o }, note: { works }, onBeat: (i, f, bt) => { if (works && bt.emit === 'lift_heave') after(f / 60, () => throwNow(A, g, o)); }, onEnd: () => live(A) && endArg('end_backs_turned') }); }
  /** one Potato throws another: an impulse up and over, capped at the script-throw speed, then it is the same flight, the same landing and the same aftermath as yours */
  function throwNow(A, g, o) { if (!live(A) || !P(o) || !up(o) || !up(g) || !awake(o)) return; const TH0 = HEAT.throw, dir = Math.sign(body.x[o] - body.x[g]) || 1, v = draw(TH0.speed), ang = draw(TH0.angle_deg) * Math.PI / 180;
    S.thrown++; counts.throws++; S.shover = g; S.shoved = o; S.lastShoveT = T(); S.shoveDue = draw(HEAT.shove_due_later_s); note(g, 'crowd', 'throw', { at: P(o).id, speed: +v.toFixed(1) }); cut(P(o), 'thrown'); minds[o].protectedUntil = T() + (AR.after.protect_s || 120);
    if (body.impulse) body.impulse(o, dir * v * Math.cos(ang), v * Math.sin(ang), -dir * draw(TH0.spin)); else ctx.crowd.shove(g, o, 'big_shove');
    emit('thrown', { slot: o, by: g, speed: v, vx: dir * v * Math.cos(ang), vy: v * Math.sin(ang) }); social.take('potato_throw', o, 8); audience(o, 'picked_up_or_thrown', [g, o]); S.clumpT = Math.max(S.clumpT || 0, T() + 8); }
  function climb(A) { if (!live(A)) return; const L = LAD[A.rung - 1], fed = ((minds[A.a].w.fed_up || 0) + (minds[A.b].w.fed_up || 0)) / 2, pat = 1 + ((dialOf(A.a).patience || 1) - 1) * dk(A.a);
    const cap = minds[A.a].wont && minds[A.a].wont.max_rung_as_instigator, liftOk = A.rung < 4 || T() - (S.lastLiftT == null ? -1e9 : S.lastLiftT) > ((HEAT && HEAT.lift_gap_s) || 0), okNext = A.rung < LAD.length && !(cap && A.rung >= cap) && liftOk && (A.rung + 1 < 3 || ON.shove);   // the lift that does not work is a gag: not in every fight
    const owes = (A.owes || due()) && A.rung < 4, toss = !!(HEAT && HEAT.throw_once && ON.lift_works_once && !S.thrown && T() - S.t0 > S.throwDue && A.rung === 4);   // HEAT: the room owes a shove, so this one climbs to it; once a session it climbs one more
    if (okNext && (owes || toss || rnd() < L.climb * (0.6 + fed) / pat + (A.rung === 1 ? 0.15 : 0))) { A.rung++; if (A.rung === 3 && HEAT && ON.shove && !(cap && cap < 4) && rnd() < (HEAT.skip_the_bump_chance || 0)) A.rung = 4;   // not every fight goes through every rung
      both(A, s => minds[s].push({ fed_up: 0.12 }, T())); if (A.rung === 3 && !owes && ctx.potatoes.length > 2 && rnd() < (ENDS.end_third_party.chance || 0.15)) return endArg('end_third_party'); return after(R(0.2, 0.5), () => runRung(A)); }
    endArg(A.top >= 3 ? 'end_backs_turned' : 'end_back_down'); }
  function endArg(kind, interrupted = false, silent = false, taken = -1) { const A = S.arg; if (!A) return; S.arg = null; const t = T(), E = ENDS[kind];
    counts.ends[kind] = (counts.ends[kind] || 0) + 1; counts.top_rung[A.top] = (counts.top_rung[A.top] || 0) + 1; S.lastPair = pairKey(A.a, A.b);
    let win = rnd() < 0.4 ? A.a : A.b; if (win === S.lastWinner) win = win === A.a ? A.b : A.a; const lose = win === A.a ? A.b : A.a;
    if (!interrupted) { S.lastWinner = win; if (minds[win]) { minds[win].named('won_argument', t); minds[win].wonLast = true; } if (minds[lose]) { minds[lose].named('lost_argument', t); minds[lose].wonLast = false; } for (const s of slots()) if (s !== win && minds[s]) minds[s].wonLast = false; }
    for (const s of [A.a, A.b]) if (minds[s]) { minds[s].protectedUntil = t + 20; minds[s].boredom = Math.max(0, minds[s].boredom - 0.3); }
    note(A.a, 'crowd', kind, { with: P(A.b) ? P(A.b).id : '?', top_rung: A.top, winner: interrupted ? null : P(win) && P(win).id });
    if (interrupted && D.flags.unfinished_business && D.flags.unfinished_business.value && A.rung >= 2 && taken < 0) { const u = D.flags.unfinished_business, from = A.giver === A.a ? A.b : A.a, to = from === A.a ? A.b : A.a; S.owed = { from, to, due: t + draw(u.after_s), exp: t + u.forgets_after_s }; }
    const done = () => { social.release(); S.nextArgT = T() + draw(AR.who_starts.gap_s) * 0.6; if (HEAT && ON.shove && S.lastShoveT != null) S.nextArgT = Math.min(S.nextArgT, Math.max(T(), S.lastShoveT + S.shoveDue) + draw(HEAT.gap_when_due_s)); S.clumpT = Math.max(S.clumpT || 0, T() + 4); };
    const fin = s => how => { S.hold.delete(s); if (!S.hold.has(A.a) && !S.hold.has(A.b)) done(); };
    if (silent) { S.hold.delete(A.a); S.hold.delete(A.b); for (const s of [A.a, A.b]) if (P(s) && s !== taken && up(s)) after(0.3, () => P(s) && perf.home && perf.home(P(s))); done(); return; }
    for (const s of [A.a, A.b]) { const o = s === A.a ? A.b : A.a; if (!P(s) || !up(s) || s === taken) { S.hold.delete(s); continue; }
      const beats = kind === 'end_third_party' ? E.pair : E.both || (s === lose ? E.loser : E.winner); if (perf.busy(P(s))) perf.stop(P(s), 'replaced');
      play(P(s), 'crowd', kind + (E.both || kind === 'end_third_party' ? '' : s === lose ? '.loser' : '.winner'), beats, { info: { other: o }, onEnd: fin(s) }); }
    if (kind === 'end_third_party') { const third = slots().filter(s => s !== A.a && s !== A.b && free(s)).sort((x, y) => dist(x, A.a) - dist(y, A.a))[0];
      if (third != null) { cut(P(third), 'third_party'); const far = Math.abs(body.x[A.a] - body.x[third]) > Math.abs(body.x[A.b] - body.x[third]) ? A.a : A.b; play(P(third), 'crowd', 'walks_between', E.third, { info: { other: far } }); } }
    if (!S.hold.has(A.a) && !S.hold.has(A.b)) done(); }

  // ---------- BOLD CHOICE (Behaviour Designer, round 3): CLOSING RANKS ----------
  // You threw one of them. When he is back on his feet the two nearest walk over, stand either side of him, and all three turn their backs on you.
  // Nobody looks at you. They hold it, then drift apart one at a time. Off: flags.closing_ranks.value = false in data/behaviour.json.
  social.closeRanks = v => { const CR = D.flags.closing_ranks; if (!CR || CR.value === false || ctx.potatoes.length < (CR.needs_potatoes || 3) || S.arg || S.pile || !P(v) || !up(v)) return false; const t = T(); if (t - (S.ranksT == null ? -1e9 : S.ranksT) < CR.at_most_every_s) return false;
    const ok = s => { if (s === v || !up(s) || !awake(s) || S.hold.has(s) || B[s].queue.length || dist(s, v) > CR.reach_body_widths * W) return false; const u = perf.unit(P(s)); return !u || u.kind === 'idle' || (u.kind === 'crowd' && String(u.id).startsWith('aud_')); };
    const who = slots().filter(ok).sort((a, b) => dist(a, v) - dist(b, v)).slice(0, 2); if (who.length < 2) return false; S.ranksT = t; counts.closing_ranks = (counts.closing_ranks || 0) + 1; S.clumpT = Math.max(S.clumpT || 0, t + 14);
    who.sort((a, b) => body.x[a] - body.x[b]); const hold = draw(CR.hold_s), gap = draw(CR.gap_body_widths) * W, xs = [body.x[v] - gap, body.x[v] + gap], lo = ctx.room.left + 0.7 * W, hi = ctx.room.right - 0.7 * W;
    if (xs[0] < lo) { xs[0] = body.x[v] + gap; xs[1] = body.x[v] + 2 * gap; } else if (xs[1] > hi) { xs[1] = body.x[v] - gap; xs[0] = body.x[v] - 2 * gap; }   // at a wall they line up on the open side
    note(v, 'crowd', 'closing_ranks', { with: who.map(s => P(s).id).join('+') }); social.take('closing_ranks', v, hold + 6);
    B[v].queue.push({ id: 'closing_ranks.his_back', beats: CR.his_beats.concat([{ hold: 1, t: hold + 1.2 }]), cues: ['crowd.closing_ranks'], keepYaw: false });
    who.forEach((s, i) => { S.hold.add(s); after(draw(CR.start_after_s) + i * draw(CR.stagger_s), () => { if (!P(s) || !up(s) || !P(v)) { S.hold.delete(s); return; } cut(P(s), 'closing_ranks');
      play(P(s), 'crowd', 'closing_ranks.joins', CR.join_beats.concat([{ hold: 1, t: hold - i * 0.4 }]).concat(i ? [{ hold: 1, t: draw(CR.peel_gap_s) }] : []), { info: { other: v, placeX: xs[i] }, onEnd: () => { S.hold.delete(s); if (!who.some(x => S.hold.has(x))) social.release(); } }); }); });
    return true; };
  social.argue = (a, b, rung) => { if (S.arg || !P(a) || !P(b) || !up(a) || !up(b)) return false; startArg(a, b, rung, 'staged'); return true; };
  social.onShoved = e => { const s = e.slot; if (S.arg && body.mode[s] !== MODE.ground) S.arg.touch = T(); };
  social.onBump = e => { if (S.arg && S.arg.rung >= 4 && e.other != null && e.other !== S.arg.a && e.other !== S.arg.b && !S.arg.chain) { S.arg.chain = true; counts.shove_chain++; note(e.slot, 'crowd', 'shove_chain', { into: P(e.other) ? P(e.other).id : '?' }); } };

  // ---------- once a second: who is too close, a pile-up, the next line, the next argument ----------
  function space(t) { const sl = slots().filter(up).sort((a, b) => body.x[a] - body.x[b]);
    if (ON.pile_up && !S.pile && !S.arg && t - S.pileT > 20) { for (let i = 0; i + 2 < sl.length; i++) { const g = [sl[i]]; for (let j = i + 1; j < sl.length && dist(sl[j], g[g.length - 1]) < (C.bits.pile_up.within_body_widths || 1) * W; j++) g.push(sl[j]);
        if (g.length >= 3 && g.every(s => !perf.busy(P(s)) || (perf.unit(P(s)).kind === 'idle')) && t - Math.max(...g.map(s => B[s].landT || -99)) < 6) { pileUp(g, t); return; } } }
    for (let i = 0; i + 1 < sl.length; i++) { const a = sl[i], b = sl[i + 1]; if (dist(a, b) > (C.space.overlap_body_widths || 0.92) * W || S.hold.has(a) || S.hold.has(b)) continue;
      for (const s of [a, b]) minds[s].push(AR.who_starts.crowded_push_per_s, t);
      let y = !awake(a) ? b : !awake(b) ? a : dialOf(a).instigate === -1 ? a : dialOf(b).instigate === -1 ? b : (minds[a].w.fed_up || 0) <= (minds[b].w.fed_up || 0) ? a : b; const o = y === a ? b : a;
      if (!free(y) || t - (S.yieldT[y] || -99) < 20 || (perf.unit(P(y)) && perf.unit(P(y)).kind !== 'idle')) continue; S.yieldT[y] = t; counts.space_yields++; cut(P(y), 'space'); play(P(y), 'crowd', 'space_yield', C.space.yield_beats, { info: { other: o } }); return; } }
  function pileUp(g, t) { S.pile = g; S.pileT = t; counts.pile_ups++; social.take('pile_up', g[1], 10); const mid = g[Math.floor(g.length / 2)], order = g.filter(s => s !== mid).concat([mid]); let d = 0;
    for (const s of order) { if (!awake(s)) { note(s, 'crowd', 'pile_up.sleeps_under_it'); continue; } S.hold.add(s); cut(P(s), 'pile_up'); const wait = d; d += draw(C.bits.pile_up.peel_gap_s);
      const beats = C.bits.pile_up.beats.slice(); beats.splice(3, 0, { hold: 1, t: wait }); play(P(s), 'crowd', 'pile_up', beats, { info: { other: s === mid ? g[0] : mid }, note: { of: g.length, peels: order.indexOf(s) + 1 }, onEnd: () => { S.hold.delete(s); if (S.pile === g && !g.some(x => S.hold.has(x))) { S.pile = null; social.release(); } } }); }
    audience(mid, 'pile_up', g); }
  function owedBurst(t) { const o = S.owed; if (!o) return; if (t > o.exp || !P(o.from) || !P(o.to)) { S.owed = null; return; } if (t < o.due || S.arg || S.pile || !free(o.from) || !up(o.to) || !awake(o.to) || !social.stageFree()) return; const u = perf.unit(P(o.from)); if (u && u.kind !== 'idle') return;
    S.owed = null; counts.owed_bursts++; cut(P(o.from), 'owed'); S.hold.add(o.from); play(P(o.from), 'crowd', 'owed_burst', AR.owed_burst.beats, { info: { other: o.to }, note: { to: P(o.to).id }, onEnd: () => S.hold.delete(o.from) }); }

  // ---------- CLUMPS: two, two and one, each at his own angle, and the odd one out changes ----------
  function clumps(t) { if (!ON.clumps || S.arg || S.pile || t < (S.clumpT || 0) || !social.stageFree()) return; const sl = slots().filter(s => up(s) && !S.hold.has(s)); if (sl.length < 3) return;
    const order = sl.slice().sort((a, b) => body.x[a] - body.x[b]), n = order.length, bw = W, L = ctx.room.left + 0.9 * bw, Rr = ctx.room.right - 0.9 * bw;
    // who is the odd one: never the one it was last time; of the rest, the most fed up or the lowest on power walks off (the sleeper never: he stays where he fell asleep)
    const cand = order.filter(s => s !== S.lastOdd && awake(s)); if (!cand.length) return; let odd = cand[0], best = -1e9; for (const s of cand) { const w = minds[s].w || {}, sc = (w.fed_up || 0) + (w.low_power || 0) + 0.3 * rnd(); if (sc > best) { best = sc; odd = s; } }
    S.lastOdd = odd; counts.clump_deals++; S.clumpT = t + draw(CLP.odd_one_changes_every_s || [60, 180]);
    const rest = order.filter(s => s !== odd), pairs = []; for (let i = 0; i + 1 < rest.length; i += 2) pairs.push([rest[i], rest[i + 1]]); const lone = rest.length % 2 ? rest[rest.length - 1] : null;
    // slots along the floor: the groups in a drawn order (so the odd one is not always at one end), spread over the room with a drawn offset
    const groups = pairs.map(p => ({ who: p })).concat([{ who: [odd] }]).concat(lone != null ? [{ who: [lone] }] : []); const oi = Math.floor(rnd() * groups.length), og = groups.splice(pairs.length, 1)[0]; groups.splice(oi, 0, og);
    const gap = draw(CLP.pair_gap_body_widths || [1.12, 1.25]) * bw, width = Rr - L, cell = width / groups.length, FACE = CLP.facing || { left: 0.5, right: -0.3, odd: 0.7 }; let d = 0; const want = [];
    groups.forEach((g, gi) => { const cx = L + cell * (gi + 0.5) + (rnd() - 0.5) * Math.max(0, cell - gap - bw) * 0.7;
      if (g.who.length === 2) { want.push({ s: g.who[0], x: cx - gap / 2, yaw: FACE.left, other: g.who[1] }); want.push({ s: g.who[1], x: cx + gap / 2, yaw: FACE.right, other: g.who[0] }); }
      else { const s = g.who[0], nb = groups[gi + (gi === 0 ? 1 : -1)]; const side = gi === 0 ? 1 : -1; want.push({ s, x: cx, yaw: side * FACE.odd, other: nb ? nb.who[0] : null }); } });
    S.clump = want.map(q => ({ slot: q.s, x: +q.x.toFixed(2), yaw: q.yaw })); note(odd, 'crowd', 'odd_one_out', { groups: groups.map(g => g.who.map(s => P(s).id).join('+')).join(' | ') });
    for (const q of want.sort((a, b) => (a.s === odd ? -1 : b.s === odd ? 1 : 0))) { const s = q.s; perf.setStance(P(s), awake(s) ? q.yaw : 0); if (!awake(s)) continue; const far = Math.abs(body.x[s] - q.x) > 0.25 * bw, turned = Math.abs(perf.stance(P(s)) - (q.was == null ? 99 : q.was)) > 0.1; if (!far && !turned) continue;
      d += draw(CLP.stagger_s || [0.3, 1.2]); after(d, () => { if (!P(s) || !free(s) || S.arg || S.pile) return; const u = perf.unit(P(s)); if (u && u.kind !== 'idle') return; cut(P(s), 'clump');
        play(P(s), 'crowd', s === odd ? 'clump.walks_off' : 'clump.finds_his_spot', (far ? (s === odd ? CLP.odd_beats : CLP.move_beats) : []).concat(CLP.face_beats), { info: { placeX: q.x, other: q.other }, keepYaw: true }); }); } }

  social.step = k => { if (k % 60 !== 30 || ctx.potatoes.length < 2) { if (ctx.potatoes.length < 2 && S.stage && T() > S.stageUntil) social.release(); return; } const t = T();
    if (S.t0 == null) { S.t0 = S.lastShoveT = t; if (HEAT) { S.shoveDue = draw(HEAT.shove_due_s); S.throwDue = draw(HEAT.throw_once_after_s || [1e9, 1e9]); } S.clumpT = t + draw(CLP.first_deal_s || [6, 10]); }
    if (S.stage && t > S.stageUntil && !S.arg) social.release();
    if (S.arg && S.arg.rung <= 1 && t - S.arg.t0 < 30) { const ua = P(S.arg.a) && perf.unit(P(S.arg.a)); if (ua && ua.id === 'arg_approach') S.arg.touch = t; }   // a long walk over is not a stall
    if (S.arg && t - S.arg.touch > 16) { note(S.arg.a, 'crowd', 'arg_stalled'); endArg('end_back_down', true, true); for (const s of slots()) if (!S.pile) S.hold.delete(s); }
    for (const s of slots()) if (B[s] && body.mode[s] !== MODE.ground) B[s].landT = t;
    space(t); if (S.pile || !ON.arguments && !ON.thinking_one) return;
    owedBurst(t); trySay(t); clumps(t);
    for (const key in S.againT) if (t >= S.againT[key]) { const a = Math.floor(key / 8), b = key % 8; S.againT[key] = t + draw(C.notice.again_every_s || [25, 60]); if (P(a) && P(b) && free(a) && free(b) && dist(a, b) < C.notice.radius_body_widths * W) { if (rnd() < 0.5) noticeRung(a, b, 0.05); else noticeRung(b, a, 0.05); } }
    if (!ON.arguments || S.arg) return; if (S.nextArgT == null) S.nextArgT = t + draw((HEAT && HEAT.first_gap_s) || AR.who_starts.first_gap_s || [20, 40]); if (t < S.nextArgT || !social.stageFree()) return;
    const a = pickInstigator(-1, due(), due()); if (a == null) return; const b = pickFoe(a); if (b == null) return; startArg(a, b, 1, 'score ' + score(a).toFixed(2)); };
  return social;
}
