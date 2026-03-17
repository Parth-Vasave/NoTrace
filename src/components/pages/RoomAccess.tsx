'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NewButton } from '@/components/ui/new-button';
import { NewInput } from '@/components/ui/new-input';
import { useRouter } from 'next/navigation';
import { useChat } from '@/context/chat-context';
import { useToast } from '@/hooks/use-toast';
import { generateRoomCode } from '@/lib/utils';
import { CaptchaGate } from '@/components/auth/CaptchaGate';

export default function RoomAccess() {
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'join' | null>(null);

  const router = useRouter();
  const { checkRoomExists, createRoom } = useChat();
  const { toast } = useToast();

  // Effect to handle pending action after CAPTCHA verification
  React.useEffect(() => {
    if (captchaToken && pendingAction) {
      // Small delay for smooth transition after CAPTCHA checkbox disappears
      setTimeout(() => {
        if (pendingAction === 'create') {
          handleCreateRoom();
        } else if (pendingAction === 'join') {
          handleJoinRoom();
        }
        setPendingAction(null);
        setShowVerification(false);
      }, 500);
    }
  }, [captchaToken, pendingAction]);

  const handleCreateRoom = async () => {
    if (!captchaToken) {
      setPendingAction('create');
      setShowVerification(true);
      return;
    }

    setIsCreating(true);
    try {
      const newRoomCode = generateRoomCode();
      await createRoom(newRoomCode);
      const nameParam = displayName.trim() ? `&name=${encodeURIComponent(displayName.trim())}` : '';
      router.push(`/room/${newRoomCode}?created=true${nameParam}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        variant: "destructive",
        title: "Error creating room",
        description: error.message || "Could not create a new room. Please try again.",
      });
      // Reset CAPTCHA on error so they have to solve it again for security
      setCaptchaToken(null);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Room Code",
        description: "Please enter a room code.",
      });
      return;
    }

    if (!captchaToken) {
      setPendingAction('join');
      setShowVerification(true);
      return;
    }

    setIsJoining(true);
    try {
      const exists = await checkRoomExists(roomCode);
      if (exists) {
        const nameParam = displayName.trim() ? `?name=${encodeURIComponent(displayName.trim())}` : '';
        router.push(`/room/${roomCode}${nameParam}`);
      } else {
        toast({
          variant: "destructive",
          title: "Room Not Found",
          description: "The entered room code does not exist.",
        });
        setIsJoining(false);
        setCaptchaToken(null); // Reset on failure
      }
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        variant: "destructive",
        title: "Error joining room",
        description: error.message || "Could not join the room. Please check the code and try again.",
      });
      setIsJoining(false);
      setCaptchaToken(null);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-black text-white selection:bg-white/20">
      <Navbar />
      
      <main className="flex-1 flex flex-col px-6 md:px-16 py-16 md:py-32 max-w-4xl w-full mx-auto relative">
        {/* Verification Overlay */}
        {showVerification && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl transition-all duration-300">
            <div className="max-w-md w-full bg-white/[0.02] border border-white/10 p-10 rounded-3xl text-center space-y-10 shadow-2xl">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic italic">Identity Verify</h2>
                <p className="text-white/40 font-bold tracking-[0.2em] text-[10px] uppercase">
                  Protecting transient integrity
                </p>
              </div>
              
              <div className="space-y-8">
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  Solve the challenge below to prove your identity and proceed with the secure session.
                </p>
                <CaptchaGate onVerify={setCaptchaToken} className="w-full" />
              </div>

              <button 
                onClick={() => { setShowVerification(false); setPendingAction(null); }}
                className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors pt-4 flex items-center justify-center gap-2 mx-auto"
              >
                <span className="text-sm">←</span> Cancel Request
              </button>
            </div>
          </div>
        )}

        <div className="mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black leading-tight tracking-tighter text-white uppercase mb-4 md:mb-8 break-words text-left">Room Access</h1>
          <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-xl font-light text-left">
            Secure, anonymous communication. Join an existing channel or create a new transient space.
          </p>
        </div>
        
        <div className="space-y-16 md:space-y-20">
          {/* Identity Section */}
          <section>
            <h3 className="text-white/40 font-bold tracking-[0.3em] text-[10px] uppercase mb-6 md:mb-8">Identity</h3>
            <div className="flex flex-col gap-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="nickname">Your Nickname</label>
              <NewInput 
                id="nickname" 
                placeholder="e.g. Ghost Walker" 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-xl md:text-2xl"
              />
              <p className="text-[10px] md:text-xs text-slate-400/60 font-mono italic">TRACE IDENTIFIER: {displayName ? displayName.toUpperCase() : 'UNKNOWN'}</p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-12 md:gap-16">
            {/* Join Room Section */}
            <section className="flex flex-col gap-6 md:gap-8">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase">Join a Room</h2>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="room-code">Access Code</label>
                  <NewInput 
                    id="room-code" 
                    placeholder="00000000" 
                    type="text" 
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="text-2xl md:text-3xl tracking-[0.3em] md:tracking-[0.5em] font-mono"
                  />
                </div>
                  <NewButton 
                    variant="primary" 
                    onClick={handleJoinRoom}
                    disabled={isJoining || isCreating || !roomCode.trim()}
                    className="w-full md:w-auto"
                  >
                    {isJoining ? 'Connecting...' : 'Connect to Room'}
                  </NewButton>
              </div>
            </section>

            {/* Create Room Section */}
            <section className="flex flex-col gap-6 md:gap-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase">Create a Room</h2>
              <div className="flex flex-col gap-6 md:gap-8">
                <p className="text-white/40 text-lg md:text-xl font-light">
                  Generate a fresh encrypted session and a unique access code.
                </p>
                <NewButton 
                  variant="outline" 
                  className="w-full md:w-fit"
                  onClick={handleCreateRoom}
                  disabled={isCreating || isJoining}
                >
                  {isCreating ? 'Generating...' : 'Generate Room'}
                </NewButton>
              </div>
            </section>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
