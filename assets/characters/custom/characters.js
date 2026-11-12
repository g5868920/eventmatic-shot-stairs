/*
 * SHOT: character library. Every friend here can be assigned to 1P or 2P (config.js characterSkin.p1 /
 * characterSkin.p2, the title-screen selector, or ShotStairs.setCharacter). Player identity (1P/2P,
 * controls, colours, HUD side) never depends on the character.
 *
 *   id      unique key; sprites are assets/characters/custom/<id>-<height>.png (tools/build_custom_skins.py,
 *           sizes and foot anchors in skins.js) and, when present, <id>-anim.png (anims.js)
 *   name    display name (HUD, How to Play, results) unless players.pN.name overrides it
 *   source  full-resolution portrait, never modified
 *   Optional: animated (false = always use the static sprite), flip (false = never mirror when walking
 *   left), plus any custom fields an embedder wants to carry (ignored by the game).
 *
 * All seven have animation sheets (idle, walk, fall, land, hurt) from tools/build_custom_anim.py: the head,
 * face and hair come from each portrait; body, arms and legs are redrawn in the portrait's colours.
 */
window.SHOT_CHARACTERS = [
  { id: 'gina',  name: 'Gina',  source: 'assets/characters/custom/source/gina-q-version.png' },
  { id: 'rae',   name: 'Rae',   source: 'assets/characters/custom/source/rae-q-version.png' },
  { id: 'ariel', name: 'Ariel', source: 'assets/characters/custom/source/ariel-q-version.png' },
  { id: 'cindy', name: 'Cindy', source: 'assets/characters/custom/source/cindy-q-version.png' },
  { id: 'ken',   name: 'Ken',   source: 'assets/characters/custom/source/ken-q-version.png' },
  { id: 'linda', name: 'Linda', source: 'assets/characters/custom/source/linda-q-version.png' },
  { id: 'sandy', name: 'Sandy', source: 'assets/characters/custom/source/sandy-q-version.png' }
];
