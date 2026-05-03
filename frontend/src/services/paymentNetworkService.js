import { authenticatedFetch } from "./authService";
import { getDeviceLocation } from "../utils/locationUtils";

const API_BASE = "http://127.0.0.1:8000/api";

export async function createNetworkCharge({
  amount,
  cardNumber,
  merchantId = "ExpoDemo",
  description = "Expo demo card payment",
}) {
  const location = await getDeviceLocation();

  const body = {
    amount,
    card_number: cardNumber,
    merchant_id: merchantId,
    description,
    ...(location ?? {
      city: "Bournemouth",
      country: "GB",
      latitude: 50.7192,
      longitude: -1.8808,
      location_label: "Bournemouth University Expo",
    }),
  };

  const response = await authenticatedFetch(
    `${API_BASE}/payment-network/charge/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create network charge.");
  }

  return response.json();
}