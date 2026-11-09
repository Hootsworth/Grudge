// Fermi check: back-of-envelope derivation verification
// Rule: Flag or reject any candidate where the sourced value disagrees with the derivation by more than a factor of 3.

export interface FermiCheckResult {
  valid: boolean;
  factor: number;
  message?: string;
}

/**
 * Checks if the sourced value matches the back-of-envelope Fermi derivation within a factor of 3.
 */
export function checkFermiDerivation(
  sourcedValue: number,
  fermiEstimate: number
): FermiCheckResult {
  if (!sourcedValue || !fermiEstimate || sourcedValue <= 0 || fermiEstimate <= 0) {
    return {
      valid: false,
      factor: Infinity,
      message: 'Invalid numbers provided for Fermi check.',
    };
  }

  const factor = Math.max(sourcedValue, fermiEstimate) / Math.min(sourcedValue, fermiEstimate);
  const roundedFactor = Math.round(factor * 100) / 100;

  if (factor > 3.0) {
    return {
      valid: false,
      factor: roundedFactor,
      message: `Fermi estimate (${fermiEstimate.toExponential(2)}) disagrees with sourced value (${sourcedValue.toExponential(2)}) by a factor of ${roundedFactor} (> 3.0 max factor).`,
    };
  }

  return {
    valid: true,
    factor: roundedFactor,
  };
}
