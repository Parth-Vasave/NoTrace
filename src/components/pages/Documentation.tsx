'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Documentation() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-black text-white selection:bg-white/20">
      <Navbar />
      <main className="flex-1 px-6 md:px-24 lg:px-48 py-20 md:py-32 max-w-4xl">
        <div className="mb-16">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tighter text-white uppercase mb-8 break-words md:break-normal">Documentation</h1>
          <p className="text-xl text-white/50 leading-relaxed max-w-xl font-light">
            Technical specifications and operating protocols for the NoTrace platform.
          </p>
        </div>
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-24" id="architecture">
            <h3 className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase mb-8">Architecture Overview</h3>
            <p className="mb-8 text-white/60 text-lg font-light leading-relaxed">
              NoTrace is built on the principle of **Ghost Networking**. Unlike traditional messaging platforms that maintain persistent user databases and message archives, NoTrace operates as a transient state-synchronization engine.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <span className="block text-white font-bold uppercase tracking-widest text-xs mb-3">Local-First Logic</span>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  Cryptographic key generation and message encryption occur entirely on the client-side. The server acts only as a relay for encrypted packets, never possessing the keys to decrypt your traffic.
                </p>
              </div>
              <div>
                <span className="block text-white font-bold uppercase tracking-widest text-xs mb-3">Stateless Routing</span>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  We utilize a decentralized approach to session management. Rooms are identified by high-entropy cryptographic seeds, making them virtually invisible to unauthorized discovery.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-24" id="encryption">
            <h3 className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase mb-8">Security & Encryption</h3>
            <p className="mb-10 text-white/60 text-lg font-light leading-relaxed">
              Security on NoTrace is not optional. Every session is protected by a multi-layered cryptographic stack designed to withstand modern surveillance techniques.
            </p>
            <div className="bg-white/[0.03] border border-white/5 p-8 mb-10">
              <div className="flex flex-col gap-6">
                <div>
                  <span className="block text-[10px] font-bold tracking-widest text-white/30 uppercase mb-2">Primary Cipher</span>
                  <code className="text-emerald-500 font-mono text-lg">AES-256-GCM</code>
                </div>
                <div>
                  <span className="block text-[10px] font-bold tracking-widest text-white/30 uppercase mb-2">Key Exchange</span>
                  <code className="text-blue-400 font-mono text-lg">ECDH (Elliptic-curve Diffie–Hellman)</code>
                </div>
              </div>
            </div>
            <p className="text-sm text-white/40 font-light italic border-l-2 border-white/10 pl-6">
              "GCM (Galois/Counter Mode) provides both data authenticity and confidentiality, ensuring that messages cannot be tampered with while in transit."
            </p>
          </section>

          <section className="mb-24" id="lifecycle">
            <h3 className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase mb-8">Room Lifecycle</h3>
            <div className="space-y-12">
              <div>
                <span className="block text-white font-bold uppercase tracking-widest text-xs mb-4">1. Initialization</span>
                <p className="text-base text-white/60 font-light mb-4">
                  When you generate a room, a unique 8-character token is minted. This token serves as the temporary address for your secure link.
                </p>
                <div className="bg-black border border-white/5 p-4 rounded font-mono text-xs text-white/40">
                  // secure_init_logic.js<br/>
                  const room_key = crypto.generateRoomKey();<br/>
                  await sync.initialize(room_key);
                </div>
              </div>
              <div>
                <span className="block text-white font-bold uppercase tracking-widest text-xs mb-4">2. Interaction</span>
                <p className="text-base text-white/60 font-light">
                  Peers join using the room code and a chosen nickname. Message payloads are synchronized in real-time across all active participants. No historical logs are fetched upon joining—you only see what happens while you are present.
                </p>
              </div>
              <div>
                <span className="block text-white font-bold uppercase tracking-widest text-xs mb-4">3. Termination ("Kill-Switch")</span>
                <p className="text-base text-white/60 font-light">
                  Rooms are destroyed instantly when the "Kill-Switch" is activated or when all participants disconnect. Termination involves the immediate deletion of the room record from our volatile global state.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-24" id="security-best-practices">
            <h3 className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase mb-8">Security Best Practices</h3>
            <p className="mb-8 text-white/60 text-lg font-light leading-relaxed">
              While NoTrace implements robust client-side protections, maintaining a secure environment requires strict database-level enforcement.
            </p>
            <div className="bg-white/[0.03] border border-white/5 p-8 mb-10">
              <span className="block text-[10px] font-bold tracking-widest text-white/30 uppercase mb-4">Recommended Firebase Rules</span>
              <pre className="text-xs text-white/60 font-mono overflow-x-auto leading-relaxed">
{`{
  "rules": {
    "rooms": {
      "$room_id": {
        ".read": "true",
        ".write": "!data.exists() || data.child('members/'+auth.token.user_id).exists()",
        "messages": {
          "$msg_id": {
            ".validate": "newData.hasChildren(['senderId', 'text', 'timestamp']) && newData.child('text').val().length < 1000"
          }
        }
      }
    }
  }
}`}
              </pre>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <span className="text-emerald-500 font-bold">01</span>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  **Input Sanitization**: All user input is sanitized and validated against cryptographic regular expressions before being pushed to the transport layer.
                </p>
              </div>
              <div className="flex gap-4">
                <span className="text-emerald-500 font-bold">02</span>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  **Rate Limiting**: Our state engine enforces a 1-second cooldown between message pushes to prevent flooding and resource exhaustion.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-24" id="maintenance-protocol">
            <h3 className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase mb-8">Maintenance Protocol</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <span className="block text-white font-bold uppercase tracking-widest text-xs mb-4">1. Auto Message Expiry</span>
                <p className="text-base text-white/60 font-light mb-4">
                  To maintain the ephemeral nature of the platform, rooms are limited to the latest 100 messages. Older data is pruned instantly upon new intake.
                </p>
                <div className="bg-white/[0.03] border border-white/5 p-4 rounded text-[10px] font-mono text-emerald-500/80">
                  {"// Cloud Function Snippet for 24h Expiry\nexports.cleanupRooms = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {\n  const now = Date.now();\n  const cutoff = now - (24 * 60 * 60 * 1000);\n  // Logic to delete rooms older than cutoff\n});"}
                </div>
              </div>
              <div>
                <span className="block text-white font-bold uppercase tracking-widest text-xs mb-4">2. Bot Protection</span>
                <p className="text-base text-white/60 font-light mb-4">
                  We integrate Cloudflare Turnstile for silent, privacy-preserving CAPTCHA verification, ensuring all traffic originates from human actors.
                </p>
                <div className="bg-white/[0.03] border border-white/5 p-4 rounded text-[10px] font-mono text-emerald-500/80">
                  {"# Set your site key in .env.local\nNEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key"}
                </div>
              </div>
              <div>
                <span className="block text-white font-bold uppercase tracking-widest text-xs mb-4">3. Abuse Logging</span>
                <p className="text-base text-white/60 font-light">
                  Minimal, non-traceable logs (Session ID, Timestamp) are maintained for illegal activity prevention. No real IP addresses or personal identifiers are stored.
                </p>
              </div>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
