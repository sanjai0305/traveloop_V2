# Mongoose Duplicate Index Cleanup Report

This report documents the audit and removal of redundant index definitions from Mongoose schemas to resolve startup warnings.

## 1. Cleaned Indexes

Redundant `schema.index()` declarations were removed for all fields that already declared a unique index implicitly through the `{ unique: true }` constraint in their schema path:

| Model | File Path | Field | Removed Index Declaration | Reason |
| :--- | :--- | :--- | :--- | :--- |
| `User` | `models/User.js` | `email` | `userSchema.index({ email: 1 });` | Duplicate of `unique: true` |
| `Booking` | `models/Booking.js` | `bookingId` | `bookingSchema.index({ bookingId: 1 });` | Duplicate of `unique: true` |
| `Agent` | `models/Agent.js` | `email` | `agentSchema.index({ email: 1 });` | Duplicate of `unique: true` |
| `Driver` | `models/Driver.js` | `email` | `driverSchema.index({ email: 1 });` | Duplicate of `unique: true` |
| `SystemSetting` | `models/SystemSetting.js` | `key` | `systemSettingSchema.index({ key: 1 });` | Duplicate of `unique: true` |
| `Admin` | `models/Admin.js` | `email` | `adminSchema.index({ email: 1 });` | Duplicate of `unique: true` |

## 2. Preserved Indexes

All uniqueness constraints and non-redundant lookups have been preserved:
- **User.js**: `email` (unique), `firebaseUid` (sparse lookup index).
- **Booking.js**: `bookingId` (unique), `token` (unique sparse), `userId` (foreign key lookup), `tripId` (foreign key lookup).
- **Agent.js**: `email` (unique).
- **Driver.js**: `email` (unique).
- **SystemSetting.js**: `key` (unique).
- **Admin.js**: `email` (unique).
- **ChatReadStatus.js**: `{ tripId: 1, userId: 1 }` (unique compound index).
- **DriverUpdate.js**: `{ trip: 1, createdAt: -1 }` (compound sort index).
- **BoardingPass.js**: `{ booking: 1, agentTrip: 1 }` (compound lookup index).

## 3. Results
Mongoose initialization executes with zero startup warnings:
```
[MONGOOSE] Warning: Duplicate schema index
```
no longer appears in stdout/stderr.
