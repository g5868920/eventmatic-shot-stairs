/** Approved Eventmatic B L3 layouts. Rendering and semantic actions only. Apache-2.0.
 * The title uses the existing idle sprite frames. Its timer is presentation-only.
 */
(function(global){
 'use strict';
 function create(S,canvas,wrap,action){
  var T=S.arcade.tokens, layer=document.createElement('canvas');layer.width=396;layer.height=532;
  var c=layer.getContext('2d');c.imageSmoothingEnabled=false;var glyphs=new Map(),texts=new Map(),key='',view='title',builds=0,summary='',hudSummary='',ariaOverlay='',lastState='',layout=[],issues=[];
  var root=document.createElement('div');root.className='shot-screen-actions';root.setAttribute('aria-label','Game screen actions');
  var style=document.createElement('style');style.textContent='.shot-screen-actions{position:absolute;pointer-events:none}.shot-screen-actions button{position:absolute;pointer-events:auto;margin:0;padding:0;background:transparent;border:0;border-radius:0;color:transparent;font-size:0;cursor:pointer}.shot-screen-actions button:focus-visible{outline:2px solid #fff3da;outline-offset:2px;box-shadow:0 0 0 4px #211b38}.shot-screen-actions button[hidden]{display:none}.shot-title-actions button:hover{box-shadow:inset 0 0 0 2px #fff3da}.shot-title-actions button:active{background:#fff3da22}';
  wrap.style.position='relative';wrap.appendChild(style);wrap.appendChild(root);canvas.tabIndex=0;
  var buttons=[];for(var i=0;i<8;i++){var b=document.createElement('button');b.type='button';b.hidden=true;root.appendChild(b);buttons.push(b);}
  function click(e){var b=e.target;if(!b.dataset.action||b.disabled||b.hidden)return;action(b.dataset.action);}
  // Global Enter/Space/Escape continue through the original engine handlers, even with a focused button.
  root.addEventListener('click',click);
  // Optional ready-screen navigation; original keys still bubble. Do not consume typing in inputs.
  function helpKey(e){if(lastState!=='ready'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable)return;if(e.code==='KeyH'){e.preventDefault();action('help');}else if(e.code==='KeyB'&&view==='howto'){e.preventDefault();action('back');}}
  document.addEventListener('keydown',helpKey);
  var titleCast=[],titleTimer=null,titlePose=0;
  var reducedMotion=global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rect(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function box(x,y,w,h,fill,border){rect(x+3,y+4,w,h,'#0c0b18');rect(x,y,w,h,border||T.border);rect(x+2,y+2,w-4,h-4,T.bg);rect(x+4,y+4,w-8,h-8,fill||T.panel);rect(x+6,y+6,3,3,T.gold);rect(x+w-9,y+6,3,3,T.gold);for(var a=y+24;a<y+h-12;a+=24){rect(x,a,3,5,T.bg);rect(x+w-3,a,3,5,T.bg);}}
  function glyph(ch){if(glyphs.has(ch))return glyphs.get(ch);if(glyphs.size>=256)glyphs.clear();var a=document.createElement('canvas');a.width=14;a.height=16;var g=a.getContext('2d');g.font='400 14px "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif';g.textBaseline='alphabetic';g.fillText(ch,0,13);var p=g.getImageData(0,0,14,16).data,points=[],height=0;for(var y=0;y<16;y++)for(var x=0;x<14;x++)if(p[(y*14+x)*4+3]>=170){points.push(x,y);height=Math.max(height,y+1);}var data={points:points,height:height||14};glyphs.set(ch,data);return data;}
  function measure(s){var w=0,h=7;for(var ch of String(s).toUpperCase()){var ascii=S.font.has(ch);w+=ascii?6:15;if(!ascii)h=Math.max(h,glyph(ch).height);}return {w:Math.max(0,w-1),h:h};}
  function image(s,color,scale){s=String(s).toUpperCase();var id=s+'|'+color+'|'+scale;if(texts.has(id))return texts.get(id);if(texts.size>=256)texts.clear();var m=measure(s),a=document.createElement('canvas');a.width=Math.max(1,m.w*scale);a.height=m.h*scale;var g=a.getContext('2d'),at=0;g.fillStyle=color;for(var ch of s){if(S.font.has(ch)){S.font.draw(g,ch,at,0,{scale:scale,color:color});at+=6*scale;}else{var points=glyph(ch).points;for(var n=0;n<points.length;n+=2)g.fillRect(at+points[n]*scale,points[n+1]*scale,scale,scale);at+=15*scale;}}texts.set(id,a);return a;}
  // Integer-scale fitting, explicit bounds, wrapping and a readable full-text accessibility equivalent.
  function label(s,x,y,scale,color,maxW,maxH,lines,align){s=String(s);maxW=maxW||310;maxH=maxH||100;lines=lines||1;var original=s,rows,sz=scale;
   function split(size){var out=[],line='';for(var ch of s){if(ch==='\n'){out.push(line);line='';continue;}if(line&&measure(line+ch).w*size>maxW){out.push(line.trim());line='';}line+=ch;}if(line)out.push(line.trim());return out.length?out:[''];}
   do{rows=split(sz);if(rows.length<=lines&&rows.reduce(function(h,r){return h+measure(r).h*sz;},0)+(rows.length-1)*3<=maxH)break;sz--;}while(sz>0);
   sz=Math.max(1,sz);rows=split(sz);var allowed=0,usedHeight=0;for(var row of rows.slice(0,lines)){var height=measure(row).h*sz+(allowed?3:0);if(usedHeight+height>maxH)break;usedHeight+=height;allowed++;}allowed=Math.max(1,allowed);var truncated=rows.length>allowed;rows=rows.slice(0,allowed);if(truncated){var chars=Array.from(rows[rows.length-1]);while(chars.length&&measure(chars.join('')+'..').w*sz>maxW)chars.pop();rows[rows.length-1]=chars.join('')+'..';}
   var at=y;for(var r of rows){var a=image(r,color||T.ink,sz),left=align==='left'?x:Math.round(x-a.width/2);c.drawImage(a,left,at);layout.push({text:original,display:r,x:left,y:at,w:a.width,h:a.height,scale:sz,truncated:truncated});if(a.width>maxW||at+a.height>y+maxH)issues.push(original);at+=a.height+3;}return at-y;
  }
  function ribbon(y,s){rect(68,y,260,22,T.gold);rect(64,y+4,4,14,T.gold);rect(328,y+4,4,14,T.gold);label(s,198,y+7,1,T.bg,248,14);}
  function button(y,s,id){box(65,y,266,32,T.gold,T.gold);label(s,198,y+11,2,T.bg,246,17);return {id:id,label:String(s),x:65,y:y,w:266,h:32};}
  function secondary(y,s,id,w,scale){label(s,198,y+6,scale||1,T.muted,w||294,18);return {id:id,label:String(s),x:Math.floor(198-(w||294)/2),y:y,w:w||294,h:24};}
  // "PRESS ENTER TO REMATCH   ESC - TITLE": the title part is also a pointer target
  function rematchLine(t){var back=t.toTitle||'ESC - TITLE',full=t.rematch+'   '+back,w=measure(full).w,bw=measure(back).w;label(full,198,477,1,T.muted,294,13);var x=Math.round(198-w/2)+w-bw;return {id:'title',label:'Back to title',x:x-4,y:473,w:bw+8,h:15};}
  // Title: 小朋友 / SHOT 樓梯. The Chinese is rasterised once from the Traditional Chinese system font on a
  // 21 px grid (alpha-thresholded, so hard pixel edges) and drawn at 2x; English uses the bitmap font.
  // Same cream / gold hierarchy and dark drop shadow as the approved SHOT / THE STAIRS lockup.
  var titleGlyphs=new Map();
  function titleGlyph(ch,px){px=px||21;var key=ch+'|'+px;if(titleGlyphs.has(key))return titleGlyphs.get(key);var cw=px+2,ch_=px+5,a=document.createElement('canvas');a.width=cw;a.height=ch_;var g=a.getContext('2d');g.font='600 '+px+'px "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif';g.textBaseline='alphabetic';g.fillText(ch,1,px);var p=g.getImageData(0,0,cw,ch_).data,pts=[];for(var y=0;y<ch_;y++)for(var x=0;x<cw;x++)if(p[(y*cw+x)*4+3]>=140)pts.push(x,y);var d={points:pts,adv:px+1,h:ch_};titleGlyphs.set(key,d);return d;}
  function titleCJK(str,x,y,color,px){var at=x,sc=2,h=0;c.fillStyle=color;for(var ch of str){var d=titleGlyph(ch,px);for(var n=0;n<d.points.length;n+=2)c.fillRect(at+d.points[n]*sc,y+d.points[n+1]*sc,sc,sc);at+=d.adv*sc;h=d.h*sc;}layout.push({text:str,display:str,x:x,y:y,w:at-x,h:h,scale:sc,truncated:false});return at-x;}
  function titleArt(){
   var shotWidth=measure('SHOT').w*7, gap=8, cjkSize=21;
   var left=Math.round((396-shotWidth-gap-4*(cjkSize+1))/2);
   titleCJK('小朋友',137,44,'#120e23',20);
   titleCJK('小朋友',135,42,T.ink,20);
   label('SHOT',left+3,96,7,'#120e23',330,55,1,'left');
   label('SHOT',left,92,7,T.gold,330,55,1,'left');
   titleCJK('樓梯',left+shotWidth+gap+2,93,'#120e23',cjkSize);
   titleCJK('樓梯',left+shotWidth+gap,90,T.ink,cjkSize);
  }
  function titleModes(mode){
   return [['solo','SOLO','1 PLAYER',28],['versus','VERSUS','2 PLAYERS',202]].map(function(option){
    var selected=mode===option[0],x=option[3];
    rect(x+2,186,166,42,'#120e23');
    rect(x,182,166,42,selected?T.gold:T.wallHi);
    rect(x+2,184,162,38,selected?'#49364b':T.panel);
    rect(x+6,190,3,26,selected?T.gold:T.wall);
    label(option[1],x+83,190,2,selected?T.gold:T.ink,145,15);
    label(option[2],x+83,211,1,T.muted,145,8);
    return {id:option[0],label:option[2]+' - '+option[1]+(selected?' (selected)':''),selected:selected,x:x,y:182,w:166,h:42};
   });
  }
  function titleArrow(x,y,dir,id,description,color){
   rect(x,y,30,26,T.wallHi);
   rect(x+1,y+1,28,24,T.bg);
   label(dir<0?'←':'→',x+15,y+6,2,color,24,14);
   return {id:id,label:description,x:x,y:y,w:30,h:26};
  }
  function titlePlayer(d,cx,index,actions){
   var hero=d.heroes[index],slot=hero.id,number=index+1;
   var color=index?T.p2:T.p1,back=index?'#3b2949':'#2b344d';
   var id=number+'P',feet=371;
   rect(cx-51,267,102,104,back);
   rect(cx-45,263,90,4,back);
   rect(cx-45,269,90,1,index?'#573655':'#3e5270');
   rect(cx-51,356,102,2,index?'#573655':'#3e5270');
   rect(cx-43,363,86,7,T.bg);
   rect(cx-43,369,86,3,color);
   rect(cx-40,372,80,7,T.wall);
   for(var at=cx-38;at<cx+37;at+=8)rect(at,374,4,2,T.wallHi);
   var badgeX=cx+(index?-63:43);
   rect(badgeX,254,20,14,color);
   label(id,badgeX+10,258,1,T.bg,18,8);
   titleCast.push({hero:hero,portrait:d.portrait,x:cx,y:feet});
   label(d.names[index],cx,394,2,color,80,16);
   if(d.pick){
    actions.push(titleArrow(cx-72,387,-1,slot+'-prev','Previous character for '+id,color));
    actions.push(titleArrow(cx+42,387,1,slot+'-next','Next character for '+id,color));
    label(keys(d.cfg.players[slot].keys).replace('  ',' / '),cx,420,1,T.muted,105,8);
   }
  }
  function drawTitle(d,actions){
   var solo=d.mode==='solo',picks=[];
   rect(0,0,396,532,T.bg);
   rect(11,12,2,505,T.wall);
   rect(383,12,2,505,T.wall);
   rect(22,17,352,150,'#120e23');
   rect(21,14,354,150,T.wallHi);
   rect(23,16,350,146,T.panel);
   rect(23,16,350,2,T.border);
   rect(26,37,344,1,T.wallHi);
   label('EVENTMATIC ARCADE CLUB',198,24,1,T.ink);
   for(var i=0;i<4;i++){
    rect(40+i*8,75-i*8,8,3,i===3?T.gold:T.wallHi);
    rect(348-i*8,75-i*8,8,3,i===3?T.gold:T.wallHi);
   }
   titleArt();
   rect(36,147,324,14,T.bg);
   label('GOOD FRIENDS. BAD INFLUENCE.',198,151,1,T.muted);
   var modes=titleModes(d.mode);
   label('↑ / ↓  OR  1 / 2  -  MODE',198,234,1,T.muted,294,8);
   rect(23,248,350,190,'#120e23');
   rect(24,248,348,2,T.wallHi);
   rect(24,436,348,2,T.wallHi);
   titleCast=[];
   titlePose=0;
   if(solo)titlePlayer(d,198,0,picks);
   else{
    titlePlayer(d,105,1,picks);
    titlePlayer(d,291,0,picks);
    rect(197,258,2,50,T.wall);
    rect(197,344,2,83,T.wall);
    rect(176,313,44,26,T.gold);
    rect(172,318,52,16,T.gold);
    rect(176,316,44,20,T.panel);
    label('VS',198,319,2,T.gold,38,14);
   }
   rect(62,455,276,41,'#120e23');
   rect(60,452,276,41,T.gold);
   rect(63,455,270,35,'#efab49');
   rect(64,456,268,30,T.gold);
   rect(82,462,50,19,T.bg);
   label('ENTER',107,468,1,T.ink,46,8);
   label('START GAME',220,465,2,T.bg,168,14);
   actions.push({id:'start',label:'Enter - Start Game',x:60,y:452,w:276,h:41});
   modes.concat(picks).forEach(function(item){actions.push(item);});
   actions.push(secondary(500,'H - HOW TO PLAY','help',126));
   summary='小朋友SHOT樓梯. '+(solo?'1 player solo: '+d.names[0]:'2 players versus: '+d.names[1]+' and '+d.names[0])+'. Up / Down or 1 / 2 changes mode. Enter to start. H for optional How to Play.'+(d.pick?(solo?' Change character: '+keys(d.cfg.players.p1.keys)+'.':' Change characters: 2P '+keys(d.cfg.players.p2.keys)+', 1P '+keys(d.cfg.players.p1.keys)+'.'):'');
  }
  function paintTitle(context){
   context.drawImage(layer,0,0);
   for(var player of titleCast){
    var anim=player.hero.skin && player.hero.skin.anim;
    context.save();
    context.translate(player.x,player.y);
    context.scale(2,2);
    if(anim && anim.frames.idle && anim.frames.idle.length){
     var frame=anim.frames.idle[titlePose%anim.frames.idle.length];
     context.drawImage(anim.img,frame*anim.fw,0,anim.fw,anim.fh,-anim.anchorX,-anim.bottom,anim.fw,anim.fh);
    }else player.portrait(context,player.hero,0,0);
    context.restore();
   }
  }
  function stopTitle(){
   if(titleTimer!==null){global.clearInterval(titleTimer);titleTimer=null;}
   titleCast=[];
  }
  function fmt(s,v){return String(s||'').replace(/\{(\w+)\}/g,function(_,k){return v[k]===undefined?'':v[k];});}
  function keys(k){return [k.left,k.right].map(function(x){return String(x).replace('Key','').replace('ArrowLeft','←').replace('ArrowRight','→');}).join('  ');}
  function formula(d){var p=d.cfg.penalty;if(typeof p.compute==='function')return 'CUSTOM CONFIGURED PENALTY RULE';var s='EVERY '+(p.floorsPerStep>0?p.floorsPerStep:15)+' FLOORS = '+d.format(p.shotsPerStep)+' '+p.unit;if(p.maxShots!==null&&p.maxShots!==undefined&&isFinite(p.maxShots))s+=' / CAP '+d.format(p.maxShots);return s;}
  function sync(actions){var scale=canvas.clientWidth/396;root.style.left=canvas.offsetLeft+'px';root.style.top=canvas.offsetTop+'px';root.style.width=canvas.clientWidth+'px';root.style.height=canvas.clientHeight+'px';
   buttons.forEach(function(b,i){var a=actions[i];if(!a){if(document.activeElement===b)canvas.focus({preventScroll:true});b.hidden=true;b.disabled=true;return;}b.hidden=false;b.disabled=false;b.dataset.action=a.id;b.textContent=a.label;b.setAttribute('aria-label',a.label);if(a.selected===undefined)b.removeAttribute('aria-pressed');else b.setAttribute('aria-pressed',String(a.selected));b.style.left=a.x*scale+'px';b.style.top=a.y*scale+'px';b.style.width=a.w*scale+'px';b.style.height=a.h*scale+'px';});}
  function draw(context,d){
   if(d.state==='playing'){if(lastState!=='playing'){stopTitle();sync([]);key='';}lastState=d.state;return null;}
   if(d.state==='ready'&&lastState!=='ready')view='title';
   var isTitle=d.state==='ready'&&view==='title';
   if(!isTitle)stopTitle();
   root.classList.toggle('shot-title-actions',isTitle);
   var names=d.names,t=d.cfg.text,p=d.cfg.penalty,result=d.result,actions=[];
   var next=[d.state,view,d.count,d.locked,names.join('\n'),d.pick,d.mode,JSON.stringify(t),JSON.stringify(p),typeof p.compute,JSON.stringify(d.cfg.characterSkin),d.cfg.beer.healAmount,keys(d.cfg.players.p1.keys),keys(d.cfg.players.p2.keys),d.total,d.pool,result?JSON.stringify(result):''].join('|');
   if(next!==key){key=next;builds++;layout=[];issues=[];c.clearRect(0,0,396,532);rect(19,61,358,471,T.bg);
    if(isTitle){
     drawTitle(d,actions);
    }else if(d.state==='ready'){
     var soloHelp=d.mode==='solo';box(27,70,342,445);label('HOW TO PLAY',198,88,3,T.ink);
     if(soloHelp){d.portrait(c,d.heroes[0],198,166);label(d.cfg.players.p1.label+' '+names[0],198,177,2,T.p1,200,18);label(keys(d.cfg.players.p1.keys),198,201,2,T.gold,145,17);}
     else{d.portrait(c,d.heroes[1],112,166);d.portrait(c,d.heroes[0],284,166);
     label(d.cfg.players.p2.label+' '+names[1],112,177,2,T.p2,145,18);label(d.cfg.players.p1.label+' '+names[0],284,177,2,T.p1,145,18);label(keys(d.cfg.players.p2.keys),112,201,2,T.gold,145,17);label(keys(d.cfg.players.p1.keys),284,201,2,T.gold,145,17);}
     label('MOVE LEFT / RIGHT',198,226,1,T.muted);rect(46,246,304,1,T.wallHi);
     var rules=soloHelp?['WALK OFF EDGES TO DESCEND.','IT GETS FASTER EVERY 50 FLOORS.','BEER +'+d.cfg.beer.healAmount+' HP. SAFE LANDING +1 HP.','SPIKES -4. CEILING -5. MAX LIFE '+d.maxLife+'.','GAME OVER WHEN YOU DIE OR FALL OFF-SCREEN.']:['WALK OFF EDGES TO DESCEND.','PUSH EACH OTHER. CONTACT DOES NOT HURT.','BEER +'+d.cfg.beer.healAmount+' HP. SAFE LANDING +1 HP.','SPIKES -4. CEILING -5. MAX LIFE '+d.maxLife+'.','FIRST TO DIE OR FALL OFF-SCREEN LOSES.'];rules.forEach(function(s,i){rect(46,263+i*20,3,3,T.accent);label(s,55,261+i*20,1,T.ink,292,18,2,'left');});rect(45,369,306,46,T.bg);var custom=typeof p.compute==='function',caption=custom?'CONFIGURED CUSTOM RULE':'EVERY '+(p.floorsPerStep>0?p.floorsPerStep:15)+(soloHelp?' FLOORS':' COMBINED FLOORS');if(p.maxShots!==null&&p.maxShots!==undefined&&isFinite(p.maxShots))caption+=' / CAP '+d.format(p.maxShots);label(caption,198,377,1,T.muted,294,12);label(custom?'CONFIGURED PENALTY':'+'+d.format(p.shotsPerStep)+' '+p.unit+(soloHelp?' TO YOUR POOL':' TO LOSER'),198,393,2,T.gold,294,18);label('SPACE PAUSE / RESUME     M MUTE',198,431,1,T.muted);actions.push(button(460,'ENTER - START','start'));actions.push(secondary(494,'B - BACK TO TITLE','back',126));
     summary='How to Play. '+(soloHelp?'Solo. '+names[0]+': '+keys(d.cfg.players.p1.keys)+'. ':names[1]+': '+keys(d.cfg.players.p2.keys)+'. '+names[0]+': '+keys(d.cfg.players.p1.keys)+'. ')+rules.join(' ')+' '+formula(d)+'. Enter to start. B returns to title.';
    }else if(d.state==='paused'){
     box(34,163,328,255);label('TAKE A BREATHER',198,180,1,T.muted);label(t.paused,198,206,3,T.ink,300,30);rect(59,247,278,1,T.wallHi);label(fmt(t.totalFloors,{n:d.total}),198,265,2,T.ink,294,23);label(fmt(t.shotPool,{n:d.format(d.pool)}),198,294,2,T.gold,294,24);actions.push(button(333,t.resumeHint,'resume'));actions.push(secondary(385,t.quitHint,'quit'));
     summary=t.paused+'. '+fmt(t.totalFloors,{n:d.total})+'. '+fmt(t.shotPool,{n:d.format(d.pool)})+'. '+t.resumeHint+'. '+t.quitHint;
    }else if(d.state==='quit'){
     box(34,186,328,206);label(t.quitTitle,198,211,2,T.ink,300,28);label(t.quitNote,198,248,1,T.muted,294,19,2);actions.push(button(279,t.quitYes,'confirm'));actions.push(secondary(342,t.quitNo,'cancel',294,2));summary=t.quitTitle+'. '+t.quitNote+'. '+t.quitYes+'. '+t.quitNo;
    }else if(d.state==='countdown'){
     box(88,188,220,197);label(t.countdown,198,211,2,T.ink,198,28);label(d.count,198,249,12,T.gold,198,88);label('BACK TO THE MISCHIEF',198,354,1,T.muted,198,18);summary=t.countdown+' '+d.count;
    }else if(d.state==='over'&&result&&result.mode==='solo'){
     box(30,83,336,408);label('SOLO RUN',198,104,2,T.muted);label(t.gameOver||'GAME OVER',198,139,3,T.ink,304,28);
     ribbon(181,fmt(t.soloRibbon||'{player} - FLOORS COMPLETED',{player:names[0]}));var fl=String(result.floors.total);label(fl,201,224,12,'#100e1c',304,88);label(fl,198,220,12,T.gold,304,88);label(t.soloFloors||'FLOORS',198,321,4,T.gold,304,34);
     rect(51,365,294,1,T.wallHi);var soloShots=d.format(result.penalty),soloUnit=result.penalty===1?p.unit:p.unitPlural;label(fmt(t.soloShots||'SHOT POOL {n} {unit}',{n:soloShots,unit:soloUnit||p.unit}),198,384,1,T.ink,294,18);label('REACHED LEVEL '+(result.level||0),198,406,1,T.muted,294,19);
     if(!d.locked)actions.push(button(436,t.playAgain,'rematch'));else label('ROUND COMPLETE',198,448,1,T.muted);actions.push(rematchLine(t));
     summary='Solo run. '+(t.gameOver||'GAME OVER')+'. '+names[0]+': '+fl+' floors, level '+(result.level||0)+'. Shot pool '+soloShots+' '+(soloUnit||p.unit)+'. '+(!d.locked?t.playAgain:'Rematch available after the existing cooldown.')+' Escape returns to the title.';
    }else if(d.state==='over'&&result){
     box(30,83,336,408);label('ROUND OVER',198,104,2,T.muted);var loser=result.loser?names[result.loser==='p1'?0:1]:'';var outcome=result.loser?fmt(t.loses,{player:loser}):t.draw;
     if(measure(outcome).w*3<=304&&measure(outcome).h===7)label(outcome,198,139,3,T.ink,304,28);
     else if(result.loser&&t.loses==='{player} LOSES!'){var nameH=label(loser,198,121,2,T.ink,304,32,2);label('LOSES!',198,121+nameH+2,2,T.ink,304,16);}
     else label(outcome,198,125,3,T.ink,304,48,2);
     if(!result.loser){var pool=result.shotPool!==undefined?result.shotPool:result.penalty,poolText=d.format(pool),poolUnit=pool===1?p.unit:p.unitPlural,floorsD=result.floors;
      ribbon(181,t.penaltyLabelDraw||'DRAW - REMATCH');label(t.drawShots||'NO SHOTS',201,229,7,'#100e1c',304,50);label(t.drawShots||'NO SHOTS',198,225,7,T.gold,304,50);label(t.drawNote||'NOBODY DRINKS',198,288,3,T.ink,304,24);label(fmt(t.drawPool,{n:poolText,unit:poolUnit||p.unit}),198,330,1,T.muted,294,24,2);
      rect(51,365,294,1,T.wallHi);var detailD=fmt(t.floors,{p1:floorsD.p1,p2:floorsD.p2,total:floorsD.total,n1:names[0],n2:names[1]});var usedD=label(detailD,198,384,1,T.ink,294,36,3);if(usedD<=18)label(t.drawReset||'',198,406,1,T.muted,294,19,2);
      var exact='0',unit=p.unitPlural||p.unit,detail=detailD+'. '+fmt(t.drawPool,{n:poolText,unit:poolUnit||p.unit});
     }else{
     ribbon(181,t.penaltyLabel);var exact=d.format(result.penalty),value=exact.length>10?Number(result.penalty).toExponential(2):exact;label(value,201,224,12,'#100e1c',304,88);label(value,198,220,12,T.gold,304,88);
     var unit=result.penalty===1?p.unit:p.unitPlural;label(unit||p.unit,198,321,4,T.gold,304,34);if(value!==exact)label(exact,198,351,1,T.muted,304,10);
     rect(51,365,294,1,T.wallHi);var floors=result.floors;var detail=fmt(t.floors,{p1:floors.p1,p2:floors.p2,total:floors.total,n1:names[0],n2:names[1]});var used=label(detail,198,384,1,T.ink,294,36,3);if(used<=18)label(typeof p.compute==='function'?formula(d):(p.maxShots!==null&&p.maxShots!==undefined?'MIN('+d.format(p.maxShots)+', ':'')+'FLOOR('+floors.total+' / '+(p.floorsPerStep>0?p.floorsPerStep:15)+') × '+d.format(p.shotsPerStep)+(p.maxShots!==null&&p.maxShots!==undefined?')':'')+' = '+exact,198,406,1,T.muted,294,19,2);
     }
     if(!d.locked)actions.push(button(436,t.playAgain,'rematch'));else label('ROUND COMPLETE',198,448,1,T.muted);actions.push(rematchLine(t));
     summary='Round over. '+outcome+'. '+(result.loser?t.penaltyLabel+': '+exact+' '+unit:(t.penaltyLabelDraw||'DRAW - REMATCH')+'. '+(t.drawShots||'NO SHOTS')+'. '+(t.drawNote||''))+'. '+detail+'. '+(!d.locked?t.playAgain:'Rematch available after the existing cooldown.');
    }
    sync(actions);
   }else{ // Resize may leave content unchanged while CSS hit areas need a new scale.
    var scale=canvas.clientWidth/396;if(root.style.width!==canvas.clientWidth+'px'||root.style.left!==canvas.offsetLeft+'px'||root.style.top!==canvas.offsetTop+'px'){
     root.style.left=canvas.offsetLeft+'px';root.style.top=canvas.offsetTop+'px';root.style.width=canvas.clientWidth+'px';root.style.height=canvas.clientHeight+'px';buttons.forEach(function(b){if(b.hidden)return;var a=b._rect;if(a){b.style.left=a.x*scale+'px';b.style.top=a.y*scale+'px';b.style.width=a.w*scale+'px';b.style.height=a.h*scale+'px';}});
    }
   }
   if(actions.length)actions.forEach(function(a,i){buttons[i]._rect=a;});
   if(isTitle){
    paintTitle(context);
    if(titleTimer===null&&!reducedMotion&&titleCast.some(function(player){return player.hero.skin&&player.hero.skin.anim;})){
     titleTimer=global.setInterval(function(){titlePose++;paintTitle(context);},460);
    }
   }else context.drawImage(layer,0,0);
   lastState=d.state;
   return d.state==='over'&&!d.locked?{x0:65,y0:436,x1:331,y1:468}:null;
  }
  return {draw:draw,hide:function(){if(lastState!=='playing'){stopTitle();sync([]);key='';lastState='playing';}},view:function(v){if(v)view=v;return view;},finish:function(state){if(state==='playing'){if(hudSummary){if(canvas.getAttribute('aria-label')===ariaOverlay)canvas.setAttribute('aria-label',hudSummary);hudSummary='';ariaOverlay='';}return;}var current=canvas.getAttribute('aria-label');if(current!==ariaOverlay&&current!==summary)hudSummary=current;if(current!==summary)canvas.setAttribute('aria-label',summary);ariaOverlay=summary;},stats:function(){return {builds:builds,textCache:texts.size,glyphCache:glyphs.size,listeners:2,buttons:buttons.length,view:view,summary:summary,layout:layout.slice(),issues:issues.slice()};},destroy:function(){stopTitle();root.removeEventListener('click',click);document.removeEventListener('keydown',helpKey);root.remove();style.remove();texts.clear();glyphs.clear();}};
 }
 global.ShotScreens={create:create};
})(window);
