/* core.js: Potatocode in the visitor's own browser (Claude, Nov 12 2026 night, for Chikin: "we just have to get the pick a potato working").
   The same steps as tools/potatocode_room.py and the door: the key moves the WORDS, the TWINS trade places, the numbers under the squares read as
   one line -> SHA-512 -> a slow step (PBKDF2, 600,000 rounds) -> AES-256-GCM. The locks are the browser's own (WebCrypto).
   Everything here runs on the visitor's device. The key is made here, shown once by the page that asked, and never sent or stored anywhere.
   WE KEEP NO COPY OF ANY KEY (D-20261112-14, -25). Nobody outside has reviewed this build: no page calls it secure (D-20261112-19).
   window.Potatocode = { newKey(), lock(words, html) -> { key, room }, open(room, key) -> html, page(template, room, o) -> a whole locked file,
                         roomOf(fileText) -> room | null, norm(key) } */
(function () {
  var enc = new TextEncoder(), AAD = 'potatocode-room-v1', ROUNDS = 600000, ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no I, L, O, 0, 1: easy to read off paper
  var cat = function (a, b) { var o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
  var sha = function (alg, u8) { return crypto.subtle.digest(alg, u8).then(function (d) { return new Uint8Array(d); }); };
  var b64 = function (u) { var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); };
  var unb = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };
  var norm = function (k) { return String(k || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); };
  function stream(seed) { var n = 0, buf = new Uint8Array(0);
    async function u32() { if (buf.length < 4) { var c = new Uint8Array(4); new DataView(c.buffer).setUint32(0, n++); buf = cat(buf, await sha('SHA-256', cat(seed, c))); } var v = new DataView(buf.buffer, buf.byteOffset, 4).getUint32(0); buf = buf.slice(4); return v; }
    async function below(m) { var lim = Math.floor(4294967296 / m) * m; for (;;) { var x = await u32(); if (x < lim) return x % m; } }
    return { shuffle: async function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = await below(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; } }; }
  async function arrangement(words, key) { var k = enc.encode(norm(key)), byword = [], spaces = [], n = 0;
    words.forEach(function (w, wi) { byword[wi] = Array.from(w).map(function (ch) { return [ch, ++n]; }); if (wi < words.length - 1) spaces.push(++n); });
    var order = await stream(await sha('SHA-256', cat(enc.encode('potatocode-room/words|'), k))).shuffle(words.map(function (_, i) { return i; }));
    var cells = [], sp = 0; order.forEach(function (wi, pos) { byword[wi].forEach(function (c) { cells.push([c[0], c[1]]); }); if (pos < order.length - 1) cells.push([' ', spaces[sp++]]); });
    var st = stream(await sha('SHA-256', cat(enc.encode('potatocode-room/twins|'), k))), where = new Map();
    cells.forEach(function (c, i) { if (c[0] !== ' ') { if (!where.has(c[0])) where.set(c[0], []); where.get(c[0]).push(i); } });
    var chars = Array.from(where.keys()).sort(function (a, b) { return a.codePointAt(0) - b.codePointAt(0); });
    for (var q = 0; q < chars.length; q++) { var idx = where.get(chars[q]); if (idx.length < 2) continue; var nums = await st.shuffle(idx.map(function (i) { return cells[i][1]; })); idx.forEach(function (i, j) { cells[i][1] = nums[j]; }); }
    return cells.map(function (c) { return c[1]; }).join(' '); }
  async function aes(words, key, salt, use) { var mat = await sha('SHA-512', enc.encode(await arrangement(words, key))), base = await crypto.subtle.importKey('raw', mat, 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: ROUNDS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, [use]); }
  function newKey() { var out = []; while (out.length < 24) { var b = new Uint8Array(48); crypto.getRandomValues(b); for (var i = 0; i < b.length && out.length < 24; i++) if (b[i] < 248) out.push(ALPHA[b[i] % 31]); }   // (248 = 8 x 31: no lean toward any letter)
    return out.join('').match(/.{4}/g).join('-'); }
  async function lock(words, html) { var key = newKey(), salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    var blob = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: enc.encode(AAD) }, await aes(words, key, salt, 'encrypt'), enc.encode(html)));
    return { key: key, room: { v: 1, rounds: ROUNDS, salt: b64(salt), iv: b64(iv), blob: b64(blob), words: words } }; }
  async function open(room, key) { var k = await aes(room.words, key, unb(room.salt), 'decrypt');
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb(room.iv), additionalData: enc.encode(AAD) }, k, unb(room.blob))); }
  function page(template, room, o) { o = o || {}; return template.replace('/*TITLE*/', o.title || 'a locked potato').replace('/*H1*/', o.h1 || 'lOcked').replace('/*HINT*/', o.hint || 'Only the one who holds the key opens this.').replace('/*ROOM*/null', JSON.stringify(room).replace(/<\//g, '<\\/')); }
  function roomOf(text) { var m = /const ROOM=(\{[\s\S]*?\});\s*\n/.exec(text); if (!m) return null; try { var r = JSON.parse(m[1]); return r && r.blob && r.words ? r : null; } catch (e) { return null; } }
  window.Potatocode = { newKey: newKey, lock: lock, open: open, page: page, roomOf: roomOf, norm: norm, ok: !!(window.crypto && crypto.subtle) };
})();
