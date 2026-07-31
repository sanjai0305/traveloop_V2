import "dotenv/config";
import mongoose from "mongoose";
import AgentTrip from "../models/AgentTrip.js";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/traveloop-website";

async function normalize() {
  console.log("=== NORMALIZING TRIP STATUSES IN MONGOBD ===");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to", MONGO_URI);

  const trips = await AgentTrip.find({});
  console.log(`Found ${trips.length} total AgentTrips in database.`);

  let updatedCount = 0;

  for (const trip of trips) {
    const rawStatus = (trip.status || "").toLowerCase();
    const rawApproval = (trip.approvalStatus || "").toLowerCase();
    const rawPublish = (trip.publishStatus || "").toLowerCase();

    let newStatus = trip.status;
    let newApprovalStatus = trip.approvalStatus;
    let newPublishStatus = trip.publishStatus;
    let newPublished = trip.published;

    // Rule 1: If approvalStatus is NOT approved, published MUST be false
    if (rawApproval !== "approved") {
      newPublished = false;

      if (rawStatus === "published" || rawPublish === "published") {
        if (rawApproval === "pending" || rawStatus === "pending_approval" || rawPublish === "pending_approval") {
          newStatus = "pending_approval";
          newApprovalStatus = "pending";
          newPublishStatus = "pending_approval";
        } else if (rawApproval === "rejected" || rawStatus === "rejected" || rawPublish === "rejected") {
          newStatus = "rejected";
          newApprovalStatus = "rejected";
          newPublishStatus = "rejected";
        } else {
          newStatus = "draft";
          newApprovalStatus = "draft";
          newPublishStatus = "draft";
        }
      }
    } else {
      // Rule 2: If approvalStatus IS approved, sync status to published
      newStatus = "published";
      newPublishStatus = "published";
      newPublished = true;
    }

    if (
      trip.status !== newStatus ||
      trip.approvalStatus !== newApprovalStatus ||
      trip.publishStatus !== newPublishStatus ||
      trip.published !== newPublished
    ) {
      console.log(`Normalizing trip '${trip.title}' (${trip._id}):`);
      console.log(`  BEFORE -> status: ${trip.status}, approvalStatus: ${trip.approvalStatus}, publishStatus: ${trip.publishStatus}, published: ${trip.published}`);
      console.log(`  AFTER  -> status: ${newStatus}, approvalStatus: ${newApprovalStatus}, publishStatus: ${newPublishStatus}, published: ${newPublished}`);
      
      trip.status = newStatus;
      trip.approvalStatus = newApprovalStatus;
      trip.publishStatus = newPublishStatus;
      trip.published = newPublished;
      await trip.save();
      updatedCount++;
    }
  }

  console.log(`Normalized ${updatedCount} trips successfully.`);
  await mongoose.disconnect();
}

normalize().catch(console.error);
