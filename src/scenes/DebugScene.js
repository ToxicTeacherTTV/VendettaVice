import { SCENE } from '../config/constants.js';

// Panel geometry (screen-space — this scene has no scrolling camera)
const PAD_X   = 700;
const PAD_Y   = 8;
const PAD_W   = 255;
const PAD_H   = 134;  // 6 rows × 16px + header + padding
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
 * F1  — toggle the full debug overlay.
 * ~   — toggle 0.25× slow-mo on the GameScene (time + physics + tweens).
 *       Works whether the overlay is visible or not.
 */
export default class DebugScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.DEBUG });
  }

  create() {
    this._gameScene = this.scene.get(SCENE.GAME);
    this._visible   = false;
    this._slowMo    = false;

    this._f1    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    this._tilde = this.input.keyboard.addKey(192); // ` / ~ key

    // ── Persistent slow-mo badge ──────────────────────────────────────────────
    // Shown in the bottom-left regardless of whether the F1 panel is open,
    // so you always know the time scale is distorted.
    this._slowBadge = this.add
      .text(8, this.cameras.main.height - 26, '◉ SLOW-MO  0.25×', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ff8800',
        backgroundColor: '#000000bb',
        padding: { x: 5, y: 3 },
      })
      .setVisible(false);

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

    // Title — hint both hotkeys
    this._panel.add(
      this.add.text(TXT_X, TXT_Y0, '[F1] DEBUG    [~] SLOW-MO', {
        ...STYLE,
        color: '#666666',
        fontSize: '11px',
      }),
    );

    // ── Data rows ─────────────────────────────────────────────────────────────
    const rows = ['player', 'parry', 'iframes', 'respect', 'wave', 'slowmo'];
    this._vals = {};

    rows.forEach((key, i) => {
      const y = TXT_Y1 + i * ROW_H;
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

    // ── Tilde: toggle 0.25× slow-mo ──────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this._tilde)) {
      this._slowMo = !this._slowMo;
      const scale = this._slowMo ? 0.25 : 1;
      const gs = this._gameScene;
      gs.time.timeScale          = scale;
      gs.physics.world.timeScale = scale;
      gs.tweens.timeScale        = scale;
      this._slowBadge.setVisible(this._slowMo);
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

    // slow-mo state
    this._vals.slowmo
      .setText(this._slowMo ? '0.25×  ON' : '1×  OFF')
      .setColor(this._slowMo ? '#ff8800' : '#555555');
  }
}
