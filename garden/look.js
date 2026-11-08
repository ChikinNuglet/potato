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
