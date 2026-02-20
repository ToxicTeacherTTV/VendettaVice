import { describe, it, expect } from 'vitest';
import { WAVES, nextWave } from '../waves.js';
import { ENEMY_TYPE } from '../../config/constants.js';

describe('WAVES — structure', () => {
  it('has exactly 3 waves', () => {
    expect(WAVES).toHaveLength(3);
  });

  it('wave 1 has 3 enemies', () => {
    expect(WAVES[0]).toHaveLength(3);
  });

  it('wave 2 has 4 enemies', () => {
    expect(WAVES[1]).toHaveLength(4);
  });

  it('wave 3 has 4 enemies', () => {
    expect(WAVES[2]).toHaveLength(4);
  });

  it('wave 3 includes exactly one mini-boss', () => {
    const bosses = WAVES[2].filter((e) => e.type === ENEMY_TYPE.MINI_BOSS);
    expect(bosses).toHaveLength(1);
  });

  it('every spawn position is a fixed number — no randomness', () => {
    WAVES.forEach((wave, wi) => {
      wave.forEach(({ x, yFrac }, ei) => {
        expect(typeof x,     `wave ${wi} enemy ${ei} x`).toBe('number');
        expect(typeof yFrac, `wave ${wi} enemy ${ei} yFrac`).toBe('number');
        expect(isNaN(x),     `wave ${wi} enemy ${ei} x is NaN`).toBe(false);
        expect(isNaN(yFrac), `wave ${wi} enemy ${ei} yFrac is NaN`).toBe(false);
      });
    });
  });

  it('every spawn has a known enemy type', () => {
    const validTypes = new Set(Object.values(ENEMY_TYPE));
    WAVES.forEach((wave, wi) => {
      wave.forEach(({ type }, ei) => {
        expect(validTypes.has(type), `wave ${wi} enemy ${ei} has unknown type "${type}"`).toBe(true);
      });
    });
  });
});

describe('nextWave — progression', () => {
  it('advances waveIndex by 1', () => {
    expect(nextWave({ waveIndex: 0 }).waveIndex).toBe(1);
    expect(nextWave({ waveIndex: 1 }).waveIndex).toBe(2);
  });

  it('returns the matching WAVES entry for the new index', () => {
    expect(nextWave({ waveIndex: 0 }).defs).toBe(WAVES[1]);
    expect(nextWave({ waveIndex: 1 }).defs).toBe(WAVES[2]);
  });

  it('loops to the last wave when waveIndex exceeds the array', () => {
    const last = WAVES[WAVES.length - 1];
    expect(nextWave({ waveIndex: 99 }).defs).toBe(last);
    expect(nextWave({ waveIndex: WAVES.length - 1 }).defs).toBe(last);
  });

  it('same input always produces same output — deterministic', () => {
    const a = nextWave({ waveIndex: 0 });
    const b = nextWave({ waveIndex: 0 });
    expect(a.waveIndex).toBe(b.waveIndex);
    expect(a.defs).toBe(b.defs); // same object reference (no copy)
  });

  it('accepts a custom wave array (testability)', () => {
    const custom = [
      [{ x: 100, yFrac: 0.5, type: ENEMY_TYPE.TRACKSUIT_GOON }],
      [{ x: 200, yFrac: 0.5, type: ENEMY_TYPE.MINI_BOSS }],
    ];
    const result = nextWave({ waveIndex: 0 }, custom);
    expect(result.waveIndex).toBe(1);
    expect(result.defs).toBe(custom[1]);
  });
});
