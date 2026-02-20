import { SCENE } from '../config/constants.js';

// Panel geometry (screen-space — this scene has no scrolling camera)
const PAD_X   = 700;
const PAD_Y   = 8;
const PAD_W   = 255;
const PAD_H   = 118;
const TXT_X   = PAD_X + 8;
const TXT_Y0  = PAD_Y + 6;   // title row
const TXT_Y1  = PAD_Y + 22;  // first data row
const ROW_H   = 16;

const STYLE = { fontFamily: 'monospace', fontSize: '12px', color: '#cccccc' };

// Colour codes for each player state
const STATE_COLOR = {
  idle:    '#88ff88',
  attack:  '#ffff44',
  iframes: '#ff8844',
  parry:   '#44ffff',
  dead:    '#ff4444',
};

/**
 * DebugScene — runs in parallel with GameScene.
 *
 * Toggle with F1. Polls GameScene.debugSnapshot() every frame so it
 * never goes stale and requires zero extra events.
 */
export default class DebugScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.DEBUG });
  }

  create() {
    this._gameScene = this.scene.get(SCENE.GAME);
    this._visible   = false;

    this._f1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);

    // ── Panel container ───────────────────────────────────────────────────────
    this._panel = this.add.container(0, 0).setVisible(false);

    // Background
    this._panel.add(
      this.add.rectangle(PAD_X, PAD_Y, PAD_W, PAD_H, 0x000000, 0.72).setOrigin(0),
    );

    // Border
    const border = this.add.graphics();
    border.lineStyle(1, 0x444444, 1);
    border.strokeRect(PAD_X, PAD_Y, PAD_W, PAD_H);
    this._panel.add(border);

    // Title
    this._panel.add(
      this.add.text(TXT_X, TXT_Y0, '[F1] DEBUG HUD', {
        ...STYLE,
        color: '#666666',
        fontSize: '11px',
      }),
    );

    // ── Data rows ─────────────────────────────────────────────────────────────
    // Each row is a label (static) + a value (updated every frame)
    const rows = ['player', 'parry', 'iframes', 'respect', 'wave'];
    this._vals = {};

    rows.forEach((key, i) => {
      const y = TXT_Y1 + i * ROW_H;
      // Labels are fixed; right-pad to align values
      this._panel.add(this.add.text(TXT_X, y, `${key}:`, STYLE));
      const val = this.add.text(TXT_X + 70, y, '…', STYLE);
      this._panel.add(val);
      this._vals[key] = val;
    });
  }

  update() {
    // ── F1 toggle ─────────────────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this._f1)) {
      this._visible = !this._visible;
      this._panel.setVisible(this._visible);
    }

    if (!this._visible) return;

    // ── Poll GameScene ─────────────────────────────────────────────────────────
    const snap = this._gameScene?.debugSnapshot(this.time.now);
    if (!snap) return;

    // player state
    const stateColor = STATE_COLOR[snap.playerState] ?? '#cccccc';
    this._vals.player.setText(snap.playerState).setColor(stateColor);

    // parry window
    if (snap.parryActive) {
      this._vals.parry
        .setText(`YES  ${snap.parryRemainingMs | 0}ms`)
        .setColor('#44ffff');
    } else {
      this._vals.parry.setText('NO').setColor('#555555');
    }

    // iframes
    if (snap.iframeActive) {
      this._vals.iframes
        .setText(`YES  ${snap.iframeRemainingMs | 0}ms`)
        .setColor('#ff8844');
    } else {
      this._vals.iframes.setText('NO').setColor('#555555');
    }

    // respect
    this._vals.respect.setText(String(snap.respect)).setColor('#ffcc00');

    // wave + alive count
    this._vals.wave
      .setText(`${snap.waveIndex + 1}   alive: ${snap.aliveCount}`)
      .setColor('#aaaaaa');
  }
}
