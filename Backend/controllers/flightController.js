import Flight from "../models/Flight.js";
import Trip from "../models/Trip.js";
import Notification from "../models/Notification.js";
import { fetchLiveFlightStatus } from "../utils/flightApi.js";
import { logActivity } from "../utils/activityLogger.js";
import { hasTripPermission } from "../utils/permissionHelper.js";

// Helper to check write access (Owner or Editor)
const hasWriteAccess = (trip, userId) => {
  return hasTripPermission(trip, userId, "update");
};

// Helper to check read access (Owner, Editor, or Viewer)
const hasReadAccess = (trip, userId) => {
  return hasTripPermission(trip, userId, "read");
};

// Helper to trigger database notifications for flight changes
const triggerFlightNotifications = async (trip, flight, oldFlightState) => {
  const usersToNotify = [];
  
  // Collect Owner
  const ownerId = trip.owner?._id || trip.owner || trip.user;
  if (ownerId) usersToNotify.push(ownerId.toString());
  
  // Collect accepted collaborators
  if (trip.collaborators) {
    trip.collaborators.forEach(c => {
      if (c.userId && c.acceptedAt !== null) {
        usersToNotify.push(c.userId.toString());
      }
    });
  }

  // Filter unique IDs
  const uniqueUserIds = [...new Set(usersToNotify)];

  const notificationsToCreate = [];

  // 1. Status Changed
  if (flight.status !== oldFlightState.status) {
    if (flight.status === "delayed") {
      notificationsToCreate.push({
        title: "Flight Delayed ⚠️",
        message: `Flight ${flight.flightNumber} has been delayed by ${flight.delayMinutes} mins.`,
        type: "warning",
      });
    } else if (flight.status === "boarding") {
      notificationsToCreate.push({
        title: "Flight Boarding Soon ✈️",
        message: `Flight ${flight.flightNumber} is boarding now${flight.gate ? ` at Gate ${flight.gate}` : ""}.`,
        type: "info",
      });
    } else if (flight.status === "cancelled") {
      notificationsToCreate.push({
        title: "Flight Cancelled 🛑",
        message: `Flight ${flight.flightNumber} has been cancelled.`,
        type: "warning",
      });
    }
  } else if (flight.status === "delayed" && flight.delayMinutes !== oldFlightState.delayMinutes) {
    // Delay minutes changed
    notificationsToCreate.push({
      title: "Flight Delayed ⚠️",
      message: `Flight ${flight.flightNumber} delay changed to ${flight.delayMinutes} mins.`,
      type: "warning",
    });
  }

  // 2. Gate Changed (if gate was previously set and is now different)
  if (oldFlightState.gate && flight.gate && oldFlightState.gate !== flight.gate) {
    notificationsToCreate.push({
      title: "Flight Gate Changed 🚪",
      message: `Flight ${flight.flightNumber} gate changed from ${oldFlightState.gate} to ${flight.gate}.`,
      type: "info",
    });
  }

  // Send to all users
  for (const userId of uniqueUserIds) {
    for (const notif of notificationsToCreate) {
      await Notification.create({
        user: userId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        trip: trip._id,
      });
    }
  }
};

// ADD FLIGHT
export const addFlight = async (req, res) => {
  try {
    const { tripId, flightNumber, airline, departureDate, manualDetails } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasWriteAccess(trip, req.user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to add flights" });
    }

    // Call Flight API wrapper
    const liveData = await fetchLiveFlightStatus(flightNumber, departureDate);

    // Merge manual overrides if supplied
    const flightData = {
      trip: tripId,
      flightNumber: flightNumber.trim().toUpperCase(),
      airline: airline || liveData.airline,
      departureAirport: manualDetails?.departureAirport || liveData.departureAirport,
      arrivalAirport: manualDetails?.arrivalAirport || liveData.arrivalAirport,
      departureTime: manualDetails?.departureTime ? new Date(manualDetails.departureTime) : liveData.departureTime,
      arrivalTime: manualDetails?.arrivalTime ? new Date(manualDetails.arrivalTime) : liveData.arrivalTime,
      terminal: manualDetails?.terminal !== undefined ? manualDetails.terminal : liveData.terminal,
      gate: manualDetails?.gate !== undefined ? manualDetails.gate : liveData.gate,
      status: manualDetails?.status || liveData.status,
      delayMinutes: manualDetails?.delayMinutes !== undefined ? Number(manualDetails.delayMinutes) : liveData.delayMinutes,
      lastUpdated: new Date(),
    };

    const flight = await Flight.create(flightData);

    const userName = req.user.firstName || req.user.email;
    await logActivity(tripId, req.user.id, `${userName} added flight: ${flight.flightNumber}`);

    res.status(201).json({
      success: true,
      message: "Flight added successfully",
      flight,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET TRIP FLIGHTS
export const getTripFlights = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!hasReadAccess(trip, req.user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have access to this trip" });
    }

    const flights = await Flight.find({ trip: tripId }).sort({ departureTime: 1 });
    res.json({
      success: true,
      flights,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE FLIGHT (MANUAL OVERRIDES)
export const updateFlight = async (req, res) => {
  try {
    const { id } = req.params;
    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({ success: false, message: "Flight not found" });
    }

    const trip = await Trip.findById(flight.trip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated Trip not found" });
    }

    if (!hasWriteAccess(trip, req.user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to update flights" });
    }

    // Capture old state for notification triggers
    const oldState = {
      status: flight.status,
      delayMinutes: flight.delayMinutes,
      gate: flight.gate,
    };

    const updateFields = req.body;
    
    // Update fields
    if (updateFields.flightNumber) flight.flightNumber = updateFields.flightNumber.toUpperCase();
    if (updateFields.airline) flight.airline = updateFields.airline;
    if (updateFields.departureAirport) flight.departureAirport = updateFields.departureAirport;
    if (updateFields.arrivalAirport) flight.arrivalAirport = updateFields.arrivalAirport;
    if (updateFields.departureTime) flight.departureTime = new Date(updateFields.departureTime);
    if (updateFields.arrivalTime) flight.arrivalTime = new Date(updateFields.arrivalTime);
    if (updateFields.terminal !== undefined) flight.terminal = updateFields.terminal;
    if (updateFields.gate !== undefined) flight.gate = updateFields.gate;
    if (updateFields.status) flight.status = updateFields.status;
    if (updateFields.delayMinutes !== undefined) flight.delayMinutes = Number(updateFields.delayMinutes);
    flight.lastUpdated = new Date();

    await flight.save();

    // Trigger status/gate notifications if changed
    await triggerFlightNotifications(trip, flight, oldState);

    const userName = req.user.firstName || req.user.email;
    await logActivity(trip._id, req.user.id, `${userName} updated details for flight ${flight.flightNumber}`);

    res.json({
      success: true,
      message: "Flight updated successfully",
      flight,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE FLIGHT
export const deleteFlight = async (req, res) => {
  try {
    const { id } = req.params;
    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({ success: false, message: "Flight not found" });
    }

    const trip = await Trip.findById(flight.trip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated Trip not found" });
    }

    if (!hasWriteAccess(trip, req.user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to delete flights" });
    }

    await Flight.findByIdAndDelete(id);

    const userName = req.user.firstName || req.user.email;
    await logActivity(trip._id, req.user.id, `${userName} deleted flight ${flight.flightNumber}`);

    res.json({
      success: true,
      message: "Flight deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// REFRESH FLIGHT STATUS (API COOLDOWN CACHE CHECK)
export const refreshFlightStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({ success: false, message: "Flight not found" });
    }

    const trip = await Trip.findById(flight.trip);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated Trip not found" });
    }

    if (!hasReadAccess(trip, req.user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    // Cache cooldown: check if lastUpdated is less than 5 minutes ago to prevent repeated API requests
    const timeDiffMs = new Date() - new Date(flight.lastUpdated);
    const timeDiffMins = timeDiffMs / 60000;

    if (timeDiffMins < 5) {
      // Return cached flight response immediately
      return res.json({
        success: true,
        message: "Status refreshed (returned cached details)",
        cached: true,
        flight,
      });
    }

    // Fetch live status from AviationStack or mock engine
    const depDateStr = new Date(flight.departureTime || new Date()).toISOString().split("T")[0];
    const liveData = await fetchLiveFlightStatus(flight.flightNumber, depDateStr);

    if (liveData.success) {
      // Capture old state for notification triggers
      const oldState = {
        status: flight.status,
        delayMinutes: flight.delayMinutes,
        gate: flight.gate,
      };

      // Update Live parameters
      flight.airline = liveData.airline;
      flight.departureAirport = liveData.departureAirport;
      flight.arrivalAirport = liveData.arrivalAirport;
      if (liveData.departureTime) flight.departureTime = liveData.departureTime;
      if (liveData.arrivalTime) flight.arrivalTime = liveData.arrivalTime;
      flight.terminal = liveData.terminal || flight.terminal;
      flight.gate = liveData.gate || flight.gate;
      flight.status = liveData.status;
      flight.delayMinutes = liveData.delayMinutes;
      flight.lastUpdated = new Date();

      await flight.save();

      // Trigger status notifications
      await triggerFlightNotifications(trip, flight, oldState);
    }

    res.json({
      success: true,
      message: "Flight status refreshed successfully",
      cached: false,
      flight,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
