import { describe, it, expect } from 'vitest';
import {
  generateRoomCode,
  generateRandomName,
  sanitizeText,
  sanitizeRoomCode,
  sanitizeUsername,
} from './utils';

describe('generateRoomCode', () => {
  it('should generate a 6-character code by default', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it('should generate a code of specified length', () => {
    expect(generateRoomCode(4)).toHaveLength(4);
    expect(generateRoomCode(12)).toHaveLength(12);
  });

  it('should only contain uppercase alphanumeric characters', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateRoomCode()).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it('should generate unique codes', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateRoomCode()));
    expect(codes.size).toBeGreaterThan(45); // Allow for rare collision
  });
});

describe('generateRandomName', () => {
  it('should return a non-empty string', () => {
    const name = generateRandomName();
    expect(name.length).toBeGreaterThan(0);
  });

  it('should not contain spaces', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateRandomName()).not.toContain(' ');
    }
  });
});

describe('sanitizeText', () => {
  it('should trim whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('should remove control characters', () => {
    expect(sanitizeText('hello\x00world')).toBe('helloworld');
    expect(sanitizeText('test\x07data')).toBe('testdata');
  });

  it('should remove zero-width characters', () => {
    expect(sanitizeText('hello\u200Bworld')).toBe('helloworld');
    expect(sanitizeText('test\uFEFFdata')).toBe('testdata');
  });

  it('should preserve normal text', () => {
    expect(sanitizeText('Hello, World!')).toBe('Hello, World!');
  });

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('');
  });
});

describe('sanitizeRoomCode', () => {
  it('should uppercase the code', () => {
    expect(sanitizeRoomCode('abc123')).toBe('ABC123');
  });

  it('should strip non-alphanumeric chars', () => {
    expect(sanitizeRoomCode('AB-CD.12')).toBe('ABCD12');
    expect(sanitizeRoomCode('test!@#')).toBe('TEST');
  });

  it('should handle empty string', () => {
    expect(sanitizeRoomCode('')).toBe('');
  });
});

describe('sanitizeUsername', () => {
  it('should trim and limit to 32 chars', () => {
    const long = 'A'.repeat(50);
    expect(sanitizeUsername(long)).toHaveLength(32);
  });

  it('should strip control chars', () => {
    expect(sanitizeUsername('user\x00name')).toBe('username');
  });

  it('should preserve valid names', () => {
    expect(sanitizeUsername('Ghost Walker')).toBe('Ghost Walker');
  });
});
