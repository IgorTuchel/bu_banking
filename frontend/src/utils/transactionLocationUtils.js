export function firstDefined(...values) {
  return values.find((v) => v !== null && v !== undefined && v !== "") ?? null;
}

function hasRealCoordinateValue(value) {
  return value !== null && value !== undefined && value !== "";
}

export function getTransactionCoordinates(transaction) {
  if (!transaction) return null;

  const rawLatitude = transaction.latitude;
  const rawLongitude = transaction.longitude;

  if (
    !hasRealCoordinateValue(rawLatitude) ||
    !hasRealCoordinateValue(rawLongitude)
  ) {
    return null;
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return [latitude, longitude];
}

export function shouldRenderTransactionMap(transaction) {
  if (!transaction) return false;

  return Boolean(
    getTransactionCoordinates(transaction) || getGeocodeQuery(transaction),
  );
}

export function getGeocodeQuery(transaction) {
  if (!transaction) return null;

  const city = firstDefined(transaction.city, transaction.merchant?.city);
  const country = firstDefined(
    transaction.country,
    transaction.merchant?.country,
  );

  if (city && country) return `${city}, ${country}`;
  if (city) return city;

  // Important: don't geocode country-only values like "GB",
  // because they can resolve poorly or too broadly.
  return null;
}

export function getLocationLabel(transaction) {
  if (!transaction) return null;

  const label = firstDefined(transaction.locationLabel);
  if (label) return label;

  const city = firstDefined(transaction.city, transaction.merchant?.city);
  const country = firstDefined(
    transaction.country,
    transaction.merchant?.country,
  );

  if (city && country) return `${city}, ${country}`;
  if (city) return city;

  const coordinates = getTransactionCoordinates(transaction);
  if (coordinates) return "Current device location";

  return null;
}