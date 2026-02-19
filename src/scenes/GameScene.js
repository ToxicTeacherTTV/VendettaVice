import { SCENE, PLAYER as PLAYER_CONFIG, RESPECT } from '../config/constants.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import RespectMeter from '../systems/RespectMeter.js';
import ParrySystem from '../systems/ParrySystem.js';
import { ENEMY_TYPE } from '../config/constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.GAME });
    this.player = null;
    this.enemies = null;
    this.respectMeter = null;
    this.parrySystem = null;
  }

  create() {
    const { width, height } = this.scale;

    // --- World ---
    this._buildStreet(width, height);

    // --- Systems ---
    this.respectMeter = new RespectMeter(this, RESPECT.START);
    this.parrySystem = new ParrySystem(this, PLAYER_CONFIG.PARRY_WINDOW_MS, PLAYER_CONFIG.PARRY_COOLDOWN_MS);

    // --- Player ---
    this.player = new Player(this, 160, height * 0.62, this.respectMeter, this.parrySystem);

    // --- Enemies ---
    this.enemies = this.add.group();
    this._spawnInitialEnemies(width, height);

    // --- Physics ---
    this.physics.add.overlap(
      this.player.hitbox,
      this.enemies.getChildren().map((e) => e.hurtbox),
      (playerHitbox, enemyHurtbox) => {
        const enemy = enemyHurtbox.getData('owner');
        if (enemy) enemy.takeDamage(this.player.currentAttackDamage, this.player, this.respectMeter);
      }
    );

    // --- Camera ---
    this.cameras.main.setBounds(0, 0, width * 2, height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // Emit initial respect value so UI can sync
    this.events.emit('respectChanged', this.respectMeter.value);
    this.events.emit('healthChanged', PLAYER_CONFIG.HEALTH);
  }

  update(time, delta) {
    this.player.update(time, delta);
    this.parrySystem.update(time);

    this.enemies.getChildren().forEach((enemy) => enemy.update(time, delta, this.player));

    // Check if all mobster support is lost
    if (this.respectMeter.value < RESPECT.THRESHOLD_MOBSTER_HELP) {
      this.events.emit('mobstersSplit');
    }
  }

  _buildStreet(width, height) {
    // Neon Little Italy backdrop — placeholder rectangles until art ships
    const g = this.add.graphics();

    // Sky
    g.fillStyle(0x0a0005);
    g.fillRect(0, 0, width * 2, height * 0.5);

    // Ground / sidewalk
    g.fillStyle(0x1a1010);
    g.fillRect(0, height * 0.5, width * 2, height * 0.5);

    // Neon street line
    g.lineStyle(3, 0xff3300, 0.8);
    g.moveTo(0, height * 0.72);
    g.lineTo(width * 2, height * 0.72);
    g.strokePath();

    // Pizza oven — environmental kill zone
    const ovenX = 640;
    const ovenY = height * 0.55;
    g.fillStyle(0x882200);
    g.fillRect(ovenX, ovenY, 80, 60);
    g.fillStyle(0xff6600);
    g.fillRect(ovenX + 10, ovenY + 10, 60, 40);

    // Mark oven as environmental kill trigger
    const ovenZone = this.add.zone(ovenX + 40, ovenY + 30, 80, 60);
    this.physics.world.enable(ovenZone);
    ovenZone.setData('type', 'envKill');
    ovenZone.setData('label', 'PIZZA OVEN');

    this.ovenZone = ovenZone;
  }

  _spawnInitialEnemies(width, height) {
    const spawnPoints = [
      { x: 400, y: height * 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
      { x: 550, y: height * 0.65, type: ENEMY_TYPE.PASTA_DEALER },
      { x: 750, y: height * 0.60, type: ENEMY_TYPE.TRACKSUIT_GOON },
    ];

    spawnPoints.forEach(({ x, y, type }) => {
      const enemy = new Enemy(this, x, y, type, this.respectMeter);
      this.enemies.add(enemy);
    });
  }
}
