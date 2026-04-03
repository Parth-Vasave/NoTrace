/**
 * Application-wide configuration constants.
 * Centralized here so they can be tuned without hunting through components.
 */

export const ROOM_CONFIG = {
  MAX_MEMBERS: 8,
  CODE_REGEX: /^[A-Z0-9]{4,12}$/,
  CODE_LENGTH: 6,
  CREATION_COOLDOWN_MS: 30 * 1000,
  MAX_CREATIONS_PER_SESSION: 10,
} as const;

export const MESSAGE_CONFIG = {
  MAX_LENGTH: 1000,
  MAX_PER_ROOM: 100,
  COOLDOWN_MS: 1000,
} as const;

export const MEMBER_CONFIG = {
  USERNAME_REGEX: /^[a-zA-Z0-9\s\-_.]{2,32}$/,
  MAX_USERNAME_LENGTH: 32,
  INACTIVITY_TIMEOUT_MS: 5 * 60 * 1000,
  INACTIVITY_CHECK_INTERVAL_MS: 2.5 * 60 * 1000,
  STUCK_ONLINE_MULTIPLIER: 1.5,
} as const;

export const CAPTCHA_CONFIG = {
  DEFAULT_TIMEOUT_MS: 8000,
} as const;

export const CRYPTO_CONFIG = {
  ALGORITHM: 'AES-GCM' as const,
  IV_LENGTH: 12,
  PBKDF2_ITERATIONS: 100_000,
  SALT: 'notrace-ephemeral-salt-v1',
} as const;
