export const GEOCODE_CACHE = new Map();

export async function geocodeFromOpenMeteo(query, signal) {
  const params = new URLSearchParams({
    count: "1",
    name: query,
    language: "en",
    format: "json",
  });

  const url = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Open-Meteo geocoding failed: ${response.status} ${response.statusText} | ${text}`
    );
  }

  const data = await response.json();
  const match = data?.results?.[0];
  const latitude = Number(match?.latitude);
  const longitude = Number(match?.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return [latitude, longitude];
  }

  return null;
}

export async function geocodeLocationQuery(query, signal) {
  if (!query) {
    return null;
  }

  try {
    return await geocodeFromOpenMeteo(query, signal);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    console.error("Open-Meteo failed:", query, error?.message ?? error);
    return null;
  }
}