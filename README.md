# NoTrace 

**NoTrace** is a high-security, minimalist anonymous chat platform built with Next.js and Firebase. Designed with a focus on absolute privacy, it ensures that your conversations leave no footprint.

![NoTrace Banner](/public/notracebanner.png)

## Core Principles

- **Ghost Networking**: No persistent user databases, no message archives.
- **Client-Side Sovereignty**: Cryptographic keys and encryption occur entirely on your device.
- **Statelessness**: Rooms exist only as long as they are needed and are destroyed without a trace.

## Security Features

### 1. End-to-End Encryption (E2EE)
Every message is encrypted locally using **AES-256-GCM**. The encryption key is derived from the room code using a SHA-256 hash. Because the key never leaves your browser, even the database administrator cannot read your messages.

### 2. Bot Protection
Integrated with **Cloudflare Turnstile** to provide silent, privacy-preserving CAPTCHA verification. This ensures that all traffic originates from human actors without compromising user experience.

### 3. ephemerality by Design
- **100-Message Limit**: Rooms only maintain the latest 100 messages to prevent long-term data accumulation.
- **24-Hour Auto-Cleanup**: A server-side Firebase Cloud Function automatically prunes rooms older than 24 hours.
- **Volatile State**: No IP addresses, metadata, or personal identifiers are ever stored.

### 4. Privacy-First Logging
Abuse logging is strictly limited to non-traceable session identifiers and timestamps. We do not log IP addresses or any information that could link a session to a real-world identity.

## Physical Setup

### Prerequisites
- Node.js 20+
- Firebase Project (Realtime Database + Cloud Functions)
- Cloudflare Turnstile Account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Parth-Vasave/NoTrace.git
   cd NoTrace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.local.example .env.local
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Database**: [Firebase Realtime Database](https://firebase.google.com/products/realtime-database)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Bot Protection**: [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)

## Contributing & Code of Conduct

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
