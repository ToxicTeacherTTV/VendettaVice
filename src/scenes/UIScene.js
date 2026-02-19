import { SCENE, RESPECT, PLAYER as PLAYER_CONFIG } from '../config/constants.js';

// Runs in parallel with GameScene as an overlay
export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.UI });
  }

  create() {
    this._buildHealthBar();
    this._buildRespectBar();
    this._buildMobsterStatus();

    // Listen for game events
    const gameScene = this.scene.get(SCENE.GAME);
    gameScene.events.on('respectChanged', this._updateRespect, this);
    gameScene.events.on('healthChanged', this._updateHealth, this);
    gameScene.events.on('mobstersSplit', this._showMobstersLeft, this);
  }

  _buildHealthBar() {
    const { width } = this.scale;

    this.add.text(20, 16, "TONY 'THE FORK'", {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffcc00',
    });

    this._healthBg = this.add.rectangle(20, 36, 200, 16, 0x440000).setOrigin(0);
    this._healthBar = this.add.rectangle(20, 36, 200, 16, 0xff3300).setOrigin(0);
    this._healthText = this.add.text(228, 32, '100', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#ff3300',
    });
  }

  _buildRespectBar() {
    const { width } = this.scale;

    this.add.text(20, 60, 'RISPETTO', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    });

    this._respectBg = this.add.rectangle(20, 80, 200, 12, 0x222222).setOrigin(0);
    this._respectBar = this.add.rectangle(20, 80, 200 * (RESPECT.START / RESPECT.MAX), 12, 0xffcc00).setOrigin(0);
  }

  _buildMobsterStatus() {
    this._mobsterText = this.add.text(20, 104, 'Old-school: BACKING YOU', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#66ff66',
    });
  }

  _updateHealth(value) {
    const pct = Math.max(0, value / PLAYER_CONFIG.HEALTH);
    this._healthBar.width = 200 * pct;
    this._healthText.setText(String(Math.ceil(value)));
    if (pct < 0.3) this._healthBar.setFillStyle(0xff0000);
  }

  _updateRespect(value) {
    const pct = Math.max(0, value / RESPECT.MAX);
    this._respectBar.width = 200 * pct;

    if (value < RESPECT.THRESHOLD_MOBSTER_HELP) {
      this._respectBar.setFillStyle(0xff3300);
    } else if (value < 50) {
      this._respectBar.setFillStyle(0xff9900);
    } else {
      this._respectBar.setFillStyle(0xffcc00);
    }
  }

  _showMobstersLeft() {
    this._mobsterText.setText('Old-school: WALKED AWAY').setColor('#ff3300');
  }
}
