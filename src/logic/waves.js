/**
 * Wave data and pure wave-progression logic — no Phaser, no randomness.
 *
 * WAVES is the single source of truth for spawn layout.
 * GameScene imports it here instead of defining it inline, so tests can
 * assert on the exact same data the game uses.
 */

import { ENEMY_TYPE } from '../config/constants.js';

/**
 * Deterministic wave definitions.
 * Index = wave number (0-based). All positions are fixed numbers.
 */
export const WAVES = [
  // Wave 1 — 3 goons, spread out
  [
    { x: 400, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 550, yFrac: 0.65, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 700, yFrac: 0.60, type: ENEMY_TYPE.TRACKSUIT_GOON },
  ],
  // Wave 2 — 4 goons, tighter
  [
    { x: 350, yFrac: 0.60, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 500, yFrac: 0.65, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 650, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 800, yFrac: 0.61, type: ENEMY_TYPE.TRACKSUIT_GOON },
  ],
  // Wave 3 — 3 goons + 1 mini-boss (parry-pressure test)
  [
    { x: 300, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 500, yFrac: 0.60, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 700, yFrac: 0.65, type: ENEMY_TYPE.MINI_BOSS },
    { x: 900, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
  ],
];

/**
 * Pure wave-advance function.
 *
 * @param {{ waveIndex: number }} state
 * @param {typeof WAVES}         waves  — defaults to WAVES; pass a custom array in tests
 * @returns {{ waveIndex: number, defs: Array }}
 */
export function nextWave({ waveIndex }, waves = WAVES) {
  const newIndex = waveIndex + 1;
  return {
    waveIndex: newIndex,
    defs: waves[newIndex] ?? waves[waves.length - 1],
  };
}
