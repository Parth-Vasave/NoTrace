'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-black text-white selection:bg-white/20">
      <Navbar />
      <main className="flex-1 flex flex-col max-w-4xl">
        <div className="px-6 md:px-24 lg:px-48 py-20 md:py-32">
          <div className="mb-16">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tighter text-white uppercase mb-8 break-words md:break-normal">Privacy Policy</h1>
            <p className="text-xl text-white/50 leading-relaxed max-w-xl font-light">
              Last updated: <span className="font-mono">October 2023</span>
            </p>
          </div>
          
          <div className="space-y-24">
            <section>
              <p className="text-xl md:text-2xl text-white leading-relaxed max-w-2xl font-light">
                At NoTrace, privacy is not a feature—it is our fundamental architecture. We believe your digital existence should remain yours alone, untracked and unlogged.
              </p>
            </section>
            
            <section>
              <h3 className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase mb-8">1. The &quot;No-Data&quot; Guarantee</h3>
              <div className="flex flex-col gap-10">
                <p className="text-white/60 text-lg font-light leading-relaxed max-w-3xl">
                  We log interaction metadata (like &quot;message sent&quot; or &quot;room created&quot;) using non-identifiable session IDs to prevent platform abuse. Our systems are designed to process temporary communication without ever knowing who you are or what you are saying.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <span className="block text-white font-bold uppercase tracking-widest text-xs mb-3">Zero Identity Logs</span>
                    <p className="text-sm text-white/40 leading-relaxed font-light">
                      We do not collect names, email addresses, phone numbers, or any form of PII. Nicknames are transient and exist only within the scope of a single session.
                    </p>
                  </div>
                  <div>
                    <span className="block text-white font-bold uppercase tracking-widest text-xs mb-3">Zero Network Logs</span>
                    <p className="text-sm text-white/40 leading-relaxed font-light">
                      We do not log your IP address, browser user-agent, or geolocation. Your physical and digital location remains masked from our infrastructure.
                    </p>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h3 className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase mb-8">2. Ephemeral Architecture</h3>
              <div className="flex flex-col gap-10">
                <p className="text-white/60 text-lg font-light leading-relaxed max-w-3xl">
                  Communication is handled via temporary chat &quot;rooms&quot; which are stored in a volatile state and wiped completely after 24 hours. Messages exist in volatile memory and are purged aggressively to ensure no permanent record is created.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <span className="block text-white font-bold uppercase tracking-widest text-xs mb-3">Volatile Persistence</span>
                    <p className="text-sm text-white/40 leading-relaxed font-light">
                      Data is stored in a real-time state synchronizer. Once a room expires or is manually &quot;killed,&quot; all associated cryptographic keys and message histories are wiped.
                    </p>
                  </div>
                  <div>
                    <span className="block text-white font-bold uppercase tracking-widest text-xs mb-3">On-Disconnect Purge</span>
                    <p className="text-sm text-white/40 leading-relaxed font-light">
                      When participants leave a room, our systems automatically trigger a cleanup process to remove local identifiers and presence data from the global state.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase mb-8">3. Local-First Security</h3>
              <div className="flex flex-col gap-8">
                <p className="text-white/60 text-lg font-light leading-relaxed max-w-3xl">
                  Your communication is secured using industry-standard protocols. Security occurs at the edge—your device—ensuring that intermediate servers only see encrypted noise.
                </p>
                <div className="border-l border-white/10 pl-8 space-y-6 max-w-2xl">
                  <p className="text-sm text-white/40 font-light italic">
                    All messages are encrypted locally using AES-256-GCM. Because the key is derived from the room code, even the database administrator cannot read your messages—only those in the room with the &quot;code&quot; can decrypt them.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase mb-8">4. No Tracking / No Cookies</h3>
              <div className="flex flex-col gap-8">
                <p className="text-white/60 text-lg font-light leading-relaxed max-w-3xl">
                  We do not use tracking pixels, analytics engines, or third-party advertising scripts. NoTrace uses zero persistent cookies. The only data stored on your device is strictly necessary for current session synchronization.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
