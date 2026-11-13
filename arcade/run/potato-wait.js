// The UI crew's wait piece (Standing Room, the crew's own notes section L), unchanged but for the last line of open(). Used by main.mjs on ?play links.
/* POTATO WAIT (Standing Room, Nov 2026). One piece: its HTML, CSS and script are all in here, and it downloads nothing.
   A place in his world for a wait: the 404 with a floor, and a door.
     kind 'game'  : he stands at a dark door, the game's name over it. Light on = the game ANSWERED. Door open = it LANDED.
     kind 'app'   : the door is lit and he is what arrives through it.
     kind 'house' : as 'game', with no clock of its own.
   PotatoWait.open(opts) -> { answered(), ready(), fail(), close() }     PotatoWait.start(opts) / .done() / .fail(): the same, for the app.
   opts: into (element to fill; none = whole screen), name, still (address of the approved bare still the page ALREADY has),
         prop (our own inline svg for the floor at his feet), note (the tape sentence), top (px kept clear for the house tape),
         retry (fn: shows the again key), onFail (fn), backKey (the host's back key, to nudge), onBack (fn: draws its own back key), say (words).
   Nothing here counts, fills or spins. The words are stand-ins until Chikin says yes. */
(function () {
  if (window.PotatoWait) return;
  var HIS = '"Major Mono Display",ui-monospace,Menlo,monospace';
  var F = { place: 7, lit: 19, min: 30, act: 36, knock: 48, slow: 72, dead: 180, long: 480 };   // frames, 12 a second
  var SAY = {
    game:  { coming: ' is on its way', long: 'still not here. your call.', dead: 'not found. for real this time.', srDead: "it didn't arrive" },
    app:   { coming: ' is on his way', slow: 'moving in. i packed light.', done: 'ok. i live here now.', dead: "didn't fit. try me again.", srDead: "he didn't arrive" },
    house: { coming: ' is opening', dead: "the kitchen didn't show.", srDead: "it didn't open" }
  };
  var THINK = ['krrzzt', 'hm', 'wh@t?!'];
  var BITS = 'potato '.split('').map(function (c) { return ('0000000' + c.charCodeAt(0).toString(2)).slice(-8); }).join('');
  var BEATS = {   // one row = one frame: [his x, his y, wide, tall, door x, zap]. Stand, hop, shake, zap. Nothing else.
    enter:  [[0, 0, 1, 1, 0, 1], [], [0, 0, 1, 1, 0, 1], []],
    hop:    [[0, 0, 1.08, .9], [0, -12, .96, 1.05], [0, -12, .96, 1.05], [0, 0, 1.08, .9]],
    shake:  [[-4], [4], [-4], [4]],
    knock:  [[-6], [-6], [12], [12, 0, 1, 1, 4], [4, 0, 1, 1, -4], [0, 0, 1, 1, 3]],   // back, bump with his body, the door rattles, settle
    seen:   [[0, 0, 1.08, .9], [0, -10, .96, 1.05], [0, 0, 1.06, .92]],                 // the light came on
    rattle: [[0, 0, 1, 1, 4], [0, 0, 1, 1, -4], [0, 0, 1, 1, 3]],
    go:     [[0, 0, 1.08, .9], [0, 0, 1, 1, 0, 1], [0, 0, 1, 1, 0, 1]]
  };
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 8 12l7 6" fill="none" stroke="currentColor" stroke-width="4"/></svg>';
  var LOOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.5-5.4M17 2v5h-5" fill="none" stroke="currentColor" stroke-width="3.5"/></svg>';
  var ZAP = 'clip-path:polygon(0 0,100% 0,100% 30%,90% 30%,90% 46%,100% 46%,100% 100%,0 100%,0 70%,12% 70%,12% 55%,0 55%);filter:drop-shadow(-4px 0 #7b3cf2) drop-shadow(4px 0 #e03ccf)';
  var CSS = [
    '.pw{position:absolute;inset:0;z-index:4;overflow:hidden;background:#030604;color:#e8f5ec;--f:78%;--top:0px;-webkit-user-select:none;user-select:none}',
    '.pw-fix{position:fixed;z-index:2147483000}.pw [hidden]{display:none!important}',
    '.pw-wall{position:absolute;left:0;right:0;top:0;height:var(--f);background:#12062e}',
    '.pw-404{position:absolute;inset:0;display:grid;place-items:center;visibility:hidden;font:400 min(44vw,38vh)/1 ' + HIS + ';color:#2a0f63}',
    '.pw-floor{position:absolute;left:0;right:0;top:var(--f);bottom:0;background:#0c1f14;border-top:5px solid #120a05;box-shadow:inset 0 6px 0 #2c5a42}',
    '.pw-wall,.pw-floor,.pw-set{visibility:hidden}.pw-in .pw-wall,.pw-in .pw-floor,.pw-in .pw-set{visibility:visible}.pw-404on .pw-404{visibility:visible}',
    '.pw-set{position:absolute;left:50%;bottom:calc(100% - var(--f));width:min(300px,calc(100% - 32px));transform:translateX(-50%);display:flex;align-items:flex-end;justify-content:space-between}',
    '.pw-app .pw-set{justify-content:center}.pw-app .pw-him{display:none}',
    '.pw-sign{position:absolute;right:0;bottom:calc(100% + 20px);max-width:100%;margin:0;padding:7px 12px;background:#0c1f14;color:#ffd9a0;border:3px solid #120a05;border-radius:9px 13px 8px 12px;box-shadow:0 0 0 2px #12301f,3px 4px 0 #120a05;transform:rotate(-1.5deg);font:400 clamp(17px,4.8vw,22px)/1.2 ' + HIS + ';text-align:center}',
    '.pw-app .pw-sign{right:50%;transform:translateX(50%) rotate(-1.5deg)}',
    '.pw-him{position:relative;flex:none;width:min(26vw,124px,24vh);margin-bottom:-10px}',
    '.pw-him::before{content:"";position:absolute;left:8%;right:8%;bottom:-6px;height:14px;border-radius:50%;background:#120a05}',
    '.pw-him img{position:relative;display:block;width:100%;height:auto;transform-origin:50% 100%}',
    '.pw-gone{visibility:hidden!important}.pw-zapon img,.pw-zap{' + ZAP + '}',
    '.pw-prop{position:absolute;left:92%;bottom:-8px;width:46px;display:block}.pw-prop svg{display:block;width:100%;height:auto;overflow:visible}',
    '.pw-think{position:absolute;left:0;bottom:calc(min(26vw,124px,24vh) + 14px);visibility:hidden;white-space:nowrap;font:400 14px/1 ' + HIS + ';color:#c9a7ff;text-shadow:1px 0 #e03ccf,-1px 0 #2a0f63}',
    '.pw-dw{position:relative;flex:none;width:min(34vw,150px,32vh);height:min(42vw,188px,40vh)}',
    '.pw-door{position:absolute;inset:0;overflow:hidden;background:#120a05;border:5px solid #120a05;border-bottom-width:0;border-radius:42% 42% 4px 4px/30% 30% 4px 4px;box-shadow:0 0 0 6px #2c5a42,0 0 0 9px #120a05}',
    '.pw-bits{position:absolute;left:0;top:0;width:100%;height:100%}',
    '.pw-peek{position:absolute;left:8%;top:100%;width:84%;height:auto;visibility:hidden}',
    '.pw-gap{position:absolute;display:block;left:0;right:0;bottom:0;height:7px;background:#120a05}',
    '.pw-spill{position:absolute;display:block;left:-14%;right:-14%;top:calc(100% + 9px);height:26px;background:#5c3a18;clip-path:polygon(14% 0,86% 0,100% 100%,0 100%);visibility:hidden}',
    '.pw-lit .pw-gap{background:#ffd9a0}.pw-in.pw-lit .pw-spill{visibility:visible}',
    '.pw-open .pw-door{background:#ffd9a0}.pw-open .pw-bits{visibility:hidden}',
    '.pw-say{position:absolute;left:16px;right:16px;top:calc(var(--f) + 18px);margin:0;text-align:center;font:400 clamp(16px,4.4vw,19px)/1.25 ' + HIS + ';color:#ffd9a0}',
    '.pw-sr{position:absolute;width:1px;height:1px;margin:0;overflow:hidden;clip-path:inset(50%)}',
    '.pw-keys{position:absolute;left:16px;right:16px;bottom:max(30px,calc(env(safe-area-inset-bottom) + 18px));display:flex;justify-content:center}',
    '.pw-again{display:flex;align-items:center;justify-content:center;gap:10px;min-width:168px;min-height:56px;padding:0 16px;background:#0c1f14;color:#e8f5ec;border:3px solid #120a05;border-radius:9px 12px 8px 11px;box-shadow:0 0 0 2px #12301f,0 6px 0 #05100a;transform:rotate(-1deg);font:400 18px/1 ' + HIS + ';cursor:pointer}',
    '.pw-again svg{width:26px;height:26px}.pw-again:active{transform:translateY(4px);background:#2bff88;color:#120a05;box-shadow:0 0 0 2px #12301f,0 2px 0 #05100a}',
    '.pw-note{position:absolute;left:max(16px,env(safe-area-inset-left));top:calc(var(--top) + 76px);max-width:calc(100% - 32px);margin:0;padding:5px 9px;background:#f2c14e;color:#120a05;border:3px solid #120a05;transform:rotate(-1deg);font:700 14px/1.25 Inter,system-ui,sans-serif}',
    '.pw-back{position:absolute;right:max(16px,env(safe-area-inset-right));top:calc(var(--top) + 8px);width:56px;height:56px;display:grid;place-items:center;padding:0;background:#0c1f14;color:#ffd9a0;border:3px solid #120a05;border-radius:9px 12px 8px 11px;box-shadow:0 0 0 2px #12301f,0 5px 0 #05100a;cursor:pointer}',
    '.pw-back svg{width:24px;height:24px}.pw button:focus-visible{outline:3px solid #2bff88;outline-offset:3px}',
    '.pw-nudge{animation:pw-nudge .7s steps(3) 2}@keyframes pw-nudge{40%{translate:0 -7px}}',
    '@media(max-width:899px){.pw{--f:84%}}',
    '@media(max-height:520px){.pw{--f:72%}.pw-say{right:210px;text-align:left}.pw-keys{justify-content:flex-end;bottom:24px}.pw-note{max-width:230px}}',
    '@media(prefers-reduced-motion:reduce){.pw-nudge{animation:none}}'
  ].join('');

  // THE STAGE CURTAIN (Chikin, Nov 13 2026, about the door-and-knock screen: "i do not like this at all" / "can it be a curtain of 404 that pulls back?" /
  // "the whole screen, like hes on stage" / "and he walks through the curtains, like they dont open, he walks through like hes going on stage").
  // The whole screen is a curtain made of 404. It does not open. When the level is ready the footlights come up; on the tap or the key he walks to the
  // seam and goes THROUGH it, the cloth closes behind him, and we are on stage (the level). Same calls as the door: answered(), ready(), line(), close().
  var SCSS = [
    '.pws{position:fixed;inset:0;z-index:2147483000;overflow:hidden;background:#07020f;-webkit-user-select:none;user-select:none;--fl:15%;transition:opacity .28s linear}',
    '.pws-half{position:absolute;top:0;bottom:var(--fl);width:50.4%;overflow:hidden;background:#1a0a40;z-index:3;transition:transform .34s cubic-bezier(.3,.7,.3,1)}',
    '.pws-l{left:0;transform-origin:0 0}.pws-r{right:0;transform-origin:100% 0}',
    '.pws-t{position:absolute;inset:-6% -30%;font:400 clamp(34px,9.5vw,96px)/1.18 ' + HIS + ';color:#34168a;letter-spacing:.06em;word-spacing:.5em;white-space:pre-wrap;word-break:break-all;text-align:center;transform:rotate(-2deg)}',
    '.pws-half::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(3,1,10,.55) 0,rgba(3,1,10,0) 26px,rgba(201,167,255,.07) 48px,rgba(3,1,10,0) 70px,rgba(3,1,10,.55) 96px)}',
    '.pws-l::before,.pws-r::before{content:"";position:absolute;top:0;bottom:0;width:26px;z-index:1;background:linear-gradient(90deg,rgba(3,1,10,0),rgba(3,1,10,.8))}.pws-l::before{right:0}.pws-r::before{left:0;transform:scaleX(-1)}',
    '.pws-top{position:absolute;left:0;right:0;top:0;height:clamp(34px,7vh,64px);z-index:5;background:#12062e;border-bottom:5px solid #120a05;box-shadow:0 8px 0 #2a0f63, 0 13px 0 #120a05}',
    '.pws-name{position:absolute;left:0;right:0;top:calc(clamp(34px,7vh,64px) + 30px);z-index:6;margin:0;text-align:center;font:400 clamp(20px,6vw,40px)/1.1 ' + HIS + ';color:#ffd9a0;text-shadow:3px 0 #7b3cf2,-3px 0 #e03ccf,0 0 14px #07020f,0 0 26px #07020f;text-transform:lowercase}',
    '.pws-floor{position:absolute;left:0;right:0;bottom:0;height:var(--fl);z-index:4;background:repeating-linear-gradient(90deg,#3a2413 0,#3a2413 118px,#24160b 118px,#24160b 122px);border-top:6px solid #120a05;box-shadow:inset 0 7px 0 #5c3a18}',
    '.pws-lights{position:absolute;left:0;right:0;bottom:calc(var(--fl) - 4px);height:34%;z-index:4;pointer-events:none;opacity:0;transition:opacity .5s linear;background:radial-gradient(60% 100% at 50% 100%,rgba(255,217,160,.42),rgba(255,217,160,0) 70%)}',
    '.pws-lit .pws-lights{opacity:1}',
    '.pws-him{position:absolute;left:24%;bottom:calc(var(--fl) - 12px);width:min(24vw,132px,24vh);z-index:6;transform:translateX(-50%);transition:left .78s cubic-bezier(.4,.1,.5,1)}',
    '.pws-him img{display:block;width:100%;height:auto;transform-origin:50% 100%}',
    '.pws-him::before{content:"";position:absolute;left:10%;right:10%;bottom:-5px;height:13px;border-radius:50%;background:#120a05;opacity:.8}',
    '.pws-walk{left:50%}.pws-walk img{animation:pws-wad .26s steps(2) infinite}@keyframes pws-wad{50%{transform:rotate(-5deg) translateY(-5px)}}',
    '.pws-thru .pws-him{z-index:2;transition:left .78s cubic-bezier(.4,.1,.5,1),transform .34s linear,opacity .3s linear .12s;transform:translateX(-50%) scale(.8);opacity:0}',
    '.pws-thru .pws-l{transform:skewX(2.4deg) translateX(-9px)}.pws-thru .pws-r{transform:skewX(-2.4deg) translateX(9px)}',
    '.pws-seam{position:absolute;left:50%;top:0;bottom:var(--fl);width:22px;margin-left:-11px;z-index:1;background:#ffd9a0;box-shadow:0 0 40px 16px rgba(255,217,160,.5)}',
    '.pws-say{position:absolute;left:16px;right:16px;bottom:calc(var(--fl) / 2 - .6em);z-index:7;margin:0;text-align:center;font:400 clamp(16px,4.4vw,20px)/1.2 ' + HIS + ';color:#ffd9a0;text-shadow:0 0 8px #120a05,0 0 16px #120a05}',
    '.pws-out{opacity:0}.pws-sr{position:absolute;width:1px;height:1px;margin:0;overflow:hidden;clip-path:inset(50%)}',
    '@media(max-height:520px){.pws{--fl:20%}}',
    '@media(prefers-reduced-motion:reduce){.pws-walk img{animation:none}.pws-half,.pws-him{transition:none}}'
  ].join('');
  function openStage(o) {
    if (!document.getElementById('pws-css')) { var st = document.createElement('style'); st.id = 'pws-css'; st.textContent = SCSS; document.head.appendChild(st); }
    var calm = matchMedia('(prefers-reduced-motion: reduce)').matches, r = document.createElement('div'), rows = '';
    for (var i = 0; i < 26; i++) rows += (i % 2 ? '04 404 404 404 404 404 404 4' : '404 404 404 404 404 404 404') + '\n';
    r.className = 'pws';
    r.innerHTML = '<i class="pws-seam" aria-hidden="true"></i>' +
      '<div class="pws-half pws-l" aria-hidden="true"><div class="pws-t">' + rows + '</div></div><div class="pws-half pws-r" aria-hidden="true"><div class="pws-t">' + rows + '</div></div>' +
      '<div class="pws-top" aria-hidden="true"></div><p class="pws-name"></p><div class="pws-lights" aria-hidden="true"></div><div class="pws-floor" aria-hidden="true"></div>' +
      '<div class="pws-him"><img alt=""></div><p class="pws-say"></p><p class="pws-sr" role="status"></p>';
    var $ = function (q) { return r.querySelector(q); }, him = $('.pws-him'), img = $('.pws-him img'), line = $('.pws-say'), sr = $('.pws-sr');
    $('.pws-name').textContent = o.name || ''; sr.textContent = (o.name || '') + ' is loading.';
    him.style.visibility = 'hidden'; img.onload = function () { him.style.visibility = ''; }; if (o.still) img.src = o.still;
    var state = 'wait', doneRes = [];
    function stop() { if (state === 'gone') return; state = 'gone'; if (r.parentNode) r.parentNode.removeChild(r); doneRes.splice(0).forEach(function (f) { f(); }); }
    function answered() { r.classList.add('pws-lit'); sr.textContent = (o.name || '') + ' is ready.'; return new Promise(function (res) { setTimeout(res, calm ? 0 : 420); }); }   // the footlights come up
    function ready() { return new Promise(function (res) { if (state === 'gone') { res(); return; } doneRes.push(res); if (state !== 'wait') return; state = 'go'; line.textContent = '';
      if (calm) { stop(); return; }
      him.classList.add('pws-walk');                                              // he walks to the seam
      setTimeout(function () { r.classList.add('pws-thru'); }, 760);              // and through it: the cloth gives a little and closes behind him
      setTimeout(function () { r.classList.remove('pws-thru'); }, 1180);
      setTimeout(function () { r.classList.add('pws-out'); }, 1420);              // we follow him onto the stage
      setTimeout(stop, 1720); }); }
    function close() { if (state !== 'gone') { state = 'gone'; if (r.parentNode) r.parentNode.removeChild(r); } }
    (o.into || document.body).appendChild(r);
    return { answered: answered, ready: ready, landed: ready, fail: function () { line.textContent = 'krrzzt. it did not load.'; }, close: close, line: function (t) { line.textContent = t || ''; }, door: r };
  }
  function open(o) {
    o = o || {};
    if (o.stage) return openStage(o);
    var kind = SAY[o.kind] ? o.kind : 'game', say = {}, k;
    for (k in SAY[kind]) say[k] = SAY[kind][k];
    for (k in (o.say || {})) say[k] = o.say[k];
    if (!document.getElementById('pw-css')) { var st = document.createElement('style'); st.id = 'pw-css'; st.textContent = CSS; document.head.appendChild(st); }
    var calm = matchMedia('(prefers-reduced-motion: reduce)').matches, pour = kind === 'game' && !calm;
    var r = document.createElement('div'); r.className = 'pw pw-' + kind + (o.into ? '' : ' pw-fix'); r.style.setProperty('--top', (o.top || 0) + 'px');
    r.innerHTML = '<div class="pw-wall"><div class="pw-404" aria-hidden="true">404</div></div><div class="pw-floor"></div>' +
      '<div class="pw-set"><p class="pw-sign"></p><span class="pw-think" aria-hidden="true"></span>' +
      '<div class="pw-him"><img alt=""><i class="pw-prop" aria-hidden="true"></i></div>' +
      '<div class="pw-dw"><div class="pw-door"><img class="pw-peek" alt=""><i class="pw-gap"></i></div><i class="pw-spill"></i></div></div>' +
      '<canvas class="pw-bits" aria-hidden="true"></canvas>' +
      '<p class="pw-say"></p><p class="pw-sr" role="status"></p>' +
      '<div class="pw-keys"><button type="button" class="pw-again" hidden>' + LOOP + '<span>again</span></button></div>' +
      '<p class="pw-note"></p><button type="button" class="pw-back" aria-label="back">' + CHEV + '</button>';
    var $ = function (s) { return r.querySelector(s); };
    var cv = $('.pw-bits'), x = cv.getContext('2d'), door = $('.pw-door'), dw = $('.pw-dw'), him = $('.pw-him'), img = $('.pw-him img'), peek = $('.pw-peek'),
        think = $('.pw-think'), line = $('.pw-say'), sr = $('.pw-sr'), again = $('.pw-again'), back = $('.pw-back'), note = $('.pw-note');
    $('.pw-sign').textContent = o.name || ''; sr.textContent = (o.name || '') + say.coming;
    note.textContent = o.note || ''; note.hidden = !o.note; back.hidden = !o.onBack;
    if (o.prop && kind !== 'app') $('.pw-prop').innerHTML = o.prop;
    var n = 0, state = 'wait', placed = false, at404 = 0, lit = false, litAt = 0, wantLit = false, wantOpen = false, q = [], th = 0, nextAct = F.act,
        litRes = [], doneRes = [], hasHim = false, who = kind === 'app' ? peek : img, W, H, cols, drops, timer = 0;
    him.classList.add('pw-gone');
    who.onload = function () { hasHim = true; him.classList.remove('pw-gone'); };
    if (o.still) who.src = o.still;

    function size() { var d = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth || 1; H = cv.clientHeight || 1; cv.width = W * d; cv.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
      cols = Math.ceil(W / 16); drops = []; for (var i = 0; i < cols; i++) drops.push(-Math.random() * 12);
      if (calm && placed) { x.font = '400 14px ' + HIS; x.fillStyle = 'rgba(77,255,154,.3)';   // less motion: one still field of bits
        for (var c = 0; c < cols; c++) for (var j = 1; j * 16 < H; j++) if ((c * 5 + j * 3) % 3 === 0) x.fillText(BITS[(c * 7 + j) % BITS.length], c * 16 + 2, j * 16); } }
    function rain(p) { x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
      x.font = '400 14px ' + HIS; x.fillStyle = p ? '#4dff9a' : 'rgba(77,255,154,.4)';
      for (var i = 0; i < cols; i++) { if (p && Math.abs(i - cols / 2) / (cols / 2) > n / F.place * 1.3) continue;   // the pour spreads from the middle (the TV), as tonight
        for (var k2 = p ? 8 : 1; k2--;) { var y = drops[i] * 16; x.fillText(BITS[(i * 3 + (drops[i] | 0) + 800) % BITS.length], i * 16 + 2, y);
          drops[i] = y > H && Math.random() > .8 ? -Math.random() * 6 : drops[i] + 1; } } }
    function pose(p) { p = p || []; if (kind !== 'app') img.style.transform = 'translate(' + (p[0] || 0) + 'px,' + (p[1] || 0) + 'px) scale(' + (p[2] || 1) + ',' + (p[3] || 1) + ')';
      dw.style.transform = 'translateX(' + (p[4] || 0) + 'px)'; him.classList.toggle('pw-zapon', !!p[5]); }
    function play(list, after) { q = list.slice(); q.push(function () { pose(); if (after) after(); }); }
    function act(name, after) { if (calm) { if (after) after(); return; } play(BEATS[name].map(function (p) { return function () { pose(p); }; }), after); }
    function thought(t) { think.textContent = t; th = 14; }
    function nudge() { var b = o.backKey || (o.onBack ? back : null); if (!b || calm) return; b.classList.remove('pw-nudge'); void b.offsetWidth; b.classList.add('pw-nudge'); }
    function place() { placed = true; at404 = n + 3; door.insertBefore(cv, door.firstChild); size(); r.classList.add('pw-in');   // the bits live inside the door from here on
      if (kind === 'app') { lit = true; litAt = n; r.classList.add('pw-lit'); } else if (hasHim) act('enter'); }
    function light() { lit = true; litAt = n; r.classList.add('pw-lit'); if (hasHim && kind !== 'app') act('seen'); litRes.splice(0).forEach(function (f) { f(); }); }
    function go() { state = 'open'; line.textContent = ''; again.hidden = true; r.classList.add('pw-open');
      if (kind === 'app') return arrive();
      if (calm || !hasHim) return play([function () {}, function () {}], gone);
      act('go', gone); }
    function arrive() { var list = []; line.textContent = say.done || '';
      if (hasHim) { peek.style.visibility = 'visible'; (calm ? [26] : [70, 48, 26]).forEach(function (t) { list.push(function () { peek.style.top = t + '%'; }); });
        if (!calm) list.push(function () { peek.classList.add('pw-zap'); }, function () { peek.classList.remove('pw-zap'); }); }
      for (var i = 0; i < 12; i++) list.push(function () {});   // about a second: long enough to read his line
      play(list, gone); }
    function tick() {
      if (!r.isConnected || !r.getClientRects().length) return close();   // the host took our place away: go quietly
      n++;
      if (!placed && n >= (pour ? F.place : 1)) place();
      if (!calm && state !== 'dead') rain(!placed);
      if (!placed) return;
      if (n === at404) r.classList.add('pw-404on');   // he and the door paint before the wall's 404 does
      if (q.length) q.shift()();
      if (th > 0) { th--; think.style.visibility = th ? 'visible' : 'hidden'; if (!calm) think.style.transform = 'translateY(' + (th - 14) * 3 + 'px)'; }
      if (state !== 'wait') return;
      if (wantLit && !lit && n >= F.lit) light();
      if (wantOpen && lit && n >= F.min && n >= litAt + 4) return go();
      if (kind === 'game' && !lit && n >= F.dead) return fail();
      if (n === F.slow && say.slow) thought(say.slow);
      if (n === F.long && say.long) { line.textContent = say.long; again.hidden = !o.retry; nudge(); }
      if (!q.length && !calm && n >= nextAct) { nextAct = n + 30 + (Math.random() * 16 | 0);
        if (kind === 'app') act('rattle'); else if (hasHim) act(!lit && n >= F.knock ? 'knock' : Math.random() < .5 ? 'hop' : 'shake');
        if (n > F.slow + 20 && Math.random() < .4) thought(THINK[Math.random() * THINK.length | 0]); }
    }
    function revive() { state = 'wait'; n = 0; nextAct = F.act; wantLit = wantOpen = false; lit = kind === 'app'; litAt = 0; q = []; pose();
      r.classList.remove('pw-dead'); r.classList.toggle('pw-lit', lit); line.textContent = ''; again.hidden = true; sr.textContent = (o.name || '') + say.coming; }
    function answered() { wantLit = true; return new Promise(function (res) { if (lit) res(); else litRes.push(res); }); }      // resolves once the light is on screen
    function ready() { if (state === 'dead') revive(); wantLit = wantOpen = true; return new Promise(function (res) { if (state === 'gone') res(); else doneRes.push(res); }); }   // resolves once the piece has gone
    function fail() { if (state !== 'wait') return; state = 'dead'; q = []; pose(); r.classList.remove('pw-lit'); r.classList.add('pw-dead');
      line.textContent = say.dead; sr.textContent = say.srDead; again.hidden = !o.retry; nudge(); if (o.retry) again.focus(); if (o.onFail) o.onFail(); }
    function stop() { state = 'gone'; clearInterval(timer); removeEventListener('resize', size); removeEventListener('keydown', esc); if (r.parentNode) r.parentNode.removeChild(r); }
    function gone() { if (state === 'gone') return; stop(); doneRes.splice(0).forEach(function (f) { f(); }); }
    function close() { if (state !== 'gone') stop(); }
    function leave() { close(); if (o.onBack) o.onBack(); }
    function esc(e) { if (e.key === 'Escape') leave(); }
    again.onclick = function () { revive(); if (o.retry) o.retry(); };
    back.onclick = leave;
    dw.onclick = function () { if (state === 'wait' && placed && !q.length) act(kind === 'app' || !hasHim ? 'rattle' : 'knock'); };   // tap the door: it answers
    (o.into || document.body).appendChild(r);
    size(); addEventListener('resize', size); if (o.onBack) { addEventListener('keydown', esc); back.focus(); }
    timer = setInterval(tick, 83);
    return { answered: answered, ready: ready, landed: ready, fail: fail, close: close, line: function (t) { line.textContent = t || ''; }, door: dw };   // (line + door: added for the game page, Nov 12)
  }
  var cur = null;
  window.PotatoWait = { open: open,
    start: function (p) { var o = {}, k; for (k in (p || {})) o[k] = p[k]; if (!o.kind) o.kind = 'app'; if (!o.name) o.name = 'pOtAtO'; if (cur) cur.close(); cur = open(o); return cur; },
    done: function () { var c = cur; cur = null; return c ? c.ready() : Promise.resolve(); },
    fail: function () { if (cur) cur.fail(); } };
})();
