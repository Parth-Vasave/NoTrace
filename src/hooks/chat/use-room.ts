import * as React from 'react';
import {
  ref,
  set,
  remove,
  serverTimestamp,
  get,
  type Database,
} from 'firebase/database';
import { logger } from '@/lib/logger';
import { sanitizeRoomCode } from '@/lib/utils';

const ROOM_CODE_REGEX = /^[A-Z0-9]{4,12}$/;
const ROOM_CREATION_COOLDOWN = 30 * 1000;
const MAX_ROOMS_PER_SESSION = 10;

export function useRoom(db: Database | null) {
  const [isCreator, setIsCreator] = React.useState(false);
  const lastRoomCreationRef = React.useRef(0);
  const roomsCreatedRef = React.useRef(0);

  const getRoomRef = React.useCallback((roomCode: string) => {
    if (!db) throw new Error("Database not initialized");
    return ref(db, `rooms/${roomCode.toUpperCase()}`);
  }, [db]);

  const checkRoomExists = React.useCallback(async (roomCode: string): Promise<boolean> => {
    if (!db) return false;
    try {
      const roomRef = getRoomRef(sanitizeRoomCode(roomCode));
      const snapshot = await get(roomRef);
      return snapshot.exists();
    } catch (err: any) {
      logger.error("Error checking room existence:", err);
      return false;
    }
  }, [db, getRoomRef]);

  const createRoom = React.useCallback(async (roomCode: string): Promise<string> => {
    if (!db) throw new Error("Database not initialized");

    const now = Date.now();
    if (now - lastRoomCreationRef.current < ROOM_CREATION_COOLDOWN) {
      throw new Error("Please wait before creating another room.");
    }
    if (roomsCreatedRef.current >= MAX_ROOMS_PER_SESSION) {
      throw new Error("Room creation limit reached for this session.");
    }

    const upperCode = sanitizeRoomCode(roomCode);
    if (!ROOM_CODE_REGEX.test(upperCode)) {
      throw new Error("Invalid room code. Use 4-12 alphanumeric characters.");
    }

    const roomRef = getRoomRef(upperCode);
    const roomSnapshot = await get(roomRef);
    if (roomSnapshot.exists()) {
      throw new Error(`Room ${upperCode} already exists.`);
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

    return creatorId;
  }, [db, getRoomRef]);

  const deleteRoom = React.useCallback(async (roomCode: string) => {
    if (!db) return;
    const roomRef = getRoomRef(roomCode.toUpperCase());
    await remove(roomRef);
    logger.debug(`Room ${roomCode} purged from database.`);
  }, [db, getRoomRef]);

  return {
    isCreator,
    setIsCreator,
    checkRoomExists,
    createRoom,
    deleteRoom,
    getRoomRef,
  };
}
