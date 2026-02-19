import { SCENE, PLAYER as PLAYER_CONFIG, RESPECT, ENEMY_TYPE } from '../config/constants.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import RespectMeter from '../systems/RespectMeter.js';
import ParrySystem from '../systems/ParrySystem.js';

// Wave definitions — deterministic, index = wave number (0-based)
// Positions are world-x so the player has to move forward.
const WAVES = [
  // Wave 1
  [
    { x: 400, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 550, yFrac: 0.65, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 700, yFrac: 0.60, type: ENEMY_TYPE.TRACKSUIT_GOON },
  ],
  // Wave 2
  [
    { x: 350, yFrac: 0.60, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 500, yFrac: 0.65, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 650, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 800, yFrac: 0.61, type: ENEMY_TYPE.TRACKSUIT_GOON },
  ],
  // Wave 3
  [
    { x: 300, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 500, yFrac: 0.60, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 700, yFrac: 0.65, type: ENEMY_TYPE.ENFORCER },
    { x: 900, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 1050, yFrac: 0.63, type: ENEMY_TYPE.TRACKSUIT_GOON },
  ],
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.GAME });
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

    // --- Enemy tracking ---
    // Plain array of Enemy instances; separate Phaser group for hurtbox overlap.
    this._enemies = [];
    this._hurtboxGroup = this.add.group();

    // --- Physics overlap: player hitbox vs all enemy hurtboxes ---
    this.physics.add.overlap(
      this.player.hitbox,
      this._hurtboxGroup,
      (_playerHitbox, enemyHurtbox) => {
        if (!this.player.isAttacking || this.player.currentAttackDamage <= 0) return;
        const enemy = enemyHurtbox.getData('owner');
        if (enemy && !enemy.isDead) {
          enemy.takeDamage(this.player.currentAttackDamage, this.player, this.respectMeter);
        }
      }
    );

    // --- Input: grab key for environmental kill ---
    this._grabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);

    // --- Waves ---
    this._waveIndex = 0;
    this._waveDelay = false;
    this._spawnWave(this._waveIndex);

    // --- Camera ---
    this.cameras.main.setBounds(0, 0, width * 2, height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // Emit initial UI values
    this.events.emit('respectChanged', this.respectMeter.value);
    this.events.emit('healthChanged', PLAYER_CONFIG.HEALTH);
  }

  update(time, delta) {
    this.player.update(time, delta);
    this.parrySystem.update(time);

    this._enemies.forEach((enemy) => enemy.update(time, delta, this.player));

    this._checkOvenKill();
    this._checkWaveAdvance();

    if (this.respectMeter.value < RESPECT.THRESHOLD_MOBSTER_HELP) {
      this.events.emit('mobstersSplit');
    }
  }

  // ─── Spawning ────────────────────────────────────────────────────────────────

  _spawnEnemy(x, y, type) {
    const enemy = new Enemy(this, x, y, type, this.respectMeter);
    this._enemies.push(enemy);
    this._hurtboxGroup.add(enemy.hurtbox);
    return enemy;
  }

  _spawnWave(index) {
    const { height } = this.scale;
    const defs = WAVES[index] ?? WAVES[WAVES.length - 1]; // loop last wave if past end
    defs.forEach(({ x, yFrac, type }) => {
      this._spawnEnemy(x, height * yFrac, type);
    });
  }

  // ─── Wave advance ─────────────────────────────────────────────────────────────

  _checkWaveAdvance() {
    if (this._waveDelay || this.player.isDead) return;

    const alive = this._enemies.filter((e) => !e.isDead).length;
    if (alive === 0) {
      this._waveDelay = true;
      this.time.delayedCall(2000, () => {
        this._waveIndex++;
        this._spawnWave(this._waveIndex);
        this._waveDelay = false;
      });
    }
  }

  // ─── Environmental kill ───────────────────────────────────────────────────────

  _checkOvenKill() {
    if (!Phaser.Input.Keyboard.JustDown(this._grabKey)) return;

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    // Player must be within 150px of oven center
    if (Math.abs(px - this._ovenCX) > 150 || Math.abs(py - this._ovenCY) > 100) return;

    // Find closest living enemy near the oven
    let target = null;
    let closest = Infinity;
    this._enemies.forEach((e) => {
      if (e.isDead) return;
      const d = Phaser.Math.Distance.Between(e.sprite.x, e.sprite.y, this._ovenCX, this._ovenCY);
      if (d < 120 && d < closest) {
        closest = d;
        target = e;
      }
    });

    if (target) {
      this.player.environmentalKill(target);
      // Screen shake for drama
      this.cameras.main.shake(250, 0.012);
    }
  }

  // ─── World building ───────────────────────────────────────────────────────────

  _buildStreet(width, height) {
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

    // Label so players know it's interactive
    this.add.text(ovenX + 40, ovenY - 14, '[V] OVEN', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ff9944',
    }).setOrigin(0.5, 1);

    // Store center for distance checks in _checkOvenKill
    this._ovenCX = ovenX + 40;
    this._ovenCY = ovenY + 30;
  }
}
