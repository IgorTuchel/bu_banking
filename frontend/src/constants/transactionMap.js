export const COUNTRY_NAME_BY_CODE = {
  GB: "United Kingdom",
  UK: "United Kingdom",
  US: "United States",
  USA: "United States",
  NL: "Netherlands",
  FR: "France",
  DE: "Germany",
  ES: "Spain",
  IT: "Italy",
  IE: "Ireland",
  PT: "Portugal",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CZ: "Czech Republic",
};

export const LOCATION_TEXT_BLOCKLIST = [
  "card terminal",
  "online",
  "online banking",
  "not provided",
];

export const MAP_TILE_LAYER = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "&copy; OpenStreetMap contributors",
};

export const TRANSACTION_MAP_CIRCLE_STYLE = {
  radius: 4000,
  pathOptions: {
    color: "#2E8B57",
    fillColor: "#2E8B57",
    fillOpacity: 0.15,
    weight: 2,
  },
};

export const CUSTOM_MARKER_ICON_OPTIONS = {
  className: "custom-green-marker",
  html: '<div class="custom-green-marker-pin"></div>',
  iconSize: [38, 54],
  iconAnchor: [19, 54],
  popupAnchor: [0, -46],
};