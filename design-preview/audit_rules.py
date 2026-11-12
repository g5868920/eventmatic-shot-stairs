#!/usr/bin/env python3
"""Read-only audit of production defaults used by the standalone preview.
Run from any directory. --write refreshes only design-preview/rules-audit.json.
It never imports, executes, or writes production scripts.
"""
import hashlib,json,re,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
game=(root/'game.js').read_text();config=(root/'config.js').read_text();preview=(root/'design-preview/preview.js').read_text()
def number(text,pattern):
 match=re.search(pattern,text);assert match,pattern
 return float(match.group(1))
def block(name):return re.search(r'\n  '+name+r': \{([\s\S]*?)\n  \}',config).group(1)
beer=number(block('beer'),r'healAmount:\s*(\d+)');step=number(block('penalty'),r'floorsPerStep:\s*(\d+)');shots=number(block('penalty'),r'shotsPerStep:\s*([\d.]+)')
maximum=number(game,r'var MAX_LIFE = (\d+)');spike=number(game[game.index('var ARROW_FLOOR'):],r'hero.hurt\((\d+), time\)');ceiling=number(game[game.index('function checkHittingTop'):],r'hero.hurt\((\d+), time\)')
assert '++this.life' in game and 'Math.min(MAX_LIFE, this.life + num)' in game
landing=game[game.index('landing : function'):game.index('standing : function')]
assert landing.index('hero.regain()')<landing.index('onLand(hero, this)')
assert 'hero.heal(CONFIG.beer.healAmount)' in game
assert 'p.compute' in game and 'Math.floor(Math.max(0, totalFloors) / stepFloors) * stepShots' in game
assert re.search(r'maxShots:\s*null',block('penalty'))
assert re.search(r'compute:\s*null',block('penalty'))
expected={'beer':beer,'landing':1,'maxLife':maximum,'spike':spike,'ceiling':ceiling,'floorsPerStep':step,'shotsPerStep':shots}
for key,value in expected.items():assert number(preview,r'\b'+key+r':([\d.]+)')==value,(key,value)
for pattern,value in [(r'var MARGIN_TOP = (\d+)',52),(r'var STAGE_WIDTH = (\d+)',360),(r'var WALL_WIDTH = (\d+)',18),(r'var MAX_LIFE = (\d+)',12),(r'var SPRING_TIME = (\d+)',100),(r'FAKE_FLOOR_TIME = (\d+)',300)]:assert number(game,pattern)==value
assert number(block('platform'),r'width:\s*(\d+)')==80
assert "left: 'ArrowLeft', right: 'ArrowRight'" in config and "left: 'KeyZ', right: 'KeyC'" in config
assert "hero.hurt(5, time)" in game and 'hero.hurt(4, time)' in game
report={'production_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'sources':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in ['config.js','game.js']},'defaults':expected,'sample':{'floors':34,'shotPool':(34//step)*shots,'beerLanding':{'before':8,'afterLanding':9,'afterBeer':12,'landingDelta':1,'beerDelta':3,'totalDelta':4},'clampedLanding':{'before':9,'afterLanding':10,'afterBeer':12,'beerDelta':2,'totalDelta':3},'spike':{'before':7,'after':3}},'notes':['Default configuration; URL/runtime overrides can change beer amount and penalty settings.','Safe landing regain() precedes onLand() beer healing. +4 can mean +1 landing plus +3 beer; a beerHeal=4 override is also possible.','All health is clamped to 12. Actual beer popup delta must be measured after landing regain.','This audit reads source and verifies the preview snapshot; it does not execute production physics.']}
path=root/'design-preview/rules-audit.json'
if '--write' in sys.argv:path.write_text(json.dumps(report,indent=2)+'\n')
else:
 saved=json.loads(path.read_text())
 for key in ['sources','defaults','sample']:assert saved[key]==report[key],f'Stale snapshot: {key}. Review changes before --write.'
print('PASS: displayed defaults, source hashes, landing/beer ordering, clamping, 34-floor penalty, damage, geometry and control mappings.')
