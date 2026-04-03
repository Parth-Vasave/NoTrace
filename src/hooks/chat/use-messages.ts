import * as React from 'react';
import {
  ref,
  set,
  push,
  onValue,
  update,
  off,
  get,
  serverTimestamp,
  type Database,
  type DatabaseReference,
} from 'firebase/database';
import { logger } from '@/lib/logger';
import { sanitizeText } from '@/lib/utils';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import type { Message } from '@/context/chat-context';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_ROOM_MESSAGES = 100;
const MESSAGE_COOLDOWN = 1000;

export function useMessages(db: Database | null) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const messagesListenerRef = React.useRef<DatabaseReference | undefined>();
  const lastMessageTimeRef = React.useRef(0);

  const getMessagesRef = React.useCallback((roomCode: string) => {
    if (!db) throw new Error("Database not initialized");
    return ref(db, `rooms/${roomCode.toUpperCase()}/messages`);
  }, [db]);

  const cleanupMessagesListener = React.useCallback(() => {
    if (messagesListenerRef.current) {
      off(messagesListenerRef.current);
      messagesListenerRef.current = undefined;
    }
    setMessages([]);
  }, []);

  const attachMessagesListener = React.useCallback((roomCode: string) => {
    if (!db) return;
    const messagesRef = getMessagesRef(roomCode);
    messagesListenerRef.current = messagesRef;

    onValue(messagesRef, async (snapshot) => {
      const data = snapshot.val();
      const loaded: Message[] = data ? await Promise.all(
        Object.entries(data).map(async ([id, msg]: [string, any]) => {
          const decryptedText = await decryptMessage(msg.text, roomCode);
          return { id, ...msg, text: decryptedText };
        })
      ) : [];
      loaded.sort((a, b) => (a.timestamp as number) - (b.timestamp as number));
      setMessages(loaded);
    }, (err) => {
      logger.error(`Messages listener error:`, err);
    });
  }, [db, getMessagesRef]);

  const sendMessage = React.useCallback(async (
    roomCode: string,
    text: string,
    senderId: string,
  ) => {
    if (!db) throw new Error("Database not initialized");

    const trimmed = sanitizeText(text);
    if (!trimmed) return;

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
    }

    const now = Date.now();
    if (now - lastMessageTimeRef.current < MESSAGE_COOLDOWN) {
      throw new Error("Rate limit exceeded");
    }
    lastMessageTimeRef.current = now;

    const messagesRef = getMessagesRef(roomCode);
    const encrypted = await encryptMessage(trimmed, roomCode);

    const newMessage: Message = {
      senderId,
      text: encrypted,
      timestamp: serverTimestamp(),
    };

    const newRef = push(messagesRef);
    await set(newRef, newMessage);

    // Trim old messages if over limit
    if (messages.length >= MAX_ROOM_MESSAGES) {
      await trimMessages(roomCode);
    }

    return trimmed.length;
  }, [db, getMessagesRef, messages.length]);

  const trimMessages = React.useCallback(async (roomCode: string) => {
    if (!db) return;
    const messagesRef = getMessagesRef(roomCode);
    try {
      const snapshot = await get(messagesRef);
      if (!snapshot.exists()) return;
      const data = snapshot.val();
      const sorted = Object.entries(data)
        .map(([id, d]: [string, any]) => ({ id, timestamp: d.timestamp }))
        .sort((a, b) => (a.timestamp as number) - (b.timestamp as number));

      if (sorted.length > MAX_ROOM_MESSAGES) {
        const toDelete = sorted.slice(0, sorted.length - MAX_ROOM_MESSAGES);
        const updates: Record<string, null> = {};
        toDelete.forEach(msg => { updates[msg.id] = null; });
        await update(messagesRef, updates);
        logger.debug(`Trimmed ${toDelete.length} messages.`);
      }
    } catch (err) {
      logger.error("Error trimming messages:", err);
    }
  }, [db, getMessagesRef]);

  return {
    messages,
    getMessagesRef,
    cleanupMessagesListener,
    attachMessagesListener,
    sendMessage,
  };
}
