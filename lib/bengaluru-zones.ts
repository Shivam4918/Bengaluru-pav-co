// Bengaluru Geofencing & Serviceable Pincode Validator
// Kitchen Location: Koramangala 5th Block, Bengaluru (560034)

export interface DeliveryZoneInfo {
  isServiceable: boolean;
  zoneName: string;
  pincode: string;
  estPrepAndDeliveryMinutes: number;
  deliveryFee: number;
  distanceKm: number;
  message: string;
}

const BENGALURU_ZONES: Record<string, { zoneName: string; distanceKm: number; estMin: number; fee: number }> = {
  // Immediate Zone (Koramangala & Adjacent)
  "560034": { zoneName: "Koramangala 1st-8th Block", distanceKm: 1.5, estMin: 20, fee: 25 },
  "560095": { zoneName: "Koramangala Koramangala Extn / Ejipura", distanceKm: 2.2, estMin: 25, fee: 25 },
  "560102": { zoneName: "HSR Layout Sectors 1-7", distanceKm: 3.5, estMin: 25, fee: 30 },
  "560068": { zoneName: "BTM Layout 1st & 2nd Stage", distanceKm: 4.0, estMin: 30, fee: 35 },
  "560076": { zoneName: "BTM Layout / Bannerghatta Rd", distanceKm: 5.2, estMin: 32, fee: 40 },
  "560038": { zoneName: "Indiranagar 100ft / 12th Main", distanceKm: 4.8, estMin: 30, fee: 35 },
  "560008": { zoneName: "Halasuru / Ulsoor", distanceKm: 5.5, estMin: 35, fee: 40 },
  "560071": { zoneName: "Domlur / Old Airport Road", distanceKm: 3.8, estMin: 28, fee: 30 },
  "560103": { zoneName: "Bellandur / EcoWorld", distanceKm: 6.0, estMin: 35, fee: 45 },
  "560011": { zoneName: "Jayanagar 3rd & 4th Block", distanceKm: 6.2, estMin: 35, fee: 45 },
  "560041": { zoneName: "Jayanagar 9th Block / Tilak Nagar", distanceKm: 5.8, estMin: 35, fee: 40 },
  "560078": { zoneName: "JP Nagar 1st-6th Phase", distanceKm: 7.0, estMin: 40, fee: 50 },
  "560001": { zoneName: "MG Road / Brigade Road / CBD", distanceKm: 6.5, estMin: 38, fee: 45 },
  "560025": { zoneName: "Richmond Town / Victoria Layout", distanceKm: 5.5, estMin: 35, fee: 40 },
  "560037": { zoneName: "Marathahalli", distanceKm: 8.5, estMin: 45, fee: 55 },
  "560100": { zoneName: "Electronic City Phase 1", distanceKm: 11.0, estMin: 50, fee: 65 },
  "560066": { zoneName: "Whitefield / ITPL", distanceKm: 14.0, estMin: 55, fee: 75 },
};

export function validateBengaluruPincode(pincode: string): DeliveryZoneInfo {
  const cleanPin = (pincode || "").trim();

  // Basic 6-digit regex for Indian Pincodes
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return {
      isServiceable: false,
      zoneName: "Invalid",
      pincode: cleanPin,
      estPrepAndDeliveryMinutes: 0,
      deliveryFee: 0,
      distanceKm: 0,
      message: "Please enter a valid 6-digit Indian PIN code.",
    };
  }

  // Must begin with 56 (Bengaluru Postal Region)
  if (!cleanPin.startsWith("56")) {
    return {
      isServiceable: false,
      zoneName: "Outside Bengaluru",
      pincode: cleanPin,
      estPrepAndDeliveryMinutes: 0,
      deliveryFee: 0,
      distanceKm: 0,
      message: "We currently deliver only within Bengaluru city limits.",
    };
  }

  const zone = BENGALURU_ZONES[cleanPin];
  if (!zone) {
    // Other Bengaluru pincodes outside primary hot delivery radius
    return {
      isServiceable: false,
      zoneName: "Bengaluru Peripheral",
      pincode: cleanPin,
      estPrepAndDeliveryMinutes: 65,
      deliveryFee: 90,
      distanceKm: 18.0,
      message: `Pincode ${cleanPin} is outside our 15km hot-fry delivery radius. Please choose Takeaway or Table QR!`,
    };
  }

  return {
    isServiceable: true,
    zoneName: zone.zoneName,
    pincode: cleanPin,
    estPrepAndDeliveryMinutes: zone.estMin,
    deliveryFee: zone.fee,
    distanceKm: zone.distanceKm,
    message: `Delivery available in ${zone.zoneName} (${zone.distanceKm} km from Koramangala hub). Est. ~${zone.estMin} mins.`,
  };
}

export const POPULAR_BENGALURU_LOCALITIES = [
  { pin: "560034", name: "Koramangala (Store Hub)" },
  { pin: "560102", name: "HSR Layout" },
  { pin: "560038", name: "Indiranagar" },
  { pin: "560068", name: "BTM Layout" },
  { pin: "560103", name: "Bellandur" },
  { pin: "560078", name: "JP Nagar" },
];
