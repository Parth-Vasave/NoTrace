import { describe, it, expect } from 'vitest';
import { ROOM_CONFIG, MESSAGE_CONFIG, MEMBER_CONFIG, CRYPTO_CONFIG } from './config';

describe('Configuration Constants', () => {
  it('should have valid room config', () => {
    expect(ROOM_CONFIG.MAX_MEMBERS).toBeGreaterThan(0);
    expect(ROOM_CONFIG.CODE_LENGTH).toBeGreaterThanOrEqual(4);
    expect(ROOM_CONFIG.CREATION_COOLDOWN_MS).toBeGreaterThan(0);
    expect(ROOM_CONFIG.MAX_CREATIONS_PER_SESSION).toBeGreaterThan(0);
  });

  it('should have valid message config', () => {
    expect(MESSAGE_CONFIG.MAX_LENGTH).toBeGreaterThan(0);
    expect(MESSAGE_CONFIG.MAX_PER_ROOM).toBeGreaterThan(0);
    expect(MESSAGE_CONFIG.COOLDOWN_MS).toBeGreaterThan(0);
  });

  it('should have valid member config', () => {
    expect(MEMBER_CONFIG.INACTIVITY_TIMEOUT_MS).toBeGreaterThan(0);
    expect(MEMBER_CONFIG.MAX_USERNAME_LENGTH).toBe(32);
    expect(MEMBER_CONFIG.STUCK_ONLINE_MULTIPLIER).toBeGreaterThan(1);
  });

  it('should validate room codes correctly', () => {
    expect(ROOM_CONFIG.CODE_REGEX.test('ABCD12')).toBe(true);
    expect(ROOM_CONFIG.CODE_REGEX.test('AB')).toBe(false); // too short
    expect(ROOM_CONFIG.CODE_REGEX.test('abc')).toBe(false); // lowercase
    expect(ROOM_CONFIG.CODE_REGEX.test('AB-CD')).toBe(false); // special chars
  });

  it('should validate usernames correctly', () => {
    expect(MEMBER_CONFIG.USERNAME_REGEX.test('GhostWalker')).toBe(true);
    expect(MEMBER_CONFIG.USERNAME_REGEX.test('Ghost Walker')).toBe(true);
    expect(MEMBER_CONFIG.USERNAME_REGEX.test('a')).toBe(false); // too short
    expect(MEMBER_CONFIG.USERNAME_REGEX.test('A'.repeat(33))).toBe(false); // too long
  });

  it('should have valid crypto config', () => {
    expect(CRYPTO_CONFIG.IV_LENGTH).toBe(12); // Standard for GCM
    expect(CRYPTO_CONFIG.PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(100_000);
    expect(CRYPTO_CONFIG.ALGORITHM).toBe('AES-GCM');
  });
});
