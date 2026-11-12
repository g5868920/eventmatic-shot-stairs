#!/usr/bin/env python3
"""Prove the L3 change leaves Phase 1 rendering, mechanics, controls and assets intact."""
import hashlib,json,re,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
base=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/shot-phase2/baseline')
old=(base/'game.js').read_text();new=(root/'game.js').read_text()
# Use the existing scope verifier's source parser without executing its Phase 1 assertions.
parser=(root/'tools/verify_phase1_scope.py').read_text()
exec(parser[parser.index('def body('):parser.index('immutable=')])
files=['arcade-visuals.js','sprites.js','config.js','audio.js','eventmatic-bridge.js']
files += [str(p.relative_to(base)) for directory in ['assets','design-preview','tests'] for p in (base/directory).rglob('*') if p.is_file() and str(p.relative_to(base))!='design-preview/rules-audit.json']
for name in files:assert (root/name).read_bytes()==(base/name).read_bytes(),'Protected file changed: '+name
functions=sorted(set(re.findall(r'function (\w+)\s*\(',old))-{'drawAll','init','resizeCanvas'})
for name in functions:assert named(old,name)==named(new,name),'Protected function changed: '+name
start=old.index('//regist control');end=old.index('function customSkinMeta')
assert old[start:end]==new[new.index('//regist control'):new.index('function customSkinMeta')],'Input/focus/touch handlers changed'
start=old.index('var Hero =');end=old.index('regain : function')
assert old[start:end]==new[new.index('var Hero ='):new.index('regain : function')],'Character drawing/animation changed'
assert old[old.index('Game.launch ='):old.index('// SHOT: live world objects')]==new[new.index('Game.launch ='):new.index('// SHOT: live world objects')],'Public lifecycle/config/state APIs changed'
module=(root/'arcade-screens.js').read_text()
for token in ['setTimeout(', 'setInterval(', 'requestAnimationFrame(', 'Math.random(', 'Game.on(', 'Game.configure(', 'Game.reset(']:assert token not in module,'L3 owns forbidden timer/subscription/gameplay mutation: '+token
assert module.count("addEventListener('")==2,'Unexpected L3 listener count'
print(json.dumps({'rollbackCommit':'a35ec89cd0e2cea1b223d2f8b0e59f370839d086','baselineArchive':str(base),'protectedFiles':len(files),'protectedFunctions':len(functions),'L1L2':'byte-identical','physicsAndStateTransitions':'byte-identical','characterDrawingAnimation':'byte-identical','controlsFocusTouch':'byte-identical','publicAPIs':'byte-identical','L3Listeners':2,'L3TimersRngGameSubscriptions':0,'allowedGameFunctions':['drawAll: route L3 drawing','init: create renderer/actions once','resizeCanvas: redraw ready screen after resize'],'hashes':{name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in ['game.js','index.html','arcade-screens.js','arcade-visuals.js','sprites.js']}},indent=2))
