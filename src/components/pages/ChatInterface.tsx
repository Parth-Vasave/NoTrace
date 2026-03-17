'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useChat } from '@/context/chat-context';
import { useToast } from '@/hooks/use-toast';
import { NewButton } from '@/components/ui/new-button';
import { NewInput } from '@/components/ui/new-input';
import { format } from 'date-fns';
import { CaptchaGate } from '@/components/auth/CaptchaGate';

interface ChatInterfaceProps {
  roomCode: string;
}

export default function ChatInterface({ roomCode }: ChatInterfaceProps) {
  const {
    joinRoom,
    leaveRoom,
    killRoom,
    sendMessage,
    messages,
    members,
    currentUser,
    loading: chatLoading,
    error: chatError,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [isKilling, setIsKilling] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let isMounted = true;
    const attemptJoin = async () => {
      if (!isVerified) return; // Don't join until verified
      
      try {
        const userName = searchParams.get('name') || undefined;
        const joinedSuccessfully = await joinRoom(roomCode, userName);
        if (isMounted) setIsJoining(false);
        if (!joinedSuccessfully && isMounted) {
          toast({ variant: "destructive", title: "Failed to Join", description: "Redirecting..." });
          router.push('/room');
        }
      } catch (err) {
        if (isMounted) {
          setIsJoining(false);
          router.push('/room');
        }
      }
    };
    attemptJoin();
    return () => { isMounted = false; };
  }, [roomCode, joinRoom, router, toast, searchParams, isVerified]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !currentUser) return;
    
    const text = inputValue.trim();
    setInputValue('');
    try {
      await sendMessage(roomCode, text);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  // No longer needed: Manual Turnstile controls removed from footer

  const handleExit = async () => {
    setIsLeaving(true);
    try {
      await leaveRoom(roomCode);
      router.push('/');
    } catch (err) {
      setIsLeaving(false);
    }
  };

  const handleKill = async () => {
    if (!window.confirm("CRITICAL ACTION: This will permanently delete this room and all its messages. Proceed?")) {
      return;
    }

    setIsKilling(true);
    try {
      await killRoom(roomCode);
      router.push('/');
    } catch (err) {
      setIsKilling(false);
      toast({ variant: "destructive", title: "Kill Failed", description: "Could not terminate session." });
    }
  };

  if (!isVerified) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white px-6">
        <div className="max-w-md w-full text-center space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Identity Verify</h1>
            <p className="text-white/40 font-bold tracking-[0.2em] text-[10px] uppercase">
              Secure Channel: {roomCode}
            </p>
          </div>
          
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-md">
            <p className="text-sm text-white/50 mb-8 font-light leading-relaxed">
              To prevent automated interception and maintain transient session integrity, please solve the challenge below.
            </p>
            <CaptchaGate 
              className="w-full"
              onVerify={(token) => {
                setCaptchaToken(token);
                if (token) {
                  setTimeout(() => setIsVerified(true), 800); // Smooth transition
                } else {
                  toast({
                    variant: "destructive",
                    title: "Verification failed",
                    description: "Captcha verification timed out or failed. Please retry.",
                  });
                }
              }} 
            />
          </div>

          <button 
            onClick={() => router.push('/')}
            className="text-white/20 hover:text-white/60 transition-colors text-[10px] font-bold tracking-[0.3em] uppercase"
          >
            ← Abort Session
          </button>
        </div>
      </div>
    );
  }

  if (isJoining || (!currentUser && chatLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl animate-pulse mb-4 text-emerald-500">security</span>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-500/80">Link Verified. Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-black text-white font-sans antialiased">
      {/* Header Section */}
      <header className="p-6 md:p-8 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo-dark.png" alt="NoTrace" className="h-8 md:h-10 w-auto object-contain" />
          <span className="font-bold tracking-widest text-lg uppercase">NOTRACE</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col px-8 md:px-16 lg:px-24 max-w-7xl w-full mx-auto overflow-hidden">
        {/* Session Metadata */}
        <div className="text-left mb-8 flex-shrink-0">
          <div className="font-mono text-[10px] tracking-[0.3em] text-white/40 uppercase mb-2 ml-1 opacity-60">
            SESSION ID
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 leading-none select-none">
            {roomCode}
          </h1>
          
          <div className="flex items-center justify-start gap-6 font-mono text-[10px] md:text-xs tracking-[0.2em] text-white/50 uppercase">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span>SESSION ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-6">
              <span className="material-symbols-outlined text-[14px]">group</span>
              <span>Peers Active: {members.length}</span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <section ref={scrollRef} className="flex-grow flex flex-col gap-8 mb-8 overflow-y-auto pr-4 no-scrollbar">
          {messages.map((msg, idx) => {
            const isSelf = msg.senderId === currentUser?.id;
            const senderName = members.find(m => m.id === msg.senderId)?.name || 'Unknown';
            
            return (
              <div key={msg.id || idx} className="flex flex-col gap-2">
                <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest uppercase text-white/40">
                  <span>IDENTITY: {senderName}</span>
                  <span>
                    {msg.timestamp && typeof msg.timestamp === 'number' ? format(msg.timestamp, 'HH:mm:ss') : '--:--:--'}
                  </span>
                  {isSelf && <span className="text-white/20">(YOU)</span>}
                </div>
                <div className="text-lg md:text-xl font-light tracking-wide text-white/90 break-words">
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div className="mt-auto"></div>
        </section>

        {/* Interaction Area */}
        <section className="w-full max-w-3xl mb-12 flex-shrink-0">
          <div className="flex flex-col gap-4">
            <label className="font-mono text-[10px] tracking-widest uppercase text-white/40 ml-1" htmlFor="command-input">
              ENTER COMMAND OR MESSAGE...
            </label>
            
            <form onSubmit={handleSend} className="relative group">
              <textarea 
                id="command-input"
                className="w-full bg-transparent border-t-0 border-x-0 border-b border-white/20 focus:ring-0 focus:outline-none focus:border-notrace-accent text-white font-mono py-4 px-2 resize-none transition-all duration-300" 
                placeholder="" 
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLeaving}
              />
              <button 
                type="submit"
                className="absolute right-2 bottom-4 text-white/20 hover:text-white transition-colors disabled:opacity-0" 
                disabled={isLeaving || !inputValue.trim()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <line x1="22" x2="11" y1="2" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>

            {/* Footer Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  onClick={() => handleKill()}
                  disabled={isKilling || isLeaving}
                  className="px-10 py-2 border border-red-500/30 text-red-500 text-xs font-mono uppercase tracking-widest hover:bg-red-500/10 transition-colors disabled:opacity-20"
                >
                  {isKilling ? 'KILLING...' : 'KILL'}
                </button>
                <button 
                  onClick={() => handleExit()}
                  disabled={isKilling || isLeaving}
                  className="px-10 py-2 border border-white/20 text-white/60 text-xs font-mono uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-20"
                >
                  {isLeaving ? 'EXITING...' : 'EXIT'}
                </button>
              </div>

              {/* Security Metadata */}
              <div className="flex flex-col items-end gap-1 font-mono text-[9px] tracking-widest text-white/30 uppercase w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 11 12 14 15 11"></polyline>
                  </svg>
                  <span>AES-256-GCM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/40"></span>
                  <span>EPHEMERAL LINK</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Decorative Footer */}
      <footer className="p-8 flex-shrink-0">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </footer>
    </div>
  );
}
