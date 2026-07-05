import { acquireSeatLock, releaseSeatLock, TTL } from "./cacheService.js";

/**
 * Booking Lock Service
 * ────────────────────
 * Manages distributed locks on seat numbers to prevent double-booking.
 */
export class BookingLockService {
  /**
   * Attempts to reserve an array of seats.
   * If any of the requested seats are already locked, returns false.
   */
  static async reserveSeats(tripId, seatNumbers = [], lockDuration = TTL.SEAT_LOCK) {
    if (!seatNumbers.length) return true;

    console.log(`[Booking Lock] Reserving seats ${seatNumbers.join(", ")} on trip ${tripId}...`);
    const acquiredLocks = [];

    for (const seat of seatNumbers) {
      const success = await acquireSeatLock(tripId, seat, lockDuration);
      if (success) {
        acquiredLocks.push(seat);
      } else {
        // Rollback all locks acquired so far to keep it atomic (all or nothing)
        console.warn(`[Booking Lock] Seat ${seat} is already locked. Aborting transaction.`);
        for (const lockedSeat of acquiredLocks) {
          await releaseSeatLock(tripId, lockedSeat);
        }
        return false;
      }
    }
    return true;
  }

  /** Release seat locks after booking confirmation or failure (committed/rolled back) */
  static async releaseSeats(tripId, seatNumbers = []) {
    for (const seat of seatNumbers) {
      await releaseSeatLock(tripId, seat);
    }
  }
}

export default BookingLockService;
