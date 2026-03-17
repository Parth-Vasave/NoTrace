import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to generate a cryptographically secure random room code
export function generateRoomCode(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charCount = characters.length;
  // Reject bytes that would cause modulo bias (256 % 36 = 4, so reject values >= 252)
  const maxUnbiasedValue = Math.floor(256 / charCount) * charCount;
  const result: string[] = [];
  // Allocate a fixed-size buffer once; re-fill only if more bytes are needed
  const bufferSize = 64;
  let randomBytes = crypto.getRandomValues(new Uint8Array(bufferSize));
  let bufferPos = 0;
  while (result.length < length) {
    if (bufferPos >= bufferSize) {
      randomBytes = crypto.getRandomValues(new Uint8Array(bufferSize));
      bufferPos = 0;
    }
    const byte = randomBytes[bufferPos++];
    if (byte < maxUnbiasedValue) {
      result.push(characters[byte % charCount]);
    }
  }
  return result.join('');
}

// Function to generate a random anonymous user name
export function generateRandomName(): string {
  const adjectives = [
    'Silent', 'Hidden', 'Quiet', 'Secret', 'Ghostly', 'Unknown',
    'Shadowy', 'Lone', 'Masked', 'Mystic', 'Wandering', 'Invisible',
    'Fleeting', 'Furtive', 'Obscure', 'Veiled', 'Cryptic', 'Subtle'
    ];
  const nouns = [
    'Walker', 'Specter', 'Nomad', 'Cipher', 'Echo', 'Phantom',
    'Drifter', 'Scribe', 'Watcher', 'Whisper', 'Traveler', 'Agent',
    'Riddle', 'Void', 'Enigma', 'Shade', 'Visitor', 'Alias'
    ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adj}${noun}`;
}

// Function to generate a deterministic avatar URL based on a seed (e.g., userId)
export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
