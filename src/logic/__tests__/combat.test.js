import { describe, it, expect } from 'vitest';
import { resolveHit } from '../combat.js';
import { COMBAT, RESPECT } from '../../config/constants.js';

// ─── Shared fixtures ──────────────────────────────────────────────────────────
const BASE_DEFENDER = {
  iframeUntil: 0,
  parryUntil:  0,
  isBlocking:  false,
  health:      100,
  lastHitId:   null,
};

const BASE_ATTACK = { damage: 10, hitId: 'swing-1' };

const NOW = 1000; // arbitrary fixed timestamp

// ─── Helper ───────────────────────────────────────────────────────────────────
function hit(defenderOverrides = {}, attackOverrides = {}) {
  return resolveHit({
    nowMs:    NOW,
    defender: { ...BASE_DEFENDER, ...defenderOverrides },
    attack:   { ...BASE_ATTACK, ...attackOverrides },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('resolveHit — parry', () => {
  it('returns outcome parried when parry window is open', () => {
    const result = hit({ parryUntil: NOW + 50 });
    expect(result.outcome).toBe('parried');
  });

  it('deals 0 damage on a parry', () => {
    expect(hit({ parryUntil: NOW + 50 }).damageDealt).toBe(0);
  });

  it('leaves health unchanged on a parry', () => {
    expect(hit({ parryUntil: NOW + 50 }).newHealth).toBe(100);
  });

  it('sets attackerStunned on a parry', () => {
    expect(hit({ parryUntil: NOW + 50 }).attackerStunned).toBe(true);
  });

  it('returns RESPECT.GAIN_PARRY as respectDelta', () => {
    expect(hit({ parryUntil: NOW + 50 }).respectDelta).toBe(RESPECT.GAIN_PARRY);
  });

  it('does NOT parry when window is exactly expired (nowMs > parryUntil)', () => {
    // parryUntil < NOW — window already closed
    const result = hit({ parryUntil: NOW - 1 });
    expect(result.outcome).toBe('hit');
  });
});

describe('resolveHit — iframes', () => {
  it('returns ignored while iframes are active', () => {
    expect(hit({ iframeUntil: NOW + 200 }).outcome).toBe('ignored');
  });

  it('deals 0 damage while in iframes', () => {
    expect(hit({ iframeUntil: NOW + 200 }).damageDealt).toBe(0);
  });

  it('leaves health unchanged while in iframes', () => {
    expect(hit({ iframeUntil: NOW + 200 }).newHealth).toBe(100);
  });

  it('iframes take priority over an open parry window', () => {
    // Even if parry window is active, iframes win
    const result = hit({ iframeUntil: NOW + 200, parryUntil: NOW + 50 });
    expect(result.outcome).toBe('ignored');
  });
});

describe('resolveHit — block', () => {
  it('returns blocked when isBlocking is true', () => {
    expect(hit({ isBlocking: true }).outcome).toBe('blocked');
  });

  it('applies BLOCK_DAMAGE_REDUCTION fraction (ceil)', () => {
    const expected = Math.ceil(10 * COMBAT.BLOCK_DAMAGE_REDUCTION);
    expect(hit({ isBlocking: true }).damageDealt).toBe(expected);
  });

  it('reduces health by the blocked damage amount', () => {
    const reduced = Math.ceil(10 * COMBAT.BLOCK_DAMAGE_REDUCTION);
    expect(hit({ isBlocking: true }).newHealth).toBe(100 - reduced);
  });

  it('applies iframes on a blocked hit', () => {
    expect(hit({ isBlocking: true }).iframeUntil).toBe(NOW + COMBAT.IFRAME_DURATION_MS);
  });

  it('does not stun the attacker on a block', () => {
    expect(hit({ isBlocking: true }).attackerStunned).toBe(false);
  });
});

describe('resolveHit — normal hit', () => {
  it('returns hit on a clean attack', () => {
    expect(hit().outcome).toBe('hit');
  });

  it('deals full damage', () => {
    expect(hit().damageDealt).toBe(10);
  });

  it('reduces health correctly', () => {
    expect(hit().newHealth).toBe(90);
  });

  it('sets iframeUntil to nowMs + IFRAME_DURATION_MS', () => {
    expect(hit().iframeUntil).toBe(NOW + COMBAT.IFRAME_DURATION_MS);
  });

  it('does not stun attacker on a normal hit', () => {
    expect(hit().attackerStunned).toBe(false);
  });

  it('clamps health to 0 on lethal hit', () => {
    expect(hit({ health: 5 }, { damage: 999 }).newHealth).toBe(0);
  });
});

describe('resolveHit — hitId dedup', () => {
  it('ignores a hit whose hitId matches lastHitId', () => {
    const result = hit({ lastHitId: 'swing-1' }, { hitId: 'swing-1' });
    expect(result.outcome).toBe('ignored');
    expect(result.damageDealt).toBe(0);
  });

  it('allows a hit with a different hitId', () => {
    const result = hit({ lastHitId: 'swing-1' }, { hitId: 'swing-2' });
    expect(result.outcome).toBe('hit');
  });

  it('allows a hit when lastHitId is null', () => {
    const result = hit({ lastHitId: null }, { hitId: 'swing-1' });
    expect(result.outcome).toBe('hit');
  });

  it('dedup does not fire when hitId is null', () => {
    // null hitId skips dedup even if lastHitId is null
    const result = hit({ lastHitId: null }, { hitId: null });
    expect(result.outcome).toBe('hit');
  });
});
