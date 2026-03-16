import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="border-t border-white/5 px-6 md:px-24 lg:px-48 py-12 md:py-20 flex flex-col gap-10 md:gap-12 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-6">
        <div className="flex items-center gap-3">
          <img 
            src="/logo-dark.png" 
            alt="NoTrace" 
            className="h-6 md:h-8 w-auto object-contain"
          />
          <h2 className="text-base md:text-lg font-bold tracking-tight text-white uppercase">NoTrace</h2>
        </div>
        <nav className="flex flex-wrap justify-center gap-8">
          <Link className="text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest" href="/docs">Documentation</Link>
          <Link className="text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest" href="https://github.com/Parth-Vasave/NoTrace">GitHub</Link>
          <Link className="text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest" href="/privacy">Privacy Policy</Link>
        </nav>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4 text-center md:text-left">
        <p className="text-white/30 text-xs uppercase tracking-widest">© 2026 NoTrace. All rights reserved.</p>
      </div>
    </footer>
  );
};
