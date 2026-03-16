# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-16

### Added
- **End-to-End Encryption (E2EE)**: Messages are now encrypted client-side using AES-256-GCM.
- **Bot Protection**: Integrated Cloudflare Turnstile for silent CAPTCHA verification.
- **Abuse Logging**: Privacy-preserving session-based interaction logging.
- **Automated Cleanup**: Server-side room cleanup every 24 hours via Firebase Cloud Functions.
- **Documentation Space**: Comprehensive technical docs and privacy policy pages.
- **Open Source Ready**: Standardized `.gitignore`, `.env.local.example`, and community documentation.

### Changed
- Refactored project structure to align with Next.js best practices (consolidated components into `src/components/pages`).
- Updated branding across the landing page and chat interface.
- Enhanced minimalist design by removing unnecessary footer links and icons.

### Fixed
- Resolved hydration mismatches during dark mode initialization.
- Fixed 500 Internal Server Errors caused by transient dev-server cache issues.
- Restored database connectivity after environment variable refactoring.

## [1.0.0] - 2026-03-15

### Initial Release
- Core anonymous chat functionality.
- Real-time messaging via Firebase RTDB.
- Stateless, high-entropy room generation.
- Minimalist dark-themed UI.
