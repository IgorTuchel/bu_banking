/**
 * Module-level cache so geocode results persist across re-renders
 * without hitting the API repeatedly for the same location.
 */
export const GEOCODE_CACHE = new Map();

/**
 * Geocode a location string using the Nominatim OpenStreetMap API.
 * Returns [lat, lng] or null if not found.
 */
export async function geocodeLocationQuery(query, signal) {
  if (!query) return null;

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?format=json&limit=1&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    signal,
    headers: {
      // Nominatim requires a User-Agent identifying your app
      "User-Agent": "AurixBankingApp/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }

  const results = await response.json();

  if (!results || results.length === 0) {
    return null;
  }

  const { lat, lon } = results[0];
  return [parseFloat(lat), parseFloat(lon)];
}
