/**
 * SHOT the Stairs — tunable settings.
 *
 * Everything the event host may want to change lives here. Values can also be
 * overridden per session with URL query parameters, e.g.
 *   index.html?floorsPerDrink=8&beerChance=0.2&beerHeal=4
 * or at runtime through window.ShotStairs.configure({...}) (see docs/INTEGRATION.md).
 *
 * Nothing in here requires actual drinking: the "penalty" is just a number
 * and a label that the end-of-round screen displays.
 */
window.SHOT_CONFIG = {
  players: {
    // Key names are KeyboardEvent.code values.
    // `sheet` may point to a 240x60 PNG with the same frame layout as assets/kid-p1.png
    // to swap a player's character (see docs/CHARACTERS.md). null = default art.
    p1: { label: '1P', keys: { left: 'ArrowLeft', right: 'ArrowRight' }, sheet: null },
    p2: { label: '2P', keys: { left: 'KeyZ', right: 'KeyX' }, sheet: null }
  },

  // Visual skins per platform mechanic. Appearance only: changing a skin never
  // changes how a platform behaves. Available: 'stone', 'blueBrick', 'steelSpikes'.
  skins: {
    normal: 'stone',
    spring: 'spring',
    conveyorLeft: 'conveyorLeft',
    conveyorRight: 'conveyorRight',
    spike: 'steelSpikes',
    fake: 'blueBrick'
  },

  beer: {
    // Probability (0..1) that a newly generated floor carries a beer mug.
    spawnChance: 0.12,
    // Life restored when a player lands on a floor that has a mug (life is capped at 10).
    healAmount: 3,
    // When true, mugs never spawn on spike floors.
    onlySafeFloors: true
  },

  penalty: {
    // totalFloors (1P + 2P) divided by this gives the number of drinks.
    floorsPerDrink: 10,
    // true: round up (11 floors -> 2 drinks); false: round down.
    roundUp: true,
    minDrinks: 1,
    maxDrinks: 10,
    // Optional custom formula; receives totalFloors and must return a number.
    // compute: function (totalFloors) { return Math.ceil(totalFloors / 10); },
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
    num('floorsPerDrink', function (v) { c.penalty.floorsPerDrink = v; });
    num('minDrinks', function (v) { c.penalty.minDrinks = v; });
    num('maxDrinks', function (v) { c.penalty.maxDrinks = v; });
    if (q.has('unit')) { c.penalty.unit = q.get('unit'); c.penalty.unitPlural = q.get('unitPlural') || q.get('unit') + 's'; }
  } catch (e) { /* ignore malformed URLs */ }
})();
