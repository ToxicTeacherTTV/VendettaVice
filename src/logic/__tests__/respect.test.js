import { describe, it, expect } from 'vitest';
import { applyRespect } from '../respect.js';
import { RESPECT } from '../../config/constants.js';

describe('applyRespect', () => {
  it('env kill reduces respect by PENALTY_ENVIRON_KILL', () => {
    const result = applyRespect(RESPECT.START, -RESPECT.PENALTY_ENVIRON_KILL);
    expect(result).toBe(RESPECT.START - RESPECT.PENALTY_ENVIRON_KILL);
  });

  it('parry increases respect by GAIN_PARRY', () => {
    const result = applyRespect(RESPECT.START, RESPECT.GAIN_PARRY);
    expect(result).toBe(RESPECT.START + RESPECT.GAIN_PARRY);
  });

  it('clean KO increases respect by GAIN_CLEAN_KO', () => {
    const result = applyRespect(RESPECT.START, RESPECT.GAIN_CLEAN_KO);
    expect(result).toBe(RESPECT.START + RESPECT.GAIN_CLEAN_KO);
  });

  it('clamps to 0 — cannot go negative', () => {
    expect(applyRespect(0, -1)).toBe(0);
    expect(applyRespect(5, -100)).toBe(0);
  });

  it('clamps to RESPECT.MAX — cannot exceed ceiling', () => {
    expect(applyRespect(RESPECT.MAX, 1)).toBe(RESPECT.MAX);
    expect(applyRespect(RESPECT.MAX - 1, 50)).toBe(RESPECT.MAX);
  });

  it('threshold crossing is detectable', () => {
    // Simulate dropping from just above threshold to below it
    const justAbove  = RESPECT.THRESHOLD_MOBSTER_HELP + 1;
    const after      = applyRespect(justAbove, -RESPECT.PENALTY_CHEAP_SHOT);
    expect(after).toBeLessThan(RESPECT.THRESHOLD_MOBSTER_HELP);
  });

  it('identity — delta of 0 returns current value unchanged', () => {
    expect(applyRespect(37, 0)).toBe(37);
  });
});
