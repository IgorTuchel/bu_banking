import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Popup, Circle } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

import {
  CUSTOM_MARKER_ICON_OPTIONS,
  MAP_TILE_LAYER,
  TRANSACTION_MAP_CIRCLE_STYLE,
} from "../constants/transactionMap";
import {
  firstDefined,
  getGeocodeQuery,
  getLocationLabel,
} from "../utils/transactionLocationUtils";
import {
  GEOCODE_CACHE,
  geocodeLocationQuery,
} from "../utils/transactionMapUtils";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const customMarkerIcon = L.divIcon(CUSTOM_MARKER_ICON_OPTIONS);

export default function TransactionLocationMap({ transaction }) {
  const [resolvedCenter, setResolvedCenter] = useState(null);
  const [resolvingKey, setResolvingKey] = useState("");

  const geocodeQuery = getGeocodeQuery(transaction);
  const cacheKey = geocodeQuery ?? "";
  const locationLabel = getLocationLabel(transaction) ?? geocodeQuery;

  const center = useMemo(() => {
    if (!geocodeQuery) {
      return null;
    }

    return GEOCODE_CACHE.get(cacheKey) ?? resolvedCenter;
  }, [cacheKey, geocodeQuery, resolvedCenter]);

  const isResolving = resolvingKey === cacheKey;

  const transactionTitle = firstDefined(
    transaction.merchant?.name,
    transaction.merchantName,
    transaction.name,
    "Transaction"
  );

  useEffect(() => {
    if (!geocodeQuery || GEOCODE_CACHE.has(cacheKey)) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    async function run() {
      try {
        await Promise.resolve();

        if (!isActive) {
          return;
        }

        setResolvingKey(cacheKey);

        const resolvedCoordinates = await geocodeLocationQuery(
          geocodeQuery,
          controller.signal
        );

        if (!isActive) {
          return;
        }

        if (resolvedCoordinates) {
          GEOCODE_CACHE.set(cacheKey, resolvedCoordinates);
          setResolvedCenter(resolvedCoordinates);
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("Geocoding failed:", geocodeQuery, error);
        }
      } finally {
        if (isActive) {
          setResolvingKey((currentKey) =>
            currentKey === cacheKey ? "" : currentKey
          );
        }
      }
    }

    run();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [cacheKey, geocodeQuery]);

  if (isResolving) {
    return (
      <div className="transaction-map transaction-map-status">
        Resolving map location{locationLabel ? ` for ${locationLabel}` : ""}…
      </div>
    );
  }

  if (!geocodeQuery) {
    return (
      <div className="transaction-map transaction-map-status">
        No city location stored for this transaction.
      </div>
    );
  }

  if (!center) {
    return (
      <div className="transaction-map transaction-map-status">
        Could not resolve map coordinates for {locationLabel ?? geocodeQuery}.
      </div>
    );
  }

  return (
    <div className="transaction-map">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          attribution={MAP_TILE_LAYER.attribution}
          url={MAP_TILE_LAYER.url}
        />
        <Circle
          center={center}
          radius={TRANSACTION_MAP_CIRCLE_STYLE.radius}
          pathOptions={TRANSACTION_MAP_CIRCLE_STYLE.pathOptions}
        />
        <Marker position={center} icon={customMarkerIcon}>
          <Popup>
            <strong>{transactionTitle}</strong>
            <br />
            {locationLabel}
            <br />
            {transaction.amount}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}