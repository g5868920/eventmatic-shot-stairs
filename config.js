/**
 * SHOT the Stairs — tunable settings.
 *
 * Everything the event host may want to change lives here. Values can also be
 * overridden per session with URL query parameters, e.g.
 *   index.html?floorsPerStep=10&shotsPerStep=0.5&maxShots=5&platformWidth=80&beerChance=0.2&beerHeal=4
 * or at runtime through window.ShotStairs.configure({...}) (see docs/INTEGRATION.md).
 *
 * Nothing in here requires actual drinking: the "penalty" is just a number
 * and a label that the HUD and the end-of-round screen display.
 */
window.SHOT_CONFIG = {
  players: {
    // Key names are KeyboardEvent.code values. Controls belong to the player, not to a screen side.
    // 1P: blue cap / green shirt, starts on the right. 2P: red cap / pink shirt, starts on the left.
    // `sheet` may point to a 256x64 PNG with the same frame layout as assets/kid-p1.png
    // to swap a player's character (see docs/CHARACTERS.md). null = default art.
    p1: { label: '1P', keys: { left: 'ArrowLeft', right: 'ArrowRight' }, sheet: null },
    p2: { label: '2P', keys: { left: 'KeyZ', right: 'KeyC' }, sheet: null }
  },

  // Character look (visual only; physics, controls and hitboxes never change).
  //   mode 'classic': the default capped kids.  mode 'custom': portrait sprites (prototype).
  //   height: rendered height in game px (built sizes: 32, 40, 48).  p1 / p2: which portrait.
  //   flip: mirror the portrait when the player last walked left.
  // URL override for testing: index.html?skin=custom&skinHeight=40  (or ?skin=classic)
  //   animated: use the animated sheets (assets/characters/custom/<name>-anim.png) when they exist.
  characterSkin: { mode: 'custom', height: 48, p1: 'rae', p2: 'gina', flip: true, animated: true },

  platform: {
    // Width of every generated platform in px (playable area is 360 px). Applied from the next round.
    width: 80,
    // The two-player start floor is at least this wide so both players spawn safely side by side.
    startMinWidth: 80,
    // Keep each new platform within falling reach of the one above it (prevents impossible gaps).
    guaranteeReach: true
  },

  // Visual skins per platform mechanic. Appearance only: changing a skin never
  // changes how a platform behaves. Available: 'stone', 'blueBrick', 'steelSpikes'.
  skins: {
    normal: 'blueBrick',   // stable floor
    spring: 'spring',
    conveyorLeft: 'conveyorLeft',
    conveyorRight: 'conveyorRight',
    spike: 'steelSpikes',
    fake: 'stone'          // flipping / temporary floor
  },

  beer: {
    // Probability (0..1) that a newly generated floor carries a beer mug.
    spawnChance: 0.12,
    // Life restored when a player lands on a floor that has a mug (life is capped at 12).
    healAmount: 3,
    // When true, mugs never spawn on spike floors.
    onlySafeFloors: true
  },

  penalty: {
    // shots = floor((1P floors + 2P floors) / floorsPerStep) * shotsPerStep
    // Default: 10 floors = 0.5 shot, 20 = 1, 30 = 1.5, 40 = 2 ... Starts at 0.
    floorsPerStep: 10,
    shotsPerStep: 0.5,
    // Optional cap on the shots (null = no cap).
    maxShots: null,
    // Optional custom formula; receives totalFloors and must return a number.
    // compute: function (totalFloors) { return Math.floor(totalFloors / 10) * 0.5; },
    compute: null,
    unit: 'shot',
    unitPlural: 'shots'
  },

  text: {
    loses: '{player} LOSES',
    draw: 'DRAW',
    floors: '1P {p1} + 2P {p2}\n= {total} FLOORS',
    penalty: 'PENALTY: {n} {unit}',
    playAgain: 'play again',
    resume: 'continue'
  }
};

// Optional URL overrides for quick tuning without editing this file.
(function () {
  try {
    var q = new URLSearchParams(window.location.search);
    var c = window.SHOT_CONFIG;
    var num = function (key, set) {
      if (q.has(key) && isFinite(parseFloat(q.get(key)))) set(parseFloat(q.get(key)));
    };
    num('beerChance', function (v) { c.beer.spawnChance = v; });
    num('beerHeal', function (v) { c.beer.healAmount = v; });
    num('floorsPerStep', function (v) { c.penalty.floorsPerStep = v; });
    num('shotsPerStep', function (v) { c.penalty.shotsPerStep = v; });
    num('maxShots', function (v) { c.penalty.maxShots = v; });
    num('platformWidth', function (v) { c.platform.width = v; });
    if (q.has('skin')) { c.characterSkin.mode = q.get('skin'); }
    num('skinHeight', function (v) { c.characterSkin.height = v; });
    if (q.has('animated')) { c.characterSkin.animated = q.get('animated') !== '0'; }
    if (q.has('unit')) { c.penalty.unit = q.get('unit'); c.penalty.unitPlural = q.get('unitPlural') || q.get('unit') + 's'; }
  } catch (e) { /* ignore malformed URLs */ }
})();
