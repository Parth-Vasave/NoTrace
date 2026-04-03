import * as React from 'react';
import {
  ref,
  onValue,
  runTransaction,
  onDisconnect,
  update,
  remove,
  off,
  get,
  serverTimestamp,
  type Database,
  type DatabaseReference,
} from 'firebase/database';
import { logger } from '@/lib/logger';
import { generateRandomName, sanitizeRoomCode, sanitizeUsername } from '@/lib/utils';
import type { Member } from '@/context/chat-context';

const MAX_MEMBERS = 8;
const MEMBER_INACTIVITY_TIMEOUT = 5 * 60 * 1000;
const ROOM_CODE_REGEX = /^[A-Z0-9]{4,12}$/;
const USER_NAME_REGEX = /^[a-zA-Z0-9\s\-_.]{2,32}$/;

export function useMembers(db: Database | null) {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [currentUser, setCurrentUser] = React.useState<Member | null>(null);
  const currentUserRef = React.useRef<Member | null>(null);
  const currentRoomCode = React.useRef<string | null>(null);
  const membersListenerRef = React.useRef<DatabaseReference | undefined>();

  React.useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const getMembersRef = React.useCallback((roomCode: string) => {
    if (!db) throw new Error("Database not initialized");
    return ref(db, `rooms/${roomCode.toUpperCase()}/members`);
  }, [db]);

  const getUserRef = React.useCallback((roomCode: string, userId: string) => {
    if (!db) throw new Error("Database not initialized");
    return ref(db, `rooms/${roomCode.toUpperCase()}/members/${userId}`);
  }, [db]);

  const cleanupMembersListener = React.useCallback(() => {
    if (membersListenerRef.current) {
      off(membersListenerRef.current);
      membersListenerRef.current = undefined;
    }
    setMembers([]);
  }, []);

  const addMember = React.useCallback(async (
    roomCode: string,
    userName?: string,
  ): Promise<Member | null> => {
    if (!db) return null;
    roomCode = sanitizeRoomCode(roomCode);
    if (!ROOM_CODE_REGEX.test(roomCode)) return null;

    if (userName) {
      userName = sanitizeUsername(userName);
      if (!USER_NAME_REGEX.test(userName)) return null;
    }

    const membersRef = getMembersRef(roomCode);
    const memberId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const finalUserName = userName || generateRandomName();
    const userRef = getUserRef(roomCode, memberId);

    let transactionError: string | null = null;
    const result = await runTransaction(membersRef, (currentMembers) => {
      if (!currentMembers) currentMembers = {};
      const onlineCount = Object.values(currentMembers).filter((m: any) => m?.online === true).length;
      if (onlineCount >= MAX_MEMBERS) {
        transactionError = `Room is full. Max ${MAX_MEMBERS} members.`;
        return undefined;
      }
      currentMembers[memberId] = { id: memberId, name: finalUserName, online: true, lastSeen: serverTimestamp() };
      return currentMembers;
    }, { applyLocally: false });

    if (!result.committed) {
      throw new Error(transactionError || 'Failed to join room.');
    }

    if (!result.snapshot.child(memberId).exists()) {
      try { await remove(userRef); } catch {}
      throw new Error('Inconsistency while joining. Please try again.');
    }

    const finalUser = result.snapshot.child(memberId).val();
    setCurrentUser(finalUser);
    currentRoomCode.current = roomCode;

    await onDisconnect(userRef).update({ online: false, lastSeen: serverTimestamp() });

    return finalUser;
  }, [db, getMembersRef, getUserRef]);

  const removeMember = React.useCallback(async (roomCode: string, userId: string) => {
    if (!db) return;
    const userRef = getUserRef(roomCode.toUpperCase(), userId);
    try {
      await onDisconnect(userRef).cancel();
    } catch {}
    try {
      await update(userRef, { online: false, lastSeen: serverTimestamp() });
    } catch {}
  }, [db, getUserRef]);

  const attachMembersListener = React.useCallback((
    roomCode: string,
    onUserRemoved: () => void,
  ) => {
    if (!db) return;
    const membersRef = getMembersRef(roomCode);
    membersListenerRef.current = membersRef;

    onValue(membersRef, (snapshot) => {
      if (currentRoomCode.current !== roomCode) return;
      const data = snapshot.val();
      const loaded: Member[] = data ? Object.values(data).filter((m): m is Member => !!m) : [];
      setMembers(loaded);

      const local = currentUserRef.current;
      if (local && currentRoomCode.current === roomCode) {
        if (!loaded.some(m => m.id === local.id)) {
          onUserRemoved();
        }
      }
    }, (err) => {
      logger.error(`Members listener error:`, err);
    });
  }, [db, getMembersRef]);

  const runInactivityCheck = React.useCallback(async (roomCode: string) => {
    if (!db) return;
    const membersRef = getMembersRef(roomCode);
    try {
      const snapshot = await get(membersRef);
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      const now = Date.now();
      const toRemove: string[] = [];

      for (const memberId in data) {
        const member = data[memberId] as Member;
        if (!member?.lastSeen || typeof member.lastSeen !== 'number') continue;
        const elapsed = now - member.lastSeen;
        const staleOffline = !member.online && elapsed > MEMBER_INACTIVITY_TIMEOUT;
        const staleOnline = member.online && elapsed > MEMBER_INACTIVITY_TIMEOUT * 1.5;
        if (staleOffline || staleOnline) toRemove.push(memberId);
      }

      if (toRemove.length > 0) {
        const updates: Record<string, null> = {};
        toRemove.forEach(id => { updates[id] = null; });
        await update(membersRef, updates);
        logger.debug(`Removed ${toRemove.length} inactive members.`);
      }

      return toRemove;
    } catch (err) {
      logger.error("Inactivity check error:", err);
      return [];
    }
  }, [db, getMembersRef]);

  const resetMemberState = React.useCallback(() => {
    cleanupMembersListener();
    setCurrentUser(null);
    currentRoomCode.current = null;
  }, [cleanupMembersListener]);

  return {
    members,
    currentUser,
    currentUserRef,
    currentRoomCode,
    setCurrentUser,
    getMembersRef,
    getUserRef,
    cleanupMembersListener,
    addMember,
    removeMember,
    attachMembersListener,
    runInactivityCheck,
    resetMemberState,
  };
}
