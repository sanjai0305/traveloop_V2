import redisClient from "../config/redis.js";

// TTL configuration constants (in seconds)
export const TTL = {
  OTP: 300,             // 5 mins
  SEAT_LOCK: 600,       // 10 mins
  RECOMMENDATION: 3600, // 1 hour
  WEATHER: 7200,        // 2 hours
  SEARCH: 43200,        // 12 hours
  TRIP: 86400,          // 24 hours
};

/** Set standard JSON cache value with TTL options */
export const setCache = async (key, val, ttlSeconds = TTL.TRIP) => {
  if (!redisClient) return;
  try {
    const stringified = JSON.stringify(val);
    await redisClient.setex(key, ttlSeconds, stringified);
  } catch (err) {
    console.error(`[Redis Cache Set Error] Key: ${key}. Reason:`, err.message);
  }
};

/** Get standard JSON cache value */
export const getCache = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`[Redis Cache Get Error] Key: ${key}. Reason:`, err.message);
    return null;
  }
};

/** Delete specific cache keys */
export const delCache = async (key) => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`[Redis Cache Del Error] Key: ${key}. Reason:`, err.message);
  }
};

/** Bounded distributed locking helper for seat reservations */
export const acquireSeatLock = async (tripId, seatNumber, ttlSeconds = TTL.SEAT_LOCK) => {
  if (!redisClient) return false;
  const lockKey = `booking:seat-lock:${tripId}:${seatNumber}`;
  try {
    // Set if not exists (NX) with expiry time (EX)
    const result = await redisClient.set(lockKey, "LOCKED", "NX", "EX", ttlSeconds);
    const hasAcquired = result === "OK";
    console.log(`[Redis Lock] Acquire seat lock on ${lockKey}: ${hasAcquired ? "SUCCESS" : "FAILED"}`);
    return hasAcquired;
  } catch (err) {
    console.error(`[Redis Lock Error] Key: ${lockKey}. Reason:`, err.message);
    return false;
  }
};

/** Release distributed seat lock */
export const releaseSeatLock = async (tripId, seatNumber) => {
  if (!redisClient) return;
  const lockKey = `booking:seat-lock:${tripId}:${seatNumber}`;
  try {
    await redisClient.del(lockKey);
    console.log(`[Redis Lock] Released seat lock on ${lockKey}`);
  } catch (err) {
    console.error(`[Redis Lock Release Error] Key: ${lockKey}. Reason:`, err.message);
  }
};

export default {
  setCache,
  getCache,
  delCache,
  acquireSeatLock,
  releaseSeatLock,
  TTL,
};
