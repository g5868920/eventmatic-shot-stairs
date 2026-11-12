/* Real production renderer; deterministic staged world for screenshot comparison only. */
function scene(w){w.requestAnimationFrame=()=>0;w.Game.reset();const world=w.Game._debugWorld(),T=w.Game._debugTypes;world.floors.length=0;const defs=[['FAKE_FLOOR',62,112],['ROLLING_LEFT',216,172],['Floor',46,232],['SPRING',146,292],['ROLLING_RIGHT',236,352],['ARROW_FLOOR',60,412],['FAKE_FLOOR',228,472],['Floor',100,532]];
 for(let i=0;i<defs.length;i++){const [type,x,y]=defs[i],f=new T[type](x,y);if(type!=='ARROW_FLOOR'&&i%3===0)f.beer=true;world.floors.push(f);}
 for(let i=0;i<2;i++){const h=world.heroes[i];h.x=i?72:260;h.y=i?220:340;h.vx=h.vy=h.direction=0;h.life=i?9:7;h.floors=i?16:18;h.onFloor=world.floors[i?2:4];}
 return world;
}

addEventListener('load',function(){function ready(){if(!window.ShotStairs||!Game._debugWorld().heroes?.length){setTimeout(ready,20);return;}Game.configure({players:{p1:{name:'小蕊'},p2:{name:'吉娜'}}});var world=scene(window);Game._debugFrame(1000);if(new URLSearchParams(location.search).has('effects')){var fx=Game._debugVisuals();world.heroes[0].x=world.heroes[1].x+26;world.heroes[0].y=world.heroes[1].y;world.heroes[0].onFloor=world.heroes[1].onFloor;world.heroes[0].floors=22;world.heroes[1].floors=18;fx.beer(world.heroes[1],3,1000);fx.damage(world.heroes[0],4,1000);fx.spring(world.floors[3],1000);fx.flip(world.floors[0],1000);Game._debugFrame(1010);Game._debugFrame(1020);}document.body.dataset.capture='ready';}ready();});
