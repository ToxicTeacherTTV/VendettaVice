import {
  SCENE,
  PLAYER as PLAYER_CFG,
  RESPECT,
  COMBAT,
  ENEMY_TYPE,
} from '../config/constants.js';
import Player from '../entities/Player.js';
import Enemy  from '../entities/Enemy.js';
import RespectMeter from '../systems/RespectMeter.js';
import ParrySystem  from '../systems/ParrySystem.js';

// ─── Wave definitions ─────────────────────────────────────────────────────────
// Fully deterministic: index = wave number (0-based), loops last wave when exhausted.
const WAVES = [
  // Wave 1 — 3 goons, spread out
  [
    { x: 400, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 550, yFrac: 0.65, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 700, yFrac: 0.60, type: ENEMY_TYPE.TRACKSUIT_GOON },
  ],
  // Wave 2 — 4 goons, tighter
  [
    { x: 350, yFrac: 0.60, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 500, yFrac: 0.65, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 650, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 800, yFrac: 0.61, type: ENEMY_TYPE.TRACKSUIT_GOON },
  ],
  // Wave 3 — 3 goons + 1 mini-boss (parry-pressure test)
  [
    { x: 300, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 500, yFrac: 0.60, type: ENEMY_TYPE.TRACKSUIT_GOON },
    { x: 700, yFrac: 0.65, type: ENEMY_TYPE.MINI_BOSS },
    { x: 900, yFrac: 0.62, type: ENEMY_TYPE.TRACKSUIT_GOON },
  ],
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.GAME });
  }

  create() {
    const { width, height } = this.scale;

    // ── World ──────────────────────────────────────────────────────────────────
    this._buildStreet(width, height);

    // ── Systems ────────────────────────────────────────────────────────────────
    this.respectMeter = new RespectMeter(this, RESPECT.START);
    this.parrySystem  = new ParrySystem(this, PLAYER_CFG.PARRY_WINDOW_MS, PLAYER_CFG.PARRY_COOLDOWN_MS);

    // ── Player ─────────────────────────────────────────────────────────────────
    this.player = new Player(this, 160, height * 0.62, this.respectMeter, this.parrySystem);

    // ── Enemies ────────────────────────────────────────────────────────────────
    this._enemies = [];
    this._spawnCount = 0; // monotonic counter — gives each enemy a deterministic index
    // Phaser group so physics.add.overlap can check against a dynamic set
    this._hurtboxGroup = this.add.group();

    // The callback Enemy calls at its hit frame — all resolution happens here
    this._onEnemyAttack = (enemy) => {
      if (!enemy.isDead && !this.player.isDead) {
        this._resolveHit(enemy, this.player, { damage: enemy.damage });
      }
    };

    // ── Physics: player hitbox → enemy hurtboxes ───────────────────────────────
    // Overlap fires every frame the hitbox touches a hurtbox.
    // The early-out guard (isAttacking + damage > 0) makes it a discrete single hit:
    // the hitbox is only enabled for 120ms per swing (see Player._beginAttack).
    this.physics.add.overlap(
      this.player.hitbox,
      this._hurtboxGroup,
      (_playerHitbox, enemyHurtbox) => {
        if (!this.player.isAttacking || this.player.currentAttackDamage <= 0) return;
        const enemy = enemyHurtbox.getData('owner');
        if (enemy) {
          this._resolveHit(this.player, enemy, { damage: this.player.currentAttackDamage });
        }
      },
    );

    // ── Grab key for environmental kill ────────────────────────────────────────
    this._grabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);

    // ── Waves ──────────────────────────────────────────────────────────────────
    this._waveIndex = 0;
    this._waveDelay = false;
    this._spawnWave(this._waveIndex);

    // ── Camera ─────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, width * 2, height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // Sync UI to initial values
    this.events.emit('respectChanged', this.respectMeter.value);
    this.events.emit('healthChanged', PLAYER_CFG.HEALTH);
  }

  update(time, delta) {
    this.player.update(time, delta);
    this.parrySystem.update(time);
    this._enemies.forEach((e) => e.update(time, delta, this.player));
    this._checkOvenKill();
    this._checkWaveAdvance();

    if (this.respectMeter.value < RESPECT.THRESHOLD_MOBSTER_HELP) {
      this.events.emit('mobstersSplit');
    }
  }

  // ─── Combat resolver ──────────────────────────────────────────────────────────
  /**
   * Single entry point for ALL hit resolution.
   * Called by: physics overlap (player→enemy), enemy attack callback (enemy→player),
   *            and the oven kill (player→enemy with isEnvKill).
   *
   * @param {Player|Enemy} attacker
   * @param {Player|Enemy} target
   * @param {{ damage: number, isEnvKill?: boolean }} meta
   */
  _resolveHit(attacker, target, meta) {
    const { damage, isEnvKill = false } = meta;
    const now = this.time.now;

    if (target === this.player) {
      // ── Enemy → Player ────────────────────────────────────────────────────────
      if (target.isInvulnerable) return;

      // Parry check — must happen before any state change on the target
      const parried = this.parrySystem.checkIncomingAttack(now, this.respectMeter);
      if (parried) {
        // Attacker walked into a parry — punish with a long stun
        if (attacker.enterStun) attacker.enterStun(COMBAT.PARRY_STUN_MS);
        return;
      }

      // Hit lands: arm iframes first, then apply damage, then impulse
      target.setIframes(now + COMBAT.IFRAME_DURATION_MS);
      target.applyDamage(damage);
      if (attacker.sprite) {
        const dir = target.sprite.x >= attacker.sprite.x ? 1 : -1;
        target.applyKnockback(dir, COMBAT.PLAYER_KNOCKBACK, COMBAT.KNOCKBACK_VY, COMBAT.KNOCKBACK_DURATION_MS);
      }
    } else {
      // ── Player → Enemy ────────────────────────────────────────────────────────
      if (target.isDead) return;

      if (isEnvKill) {
        this.respectMeter.adjust(-RESPECT.PENALTY_ENVIRON_KILL);
      }

      target.applyDamage(damage, this.respectMeter);

      if (!target.isDead && attacker.sprite) {
        const dir = target.sprite.x >= attacker.sprite.x ? 1 : -1;
        target.applyKnockback(dir, COMBAT.ENEMY_KNOCKBACK, COMBAT.KNOCKBACK_VY, COMBAT.KNOCKBACK_DURATION_MS);
        target.enterStun(COMBAT.HITSTUN_MS);
      }
    }
  }

  // ─── Debug snapshot ───────────────────────────────────────────────────────────
  /**
   * Returns a plain object of current state for the DebugScene HUD.
   * Polled every frame — no events, no coupling.
   * Returns null if the scene hasn't finished initialising yet.
   */
  debugSnapshot(now) {
    if (!this.player || !this.parrySystem || !this.respectMeter) return null;
    const p = this.player;
    return {
      playerState:       p.debugState,
      parryActive:       this.parrySystem.isWindowActive,
      parryRemainingMs:  this.parrySystem.windowRemainingMs,
      iframeActive:      p.isInvulnerable,
      iframeRemainingMs: Math.max(0, p._iframeUntil - now),
      respect:           this.respectMeter.value,
      waveIndex:         this._waveIndex ?? 0,
      aliveCount:        this._enemies ? this._enemies.filter((e) => !e.isDead).length : 0,
    };
  }

  // ─── Spawning ────────────────────────────────────────────────────────────────

  _spawnEnemy(x, y, type) {
    const enemy = new Enemy(this, x, y, type, this.respectMeter, this._onEnemyAttack, this._spawnCount++);
    this._enemies.push(enemy);
    this._hurtboxGroup.add(enemy.hurtbox);
    return enemy;
  }

  _spawnWave(index) {
    const { height } = this.scale;
    const defs = WAVES[index] ?? WAVES[WAVES.length - 1];
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

    const { x: px, y: py } = this.player.sprite;
    if (Math.abs(px - this._ovenCX) > 150 || Math.abs(py - this._ovenCY) > 100) return;

    // Nearest living enemy within 120 px of the oven centre
    let target = null;
    let closest = Infinity;
    this._enemies.forEach((e) => {
      if (e.isDead) return;
      const d = Phaser.Math.Distance.Between(e.sprite.x, e.sprite.y, this._ovenCX, this._ovenCY);
      if (d < 120 && d < closest) { closest = d; target = e; }
    });

    if (target) {
      this._resolveHit(this.player, target, {
        damage: PLAYER_CFG.ENVIRONMENTAL_KILL_DAMAGE,
        isEnvKill: true,
      });
      this.cameras.main.shake(250, 0.012);
    }
  }

  // ─── World ───────────────────────────────────────────────────────────────────

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

    // Pizza oven — environmental kill hazard
    const ovenX = 640;
    const ovenY = height * 0.55;
    g.fillStyle(0x882200);
    g.fillRect(ovenX, ovenY, 80, 60);
    g.fillStyle(0xff6600);
    g.fillRect(ovenX + 10, ovenY + 10, 60, 40);

    this.add.text(ovenX + 40, ovenY - 14, '[V] OVEN', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff9944',
    }).setOrigin(0.5, 1);

    // Store centre for distance checks in _checkOvenKill
    this._ovenCX = ovenX + 40;
    this._ovenCY = ovenY + 30;
  }
}
