import { Worker } from "bullmq";
import redisClient from "../config/redis.js";
import { NEO4J_SYNC_QUEUE_NAME } from "../config/bullmq.js";
import {
  mergeUserNode,
  mergeAgentNode,
  mergeTripNode,
  createBookedRelation,
  deleteEntityRelations
} from "../repositories/neo4jRepository.js";

const connection = redisClient;

export const initNeo4jSyncWorker = () => {
  console.log(`[BullMQ Worker] Initializing Neo4j sync worker on queue: ${NEO4J_SYNC_QUEUE_NAME}...`);

  const worker = new Worker(
    NEO4J_SYNC_QUEUE_NAME,
    async (job) => {
      const { name, data } = job;
      console.log(`[BullMQ Worker] Processing job ID=${job.id}, Type=${name}`);

      try {
        switch (name) {
          case "USER_SYNC": {
            const { userId, firstName, lastName, email } = data;
            await mergeUserNode(userId, {
              displayName: `${firstName || ""} ${lastName || ""}`.trim() || "Traveler",
              email: email || "",
            });
            break;
          }
          case "AGENT_SYNC": {
            const { agentId, displayName, email } = data;
            await mergeAgentNode(agentId, {
              companyName: displayName || "Agent Office",
              email: email || "",
            });
            break;
          }
          case "TRIP_SYNC": {
            const { tripId, title, originCity, destinations, startDate, duration } = data;
            await mergeTripNode(tripId, {
              title: title || "Group Journey",
              origin: originCity || "N/A",
              destination: destinations?.[0] || "N/A",
              startDate: startDate || "",
              duration: duration || "",
            });
            break;
          }
          case "BOOKING_SYNC": {
            const { userId, tripId, bookingId, seatNumbers, pricePaid, paymentStatus } = data;
            await mergeUserNode(userId);
            await mergeTripNode(tripId);
            await createBookedRelation(userId, tripId, {
              bookingId: bookingId || "",
              seatsCount: seatNumbers?.length || 1,
              price: pricePaid || 0,
              paymentStatus: paymentStatus || "PENDING",
            });
            break;
          }
          case "DELETE_TRIP": {
            const { tripId } = data;
            await deleteEntityRelations("Trip", tripId);
            break;
          }
          default:
            console.warn(`[BullMQ Worker] Unhandled sync job type: ${name}`);
        }
        console.log(`[BullMQ Worker] Job ID=${job.id} processed successfully.`);
      } catch (err) {
        console.error(`[BullMQ Worker] Error processing job ID=${job.id}:`, err.message);
        throw err; // Fail job to trigger retry/backoff
      }
    },
    {
      connection,
      concurrency: 5, // Concurrent execution threads
    }
  );

  worker.on("completed", (job) => {
    console.log(`[BullMQ Worker] Job completed: ID=${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[BullMQ Worker] Job failed: ID=${job?.id || "unknown"}. Error:`, err.message);
  });

  return worker;
};

export default initNeo4jSyncWorker;
