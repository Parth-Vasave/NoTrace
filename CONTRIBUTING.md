# Contributing to NoTrace

First off, thank you for considering contributing to NoTrace! It's people like you that make it possible to keep privacy accessible for everyone.

## Transparency and Privacy

NoTrace is a privacy-first platform. All contributions must adhere to our core principles:
- **No Tracking**: Never introduce analytics or tracking scripts.
- **Client-Side First**: Encryption and sensitive logic should always happen on the client.
- **Statelessness**: Avoid introducing persistent storage of user-identifiable data.

## How Can I Contribute?

### Reporting Bugs
- Check the issues tab to see if the bug has already been reported.
- If not, open a new issue. Include steps to reproduce and your environment details.

### Suggesting Enhancements
- Open an issue titled "[Feature Request] Briefly describe it".
- Explain why this feature would be useful and how it aligns with the minimalist/privacy ethos.

### Pull Requests
1. **Fork the repo** and create your branch from `main`.
2. **Install dependencies** with `npm install`.
3. **Keep it clean**: Avoid adding large libraries for simple tasks. We prefer vanilla logic.
4. **Style**: Follow the existing Tailwind-based minimalist design system.
5. **Security**: If you touch cryptographic code, please provide a detailed explanation of the changes.

## Development Setup

1. Copy `.env.local.example` to `.env.local`.
2. Fill in your Firebase and Turnstile credentials.
3. Run `npm run dev` to start the local environment.

## Community

Please note we have a [Code of Conduct](CODE_OF_CONDUCT.md). Please follow it in all your interactions with the project.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
