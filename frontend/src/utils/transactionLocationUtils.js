/**
 * Returns the first non-null, non-empty value from the provided arguments.
 */
export function firstDefined(...values) {
  return values.find((v) => v !== null && v !== undefined && v !== "") ?? null;
}

/**
 * Returns true if we have enough location info to attempt geocoding.
 */
export function shouldRenderTransactionMap(transaction) {
  if (!transaction) return false;
  return Boolean(getGeocodeQuery(transaction));
}

/**
 * Builds a geocode search string from the most specific location data available.
 */
export function getGeocodeQuery(transaction) {
  if (!transaction) return null;

  const city = firstDefined(transaction.city, transaction.merchant?.city);
  const country = firstDefined(
    transaction.country,
    transaction.merchant?.country,
  );

  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;

  return null;
}

/**
 * Returns a short human-readable location label for display in the UI.
 */
export function getLocationLabel(transaction) {
  if (!transaction) return null;

  const city = firstDefined(transaction.city, transaction.merchant?.city);
  const country = firstDefined(
    transaction.country,
    transaction.merchant?.country,
  );

  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;

  return null;
}
