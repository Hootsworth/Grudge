// Spread validation rules for daily 5 Ballpark questions
// Rules:
// 1. Span the scale: each day's 5 answers must cover at least 4 distinct orders of magnitude.
// 2. At least one answer under 10^4 (value < 10,000 or valueLog10 < 4.0).
// 3. At least one answer above 10^15 (value > 1e15 or valueLog10 > 15.0).
// 4. Mix categories: biology, astronomy, history, technology, everyday life, food, geography (at least 4 distinct categories).
// 5. Never reuse a quantity within 120 days.

export interface QuestionSpreadItem {
  id?: string;
  question: string;
  value: number;
  valueLog10: number;
  category: string;
}

export interface HistoryItem {
  question: string;
  date: string;
}

export interface SpreadCheckResult {
  valid: boolean;
  distinctOrdersCount: number;
  hasUnder10k: boolean;
  hasAbove1e15: boolean;
  distinctCategoriesCount: number;
  errors: string[];
}

/**
 * Validates that a set of 5 questions satisfies all Ballpark scale and diversity rules.
 */
export function validateQuestionSpread(
  questions: QuestionSpreadItem[],
  recentHistory: HistoryItem[] = [],
  currentDateStr = ''
): SpreadCheckResult {
  const errors: string[] = [];

  if (!questions || questions.length !== 5) {
    errors.push(`Expected exactly 5 questions, received ${questions?.length || 0}.`);
    return {
      valid: false,
      distinctOrdersCount: 0,
      hasUnder10k: false,
      hasAbove1e15: false,
      distinctCategoriesCount: 0,
      errors,
    };
  }

  // 1. Distinct orders of magnitude (floor of log10)
  const orders = new Set<number>();
  let hasUnder10k = false;
  let hasAbove1e15 = false;

  for (const q of questions) {
    const log10 = q.valueLog10 || Math.log10(q.value);
    const order = Math.floor(log10);
    orders.add(order);

    if (q.value < 1e4 || log10 < 4.0) {
      hasUnder10k = true;
    }
    if (q.value > 1e15 || log10 > 15.0) {
      hasAbove1e15 = true;
    }
  }

  if (orders.size < 4) {
    errors.push(`Answers cover only ${orders.size} distinct orders of magnitude (must cover at least 4 distinct orders).`);
  }

  if (!hasUnder10k) {
    errors.push('Set must contain at least one answer under 10^4 (< 10,000).');
  }

  if (!hasAbove1e15) {
    errors.push('Set must contain at least one answer above 10^15 (> 1,000,000,000,000,000).');
  }

  // 2. Mix categories: at least 4 distinct categories among 5 questions
  const categories = new Set(questions.map((q) => q.category.toLowerCase().trim()));
  if (categories.size < 4) {
    errors.push(`Categories cover only ${categories.size} distinct categories (must cover at least 4 categories).`);
  }

  // 3. No reuse within 120 days
  if (recentHistory.length > 0 && currentDateStr) {
    const curTime = new Date(currentDateStr).getTime();
    for (const q of questions) {
      const match = recentHistory.find(
        (h) => h.question.toLowerCase().trim() === q.question.toLowerCase().trim()
      );
      if (match) {
        const hTime = new Date(match.date).getTime();
        const diffDays = Math.abs(curTime - hTime) / (864e5);
        if (diffDays < 120) {
          errors.push(`Question "${q.question}" was used on ${match.date} (${diffDays.toFixed(0)} days ago, < 120 days minimum no-reuse window).`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    distinctOrdersCount: orders.size,
    hasUnder10k,
    hasAbove1e15,
    distinctCategoriesCount: categories.size,
    errors,
  };
}
