// Proper Greedy Map Coloring (Welsh-Powell / Greedy 6-Coloring)
import type { CountryFeature } from './data.ts';

export type ColorClass = 'c0' | 'c1' | 'c2' | 'c3' | 'c4' | 'c5';

export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function computeFeatureBBox(feature: CountryFeature): BoundingBox2D {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const traverse = (coords: any[]) => {
    if (typeof coords[0] === 'number') {
      const [x, y] = coords;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    } else {
      for (const sub of coords) traverse(sub);
    }
  };

  traverse(feature.geometry.coordinates);
  return { minX, maxX, minY, maxY };
}

function bboxesOverlap(a: BoundingBox2D, b: BoundingBox2D, margin: number = 0.05): boolean {
  return !(
    a.maxX + margin < b.minX ||
    a.minX - margin > b.maxX ||
    a.maxY + margin < b.minY ||
    a.minY - margin > b.maxY
  );
}

/**
 * Checks if two polygons share an edge or come within epsilon distance.
 */
function areCountriesAdjacent(featA: CountryFeature, featB: CountryFeature): boolean {
  const boxA = computeFeatureBBox(featA);
  const boxB = computeFeatureBBox(featB);

  // Fast bounding box rejection
  if (!bboxesOverlap(boxA, boxB, 0.08)) return false;

  // Extract vertices
  const extractVertices = (coords: any[]): Array<[number, number]> => {
    const pts: Array<[number, number]> = [];
    const walk = (c: any[]) => {
      if (typeof c[0] === 'number') {
        pts.push([c[0], c[1]]);
      } else {
        for (const sub of c) walk(sub);
      }
    };
    walk(coords);
    return pts;
  };

  const ptsA = extractVertices(featA.geometry.coordinates);
  const ptsB = extractVertices(featB.geometry.coordinates);

  const EPSILON_SQ = 0.05 * 0.05; // ~5 km proximity threshold

  // Sample check points
  const stepA = Math.max(1, Math.floor(ptsA.length / 80));
  const stepB = Math.max(1, Math.floor(ptsB.length / 80));

  for (let i = 0; i < ptsA.length; i += stepA) {
    const [ax, ay] = ptsA[i];
    for (let j = 0; j < ptsB.length; j += stepB) {
      const [bx, by] = ptsB[j];
      const dx = ax - bx;
      const dy = ay - by;
      if (dx * dx + dy * dy < EPSILON_SQ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Builds an undirected adjacency graph between country features.
 */
export function buildAdjacencyGraph(
  countries: CountryFeature[]
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const c of countries) {
    const id = String(c.id);
    if (!graph.has(id)) graph.set(id, new Set());
  }

  for (let i = 0; i < countries.length; i++) {
    const a = countries[i];
    const idA = String(a.id);

    for (let j = i + 1; j < countries.length; j++) {
      const b = countries[j];
      const idB = String(b.id);

      if (areCountriesAdjacent(a, b)) {
        graph.get(idA)!.add(idB);
        graph.get(idB)!.add(idA);
      }
    }
  }

  return graph;
}

/**
 * Greedy 6-Coloring algorithm using degree-ordered Welsh-Powell heuristics.
 * Returns a mapping from country ID to class 'c0'..'c5'.
 */
export function assignProperMapColors(
  countries: CountryFeature[],
  adjacencyGraph?: Map<string, Set<string>>
): Map<string, ColorClass> {
  const graph = adjacencyGraph || buildAdjacencyGraph(countries);
  const colorClasses: ColorClass[] = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'];

  // Sort nodes in descending order of degree (most connected first)
  const nodes = countries.map((c) => String(c.id));
  nodes.sort((a, b) => (graph.get(b)?.size || 0) - (graph.get(a)?.size || 0));

  const assignedColors = new Map<string, ColorClass>();

  for (const node of nodes) {
    const neighbors = graph.get(node) || new Set();
    const usedColors = new Set<ColorClass>();

    for (const neighbor of neighbors) {
      if (assignedColors.has(neighbor)) {
        usedColors.add(assignedColors.get(neighbor)!);
      }
    }

    // Pick first available color not used by any neighbor
    let chosenColor: ColorClass = 'c0';
    for (const c of colorClasses) {
      if (!usedColors.has(c)) {
        chosenColor = c;
        break;
      }
    }

    assignedColors.set(node, chosenColor);
  }

  return assignedColors;
}
