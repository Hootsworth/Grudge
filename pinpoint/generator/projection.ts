// Web Mercator Projection for Pinpoint matching exact specification
// unit x = (lon + 180) * 10
// unit y = 1525 - 572.9578 * ln(tan(pi/4 + lat/2))

export const MERCATOR_CY = 1525.0;
export const MERCATOR_K = 572.9578;
export const UNITS_PER_DEG_LON = 10.0;

export interface ProjectedPoint {
  x: number;
  y: number;
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Projects (lon, lat) to local Web Mercator units.
 */
export function project(lon: number, lat: number): ProjectedPoint {
  // Clamp latitude to avoid infinities near poles (-85 to 85)
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const latRad = (clampedLat * Math.PI) / 180;

  const x = (lon + 180) * UNITS_PER_DEG_LON;
  const y = MERCATOR_CY - MERCATOR_K * Math.log(Math.tan(Math.PI / 4 + latRad / 2));

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

/**
 * Inverts projected (x, y) back to (lon, lat).
 */
export function unproject(x: number, y: number): GeoPoint {
  const lon = x / UNITS_PER_DEG_LON - 180;
  const latRad = 2 * Math.atan(Math.exp((MERCATOR_CY - y) / MERCATOR_K)) - Math.PI / 2;
  const lat = (latRad * 180) / Math.PI;

  return {
    lat: Math.round(lat * 1000) / 1000,
    lon: Math.round(lon * 1000) / 1000,
  };
}

/**
 * Computes km-per-unit scale at given latitude in Web Mercator.
 * At equator: 1 degree lon ~ 111.3195 km -> 10 units = 111.3195 km -> 11.132 km/unit.
 * At latitude phi: 111.3195 * cos(phi) / 10.
 */
export function getKmPerUnit(lat: number): number {
  const latRad = (Math.abs(lat) * Math.PI) / 180;
  const kmPerDeg = 111.3195 * Math.cos(latRad);
  const kmPerUnit = kmPerDeg / UNITS_PER_DEG_LON;
  return Math.round(kmPerUnit * 100) / 100;
}

/**
 * Computes window bounding box in projected units.
 */
export function getWindowBoundingBox(
  lat: number,
  lon: number,
  degWidth: number, // 9, 22, or 55
  aspect: '4:3' | '16:9' | '3:4' = '4:3'
): BoundingBox {
  const center = project(lon, lat);
  const widthUnits = degWidth * UNITS_PER_DEG_LON;

  const ratio = aspect === '16:9' ? 16 / 9 : aspect === '3:4' ? 3 / 4 : 4 / 3;
  const heightUnits = widthUnits / ratio;

  return {
    minX: center.x - widthUnits / 2,
    maxX: center.x + widthUnits / 2,
    minY: center.y - heightUnits / 2,
    maxY: center.y + heightUnits / 2,
    width: widthUnits,
    height: heightUnits,
  };
}
