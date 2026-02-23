/**
 * Pure combat resolver — no Phaser, no side effects.
 *
 * GameScene._resolveHit builds plain defender/attack objects from its Phaser
 * entities, calls resolveHit(), then applies the returned result to sprites.
 * Tests call resolveHit() directly with plain objects.
 */

import { COMBAT, RESPECT } from '../config/constants.js';

/**
 * @typedef {Object} Defender
 * @property {number}       iframeUntil  — ms timestamp; hit ignored while nowMs < this
 * @property {number}       parryUntil   — ms timestamp; parried while nowMs <= this
 * @property {boolean}      isBlocking   — reduces incoming damage by BLOCK_DAMAGE_REDUCTION
 * @property {number}       health       — current HP
 * @property {string|null}  lastHitId    — ID of most recently applied hit (dedup guard)
 *
 * @typedef {Object} Attack
 * @property {number}       damage
 * @property {string|null}  hitId        — unique per swing; same ID can't hit the same defender twice
 *
 * @typedef {Object} HitResult
 * @property {'ignored'|'parried'|'blocked'|'hit'} outcome
 * @property {number}   damageDealt     — 0 for ignored / parried
 * @property {number}   newHealth       — defender.health after the hit
 * @property {number}   iframeUntil     — new iframe expiry (unchanged if ignored/parried)
 * @property {boolean}  attackerStunned — true only on a successful parry
 * @property {number}   respectDelta    — signed change to apply to the respect meter
 */

/**
 * Resolve a single hit attempt.
 *
 * Priority order (matches existing Phaser behaviour):
 *   1. hitId dedup   — same swing can't hit the same defender twice
 *   2. iframes       — defender is invulnerable; ignore
 *   3. parry window  — defender absorbed the blow; stun attacker, gain respect
 *   4. blocking      — partial damage reduction
 *   5. normal hit    — full damage, iframes applied
 *
 * @param {{ nowMs: number, defender: Defender, attack: Attack }} params
 * @returns {HitResult}
 */
export function resolveHit({ nowMs, defender, attack }) {
  // ── 1. Dedup: the same hitId can't apply to the same defender twice ──────────
  if (attack.hitId !== null && attack.hitId === defender.lastHitId) {
    return _ignore(defender);
  }

  // ── 2. Iframes: defender is currently invulnerable ───────────────────────────
  if (nowMs < defender.iframeUntil) {
    return _ignore(defender);
  }

  // ── 3. Parry: defender had the window open ────────────────────────────────────
  if (nowMs <= defender.parryUntil) {
    return {
      outcome:        'parried',
      damageDealt:    0,
      newHealth:      defender.health,
      iframeUntil:    defender.iframeUntil, // unchanged — attacker gets stunned, not defender
      attackerStunned: true,
      respectDelta:   RESPECT.GAIN_PARRY,
    };
  }

  // ── 4. Block: damage reduction ────────────────────────────────────────────────
  if (defender.isBlocking) {
    const reduced = Math.ceil(attack.damage * COMBAT.BLOCK_DAMAGE_REDUCTION);
    return {
      outcome:        'blocked',
      damageDealt:    reduced,
      newHealth:      Math.max(0, defender.health - reduced),
      iframeUntil:    nowMs + COMBAT.IFRAME_DURATION_MS,
      attackerStunned: false,
      respectDelta:   0,
    };
  }

  // ── 5. Normal hit ─────────────────────────────────────────────────────────────
  return {
    outcome:        'hit',
    damageDealt:    attack.damage,
    newHealth:      Math.max(0, defender.health - attack.damage),
    iframeUntil:    nowMs + COMBAT.IFRAME_DURATION_MS,
    attackerStunned: false,
    respectDelta:   0,
  };
}

function _ignore(defender) {
  return {
    outcome:        'ignored',
    damageDealt:    0,
    newHealth:      defender.health,
    iframeUntil:    defender.iframeUntil,
    attackerStunned: false,
    respectDelta:   0,
  };
}
