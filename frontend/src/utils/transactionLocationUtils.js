import {
  COUNTRY_NAME_BY_CODE,
  LOCATION_TEXT_BLOCKLIST,
} from "../constants/transactionMap";

export function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

export function normalizeLocationValue(value) {
  return String(value ?? "").trim();
}

export function shouldUseLocationText(value) {
  const normalized = normalizeLocationValue(value).toLowerCase();

  if (!normalized) {
    return false;
  }

  return !LOCATION_TEXT_BLOCKLIST.some((term) => normalized.includes(term));
}

export function getCountryName(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return COUNTRY_NAME_BY_CODE[normalized] ?? value;
}

export function getLocationLabel(transaction) {
  const merchant = transaction.merchant ?? {};

  const city = firstDefined(
    transaction.city,
    transaction.cityName,
    transaction.town,
    transaction.locationCity,
    merchant.city,
    merchant.cityName,
    merchant.town
  );

  const country = firstDefined(
    transaction.country,
    transaction.countryName,
    merchant.country,
    merchant.countryName
  );

  const readableCountry = getCountryName(country);

  return firstDefined(
    merchant.location,
    transaction.location,
    city && readableCountry ? `${city}, ${readableCountry}` : null,
    city
  );
}

export function getGeocodeQuery(transaction) {
  const merchant = transaction.merchant ?? {};

  const city = firstDefined(
    transaction.city,
    transaction.cityName,
    transaction.town,
    transaction.locationCity,
    merchant.city,
    merchant.cityName,
    merchant.town
  );

  if (city) {
    return normalizeLocationValue(city);
  }

  const fallbackLocation = firstDefined(
    typeof transaction.location === "string" ? transaction.location : null,
    transaction.locationName,
    transaction.place,
    typeof merchant.location === "string" ? merchant.location : null
  );

  return shouldUseLocationText(fallbackLocation)
    ? normalizeLocationValue(fallbackLocation)
    : null;
}


const MAP_EXCLUDED_KEYWORDS = [
  "transfer",
  "bank transfer",
  "online",
  "subscription",
  "recurring",
  "recurrent",
  "direct debit",
  "standing order",
  "faster payment",
  "banking app",
];

export function shouldRenderTransactionMap(transaction) {
  const merchant = transaction?.merchant ?? {};
  const category = String(firstDefined(transaction?.category, merchant?.category) ?? "").toLowerCase();
  const paymentType = String(firstDefined(transaction?.paymentType, merchant?.type) ?? "").toLowerCase();
  const location = String(firstDefined(transaction?.location, merchant?.location) ?? "").toLowerCase();

  const searchableValue = `${category} ${paymentType} ${location}`;
  const isExcludedType = MAP_EXCLUDED_KEYWORDS.some((keyword) =>
    searchableValue.includes(keyword)
  );

  if (isExcludedType) {
    return false;
  }

  return Boolean(getGeocodeQuery(transaction));
}