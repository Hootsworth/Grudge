// Natural Earth 50m data loader and geometry processing
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const topojson = require('topojson-client');
const countriesTopo = require('world-atlas/countries-50m.json');
const landTopo = require('world-atlas/land-50m.json');

export interface CountryFeature {
  id: string | number;
  name: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: Record<string, any>;
}

export interface WorldData {
  countries: CountryFeature[];
  land: {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  };
}

let cachedWorldData: WorldData | null = null;

export function loadWorldData(): WorldData {
  if (cachedWorldData) {
    return cachedWorldData;
  }

  // 1. Extract countries features
  const countriesGeo = topojson.feature(countriesTopo, countriesTopo.objects.countries) as {
    type: 'FeatureCollection';
    features: CountryFeature[];
  };

  // 2. Filter out Antarctica (ID 010, or polygons entirely below -60 deg latitude)
  const filteredCountries = countriesGeo.features.filter((f) => {
    if (f.id === '010' || f.id === 10) return false;

    // Check latitude bounds
    let maxLat = -90;
    const checkCoords = (rings: any[]) => {
      for (const ring of rings) {
        if (Array.isArray(ring[0])) {
          checkCoords(ring);
        } else {
          const lat = ring[1];
          if (lat > maxLat) maxLat = lat;
        }
      }
    };
    checkCoords(f.geometry.coordinates);
    return maxLat > -60;
  });

  // 3. Extract land geometry
  const landGeo = topojson.feature(landTopo, landTopo.objects.land) as {
    type: 'Feature';
    geometry: { type: 'MultiPolygon'; coordinates: number[][][][] };
  };

  cachedWorldData = {
    countries: filteredCountries,
    land: landGeo.geometry,
  };

  return cachedWorldData;
}

/**
 * Fast ray-casting point-in-polygon check for longitude & latitude.
 */
export function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if a [lon, lat] point is on land.
 */
export function isPointOnLand(lon: number, lat: number, world: WorldData): boolean {
  for (const poly of world.land.coordinates) {
    if (poly.length === 0) continue;
    // Exterior ring
    if (isPointInPolygon([lon, lat], poly[0])) {
      // Check interior holes
      let inHole = false;
      for (let h = 1; h < poly.length; h++) {
        if (isPointInPolygon([lon, lat], poly[h])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}
