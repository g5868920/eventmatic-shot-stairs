/**
 * SHOT the Stairs — game engine.
 *
 * Based on NS-SHAFT by iPel (https://github.com/iPel/NS-SHAFT, Apache-2.0),
 * original author: pel. See NOTICE and docs/MODIFICATIONS.md for the list of
 * changes. Lines touched by this project are marked with "SHOT:".
 */
;~function(global) {
	'use strict';
	var Game = {};
	global['Game'] = Game;

	/*==================
	 * util functions
	 *==================*/
	/**
	 * extends base with obj
	 * @param base the target object
	 * @param obj a simple object
	 */
	function ext(base, obj) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				base[key] = obj[key]
			}
		}
		return base;
	}

	// SHOT: recursive merge used for runtime configuration
	function deepMerge(base, obj) {
		for (var key in obj) {
			if (!obj.hasOwnProperty(key)) continue;
			var v = obj[key];
			if (v && typeof v === 'object' && !Array.isArray(v) && base[key] && typeof base[key] === 'object') {
				deepMerge(base[key], v);
			} else {
				base[key] = v;
			}
		}
		return base;
	}

	function defineClass(constructor, prototype, superClass) {
		var cz = function() {
			superClass && superClass.apply(this, arguments);
			constructor && constructor.apply(this, arguments);
		};
		prototype = ext(superClass ? new superClass() : {}, prototype);
		prototype.constructor = cz;
		cz.prototype = prototype;
		return cz;
	}

	function loadImage(inMap, onload) {
		var outMap = {}
		var keyArr = [];
		for (var key in inMap) {
			keyArr.push(key);
		}

		var loading = 0;

		var doLoadImage = function(keyArr) {
			if (keyArr.length == 0) {
				setTimeout(function() {
					onload(outMap);
				}, 0);
				return;
			}
			var len = Math.min(5, keyArr.length);
			var nextArr = keyArr.slice(len);
			var next = function() {
				if (--loading == 0) {
					doLoadImage(nextArr);
				}
			}
			loading += len;
			for (var i = 0; i < len; ++i) {
				key = keyArr[i];
				var url = inMap[key];
				var img = new Image();
				outMap[key] = img;
				img.onload = next;
				img.src = url;
			}
		}

		doLoadImage(keyArr);
	}

	function roundRect(context, x, y, w, h, r) {
		if (w < 2 * r) r = w * 0.5;
		if (h < 2 * r) r = h * 0.5;
		context.beginPath();
		context.moveTo(x+r, y);
		context.arcTo(x+w, y,   x+w, y+h, r);
		context.arcTo(x+w, y+h, x,   y+h, r);
		context.arcTo(x,   y+h, x,   y,   r);
		context.arcTo(x,   y,   x+w, y,   r);
		context.closePath();
	}

	function clearNode($node) {
		while ($node.hasChildNodes()) {
			$node.removeChild($node.lastChild);
		}
	}

	var customEvents = {};
	function onEvent(e, fn) {
		var fns = customEvents[e] || (customEvents[e] = []);
		if (fns.indexOf(fn) == -1) {
			fns.push(fn);
		}
	}
	function offEvent(e, fn) {
		var fns = customEvents[e];
		var index;
		if (fns && (index = fns.indexOf(fn)) != -1) {
			fns.splice(index, 1);
		}
	}
	function fireEvent(e) {
		var fns = customEvents[e];
		if (fns) {
			var args = [].slice.call(arguments, 1);
			for (var i = 0, len = fns.length; i < len; ++i) {
				fns[i].apply(Game, args);
			}
		}
	}

	/**
	 * constant
	 */
	var MARGIN_TOP = 52; // SHOT: was 30; HUD band sized to the reference proportions
	var STAGE_WIDTH = 360, STAGE_HEIGHT = 480 + MARGIN_TOP; // playable area, unchanged from upstream
	var WALL_WIDTH = 18; // SHOT: decorative brick walls drawn OUTSIDE the playable area
	var VIEW_WIDTH = STAGE_WIDTH + 2 * WALL_WIDTH; // SHOT: canvas width
	var FLOOR_WIDTH = 80, FLOOR_HEIGHT = 12, FLOOR_DISTANCE = 60; // SHOT: FLOOR_WIDTH was 100 upstream; now the default of CONFIG.platform.width, applied at the start of every round. Each floor keeps its own .width.
	var SPRING_HEIGHT = FLOOR_HEIGHT - 4;
	var HERO_WIDTH = 26;
	var ARROW_HEIGHT = 15, ARROW_WIDTH = 5; // 钉子尺寸

	var FLOOR_VELOCITY_BASE = -0.10; // 地板上升速度
	var GRAVITY_ACC = 0.0015; // 重力加速度
	var SPRINGING_VELOCITY = -0.5; // 离开弹簧时的初速度
	var SPRING_TIME = 100; // 弹簧压缩时间
	var FAKE_FLOOR_TIME = 300, FAKE_FLOOR_TIME2 = 600; // 虚踏板的停留时间, 虚踏板的转动时间
	var ROLLING_VELOCITY = 0.1; // 传送带速度
	var CONTROL_VELOCITY = 0.2; // 左右操作的速度
	var MAX_ACTION_INTERVAL = 20;
	var SPRITE_FRAME = 32; // SHOT: character sheet frame size (art only; collision box stays HERO_WIDTH)
	var MAX_LIFE = 12; // SHOT: 12 segments as in the reference (upstream hard-coded 10); damage values unchanged

	/**
	 * SHOT: configuration (defaults; window.SHOT_CONFIG and Game.configure() override)
	 */
	var CONFIG = {
		players: {
			p1: { label: '1P', keys: { left: 'ArrowLeft', right: 'ArrowRight' } },
			p2: { label: '2P', keys: { left: 'KeyZ', right: 'KeyC' } }
		},
		beer: { spawnChance: 0.12, healAmount: 3, onlySafeFloors: true },
		// SHOT: platform width (px) and the minimum width of the two-player start floor
		platform: { width: 80, startMinWidth: 80, guaranteeReach: true },
		// SHOT: visual skins per mechanic; appearance only, never changes behaviour
		skins: { normal: 'blueBrick', spring: 'spring', conveyorLeft: 'conveyorLeft', conveyorRight: 'conveyorRight', spike: 'steelSpikes', fake: 'stone' },
		sprites: {}, // manifest overrides, e.g. { kidP1: 'skins/alice.png' }
		// SHOT: character skin (visual only). 'classic' = default kids, 'custom' = portrait sprites from
		// assets/characters/custom (see docs/CHARACTERS.md). Applied at page load.
		characterSkin: { mode: 'classic', height: 48, p1: 'rae', p2: 'gina', flip: true },
		penalty: { floorsPerStep: 10, shotsPerStep: 0.5, maxShots: null, compute: null, unit: 'shot', unitPlural: 'shots' },
		text: {
			loses: '{player} LOSES', draw: 'DRAW',
			floors: '1P {p1} + 2P {p2}\n= {total} FLOORS',
			penalty: 'PENALTY: {n} {unit}',
			playAgain: 'play again', resume: 'continue'
		}
	};
	if (global.SHOT_CONFIG) {
		deepMerge(CONFIG, global.SHOT_CONFIG);
	}

	/**
	 * var
	 */
	var floorArray, heroes; // SHOT: `hero` became `heroes` (array of two)
	var $wrap, $canvas, $ctx, $res, $S; // SHOT: $S = sprite sheets (sprites.js)
	var lastTime;
	var drawCountStartTime = 0, drawCount = 0, lastInterval = 0, lastDrawCount = 0;
	var floorVelocity;
	var score, bestScore = 0, level;
	var isRunning = false, isCooldownTime = false;
	var spacePressed = NaN;
	var topBarChange = false;
	var lastResult = null; // SHOT: result of the last finished round
	// var timeCoefficient = 1, timeModifier = 0;

	var FloorSeq = function() {
		var _seq = 0;
		var _running = false;
		return {
			start : function() {
				_running = true;
			},
			get : function() {
				if (!_running) {
					return 0;
				}
				return _seq++;
			},
			reset: function() {
				_seq = 0;
				_running = false;
			}
		};
	}();

	/**
	 * class define
	 */
	var Floor = defineClass(function(x, y) {
		this.x = x || 0;
		this.y = y || 0;
		this.seq = FloorSeq.get();
		this.width = FLOOR_WIDTH; // SHOT: per-floor width (collision + drawing)
		this.beer = false; // SHOT: carries a beer mug pickup
	}, {
		draw : function(context) { // SHOT: sprite skin (was a dashed black bar)
			$S.drawFloor(context, skinSheet('normal'), this.x, this.y, this.width);
		},
		getHeight : function() {
			return FLOOR_HEIGHT;
		},
		landing : function(hero, time) {
			hero.vy = floorVelocity;
			hero.regain();
			onLand(hero, this); // SHOT: was updateScore(this.seq)
		},
		standing : function(hero, time) {
		},
		leaving : function(hero, time) {
		},
		// SHOT: beer mug drawn on top of the floor surface
		drawBeer : function(context) {
			if (this.beer) {
				context.drawImage($S.images.mug, Math.round(this.x + this.width * 0.5 - 9), Math.round(this.y - this.getHeight() - 19));
			}
		}
	});

	var SPRING = defineClass(function(x, y) {
		this.spring = SPRING_HEIGHT;
		this.restoring = false;
	}, {
		getHeight : function() {
			return this.spring + 4;
		},
		draw : function(context, time) {
			if (this.restoring) {
				this.restore(time);
			}
			$S.drawSpring(context, this.x, this.y, this.getHeight(), this.width); // SHOT: sprite frames per height
		},
		landing : function(hero, time) {
			this.touchTime = time;
			this.spring = SPRING_HEIGHT;
			hero.vy = floorVelocity;
			hero.regain();
			onLand(hero, this);
		},
		standing : function(hero, time) {
			var offset = time - this.touchTime;
			if (offset < SPRING_TIME) {
				this.spring = SPRING_HEIGHT - offset / SPRING_TIME * 5;
			} else if (offset < SPRING_TIME * 2) {
				this.spring = SPRING_HEIGHT - 15 + offset / SPRING_TIME * 10;
			} else {
				hero.vy = SPRINGING_VELOCITY;
				hero.onFloor = null;
				this.leaving(hero, time);
			}
		},
		leaving : function(hero, time) {
			this.leavingTime = time;
			this.restoring = true;
		},
		restore : function(time) {
			var offset = time - this.leavingTime;
			var distance = 5 / SPRING_TIME * offset;
			if (this.spring < SPRING_HEIGHT) {
				this.spring += distance;
				if (this.spring >= SPRING_HEIGHT) {
					this.spring = SPRING_HEIGHT;
					this.restoring = false;
				}
			} else {
				this.spring -= distance;
				if (this.spring <= SPRING_HEIGHT) {
					this.spring = SPRING_HEIGHT;
					this.restoring = false;
				}
			}
		}
	}, Floor);

	var ROLLING_RIGHT = defineClass(function(x, y) {
		this.offset = 20;
	}, {
		draw : function(context) {
			if (--this.offset <0) {
				this.offset = 20;
			}
			$S.drawConveyor(context, 1, Math.floor(this.offset / 5), this.x, this.y, this.width); // SHOT: sprite belt animation
		},
		landing : function(hero, time) {
			hero.vy = floorVelocity;
			hero.vx = ROLLING_VELOCITY;
			hero.regain();
			onLand(hero, this);
		},
		leaving : function(hero, time) {
			hero.vx = 0;
		}
	}, Floor);

	var ROLLING_LEFT = defineClass(function(x, y) {
		this.offset = 0;
	}, {
		draw : function(context) {
			if (++this.offset >= 20) {
				this.offset = 0;
			}
			$S.drawConveyor(context, -1, Math.floor(this.offset / 5), this.x, this.y, this.width); // SHOT: sprite belt animation
		},
		landing : function(hero, time) {
			hero.vy = floorVelocity;
			hero.vx = -ROLLING_VELOCITY;
			hero.regain();
			onLand(hero, this);
		},
		leaving : function(hero, time) {
			hero.vx = 0;
		}
	}, Floor);

	var ARROW_FLOOR = defineClass(function(x, y) {
	}, {
		draw : function(context) { // SHOT: steel base + spike sprite (same footprint as upstream's drawing)
			$S.drawFloor(context, skinSheet('spike'), this.x, this.y, this.width);
			$S.drawSpikes(context, this.x, this.y - this.getHeight() - ARROW_HEIGHT, this.width);
		},
		landing : function(hero, time) {
			hero.vy = floorVelocity;
			hero.hurt(4, time);
			onLand(hero, this);
		}
	}, Floor);

	var FAKE_FLOOR = defineClass(function(x, y) {
		this.height = FLOOR_HEIGHT;
		this.restoring = false;
	}, {
		getHeight : function() {
			return this.height;
		},
		draw : function(context, time) {
			if (this.restoring) {
				this.restore(time);
			}
			// SHOT: skin only. Upstream drew a grey bar; solid part keeps its skin, the part that has
			// "turned" is drawn faded so the player can see it is no longer solid.
			var sheet = skinSheet('fake');
			if (this.height >= FLOOR_HEIGHT) {
				$S.drawFloor(context, sheet, this.x, this.y, this.width);
			} else {
				context.save();
				context.globalAlpha = 0.35;
				$S.drawFloor(context, sheet, this.x, this.y, this.width);
				context.restore();
				if (this.height > 0) {
					$S.drawFloorClipped(context, sheet, this.x, this.y, this.height, this.width);
				}
			}
		},
		landing : function(hero, time) {
			// SHOT: with two players a second landing must not restart a floor that is already turning
			if (this.height >= FLOOR_HEIGHT) {
				this.touchTime = time;
			}
			hero.vy = floorVelocity;
			hero.regain();
			onLand(hero, this);
		},
		standing : function(hero, time) {
			var offset = time - this.touchTime;
			if (offset < FAKE_FLOOR_TIME) {
				this.height = FLOOR_HEIGHT;
			} else if (offset < FAKE_FLOOR_TIME2) {
				this.height = FLOOR_HEIGHT / (FAKE_FLOOR_TIME - FAKE_FLOOR_TIME2) * (offset - FAKE_FLOOR_TIME2);
			} else {
				this.height = 0;
				hero.onFloor = null;
				this.leaving(hero, time);
			}
		},
		leaving : function(hero, time) {
			var offset = time - this.touchTime;
			if (offset >= FAKE_FLOOR_TIME && offset < FAKE_FLOOR_TIME2) {
				this.restoring = true;
			}
		},
		restore : function(time) {
			var offset = time - this.touchTime;
			if (offset < FAKE_FLOOR_TIME2) {
				this.height = FLOOR_HEIGHT / (FAKE_FLOOR_TIME - FAKE_FLOOR_TIME2) * (offset - FAKE_FLOOR_TIME2);
			} else {
				this.height = 0;
				this.restoring = false;
			}
		}
	}, Floor);

	// SHOT: Hero takes an options object: { id, label, keys, sprite }
	var Hero = defineClass(function(x, y, opts) {
		opts = opts || {};
		this.id = opts.id || 'p1';
		this.label = opts.label || '1P';
		this.keys = opts.keys || { left: 'ArrowLeft', right: 'ArrowRight' };
		this.sprite = opts.sprite || $S.images.kidP1;
		this.skin = opts.skin || null; // SHOT: custom portrait { img, w, h, anchorX, flip } (visual only)
		this.facing = 1; // SHOT: last horizontal facing, used by custom skins so idle does not snap back
		this.color = opts.color || '#000';
		this.leftPressed = false;
		this.rightPressed = false;
		this.floors = 0; // SHOT: deepest floor reached (floor seq)
		this.beers = 0; // SHOT: beer mugs collected this round
		this.x = x || 0;
		this.y = y || 0;
		this.width = HERO_WIDTH;
		this.height = HERO_WIDTH;
		this.direction = 0; //left -1， stay 0， right 1
		this.onFloor = null;
		this.vx = 0;
		this.vy = 0;
		this.life = MAX_LIFE;
		// SHOT: frame indices into the 32x32 sheet (see docs/CHARACTERS.md); upstream used pixel offsets
		this.pos = {
			standing : {
				middle : [0],
				right : [2, 1, 2, 3]
			},
			falling : {
				middle : [4, 5],
				right : [6, 7]
			}
		};
		this.hurtTime = 0;
		this.blinkTime = 0;
		this.blink = false;
		this.frameIndex = 0;
		this.frameTime = 0;
	}, {
		turnLeft : function() {
			if (window.DEBUG) {
				console.log('left');
			}
			this.direction = -1;
		}, 
		turnRight : function() {
			if (window.DEBUG) {
				console.log('right');
			}
			this.direction = 1;
		},
		stay : function() {
			if (window.DEBUG) {
				console.log('stay');
			}
			this.direction = 0;
		},
		// SHOT: key state -> direction, same resolution rules as upstream (last key wins, release falls back)
		press : function(side) {
			if (side == 'left') { this.leftPressed = true; this.turnLeft(); }
			else { this.rightPressed = true; this.turnRight(); }
		},
		release : function(side) {
			if (side == 'left') {
				this.leftPressed = false;
				if (this.rightPressed) this.turnRight(); else this.stay();
			} else {
				this.rightPressed = false;
				if (this.leftPressed) this.turnLeft(); else this.stay();
			}
		},
		isDead : function() {
			return this.y > STAGE_HEIGHT + this.height || this.life <= 0;
		},
		draw : function(context, time) {
			if (this.skin) { // SHOT: custom portrait skin
				this.drawSkin(context, time);
				return;
			}
			context.save();
			if (this.direction < 0) {
				context.scale(-1, 1);
				context.translate(-this.x - this.width, this.y);
			} else {
				context.translate(this.x, this.y);
			}

			if (this.life < MAX_LIFE && this.hurtTime > 0 && time - this.hurtTime < 1000) {
				if (this.blinkTime < this.hurtTime) {
					this.blink = true;
					this.blinkTime = time;
				} else if (time - this.blinkTime >= 100) {
					this.blink = !this.blink;
					this.blinkTime = time;
				}
			} else if (this.blink) {
				this.blink = false;
			}

			var state = this.onFloor ? this.pos.standing : this.pos.falling;
			var frames = this.direction == 0 ? state.middle : state.right;
			if (time - this.frameTime >= 60) {
				this.frameTime = time;
				++this.frameIndex;
			}
			this.frameIndex = this.frameIndex % frames.length;
			// SHOT: 32x32 art drawn around the 26x26 collision box (3 px each side), feet on the box bottom
			context.drawImage(this.sprite,
				frames[this.frameIndex] * SPRITE_FRAME, this.blink ? SPRITE_FRAME : 0, SPRITE_FRAME, SPRITE_FRAME,
				-(SPRITE_FRAME - this.width) / 2, -SPRITE_FRAME, SPRITE_FRAME, SPRITE_FRAME);
			context.restore();
		},
		/**
		 * SHOT: draw a static custom portrait over the unchanged collision box: centred on its foot
		 * anchor, feet on the box bottom, mirrored for the last facing (optional), a 1 px step bob
		 * while walking on a floor and the usual 1 s hurt blink (as transparency). No scaling.
		 */
		drawSkin : function(context, time) {
			var sk = this.skin;
			if (this.direction != 0) {
				this.facing = this.direction;
			}
			if (this.life < MAX_LIFE && this.hurtTime > 0 && time - this.hurtTime < 1000) {
				if (this.blinkTime < this.hurtTime) {
					this.blink = true;
					this.blinkTime = time;
				} else if (time - this.blinkTime >= 100) {
					this.blink = !this.blink;
					this.blinkTime = time;
				}
			} else if (this.blink) {
				this.blink = false;
			}
			var bob = (this.onFloor && this.direction != 0 && Math.floor(time / 120) % 2) ? 1 : 0;
			context.save();
			if (this.facing < 0 && sk.flip) {
				context.scale(-1, 1);
				context.translate(-this.x - this.width, this.y);
			} else {
				context.translate(this.x, this.y);
			}
			if (this.blink) {
				context.globalAlpha = 0.35;
			}
			context.drawImage(sk.img, Math.round(this.width / 2 - sk.anchorX), -sk.h - bob, sk.w, sk.h);
			context.restore();
		},
		regain : function() {
			if (this.life < MAX_LIFE) {
				++this.life;
				topBarChange = true;
			}
		},
		// SHOT: beer healing, independent from regain()
		heal : function(num) {
			this.life = Math.min(MAX_LIFE, this.life + num);
			topBarChange = true;
		},
		hurt : function(num, time) {
			this.hurtTime = time;
			this.life = Math.max(0, this.life - num);
			topBarChange = true;
		}
	});

	// SHOT: platform skin lookup (appearance only; mechanics live in the Floor classes)
	var SKIN_SHEETS = { stone: 'stone', blueBrick: 'blueBrick', steelSpikes: 'steel', steel: 'steel' };
	function skinSheet(mechanic) {
		var skin = (CONFIG.skins && CONFIG.skins[mechanic]) || 'stone';
		return $S.images[SKIN_SHEETS[skin] || skin] || $S.images.stone;
	}

	function onLand(hero, floor) {
		if (floor.seq > hero.floors) {
			hero.floors = floor.seq;
			topBarChange = true;
		}
		if (floor.beer) {
			floor.beer = false;
			hero.beers += 1;
			hero.heal(CONFIG.beer.healAmount);
			fireEvent('beer', hero.id, hero.life);
		}
		updateScore(floor.seq);
	}

	/**
	 * action
	 */
	// SHOT: width of the two-player start floor
	function startFloorWidth() {
		return Math.min(STAGE_WIDTH, Math.max(FLOOR_WIDTH, CONFIG.platform.startMinWidth || 0));
	}

	/**
	 * SHOT: x for a new floor. Uniform inside [0, STAGE_WIDTH - FLOOR_WIDTH]; with platform.guaranteeReach
	 * it is additionally limited to positions a player can reach by walking off either edge of the floor
	 * above (prev) and drifting sideways while falling one FLOOR_DISTANCE (90 % of the kinematic maximum),
	 * so narrower platforms never create a gap that cannot be crossed. Uniform within that window.
	 */
	function randomFloorX(prev) {
		var lo = 0, hi = STAGE_WIDTH - FLOOR_WIDTH;
		if (prev && CONFIG.platform.guaranteeReach) {
			var drift = 0.9 * CONTROL_VELOCITY * Math.sqrt(2 * FLOOR_DISTANCE / GRAVITY_ACC);
			lo = Math.max(lo, Math.ceil(prev.x - HERO_WIDTH - drift - FLOOR_WIDTH));
			hi = Math.min(hi, Math.floor(prev.x + prev.width + drift + HERO_WIDTH - 1));
		}
		return lo + Math.round(Math.random() * (hi - lo));
	}

	function generateFloor() {
		var firstInit = floorArray.length == 0;
		var floor = floorArray[floorArray.length - 1];
		var postion = floor && floor.y || 0;
		while (postion < STAGE_HEIGHT) {
			postion += FLOOR_DISTANCE;
			var floorY = postion;
			// SHOT: spawn fully inside the playable area (upstream allowed x in [-50, 310), half under the edges)
			// and, when platform.guaranteeReach is on, within falling reach of the floor above (randomFloorX)
			var floorX = randomFloorX(floorArray[floorArray.length - 1]);
			if (firstInit) { // make sure can land on a floor at the beginning
				if (floorY > STAGE_HEIGHT - FLOOR_DISTANCE) {
					FloorSeq.start();
					// SHOT: centred start floor, at least startMinWidth wide so both players spawn safely
					floorX = (STAGE_WIDTH - startFloorWidth()) * 0.5;
					newFloor = new Floor(floorX, floorY);
					newFloor.width = startFloorWidth();
					floorArray.push(newFloor);
					continue;
				}
			}
			var newFloor;
			var seed = window.DEBUG_FLOOR || Math.random();
			if (seed > 0.5) {
				newFloor = new Floor(floorX, floorY);
			} else if (seed > 0.4) {
				newFloor = new FAKE_FLOOR(floorX, floorY);
			} else if (seed > 0.3) {
				newFloor = new ARROW_FLOOR(floorX, floorY);
			} else if (seed > 0.2) {
				newFloor = new ROLLING_LEFT(floorX, floorY);
			} else if (seed > 0.1) {
				newFloor = new ROLLING_RIGHT(floorX, floorY);
			} else {
				newFloor = new SPRING(floorX, floorY);
			}
			// SHOT: random beer pickup
			if (newFloor.seq > 0 && Math.random() < CONFIG.beer.spawnChance) {
				if (!(CONFIG.beer.onlySafeFloors && newFloor instanceof ARROW_FLOOR)) {
					newFloor.beer = true;
				}
			}
			floorArray.push(newFloor);
		}
	}

	function removeOutboundFloor() {
		var floorIndex, len = floorArray.length;
		for (floorIndex = 0; floorIndex < len; ++floorIndex) {
			var floor = floorArray[floorIndex];
			if (floor.y >= MARGIN_TOP) { // visible
				break;
			}
		}
		if (floorIndex > 0) {
			floorArray.splice(0, floorIndex);
		}
	}

	function updateHeroHorizontalPostion(hero, step, time) {
		var velocity = heroVelocityX(hero);
		if (velocity != 0) {
			hero.x = Math.min(Math.max(0, hero.x + velocity * step), STAGE_WIDTH - HERO_WIDTH);
			checkLeftFloor(hero, time);
		}
	}

	// SHOT: horizontal speed from input plus conveyor (same formula upstream used inline)
	function heroVelocityX(hero) {
		return hero.vx + hero.direction * CONTROL_VELOCITY;
	}

	// SHOT: upstream's walk-off-the-edge test, extracted so pushes use the same rule
	function checkLeftFloor(hero, time) {
		if (hero.onFloor) {
			var floor = hero.onFloor;
			if (hero.x < floor.x - HERO_WIDTH || hero.x >= floor.x + floor.width) {
				hero.onFloor = null; //leaving the floor
				floor.leaving(hero, time);
			}
		}
	}

	/**
	 * SHOT: player-to-player pushing.
	 *
	 * Runs once per physics step, after both heroes moved horizontally and before vertical movement.
	 * Hitboxes are the existing HERO_WIDTH x HERO_WIDTH boxes (x .. x+W, y-W .. y; y = feet).
	 * If the boxes overlap on both axes, they are separated along x only:
	 *  - pushing force is walking input only (direction x CONTROL_VELOCITY). Overlap up to the two
	 *    players' combined push this step is given to the other player in proportion to the pushes
	 *    toward each other: a walker moves a standing player along with it, equal opposing pushes cancel
	 *    (both stand still). Conveyors carry players but are not a push, so two players on the same belt
	 *    push each other exactly as on a stable floor;
	 *  - overlap nobody pushed into (a belt carried one into the other, or one fell beside the other) is
	 *    eased apart at PUSH_SEPARATE_VELOCITY per player instead of snapping, so there is no teleport;
	 *  - walls clamp the pushed player and the remaining overlap goes back to the pusher.
	 * No damage, knockback or vertical effect. Left/right order comes from positions before this
	 * step's movement (ties: 1P left), so players never pass through each other.
	 */
	var PUSH_SEPARATE_VELOCITY = 0.1; // px per ms, per player; only for overlap with no pusher
	function resolvePlayerPush(prevX, step, time) {
		if (!heroes || heroes.length < 2) {
			return;
		}
		var h0 = heroes[0], h1 = heroes[1];
		if (Math.abs(h0.y - h1.y) >= HERO_WIDTH) {
			return; // no vertical overlap
		}
		var leftIsH0 = prevX[0] < prevX[1] || (prevX[0] == prevX[1] && h0.x <= h1.x);
		var A = leftIsH0 ? h0 : h1, B = leftIsH0 ? h1 : h0;
		var overlap = A.x + HERO_WIDTH - B.x;
		if (overlap <= 0) {
			return;
		}
		var a = Math.max(0, A.direction * CONTROL_VELOCITY); // A pushing right
		var b = Math.max(0, -B.direction * CONTROL_VELOCITY); // B pushing left
		var pushPart = Math.min(overlap, (a + b) * step);
		if (pushPart > 0) {
			A.x -= pushPart * b / (a + b);
			B.x += pushPart * a / (a + b);
		}
		var rest = overlap - pushPart;
		if (rest > 0) {
			var ease = Math.min(rest, 2 * PUSH_SEPARATE_VELOCITY * step) / 2;
			A.x -= ease;
			B.x += ease;
		}
		// walls: clamp, then hand any remaining overlap back to the other player
		var maxX = STAGE_WIDTH - HERO_WIDTH;
		if (B.x > maxX) {
			B.x = maxX;
			A.x = Math.min(A.x, B.x - HERO_WIDTH);
		}
		if (A.x < 0) {
			A.x = 0;
			B.x = Math.max(B.x, A.x + HERO_WIDTH);
		}
		checkLeftFloor(A, time);
		checkLeftFloor(B, time);
	}

	// SHOT: floors move once per step; each hero is then resolved against them
	function updateFloorsVerticalPosition(step) {
		var floorDistance = step * floorVelocity;
		for (var i = 0, len = floorArray.length; i < len; ++i) {
			floorArray[i].y += floorDistance;
		}
		return floorDistance;
	}

	function updateHeroVerticalPosition(hero, step, time, floorDistance) {
		if (hero.onFloor) {
			var floor = hero.onFloor;
			hero.y = floor.y - floor.getHeight();
		} else {
			var heroDistance = hero.vy * step + 0.5 * GRAVITY_ACC * step * step; // v0t + 1/2gt^2
			var newY = hero.y + heroDistance;
			//detect collision
			var hasCollision = false;
			var maxX = hero.x + HERO_WIDTH;
			for (var i = 0, len = floorArray.length; i < len; ++i) {
				var floor = floorArray[i];
				// SHOT: per-floor width; same test as upstream's floor.x >= hero.x - FLOOR_WIDTH
				if (floor.x + floor.width >= hero.x && floor.x < maxX && floor.getHeight() > 0) {
					if (newY >= floor.y - floor.getHeight() && hero.y < floor.y - floor.getHeight() - floorDistance) { //collision
						if (window.DEBUG) {
							console.info(newY, floor.y - floor.getHeight(), hero.y, floor.y - floor.getHeight() - floorDistance);
						}
						hero.y = floor.y - floor.getHeight();
						hero.onFloor = floor;
						floor.landing(hero, time);
						hasCollision = true;
						break;
					}
				}
			}
			if (!hasCollision) {
				hero.y = newY;
				hero.vy += GRAVITY_ACC * step; // v0 + gt;
			}
		}
	}

	// SHOT: the round ends as soon as any player is dead
	function judge() {
		if (!heroes || heroes.length == 0) {
			return true;
		}
		for (var i = 0; i < heroes.length; ++i) {
			if (heroes[i].isDead()) {
				return true;
			}
		}
		return false;
	}

	function checkHittingTop(hero, time) {
		if (hero.y - hero.height < /*ARROW_HEIGHT + */MARGIN_TOP) {
			hero.y = /*ARROW_HEIGHT + */MARGIN_TOP + hero.height;
			hero.vy = 0;
			hero.hurt(5, time);
			if (hero.onFloor) {
				var floor = hero.onFloor;
				hero.onFloor = null;
				floor.leaving(hero, time);
			}
		}
	}

	function fmt(template, map) {
		return String(template).replace(/\{(\w+)\}/g, function(m, k) {
			return map.hasOwnProperty(k) ? map[k] : m;
		});
	}

	// SHOT: colours of the rendering layer
	var COLORS = {
		playfield: '#4c2a4e', playfieldEdge: '#3b2140', hud: '#4c2a4e', hudLine: '#4c2a4e',
		lifeText: '#ff6ad5', lifeShadow: '#5a1848', lifeBase: '#d42a3a', pip: '#ffe24a', pipShade: '#c8a820', pipEmpty: '#8a6a8a',
		counter: '#ff5a3c', counterShadow: '#5a1c20', panel: '#2a1630', panelBorder: '#ff6ad5', text: '#ffffff', accent: '#ffe24a'
	};

	function drawAll(context, time) {
		// playfield (translated past the left wall so physics coordinates are unchanged)
		context.save();
		context.translate(WALL_WIDTH, 0);
		context.beginPath();
		context.rect(0, MARGIN_TOP, STAGE_WIDTH, STAGE_HEIGHT - MARGIN_TOP);
		context.clip();
		context.fillStyle = COLORS.playfield;
		context.fillRect(0, MARGIN_TOP, STAGE_WIDTH, STAGE_HEIGHT - MARGIN_TOP);
		context.fillStyle = COLORS.playfieldEdge;
		context.fillRect(0, MARGIN_TOP, 2, STAGE_HEIGHT - MARGIN_TOP);
		context.fillRect(STAGE_WIDTH - 2, MARGIN_TOP, 2, STAGE_HEIGHT - MARGIN_TOP);
		for (var i = 0, len = floorArray.length; i < len; ++i) {
			floorArray[i].draw(context, time);
			floorArray[i].drawBeer(context);
		}
		for (var h = 0; h < heroes.length; ++h) {
			heroes[h].draw(context, time);
		}
		context.drawImage($S.images.ceiling, 0, MARGIN_TOP);
		context.restore();

		// walls (outside the playable area)
		context.drawImage($S.images.wall, 0, MARGIN_TOP);
		context.drawImage($S.images.wall, WALL_WIDTH + STAGE_WIDTH, MARGIN_TOP);

		if (!isRunning) {
			context.save();
			context.translate(VIEW_WIDTH * 0.5, STAGE_HEIGHT * 0.5);
			if (lastResult) {
				drawResultPanel(context, lastResult);
				context.translate(0, 84);
			}
			if (!isCooldownTime) {
				drawButton(context, judge() ? CONFIG.text.playAgain : CONFIG.text.resume, isFinite(spacePressed));
			} else if (!lastResult) {
				$S.font.draw(context, 'GAME OVER', 0, -14, { scale: 4, color: COLORS.text, shadow: COLORS.panel, align: 'center' });
			}
			context.restore();
		}

		drawTopBar(context);

		if (window.DEBUG) {
			context.save();
			context.font = '12pt monospace';
			context.fillStyle = '#fff';
			context.fillText(((drawCount + lastDrawCount) * 1000 / (lastInterval + time - drawCountStartTime)).toFixed(2) + ' fps', 10, MARGIN_TOP + 30);
			if (++drawCount > 20) {
				lastInterval = time - drawCountStartTime;
				lastDrawCount = 20;
				drawCount -= 20;
				drawCountStartTime = time;
			}
			context.restore();
		}
	}

	// SHOT: pixel-style button used for play again / continue
	function drawButton(context, label, pressed) {
		var w = 170, h = 40;
		context.save();
		if (!pressed) {
			context.fillStyle = 'rgba(0,0,0,0.45)';
			context.fillRect(-w / 2 + 4, -h / 2 + 4, w, h);
		} else {
			context.translate(3, 3);
		}
		context.fillStyle = COLORS.panelBorder;
		context.fillRect(-w / 2, -h / 2, w, h);
		context.fillStyle = COLORS.panel;
		context.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
		$S.font.draw(context, label, 0, -7, { scale: 2, color: COLORS.accent, shadow: '#000', align: 'center' });
		context.restore();
	}

	/**
	 * SHOT: HUD — "2P LIFE" left, "1P LIFE" right, 12 yellow pips over a red baseline,
	 * beer mug × penalty units in the centre (penalty = configurable conversion of 1P + 2P floors).
	 */
	function drawTopBar(context) {
		topBarChange = false;
		context.save();
		context.fillStyle = COLORS.hud;
		context.fillRect(0, 0, VIEW_WIDTH, MARGIN_TOP);
		context.fillStyle = COLORS.hudLine;
		context.fillRect(0, MARGIN_TOP - 1, VIEW_WIDTH, 1);
		var p1 = heroes[0], p2 = heroes[1];
		var barW = MAX_LIFE * 9 - 2;
		var blocks = [
			{ hero: p2, x: 12, textX: 16, align: 'left' },
			{ hero: p1, x: VIEW_WIDTH - 12 - barW, textX: VIEW_WIDTH - 16, align: 'right' }
		];
		for (var b = 0; b < blocks.length; ++b) {
			var hero = blocks[b].hero;
			if (!hero) continue;
			var x = blocks[b].x;
			$S.font.draw(context, hero.label + ' LIFE', blocks[b].textX, 7, { scale: 2, color: COLORS.lifeText, shadow: COLORS.lifeShadow, italic: true, align: blocks[b].align });
			context.fillStyle = COLORS.lifeBase;
			context.fillRect(x - 2, 25, barW + 4, 2);
			for (var i = 0; i < MAX_LIFE; ++i) {
				var cx = x + i * 9;
				if (i < hero.life) {
					context.fillStyle = COLORS.pip;
					context.fillRect(cx, 30, 7, 12);
					context.fillStyle = COLORS.pipShade;
					context.fillRect(cx, 40, 7, 2);
					context.fillRect(cx + 6, 31, 1, 11);
					context.fillStyle = COLORS.hud; // rounded corners
					context.fillRect(cx, 30, 1, 1); context.fillRect(cx + 6, 30, 1, 1);
					context.fillRect(cx, 41, 1, 1); context.fillRect(cx + 6, 41, 1, 1);
				} else {
					context.fillStyle = COLORS.pipEmpty;
					context.fillRect(cx + 3, 30, 1, 12);
				}
			}
		}
		// centre: mug × penalty units
		var units = (p1 && p2) ? computePenalty(p1.floors + p2.floors) : 0;
		var label = 'X ' + formatShots(units);
		var tw = $S.font.width(label, 3);
		var total = 18 + 10 + tw;
		var cx0 = Math.round(VIEW_WIDTH / 2 - total / 2);
		context.drawImage($S.images.mug, cx0, 12);
		$S.font.draw(context, label, cx0 + 28, 16, { scale: 3, color: COLORS.counter, shadow: COLORS.counterShadow });
		context.restore();
	}

	// SHOT: end-of-round panel
	function drawResultPanel(context, result) {
		var cfg = CONFIG;
		var title = result.loser ? fmt(cfg.text.loses, { player: result.loserLabel }) : cfg.text.draw;
		var unit = result.penalty == 1 ? cfg.penalty.unit : cfg.penalty.unitPlural;
		var lines = fmt(cfg.text.floors, { p1: result.floors.p1, p2: result.floors.p2, total: result.floors.total }).split('\n');
		var penaltyLine = fmt(cfg.text.penalty, { n: formatShots(result.penalty), unit: unit });
		var w = 300, h = 150;
		context.save();
		context.translate(0, -30);
		context.fillStyle = 'rgba(0,0,0,0.45)';
		context.fillRect(-w / 2 + 5, -h / 2 + 5, w, h);
		context.fillStyle = COLORS.panelBorder;
		context.fillRect(-w / 2, -h / 2, w, h);
		context.fillStyle = COLORS.panel;
		context.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
		var y = -h / 2 + 14;
		$S.font.draw(context, title, 0, y, { scale: 3, color: result.loserColor || COLORS.text, shadow: '#000', align: 'center' });
		y += 32;
		for (var i = 0; i < lines.length; ++i) {
			$S.font.draw(context, lines[i], 0, y, { scale: 2, color: COLORS.text, shadow: '#000', align: 'center' });
			y += 18;
		}
		y += 6;
		context.drawImage($S.images.mug, -$S.font.width(penaltyLine, 2) / 2 - 26, y - 4);
		$S.font.draw(context, penaltyLine, 0, y, { scale: 2, color: COLORS.accent, shadow: '#000', align: 'center' });
		context.restore();
	}

	function updateScore(floorSeq) {
		var newScore = Math.floor(floorSeq * 0.2);
		if (newScore > score) { // SHOT: was !=, so a trailing player cannot lower the shared level
			topBarChange = true;
			var newLevel = Math.floor(newScore * 0.1);
			if (newLevel > level) {
				console.info('level up', newLevel);
				level = newLevel;
				floorVelocity = (1 + 0.1 * level) * FLOOR_VELOCITY_BASE;
			}
			score = newScore;
		}
	}

	// SHOT: penalty conversion, fully configurable
	// SHOT: shots = floor(totalFloors / floorsPerStep) * shotsPerStep, optionally capped at maxShots.
	// Default 10 floors -> 0.5 shot. Starts at 0; beer pickups never feed into it.
	function computePenalty(totalFloors) {
		var p = CONFIG.penalty;
		var n;
		if (typeof p.compute === 'function') {
			n = Number(p.compute(totalFloors)) || 0;
		} else {
			var stepFloors = p.floorsPerStep > 0 ? p.floorsPerStep : 10;
			var stepShots = isFinite(p.shotsPerStep) ? p.shotsPerStep : 0.5;
			n = Math.floor(Math.max(0, totalFloors) / stepFloors) * stepShots;
		}
		if (p.maxShots !== null && p.maxShots !== undefined && isFinite(p.maxShots)) {
			n = Math.min(p.maxShots, n);
		}
		return Math.round(n * 1000) / 1000; // keep 0.5 steps exact, trim float noise for other rates
	}

	// SHOT: number text for the HUD and result panel: 0, 0.5, 1, 1.5 (no trailing zeros)
	function formatShots(n) {
		return String(Math.round(n * 100) / 100);
	}

	// SHOT: build the result of a finished round
	function buildResult() {
		var dead = heroes.filter(function(h) { return h.isDead(); });
		var p1 = heroes[0], p2 = heroes[1];
		var loser = dead.length == 1 ? dead[0] : null; // both dead in the same step: draw
		var winner = loser ? (loser === p1 ? p2 : p1) : null;
		var total = p1.floors + p2.floors;
		return {
			loser: loser ? loser.id : null,
			loserLabel: loser ? loser.label : null,
			loserColor: loser ? loser.color : null,
			winner: winner ? winner.id : null,
			draw: !loser,
			floors: { p1: p1.floors, p2: p2.floors, total: total },
			beers: { p1: p1.beers, p2: p2.beers },
			life: { p1: p1.life, p2: p2.life },
			penalty: computePenalty(total),
			penaltyUnit: CONFIG.penalty.unit,
			config: { floorsPerStep: CONFIG.penalty.floorsPerStep, shotsPerStep: CONFIG.penalty.shotsPerStep, maxShots: CONFIG.penalty.maxShots, platformWidth: FLOOR_WIDTH, beerHeal: CONFIG.beer.healAmount, beerChance: CONFIG.beer.spawnChance }
		};
	}

	function loop(step, time) {
		for (var h = 0; h < heroes.length; ++h) {
			var hero = heroes[h];
			if (hero.onFloor) {
				var floor = hero.onFloor;
				floor.standing(hero, time);
				// SHOT: a fake floor that finished turning under another player drops this one too
				if (hero.onFloor && hero.onFloor.getHeight() <= 0) {
					hero.onFloor = null;
				}
			}
		}
		generateFloor();
		removeOutboundFloor();
		var floorDistance = updateFloorsVerticalPosition(step);
		// SHOT: both heroes move horizontally first so pushes see both moves; each hero still runs
		// horizontal then vertical exactly as upstream did, so single-player physics is unchanged.
		var prevX = [];
		for (var i = 0; i < heroes.length; ++i) {
			prevX[i] = heroes[i].x;
			updateHeroHorizontalPostion(heroes[i], step, time);
		}
		resolvePlayerPush(prevX, step, time);
		for (var j = 0; j < heroes.length; ++j) {
			updateHeroVerticalPosition(heroes[j], step, time, floorDistance);
			checkHittingTop(heroes[j], time);
		}
		return judge();
	}

	function frame(time) {
		if (window.DEBUG_TIME) {
			time *= window.DEBUG_TIME;
		}
		if (!lastTime) {
			lastTime = time;
		}
		var duration = time - lastTime;
		if (duration < 0) { // SHOT: guard against a clock that moved backwards (never with real rAF; seen with synthetic test clocks)
			duration = 0;
		}
		if (duration > 2000) {
			console.info('Pause, duration: ' + duration);
			isRunning = false;
			window.addEventListener('touchmove', onMove, false);
		} else {
			var ended = false;
			for (; duration > MAX_ACTION_INTERVAL; duration -= MAX_ACTION_INTERVAL) {
				ended = loop(MAX_ACTION_INTERVAL, time - duration);
				if (ended) {
					break;
				}
			}
			if (!ended) {
				ended = loop(duration, time);
			}
			if (ended) {
				isCooldownTime = true;
				setTimeout(function() {
					isCooldownTime = false;
					drawAll($ctx, time);
				}, 1000);
				lastResult = buildResult(); // SHOT
				bestScore = Math.max(score, bestScore);
				fireEvent('roundEnd', lastResult); // SHOT
				fireEvent('gameOver', score, bestScore);
				isRunning = false;
				window.addEventListener('touchmove', onMove, false);
			}
		}
		drawAll($ctx, time);
		lastTime = time;
		if (isRunning) {
			requestAnimationFrame(frame);
		}
	}

	function resizeCanvas($wrap, $canvas, $ctx) {
		var screenWidth = document.documentElement.clientWidth;
		var screenHeight = document.documentElement.clientHeight;
		var zoomRate = Math.min(screenWidth / VIEW_WIDTH, screenHeight / STAGE_HEIGHT); // SHOT: canvas includes the walls
		var ratio = window.devicePixelRatio || 1;
		$canvas.style.width = (VIEW_WIDTH * zoomRate) + 'px';
		$canvas.style.height = (STAGE_HEIGHT * zoomRate) + 'px';
		$canvas.width = VIEW_WIDTH * zoomRate * ratio;
		$canvas.height = STAGE_HEIGHT * zoomRate * ratio;
		
		$ctx.setTransform(zoomRate * ratio, 0, 0, zoomRate * ratio, 0, 0);
		$ctx.imageSmoothingEnabled = false; // SHOT: keep pixel art crisp on large projector scales
		topBarChange = true;
		if (lastTime) {
			drawAll($ctx, lastTime);
		}
		console.info('resize rate=' + zoomRate + ", ratio=" + ratio + ", width=" + $canvas.width + ", height=" + $canvas.height);
	}

	function onMove(e) {
		if (isFinite(spacePressed)) {
			spacePressed = NaN;
			drawAll($ctx, lastTime);
		}
	}

	// SHOT: map a KeyboardEvent to { hero, side } using the configured keys
	function heroForKey(e) {
		var code = e.code || '';
		var legacy = { 37: 'ArrowLeft', 39: 'ArrowRight', 90: 'KeyZ', 67: 'KeyC' }[e.keyCode];
		for (var i = 0; i < heroes.length; ++i) {
			var k = heroes[i].keys;
			if (code == k.left || legacy == k.left) return { hero: heroes[i], side: 'left' };
			if (code == k.right || legacy == k.right) return { hero: heroes[i], side: 'right' };
		}
		return null;
	}

	function init(sprites) {
		$S = sprites; // SHOT: PNG sprite sheets from sprites.js
		$res = { hero: $S.images.kidP1, hero2: $S.images.kidP2 };
		$canvas = document.createElement('canvas');
		$canvas.style.display = 'block';
		$canvas.style.margin = '0 auto';
		$canvas.style.imageRendering = 'pixelated'; // SHOT
		clearNode($wrap);
		$wrap.appendChild($canvas);

		$ctx = $canvas.getContext('2d');
		
		setTimeout(function() {
			resizeCanvas($wrap, $canvas, $ctx);
		}, 50);
		window.addEventListener('resize', function() {
			resizeCanvas($wrap, $canvas, $ctx);
			if (isRunning) {
				$canvas.scrollIntoView();
			}
		}, false);

		//regist control
		window.addEventListener('keydown', function(e) {
			var hit = heroForKey(e);
			if (hit) {
				if (!e.repeat) hit.hero.press(hit.side);
				e.preventDefault();
				e.stopPropagation();
			} else if (e.keyCode == 32 || e.keyCode == 13) { // space or enter
				if (!isRunning && !isCooldownTime) {
					spacePressed = 0;
					drawAll($ctx, lastTime);
				}
				e.preventDefault();
				e.stopPropagation();
			}
		}, false);
		window.addEventListener('keyup', function(e) {
			var hit = heroForKey(e);
			if (hit) {
				hit.hero.release(hit.side);
			} else if (isFinite(spacePressed) && (e.keyCode == 32 || e.keyCode == 13)) {
				spacePressed = NaN;
				start();
			}
		}, false);
		// SHOT: release every key when the window loses focus so nobody keeps sliding
		window.addEventListener('blur', function() {
			for (var i = 0; i < heroes.length; ++i) {
				heroes[i].leftPressed = heroes[i].rightPressed = false;
				heroes[i].stay();
			}
		}, false);
		// Touch: left/right half of the screen drives player 1 (upstream behaviour)
		var touchLeft = NaN, touchRight = NaN;
		window.addEventListener('touchstart', function(e) {
			var touch = e.changedTouches[0];
			if (touch) {
				if (!isRunning) {
					if (!isCooldownTime && e.target == $canvas) {
						spacePressed = touch.identifier;
						drawAll($ctx, lastTime);
					}
				} else if (touch.clientX < document.documentElement.clientWidth * 0.5) {
					touchLeft = touch.identifier;
					heroes[0].press('left');
					e.preventDefault();
					e.stopPropagation();
				} else {
					touchRight = touch.identifier;
					heroes[0].press('right');
					e.preventDefault();
					e.stopPropagation();
				}
			}
		}, false);
		var touchEnd = function(e) {
			var touch = e.changedTouches[0];
			if (touch) {
				if (touch.identifier == spacePressed) {
					spacePressed = NaN;
					start();
				} else if (touch.identifier == touchLeft) {
					touchLeft = NaN;
					heroes[0].release('left');
				} else if (touch.identifier == touchRight) {
					touchRight = NaN;
					heroes[0].release('right');
				}
			}
		};
		window.addEventListener('touchend', touchEnd, false);
		window.addEventListener('touchcancel', touchEnd, false);
		//start loop
		start();
	}

	// SHOT: metadata of the selected custom skins (null for the classic kids or if anything is missing)
	function customSkinMeta() {
		var cs = CONFIG.characterSkin || {};
		var all = global.SHOT_CUSTOM_SKINS;
		if (cs.mode !== 'custom' || !all) {
			return null;
		}
		var h = String(cs.height || 48);
		var m1 = all[cs.p1] && all[cs.p1][h], m2 = all[cs.p2] && all[cs.p2][h];
		return (m1 && m2) ? { p1: m1, p2: m2, flip: cs.flip !== false } : null;
	}

	function customSkinFor(id) {
		var meta = customSkinMeta();
		var img = $S && $S.images[id === 'p1' ? 'customP1' : 'customP2'];
		if (!meta || !img || !img.naturalWidth) {
			return null;
		}
		var m = meta[id];
		return { img: img, w: m.w, h: m.h, anchorX: m.anchorX, flip: meta.flip };
	}

	// SHOT: extracted from start() so Game.reset() can rebuild the round in place
	function createWorld() {
		fireEvent('gameStart');
		//create world
		FloorSeq.reset();
		floorArray = [];
		lastResult = null;
		// SHOT: platform width for this round (configurable; clamped to something a player can stand on)
		FLOOR_WIDTH = Math.round(Math.min(STAGE_WIDTH, Math.max(HERO_WIDTH + 4, CONFIG.platform.width || 80)));
		// SHOT: two heroes on the centred start floor: 2P (red/pink) on the left, 1P (blue/green) on the right
		var startW = startFloorWidth();
		var floorX = (STAGE_WIDTH - startW) * 0.5;
		// SHOT: the start floor sits at the last FLOOR_DISTANCE multiple inside the stage (see generateFloor);
		// upstream placed heroes at STAGE_HEIGHT - FLOOR_DISTANCE, which with a taller HUD band ends up below
		// the floor's top, so they fell through it. Spawn them a few px above the floor instead.
		var startFloorY = FLOOR_DISTANCE * Math.floor(STAGE_HEIGHT / FLOOR_DISTANCE);
		var startY = startFloorY - FLOOR_HEIGHT - 16;
		heroes = [
			new Hero(floorX + startW - HERO_WIDTH - 2, startY, { id: 'p1', label: CONFIG.players.p1.label, keys: CONFIG.players.p1.keys, sprite: $res.hero, skin: customSkinFor('p1'), color: '#39d47c' }),
			new Hero(floorX + 2, startY, { id: 'p2', label: CONFIG.players.p2.label, keys: CONFIG.players.p2.keys, sprite: $res.hero2, skin: customSkinFor('p2'), color: '#ff5fb0' })
		];
		floorVelocity = FLOOR_VELOCITY_BASE;
		score = 0;
		level = 0;
		topBarChange = true;
	}

	function start() {
		if (isRunning) {
			return;
		}
		if (judge()) {
			createWorld();
		}
		window.removeEventListener('touchmove', onMove, false);
		isRunning = true;
		lastTime = 0;
		$canvas.scrollIntoView();
		requestAnimationFrame(frame);
	}

	Game.launch = function($wrapNode) {
		$wrap = $wrapNode;
		// SHOT: sprite sheets; per-player sheet URLs may be given in config (players.pN.sheet)
		var overrides = ext({}, CONFIG.sprites || {});
		if (CONFIG.players.p1.sheet) overrides.kidP1 = CONFIG.players.p1.sheet;
		if (CONFIG.players.p2.sheet) overrides.kidP2 = CONFIG.players.p2.sheet;
		var meta = customSkinMeta();
		if (meta) {
			overrides.customP1 = meta.p1.file;
			overrides.customP2 = meta.p2.file;
		}
		global.ShotSprites.load(overrides, init);
	}

	Game.on = onEvent;
	Game.off = offEvent;

	// SHOT: minimal integration surface (see docs/INTEGRATION.md)
	Game.configure = function(partial) {
		deepMerge(CONFIG, partial || {});
		return CONFIG;
	};
	Game.getConfig = function() {
		return CONFIG;
	};
	Game.start = function() {
		start();
	};
	Game.reset = function() {
		// abort whatever is going on and begin a fresh round
		isCooldownTime = false;
		createWorld();
		if (!isRunning) {
			start();
		}
	};
	Game.getState = function() {
		return {
			running: isRunning,
			players: (heroes || []).map(function(h) {
				return { id: h.id, label: h.label, life: h.life, floors: h.floors, beers: h.beers, alive: !h.isDead() };
			}),
			lastResult: lastResult
		};
	};
	Game.computePenalty = computePenalty;
	Game.formatShots = formatShots;
	// SHOT: live world objects for automated tests / debugging only (not part of the integration API)
	Game._debugFrame = function(time) { frame(time); }; // drive one frame with a synthetic clock
	Game._debugTypes = { Floor: Floor, SPRING: SPRING, ROLLING_LEFT: ROLLING_LEFT, ROLLING_RIGHT: ROLLING_RIGHT, FAKE_FLOOR: FAKE_FLOOR, ARROW_FLOOR: ARROW_FLOOR }; // tests only
	Game._debugWorld = function() {
		return { floors: floorArray, heroes: heroes, marginTop: MARGIN_TOP, stageWidth: STAGE_WIDTH, viewWidth: VIEW_WIDTH, wallWidth: WALL_WIDTH, maxLife: MAX_LIFE, stageHeight: STAGE_HEIGHT, floorWidth: FLOOR_WIDTH, heroWidth: HERO_WIDTH };
	};

}(window);
