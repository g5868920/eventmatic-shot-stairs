/** Eventmatic Playful Pixel Arcade B — L1/L2 only. Apache-2.0.
 * Pure rendering and cosmetic observation. No gameplay/audio event subscriptions,
 * timers, randomness, velocity changes, collision writes, or character asset edits.
 */
(function (global) {
  'use strict';
  var T = Object.freeze({bg:'#211b38',wall:'#4c365d',wallHi:'#805271',panel:'#342747',border:'#b4a1ff',ink:'#fff3da',muted:'#c1a9d2',accent:'#ff86a9',gold:'#ffc95c',p1:'#8cdaf7',p2:'#ffa4c6',blue:'#408bc9',blueHi:'#a4def8',brown:'#ad8052',brownHi:'#efd0a0',green:'#9cde83',steel:'#bac4d5',danger:'#ff7b8d'});
  function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function canvas(w,h){var a=document.createElement('canvas');a.width=w;a.height=h;return a;}
  var HEART_BITS=[54,127,127,62,28,8];
  function heart(c,x,y,color){var bits=HEART_BITS;c.fillStyle=color;for(var y0=0;y0<bits.length;y0++)for(var x0=0;x0<7;x0++)if(bits[y0]&(1<<x0))c.fillRect(x+x0,y+y0,1,1);}
  function create(S) {
    var textCache=new Map(),glyphCache=new Map(),pool=[],cursor=0,clock=0,pushHeld=false,previousShot=null,peak=0,emitted=0,resets=0,pushBursts=0,dropped=0,lastBeerDelta=0,lastLandDelta=0,lastDamageDelta=0;
    var CAPACITY=32, names={p1:'1P',p2:'2P'},nameLabels={p1:null,p2:null},markerLabels={p1:null,p2:null},hudCanvas=canvas(396,52),hud=hudCanvas.getContext('2d'),lastHp1=-1,lastHp2=-1,lastSoloFloors=-2,lastShots=null,lastUnit=null,lastLabel1=null,lastLabel2=null,lastAriaFloors=-1,unitSource=null,unitText=null;
    var reduced=!!(global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    for(var i=0;i<CAPACITY;i++)pool.push({kind:0,born:0,life:0,x:0,y:0,anchor:null,label:null});
    function ascii(str){return S.font.has(String(str));}
    function width(str,scale){str=String(str);if(ascii(str))return S.font.width(str,scale);var size=0;for(var ch of str)size+=(S.font.has(ch)?6:15)*scale;return size-scale;}
    function glyph(ch){if(glyphCache.has(ch))return glyphCache.get(ch);if(glyphCache.size>=256)glyphCache.clear();var a=canvas(14,16),c=a.getContext('2d');c.font='400 14px "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif';c.fillStyle='#fff';c.textBaseline='alphabetic';c.fillText(ch,0,13);var pixels=c.getImageData(0,0,14,16),points=[];for(var yy=0;yy<16;yy++)for(var xx=0;xx<14;xx++)if(pixels.data[(yy*14+xx)*4+3]>=170)points.push(xx,yy);glyphCache.set(ch,points);return points;}
    function text(str,color,scale,maxWidth){
      str=String(str);scale=scale||1;
      while(scale>1&&width(str,scale)>maxWidth)scale--;
      if(width(str,scale)>maxWidth){var chars=Array.from(str);while(chars.length&&width(chars.join('')+'..',scale)>maxWidth)chars.pop();str=chars.join('')+'..';}
      var key=color+'|'+scale+'|'+str;
      if(textCache.has(key))return textCache.get(key);
      if(textCache.size>=128)textCache.clear();
      var mixed=!ascii(str),a=canvas(Math.max(1,width(str,scale)),(mixed?16:7)*scale),c=a.getContext('2d');
      if(!mixed)S.font.draw(c,str,0,0,{scale:scale,color:color});
      else{var at=0;c.fillStyle=color;for(var ch of str){if(S.font.has(ch)){S.font.draw(c,ch,at,3*scale,{scale:scale,color:color});at+=6*scale;}else{var points=glyph(ch);for(var j=0;j<points.length;j+=2)c.fillRect(at+points[j]*scale,points[j+1]*scale,scale,scale);at+=15*scale;}}}
      textCache.set(key,a);return a;
    }
    function center(c,label,x,y){c.drawImage(label,Math.round(x-label.width/2),Math.round(y));}
    var flipSheet,conveyorTiles={};
    function installArt(){
      var a,c,x,y;
      a=canvas(80,12);c=a.getContext('2d');rect(c,0,0,80,12,T.blue);rect(c,0,0,80,2,T.blueHi);rect(c,0,6,80,1,'#28558c');rect(c,0,10,80,2,'#244971');for(x=0;x<80;x+=20){rect(c,x,2,1,4,'#28558c');rect(c,x+10,7,1,4,'#28558c');rect(c,x+2,3,9,1,T.blueHi);}S.images.blueBrick=a;
      a=canvas(80,12);c=a.getContext('2d');rect(c,0,0,80,12,T.brown);rect(c,0,0,80,2,T.brownHi);for(x=0;x<80;x+=16){rect(c,x,2,1,9,'#694c38');rect(c,x+4,5,7,1,T.brownHi);}rect(c,3,6,2,2,T.ink);rect(c,75,6,2,2,T.ink);S.images.stone=a;
      a=canvas(80,12);c=a.getContext('2d');rect(c,0,0,80,12,T.steel);rect(c,0,0,80,2,T.ink);rect(c,0,9,80,3,'#536078');rect(c,0,11,80,1,T.danger);S.images.steel=a;
      a=canvas(10,15);c=a.getContext('2d');for(y=0;y<15;y++)rect(c,4-Math.floor(y/3),y,1+Math.floor(y/3)*2,1,y<5?T.ink:T.steel);S.images.spikes=a;
      for(var dir=-1;dir<=1;dir+=2){
        a=canvas(80,48);c=a.getContext('2d');
        for(var f=0;f<4;f++){
          var yy=f*12;rect(c,0,yy,80,12,T.steel);rect(c,0,yy,80,2,T.ink);rect(c,0,yy+9,80,3,'#536078');
          for(x=3;x<77;x+=10){rect(c,x,yy+3,6,5,'#57657d');rect(c,x+1+(f%3),yy+3,2,2,T.ink);}
        }
        S.images[dir>0?'conveyorRight':'conveyorLeft']=a;
        var tile=canvas(40,7),tc=tile.getContext('2d');
        rect(tc,14,0,12,7,T.bg);rect(tc,15+(dir>0?0:2),2,8,2,T.steel);
        for(var row=0;row<6;row++){var head=3-Math.floor(Math.abs(row-2.5));rect(tc,15+(dir>0?7:3-head),row,head,1,T.steel);}
        conveyorTiles[dir]=tile;
      }
      // Cached rotation poses: top face, edge, underside, then a final thin edge before removal.
      flipSheet=canvas(80,84);var flipCtx=flipSheet.getContext('2d');flipCtx.imageSmoothingEnabled=false;
      var flipHeights=[12,8,2,6,10,6,2];
      for(var pose=0;pose<flipHeights.length;pose++){
        var fh=flipHeights[pose],fy=pose*12+Math.floor((12-fh)/2);
        if(pose<3)flipCtx.drawImage(S.images.stone,0,0,80,12,0,fy,80,fh);
        else{
          rect(flipCtx,0,fy,80,fh,'#694c38');rect(flipCtx,0,fy+fh-1,80,1,'#493828');
          for(x=16;x<80;x+=24)rect(flipCtx,x,fy,3,fh,T.brown);
          rect(flipCtx,7,fy+Math.max(0,Math.floor(fh/2)-1),2,2,T.brownHi);rect(flipCtx,71,fy+Math.max(0,Math.floor(fh/2)-1),2,2,T.brownHi);
        }
      }
      a=canvas(80,12*18);c=a.getContext('2d');for(var h=7;h<=18;h++){var offset=(h-7)*18,top=offset+18-h;rect(c,0,offset+15,80,3,'#41744f');for(x=10;x<80;x+=22){rect(c,x,top+3,3,Math.max(1,h-6),T.green);rect(c,x-3,top+Math.floor(h/2),9,2,T.green);}rect(c,0,top,80,4,T.green);rect(c,2,top,76,1,'#e0ffc3');S.font.draw(c,'↑',37,top,{color:'#28533c'});}S.images.spring=a;
      a=canvas(18,480);c=a.getContext('2d');for(y=0;y<480;y+=16){rect(c,0,y,18,15,T.wall);rect(c,0,y,18,1,T.wallHi);rect(c,y%32?4:12,y,1,15,T.wallHi);}S.images.wall=a;
      a=canvas(360,S.images.ceiling.height);c=a.getContext('2d');for(x=0;x<360;x+=12)for(y=0;y<a.height;y++)rect(c,x+Math.floor(y/3),y,Math.max(0,10-Math.floor(y/3)*2),1,y<3?T.wallHi:T.steel);S.images.ceiling=a;
      a=canvas(18,19);c=a.getContext('2d');rect(c,1,3,12,16,'#100e1c');rect(c,12,5,5,9,T.ink);rect(c,13,7,2,5,T.bg);rect(c,3,4,8,12,T.gold);rect(c,3,6,2,8,'#ffeb9c');rect(c,2,1,10,5,T.ink);rect(c,4,0,4,2,T.ink);rect(c,3,16,8,1,T.brownHi);rect(c,6,9,1,2,T.bg);rect(c,9,9,1,2,T.bg);rect(c,7,12,2,1,T.bg);S.images.mug=a;
    }
    installArt();
    var field=canvas(360,480),fc=field.getContext('2d');rect(fc,0,0,360,480,T.bg);rect(fc,0,0,1,480,T.wallHi);rect(fc,359,0,1,480,T.wallHi);for(var yy=44;yy<480;yy+=64){rect(fc,12,yy,3,3,T.wall);rect(fc,341,yy+20,2,6,T.wallHi);}for(var y0=70;y0<480;y0+=156){rect(fc,14,y0,10,12,T.wall);rect(fc,16,y0+3,2,2,T.muted);rect(fc,20,y0+3,2,2,T.muted);rect(fc,17,y0+8,4,1,T.muted);}
    var floorWord=text('FLOORS',T.muted,1,50),lifeWord=text('LIFE',T.muted,1,50),shotWord=text('SHOT POOL',T.gold,1,100),id1=text('1P',T.p1,1,20),id2=text('2P',T.p2,1,20),hpLabels=[];
    for(i=0;i<=12;i++)hpLabels.push(text(i+'/12',T.ink,1,35));
    var floorLabel=null,lastFloors=-1;
    function add(kind,anchor,label,color,time,duration){var e=pool[cursor];if(e.kind)dropped++;cursor=(cursor+1)%CAPACITY;e.kind=kind;e.anchor=anchor;e.born=Number.isFinite(time)?time:clock;e.life=duration;e.label=label?text(label,color,1,100):null;e.x=anchor?anchor.x:180;e.y=anchor?anchor.y:76;emitted++;return e;}
    function reset(){for(var i=0;i<CAPACITY;i++){pool[i].kind=0;pool[i].anchor=null;pool[i].label=null;}cursor=0;clock=0;pushHeld=false;previousShot=null;lastHp1=-1;lastHp2=-1;lastShots=null;lastAriaFloors=-1;lastBeerDelta=lastLandDelta=lastDamageDelta=0;resets++;}
    function identities(p1,p2,label1,label2){id1=text(label1,T.p1,1,16);id2=text(label2,T.p2,1,16);names.p1=String(p1);names.p2=String(p2);nameLabels.p1=text(names.p1,T.ink,1,85);nameLabels.p2=text(names.p2,T.ink,1,85);markerLabels.p1=text(label1+' '+names.p1,T.p1,1,72);markerLabels.p2=text(label2+' '+names.p2,T.p2,1,72);lastHp1=-1;}
    function hudDraw(c,p1,p2,quantity,formatted,unit,canvasNode,live){
      if(unit!==unitSource){unitSource=unit;unitText=String(unit).toUpperCase();}unit=unitText;
      if(previousShot!==null&&quantity>previousShot&&live){var delta=Math.round((quantity-previousShot)*1000)/1000;add(6,null,'+'+delta+' '+unit,T.gold,clock,600);}previousShot=quantity;
      var soloFloors=p2?-1:p1.floors; // solo: no 2P state; the empty 2P slot shows the run's floors
      var hudChanged=p1.life!==lastHp1||(p2?p2.life:-1)!==lastHp2||formatted!==lastShots||unit!==lastUnit||p1.label!==lastLabel1||(p2?p2.label:'')!==lastLabel2||soloFloors!==lastSoloFloors;
      if(hudChanged){
        rect(hud,0,0,396,52,T.panel);rect(hud,0,50,396,2,T.border);
        for(var n=0;n<2;n++){var h=n?p1:p2,x=n?277:12,color=n?T.p1:T.p2,name=n?nameLabels.p1:nameLabels.p2;
          if(!h){hud.drawImage(text('SOLO RUN',T.muted,1,100),x,6);hud.drawImage(text(String(soloFloors).padStart(3,'0'),T.ink,2,100),x,20);hud.drawImage(floorWord,x,38);continue;}
          hud.drawImage(n?id1:id2,x,6);if(name)hud.drawImage(name,x+20,6);
          for(var pip=0;pip<12;pip++){heart(hud,x+pip*9,23,pip<h.life?color:'#756781');rect(hud,x+pip*9+2,31,3,1,pip<h.life?T.ink:'#756781');}
          hud.drawImage(lifeWord,x,38);var hp=hpLabels[Math.max(0,Math.min(12,h.life))];hud.drawImage(hp,x+106-hp.width,38);
        }
        rect(hud,144,3,108,44,T.bg);rect(hud,146,5,2,40,T.gold);rect(hud,248,5,2,40,T.gold);rect(hud,142,14,6,4,T.panel);rect(hud,248,31,6,4,T.panel);center(hud,shotWord,198,7);
        var value=formatted;if(width(value,1)>100&&Number.isFinite(quantity))value=quantity.toExponential(2).toUpperCase();
        var mixedUnit=!ascii(unit);center(hud,text(value,T.gold,mixedUnit?2:3,96),198,20);center(hud,text(unit,T.muted,1,96),198,mixedUnit?35:43);
        lastHp1=p1.life;lastHp2=p2?p2.life:-1;lastShots=formatted;lastUnit=unit;lastLabel1=p1.label;lastLabel2=p2?p2.label:'';lastSoloFloors=soloFloors;

      }
      var totalFloors=p1.floors+(p2?p2.floors:0);
      if(canvasNode&&(hudChanged||totalFloors!==lastAriaFloors)){
if(canvasNode){canvasNode.setAttribute('role','img');canvasNode.setAttribute('aria-label',p2?'SHOT POOL '+formatted+' '+unit+'. 1P '+names.p1+' LIFE '+p1.life+'/12. 2P '+names.p2+' LIFE '+p2.life+'/12. '+(p1.floors+p2.floors)+' combined floors.':'SHOT POOL '+formatted+' '+unit+'. SOLO '+names.p1+' LIFE '+p1.life+'/12. '+p1.floors+' floors.');}
        lastAriaFloors=totalFloors;
      }
      c.drawImage(hudCanvas,0,0);
    }
    function drawField(c,floors){c.drawImage(field,0,52);if(floors!==lastFloors){floorLabel=text(String(floors).padStart(3,'0'),T.muted,1,68);lastFloors=floors;}c.drawImage(floorLabel,340-floorLabel.width,81);c.drawImage(floorWord,340-floorWord.width,93);}
    function marker(c,h,index,other){var label=markerLabels[h.id],height=h.skin?(h.skin.anim?h.skin.anim.bottom:h.skin.h):32,y=h.y-height-label.height-10;
      var close=other&&Math.abs(h.x-other.x)<80&&Math.abs(h.y-other.y)<30;if(y<68)return;
      var at=h.x+13-Math.round(label.width/2);if(close)at+=(h.x<other.x||(h.x===other.x&&index===1))?-Math.ceil(label.width/2):Math.ceil(label.width/2);
      var x=Math.max(2,Math.min(358-label.width,at));rect(c,x-2,y-2,label.width+4,label.height+4,T.bg);c.drawImage(label,Math.round(x),Math.round(y));rect(c,h.x+12,y+label.height+3,3,2,h.id==='p1'?T.p1:T.p2);
    }
    function effects(c,time,actors){var active=0;for(var i=0;i<CAPACITY;i++){var e=pool[i];if(!e.kind)continue;var age=Math.max(0,time-e.born);if(age>e.life){e.kind=0;e.anchor=null;e.label=null;continue;}active++;var a=e.anchor,x=a?a.x:e.x,y=a?a.y:e.y,rise=reduced?0:Math.floor(age/100);
      if(e.kind===3){x=Math.max(4,x-10);y+=-9;rect(c,x,y,1,7,T.green);rect(c,x-2,y+2,5,1,T.green);}
      else if(e.kind===4){var w=a.width;x+=Math.round(w/2);y+=6;if(e.label)center(c,e.label,x,y);rect(c,a.x-2,a.y-3,1,7,T.brownHi);rect(c,a.x+w+1,a.y-3,1,7,T.brownHi);rect(c,x,a.y+1,1,4,T.brownHi);}
      else if(e.kind===5){x=e.x;y=e.y;if(!reduced&&age<200){rect(c,x-2,y-12,2,2,T.ink);rect(c,x+3,y-8,2,2,T.accent);}center(c,e.label,Math.max(20,Math.min(338,x)),y+16);}
      else if(e.kind===6){center(c,e.label,180,72);}
      else{var other=actors&&a?(actors[0]===a?actors[1]:actors[0]):null;var close=other&&Math.abs(a.x-other.x)<90&&Math.abs(a.y-other.y)<60;var left=close?a.x<other.x:x<70;
        var px=left?x-e.label.width/2-6:x+26+e.label.width/2+6,py=e.kind===1?y+16:y-28-rise;px=Math.max(e.label.width/2+2,Math.min(358-e.label.width/2,px));if(py>=69&&py+e.label.height<532)center(c,e.label,px,py);}
    }if(active>peak)peak=active;}
    function contact(a,b,time){var touching=Math.abs(a.y-b.y)<26&&Math.abs(Math.abs(a.x-b.x)-26)<0.05;/* contact is still counted; the BUMP cue is no longer drawn */if(touching&&!pushHeld)pushBursts++;pushHeld=touching;}
    return {
      conveyorArrows:function(c,dir,x,y,w){
        x=Math.round(x);y=Math.round(y);w=Math.round(w);
        // Two 10 x 6 px arrows per native belt; 28.8 px/s is 40% of the previous 60 FPS motion.
        var phase=Math.floor(clock*0.0288)%40,offset=dir>0?phase:-phase;
        c.save();c.beginPath();c.rect(x+3,y-10,w-6,7);c.clip();
        for(var at=x-40+offset;at<x+w;at+=40)c.drawImage(conveyorTiles[dir>0?1:-1],at,y-10);
        c.restore();
      },
      flipping:function(c,x,y,w,remaining){
        if(remaining<=0)return;
        var pose=Math.min(6,Math.floor((1-Math.min(1,remaining))*7));
        S.slice(c,flipSheet,pose*12,12,x,y-12,w,1);
      },
      tokens:T,reset:reset,identities:identities,clock:function(t){clock=t;},field:drawField,hud:hudDraw,marker:marker,effects:effects,contact:contact,
      land:function(h,delta){lastLandDelta=delta;},
      beer:function(h,delta,time){lastBeerDelta=delta;if(delta>0)add(2,h,'+'+delta+' BEER',T.green,time,650);},
      damage:function(h,delta,time){lastDamageDelta=delta;if(delta>0)add(2,h,'-'+delta+' HP',T.danger,time,500);},
      spring:function(f,time){if(!f)return;add(3,f,null,T.green,time,260);},flip:function(f,time){if(!f)return;add(4,f,null,T.brownHi,time,350);},
      stats:function(){var active=0,refs=0;for(var i=0;i<CAPACITY;i++){if(pool[i].kind)active++;if(pool[i].anchor)refs++;}return {active:active,retainedAnchors:refs,capacity:CAPACITY,listeners:0,textCache:textCache.size,glyphCache:glyphCache.size,emitted:emitted,resets:resets,pushBursts:pushBursts,peakActive:peak,dropped:dropped,contactHeld:pushHeld,lastBeerDelta:lastBeerDelta,lastLandDelta:lastLandDelta,lastDamageDelta:lastDamageDelta};}
    };
  }
  global.ShotArcade = {create:create};
})(window);
