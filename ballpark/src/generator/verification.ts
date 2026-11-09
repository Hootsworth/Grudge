// Verification logic for Ballpark candidate questions
// Rules:
// 1. Reject any where the two independent sources differ by more than 25% (a factor > 1.25).
// 2. Reject any where the extracted value differs from proposed value by more than 10% (a factor > 1.10).

export interface VerificationCheckResult {
  valid: boolean;
  sourceRatio: number;
  extractionRatio: number;
  errors: string[];
}

/**
 * Checks if two source values are within 25% (ratio <= 1.25).
 */
export function verifySourceConsistency(sourceAVal: number, sourceBVal: number): { valid: boolean; ratio: number } {
  if (!sourceAVal || !sourceBVal || sourceAVal <= 0 || sourceBVal <= 0) {
    return { valid: false, ratio: Infinity };
  }
  const ratio = Math.max(sourceAVal, sourceBVal) / Math.min(sourceAVal, sourceBVal);
  return {
    valid: ratio <= 1.25,
    ratio: Math.round(ratio * 1000) / 1000,
  };
}

/**
 * Checks if the secondary extracted value matches proposed value within 10% (ratio <= 1.10).
 */
export function verifyExtractedAccuracy(proposedVal: number, extractedVal: number): { valid: boolean; ratio: number } {
  if (!proposedVal || !extractedVal || proposedVal <= 0 || extractedVal <= 0) {
    return { valid: false, ratio: Infinity };
  }
  const ratio = Math.max(proposedVal, extractedVal) / Math.min(proposedVal, extractedVal);
  return {
    valid: ratio <= 1.10,
    ratio: Math.round(ratio * 1000) / 1000,
  };
}

/**
 * Full candidate verification check
 */
export function verifyCandidate(candidate: {
  question: string;
  value: number;
  sourceAValue?: number;
  sourceBValue?: number;
  extractedValue?: number;
  sources: string[];
}): VerificationCheckResult {
  const errors: string[] = [];

  if (!candidate.sources || candidate.sources.length < 2) {
    errors.push('Candidate must cite at least two independent sources.');
  }

  let sourceRatio = 1.0;
  if (candidate.sourceAValue !== undefined && candidate.sourceBValue !== undefined) {
    const sCheck = verifySourceConsistency(candidate.sourceAValue, candidate.sourceBValue);
    sourceRatio = sCheck.ratio;
    if (!sCheck.valid) {
      errors.push(`Sources differ by ${((sourceRatio - 1) * 100).toFixed(1)}% (factor ${sourceRatio.toFixed(3)} > 1.25 max).`);
    }
  }

  let extractionRatio = 1.0;
  if (candidate.extractedValue !== undefined) {
    const eCheck = verifyExtractedAccuracy(candidate.value, candidate.extractedValue);
    extractionRatio = eCheck.ratio;
    if (!eCheck.valid) {
      errors.push(`Extracted value differs from proposed value by ${((extractionRatio - 1) * 100).toFixed(1)}% (factor ${extractionRatio.toFixed(3)} > 1.10 max).`);
    }
  }

  return {
    valid: errors.length === 0,
    sourceRatio,
    extractionRatio,
    errors,
  };
}
