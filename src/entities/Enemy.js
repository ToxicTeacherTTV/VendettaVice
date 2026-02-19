import { ENEMY_TYPE, ENEMY_HP, RESPECT, COMBAT } from '../config/constants.js';

const ENEMY_STATS = {
  [ENEMY_TYPE.TRACKSUIT_GOON]: { health: ENEMY_HP.TRACKSUIT_GOON, speed: 80,  damage: 8,  color: 0x4444ff },
  [ENEMY_TYPE.PASTA_DEALER]:   { health: ENEMY_HP.PASTA_DEALER,   speed: 60,  damage: 5,  color: 0x00cc44 },
  [ENEMY_TYPE.ENFORCER]:       { health: ENEMY_HP.ENFORCER,       speed: 70,  damage: 15, color: 0xaa0000 },
  [ENEMY_TYPE.EARL_GREY_AGENT]:{ health: ENEMY_HP.EARL_GREY_AGENT,speed: 100, damage: 12, color: 0x888855 },
};

/**
 * Enemy AI uses a strict state machine:
 *   patrol ↔ chase → telegraph → (hit frame fires _onAttack) → recovery → patrol
 *                                                              ↓ (if hit/parried)
 *                                                           stunned → patrol
 *
 * All damage, iframes, knockback, and parry checking live in GameScene._resolveHit.
 * Enemy only owns its own state mutations.
 */
export default class Enemy {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} type  — one of ENEMY_TYPE
   * @param {RespectMeter} respectMeter
   * @param {function(Enemy):void} onAttack  — called at the hit frame; resolveHit lives there
   */
  constructor(scene, x, y, type, respectMeter, onAttack) {
    this.scene = scene;
    this.type = type;
    this.respectMeter = respectMeter;
    this._onAttack = onAttack;

    const stats = ENEMY_STATS[type] ?? ENEMY_STATS[ENEMY_TYPE.TRACKSUIT_GOON];
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this._baseColor = stats.color;

    this.isDead = false;
    this._state = 'patrol'; // patrol | chase | telegraph | recovery | stunned
    this._attackCooldown = 0;
    this._pendingHit = null; // delayedCall handle — cancelled on stun/death

    // Placeholder sprite
    this.sprite = scene.physics.add.image(x, y, '__DEFAULT').setDisplaySize(40, 60);
    this.sprite.setTint(this._baseColor);
    this.sprite.setCollideWorldBounds(true);

    // Hurtbox — separate zone so the player hitbox overlap fires cleanly
    this.hurtbox = scene.add.zone(x, y, 44, 64);
    scene.physics.world.enable(this.hurtbox);
    this.hurtbox.setData('owner', this);

    // Health bar
    this._healthBarBg = scene.add.rectangle(x, y - 40, 40, 5, 0x440000);
    this._healthBar   = scene.add.rectangle(x, y - 40, 40, 5, 0xff3300);
  }

  // ─── Per-frame update ────────────────────────────────────────────────────────

  update(time, _delta, player) {
    if (this.isDead) return;

    // Sync hurtbox and health bar to sprite position
    this.hurtbox.setPosition(this.sprite.x, this.sprite.y);
    this._healthBarBg.setPosition(this.sprite.x, this.sprite.y - 40);
    this._healthBar.setPosition(this.sprite.x, this.sprite.y - 40);

    this._ai(time, player);
  }

  // ─── AI state machine ─────────────────────────────────────────────────────────

  _ai(time, player) {
    // These states are managed entirely by timers; don't override them here.
    if (this._state === 'stunned' ||
        this._state === 'telegraph' ||
        this._state === 'recovery') return;

    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y,
    );

    if (dist < 50) {
      // In striking range — stop moving
      this.sprite.body.setVelocity(0);
      if (time > this._attackCooldown) {
        this._beginAttack();
      }
      return;
    }

    if (dist < 300) {
      this._state = 'chase';
      this.scene.physics.moveToObject(this.sprite, player.sprite, this.speed);
    } else {
      this._state = 'patrol';
      if (!this._patrolDir || this._patrolTimer < time) {
        this._patrolDir = Math.random() > 0.5 ? 1 : -1;
        this._patrolTimer = time + Phaser.Math.Between(1500, 3000);
      }
      this.sprite.body.setVelocityX(this._patrolDir * 30);
    }
  }

  // ─── Discrete attack: telegraph → hit frame → recovery ───────────────────────

  _beginAttack() {
    this._state = 'telegraph';
    this.sprite.body.setVelocity(0); // stand still during wind-up
    this.sprite.setTint(0xffff00);   // yellow = telegraphing

    this._pendingHit = this.scene.time.delayedCall(COMBAT.TELEGRAPH_MS, () => {
      this._pendingHit = null;
      // Guard: another system may have changed state (e.g., stun on parry)
      if (this.isDead || this._state !== 'telegraph') return;

      // Hit frame — delegate entirely to GameScene._resolveHit via callback
      this._state = 'recovery';
      this.sprite.setTint(this._baseColor);
      this._onAttack(this);

      // After recovery, return to patrol so _ai can re-evaluate distance
      this.scene.time.delayedCall(COMBAT.RECOVERY_MS, () => {
        if (!this.isDead && this._state === 'recovery') this._state = 'patrol';
      });

      // Cooldown starts at the hit frame so back-to-back attacks are spaced out
      this._attackCooldown = this.scene.time.now + COMBAT.ATTACK_COOLDOWN_MS;
    });
  }

  // ─── Mutation API (called exclusively by GameScene._resolveHit) ───────────────

  /**
   * Consume HP and update health bar. Death handling included.
   * No knockback or stun here — resolveHit orchestrates those separately.
   */
  applyDamage(amount, respectMeter) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this._healthBar.width = 40 * (this.health / this.maxHealth);
    if (this.health <= 0) this._die(respectMeter);
  }

  /**
   * Apply a directional velocity impulse.
   * @param {number} dir      +1 = right, -1 = left
   * @param {number} speedX
   * @param {number} speedY   negative = upward
   * @param {number} duration ms until velocity is cleared
   */
  applyKnockback(dir, speedX, speedY, duration) {
    this.sprite.body.setVelocity(dir * speedX, speedY);
    this.scene.time.delayedCall(duration, () => {
      if (!this.isDead) this.sprite.body.setVelocity(0, 0);
    });
  }

  /**
   * Enter stunned state for `ms` milliseconds.
   * Cancels any in-flight telegraph so a parried/hit enemy can't still land a blow.
   */
  enterStun(ms) {
    if (this._pendingHit) {
      this._pendingHit.remove(false);
      this._pendingHit = null;
    }
    this.sprite.setTint(this._baseColor);
    this._state = 'stunned';
    this.scene.time.delayedCall(ms, () => {
      if (!this.isDead) this._state = 'patrol';
    });
  }

  // ─── Death ───────────────────────────────────────────────────────────────────

  _die(respectMeter) {
    // Cancel any pending attack
    if (this._pendingHit) {
      this._pendingHit.remove(false);
      this._pendingHit = null;
    }

    this.isDead = true;
    respectMeter.adjust(RESPECT.GAIN_CLEAN_KO);
    // RespectMeter.adjust already emits 'respectChanged', no need to re-emit here

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
