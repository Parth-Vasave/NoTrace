import { describe, it, expect } from 'vitest';
import { encryptMessage, decryptMessage } from './crypto';

describe('Cryptographic Utilities', () => {
  const roomCode = 'TEST1234';
  const originalText = 'Hello, this is a secret message!';

  it('should encrypt and decrypt correctly', async () => {
    const encrypted = await encryptMessage(originalText, roomCode);
    expect(encrypted).not.toBe(originalText);

    const decrypted = await decryptMessage(encrypted, roomCode);
    expect(decrypted).toBe(originalText);
  });

  it('should fail to decrypt with wrong room code', async () => {
    const encrypted = await encryptMessage(originalText, roomCode);
    const decrypted = await decryptMessage(encrypted, 'WRONGCODE');
    expect(decrypted).toBe('[Decryption Error]');
  });

  it('should produce different ciphertexts for the same plaintext (random IV)', async () => {
    const encrypted1 = await encryptMessage(originalText, roomCode);
    const encrypted2 = await encryptMessage(originalText, roomCode);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should handle empty strings', async () => {
    const encrypted = await encryptMessage('', roomCode);
    const decrypted = await decryptMessage(encrypted, roomCode);
    expect(decrypted).toBe('');
  });

  it('should handle unicode text', async () => {
    const unicode = 'Hello World!';
    const encrypted = await encryptMessage(unicode, roomCode);
    const decrypted = await decryptMessage(encrypted, roomCode);
    expect(decrypted).toBe(unicode);
  });

  it('should handle long messages', async () => {
    const long = 'A'.repeat(1000);
    const encrypted = await encryptMessage(long, roomCode);
    const decrypted = await decryptMessage(encrypted, roomCode);
    expect(decrypted).toBe(long);
  });

  it('should be case-insensitive for room codes', async () => {
    const encrypted = await encryptMessage(originalText, 'abcd1234');
    const decrypted = await decryptMessage(encrypted, 'ABCD1234');
    expect(decrypted).toBe(originalText);
  });

  it('should return error string for malformed input', async () => {
    const result = await decryptMessage('not-valid-base64!!!', roomCode);
    expect(result).toBe('[Decryption Error]');
  });
});
