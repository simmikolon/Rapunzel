import { buildPrince } from './prince.js';
import { buildPlatforms } from './platforms.js';
import { buildCreatures } from './creatures.js';
import { buildTiles } from './tiles.js';

export function buildAllArt() {
  return {
    prince: buildPrince(),
    platforms: buildPlatforms(),
    creatures: buildCreatures(),
    tiles: buildTiles(),
  };
}
