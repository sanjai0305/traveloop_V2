import dotenv from "dotenv";
dotenv.config();

/**
 * Normalizes and fetches flight details from AviationStack or generates mock data.
 * @param {string} flightNumber e.g., AI302, EK543, 6E621
 * @param {string} departureDate e.g., YYYY-MM-DD
 * @returns {Promise<object>} normalized flight details
 */
export const fetchLiveFlightStatus = async (flightNumber, departureDate) => {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  const cleanFlight = flightNumber.trim().toUpperCase().replace(/\s+/g, "");

  if (apiKey) {
    try {
      const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${cleanFlight}&flight_date=${departureDate}`;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          const live = result.data[0];
          return {
            success: true,
            source: "api",
            airline: live.airline?.name || "Unknown Airline",
            flightNumber: cleanFlight,
            departureAirport: live.departure?.iata || "DEL",
            arrivalAirport: live.arrival?.iata || "NRT",
            departureTime: live.departure?.scheduled ? new Date(live.departure.scheduled) : null,
            arrivalTime: live.arrival?.scheduled ? new Date(live.arrival.scheduled) : null,
            terminal: live.departure?.terminal || "",
            gate: live.departure?.gate || "",
            status: mapAviationStackStatus(live.flight_status),
            delayMinutes: Number(live.departure?.delay) || 0,
            lastUpdated: new Date(),
          };
        }
      }
    } catch (err) {
      console.error("AviationStack API failed, using mock fallback:", err.message);
    }
  }

  // Fallback Mock Engine: generates realistic values depending on the flight prefix
  return generateMockFlight(cleanFlight, departureDate);
};

// AviationStack statuses: scheduled, active, landed, cancelled, incident, diverted
const mapAviationStackStatus = (status) => {
  if (!status) return "scheduled";
  const s = status.toLowerCase();
  if (s === "active") return "boarding";
  if (s === "landed") return "landed";
  if (s === "cancelled") return "cancelled";
  if (s === "incident" || s === "diverted") return "delayed";
  return "scheduled"; // scheduled
};

const generateMockFlight = (flightNumber, departureDate) => {
  let airline = "Traveloop Airways";
  let departureAirport = "DEL";
  let arrivalAirport = "DXB";
  let departureHour = 10;
  let arrivalHour = 14;

  if (flightNumber.startsWith("AI")) {
    airline = "Air India";
    departureAirport = "DEL";
    arrivalAirport = "NRT";
    departureHour = 9;
    arrivalHour = 19;
  } else if (flightNumber.startsWith("EK")) {
    airline = "Emirates";
    departureAirport = "DXB";
    arrivalAirport = "BOM";
    departureHour = 13;
    arrivalHour = 17;
  } else if (flightNumber.startsWith("6E")) {
    airline = "IndiGo";
    departureAirport = "DEL";
    arrivalAirport = "MAA";
    departureHour = 6;
    arrivalHour = 8;
  } else if (flightNumber.startsWith("SQ")) {
    airline = "Singapore Airlines";
    departureAirport = "SIN";
    arrivalAirport = "DEL";
    departureHour = 16;
    arrivalHour = 20;
  } else if (flightNumber.startsWith("JL") || flightNumber.startsWith("NH")) {
    airline = flightNumber.startsWith("JL") ? "Japan Airlines" : "All Nippon Airways";
    departureAirport = "HND";
    arrivalAirport = "SIN";
    departureHour = 11;
    arrivalHour = 17;
  }

  // Build local dates based on departure date
  const depTime = new Date(`${departureDate}T${String(departureHour).padStart(2, "0")}:00:00`);
  const arrTime = new Date(`${departureDate}T${String(arrivalHour).padStart(2, "0")}:00:00`);

  // If date parsing fails, use current dates
  const departureTime = isNaN(depTime.getTime()) ? new Date() : depTime;
  const arrivalTime = isNaN(arrTime.getTime()) ? new Date(departureTime.getTime() + 4 * 3600000) : arrTime;

  return {
    success: true,
    source: "mock",
    airline,
    flightNumber,
    departureAirport,
    arrivalAirport,
    departureTime,
    arrivalTime,
    terminal: "T3",
    gate: "G14",
    status: "scheduled",
    delayMinutes: 0,
    lastUpdated: new Date(),
  };
};
