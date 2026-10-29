import { buildPrince } from './prince.js';
import { buildPlatforms } from './platforms.js';
import { buildCreatures } from './creatures.js';
import { buildTiles } from './tiles.js';
import { buildTrees } from './trees.js';
import { buildClouds } from './clouds.js';
import { buildLanterns } from './lanterns.js';

export function buildAllArt() {
  return {
    prince: buildPrince(),
    platforms: buildPlatforms(),
    creatures: buildCreatures(),
    tiles: buildTiles(),
    trees: buildTrees(),
    clouds: buildClouds(),
    lanterns: buildLanterns(),
  };
}
