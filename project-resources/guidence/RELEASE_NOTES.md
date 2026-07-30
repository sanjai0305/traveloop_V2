# Release Notes — Traveloop V2 (Initial Stable Release)

Welcome to Traveloop V2! This major release upgrades the travel planning platform to support real-time collaborations and driver dispatch synchronization.

## Key Features

### 1. Driver-Passenger Boarding Sync
* Drivers can open or close the boarding window directly from the **Driver Portal**.
* Opening boarding triggers realtime socket emits that unlock boarding passes on travelers' devices.
* Scanning and check-in updates are synced instantly across traveler and agent dashboards.

### 2. Live Driver Updates
* Drivers can broadcast colored updates (Alerts, Delays, Locations) to all passenger timelines immediately.

### 3. Integrated Group Chat
* Fire-and-forget Firebase Firestore room creation connects all booked passengers with the assigned driver.

### 4. Smart Destination suggestions
* High-quality seed listings for major tourist spots are auto-added during itinerary checkout.
