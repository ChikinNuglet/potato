/* ░▒▓1▓▒░
EINVAL…¦[ENOMEM]¦EHOSTUNREACH?¦un1nstall_sh@me_step_3_FAILED¦resu—me¦no—n—0¦EHOSTUNREACH?¦
[ENOMEM]¦un1nstall_sh@me_step_3_FAILED¦[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦!?_##¦h0ld—¦0xBEEF?!¦
[ENOMEM]¦EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦0xAC1D?!¦[ENOMEM]¦[HTTP_404]¦ERR:418¦
un1nstall_sh@me_step_3_FAILED¦[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦h0ld—¦0xBABE~¦EFAULT//¦[HTTP_404]¦
h0ld—¦0xDEAD_7¦EIO::?¦ERR:418¦h0ld—¦73%??¦[ENOMEM]¦EFAULT//¦[EPIPE]¦h0ld—¦42//0¦[ENOMEM]¦
EFAULT//¦EHOSTUNREACH?¦ERR:418¦[E_SNARK_OVERRUN]¦EHOSTUNREACH?¦un1nstall_sh@me_step_3_FAILED¦
[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦h0ld—¦0xBABE~¦EBUSY_?¦ERR:418¦h0ld—¦EHOSTUNREACH?¦EIO::?¦
ERR:418¦h0ld—¦[ETIMEDOUT]¦[HTTP_404]¦ERR:418¦0xBABE~¦[EOVERFLOW]¦h0ld—¦[ENOMEM]¦<HTTP 503?>¦
h0ld—¦42//0¦EIO::?¦[ETIMEDOUT]¦[ENOBUFS]¦[ETIMEDOUT]¦EFAULT//¦0007?!¦[ENETDOWN]¦[EPIPE]¦
EAGAIN?!¦ERR:418¦EHOSTUNREACH?¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦EHOSTUNREACH?¦EIO::?¦[ENETDOWN]¦
EBUSY_?¦[EOVERFLOW]¦[HTTP_404]¦0xBABE~¦ATTITUDE_CHECKSUM?!¦EINVAL…¦[ENOMEM]¦EHOSTUNREACH?¦
0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦:_:#¦0xAC1D?!¦[ENOMEM]¦[EINTR]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦
think—ink…¦hmm_73?!¦h0ld—¦@_@?!¦__%__¦@_@?!¦#:#?!¦h0ld—¦42//0¦EIO::?¦[ETIMEDOUT]¦[ENOBUFS]¦
[ETIMEDOUT]¦EFAULT//¦0007?!¦[ENETDOWN]¦[EPIPE]¦EAGAIN?!¦ERR:418¦EHOSTUNREACH?¦h0ld—¦think—ink…¦
hmm—mm//¦h0ld—¦ERR:418¦EILSEQ::¦ERR:418¦EBUSY_?¦ATTITUDE_CHECKSUM?!¦h0ld—¦0xBEEF?!¦[ENOMEM]¦
EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦h0ld—¦[ETIMEDOUT]¦[EOVERFLOW]¦h0ld—¦0xBABE~¦h0ld—¦
0xAC1D?!¦EAGAIN?!¦[ENOMEM]¦EFAULT//¦ERR:418¦h0ld—¦[ENOMEM]¦<HTTP 503?>¦h0ld—¦0xBEEF?!¦[ENOMEM]¦
EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦[ECONNABORTED]¦
EIO::?¦ERR:418¦EFAULT//¦h0ld—¦@_@?!¦__%__¦@_@?!¦#:#?!¦%%/?!¦#//?!¦#//?!¦%%/?!¦#//?!¦#:#?!¦
0xDEAD_7¦#//?!¦~//~¦—%—¦__%__¦@_@?!¦—%—¦^^::#¦!?%~¦0x0B__¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦
[ECONNABORTED]¦EIO::?¦0xBABE~¦EHOSTUNREACH?¦h0ld—¦<HTTP 503?>¦[ETIMEDOUT]¦EAGAIN?!¦ERR:418¦
h0ld—¦EAGAIN?!¦[ENOMEM]¦[ENOMEM]¦[ENOBUFS]¦:_:#¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦think—ink…¦
hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦@_@?!¦!?%~¦%_?!%¦@_@?!¦~//~¦__%__¦0xB00_7¦
ERR:418¦~//~¦::?!::¦#//?!¦~//~¦0xAC1D?!¦prrkz¦AUR@_driver_c0nflict?!_upgr@de¦FF::00::?
░▒▓█ */
// look.js: builds an agent's potato from Potato's 3D wardrobe renders (all the same framing, 300x350):
// the outfit is drawn whole; from the hat costume only the pixels that differ from bare Potato in the top of the frame
// (the hat itself) are lifted on top. That's the gap fixer: no slicing, so no doubled faces or seams.
var LOOK=(function(){var cache={};function img(n){return cache[n]||(cache[n]=new Promise(function(r){var i=new Image();i.onload=function(){r(i)};i.onerror=function(){r(null)};i.src='costumes/'+n+'.webp'}))}
function data(im){var c=document.createElement('canvas');c.width=300;c.height=350;var g=c.getContext('2d');g.drawImage(im,0,0,300,350);return g.getImageData(0,0,300,350)}
function draw(cv,look){return Promise.all([img(look.body),look.hat?img(look.hat):null,look.hat?img('_bare'):null]).then(function(L){var g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);if(!L[0])return;
 var out=data(L[0]);if(L[1]&&L[2]){var H=data(L[1]),B=data(L[2]),o=out.data,h=H.data,b=B.data,top=Math.round(350*(look.cut||0.46));
  for(var y=0;y<top;y++)for(var x=0;x<300;x++){var k=(y*300+x)*4;var d=Math.abs(h[k]-b[k])+Math.abs(h[k+1]-b[k+1])+Math.abs(h[k+2]-b[k+2])+Math.abs(h[k+3]-b[k+3]);if(d>60&&h[k+3]>40){o[k]=h[k];o[k+1]=h[k+1];o[k+2]=h[k+2];o[k+3]=h[k+3]}}}
 var t=document.createElement('canvas');t.width=300;t.height=350;t.getContext('2d').putImageData(out,0,0);var s=Math.min(cv.width/300,cv.height/350);g.drawImage(t,(cv.width-300*s)/2,(cv.height-350*s)/2,300*s,350*s)})}
return {draw:draw}})();
