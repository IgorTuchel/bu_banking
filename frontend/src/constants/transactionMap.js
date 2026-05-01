export const MAP_TILE_LAYER = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
};

export const TRANSACTION_MAP_CIRCLE_STYLE = {
  radius: 2000,
  pathOptions: {
    color: "#2E8B57",
    fillColor: "#2E8B57",
    fillOpacity: 0.12,
    weight: 1.5,
  },
};

export const CUSTOM_MARKER_ICON_OPTIONS = {
  className: "transaction-map-marker",
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path
        d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22S28 23.33 28 14C28 6.27 21.73 0 14 0z"
        fill="#2E8B57"
        stroke="#D4AF37"
        stroke-width="2.5"
      />
      <circle cx="14" cy="14" r="5" fill="#D4AF37" />
    </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
};
