/**
 * OmertaCode — the secret ending gate.
 *
 * Only real ones know the sequence.
 * Input the omertà code on the title screen to access the secret ending
 * that Nicky hid from Earl Grey.
 */

const KEY_MAP = {
  UP:    Phaser.Input.Keyboard.KeyCodes.UP,
  DOWN:  Phaser.Input.Keyboard.KeyCodes.DOWN,
  LEFT:  Phaser.Input.Keyboard.KeyCodes.LEFT,
  RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
  PUNCH: Phaser.Input.Keyboard.KeyCodes.Z,
  KICK:  Phaser.Input.Keyboard.KeyCodes.X,
};

export default class OmertaCode {
  /**
   * @param {Phaser.Scene} scene
   * @param {string[]} code - sequence of key names from KEY_MAP
   * @param {Function} onSuccess - called when the full code is entered
   */
  constructor(scene, code, onSuccess) {
    this._scene = scene;
    this._code = code;
    this._onSuccess = onSuccess;
    this._progress = 0;
    this._resetTimer = null;

    // Register keyboard listeners for each unique key in the code
    const uniqueKeys = [...new Set(code)];
    uniqueKeys.forEach((key) => {
      scene.input.keyboard.on(`keydown-${key}`, () => this._onKey(key));
    });
  }

  _onKey(key) {
    // Clear any pending reset
    if (this._resetTimer) {
      this._resetTimer.remove();
      this._resetTimer = null;
    }

    if (key === this._code[this._progress]) {
      this._progress++;

      if (this._progress === this._code.length) {
        // Code complete — omertà unlocked
        this._progress = 0;
        this._onSuccess();
        return;
      }

      // If no next key pressed within 3 seconds, reset
      this._resetTimer = this._scene.time.delayedCall(3000, () => {
        this._progress = 0;
      });
    } else {
      // Wrong key — reset
      this._progress = 0;
    }
  }

  update() {
    // Nothing to poll — purely event-driven
  }
}
