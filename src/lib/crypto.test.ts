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
});
