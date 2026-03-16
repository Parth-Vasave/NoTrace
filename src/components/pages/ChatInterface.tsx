'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useChat } from '@/context/chat-context';
import { useToast } from '@/hooks/use-toast';
import { NewButton } from '@/components/ui/new-button';
import { NewInput } from '@/components/ui/new-input';
import { format } from 'date-fns';

interface ChatInterfaceProps {
  roomCode: string;
}

export default function ChatInterface({ roomCode }: ChatInterfaceProps) {
  const {
    joinRoom,
    leaveRoom,
    sendMessage,
    messages,
    members,
    currentUser,
    loading: chatLoading,
    error: chatError,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  
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
  }, [roomCode, joinRoom, router, toast, searchParams]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !currentUser || !captchaToken) return;
    
    const text = inputValue.trim();
    setInputValue('');
    try {
      await sendMessage(roomCode, text);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  // Manual Turnstile Render
  const renderTurnstile = () => {
    if ((window as any).turnstile && captchaContainerRef.current && !turnstileWidgetId.current) {
      turnstileWidgetId.current = (window as any).turnstile.render(captchaContainerRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '', // Use environment variable
        theme: 'dark',
        size: 'compact',
        callback: (token: string) => {
          setCaptchaToken(token);
        },
      });
    }
  };

  useEffect(() => {
    if ((window as any).turnstile) {
      renderTurnstile();
    }
    return () => {
      if (turnstileWidgetId.current && (window as any).turnstile) {
        (window as any).turnstile.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
  }, []);

  const handleExit = async () => {
    setIsLeaving(true);
    try {
      await leaveRoom(roomCode);
      router.push('/');
    } catch (err) {
      setIsLeaving(false);
    }
  };

  if (isJoining || (!currentUser && chatLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl animate-pulse mb-4">security</span>
          <p className="text-sm font-bold uppercase tracking-[0.3em]">Establishing secure link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-black text-white font-display antialiased">
      {/* Header Section */}
      <header className="flex items-center justify-between border-b border-white/5 px-6 md:px-16 py-6 md:py-10">
        <div className="flex items-center gap-3">
          <img src="/logo-dark.png" alt="NoTrace" className="h-8 md:h-10 w-auto object-contain" />
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-white uppercase">NoTrace</h2>
        </div>
      </header>

      {/* Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-16 py-8 md:py-12 max-w-4xl w-full mx-auto no-scrollbar">
        <div className="mb-10 md:mb-16">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black leading-tight tracking-tighter text-white uppercase mb-4">Session Active</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span> 
              ROOM: {roomCode}
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[10px]">group</span>
              PEERS: {members.length}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-6 md:space-y-8 mb-12">
          {messages.map((msg, idx) => {
            const isSelf = msg.senderId === currentUser?.id;
            const senderName = members.find(m => m.id === msg.senderId)?.name || 'Unknown';
            
            return (
              <div key={msg.id || idx} className="flex flex-col gap-1 md:gap-2">
                <div className="flex items-center flex-wrap gap-2 text-white/40 font-bold tracking-[0.2em] text-[10px] uppercase">
                  IDENTITY: {senderName} 
                  <span className="text-white/20">
                    {msg.timestamp && typeof msg.timestamp === 'number' ? format(msg.timestamp, 'HH:mm:ss') : '--:--:--'}
                  </span>
                  {isSelf && <span className="text-white/10">(YOU)</span>}
                </div>
                <p className="text-base md:text-lg text-white font-light leading-relaxed break-words">
                  {msg.text}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-black border-t border-white/5 pt-8 md:pt-12">
        <div className="max-w-4xl mx-auto px-6 md:px-16 pb-12 md:pb-20">
          <form onSubmit={handleSend} className="flex flex-col gap-4 mb-6 md:mb-8">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">
              Enter command or message...
            </label>
            <div className="flex items-end gap-4 border-b border-white/10 focus-within:border-white transition-all">
              <input 
                className="w-full bg-transparent border-none px-0 py-3 md:py-4 focus:ring-0 text-white text-xl md:text-2xl font-light placeholder:text-white/10" 
                placeholder="_" 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLeaving}
              />
              <button 
                type="submit"
                disabled={isLeaving || !inputValue.trim() || !captchaToken}
                className="text-white/40 hover:text-white disabled:opacity-20 transition-colors py-3 md:py-4"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            
            {/* CAPTCHA Widget Container */}
            <div className="mt-4 opacity-50 hover:opacity-100 transition-opacity">
              <div ref={captchaContainerRef} />
            </div>
            
            <Script 
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" 
              onLoad={renderTurnstile}
            />
          </form>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
            <div className="flex gap-4 w-full md:w-auto">
              <NewButton variant="kill" onClick={() => handleExit()} className="flex-1 md:flex-none">Kill</NewButton>
              <NewButton variant="secondary_outline" onClick={() => handleExit()} className="flex-1 md:flex-none">Exit</NewButton>
            </div>
            <div className="flex flex-col gap-1 items-end w-full md:w-auto">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">verified_user</span> AES-256-GCM
              </p>
              <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">Ephemeral Link</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
