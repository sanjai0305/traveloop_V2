# MongoDB Collections and Mongoose Models Reference

Below is a reference guide mapping the Mongoose models designed for the MongoDB Atlas migration.

## 1. Mongoose Models Map

| Mongoose Model | Database Collection | Purpose |
| :--- | :--- | :--- |
| `User` | `users` | Traveler Profiles & Session metadata |
| `Agent` | `agents` | Travel Agent Business details |
| `Trip` | `trips` | Personal trip itinerary plan workspace |
| `AgentTrip` | `agent_trips` | Marketplace published commercial packages |
| `Booking` | `bookings` | Customer marketplace booking records |
| `Driver` | `drivers` | Allocated travel bus drivers |
| `Payment` | `payments` | Customer booking checkout payments |
| `Review` | `reviews` | Traveler agency feedback |
| `Wishlist` | `wishlists` | Saved/Bookmarked agent packages |
| `Itinerary` | `itineraries` | Day-by-day planner coordinates |
| `Checklist` | `checklists` | Packing checklist records |
| `Budget` | `budgets` | Core trip financial planner sheets |
| `DriverUpdate` | `driver_updates` | Realtime driver coordinates & status notifications |
| `Notification` | `notifications` | Traveler activity system feeds |
| `ChatMessage` | `chat_messages` | Trip chat channel records |
| `ChatReadStatus` | `chat_read_statuses` | Read receipt tracking |
| `Flight` | `flights` | Live flight status |
| `Note` | `notes` | Trip notepad texts |
| `ActivityLog` | `activity_logs` | Audit trail events |
| `Admin` | `admins` | Platform operations managers |
| `AdminNotification` | `admin_notifications` | Operations dashboard alerts |
| `Commission` | `commissions` | Agent platform fee ledgers |
| `Settlement` | `settlements` | Platform-to-agent payout receipts |
| `SystemSetting` | `system_settings` | Global rates & configurations |

## 2. Backward Compatibility & Field Syncing
Many models contain automated pre-save hooks or virtual properties to synchronize equivalent fields:
- `Trip` model: Synchronizes `userId` to `owner` and `user` to support routes using either property.
- `Booking` model: Synchronizes `tripId` and `agentTrip` to support routes querying marketplace bookings.
- `AgentTrip` model: Synchronizes `driverId` and `driver` objects automatically.
