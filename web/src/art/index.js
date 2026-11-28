import { buildPrince } from './prince.js';
import { buildLord } from './lord.js';
import { buildChimney } from './chimney.js';
import { makeCanvas } from './sprite.js';
import { buildPlatforms } from './platforms.js';
import { buildCreatures } from './creatures.js';
import { buildTiles } from './tiles.js';
import { buildTrees } from './trees.js';
import { buildClouds } from './clouds.js';
import { buildLanterns } from './lanterns.js';
import { buildWind } from './wind.js';
import { buildBalconies } from './balconies.js';
import { buildWindows } from './windows.js';
import { buildLogo } from './logo.js';
import { buildSign } from './sign.js';
import { buildPowerups } from './powerups.js';
import { buildLights } from './lights.js';
import { buildInterior } from './interior.js';
import { buildCat } from './cat.js';
import { buildVault } from './vault.js';
import { buildBackdrop } from './backdrop.js';
import { buildStory } from './story.js';
import { buildWeather } from './weather.js';
import { buildHud } from './hud.js';
import { buildHung } from './hung.js';
import { buildOutline } from './outline.js';

// A life in the HUD (the tower in stages): the prince's head with its crown, cut from his standing sprite.
function lifeIcon(prince) {
  const src = prince.right.standing, w = src.w, h = Math.round(src.h * 0.4);
  const canvas = makeCanvas(w, h);
  canvas.getContext('2d').drawImage(src.canvas, 0, 0, w, h, 0, 0, w, h);
  return { canvas, w, h, ax: w / 2, ay: h };
}

export function buildAllArt() {
  const prince = buildPrince();
  prince.life = lifeIcon(prince);
  return {
    prince,
    lord: buildLord(),
    chimney: buildChimney(),
    platforms: buildPlatforms(),
    creatures: buildCreatures(),
    tiles: buildTiles(),
    trees: buildTrees(),
    clouds: buildClouds(),
    lanterns: buildLanterns(),
    wind: buildWind(),
    balconies: buildBalconies(),
    windows: buildWindows(),
    logo: buildLogo(),
    sign: buildSign(),
    powerups: buildPowerups(),
    lights: buildLights(),
    interior: buildInterior(),
    cat: buildCat(),
    vault: buildVault(),
    backdrop: buildBackdrop(),
    story: buildStory(),
    weather: buildWeather(),
    hud: buildHud(),
    hung: buildHung(),
    outline: buildOutline(),
  };
}
