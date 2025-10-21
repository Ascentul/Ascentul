/**
 * Tests for V2 rollout utility
 */

import { isV2Enabled, __testing } from '../rollout-v2';

describe('V2 Rollout - isV2Enabled', () => {
  it('should return false for 0% rollout', () => {
    expect(isV2Enabled('user@example.com', 0)).toBe(false);
  });

  it('should return true for 100% rollout', () => {
    expect(isV2Enabled('user@example.com', 100)).toBe(true);
  });

  it('should return false for empty user ID', () => {
    expect(isV2Enabled('', 50)).toBe(false);
    expect(isV2Enabled('  ', 50)).toBe(false);
  });

  it('should be deterministic for same user', () => {
    const userId = 'user@example.com';
    const result1 = isV2Enabled(userId, 50);
    const result2 = isV2Enabled(userId, 50);
    expect(result1).toBe(result2);
  });

  it('should give consistent results across sessions', () => {
    const userId = 'john.doe@example.com';
    const results: boolean[] = [];

    for (let i = 0; i < 10; i++) {
      results.push(isV2Enabled(userId, 50));
    }

    // All results should be identical
    expect(new Set(results).size).toBe(1);
  });
});

describe('V2 Rollout - Hash Distribution', () => {
  it('should have reasonably uniform distribution', () => {
    const buckets = __testing.testDistribution(10000);
    const counts = Object.values(buckets);

    // Each bucket should have roughly 100 users (10000 / 100 buckets)
    // Allow ±30% variance for randomness
    const expected = 100;
    const minExpected = expected * 0.7;
    const maxExpected = expected * 1.3;

    for (const count of counts) {
      expect(count).toBeGreaterThanOrEqual(minExpected);
      expect(count).toBeLessThanOrEqual(maxExpected);
    }
  });
});

describe('V2 Rollout - Accuracy', () => {
  it('should match 5% rollout target within 1%', () => {
    const result = __testing.testRolloutAccuracy(5, 10000);
    expect(result.error).toBeLessThan(1);
  });

  it('should match 25% rollout target within 1%', () => {
    const result = __testing.testRolloutAccuracy(25, 10000);
    expect(result.error).toBeLessThan(1);
  });

  it('should match 50% rollout target within 1%', () => {
    const result = __testing.testRolloutAccuracy(50, 10000);
    expect(result.error).toBeLessThan(1);
  });

  it('should match 75% rollout target within 1%', () => {
    const result = __testing.testRolloutAccuracy(75, 10000);
    expect(result.error).toBeLessThan(1);
  });
});

describe('V2 Rollout - Edge Cases', () => {
  it('should handle negative rollout percent', () => {
    expect(isV2Enabled('user@example.com', -10)).toBe(false);
  });

  it('should handle rollout percent > 100', () => {
    expect(isV2Enabled('user@example.com', 150)).toBe(true);
  });

  it('should handle special characters in user ID', () => {
    const userId = 'user+tag@example.com';
    const result1 = isV2Enabled(userId, 50);
    const result2 = isV2Enabled(userId, 50);
    expect(result1).toBe(result2);
  });

  it('should handle very long user IDs', () => {
    const userId = 'a'.repeat(1000) + '@example.com';
    const result = isV2Enabled(userId, 50);
    expect(typeof result).toBe('boolean');
  });
});
