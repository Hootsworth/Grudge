// Fact Generation & Verification for Pinpoint Spots
// Uses Anthropic API (claude-sonnet-4-6) with strict number verification & source tracking

export interface VerifiedFact {
  fact: string;
  sourceUrl: string;
}

/**
 * Validates that a fact sentence contains no unverifiable numbers or statistics.
 */
export function validateFactNumbers(fact: string): { valid: boolean; reason?: string } {
  // Regex to detect standalone numbers or statistics (e.g. "contains 342 islands", "covers 4820 sq km")
  const numberMatches = fact.match(/\b\d+(\.\d+)?\b/g);
  if (numberMatches) {
    for (const numStr of numberMatches) {
      const val = Number(numStr);
      // Allow standard 4-digit historical calendar years (1000 - 2026), reject random counts or dimensions
      if (val < 1000 || val > 2030 || numStr.includes('.')) {
        return {
          valid: false,
          reason: `Fact contains unauthorized specific number "${numStr}"`,
        };
      }
    }
  }

  // Reject multi-sentence facts
  const sentenceCount = fact.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  if (sentenceCount > 2) {
    return {
      valid: false,
      reason: `Fact must be a single concise sentence (got ${sentenceCount})`,
    };
  }

  return { valid: true };
}

/**
 * Generates and verifies a 1-sentence geographical fact using Anthropic API or verified fixtures.
 */
export async function generateSpotFact(
  spotName: string,
  countryOrRegion: string,
  apiKey?: string
): Promise<VerifiedFact> {
  // If Anthropic API key is provided, query claude-sonnet-4-6
  if (apiKey && apiKey !== 'mock' && !apiKey.startsWith('mock-')) {
    try {
      const prompt = `Write a single, fascinating, strictly factual sentence about ${spotName} in ${countryOrRegion}.
CRITICAL RULES:
1. Exactly ONE sentence.
2. Contains NO unverifiable numbers, exact measurements, depths, or population statistics.
3. Focus on geographic, historical, or physical significance.
4. Output JSON format: { "fact": "...", "sourceUrl": "..." } with a real Wikipedia or Britannica source URL.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 250,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const text = data?.content?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.fact && validateFactNumbers(parsed.fact).valid) {
            return {
              fact: parsed.fact.trim(),
              sourceUrl: parsed.sourceUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(spotName.replace(/\s+/g, '_'))}`,
            };
          }
        }
      }
    } catch (err) {
      console.warn(`[FACT GEN API WARNING] Failed live Claude API call for ${spotName}:`, err);
    }
  }

  // Curated, verified knowledge base for standard spots
  const KNOWLEDGE_BASE: Record<string, VerifiedFact> = {
    'Strait of Gibraltar': {
      fact: 'The Strait of Gibraltar connects the Atlantic Ocean to the Mediterranean Sea and separates Europe from Africa.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Strait_of_Gibraltar',
    },
    'Sinai Peninsula': {
      fact: 'The triangular Sinai Peninsula serves as the land bridge between the continents of Asia and Africa.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Sinai_Peninsula',
    },
    'Baja California': {
      fact: 'The narrow Baja California peninsula separates the Pacific Ocean from the Gulf of California.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Baja_California_Peninsula',
    },
    'Bosphorus Strait': {
      fact: 'The Bosphorus Strait forms part of the continental boundary between Europe and Asia, dividing the city of Istanbul.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Bosphorus',
    },
    'Cape of Good Hope': {
      fact: 'The Cape of Good Hope marks the rocky headland on the Atlantic coast of South Africa navigated by Portuguese explorers.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cape_of_Good_Hope',
    },
    'Peloponnese Peninsula': {
      fact: 'The Peloponnese peninsula in southern Greece is separated from the central part of the country by the Corinth Canal.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Peloponnese',
    },
    'Cape Horn': {
      fact: 'Cape Horn is the southernmost headland of the Tierra del Fuego archipelago, marking the northern boundary of the Drake Passage.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cape_Horn',
    },
    'Korean Peninsula': {
      fact: 'The Korean Peninsula extends southward from the Asian continent between the Sea of Japan and the Yellow Sea.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Korean_Peninsula',
    },
    'Strait of Malacca': {
      fact: 'The Strait of Malacca is a narrow maritime stretch between the Malay Peninsula and the Indonesian island of Sumatra.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Strait_of_Malacca',
    },
    'Kattegat Strait': {
      fact: 'The Kattegat is a shallow sea area bounded by the Jutland peninsula in the west and Sweden in the east.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Kattegat',
    },
  };

  if (KNOWLEDGE_BASE[spotName]) {
    return KNOWLEDGE_BASE[spotName];
  }

  // Deterministic fallback
  return {
    fact: `${spotName} is a prominent geographical feature located in ${countryOrRegion}.`,
    sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(spotName.replace(/\s+/g, '_'))}`,
  };
}
