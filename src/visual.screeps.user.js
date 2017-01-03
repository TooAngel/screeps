// jshint esnext: true
// ==UserScript==
// @name         Screeps Visual
// @namespace    https://screeps.com/
// @version      1.1.1
// @author       Adam Shumann, ags131
// @match        https://screeps.com/a/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://github.com/screepers/screeps-visual/raw/master/src/visual.screeps.user.js
// ==/UserScript==
let lzstring = function(){function o(o,r){if(!t[o]){t[o]={};for(var n=0;n<o.length;n++)t[o][o.charAt(n)]=n}return t[o][r]}var r=String.fromCharCode,n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",t={},i={compressToBase64:function(o){if(null==o)return"";var r=i._compress(o,6,function(o){return n.charAt(o)});switch(r.length%4){default:case 0:return r;case 1:return r+"===";case 2:return r+"==";case 3:return r+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(e){return o(n,r.charAt(e))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(o){return null==o?"":""==o?null:i._decompress(o.length,16384,function(r){return o.charCodeAt(r)-32})},compressToUint8Array:function(o){for(var r=i.compress(o),n=new Uint8Array(2*r.length),e=0,t=r.length;t>e;e++){var s=r.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null===o||void 0===o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;t>e;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(o){return null==o?"":i._compress(o,6,function(o){return e.charAt(o)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(n){return o(e,r.charAt(n))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(o,r,n){if(null==o)return"";var e,t,i,s={},p={},u="",c="",a="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<o.length;i+=1)if(u=o.charAt(i),Object.prototype.hasOwnProperty.call(s,u)||(s[u]=f++,p[u]=!0),c=a+u,Object.prototype.hasOwnProperty.call(s,c))a=c;else{if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++),s[c]=f++,a=String(u)}if(""!==a){if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==r-1){d.push(n(m));break}v++}return d.join("")},decompress:function(o){return null==o?"":""==o?null:i._decompress(o.length,32768,function(r){return o.charCodeAt(r)})},_decompress:function(o,n,e){var t,i,s,p,u,c,a,l,f=[],h=4,d=4,m=3,v="",w=[],A={val:e(0),position:n,index:1};for(i=0;3>i;i+=1)f[i]=i;for(p=0,c=Math.pow(2,2),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(t=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 2:return""}for(f[3]=l,s=l,w.push(l);;){if(A.index>o)return"";for(p=0,c=Math.pow(2,m),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(l=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 2:return w.join("")}if(0==h&&(h=Math.pow(2,m),m++),f[l])v=f[l];else{if(l!==d)return null;v=s+s.charAt(0)}w.push(v),f[d++]=s+v.charAt(0),h--,s=v,0==h&&(h=Math.pow(2,m),m++)}}};return i}();        

function init() {
  if(!$('section.game').length) return setTimeout(init,100);
  let gameEl = angular.element($('section.game'));
  let Game = gameEl.scope().Game;
  let sock = gameEl.injector().get('Socket');
  let $compile = gameEl.injector().get('$compile');
  sock.unsubscribe(`user:${Game.player}/memory/__visual`);
  sock.on(`user:${Game.player}/memory/__visual`,function(event){
    let raw = event.edata;
    if(!$('section.room').length) return;
    let roomElem = angular.element($('section.room'));
    let roomScope = roomElem.scope();
    let room = roomScope.Room;
    if(raw.substr(0,3) == 'lz:') raw = lzstring.decompress(raw.slice(3)) || '{}';
    if(raw.substr(0,5) == 'lz64:') raw = lzstring.decompressFromBase64(raw.slice(5)) || '{}';
    let visuals = JSON.parse(raw) || {};
    let visual = visuals[room.roomName];
    let canvas = $('canvas.visual')[0];

    if(!canvas){
      canvas = createCanvas();
      addToggle();
    }
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!visual) return;
    renderLayer(ctx,visual);
  });
}

function renderLayer(ctx,layer){
  ctx.save();
  for(let i=0;i<layer.length;i++){
    let [cmd,...args] = layer[i];
    executeCmd(ctx,cmd,args)
  }
  ctx.restore();
}

function createCanvas(){
  let roomScope = angular.element($('section.room')).scope();
  let $compile = angular.element($('section.game')).injector().get('$compile');
  let canvas = $('<canvas ng-show="showVisual"></canvas>')[0];
  canvas.className = 'visual';
  canvas.width = 2500;
  canvas.height = 2500;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  $compile($(canvas))(roomScope);
  $('div.game-field').append(canvas);
  return canvas;
}

function addToggle(){
  if($('.visualToggle').length) return;
  let roomScope = angular.element($('section.room')).scope();
  roomScope.showVisual = true;
  let room = roomScope.Room;
  let cont = $('.display-options .aside-block-content');
  let $compile = angular.element(cont).injector().get('$compile');
  let elem = $('<md-checkbox class="md-primary visualToggle" ng-model="showVisual">Show Visual</md-checkbox>');
  $compile(elem)(roomScope);
  elem.appendTo(cont);
}

function executeCmd(ctx,cmd,args=[]){
  console.log('ec',cmd,args)
  let opts = {}
  switch(cmd){
    case 'setCanvasScale':
      let size = args[0];
      ctx.canvas.width = size*50;
      ctx.canvas.height = size*50;
      ctx.scale(size,size);
      break;
    case 'defineColors':
      ctx.__colors = args[0];
      break;
    case 'drawMatrix':
      if(!ctx.__colors) setDefaultColors(ctx);
      args[0].forEach((c,i)=>{
        let x = i %  50;
        let y = (i-x) / 50;
        ctx.fillStyle = getColor(ctx,c);
        ctx.fillRect(x,y,1,1);
      });
      break;
    case 'drawLine':
      opts = args[2] || {}
      ctx.translate(0.5,0.5);
      ctx.lineCap = opts.lineCap || 'round';
      ctx.lineJoin = opts.lineJoin ||'round';
      ctx.lineWidth = opts.lineWidth ||0.5;
      ctx.strokeStyle = getColor(ctx,args[1]);
      ctx.beginPath();    
      args[0].forEach((xy,i)=>{
        let x,y;
        if(xy instanceof Array){
            x = xy[0];
            y = xy[1];
        }else{
            x = xy.x;
            y = xy.y;
        }
        if(i==0)
          ctx.moveTo(x,y);
        else
          ctx.lineTo(x,y);
      });
      ctx.stroke();
      ctx.translate(-0.5,-0.5);
      break;
    case 'drawCell':
      ctx.fillStyle = getColor(ctx,args[2]);
      ctx.fillRect(args[0],args[1],1,1);
      break;
    case 'writeText':
      // TODO
      break;
    default:
      if(typeof ctx[cmd] == 'function')
        ctx[cmd].apply(ctx,args);
      else
        ctx[cmd] = args[0];
      break;
  }
}

function getColor(ctx,ind){
  return ctx.__colors[ind || 0] || ind || '#000000';
}

function setDefaultColors(ctx){
  ctx.__colors = ['#000000','#FFFFFF','#FF0000','#00FF00','#0000FF'];
}

$(function () {
  // push the load to the end of the event queue
  setTimeout(init);
});

