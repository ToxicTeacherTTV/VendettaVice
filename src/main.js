import Phaser from 'phaser';
import { GAME, SCENE } from './config/constants.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import SecretEndingScene from './scenes/SecretEndingScene.js';
import DebugScene from './scenes/DebugScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: GAME.BACKGROUND_COLOR,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, GameScene, UIScene, SecretEndingScene, DebugScene],
};

const game = new Phaser.Game(config);

export default game;
