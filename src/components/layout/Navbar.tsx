import React from 'react';
import Link from 'next/link';

export const Navbar = () => {
  return (
    <header className="flex items-center justify-between border-b border-white/5 px-6 md:px-24 lg:px-48 py-6 md:py-10">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative">
          <img 
            src="/logo-dark.png" 
            alt="NoTrace" 
            className="h-8 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </div>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-white uppercase">NoTrace</h2>
      </Link>
      
      <div className="flex items-center gap-4 md:gap-8">
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/docs" className="text-xs font-medium text-white/60 hover:text-white transition-colors uppercase tracking-widest">Docs</Link>
          <Link href="/privacy" className="text-xs font-medium text-white/60 hover:text-white transition-colors uppercase tracking-widest">Privacy</Link>
        </nav>
        
      </div>
    </header>
  );
};
