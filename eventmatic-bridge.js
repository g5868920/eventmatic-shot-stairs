/**
 * SHOT the Stairs — minimal integration interface for Eventmatic.
 *
 * This is only the surface; no Eventmatic integration is implemented yet.
 * The host page (or a future Eventmatic module) talks to the game through
 * window.ShotStairs. See docs/INTEGRATION.md.
 */
;(function (global) {
  'use strict';
  var Game = global.Game;
  if (!Game) return;

  var api = {
    version: '0.1.0',

    /** Merge settings at runtime (same shape as config.js). Takes effect on the next round. */
    configure: function (partial) { return Game.configure(partial); },
    getConfig: function () { return Game.getConfig(); },

    /** Start a new round (or resume a paused one). */
    start: function () { Game.start(); },
    /** Abort the current round and start a fresh one. */
    reset: function () { Game.reset(); },

    /** { running, players:[{id,label,life,floors,beers,alive}], lastResult } */
    getState: function () { return Game.getState(); },

    /**
     * Events:
     *   'gameStart'            — a new round began
     *   'beer'    (playerId, lifeAfter)
     *   'roundEnd' (result)    — result = { loser, winner, draw, floors:{p1,p2,total},
     *                            beers:{p1,p2}, life:{p1,p2}, penalty, penaltyUnit, config }
     */
    on: Game.on,
    off: Game.off,

    /** Same formula the end screen uses. */
    computePenalty: Game.computePenalty,

    /** Sound (audio.js): mute on/off and volume 0..1. No-ops if audio is unavailable. */
    setMuted: function (m) { return global.ShotAudio ? global.ShotAudio.setMuted(m) : null; },
    setVolume: function (v) { return global.ShotAudio ? global.ShotAudio.setVolume(v) : null; },
    setMusicVolume: function (v) { return global.ShotAudio ? global.ShotAudio.setMusicVolume(v) : null; }
  };

  // Also mirror round results to the parent window when embedded in an iframe.
  Game.on('roundEnd', function (result) {
    try {
      if (global.parent && global.parent !== global) {
        global.parent.postMessage({ type: 'shot-stairs:roundEnd', result: result }, '*');
      }
    } catch (e) { /* cross-origin parent: ignore */ }
  });

  global.ShotStairs = api;
})(window);
