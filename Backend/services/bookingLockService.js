import redisClient from "../config/redis.js";
import { acquireSeatLock as cacheAcquire, releaseSeatLock as cacheRelease, TTL } from "./cacheService.js";

/**
 * Booking Lock Service
 * ────────────────────
 * Manages distributed locks on seat numbers to prevent double-booking.
 */
export class BookingLockService {
  /** Check if a specific seat is currently locked in Redis */
  static async isSeatLocked(tripId, seatNumber) {
    if (!redisClient) return false;
    const lockKey = `booking:seat-lock:${tripId}:${seatNumber}`;
    try {
      const exists = await redisClient.exists(lockKey);
      return exists === 1;
    } catch (err) {
      console.error(`[Booking Lock Check Error] Key: ${lockKey}. Reason:`, err.message);
      return false;
    }
  }

  /** Explicitly acquire a single seat lock */
  static async acquireSeatLock(tripId, seatNumber, lockDuration = TTL.SEAT_LOCK) {
    return cacheAcquire(tripId, seatNumber, lockDuration);
  }

  /** Explicitly release a single seat lock */
  static async releaseSeatLock(tripId, seatNumber) {
    return cacheRelease(tripId, seatNumber);
  }

  /** Renew / extend lock TTL lease time */
  static async renewLock(tripId, seatNumber, extendDuration = TTL.SEAT_LOCK) {
    if (!redisClient) return false;
    const lockKey = `booking:seat-lock:${tripId}:${seatNumber}`;
    try {
      const result = await redisClient.expire(lockKey, extendDuration);
      const renewed = result === 1;
      console.log(`[Redis Lock] Renew lock on ${lockKey} for ${extendDuration}s: ${renewed ? "SUCCESS" : "FAILED"}`);
      return renewed;
    } catch (err) {
      console.error(`[Booking Lock Renew Error] Key: ${lockKey}. Reason:`, err.message);
      return false;
    }
  }

  /**
   * Attempts to reserve an array of seats.
   * If any of the requested seats are already locked, returns false.
   */
  static async reserveSeats(tripId, seatNumbers = [], lockDuration = TTL.SEAT_LOCK) {
    if (!seatNumbers.length) return true;

    console.log(`[Booking Lock] Reserving seats ${seatNumbers.join(", ")} on trip ${tripId}...`);
    const acquiredLocks = [];

    for (const seat of seatNumbers) {
      const success = await cacheAcquire(tripId, seat, lockDuration);
      if (success) {
        acquiredLocks.push(seat);
      } else {
        // Rollback all locks acquired so far to keep it atomic (all or nothing)
        console.warn(`[Booking Lock] Seat ${seat} is already locked. Aborting transaction.`);
        for (const lockedSeat of acquiredLocks) {
          await cacheRelease(tripId, lockedSeat);
        }
        return false;
      }
    }
    return true;
  }

  /** Release seat locks after booking confirmation or failure (committed/rolled back) */
  static async releaseSeats(tripId, seatNumbers = []) {
    for (const seat of seatNumbers) {
      await cacheRelease(tripId, seat);
    }
  }
}

export default BookingLockService;
