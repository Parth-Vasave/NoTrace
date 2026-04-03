'use client';

import * as React from 'react';
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  remove,
  serverTimestamp,
  runTransaction,
  onDisconnect,
  update,
  off,
  get,
  DatabaseReference,
} from 'firebase/database';
import { useFirebase } from './firebase-context';
import { generateRandomName, sanitizeRoomCode, sanitizeUsername, sanitizeText } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import { logger } from '@/lib/logger';

import { ROOM_CONFIG, MESSAGE_CONFIG, MEMBER_CONFIG } from '@/lib/config';

export interface Message {
  id?: string;
  senderId: string;
  text: string;
  timestamp: number | object; // Can be number or Firebase ServerValue.TIMESTAMP
}

export interface Member {
  id: string;
  name: string;
  online: boolean;
  lastSeen: number | object; // Timestamp for inactivity check
}

interface ChatContextProps {
  messages: Message[];
  members: Member[];
  currentUser: Member | null;
  loading: boolean;
  error: string | null;
  roomExists: (roomCode: string) => Promise<boolean>;
  createRoom: (roomCode: string) => Promise<void>;
  joinRoom: (roomCode: string, userName?: string) => Promise<boolean>; // Returns true if successful, false otherwise
  leaveRoom: (roomCode: string) => Promise<void>;
  killRoom: (roomCode: string) => Promise<void>;
  sendMessage: (roomCode: string, text: string) => Promise<void>;
  checkRoomExists: (roomCode: string) => Promise<boolean>; // Added explicit check function
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
  isCreator: boolean;
}

const ChatContext = React.createContext<ChatContextProps>({
  messages: [],
  members: [],
  currentUser: null,
  loading: true,
  error: null,
  roomExists: async () => false,
  createRoom: async () => {},
  joinRoom: async () => false,
  leaveRoom: async () => {},
  killRoom: async () => {},
  sendMessage: async () => {},
  checkRoomExists: async () => false,
  isVerified: false,
  setIsVerified: () => {},
  isCreator: false,
});

export const useChat = () => React.useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { db } = useFirebase();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [currentUser, setCurrentUser] = React.useState<Member | null>(null);
  const currentUserRef = React.useRef<Member | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true); // Initially loading
  const loadingRef = React.useRef<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const errorRef = React.useRef<string | null>(null);
  const { toast } = useToast();
  const currentRoomCode = React.useRef<string | null>(null);
  const listenersRef = React.useRef<{ messages?: DatabaseReference; members?: DatabaseReference }>({});
  const joinAttemptRef = React.useRef<number>(0); 
  const lastMessageTimeRef = React.useRef<number>(0);
  const [isVerified, setIsVerified] = React.useState<boolean>(false);
  const [isCreator, setIsCreator] = React.useState<boolean>(false);
  const lastRoomCreationRef = React.useRef<number>(0);
  const roomsCreatedRef = React.useRef<number>(0);

  // Sync refs with state for stable callback access
  React.useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  React.useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  React.useEffect(() => {
    errorRef.current = error;
  }, [error]);


  // --- Utility Functions ---

  const getRoomRef = React.useCallback((roomCode: string) => {
    if (!db) throw new Error("Database not initialized");
    return ref(db, `rooms/${roomCode.toUpperCase()}`);
  }, [db]);

  const getMessagesRef = React.useCallback((roomCode: string) => {
    if (!db) throw new Error("Database not initialized");
    return ref(db!, `rooms/${roomCode.toUpperCase()}/messages`);
  }, [db]);

  const getMembersRef = React.useCallback((roomCode: string) => {
     if (!db) throw new Error("Database not initialized");
    return ref(db!, `rooms/${roomCode.toUpperCase()}/members`);
  }, [db]);

  const getUserRef = React.useCallback((roomCode: string, userId: string) => {
     if (!db) throw new Error("Database not initialized");
    return ref(db!, `rooms/${roomCode.toUpperCase()}/members/${userId}`);
  }, [db]);


  // Cleanup listeners
  const cleanupListeners = React.useCallback(() => {
    if (listenersRef.current.messages) {
      off(listenersRef.current.messages);
      listenersRef.current.messages = undefined;
      logger.debug("Messages listener detached.");
    }
    if (listenersRef.current.members) {
      off(listenersRef.current.members);
      listenersRef.current.members = undefined;
       logger.debug("Members listener detached.");
    }
     // Reset local state associated with listeners
    setMessages([]);
    setMembers([]);
    setError(null); // Clear errors related to the old room
    // Don't reset currentUser or currentRoomCode here, leaveRoom/joinRoom manage those
    logger.debug("Listeners cleaned up and related state reset.");
  }, []);

  const logInteraction = React.useCallback(async (type: string, metadata: any = {}) => {
    if (!db) return;
    try {
      const logsRef = ref(db, 'abuse_logs');
      const newLogRef = push(logsRef);
      // Privacy-preserving: No IP, just session-based identifiers
      await set(newLogRef, {
        type,
        timestamp: serverTimestamp(),
        sessionId: currentUserRef.current?.id || 'anonymous',
        roomCode: currentRoomCode.current,
        ...metadata
      });
    } catch (err) {
      logger.warn("Logging failed:", err);
    }
  }, [db]);

  const trimMessages = React.useCallback(async (roomCode: string) => {
     if (!db) return;
     const messagesRef = getMessagesRef(roomCode);
     try {
       const snapshot = await get(messagesRef);
       if (snapshot.exists()) {
         const messagesData = snapshot.val();
         const messageIds = Object.keys(messagesData);
         if (messageIds.length > MESSAGE_CONFIG.MAX_PER_ROOM) {
           // Sort by timestamp (approximate by ID if needed, but here we have the data)
           const sortedMessages = Object.entries(messagesData)
             .map(([id, data]: [string, any]) => ({ id, timestamp: data.timestamp }))
             .sort((a, b) => (a.timestamp as number) - (b.timestamp as number));
           
           const toDelete = sortedMessages.slice(0, sortedMessages.length - MESSAGE_CONFIG.MAX_PER_ROOM);
           const updates: any = {};
           toDelete.forEach(msg => { updates[msg.id] = null; });
           await update(messagesRef, updates);
           logger.debug(`Trimmed ${toDelete.length} messages from room ${roomCode}`);
         }
       }
     } catch (err) {
       logger.error("Error trimming messages:", err);
     }
  }, [db, getMessagesRef]);


  // --- Core API Functions ---

   const checkRoomExists = React.useCallback(async (roomCode: string): Promise<boolean> => {
    if (!db) {
      logger.error("checkRoomExists: Database not initialized!");
      return false;
    }
    try {
        logger.debug(`Checking if room ${roomCode} exists...`);
        const roomRef = getRoomRef(roomCode.toUpperCase());
        
        // Add a small race for timeout diagnostics if needed, 
        // but Firebase should eventually timeout or error.
        const snapshot = await get(roomRef);
        const exists = snapshot.exists();
        logger.debug(`Room ${roomCode} exists: ${exists}`);
        return exists;
    } catch (err: any) {
        logger.error("Error checking room existence:", err);
        setError(`Connection Error: ${err.message}`);
        return false;
    }
  }, [db, getRoomRef, setError]);


  const roomExists = React.useCallback(async (roomCode: string): Promise<boolean> => {
    return checkRoomExists(roomCode); // Use the more specific check function
  }, [checkRoomExists]);


  const createRoom = React.useCallback(async (roomCode: string): Promise<void> => {
    if (!db) {
      toast({ variant: "destructive", title: "Error", description: "Firebase Database not connected." });
      throw new Error("Database not initialized");
    }

    setLoading(true);
    setError(null);
    try {
      const now = Date.now();
      if (now - lastRoomCreationRef.current < ROOM_CONFIG.CREATION_COOLDOWN_MS) {
        throw new Error("Please wait before creating another room.");
      }
      if (roomsCreatedRef.current >= ROOM_CONFIG.MAX_CREATIONS_PER_SESSION) {
        throw new Error("Room creation limit reached for this session.");
      }

      const upperCaseRoomCode = roomCode.toUpperCase();

      if (!ROOM_CONFIG.CODE_REGEX.test(upperCaseRoomCode)) {
        throw new Error("Invalid room code. Use 4-12 alphanumeric characters.");
      }

      logger.debug(`[ChatContext] Creating room: ${upperCaseRoomCode}...`);
      
      const roomRef = getRoomRef(upperCaseRoomCode);
      
      logger.debug("[ChatContext] Checking for existing room...");
      const roomSnapshot = await get(roomRef);
       if (roomSnapshot.exists()) {
         logger.warn(`[ChatContext] Room ${upperCaseRoomCode} already exists.`);
         throw new Error(`Room ${upperCaseRoomCode} already exists.`);
       }

      const creatorId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await set(roomRef, {
        createdAt: serverTimestamp(),
        createdBy: creatorId,
        messages: {},
        members: {},
      });
      setIsCreator(true);
      lastRoomCreationRef.current = Date.now();
      roomsCreatedRef.current++;
    } catch (err: any) {
      logger.error("[ChatContext] Error creating room:", err);
      setError(`Failed to create room ${roomCode}: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [db, getRoomRef, setError, toast]);


  // Define leaveRoom *before* joinRoom because joinRoom depends on it for cleanup
  const leaveRoom = React.useCallback(async (roomCode: string): Promise<void> => {
    roomCode = roomCode.toUpperCase(); // Ensure consistency
    const localCurrentUser = currentUser; // Capture current user at the start

     // Prevent leaving if not in the specified room or no user/db
    if (!db || !localCurrentUser || currentRoomCode.current !== roomCode) {
      logger.warn(`Leave room (${roomCode}) called unnecessarily or without context. Current room: ${currentRoomCode.current}, User: ${localCurrentUser?.id}`);
      // Ensure state is clean if called in an inconsistent state
      if (currentRoomCode.current === roomCode || listenersRef.current.messages || listenersRef.current.members) {
           cleanupListeners();
      }
      setCurrentUser(null);
      currentRoomCode.current = null;
      setError(null); // Clear any previous error
      setLoading(false); // Ensure loading is false
      return;
    }

    logger.debug(`Attempting to leave room ${roomCode} as user ${localCurrentUser.id}...`);
    const userId = localCurrentUser.id;
    const userRef = getUserRef(roomCode, userId);

    // Reset state locally *before* async operations for faster UI feedback
    cleanupListeners();
    setCurrentUser(null); // Clear local user state immediately
    currentRoomCode.current = null; // Clear room tracking immediately
    setLoading(false); // Ensure loading is false after local state clear

    try {
        // 1. Cancel onDisconnect (best effort)
        try {
            await onDisconnect(userRef).cancel();
            logger.debug(`onDisconnect cancelled for ${userId}.`);
        } catch (cancelError: any) {
            logger.warn(`Could not cancel onDisconnect (might already be disconnected): ${cancelError.message}`);
        }

        // 2. Mark user offline OR remove them
        try {
            // Using update ensures lastSeen is set even if user was already offline somehow
            await update(userRef, { online: false, lastSeen: serverTimestamp() });
            logger.debug(`User ${userId} marked as offline in DB.`);
        } catch (updateError: any) {
             logger.warn(`Could not mark user ${userId} offline in DB: ${updateError.message}`);
        }

    } catch (err: any) {
      logger.error("Unexpected error during leaveRoom DB operations:", err);
      // Local state is already cleared, just log the error
    } finally {
       setLoading(false);
       logger.debug(`Finished leaveRoom process for ${userId} in room ${roomCode}.`);
    }
  }, [db, cleanupListeners, getUserRef]); // Removed currentUser and setError

  const killRoom = React.useCallback(async (roomCode: string): Promise<void> => {
    roomCode = roomCode.toUpperCase();
    if (!db || currentRoomCode.current !== roomCode) {
        return;
    }

    if (!isCreator) {
      setError("Only the room creator can destroy the room.");
      return;
    }

    setLoading(true);
    const roomRef = getRoomRef(roomCode);

    try {
        // 1. Log the destruction
        await logInteraction('room_killed', { roomCode });
        
        // 2. Perform local cleanup first so UI doesn't hang
        cleanupListeners();
        setCurrentUser(null);
        currentRoomCode.current = null;

        // 3. Nuking the room from existence
        await remove(roomRef);
        logger.debug(`Room ${roomCode} successfully purged from database.`);
    } catch (err: any) {
        logger.error("Error during killRoom operation:", err);
        setError(`Failed to terminate session: ${err.message}`);
    } finally {
        setLoading(false);
    }
  }, [db, getRoomRef, cleanupListeners, logInteraction, setError, isCreator]);


   const joinRoom = React.useCallback(async (roomCode: string, userName?: string): Promise<boolean> => {
     if (!db) {
       setError("Database not initialized");
       return false;
     }
     roomCode = sanitizeRoomCode(roomCode);

     if (!ROOM_CONFIG.CODE_REGEX.test(roomCode)) {
       setError("Invalid room code format.");
       return false;
     }

     if (userName) {
       userName = sanitizeUsername(userName);
       if (!MEMBER_CONFIG.USERNAME_REGEX.test(userName)) {
         setError("Invalid username. Use 2-32 alphanumeric characters, spaces, or dots/underscores.");
         return false;
       }
     }

      if (loadingRef.current && currentRoomCode.current === roomCode) {
          logger.debug("Join attempt ignored: Already joining room", roomCode);
          return false;
      }

     if (currentUserRef.current && currentRoomCode.current === roomCode) {
       logger.debug("Already in room:", roomCode);
       setLoading(false);
       setError(null);
       return true;
     }

     setLoading(true);
     setError(null);
     const attemptId = ++joinAttemptRef.current;
     logger.debug(`[Join Attempt ${attemptId}] Starting for room: ${roomCode}`);

     if (currentRoomCode.current && currentRoomCode.current !== roomCode) {
       logger.debug(`[Join Attempt ${attemptId}] Cleaning up listeners & state from previous room: ${currentRoomCode.current}`);
       await leaveRoom(currentRoomCode.current); // Await cleanup of the old room
     } else if (!currentRoomCode.current) {
        cleanupListeners();
     }
     currentRoomCode.current = roomCode;

     try {
       const roomRef = getRoomRef(roomCode);
       const membersRef = getMembersRef(roomCode);
       const memberId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
       const finalUserName = userName || generateRandomName();
       const userRef = getUserRef(roomCode, memberId);

        const roomSnapshot = await get(roomRef);
        if (!roomSnapshot.exists()) {
            if (joinAttemptRef.current !== attemptId) return false;
            setError(`Room ${roomCode} does not exist.`);
            currentRoomCode.current = null;
            setLoading(false);
            return false;
        }

        // Check if this session created the room (creator ID stored in room data)
        const roomData = roomSnapshot.val();
        if (roomData?.createdBy) {
          setIsCreator(false); // Will be set true only if matching
        }

       let transactionError: string | null = null;
       logger.debug(`[Join Attempt ${attemptId}] Starting transaction for new user ${memberId} (${finalUserName})...`);
       const transactionResult = await runTransaction(membersRef, (currentMembers) => {
          if (joinAttemptRef.current !== attemptId) {
              logger.debug(`[Join Attempt ${attemptId} - TXN] Aborting: Newer attempt running.`);
              transactionError = "Aborted due to newer join attempt.";
              return undefined;
          }
          if (!currentMembers) currentMembers = {};

         const onlineMembers = Object.values(currentMembers).filter((m: any) => m?.online === true);
         const onlineMemberCount = onlineMembers.length;

         logger.debug(`[Join Attempt ${attemptId} - TXN] Current online members: ${onlineMemberCount}, Max allowed: ${ROOM_CONFIG.MAX_MEMBERS}`);

         if (onlineMemberCount >= ROOM_CONFIG.MAX_MEMBERS) {
           logger.warn(`[Join Attempt ${attemptId} - TXN] Aborting: Room full (${onlineMemberCount}/${ROOM_CONFIG.MAX_MEMBERS}).`);
           transactionError = `Room ${roomCode} is full. Max ${ROOM_CONFIG.MAX_MEMBERS} members allowed.`; // More specific error
           return undefined;
         }

         const newUser: Member = { id: memberId, name: finalUserName, online: true, lastSeen: serverTimestamp() };
         currentMembers[memberId] = newUser; // Directly modify draft state
         logger.debug(`[Join Attempt ${attemptId} - TXN] Proceeding to add new user ${memberId}.`);
         return currentMembers;
       }, { applyLocally: false });


        if (joinAttemptRef.current !== attemptId) {
            logger.debug(`[Join Attempt ${attemptId}] Aborted after transaction: Newer attempt started.`);
            if (transactionResult.committed) {
                logger.warn(`[Join Attempt ${attemptId}] Transaction committed but attempt is outdated. Attempting cleanup.`);
                try { await remove(userRef); } catch (cleanupError) { logger.error("Error cleaning up outdated user entry:", cleanupError); }
            }
            return false;
        }


       if (!transactionResult.committed) {
         const reason = transactionError || `Failed to add user due to high contention (maxretry).`;
         logger.error(`[Join Attempt ${attemptId}] Transaction failed to commit for room ${roomCode}. Reason: ${reason}`);
         setError(reason); // Use the specific error message
         currentRoomCode.current = null;
         setLoading(false);
         return false;
       }

        logger.debug(`[Join Attempt ${attemptId}] Transaction committed successfully. User ${memberId} added.`);

       if (!transactionResult.snapshot.child(memberId).exists()) {
          logger.error(`[Join Attempt ${attemptId}] CRITICAL: Transaction committed, but user ${memberId} missing in final snapshot.`);
          setError(`An inconsistency occurred while joining room ${roomCode}. Please try again.`);
          try { await remove(userRef); } catch (cleanupError) { logger.error("Error cleaning up user entry after inconsistent transaction:", cleanupError); }
          currentRoomCode.current = null;
          setLoading(false);
          return false;
        }

        const finalUser = transactionResult.snapshot.child(memberId).val();
        setCurrentUser(finalUser);


        logger.debug(`[Join Attempt ${attemptId}] Setting up onDisconnect for ${memberId}...`);
        await onDisconnect(userRef).update({ online: false, lastSeen: serverTimestamp() });


        logger.debug(`[Join Attempt ${attemptId}] Attaching listeners...`);
        const messagesListenerRef = getMessagesRef(roomCode);
        listenersRef.current.messages = messagesListenerRef;
        onValue(messagesListenerRef, async (snapshot) => {
            if (currentRoomCode.current !== roomCode || joinAttemptRef.current !== attemptId) return;
            const messagesData = snapshot.val();
            const loadedMessages: Message[] = messagesData ? await Promise.all(Object.entries(messagesData).map(async ([id, msg]: [string, any]) => {
                const decryptedText = await decryptMessage(msg.text, roomCode);
                return { id, ...msg, text: decryptedText };
            })) : [];
            loadedMessages.sort((a, b) => (a.timestamp as number) - (b.timestamp as number));
            setMessages(loadedMessages);
        }, (err) => {
            if (currentRoomCode.current !== roomCode || joinAttemptRef.current !== attemptId) return;
            logger.error(`Messages listener error for room ${roomCode}:`, err);
            setError(`Failed to load messages: ${err.message}`);
            cleanupListeners();
            setCurrentUser(null);
            currentRoomCode.current = null;
            setLoading(false);
        });

        const membersListenerRef = getMembersRef(roomCode);
        listenersRef.current.members = membersListenerRef;
        onValue(membersListenerRef, (snapshot) => {
            if (currentRoomCode.current !== roomCode || joinAttemptRef.current !== attemptId) return;
            const membersData = snapshot.val();
            const loadedMembers: Member[] = membersData ? Object.values(membersData).filter((m): m is Member => !!m) : [];
            setMembers(loadedMembers);

             const currentLocalUser = currentUserRef.current; // Use ref for latest state
             if (currentLocalUser && currentRoomCode.current === roomCode) { // Check if we still think we're in this room
                const stillExists = loadedMembers.some(m => m.id === currentLocalUser.id);
                if (!stillExists) {
                    logger.warn(`Current user ${currentLocalUser.id} no longer found in members list for room ${roomCode}. Forcing local leave.`);
                    setError("You seem to have been disconnected from the room.");
                    // Re-trigger leaveRoom which handles cleanup and state reset
                    leaveRoom(roomCode);
                }
            }

        }, (err) => {
            if (currentRoomCode.current !== roomCode || joinAttemptRef.current !== attemptId) return;
            logger.error(`Members listener error for room ${roomCode}:`, err);
            setError(`Failed to load members: ${err.message}`);
            cleanupListeners();
            setCurrentUser(null);
            currentRoomCode.current = null;
            setLoading(false);
        });


       logger.debug(`[Join Attempt ${attemptId}] Successfully joined room ${roomCode} as ${finalUser.name} (${memberId})`);
       setLoading(false);
       return true;

     } catch (err: any) {
        if (joinAttemptRef.current !== attemptId) {
             logger.debug(`[Join Attempt ${attemptId}] Aborted due to error, but newer attempt started:`, err.message);
             return false;
        }

       logger.error(`[Join Attempt ${attemptId}] General error during joinRoom process:`, err);
       const specificError = `Failed to join room ${roomCode}: ${err.message || 'Unknown error'}`;
       setError(specificError);
       cleanupListeners();
       setCurrentUser(null);
       currentRoomCode.current = null;
       setLoading(false);
       return false;
     }
   }, [
        db,
        // Remove currentUser state to stabilize identity
        cleanupListeners,
        getRoomRef,
        getMembersRef,
        getUserRef,
        getMessagesRef,
        toast,
        setError,
        leaveRoom
    ]);


  const sendMessage = React.useCallback(async (roomCode: string, text: string): Promise<void> => {
    roomCode = roomCode.toUpperCase(); // Ensure consistency
     const localCurrentUser = currentUserRef.current; // Use ref for stability

    if (!db || !localCurrentUser || currentRoomCode.current !== roomCode) {
        logger.error("Cannot send message: Conditions not met.", { db: !!db, user: !!localCurrentUser, currentRoom: currentRoomCode.current, targetRoom: roomCode });
        throw new Error("Cannot send message: Not connected to the room or database.");
    }

    const trimmedText = sanitizeText(text);
    if (!trimmedText) {
       logger.debug("Attempted to send an empty message.");
       return;
    }

    if (trimmedText.length > MESSAGE_CONFIG.MAX_LENGTH) {
      setError(`Message too long (max ${MESSAGE_CONFIG.MAX_LENGTH} characters)`);
      throw new Error("Message exceeds length limit");
    }

    const now = Date.now();
    if (now - lastMessageTimeRef.current < MESSAGE_CONFIG.COOLDOWN_MS) {
      toast({ variant: "destructive", title: "Rate Limited", description: "Please wait a moment before sending another message." });
      throw new Error("Rate limit exceeded");
    }
    lastMessageTimeRef.current = now;

    const messagesRef = getMessagesRef(roomCode);
    const userRef = getUserRef(roomCode, localCurrentUser.id);

    const encryptedText = await encryptMessage(trimmedText, roomCode);

    const newMessage: Message = {
      senderId: localCurrentUser.id,
      text: encryptedText,
      timestamp: serverTimestamp(),
    };

    try {
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, newMessage);
      
      // Post-send security & maintenance
      await logInteraction('message_sent', { length: trimmedText.length });
      if (messages.length >= MESSAGE_CONFIG.MAX_PER_ROOM) {
        await trimMessages(roomCode);
      }

       try {
           await update(userRef, { lastSeen: serverTimestamp() });
       } catch (updateError) {
           logger.warn(`Failed to update lastSeen for ${localCurrentUser.id} after sending message:`, updateError);
       }
    } catch (err: any) {
      logger.error("Error sending message:", err);
      setError(`Failed to send message: ${err.message}`);
      throw err;
    }
  }, [db, getMessagesRef, getUserRef, setError]);


  // --- Effects ---

  // Effect to cleanup listeners and leave room on component unmount
  React.useEffect(() => {
    return () => {
       const roomToLeave = currentRoomCode.current;
       const userToLeave = currentUserRef.current;
       logger.debug("ChatProvider unmounting...");
       if (userToLeave && roomToLeave) {
         logger.debug(`Initiating leaveRoom cleanup for user ${userToLeave.id} in room ${roomToLeave}`);
         leaveRoom(roomToLeave);
       } else {
          logger.debug("No active user/room, running listener cleanup only.");
          cleanupListeners();
       }
    };
  }, [leaveRoom, cleanupListeners]); // Removed currentUser


   // Inactivity check
   React.useEffect(() => {
    const interval = setInterval(async () => {
       const currentCheckedRoom = currentRoomCode.current;
       const currentLocalUser = currentUser;

      if (!db || !currentCheckedRoom) return;

      const membersRef = getMembersRef(currentCheckedRoom);

      try {
        const snapshot = await get(membersRef);
        if (currentRoomCode.current !== currentCheckedRoom) return; // Abort if room changed during fetch

        if (!snapshot.exists()) {
           if (currentLocalUser && currentRoomCode.current === currentCheckedRoom) {
              logger.warn(`Inactivity check found current room ${currentCheckedRoom} deleted. Forcing local leave.`);
              setError("The room seems to have been deleted.");
              leaveRoom(currentCheckedRoom); // Trigger full leave process
           }
           return;
        }

        const membersData = snapshot.val();
        const now = Date.now();
        const membersToRemove: string[] = [];

        for (const memberId in membersData) {
          const member = membersData[memberId] as Member;
          if (!member || !member.lastSeen) {
            logger.warn(`Skipping member ${memberId} in inactivity check due to missing data.`);
            continue;
          }
          if (typeof member.lastSeen === 'number') {
            const timeSinceSeen = now - member.lastSeen;
             const isStaleOffline = !member.online && timeSinceSeen > MEMBER_CONFIG.INACTIVITY_TIMEOUT_MS;
             const isStaleOnline = member.online && timeSinceSeen > MEMBER_CONFIG.INACTIVITY_TIMEOUT_MS * 1.5;

            if (isStaleOffline || isStaleOnline) {
                const reason = isStaleOffline ? "inactive (offline)" : "inactive (stuck online)";
                logger.debug(`Scheduling removal of ${reason} member ${member.name} (${memberId}). Last seen: ${new Date(member.lastSeen).toISOString()}`);
                membersToRemove.push(memberId);
            }
          } else if (typeof member.lastSeen !== 'object') { // Ignore server timestamps (objects)
             logger.warn(`Member ${member.name} (${memberId}) has invalid 'lastSeen' format:`, member.lastSeen);
          }
        }

        if (membersToRemove.length > 0) {
            const updates: { [key: string]: null } = {};
             membersToRemove.forEach(id => { updates[id] = null; });
            await update(membersRef, updates);
            logger.debug(`Removed ${membersToRemove.length} inactive members from room ${currentCheckedRoom}.`);

            // Optional: Check if local user was removed during this cleanup
             if (currentLocalUser && membersToRemove.includes(currentLocalUser.id) && currentRoomCode.current === currentCheckedRoom) {
                 logger.warn(`Local user ${currentLocalUser.id} removed due to inactivity in room ${currentCheckedRoom}. Forcing local leave.`);
                 setError("You were removed from the room due to inactivity.");
                 // LeaveRoom might have already been called implicitly, but calling again ensures state consistency
                 leaveRoom(currentCheckedRoom);
             }
         }

      } catch (err: any) {
        logger.error(`Error during inactivity check for room ${currentCheckedRoom}:`, err.message || err);
      }
    }, MEMBER_CONFIG.INACTIVITY_TIMEOUT_MS / 2);

    return () => clearInterval(interval);
   }, [db, currentUser, getMembersRef, leaveRoom, setError]); // Added leaveRoom and setError


  // --- Value ---

  const value = React.useMemo(() => ({
    messages,
    members,
    currentUser,
    loading,
    error,
    roomExists,
    createRoom,
    joinRoom,
    leaveRoom,
    killRoom,
    sendMessage,
    checkRoomExists,
    isVerified,
    setIsVerified,
    isCreator,
  }), [messages, members, currentUser, loading, error, roomExists, createRoom, joinRoom, leaveRoom, killRoom, sendMessage, checkRoomExists, isVerified, setIsVerified, isCreator]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
