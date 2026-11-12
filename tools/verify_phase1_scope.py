#!/usr/bin/env python3
"""Verify Phase 1's production/Phase 2 boundary against a git-archive baseline."""
import hashlib,json,re,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
base=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/shot-phase1/baseline')
old=(base/'game.js').read_text();new=(root/'game.js').read_text()
def body(source,pattern):
 m=re.search(pattern,source);assert m,pattern
 start=source.index('{',m.start());depth=0;quote=None;comment=None;i=start
 while i<len(source):
  ch=source[i];pair=source[i:i+2]
  if comment=='line':
   if ch=='\n':comment=None
  elif comment=='block':
   if pair=='*/':comment=None;i+=1
  elif quote:
   if ch=='\\':i+=1
   elif ch==quote:quote=None
  elif pair=='//':comment='line';i+=1
  elif pair=='/*':comment='block';i+=1
  elif ch in "'\"`":quote=ch
  elif ch=='{':depth+=1
  elif ch=='}':
   depth-=1
   if depth==0:return source[m.start():i+1]
  i+=1
 raise AssertionError('Unclosed function '+pattern)
def named(source,name):return body(source,r'function '+name+r'\s*\([^)]*\)\s*\{')
def normalized(s):
 s=re.sub(r'/\*[\s\S]*?\*/|//[^\n]*','',s)
 s=re.sub(r'\s+','',s)
 return s
immutable=['config.js','audio.js','eventmatic-bridge.js','tests/rules-tests.js','tests/push-tests.js','tests/audio-tests.js','tests/music-tests.js','tests/sfx-extra-tests.js','tests/pause-tests.js','tests/headless-play.js']
immutable += [str(p.relative_to(base)) for p in (base/'assets').rglob('*') if p.is_file()]
for p in immutable:assert (base/p).read_bytes()==(root/p).read_bytes(),'Changed protected file: '+p
names=['resolvePlayerPush','updateHeroHorizontalPostion','updateFloorsVerticalPosition','updateHeroVerticalPosition','checkHittingTop','computePenalty','formatShots','buildResult','clearInputs','pauseGame','resumeGame','finishResume','abandonRound','setOverlayState','drawButton','drawPanelFrame','drawPausePanel','drawQuitPanel','drawCountdown','drawHowToPlay','drawResultPanel','drawPortrait','onEvent','offEvent','fireEvent']
for name in names:assert named(old,name)==named(new,name),'Changed protected function: '+name
# The physics loop differs only by two side-effect-free cosmetic observations.
current=named(new,'loop');current=re.sub(r'^\s*if \(arcade\) arcade\.[^\n]+\n','',current,flags=re.M)
assert normalized(current)==normalized(named(old,'loop')),'Physics loop differs beyond cosmetic calls'
# Character draw/animation code remains byte-for-byte identical.
a=old[old.index('var Hero ='):old.index('regain : function')];b=new[new.index('var Hero ='):new.index('regain : function')]
assert a==b,'Character constructor/drawing/animation changed'
# All original controls, focus handlers, asset selection and touch handling are intact.
a=old[old.index('//regist control'):old.index('function customSkinMeta')];b=new[new.index('//regist control'):new.index('function customSkinMeta')]
assert a==b,'Input/focus handlers changed'
module=(root/'arcade-visuals.js').read_text()
for token in ['addEventListener(', 'setTimeout(', 'setInterval(', 'requestAnimationFrame(', 'Math.random(', 'Game.on(']:assert token not in module,'Unexpected visual subscription/timer/RNG: '+token
report={'protectedFiles':len(immutable),'protectedFunctions':len(names),'physicsLoop':'identical after removing cosmetic observation calls','characterDrawingAnimation':'byte-identical','controlsFocusTouch':'byte-identical','visualSubscriptionsTimersRng':'none','phase2Screens':'byte-identical','sourceHashes':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in ['game.js','sprites.js','arcade-visuals.js','index.html']}}
print(json.dumps(report,indent=2))
