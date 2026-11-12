/* Phase 1 cosmetic integration assertions. Uses actual engine hooks and pixels. */
(async function () {
 'use strict';
 window.requestAnimationFrame=function(){return 0;};
 var raw=1000,rows=[],fx=Game._debugVisuals(),T=Game._debugTypes;
 function check(test,pass,detail){rows.push({test:test,pass:!!pass,detail:detail});}
 function step(n){for(var i=0;i<n;i++)Game._debugFrame(raw+=20);}
 function landing(life){Game.reset();var w=Game._debugWorld();w.floors.length=0;var f=new T.Floor(30,420);f.width=260;f.beer=true;w.floors.push(f);w.heroes[0].x=60;w.heroes[0].y=407;w.heroes[0].life=life;w.heroes[0].onFloor=null;w.heroes[0].vy=0;w.heroes[1].x=220;w.heroes[1].y=407;w.heroes[1].life=12;w.heroes[1].onFloor=null;w.heroes[1].vy=0;step(3);return w;}
 var w=landing(8),s=fx.stats();check('beer: landing +1 and beer +3, life 8→12',w.heroes[0].life===12&&s.lastLandDelta===1&&s.lastBeerDelta===3,s);
 w=landing(9);s=fx.stats();check('beer clamp: landing +1 and beer +2, life 9→12',w.heroes[0].life===12&&s.lastBeerDelta===2,s);
 w.heroes[0].hurt(4,raw);check('damage label observes actual HP delta',w.heroes[0].life===8&&fx.stats().lastDamageDelta===4,fx.stats());
 // Cosmetic contact observer never changes the supplied objects.
 fx.reset();var a={x:20,y:200},b={x:46,y:200},before=JSON.stringify([a,b]),bursts=fx.stats().pushBursts;
 for(var i=0;i<180;i++)fx.contact(a,b,raw+i);check('180 sustained contact samples emit once',fx.stats().pushBursts===bursts+1&&JSON.stringify([a,b])===before,fx.stats());
 b.x=60;fx.contact(a,b,raw);b.x=46;fx.contact(a,b,raw);check('separation rearms contact feedback',fx.stats().pushBursts===bursts+2,fx.stats());
 fx.reset();for(i=0;i<160;i++){fx.damage(w.heroes[0],4,raw);fx.spring(w.floors[0],raw);fx.flip(w.floors[0],raw);fx.beer(w.heroes[0],2,raw);}
 check('640 concurrent emissions stay bounded to 32 slots',fx.stats().active===32&&fx.stats().capacity===32&&fx.stats().listeners===0,fx.stats());
 Game.reset();check('reset clears effects, contact latch and anchored references',fx.stats().active===0&&fx.stats().retainedAnchors===0&&!fx.stats().contactHeld,fx.stats());
 w=Game._debugWorld();fx.beer(w.heroes[0],3,raw);Game.quitRound();check('quit clears all cosmetic state',Game.getState().state==='ready'&&fx.stats().active===0&&fx.stats().retainedAnchors===0,fx.stats());
 Game.reset();step(20);w=Game._debugWorld();fx.beer(w.heroes[0],3,raw);var count=fx.stats().active;Game.pause();step(250);check('pause freezes cosmetic lifetime',fx.stats().active===count,fx.stats());
 Game.resume();step(145);check('countdown also freezes cosmetic lifetime',fx.stats().active===count,fx.stats());step(10);check('resume preserves the unexpired cue',fx.stats().active>0,fx.stats());
 Game.configure({players:{p1:{name:'小蕊'},p2:{name:'吉娜'}}});Game.reset();step(1);var cv=document.querySelector('#content canvas');check('CJK HUD names rasterize through the cache',fx.stats().glyphCache>=4&&cv.getAttribute('aria-label').includes('吉娜'),fx.stats());
 var values=[0,.5,1,1.5,12345678901234567890],hud=[];
 for(i=0;i<values.length;i++){var val=values[i];Game.configure({penalty:{compute:(function(n){return function(){return n;};})(val),unit:'cup',unitPlural:'cups'}});step(1);hud.push(cv.getAttribute('aria-label'));}
 check('configured SHOT quantity and units reach HUD without changing calculation',hud.every(function(x,i){return x.includes(Game.formatShots(values[i]))&&x.includes(values[i]===1?'CUP':'CUPS');}),hud);
 Game.configure({penalty:{compute:function(){return 1.75;},maxShots:1.5}});step(1);check('custom penalty cap stays authoritative',Game.computePenalty(34)===1.5&&cv.getAttribute('aria-label').includes('1.5 CUPS'),cv.getAttribute('aria-label'));
 // Existing directional draw routines remain distinct in actual pixel output.
 var c1=document.createElement('canvas'),c2=document.createElement('canvas');c1.width=c2.width=80;c1.height=c2.height=12;
 new T.ROLLING_LEFT(0,12).draw(c1.getContext('2d'));new T.ROLLING_RIGHT(0,12).draw(c2.getContext('2d'));
 check('both conveyor directions have distinct B pixels',c1.toDataURL()!==c2.toDataURL(),'left/right arrows retained');
 Game.configure({penalty:{compute:null,maxShots:null,unit:'shot',unitPlural:'shots'}});Game.reset();step(1);
 window.__phase1Results=rows;console.table(rows);return rows;
})();
