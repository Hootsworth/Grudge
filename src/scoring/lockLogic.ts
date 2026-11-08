import type { PuzzleEvent, EventReveal } from '../types.ts';
import { formatEventYear } from '../db.ts';

export interface LockEvaluationResult {
  isValid: boolean;
  error?: string;
  statusCode?: number;
  correctBools: boolean[];
  newLockedIds: string[];
  isSolved: boolean;
  reveal?: EventReveal[];
}

/**
 * Pure function evaluating a player's submitted order against true chronological order.
 * Enforces:
 * - Exactly 6 items
 * - All valid event IDs
 * - No previously locked event moved from its locked slot
 * - Calculates correctness array
 * - Accumulates locked events
 */
export function evaluateGuess(
  submittedOrder: string[],
  puzzleEventsSorted: PuzzleEvent[], // sorted newest (index 0) to oldest (index 5)
  previouslyLockedIds: string[],
  previousLockedPositions?: Map<string, number>
): LockEvaluationResult {
  if (!Array.isArray(submittedOrder) || submittedOrder.length !== 6) {
    return {
      isValid: false,
      error: 'Order must contain exactly 6 event IDs.',
      statusCode: 400,
      correctBools: [],
      newLockedIds: previouslyLockedIds,
      isSolved: false,
    };
  }

  const validIds = new Set(puzzleEventsSorted.map((e) => e.id));
  const submittedSet = new Set(submittedOrder);

  if (submittedSet.size !== 6) {
    return {
      isValid: false,
      error: 'Order cannot contain duplicate event IDs.',
      statusCode: 400,
      correctBools: [],
      newLockedIds: previouslyLockedIds,
      isSolved: false,
    };
  }

  for (const id of submittedOrder) {
    if (!validIds.has(id)) {
      return {
        isValid: false,
        error: `Unknown event ID in order: ${id}`,
        statusCode: 400,
        correctBools: [],
        newLockedIds: previouslyLockedIds,
        isSolved: false,
      };
    }
  }

  // Determine the correct position of each event in the true order
  const trueOrderMap = new Map<string, number>();
  puzzleEventsSorted.forEach((event, idx) => {
    trueOrderMap.set(event.id, idx);
  });

  // Verify that any already-locked events have NOT changed position
  for (const lockedId of previouslyLockedIds) {
    const requiredPos = previousLockedPositions
      ? previousLockedPositions.get(lockedId)
      : trueOrderMap.get(lockedId);

    if (requiredPos !== undefined) {
      const actualPos = submittedOrder.indexOf(lockedId);
      if (actualPos !== requiredPos) {
        return {
          isValid: false,
          error: `Locked event '${lockedId}' at position ${requiredPos + 1} was moved to position ${actualPos + 1}. Locked events cannot be moved.`,
          statusCode: 400,
          correctBools: [],
          newLockedIds: previouslyLockedIds,
          isSolved: false,
        };
      }
    }
  }

  // Calculate correct booleans for this attempt
  const correctBools: boolean[] = [];
  const newlyLockedSet = new Set<string>(previouslyLockedIds);

  for (let i = 0; i < 6; i++) {
    const currentId = submittedOrder[i];
    const trueIdAtSlot = puzzleEventsSorted[i].id;
    const isCorrect = currentId === trueIdAtSlot;
    correctBools.push(isCorrect);
    if (isCorrect) {
      newlyLockedSet.add(currentId);
    }
  }

  const isSolved = correctBools.every(Boolean);

  return {
    isValid: true,
    correctBools,
    newLockedIds: Array.from(newlyLockedSet),
    isSolved,
  };
}

export function buildEventReveal(puzzleEventsSorted: PuzzleEvent[]): EventReveal[] {
  return puzzleEventsSorted.map((e) => ({
    id: e.id,
    year: e.year,
    display: formatEventYear(e.year, e.precision),
    source: e.source,
  }));
}
