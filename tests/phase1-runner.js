/* Browser-driven verification of actual engine and actual canvas/audio APIs. */
'use strict';
const frame=document.querySelector('#game'),status=document.querySelector('#status'),result=document.querySelector('#result');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function load(target){
 const loaded=new Promise(resolve=>frame.onload=resolve);
 frame.src=(target==='baseline'?'/__baseline__/':'/')+'index.html?audioFiles=0';
 await loaded;
 const w=frame.contentWindow;
 for(let n=0;n<150&&(!w.ShotStairs||!w.ShotAudio||!w.Game?._debugWorld()?.heroes?.length);n++)await wait(50);
 if((!w.ShotStairs||!w.ShotAudio||!w.Game?._debugWorld()?.heroes?.length))throw Error('Game assets did not finish loading');
 return w;
}
async function save(name,data){await fetch('/__report__',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,...data})});}
async function regression(target){
 const suites=['rules-tests','push-tests','audio-tests','music-tests','sfx-extra-tests','pause-tests','headless-play'];const report=[];
 if(target==='current')suites.push('phase1-visual-tests');
 for(const suite of suites){status.textContent=target+' / '+suite;const w=await load(target),tables=[];w.console.table=x=>tables.push(x);
  const source=await(await fetch('/tests/'+suite+'.js')).text();let rows;
  try {const value=await w.eval(source);rows=Array.isArray(value)?value:tables.at(-1);if(suite==='headless-play')rows=rows.map(x=>({test:'bot round '+x.round,pass:!!x.freshStart&&Number.isFinite(x.penalty),detail:x}));if(!Array.isArray(rows))throw Error('No result rows');}
  catch(e){rows=[{test:suite,pass:false,detail:e.stack}];}
  report.push({suite,rows});result.textContent=JSON.stringify(report,null,2);await save(target+'-regressions',{report});
 }
 const rows=report.flatMap(x=>x.rows);return {checks:rows.length,passed:rows.filter(x=>x.pass).length,failures:rows.filter(x=>!x.pass),report};
}
function seeded(w){let seed=0x51a17;w.Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};return()=>seed;}
function snapshot(w){const world=w.Game._debugWorld(),T=w.Game._debugTypes;return {state:w.Game.getState(),floors:world.floors.map(f=>{let type='Floor';for(const k of ['SPRING','ROLLING_LEFT','ROLLING_RIGHT','FAKE_FLOOR','ARROW_FLOOR'])if(f instanceof T[k])type=k;return [type,f.x,f.y,f.width,f.seq,f.getHeight(),f.spring,f.restoring,f.touchTime,f.leavingTime,f.flipAnnounced];}),heroes:world.heroes.map(h=>[h.id,h.x,h.y,h.vx,h.vy,h.direction,h.life,h.floors,h.beers,world.floors.indexOf(h.onFloor),h.frameTime,h.frameIndex,h.blink,h.blinkTime,h.facing,h.hurtTime,h.landTime])};}
async function deterministic(target){
 const w=await load(target),rng=seeded(w),events=[];w.requestAnimationFrame=()=>0;w.performance.now=()=>1000;
 for(const name of ['gameStart','hurt','beer','spring','flip','roundEnd','playerDown','pause','resume','roundAbandoned'])w.Game.on(name,(...args)=>events.push([name,args]));
 const trace=[];let raw=1000;
 function key(code,type){w.dispatchEvent(new w.KeyboardEvent(type||'keydown',{code,bubbles:true,cancelable:true}));}
 const T=w.Game._debugTypes;
 for(const kind of ['Floor','ROLLING_LEFT','ROLLING_RIGHT','SPRING','FAKE_FLOOR','ARROW_FLOOR']){
  w.Game.reset();const world=w.Game._debugWorld();world.floors.length=0;const f=new T[kind](40,420);f.width=140;f.beer=kind!=='ARROW_FLOOR';world.floors.push(f);
  for(let i=0;i<2;i++){const h=world.heroes[i];h.x=60+i*40;h.y=407;h.onFloor=null;h.vx=h.vy=0;h.life=i?9:8;}
  key('ArrowRight');key('KeyZ');
  for(let n=0;n<160;n++){if(n===40){key('ArrowRight','keyup');key('KeyZ','keyup');}w.Game._debugFrame(raw+=20);trace.push(snapshot(w));}
 }
 for(let round=0;round<8;round++){w.Game.reset();for(let n=0;n<240;n++){if(n%20===0){key(n%40?'ArrowLeft':'ArrowRight');key(n%40?'KeyC':'KeyZ');}if(n%20===19){for(const k of ['ArrowLeft','ArrowRight','KeyC','KeyZ'])key(k,'keyup');}w.Game._debugFrame(raw+=20);trace.push(snapshot(w));}}
 // Pause/countdown must freeze the same world and timers.
 w.Game.reset();for(let n=0;n<20;n++)w.Game._debugFrame(raw+=20);key('Space');key('Space','keyup');for(let n=0;n<100;n++){w.Game._debugFrame(raw+=20);trace.push(snapshot(w));}key('Space');key('Space','keyup');for(let n=0;n<165;n++){w.Game._debugFrame(raw+=20);trace.push(snapshot(w));}
 const data={trace,events,rng:rng()};await save(target+'-trace',data);
 if(target==='current'){const before=await(await fetch('/__evidence__/baseline-trace.json')).json();let mismatch=-1;for(let i=0;i<Math.max(before.trace.length,trace.length);i++)if(JSON.stringify(before.trace[i])!==JSON.stringify(trace[i])){mismatch=i;break;}return {samples:trace.length,identical:mismatch<0&&JSON.stringify(events)===JSON.stringify(before.events)&&data.rng===before.rng,firstMismatch:mismatch,eventsEqual:JSON.stringify(events)===JSON.stringify(before.events),rngEqual:data.rng===before.rng,before:mismatch>=0?before.trace[mismatch]:null,after:mismatch>=0?trace[mismatch]:null};}
 return {samples:trace.length,events:events.length,rng:data.rng};
}
function scene(w){w.requestAnimationFrame=()=>0;w.Game.reset();const world=w.Game._debugWorld(),T=w.Game._debugTypes;world.floors.length=0;const defs=[['FAKE_FLOOR',62,112],['ROLLING_LEFT',216,172],['Floor',46,232],['SPRING',146,292],['ROLLING_RIGHT',236,352],['ARROW_FLOOR',60,412],['FAKE_FLOOR',228,472],['Floor',100,532]];
 for(let i=0;i<defs.length;i++){const [type,x,y]=defs[i],f=new T[type](x,y);if(type!=='ARROW_FLOOR'&&i%3===0)f.beer=true;world.floors.push(f);}
 for(let i=0;i<2;i++){const h=world.heroes[i];h.x=i?72:260;h.y=i?220:340;h.vx=h.vy=h.direction=0;h.life=i?9:7;h.floors=i?16:18;h.onFloor=world.floors[i?2:4];}
 return world;
}
async function visual(target){const w=await load(target);w.Game.configure({players:{p1:{name:'小蕊'},p2:{name:'吉娜'}}});scene(w);w.Game._debugFrame(1000);return {ready:true,canvas:'integrated engine; real draw routines, deterministic staged world'};}
async function focused(target){const w=await load(target),source=await(await fetch('/tests/phase1-visual-tests.js')).text();const rows=await w.eval(source);return {checks:rows.length,passed:rows.filter(x=>x.pass).length,failures:rows.filter(x=>!x.pass),rows};}
async function cleanup(target){const w=await load(target);w.requestAnimationFrame=()=>0;let raw=1000;const rows=[],costs=[];
 for(let round=0;round<100;round++){w.Game.reset();w.Game._debugFrame(raw+=1);const world=w.Game._debugWorld(),fx=w.Game._debugVisuals?.();if(fx){fx.damage(world.heroes[0],4,raw);fx.spring(world.floors[0],raw);fx.flip(world.floors[0],raw);}const begin=performance.now();w.Game._debugFrame(raw+=20);costs.push(performance.now()-begin);w.Game.pause();w.Game.quitRound();w.dispatchEvent(new w.KeyboardEvent('keydown',{code:'Enter',bubbles:true}));rows.push(fx?.stats());w.Game.reset();if(fx&&fx.stats().active!==0)throw Error('Effects survived world reset');}
 const fx=w.Game._debugVisuals?.();return {rounds:rows.length,first20FrameMeanMs:costs.slice(0,20).reduce((a,b)=>a+b,0)/20,last20FrameMeanMs:costs.slice(-20).reduce((a,b)=>a+b,0)/20,clean:rows.every(x=>x?.active===0&&x?.retainedAnchors===0&&x?.listeners===0),first:rows[0],last:rows.at(-1),final:fx?.stats()};}
async function performanceRun(target){const w=await load(target);w.requestAnimationFrame=()=>0;let raw=1000,frames=0;if(target==='current'){for(let n=0;n<100;n++){scene(w);w.Game._debugFrame(raw+=20);}}const costs=[],intervals=[],blocks=[];let previous=0;const start=performance.now();let lastReset=0;
 await new Promise(resolve=>{function tick(ts){const now=performance.now();if(now-start>18000){resolve();return;}if(previous)intervals.push(ts-previous);previous=ts;if(now-lastReset>900){scene(w);lastReset=now;}
 const fx=w.Game._debugVisuals?.(),world=w.Game._debugWorld();if(fx&&frames%8===0){for(let j=0;j<8;j++){const h=world.heroes[j%2],f=world.floors[j%world.floors.length];fx.damage(h,4,raw);fx.spring(f,raw);fx.flip(f,raw);fx.beer(h,3,raw);}}
 const begin=performance.now();w.Game._debugFrame(raw+=16.6667);costs.push(performance.now()-begin);frames++;parent.requestAnimationFrame(tick);}parent.requestAnimationFrame(tick);});
 const sorted=[...costs].sort((a,b)=>a-b),pct=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];for(let n=0;n<costs.length;n+=180)blocks.push(costs.slice(n,n+180).reduce((a,b)=>a+b,0)/Math.min(180,costs.length-n));
 return {target,frames,seconds:(performance.now()-start)/1000,fps:1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length),renderFrameMs:{median:pct(.5),p95:pct(.95),p99:pct(.99),max:Math.max(...costs)},intervalOver25ms:intervals.filter(x=>x>25).length,meanMsBy180Frames:blocks,visibility:document.visibilityState,viewport:[w.innerWidth,w.innerHeight],canvasSize:[w.document.querySelector('canvas').getBoundingClientRect().width,w.document.querySelector('canvas').getBoundingClientRect().height],fx:w.Game._debugVisuals?.()?.stats()};
}
async function projectorPerformance(target){document.body.classList.add('perf-projector');try{return await performanceRun(target);}finally{document.body.classList.remove('perf-projector');}}
for(const b of document.querySelectorAll('button[data-task]'))b.onclick=async()=>{for(const x of document.querySelectorAll('button'))x.disabled=true;const {target,task}=b.dataset;status.textContent=target+' '+task+' running';try{const output=await ({regression,deterministic,performance:performanceRun,visual,cleanup,focused,projectorPerformance}[task])(target);await save(target+'-'+task,output);result.textContent=JSON.stringify(output,null,2);status.textContent=target+' '+task+' complete';}catch(e){result.textContent=e.stack;status.textContent='FAILED '+target+' '+task;await save(target+'-'+task,{error:e.stack});}finally{for(const x of document.querySelectorAll('button'))x.disabled=false;}};
