'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

interface CaptchaGateProps {
  onVerify: (token: string | null) => void;
  className?: string;
  timeoutMs?: number;
}

export function CaptchaGate({ onVerify, className, timeoutMs }: CaptchaGateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'timed_out' | 'error'>('loading');
  const envTimeout = Number.parseInt(process.env.NEXT_PUBLIC_TURNSTILE_TIMEOUT_MS || '', 10);
  const timeoutValue = timeoutMs ?? (Number.isFinite(envTimeout) ? envTimeout : 8000);

  const clearTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timeoutRef.current = window.setTimeout(() => {
      setStatus('timed_out');
      onVerify(null);
    }, timeoutValue);
  };

  const cleanupWidget = () => {
    clearTimer();
    if (widgetIdRef.current && (window as any).turnstile) {
      (window as any).turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }
  };

  const renderTurnstile = () => {
    if (!(window as any).turnstile || !containerRef.current) {
      return;
    }

    if (widgetIdRef.current) {
      return;
    }

    setStatus('ready');
    startTimer();

    widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
      theme: 'dark',
      size: 'compact',
      callback: (token: string) => {
        clearTimer();
        onVerify(token);
      },
      'expired-callback': () => {
        clearTimer();
        onVerify(null);
      },
      'error-callback': () => {
        clearTimer();
        setStatus('error');
        onVerify(null);
      },
    });
  };

  const handleRetry = () => {
    cleanupWidget();
    setStatus('loading');
    onVerify(null);
    renderTurnstile();
  };

  useEffect(() => {
    if ((window as any).turnstile) {
      renderTurnstile();
    }
    return cleanupWidget;
  }, []);

  return (
    <div className={className}>
      <div className="space-y-3">
        <div
          ref={containerRef}
          className="min-h-[65px] flex items-center justify-center border border-white/5 bg-white/[0.02] rounded-lg overflow-hidden backdrop-blur-sm"
        />
        {(status === 'timed_out' || status === 'error') && (
          <div className="text-xs text-white/50 flex items-center justify-between gap-4">
            <span>
              {status === 'timed_out'
                ? `Verification timed out after ${Math.round(timeoutValue / 1000)}s. Please retry.`
                : 'Verification failed to load. Please retry.'}
            </span>
            <button
              type="button"
              onClick={handleRetry}
              className="text-white/70 hover:text-white transition-colors font-semibold"
            >
              Retry
            </button>
          </div>
        )}
      </div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onLoad={renderTurnstile}
        onError={() => {
          clearTimer();
          setStatus('error');
          onVerify(null);
        }}
      />
    </div>
  );
}
