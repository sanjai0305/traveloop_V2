import supabase from "../config/supabase.js";

export const addFlight = async (req, res) => {
  try {
    const { tripId, flightNumber, airline, departureDate } = req.body;

    res.status(201).json({
      success: true,
      message: "Flight added successfully",
      flight: {
        _id: "FL-" + Date.now(),
        tripId,
        flightNumber: (flightNumber || "FL100").toUpperCase(),
        airline: airline || "IndiGo",
        status: "on-time",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTripFlights = async (req, res) => {
  res.json({ success: true, flights: [] });
};

export const updateFlight = async (req, res) => {
  res.json({ success: true, message: "Flight updated successfully" });
};

export const deleteFlight = async (req, res) => {
  res.json({ success: true, message: "Flight deleted successfully" });
};

export const refreshFlightStatus = async (req, res) => {
  res.json({ success: true, message: "Flight status refreshed successfully" });
};
