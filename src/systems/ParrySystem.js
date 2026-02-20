import { RESPECT } from '../config/constants.js';

/**
 * ParrySystem — Vendetta Vice's legendary ahead-of-its-time parry mechanic.
 *
 * Block at the right moment to deflect an incoming hit, stun the attacker,
 * and earn respect with the old-school guys.
 */
export default class ParrySystem {
  constructor(scene, windowMs, cooldownMs) {
    this._scene = scene;
    this._windowMs = windowMs;
    this._cooldownMs = cooldownMs;

    this._parryActiveUntil = 0;
    this._cooldownUntil = 0;
    this._successCallbacks = [];
  }

  /** Called by Player when the block key is pressed. */
  attemptParry(now) {
    if (now < this._cooldownUntil) return false;

    this._parryActiveUntil = now + this._windowMs;
    this._cooldownUntil = now + this._cooldownMs;

    // Visual flash — brief white outline on player to signal active parry window
    this._scene.cameras.main.flash(80, 255, 255, 255, false);

    return true;
  }

  /**
   * Call this when an incoming attack lands.
   * Returns true if the parry absorbed it.
   */
  checkIncomingAttack(now, respectMeter) {
    if (now <= this._parryActiveUntil) {
      // Perfect parry!
      this._parryActiveUntil = 0;
      respectMeter.adjust(RESPECT.GAIN_PARRY);
      this._scene.cameras.main.flash(120, 255, 200, 0, false);
      this._successCallbacks.forEach((cb) => cb());
      return true;
    }
    return false;
  }

  update(now) {
    // Nothing to tick — state is purely time-based
  }

  onParrySuccess(cb) {
    this._successCallbacks.push(cb);
  }

  // ─── Accessors for pure resolveHit ───────────────────────────────────────────

  /** Raw timestamp: parry window is open while nowMs <= parryUntil. */
  get parryUntil() {
    return this._parryActiveUntil;
  }

  /**
   * Consume the parry window after resolveHit() reports outcome='parried'.
   * Fires the success flash and any registered callbacks.
   */
  consumeParry() {
    this._parryActiveUntil = 0;
    this._scene.cameras.main.flash(120, 255, 200, 0, false);
    this._successCallbacks.forEach((cb) => cb());
  }

  // ─── Debug accessors ─────────────────────────────────────────────────────────

  /** True while the parry window is open (C was pressed recently). */
  get isWindowActive() {
    return this._scene.time.now < this._parryActiveUntil;
  }

  /** Milliseconds remaining in the current parry window, or 0 if inactive. */
  get windowRemainingMs() {
    return Math.max(0, this._parryActiveUntil - this._scene.time.now);
  }
}
