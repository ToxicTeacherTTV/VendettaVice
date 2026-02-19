import { SCENE } from '../config/constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.BOOT });
  }

  preload() {
    // TODO: Load spritesheets, tilesets, audio, fonts
    // Placeholder graphics will be used until real assets are added.

    // Progress bar
    const bar = this.add.graphics();
    const bg = this.add.graphics();

    bg.fillStyle(0x222222, 1);
    bg.fillRect(280, 250, 400, 20);

    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0xff3300, 1);
      bar.fillRect(280, 250, 400 * value, 20);
    });

    this.load.on('complete', () => {
      bar.destroy();
      bg.destroy();
    });

    // Placeholder: generate colored rectangles as stand-in sprites
    // Replace with actual asset loads once art is ready.
  }

  create() {
    this.scene.start(SCENE.TITLE);
  }
}
