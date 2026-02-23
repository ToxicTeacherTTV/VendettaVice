import { PLAYER as CFG, RESPECT } from '../config/constants.js';

/**
 * Tony "The Fork" Bellucci
 * Street enforcer. Family man. Will not let synthetic pasta
 * destroy the neighborhood.
 */
export default class Player {
  constructor(scene, x, y, respectMeter, parrySystem) {
    this.scene = scene;
    this.respectMeter = respectMeter;
    this.parrySystem = parrySystem;

    this.health = CFG.HEALTH;
    this.currentAttackDamage = 0;
    this.isAttacking = false;
    this.isDead = false;

    // Placeholder sprite — replace with spritesheet once art is ready
    this.sprite = scene.physics.add.image(x, y, '__DEFAULT').setDisplaySize(48, 64);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setTint(0xff6600); // Tony's signature orange tracksuit

    // Separate hitbox for attack detection
    this.hitbox = scene.physics.add.image(x, y, '__DEFAULT').setDisplaySize(40, 40);
    this.hitbox.setAlpha(0);
    this.hitbox.body.enable = false;

    // Input
    this._cursors = scene.input.keyboard.createCursorKeys();
    this._keys = scene.input.keyboard.addKeys({
      punch: Phaser.Input.Keyboard.KeyCodes.Z,
      kick: Phaser.Input.Keyboard.KeyCodes.X,
      block: Phaser.Input.Keyboard.KeyCodes.C,
    });

    this._attackCooldown = 0;
  }

  update(time, delta) {
    if (this.isDead) return;

    this._handleMovement();
    this._handleCombat(time);

    // Keep hitbox glued to player
    this.hitbox.setPosition(
      this.sprite.x + (this.sprite.flipX ? -40 : 40),
      this.sprite.y
    );
  }

  _handleMovement() {
    const speed = CFG.SPEED;
    const body = this.sprite.body;

    body.setVelocity(0);

    if (this._cursors.left.isDown) {
      body.setVelocityX(-speed);
      this.sprite.setFlipX(true);
    } else if (this._cursors.right.isDown) {
      body.setVelocityX(speed);
      this.sprite.setFlipX(false);
    }

    if (this._cursors.up.isDown) {
      body.setVelocityY(-speed * 0.6);
    } else if (this._cursors.down.isDown) {
      body.setVelocityY(speed * 0.6);
    }
  }

  _handleCombat(time) {
    if (this._attackCooldown > time) return;

    if (Phaser.Input.Keyboard.JustDown(this._keys.block)) {
      this.parrySystem.attemptParry(time);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this._keys.punch)) {
      this._attack(CFG.PUNCH_DAMAGE, 350, false);
    } else if (Phaser.Input.Keyboard.JustDown(this._keys.kick)) {
      this._attack(CFG.KICK_DAMAGE, 500, false);
    }
  }

  _attack(damage, cooldownMs, isDirty) {
    this.currentAttackDamage = damage;
    this.isAttacking = true;
    this.hitbox.body.enable = true;

    if (isDirty) {
      this.respectMeter.adjust(-RESPECT.PENALTY_CHEAP_SHOT);
    }

    this.scene.time.delayedCall(120, () => {
      this.isAttacking = false;
      this.hitbox.body.enable = false;
      this.currentAttackDamage = 0;
    });

    this._attackCooldown = this.scene.time.now + cooldownMs;
  }

  /**
   * Environmental kill — shove enemy into pizza oven, etc.
   * Slightly dirty but spectacular.
   */
  environmentalKill(enemy) {
    enemy.takeDamage(CFG.ENVIRONMENTAL_KILL_DAMAGE, this, this.respectMeter);
    this.respectMeter.adjust(-RESPECT.PENALTY_ENVIRON_KILL);
  }

  takeDamage(amount) {
    if (this.isDead) return;

    // Give parry system first crack at absorbing the hit
    if (this.parrySystem.checkIncomingAttack(this.scene.time.now, this.respectMeter)) {
      return; // parried — no damage taken
    }

    this.health = Math.max(0, this.health - amount);
    this.scene.events.emit('healthChanged', this.health);

    // Flash red
    this.scene.tweens.add({
      targets: this.sprite,
      tint: 0xff0000,
      duration: 80,
      yoyo: true,
      onComplete: () => this.sprite.setTint(0xff6600),
    });

    if (this.health <= 0) this._die();
  }

  _die() {
    this.isDead = true;
    this.sprite.setTint(0x555555);
    this.scene.time.delayedCall(2000, () => {
      this.scene.scene.restart();
    });
  }
}
