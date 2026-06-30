import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Trip from "./models/Trip.js";
import { hasTripPermission } from "./utils/permissionHelper.js";

dotenv.config();

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("❌ Please define the MONGO_URI environment variable.");
  }
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const trips = await Trip.find({});
  console.log(`Checking ${trips.length} trips...`);

  for (const trip of trips) {
    const ownerId = trip.owner || trip.user;
    const ownerExists = await User.exists({ _id: ownerId });
    if (!ownerExists) {
      console.log(`Trip "${trip.title}" (${trip._id}) has non-existent owner: ${ownerId}`);
    }

    if (trip.collaborators) {
      for (const collab of trip.collaborators) {
        const collabExists = await User.exists({ _id: collab.userId });
        if (!collabExists) {
          console.log(`Trip "${trip.title}" (${trip._id}) has non-existent collaborator: ${collab.userId}`);
        }
      }
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
