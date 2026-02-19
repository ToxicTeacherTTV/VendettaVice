import { ENEMY_TYPE, RESPECT } from '../config/constants.js';

const ENEMY_STATS = {
  [ENEMY_TYPE.TRACKSUIT_GOON]: { health: 40, speed: 80, damage: 8, color: 0x4444ff },
  [ENEMY_TYPE.PASTA_DEALER]:   { health: 25, speed: 60, damage: 5, color: 0x00cc44 },
  [ENEMY_TYPE.ENFORCER]:       { health: 80, speed: 70, damage: 15, color: 0xaa0000 },
  [ENEMY_TYPE.EARL_GREY_AGENT]:{ health: 60, speed: 100, damage: 12, color: 0x888855 },
};

export default class Enemy {
  constructor(scene, x, y, type, respectMeter) {
    this.scene = scene;
    this.type = type;
    this.respectMeter = respectMeter;

    const stats = ENEMY_STATS[type] ?? ENEMY_STATS[ENEMY_TYPE.TRACKSUIT_GOON];
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;

    this.isDead = false;
    this._attackTimer = 0;
    this._state = 'patrol'; // patrol | chase | attack | stunned

    // Placeholder sprite
    this.sprite = scene.physics.add.image(x, y, '__DEFAULT').setDisplaySize(40, 60);
    this.sprite.setTint(stats.color);
    this.sprite.setCollideWorldBounds(true);

    // Hurtbox — where the player can hit this enemy
    this.hurtbox = scene.add.zone(x, y, 44, 64);
    scene.physics.world.enable(this.hurtbox);
    this.hurtbox.setData('owner', this);

    // Health bar
    this._healthBarBg = scene.add.rectangle(x, y - 40, 40, 5, 0x440000);
    this._healthBar   = scene.add.rectangle(x, y - 40, 40, 5, 0xff3300);
  }

  update(time, delta, player) {
    if (this.isDead) return;

    // Sync hurtbox and health bar to sprite position
    this.hurtbox.setPosition(this.sprite.x, this.sprite.y);
    this._healthBarBg.setPosition(this.sprite.x, this.sprite.y - 40);
    this._healthBar.setPosition(this.sprite.x, this.sprite.y - 40);

    this._ai(time, player);
  }

  _ai(time, player) {
    if (this._state === 'stunned') return;

    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );

    if (dist < 50) {
      this._state = 'attack';
    } else if (dist < 300) {
      this._state = 'chase';
    } else {
      this._state = 'patrol';
    }

    if (this._state === 'chase') {
      this.scene.physics.moveToObject(this.sprite, player.sprite, this.speed);
    } else if (this._state === 'attack') {
      this.sprite.body.setVelocity(0);
      if (time > this._attackTimer) {
        player.takeDamage(this.damage);
        this._attackTimer = time + 1200;
      }
    } else {
      // Lazy patrol — drift side to side
      if (!this._patrolDir || this._patrolTimer < time) {
        this._patrolDir = Math.random() > 0.5 ? 1 : -1;
        this._patrolTimer = time + Phaser.Math.Between(1500, 3000);
      }
      this.sprite.body.setVelocityX(this._patrolDir * 30);
    }
  }

  takeDamage(amount, attacker, respectMeter) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);

    // Update health bar width
    const pct = this.health / this.maxHealth;
    this._healthBar.width = 40 * pct;

    this._state = 'stunned';
    this.scene.time.delayedCall(300, () => {
      if (!this.isDead) this._state = 'chase';
    });

    if (this.health <= 0) {
      this._die(respectMeter);
    }
  }

  _die(respectMeter) {
    this.isDead = true;
    respectMeter.adjust(RESPECT.GAIN_CLEAN_KO);
    this.scene.events.emit('respectChanged', respectMeter.value);

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      y: this.sprite.y + 20,
      duration: 400,
      onComplete: () => {
        this.sprite.destroy();
        this.hurtbox.destroy();
        this._healthBarBg.destroy();
        this._healthBar.destroy();
      },
    });
  }
}
