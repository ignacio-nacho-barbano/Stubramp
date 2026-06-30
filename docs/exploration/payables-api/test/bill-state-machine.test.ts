import { describe, expect, it } from 'vitest';
import {
  canTransition,
  isTerminal,
  TRANSITIONS,
} from '../src/domain/bill-state-machine.js';

// Pure unit tests — no database needed. The DB-touching guards
// (split-sum, scheduledFor) belong in an e2e test against a throwaway Postgres.
describe('bill state machine', () => {
  it('allows the happy path', () => {
    expect(canTransition('DRAFT', 'SUBMITTED')).toBe(true);
    expect(canTransition('SUBMITTED', 'APPROVED')).toBe(true);
    expect(canTransition('APPROVED', 'SCHEDULED')).toBe(true);
    expect(canTransition('SCHEDULED', 'PAID')).toBe(true);
  });

  it('allows failure and retry branches', () => {
    expect(canTransition('SUBMITTED', 'REJECTED')).toBe(true);
    expect(canTransition('SCHEDULED', 'FAILED')).toBe(true);
    expect(canTransition('FAILED', 'SCHEDULED')).toBe(true);
  });

  it('rejects illegal jumps', () => {
    expect(canTransition('DRAFT', 'PAID')).toBe(false);
    expect(canTransition('DRAFT', 'APPROVED')).toBe(false);
    expect(canTransition('APPROVED', 'PAID')).toBe(false);
  });

  it('treats PAID and REJECTED as terminal', () => {
    expect(isTerminal('PAID')).toBe(true);
    expect(isTerminal('REJECTED')).toBe(true);
    expect(isTerminal('DRAFT')).toBe(false);
  });

  it('has an entry for every status', () => {
    for (const status of Object.keys(TRANSITIONS)) {
      expect(Array.isArray(TRANSITIONS[status as keyof typeof TRANSITIONS])).toBe(true);
    }
  });
});
