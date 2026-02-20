import { RESPECT } from '../config/constants.js';
import { applyRespect } from '../logic/respect.js';

/**
 * RespectMeter — tracks Tony's honor in the neighborhood.
 *
 * Fight clean: mobsters back you up.
 * Fight dirty: the old-school guys walk. You're on your own.
 */
export default class RespectMeter {
  constructor(scene, initialValue = RESPECT.START) {
    this._scene = scene;
    this._value = Math.min(RESPECT.MAX, Math.max(0, initialValue));
  }

  get value() {
    return this._value;
  }

  /** Positive amount = gaining respect. Negative = losing it. */
  adjust(amount) {
    this._value = applyRespect(this._value, amount);
    this._scene.events.emit('respectChanged', this._value);
  }

  get hasMobsterSupport() {
    return this._value >= RESPECT.THRESHOLD_MOBSTER_HELP;
  }
}
