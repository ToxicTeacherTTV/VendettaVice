import { SCENE, OMERTA_CODE } from '../config/constants.js';
import OmertaCode from '../systems/OmertaCode.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.TITLE });
    this._omertaChecker = null;
  }

  create() {
    const { width, height } = this.scale;

    // Neon background
    this.add.rectangle(0, 0, width, height, 0x0a0005).setOrigin(0);

    // Neon grid lines — gives it that hyper-stylized Little Italy arcade feel
    this._drawNeonGrid();

    // Title
    this.add.text(width / 2, height * 0.28, 'VENDETTA VICE', {
      fontSize: '72px',
      fontFamily: 'monospace',
      color: '#ff3300',
      stroke: '#ff9900',
      strokeThickness: 4,
      shadow: { offsetX: 4, offsetY: 4, color: '#660000', blur: 8, fill: true },
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.44, "Tony 'The Fork' Bellucci\ndefends the neighborhood", {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffcc00',
      align: 'center',
    }).setOrigin(0.5);

    // Blinking start prompt
    const startText = this.add.text(width / 2, height * 0.65, 'PRESS ENTER TO START', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Omertà hint — subtle
    this.add.text(width / 2, height * 0.88, '...or speak the omertà', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#444444',
    }).setOrigin(0.5);

    // Input
    this._omertaChecker = new OmertaCode(this, OMERTA_CODE, () => {
      this.scene.start(SCENE.SECRET_ENDING);
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      this.scene.start(SCENE.GAME);
      this.scene.launch(SCENE.UI);
      this.scene.launch(SCENE.DEBUG); // starts hidden; F1 toggles overlay
    });
  }

  update() {
    this._omertaChecker.update();
  }

  _drawNeonGrid() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.lineStyle(1, 0x220033, 0.6);

    for (let x = 0; x < width; x += 60) {
      g.moveTo(x, 0);
      g.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 60) {
      g.moveTo(0, y);
      g.lineTo(width, y);
    }
    g.strokePath();
  }
}
