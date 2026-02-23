/**
 * Pure respect math — no Phaser, no side effects.
 *
 * RespectMeter.adjust() calls applyRespect() for the arithmetic so every
 * caller (GameScene, Enemy._die, etc.) goes through the same clamped path.
 */

import { RESPECT } from '../config/constants.js';

/**
 * Apply a signed delta to the current respect value and clamp the result.
 *
 * @param {number} current — current respect value
 * @param {number} delta   — signed change (positive = gain, negative = loss)
 * @returns {number}       — new value in [0, RESPECT.MAX]
 */
export function applyRespect(current, delta) {
  return Math.min(RESPECT.MAX, Math.max(0, current + delta));
}
