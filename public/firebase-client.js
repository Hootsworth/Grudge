// public/firebase-client.js
// Client-side Firebase Firestore SDK connector for project teapot-201d2

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDfQ0b_u83v-lJHLKblGbqKu2FHQStAlFM",
  authDomain: "teapot-201d2.firebaseapp.com",
  projectId: "teapot-201d2",
  storageBucket: "teapot-201d2.firebasestorage.app",
  messagingSenderId: "253026251060",
  appId: "1:253026251060:web:a0c1e7afd7cd43ab7f7561",
  measurementId: "G-Z5QL9E65DN"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };

export function normalizeItemKey(key) {
  return key
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function getItemDocId(gameId, normalizedKey) {
  let hash = 0;
  for (let i = 0; i < normalizedKey.length; i++) {
    hash = (hash << 5) - hash + normalizedKey.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  const shortSnippet = normalizedKey.slice(0, 24);
  return `${gameId}_${shortSnippet}_${hex}`;
}

export async function checkItemReuse(gameId, rawKey, minDays = 365) {
  const norm = normalizeItemKey(rawKey);
  const docId = getItemDocId(gameId, norm);

  try {
    const itemRef = doc(db, "used_items", docId);
    const snap = await getDoc(itemRef);

    if (!snap.exists()) {
      return { canUse: true, isNew: true };
    }

    const data = snap.data();
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
        reason: `Item for [${gameId}] was already used on ${data.lastUsedDate} (${Math.floor(daysSince)} days ago). 365-day cooldown requires ${daysRemaining} more days before reuse.`
      };
    }

    return {
      canUse: true,
      isNew: false,
      lastUsedDate: data.lastUsedDate,
      daysSinceUsed: Math.floor(daysSince)
    };
  } catch (err) {
    console.warn("[Firebase] checkItemReuse error:", err);
    return { canUse: true, isNew: true, warning: err.message };
  }
}

export async function recordItemUsage(gameId, rawKey, puzzleDate, metadata = {}, minDays = 365) {
  const norm = normalizeItemKey(rawKey);
  const docId = getItemDocId(gameId, norm);
  const now = Date.now();
  const expiresAt = now + minDays * 86400 * 1000;

  try {
    const itemRef = doc(db, "used_items", docId);
    const snap = await getDoc(itemRef);
    const useCount = snap.exists() ? (snap.data().useCount || 0) + 1 : 1;

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
        metadata
      },
      { merge: true }
    );
    return { success: true, docId };
  } catch (err) {
    console.warn("[Firebase] recordItemUsage error:", err);
    return { success: false, error: err.message };
  }
}

export async function getActiveCooldownItems(gameId = null) {
  try {
    const colRef = collection(db, "used_items");
    const q = gameId ? query(colRef, where("gameId", "==", gameId)) : query(colRef);
    const snap = await getDocs(q);
    const items = [];
    const now = Date.now();
    snap.forEach((d) => {
      const data = d.data();
      items.push({
        id: d.id,
        ...data,
        isExpired: data.expiresAt <= now,
        daysRemaining: Math.max(0, Math.ceil((data.expiresAt - now) / (86400 * 1000)))
      });
    });
    return items.sort((a, b) => (b.lastUsedTimestamp || 0) - (a.lastUsedTimestamp || 0));
  } catch (err) {
    console.warn("[Firebase] getActiveCooldownItems error:", err);
    return [];
  }
}

export async function storeDailyPuzzle(gameId, puzzleDate, plate, payload) {
  const docId = `${gameId}_${puzzleDate}`;
  try {
    const puzzleRef = doc(db, "daily_puzzles", docId);
    await setDoc(puzzleRef, {
      gameId,
      puzzleDate,
      plate,
      payload,
      storedAt: Date.now()
    });
    return { success: true, docId };
  } catch (err) {
    console.warn("[Firebase] storeDailyPuzzle error:", err);
    return { success: false, error: err.message };
  }
}

export async function getDailyPuzzlesList(gameId = null) {
  try {
    const colRef = collection(db, "daily_puzzles");
    const q = gameId ? query(colRef, where("gameId", "==", gameId)) : query(colRef);
    const snap = await getDocs(q);
    const puzzles = [];
    snap.forEach((d) => {
      puzzles.push({ id: d.id, ...d.data() });
    });
    return puzzles.sort((a, b) => String(b.puzzleDate).localeCompare(String(a.puzzleDate)));
  } catch (err) {
    console.warn("[Firebase] getDailyPuzzlesList error:", err);
    return [];
  }
}
