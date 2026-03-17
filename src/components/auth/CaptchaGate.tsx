'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

interface CaptchaGateProps {
  onVerify: (token: string | null) => void;
  className?: string;
}

export function CaptchaGate({ onVerify, className }: CaptchaGateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderTurnstile = () => {
    if ((window as any).turnstile && containerRef.current && !widgetIdRef.current) {
      widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
        theme: 'dark',
        size: 'compact',
        callback: (token: string) => {
          onVerify(token);
        },
        'expired-callback': () => {
          onVerify(null);
        },
        'error-callback': () => {
          onVerify(null);
        },
      });
    }
  };

  useEffect(() => {
    if ((window as any).turnstile) {
      renderTurnstile();
    }
    return () => {
      if (widgetIdRef.current && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  return (
    <div className={className}>
      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center border border-white/5 bg-white/[0.02] rounded-lg overflow-hidden backdrop-blur-sm" />
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" 
        onLoad={renderTurnstile}
      />
    </div>
  );
}
