import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes user-provided text by stripping control characters and trimming.
 * Does not strip HTML since messages are rendered as text (not innerHTML).
 */
export function sanitizeText(input: string): string {
  // Remove zero-width chars and control characters (except newline/tab)
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '').trim();
}

/**
 * Sanitizes a room code — uppercase, strip anything non-alphanumeric.
 */
export function sanitizeRoomCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Sanitizes a username — strip control chars.
 */
export function sanitizeUsername(name: string): string {
  return sanitizeText(name).slice(0, 32);
}

// Function to generate a random 6-character alphanumeric room code
export function generateRoomCode(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
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
