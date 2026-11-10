// src/firebase/usedRegistry.ts

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  type Firestore,
} from 'firebase/firestore';
import { getDb } from './config.ts';

export interface UsedItemRecord {
  gameId: string;
  itemKey: string;
  normalizedKey: string;
  lastUsedDate: string;
  lastUsedTimestamp: number;
  expiresAt: number;
  useCount: number;
  history: Array<{ date: string; timestamp: number }>;
  metadata?: Record<string, any>;
}

export interface ReuseCheckResult {
  canUse: boolean;
  isNew?: boolean;
  lastUsedDate?: string;
  daysSinceUsed?: number;
  daysRemaining?: number;
  reason?: string;
}

/**
 * Normalizes text so minor punctuation, whitespace, and case differences
 * cannot bypass the 365-day non-repetition rule.
 */
export function normalizeItemKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Generates a deterministic document ID for fast O(1) Firestore lookups.
 */
export function getItemDocId(gameId: string, normalizedKey: string): string {
  let hash = 0;
  for (let i = 0; i < normalizedKey.length; i++) {
    hash = (hash << 5) - hash + normalizedKey.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const shortSnippet = normalizedKey.slice(0, 24);
  return `${gameId}_${shortSnippet}_${hex}`;
}

/**
 * Checks if an item has been used within the specified cooldown period (default: 365 days).
 * Returns canUse: false if the item was used less than minDays ago.
 */
export async function checkItemReuse(
  gameId: string,
  rawKey: string,
  minDays: number = 365,
  dbInstance?: Firestore
): Promise<ReuseCheckResult> {
  const norm = normalizeItemKey(rawKey);
  const docId = getItemDocId(gameId, norm);
  const db = dbInstance || getDb();

  try {
    const itemRef = doc(db, 'used_items', docId);
    const snap = await getDoc(itemRef);

    if (!snap.exists()) {
      return { canUse: true, isNew: true };
    }

    const data = snap.data() as UsedItemRecord;
    const now = Date.now();
    const daysSince = (now - data.lastUsedTimestamp) / (86400 * 1000);

    if (daysSince < minDays) {
      const daysRemaining = Math.max(1, Math.ceil(minDays - daysSince));
      return {
        canUse: false,
        isNew: false,
        lastUsedDate: data.lastUsedDate,
        daysSinceUsed: Math.floor(daysSince),
        daysRemaining,
        reason: `Item for [${gameId}] was already used on ${data.lastUsedDate} (${Math.floor(daysSince)} days ago). 365-day cooldown requires ${daysRemaining} more days before reuse.`,
      };
    }

    return {
      canUse: true,
      isNew: false,
      lastUsedDate: data.lastUsedDate,
      daysSinceUsed: Math.floor(daysSince),
    };
  } catch (err: any) {
    // If offline or network issue, fail safely with warning
    console.warn(`[Firebase] checkItemReuse warning: ${err?.message}`);
    return { canUse: true, isNew: true };
  }
}

/**
 * Records an item's usage into Firestore with a 365-day expiration timestamp.
 */
export async function recordItemUsage(
  gameId: string,
  rawKey: string,
  puzzleDate: string,
  metadata?: Record<string, any>,
  minDays: number = 365,
  dbInstance?: Firestore
): Promise<void> {
  const norm = normalizeItemKey(rawKey);
  const docId = getItemDocId(gameId, norm);
  const db = dbInstance || getDb();
  const now = Date.now();
  const expiresAt = now + minDays * 86400 * 1000;

  try {
    const itemRef = doc(db, 'used_items', docId);
    const existingSnap = await getDoc(itemRef);
    const useCount = existingSnap.exists() ? (existingSnap.data().useCount || 0) + 1 : 1;

    await setDoc(
      itemRef,
      {
        gameId,
        itemKey: rawKey,
        normalizedKey: norm,
        lastUsedDate: puzzleDate,
        lastUsedTimestamp: now,
        expiresAt,
        useCount,
        history: arrayUnion({ date: puzzleDate, timestamp: now }),
        metadata: metadata || {},
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn(`[Firebase] recordItemUsage warning: ${err?.message}`);
  }
}

/**
 * Filters a list of candidate items and keeps ONLY items that have NOT been used in the last 365 days.
 */
export async function filterFreshItems<T>(
  gameId: string,
  candidates: T[],
  getKey: (item: T) => string,
  minDays: number = 365,
  dbInstance?: Firestore
): Promise<{ fresh: T[]; rejected: Array<{ item: T; reason: string }> }> {
  const fresh: T[] = [];
  const rejected: Array<{ item: T; reason: string }> = [];

  for (const item of candidates) {
    const key = getKey(item);
    const check = await checkItemReuse(gameId, key, minDays, dbInstance);
    if (check.canUse) {
      fresh.push(item);
    } else {
      rejected.push({ item, reason: check.reason || 'Used within 365 days' });
    }
  }

  return { fresh, rejected };
}

/**
 * Stores a daily puzzle payload in Firestore under daily_puzzles/{gameId}_{date}.
 */
export async function storeDailyPuzzle(
  gameId: string,
  puzzleDate: string,
  plate: number,
  payload: any,
  dbInstance?: Firestore
): Promise<void> {
  const db = dbInstance || getDb();
  const docId = `${gameId}_${puzzleDate}`;

  try {
    const puzzleRef = doc(db, 'daily_puzzles', docId);
    await setDoc(puzzleRef, {
      gameId,
      puzzleDate,
      plate,
      payload,
      storedAt: Date.now(),
    });
  } catch (err: any) {
    console.warn(`[Firebase] storeDailyPuzzle warning: ${err?.message}`);
  }
}

/**
 * Retrieves a daily puzzle payload from Firestore.
 */
export async function getDailyPuzzle(
  gameId: string,
  puzzleDate: string,
  dbInstance?: Firestore
): Promise<any | null> {
  const db = dbInstance || getDb();
  const docId = `${gameId}_${puzzleDate}`;

  try {
    const puzzleRef = doc(db, 'daily_puzzles', docId);
    const snap = await getDoc(puzzleRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err: any) {
    console.warn(`[Firebase] getDailyPuzzle warning: ${err?.message}`);
  }
  return null;
}

/**
 * Retrieves all items currently on 365-day cooldown for a given game (or across all games).
 */
export async function getActiveCooldownItems(
  gameId?: string,
  dbInstance?: Firestore
): Promise<UsedItemRecord[]> {
  const db = dbInstance || getDb();
  try {
    const usedCol = collection(db, 'used_items');
    const q = gameId
      ? query(usedCol, where('gameId', '==', gameId))
      : query(usedCol);
    const snap = await getDocs(q);

    const now = Date.now();
    const items: UsedItemRecord[] = [];
    snap.forEach((d) => {
      const data = d.data() as UsedItemRecord;
      if (data.expiresAt > now) {
        items.push(data);
      }
    });

    return items;
  } catch (err: any) {
    console.warn(`[Firebase] getActiveCooldownItems warning: ${err?.message}`);
    return [];
  }
}
