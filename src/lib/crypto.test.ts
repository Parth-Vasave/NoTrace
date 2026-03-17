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

  it('should encrypt empty string correctly', async () => {
    const encrypted = await encryptMessage('', roomCode);
    const decrypted = await decryptMessage(encrypted, roomCode);
    expect(decrypted).toBe('');
  });

  it('should handle room code case-insensitively', async () => {
    const encrypted = await encryptMessage(originalText, roomCode.toLowerCase());
    const decrypted = await decryptMessage(encrypted, roomCode.toUpperCase());
    expect(decrypted).toBe(originalText);
  });
});
