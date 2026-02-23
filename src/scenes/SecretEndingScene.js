import { SCENE } from '../config/constants.js';

/**
 * SecretEndingScene — reached only by entering the Omertà code on the title screen.
 * Tony made the right choices. The neighborhood remembers.
 */
export default class SecretEndingScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.SECRET_ENDING });
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0);

    this.add.text(width / 2, height * 0.28, 'OMERTÀ', {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: '#ff3300',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.50,
      'You kept the code.\nThe neighborhood is safe.\nFor now.', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffcc00',
        align: 'center',
      }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.76, 'PRESS ENTER TO RETURN', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#666666',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start(SCENE.TITLE);
    });
  }
}
