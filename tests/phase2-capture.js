/* Capture fixture: actual production renderer/state transitions, no mock UI. */
(async function(){
 const q=new URLSearchParams(location.search),frame=document.querySelector('iframe');await new Promise(r=>{frame.onload=r;frame.src='/index.html?audioFiles=0&mute=1&music=0';});const w=frame.contentWindow;
 for(let n=0;n<100&&!w.Game?._debugScreens();n++)await new Promise(r=>setTimeout(r,50));await new Promise(r=>setTimeout(r,80));w.requestAnimationFrame=()=>0;w.performance.now=()=>1000;const G=w.Game;let raw=1000;
 const key=code=>{w.dispatchEvent(new w.KeyboardEvent('keydown',{code,bubbles:true}));w.dispatchEvent(new w.KeyboardEvent('keyup',{code,bubbles:true}));};const click=id=>w.document.querySelector('[data-action="'+id+'"]').click();
 const name=q.get('names');if(name==='chinese')G.configure({players:{p1:{name:'小蕊'},p2:{name:'吉娜'}}});if(name==='long')G.configure({players:{p1:{name:'小蕊宇宙無敵超級歡樂派對玩家'},p2:{name:'GINA THE EXTRAORDINARILY MISCHIEVOUS PARTY FRIEND'}}});
 const screen=q.get('screen')||'title';
 if(name){G.reset();G._debugFrame(raw);G.quitRound();}
 if(screen==='howto')click('help');
 else if(screen!=='title'){
  G.start();G._debugFrame(raw);const world=G._debugWorld(),T=G._debugTypes;world.floors.length=0;const defs=[['FAKE_FLOOR',62,112],['ROLLING_LEFT',216,172],['Floor',46,232],['SPRING',146,292],['ROLLING_RIGHT',236,352],['ARROW_FLOOR',60,412],['FAKE_FLOOR',228,472],['Floor',100,532]];
  defs.forEach(([type,x,y],i)=>{let f=new T[type](x,y);if(type!=='ARROW_FLOOR'&&i%3===0)f.beer=true;world.floors.push(f);});world.heroes.forEach((h,i)=>{h.x=i?72:260;h.y=i?220:340;h.vx=h.vy=h.direction=0;h.life=i?9:7;h.floors=i?16:18;h.onFloor=world.floors[i?2:4];});G._debugFrame(raw+=20);
  if(screen==='pause'||screen==='quit'||screen==='countdown'){G.pause();if(screen==='quit')key('Escape');if(screen==='countdown'){G.resume();G._debugFrame(raw+=1);if(q.has('digit'))G._debugFrame(raw+=(3-Number(q.get('digit')))*1000);}}
  if(screen==='result'||screen==='rematch'||screen==='draw'){
   let total=Number(q.get('total')||34);G.configure({penalty:{maxShots:q.has('cap')?Number(q.get('cap')):null}});world.heroes[0].floors=Math.floor(total/2);world.heroes[1].floors=total-Math.floor(total/2);world.heroes[0].life=0;if(screen==='draw')world.heroes[1].life=0;G._debugFrame(raw+=20);if(screen!=='result')await new Promise(r=>setTimeout(r,1100));
  }
 }
 const audio=w.ShotAudio?._debug?.()?.ctx;if(audio&&audio.state!=='closed')await audio.close();document.body.dataset.ready='true';document.body.dataset.screen=screen;document.body.dataset.metrics=JSON.stringify({viewport:[w.innerWidth,w.innerHeight],canvas:(()=>{const a=w.document.querySelector('canvas').getBoundingClientRect();return [a.width,a.height]})(),screens:G._debugScreens(),state:G.getState()});
})();
