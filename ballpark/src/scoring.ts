// Scoring formula and rank titles for Ballpark

/**
 * Calculates how many orders of magnitude the player's exponent guess is off.
 */
export function calculateErrorOrders(exponent: number, truthLog10: number): number {
  return Math.abs(exponent - truthLog10);
}

/**
 * Computes points awarded based on error in orders of magnitude:
 * points = round(1000 * max(0, 1 - errorOrders / 2.5))
 */
export function calculatePoints(errorOrders: number): number {
  const raw = 1000 * Math.max(0, 1 - errorOrders / 2.5);
  return Math.round(raw);
}

/**
 * Maps cumulative total error in orders across all 5 questions to rank title.
 * Thresholds:
 * - under 0.5: Human calculator
 * - under 1.5: Fermi's apprentice
 * - under 3.0: Napkin mathematician
 * - under 6.0: Vibes-based estimator
 * - otherwise: "Order of magnitude? Never heard of her."
 */
export function getRankTitle(totalErrorOrders: number): string {
  if (totalErrorOrders < 0.5) return 'Human calculator';
  if (totalErrorOrders < 1.5) return "Fermi's apprentice";
  if (totalErrorOrders < 3.0) return 'Napkin mathematician';
  if (totalErrorOrders < 6.0) return 'Vibes-based estimator';
  return 'Order of magnitude? Never heard of her.';
}
