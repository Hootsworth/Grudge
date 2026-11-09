// Pre-Rendering Mystery Window SVGs in Local Window Coordinates
import type { WindowRendering, WindowShape } from '../worker/types.ts';
import type { CountryFeature, WorldData } from './data.ts';
import type { ColorClass } from './coloring.ts';
import { project, getKmPerUnit, getWindowBoundingBox, type BoundingBox } from './projection.ts';

/**
 * Sutherland-Hodgman Polygon Clipping against axis-aligned rectangle [minX, maxX] x [minY, maxY].
 */
export function clipPolygonToBox(
  ring: Array<[number, number]>,
  box: BoundingBox,
  margin: number = 4
): Array<[number, number]> {
  let output = ring;
  const x0 = box.minX - margin;
  const x1 = box.maxX + margin;
  const y0 = box.minY - margin;
  const y1 = box.maxY + margin;

  // 1. Clip Left: x >= x0
  output = clipEdge(output, (p) => p[0] >= x0, (p1, p2) => [
    x0,
    p1[1] + ((p2[1] - p1[1]) * (x0 - p1[0])) / (p2[0] - p1[0]),
  ]);
  if (output.length < 3) return [];

  // 2. Clip Right: x <= x1
  output = clipEdge(output, (p) => p[0] <= x1, (p1, p2) => [
    x1,
    p1[1] + ((p2[1] - p1[1]) * (x1 - p1[0])) / (p2[0] - p1[0]),
  ]);
  if (output.length < 3) return [];

  // 3. Clip Top: y >= y0
  output = clipEdge(output, (p) => p[1] >= y0, (p1, p2) => [
    p1[0] + ((p2[0] - p1[0]) * (y0 - p1[1])) / (p2[1] - p1[1]),
    y0,
  ]);
  if (output.length < 3) return [];

  // 4. Clip Bottom: y <= y1
  output = clipEdge(output, (p) => p[1] <= y1, (p1, p2) => [
    p1[0] + ((p2[0] - p1[0]) * (y1 - p1[1])) / (p2[1] - p1[1]),
    y1,
  ]);

  return output.length >= 3 ? output : [];
}

function clipEdge(
  points: Array<[number, number]>,
  inside: (p: [number, number]) => boolean,
  intersect: (p1: [number, number], p2: [number, number]) => [number, number]
): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  if (points.length === 0) return result;

  let s = points[points.length - 1];
  for (let i = 0; i < points.length; i++) {
    const e = points[i];
    if (inside(e)) {
      if (!inside(s)) {
        result.push(intersect(s, e));
      }
      result.push(e);
    } else if (inside(s)) {
      result.push(intersect(s, e));
    }
    s = e;
  }
  return result;
}

/**
 * Converts a polygon ring of projected points into an SVG path string in local coordinates.
 */
function ringToSvgPath(
  ring: Array<[number, number]>,
  minX: number,
  minY: number
): string {
  if (ring.length < 3) return '';

  const round = (val: number) => (Math.round(val * 10) / 10).toFixed(1);
  let d = `M${round(ring[0][0] - minX)},${round(ring[0][1] - minY)}`;
  for (let i = 1; i < ring.length; i++) {
    d += `L${round(ring[i][0] - minX)},${round(ring[i][1] - minY)}`;
  }
  d += 'Z';
  return d;
}

/**
 * Pre-renders an unlabeled mystery window at a given zoom level and aspect ratio.
 * Translates origin strictly to (0,0) and outputs clean local SVG shapes with map colors.
 */
export function renderMysteryWindow(
  lat: number,
  lon: number,
  degWidth: number, // 9, 22, or 55
  aspect: '4:3' | '16:9' | '3:4',
  world: WorldData,
  colorMap: Map<string, ColorClass>
): WindowRendering {
  const box = getWindowBoundingBox(lat, lon, degWidth, aspect);
  const shapes: WindowShape[] = [];

  for (const country of world.countries) {
    const cid = String(country.id);
    const cls = colorMap.get(cid) || 'c0';

    const processPolygon = (rings: number[][][]) => {
      let combinedPath = '';
      for (const ring of rings) {
        // Project all points to Web Mercator units
        const projectedRing: Array<[number, number]> = ring.map(([rLon, rLat]) => {
          const pt = project(rLon, rLat);
          return [pt.x, pt.y];
        });

        // Fast rejection: check if ring bounding box overlaps window
        let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
        for (const [px, py] of projectedRing) {
          if (px < rMinX) rMinX = px;
          if (px > rMaxX) rMaxX = px;
          if (py < rMinY) rMinY = py;
          if (py > rMaxY) rMaxY = py;
        }

        if (rMaxX < box.minX || rMinX > box.maxX || rMaxY < box.minY || rMinY > box.maxY) {
          continue;
        }

        // Clip ring to window bounds
        const clippedRing = clipPolygonToBox(projectedRing, box, 5);
        if (clippedRing.length >= 3) {
          const pathStr = ringToSvgPath(clippedRing, box.minX, box.minY);
          if (pathStr) {
            combinedPath += (combinedPath ? ' ' : '') + pathStr;
          }
        }
      }

      if (combinedPath) {
        shapes.push({ d: combinedPath, cls });
      }
    };

    if (country.geometry.type === 'Polygon') {
      processPolygon(country.geometry.coordinates as number[][][]);
    } else if (country.geometry.type === 'MultiPolygon') {
      for (const poly of country.geometry.coordinates as number[][][][]) {
        processPolygon(poly);
      }
    }
  }

  const roundDim = (val: number) => (Math.round(val * 10) / 10).toFixed(1);
  const viewBox = `0 0 ${roundDim(box.width)} ${roundDim(box.height)}`;
  const kmPerUnit = getKmPerUnit(lat);

  const result: WindowRendering = {
    viewBox,
    kmPerUnit,
    shapes,
  };

  // Verify size limit under 120 KB
  const jsonSize = Buffer.byteLength(JSON.stringify(result), 'utf-8');
  if (jsonSize > 120 * 1024) {
    // Simplify/prune tiny micro-polygons if needed
    result.shapes = result.shapes.filter((s) => s.d.length > 50);
  }

  return result;
}
