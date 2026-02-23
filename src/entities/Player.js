import { PLAYER as CFG } from '../config/constants.js';

/**
 * Tony "The Fork" Bellucci
 * Street enforcer. Family man. Will not let synthetic pasta
 * destroy the neighborhood.
 *
 * Combat resolution (damage / iframes / knockback) lives in GameScene._resolveHit.
 * Player only owns its own state mutations so the logic isn't duplicated.
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

    this._iframeUntil = 0;
    this._knockbackUntil = 0;
    this._attackCooldown = 0;
    // Hit dedup: _hitId changes each swing; _lastHitId records what hit us last
    this._hitId = 0;
    this._lastHitId = null;

    // Placeholder sprite — replace with spritesheet once art is ready
    this.sprite = scene.physics.add.image(x, y, 'pixel').setDisplaySize(48, 64);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setTint(0xff6600); // Tony's signature orange tracksuit

    // Separate hitbox — only enabled during the active hit frame of an attack
    this.hitbox = scene.physics.add.image(x, y, 'pixel').setDisplaySize(40, 40);
    this.hitbox.setAlpha(0);
    this.hitbox.body.enable = false;

    this._cursors = scene.input.keyboard.createCursorKeys();
    this._keys = scene.input.keyboard.addKeys({
      punch: Phaser.Input.Keyboard.KeyCodes.Z,
      kick:  Phaser.Input.Keyboard.KeyCodes.X,
      block: Phaser.Input.Keyboard.KeyCodes.C,
    });
  }

  // ─── Accessors ────────────────────────────────────────────────────────────────

  get isInvulnerable() {
    return this.scene.time.now < this._iframeUntil;
  }

  /** Current swing ID — changes every _beginAttack call. Used for hit dedup. */
  get currentHitId() { return String(this._hitId); }

  /**
   * True while the player is actively blocking (C held, parry window may be open).
   * Currently always false — mechanic reserved for future tuning.
   * Passed as defender.isBlocking to the pure resolveHit function.
   */
  get isBlocking() { return false; }

  /**
   * Human-readable state string for the debug HUD.
   * Priority order matters: a hit during an attack is still 'attack'.
   */
  get debugState() {
    const now = this.scene.time.now;
    if (this.isDead)                       return 'dead';
    if (this.isAttacking)                  return 'attack';
    if (now < this._iframeUntil)           return 'iframes';
    if (this.parrySystem.isWindowActive)   return 'parry';
    return 'idle';
  }

  // ─── Per-frame update ────────────────────────────────────────────────────────

  update(time, _delta) {
    if (this.isDead) return;
    this._handleMovement();
    this._handleCombat(time);
    // Glue hitbox to the side Tony is facing
    this.hitbox.setPosition(
      this.sprite.x + (this.sprite.flipX ? -40 : 40),
      this.sprite.y,
    );
  }

  // ─── Movement ────────────────────────────────────────────────────────────────

  _handleMovement() {
    // Don't override a knockback impulse until it expires
    if (this.scene.time.now < this._knockbackUntil) return;

    const { body } = this.sprite;
    body.setVelocity(0);

    if (this._cursors.left.isDown) {
      body.setVelocityX(-CFG.SPEED);
      this.sprite.setFlipX(true);
    } else if (this._cursors.right.isDown) {
      body.setVelocityX(CFG.SPEED);
      this.sprite.setFlipX(false);
    }

    if (this._cursors.up.isDown)        body.setVelocityY(-CFG.SPEED * 0.6);
    else if (this._cursors.down.isDown) body.setVelocityY(CFG.SPEED * 0.6);
  }

  // ─── Combat input ────────────────────────────────────────────────────────────

  _handleCombat(time) {
    if (this._attackCooldown > time) return;

    if (Phaser.Input.Keyboard.JustDown(this._keys.block)) {
      this.parrySystem.attemptParry(time);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this._keys.punch)) {
      this._beginAttack(CFG.PUNCH_DAMAGE, 350);
    } else if (Phaser.Input.Keyboard.JustDown(this._keys.kick)) {
      this._beginAttack(CFG.KICK_DAMAGE, 500);
    }
  }

  _beginAttack(damage, cooldownMs) {
    this._hitId++;            // new ID per swing — resolveHit uses it to prevent multi-hit
    this.currentAttackDamage = damage;
    this.isAttacking = true;
    this.hitbox.body.enable = true;

    this.scene.time.delayedCall(120, () => {
      this.isAttacking = false;
      this.hitbox.body.enable = false;
      this.currentAttackDamage = 0;
    });

    this._attackCooldown = this.scene.time.now + cooldownMs;
  }

  // ─── Mutation API (called exclusively by GameScene._resolveHit) ───────────────

  /** Consume HP. Does not handle iframes or knockback — resolveHit does that. */
  applyDamage(amount) {
    if (this.isDead) return;

    // Give parry system first crack at absorbing the hit
    if (this.parrySystem.checkIncomingAttack(this.scene.time.now, this.respectMeter)) {
      return; // parried — no damage taken
    }

    this.health = Math.max(0, this.health - amount);
    this.scene.events.emit('healthChanged', this.health);

    // Hit flash
    this.scene.tweens.add({
      targets: this.sprite,
      tint: 0xff0000,
      duration: 80,
      yoyo: true,
      onComplete: () => this.sprite.setTint(0xff6600),
    });

    if (this.health <= 0) this._die();
  }

  /** Arm the iframe window. Called by resolveHit before applying damage. */
  setIframes(untilMs) {
    this._iframeUntil = untilMs;
  }

  /**
   * Apply a directional velocity impulse that blocks player input for `duration` ms.
   * @param {number} dir      +1 = right, -1 = left
   * @param {number} speedX   horizontal magnitude
   * @param {number} speedY   vertical component (negative = upward)
   * @param {number} duration ms before movement input resumes
   */
  applyKnockback(dir, speedX, speedY, duration) {
    this._knockbackUntil = this.scene.time.now + duration;
    this.sprite.body.setVelocity(dir * speedX, speedY);
    this.scene.time.delayedCall(duration, () => {
      if (!this.isDead) this.sprite.body.setVelocity(0, 0);
    });
  }

  // ─── Death ───────────────────────────────────────────────────────────────────

  _die() {
    this.isDead = true;
    this.sprite.setTint(0x555555);
    this.scene.time.delayedCall(2000, () => this.scene.scene.restart());
  }
}
