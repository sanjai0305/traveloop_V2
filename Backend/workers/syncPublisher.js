import mongoose from "mongoose";
import { addSyncJob } from "../config/bullmq.js";

export const startMongoSyncPublisher = () => {
  const connection = mongoose.connection;

  connection.once("open", () => {
    console.log("[Mongo Sync Publisher] Database open. Listening to change streams...");

    try {
      // 1. WATCH USER COLLECTION
      const userModel = mongoose.model("User");
      const userChangeStream = userModel.watch([], { fullDocument: "updateLookup" });
      userChangeStream.on("change", async (change) => {
        const { operationType, documentKey, fullDocument } = change;
        console.log(`[Mongo Sync Publisher] User Change stream event: ${operationType}`);
        if (operationType === "insert" || operationType === "update" || operationType === "replace") {
          if (fullDocument) {
            await addSyncJob("USER_SYNC", {
              userId: fullDocument._id,
              firstName: fullDocument.firstName,
              lastName: fullDocument.lastName,
              email: fullDocument.email,
            });
          }
        }
      });
      userChangeStream.on("error", (err) => {
        console.warn("[Mongo Sync Publisher] User stream error:", err.message);
      });

      // 2. WATCH AGENT COLLECTION
      const agentModel = mongoose.model("Agent");
      const agentChangeStream = agentModel.watch([], { fullDocument: "updateLookup" });
      agentChangeStream.on("change", async (change) => {
        const { operationType, documentKey, fullDocument } = change;
        console.log(`[Mongo Sync Publisher] Agent Change stream event: ${operationType}`);
        if (operationType === "insert" || operationType === "update" || operationType === "replace") {
          if (fullDocument) {
            await addSyncJob("AGENT_SYNC", {
              agentId: fullDocument._id,
              displayName: fullDocument.displayName || fullDocument.companyName,
              email: fullDocument.email,
            });
          }
        }
      });
      agentChangeStream.on("error", (err) => {
        console.warn("[Mongo Sync Publisher] Agent stream error:", err.message);
      });

      // 3. WATCH AGENTTRIP COLLECTION
      const agentTripModel = mongoose.model("AgentTrip");
      const tripChangeStream = agentTripModel.watch([], { fullDocument: "updateLookup" });
      tripChangeStream.on("change", async (change) => {
        const { operationType, documentKey, fullDocument } = change;
        console.log(`[Mongo Sync Publisher] AgentTrip Change stream event: ${operationType}`);
        if (operationType === "insert" || operationType === "update" || operationType === "replace") {
          if (fullDocument) {
            await addSyncJob("TRIP_SYNC", {
              tripId: fullDocument._id,
              title: fullDocument.title,
              originCity: fullDocument.originCity,
              destinations: fullDocument.destinations,
              startDate: fullDocument.startDate,
              duration: fullDocument.duration,
            });
          }
        } else if (operationType === "delete") {
          await addSyncJob("DELETE_TRIP", {
            tripId: documentKey._id,
          });
        }
      });
      tripChangeStream.on("error", (err) => {
        console.warn("[Mongo Sync Publisher] AgentTrip stream error:", err.message);
      });

      // 4. WATCH BOOKING COLLECTION
      const bookingModel = mongoose.model("Booking");
      const bookingChangeStream = bookingModel.watch([], { fullDocument: "updateLookup" });
      bookingChangeStream.on("change", async (change) => {
        const { operationType, documentKey, fullDocument } = change;
        console.log(`[Mongo Sync Publisher] Booking Change stream event: ${operationType}`);
        if (operationType === "insert" || operationType === "update" || operationType === "replace") {
          if (fullDocument) {
            await addSyncJob("BOOKING_SYNC", {
              userId: fullDocument.userId,
              tripId: fullDocument.tripId,
              bookingId: fullDocument.bookingId,
              seatNumbers: fullDocument.seatNumbers,
              pricePaid: fullDocument.pricePaid,
              paymentStatus: fullDocument.paymentStatus,
            });
          }
        }
      });
      bookingChangeStream.on("error", (err) => {
        console.warn("[Mongo Sync Publisher] Booking stream error:", err.message);
      });
    } catch (err) {
      console.warn("⚠️ [Mongo Sync Publisher] Failed to initialize change streams. MongoDB change streams require a Replica Set. Running in standalone mode.");
      console.warn("Reason:", err.message);
    }
  });
};

export default startMongoSyncPublisher;
