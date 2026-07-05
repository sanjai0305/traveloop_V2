import { Queue, Worker, QueueEvents } from "bullmq";
import redisClient from "./redis.js";

const connection = redisClient;

export const NEO4J_SYNC_QUEUE_NAME = "neo4j-sync";

// Set up queues
export const neo4jSyncQueue = new Queue(NEO4J_SYNC_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000, // Starts at 2s, doubles on each retry
    },
    removeOnComplete: { age: 3600 }, // Remove logs older than 1hr
    removeOnFail: { age: 86400 * 7 }, // Keep failures for 7 days in DLQ
  },
});

export const addSyncJob = async (type, payload) => {
  try {
    const job = await neo4jSyncQueue.add(type, payload);
    console.log(`[BullMQ] Job enqueued successfully: ID=${job.id}, Type=${type}`);
    return job;
  } catch (error) {
    console.error(`[BullMQ] Failed to add sync job:`, error);
  }
};

export default {
  neo4jSyncQueue,
  addSyncJob,
  connection,
};
