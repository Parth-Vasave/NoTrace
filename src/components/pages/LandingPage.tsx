'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NewButton } from '@/components/ui/new-button';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-black text-white selection:bg-white/20">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="px-6 md:px-24 lg:px-48 py-20 md:py-32 lg:py-64">
          <div className="max-w-4xl">
            <div className="flex flex-col gap-12">
              <div className="flex flex-col gap-8">
                <span className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase">Privacy first messaging</span>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black leading-tight tracking-tighter text-white uppercase break-words">
                  Converse<br/>without a<br/>shadow.
                </h1>
                <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-xl font-light">
                  Experience the ultimate minimalist anonymous chat. No logs, no tracking, no footprints. Your privacy is not a feature; it is our foundation.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 md:gap-6 pt-4">
                <Link href="/room">
                  <NewButton variant="primary" className="w-full sm:w-auto">
                    Start Chatting
                  </NewButton>
                </Link>
                <Link href="/docs">
                  <NewButton variant="ghost" className="w-full sm:w-auto">
                    Learn More
                  </NewButton>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="px-6 md:px-24 lg:px-48 py-24 md:py-40 border-t border-white/5">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-4 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white uppercase">
                Designed for Silence
              </h2>
              <p className="text-white/40 text-lg md:text-xl font-light">
                We stripped away everything but the essentials to provide a secure space for your thoughts.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
              <div className="flex flex-col gap-4 md:gap-6 p-0 bg-transparent transition-opacity hover:opacity-100 opacity-60">
                <h3 className="text-base md:text-lg font-bold uppercase tracking-wider text-white">End-to-End Encryption</h3>
                <p className="text-white/50 leading-relaxed font-light text-sm md:text-base">
                  Every message is encrypted locally before it ever leaves your device. Only the recipient can read it.
                </p>
              </div>
              <div className="flex flex-col gap-4 md:gap-6 p-0 bg-transparent transition-opacity hover:opacity-100 opacity-60">
                <h3 className="text-base md:text-lg font-bold uppercase tracking-wider text-white">Zero Data Retention</h3>
                <p className="text-white/50 leading-relaxed font-light text-sm md:text-base">
                  We don't store IPs, metadata, or chat histories. Once it's gone, it's gone forever.
                </p>
              </div>
              <div className="flex flex-col gap-4 md:gap-6 p-0 bg-transparent transition-opacity hover:opacity-100 opacity-60">
                <h3 className="text-base md:text-lg font-bold uppercase tracking-wider text-white">No Account Required</h3>
                <p className="text-white/50 leading-relaxed font-light text-sm md:text-base">
                  Start chatting instantly. No email, no phone number, no identity verification required.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="px-6 md:px-24 lg:px-48 py-32 md:py-48 border-t border-white/5">
          <div className="flex flex-col items-start gap-12">
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase">
              Join the void.
            </h2>
            <p className="text-white/40 text-lg md:text-xl leading-relaxed max-w-xl font-light">
              Simple, secure, and completely anonymous. Start your first conversation today without leaving a trace.
            </p>
            <Link href="/room" className="w-full sm:w-auto">
              <NewButton variant="primary" size="lg" className="w-full sm:w-auto">
                Get Started Now
              </NewButton>
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
